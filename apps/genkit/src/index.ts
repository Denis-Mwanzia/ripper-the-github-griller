import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { defineSecret } from 'firebase-functions/params';
import { onCallGenkit } from 'firebase-functions/v2/https';
import { genkit, z } from 'genkit';

enableFirebaseTelemetry();

const githubToken = defineSecret('GITHUB_TOKEN');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

const repoSchema = z.object({
  name: z.string(),
  language: z.string().nullable(),
  pushed_at: z.string(),
  stargazers_count: z.number(),
  forks: z.number(),
});

const githubEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  repo: z.object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
  }),
  payload: z.object({
    commits: z
      .array(
        z.object({
          sha: z.string(),
          author: z.object({
            email: z.string(),
            name: z.string(),
          }),
          message: z.string(),
          distinct: z.boolean(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});

const githubEventsArraySchema = z.array(githubEventSchema);

const fetchGithubRepos = ai.defineTool(
  {
    name: 'fetchGithubRepos',
    description:
      'Fetches a list of public repositories for a given GitHub username sorted by pushed date (recently updated).',
    // Input validation using Zod
    inputSchema: z.object({ username: z.string() }),
    // Output validation using Zod
    outputSchema: z.array(repoSchema),
  },
  async ({ username }) => {
    console.log(`Fetching repos for ${username}`);
    const response = await fetch(
      // Fetch the last 15 repos sorted by pushed date
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=15`,
      {
        headers: {
          // Use the GitHub token from your .env file
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent', // GitHub requires a User-Agent
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch repos from GitHub: ${response.statusText}`,
      );
    }

    const repos = await response.json();
    const reposParsed = z.array(repoSchema).parse(repos);

    // We only care about a few properties, so we map the response
    // to match our repoSchema. This keeps the data clean.
    return reposParsed.map((repo) => ({
      name: repo.name,
      language: repo.language,
      pushed_at: repo.pushed_at,
      stargazers_count: repo.stargazers_count,
      forks: repo.forks,
    }));
  },
);

const fetchLanguageStats = ai.defineTool(
  {
    name: 'fetchLanguageStats',
    description:
      'Analyzes programming languages used across all repositories to calculate usage statistics.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      languages: z.record(z.string(), z.number()),
      totalRepos: z.number(),
      topLanguages: z.array(
        z.object({
          name: z.string(),
          count: z.number(),
          percentage: z.number(),
        }),
      ),
    }),
  },
  async ({ username }) => {
    console.log(`Analyzing language stats for ${username}`);

    // First get all repos (up to 100)
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=all`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.statusText}`);
    }

    const repos = await response.json();
    const languages: Record<string, number> = {};
    let totalRepos = 0;

    // Count languages
    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
        totalRepos++;
      }
    }

    // Calculate top languages with percentages
    const topLanguages = Object.entries(languages)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalRepos) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      languages,
      totalRepos,
      topLanguages,
    };
  },
);

const fetchStarredRepos = ai.defineTool(
  {
    name: 'fetchStarredRepos',
    description:
      'Fetches repositories that the user has starred to analyze their interests vs their own work.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      totalStarred: z.number(),
      topStarredLanguages: z.array(z.string()),
      recentStars: z.array(
        z.object({
          name: z.string(),
          language: z.string().nullable(),
          description: z.string().nullable(),
          stargazers_count: z.number(),
        }),
      ),
    }),
  },
  async ({ username }) => {
    console.log(`Fetching starred repos for ${username}`);

    const response = await fetch(
      `https://api.github.com/users/${username}/starred?per_page=20&sort=created`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch starred repos: ${response.statusText}`);
    }

    const starred = await response.json();

    const languageCount: Record<string, number> = {};
    const recentStars = starred
      .slice(0, 10)
      .map(
        (repo: {
          name: string;
          language: string | null;
          description: string | null;
          stargazers_count: number;
        }) => {
          if (repo.language) {
            languageCount[repo.language] =
              (languageCount[repo.language] || 0) + 1;
          }
          return {
            name: repo.name,
            language: repo.language,
            description: repo.description,
            stargazers_count: repo.stargazers_count,
          };
        },
      );

    const topStarredLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    return {
      totalStarred: starred.length,
      topStarredLanguages,
      recentStars,
    };
  },
);

const fetchCommitMessages = ai.defineTool(
  {
    name: 'fetchCommitMessages',
    description:
      'Fetches commit messages from the last 100 events of a GitHub user.',
    inputSchema: z.object({
      username: z.string(),
    }),
    outputSchema: z.array(z.string()),
  },
  async ({ username }) => {
    const response = await fetch(
      // https://api.github.com/users/mainawycliffe/events
      `https://api.github.com/users/${username}/events?per_page=100`, // Fetch the last 100 events
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch commit messages from GitHub: ${response.statusText}`,
      );
    }

    const commits = await response.json();
    const commitsParsed = githubEventsArraySchema.parse(commits);
    console.log({ commitsParsed });
    return (
      commitsParsed
        // Filter for PushEvent type and extract commit messages
        .filter((event) => event.type === 'PushEvent')
        .map((commit) => commit.payload.commits.map((c) => c.message))
        .flat()
    );
  },
);

const fetchGithubUserProfile = ai.defineTool(
  {
    name: 'fetchGithubUserProfile',
    description:
      'Fetches the public profile of a GitHub user including bio, followers, company, etc.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      login: z.string(),
      id: z.number(),
      avatar_url: z.string(),
      html_url: z.string(),
      name: z.string().nullable(),
      company: z.string().nullable(),
      blog: z.string().nullable(),
      location: z.string().nullable(),
      bio: z.string().nullable(),
      public_repos: z.number(),
      followers: z.number(),
      following: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  },
  async ({ username }) => {
    console.log(`Fetching profile for ${username}`);
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Genkit-Repo-Roaster-Agent',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GitHub user profile: ${response.statusText}`,
      );
    }

    const profile = await response.json();

    return {
      login: profile.login,
      id: profile.id,
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
      name: profile.name,
      company: profile.company,
      blog: profile.blog,
      location: profile.location,
      bio: profile.bio,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  },
);

const githubGrillerFlow = ai.defineFlow(
  {
    name: 'githubGrillerFlow',
    inputSchema: z.object({
      username: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ username }, streamCallack) => {
    const { response, stream } = ai.generateStream({
      prompt: `
          You are a witty, sarcastic, and expert code reviewer. Your name is "Ripper - The Roast master".
          
          Your task is to write a short, funny roast of a developer based on their public GitHub profile and activity.

          Be playful and clever, not truly mean (but also, don't hold back). Keep it short and punchy, around 3-5 sentences.

          Here's the Github Username: "${username}". 
          
          Using the provided tools, you will fetch their GitHub profile, repositories, commit messages, language statistics, and starred repositories, then roast them based on all this information.

          Roast them! Consider these angles:
          
          **Profile-based roasts:**
          - Cringe bio or lack thereof
          - Follower-to-following ratio (are they desperately following everyone?)
          - Generic or pretentious company names
          - Blog links that don't work or lead to abandoned WordPress sites
          - Account age vs activity (old account, no contributions?)
          - Location-based stereotypes (if appropriate and not offensive)
          
          **Repository-based roasts:**
          - Too many unfinished projects (look at the 'pushed_at' dates)
          - Weird or unoriginal repository names
          - A graveyard of forked repos with no original work
          - Complete lack of stars or engagement
          - Tutorial follow-alongs disguised as "projects"
          
          **Language Statistics roasts:**
          - Over-reliance on one language (e.g., "99% JavaScript - we get it, you're 'full-stack'")
          - Language choices that don't match their aspirations
          - Trendy language hopping without depth
          
          **Starred Repository roasts:**
          - Stars advanced ML/AI repos but only creates basic CRUD apps
          - Thousands of stars but zero original contributions
          - Starring pattern reveals their unrealistic ambitions vs actual skill level
          - Stars everything but contributes to nothing
          
          **Commit-based roasts:**
          - Terrible commit messages ("fixed stuff", "asdf", ".")
          - Inconsistent coding patterns
          - Too many "fix" commits in a row

          You only have one task: roast the developer based on their GitHub activity and profile information, and keep it short and punchy, around 3-5 sentences.

          Return the roast as a single string, no other text or explanation needed.
      `,
      tools: [
        fetchGithubRepos,
        fetchCommitMessages,
        fetchGithubUserProfile,
        fetchLanguageStats,
        fetchStarredRepos,
      ],
      config: {
        temperature: 0.8,
      },
    });

    for await (const chunk of stream) {
      streamCallack(chunk);
    }

    const { text } = await response;
    console.log({ text });

    return text;
  },
);

export const githubGrillerFunction = onCallGenkit(
  {
    secrets: [githubToken, geminiApiKey],
  },
  githubGrillerFlow,
);

// =============================
// BillIntel – Billing Analytics
// =============================

// Billing record schema for CSV/JSON rows
const billingRecordSchema = z.object({
  customer_id: z.string(),
  plan: z.string(),
  data_used: z.number(),
  amount_billed: z.number(),
  billing_date: z.string(), // ISO date string
});

const billingArraySchema = z.array(billingRecordSchema);

// Helper: parse CSV into records matching schema keys
function parseCsvToRecords(csv: string): Array<Record<string, string>> {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1);
  return rows
    .filter((r) => r.trim().length > 0)
    .map((row) => {
      const cols = row.split(',');
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = (cols[i] ?? '').trim();
      });
      return record;
    });
}

// Helper: coerce parsed CSV string values to billing types
function coerceRecords(records: Array<Record<string, string>>) {
  return records.map((r) => ({
    customer_id: String(r.customer_id ?? ''),
    plan: String(r.plan ?? ''),
    data_used: Number(r.data_used ?? 0),
    amount_billed: Number(r.amount_billed ?? 0),
    billing_date: String(r.billing_date ?? ''),
  }));
}

// Core stats computation (non-AI)
function computeBillingStats(data: z.infer<typeof billingArraySchema>) {
  if (data.length === 0) {
    return {
      totalRevenue: 0,
      avgBillPerCustomer: 0,
      monthlyRevenue: {} as Record<string, number>,
      customerTotals: {} as Record<string, number>,
      topCustomers: [] as Array<{ customer_id: string; total: number }>,
      planTotals: {} as Record<string, { revenue: number; usage: number }>,
    };
  }

  const monthlyRevenue: Record<string, number> = {};
  const customerTotals: Record<string, number> = {};
  const planTotals: Record<string, { revenue: number; usage: number }> = {};
  let totalRevenue = 0;

  for (const r of data) {
    totalRevenue += r.amount_billed;

    const monthKey = r.billing_date.slice(0, 7); // YYYY-MM
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + r.amount_billed;

    customerTotals[r.customer_id] = (customerTotals[r.customer_id] || 0) + r.amount_billed;

    if (!planTotals[r.plan]) planTotals[r.plan] = { revenue: 0, usage: 0 };
    planTotals[r.plan].revenue += r.amount_billed;
    planTotals[r.plan].usage += r.data_used;
  }

  const uniqueCustomers = Object.keys(customerTotals).length || 1;
  const avgBillPerCustomer = totalRevenue / uniqueCustomers;

  const topCustomers = Object.entries(customerTotals)
    .map(([customer_id, total]) => ({ customer_id, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalRevenue,
    avgBillPerCustomer,
    monthlyRevenue,
    customerTotals,
    topCustomers,
    planTotals,
  };
}

// Heuristic anomalies and health score
function detectAnomaliesAndScore(
  data: z.infer<typeof billingArraySchema>,
  stats: ReturnType<typeof computeBillingStats>,
) {
  const anomalies: Array<string> = [];

  for (const r of data) {
    if (r.data_used > 0 && r.amount_billed === 0) {
      anomalies.push(`Customer ${r.customer_id} shows usage but was billed $0 on ${r.billing_date}.`);
    }
    if (r.data_used === 0 && r.amount_billed > 0) {
      anomalies.push(`Customer ${r.customer_id} billed ${r.amount_billed} with zero usage on ${r.billing_date}.`);
    }
  }

  const monthly = Object.values(stats.monthlyRevenue);
  if (monthly.length >= 3) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    if (prev > 0 && Math.abs(last - prev) / prev > 0.35) {
      anomalies.push('Significant month-over-month revenue change detected (>35%).');
    }
  }

  const anomalyPenalty = Math.min(anomalies.length * 5, 40);
  const consistencyBonus = monthly.length >= 3 ? 10 : 0;
  const base = 85 + consistencyBonus - anomalyPenalty;
  const healthScore = Math.max(0, Math.min(100, Math.round(base)));

  return { anomalies, healthScore };
}

// BillIntel Flow
const billIntelFlow = ai.defineFlow(
  {
    name: 'billIntelFlow',
    inputSchema: z.object({
      // Either JSON array of records, or CSV string
      data_json: billingArraySchema.optional(),
      data_csv: z.string().optional(),
      period: z.enum(['adhoc', 'weekly', 'monthly']).default('adhoc'),
    }),
    outputSchema: z.object({
      stats: z.object({
        totalRevenue: z.number(),
        avgBillPerCustomer: z.number(),
        monthlyRevenue: z.record(z.string(), z.number()),
        topCustomers: z.array(z.object({ customer_id: z.string(), total: z.number() })),
        planTotals: z.record(z.string(), z.object({ revenue: z.number(), usage: z.number() })),
      }),
      anomalies: z.array(z.string()),
      healthScore: z.number(),
      insights: z.string(),
    }),
  },
  async ({ data_json, data_csv, period }) => {
    let rows: z.infer<typeof billingArraySchema> = [];

    if (data_json && data_json.length) {
      rows = billingArraySchema.parse(data_json);
    } else if (data_csv && data_csv.trim().length > 0) {
      const parsed = coerceRecords(parseCsvToRecords(data_csv));
      rows = billingArraySchema.parse(parsed);
    }

    const stats = computeBillingStats(rows);
    const { anomalies, healthScore } = detectAnomaliesAndScore(rows, stats);

    const { text } = await ai.generate({
      prompt: `
You are BillIntel, an AI billing analyst for ISPs.
Summarize the dataset with:
- Total revenue
- Average bill per customer
- Monthly trends (brief)
- Top paying customers (up to 5)
- Low-margin plans (high usage, low revenue)
- Bullet a few anomalies if any
Provide a concise narrative (120-200 words). Period: ${period}.

DATA (JSON): ${JSON.stringify({
  totalRevenue: stats.totalRevenue,
  avgBillPerCustomer: stats.avgBillPerCustomer,
  monthlyRevenue: stats.monthlyRevenue,
  topCustomers: stats.topCustomers,
  planTotals: stats.planTotals,
  anomalies,
  healthScore,
})}
`,
      config: { temperature: 0.4 },
    });

    return {
      stats: {
        totalRevenue: stats.totalRevenue,
        avgBillPerCustomer: stats.avgBillPerCustomer,
        monthlyRevenue: stats.monthlyRevenue,
        topCustomers: stats.topCustomers,
        planTotals: stats.planTotals,
      },
      anomalies,
      healthScore,
      insights: text,
    };
  },
);

export const billIntelAnalyzeFunction = onCallGenkit(
  { secrets: [geminiApiKey] },
  billIntelFlow,
);
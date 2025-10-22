import { onCall, onRequest } from 'firebase-functions/v2/https';
import { https } from 'firebase-functions/v1';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Simplified BillIntel flow for emulator testing
const billingRecordSchema = z.object({
  customer_id: z.string(),
  plan: z.string(),
  data_used: z.number(),
  amount_billed: z.number(),
  billing_date: z.string(),
});

// Helper function to parse CSV data
function parseCsvToRecords(csvData: string): any[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'data_used' || header === 'amount_billed') {
        record[header] = parseFloat(value) || 0;
      } else {
        record[header] = value;
      }
    });
    return record;
  });
}

// Helper function to coerce data types
function coerceRecords(records: any[]): any[] {
  return records.map((record) => ({
    customer_id: String(record.customer_id),
    plan: String(record.plan),
    data_used: Number(record.data_used) || 0,
    amount_billed: Number(record.amount_billed) || 0,
    billing_date: String(record.billing_date),
  }));
}

// Helper function to compute billing statistics
function computeBillingStats(records: any[]) {
  const totalRevenue = records.reduce(
    (sum, record) => sum + record.amount_billed,
    0,
  );
  const avgBillPerCustomer = totalRevenue / records.length;

  // Group by month for monthly revenue
  const monthlyRevenue: Record<string, number> = {};
  records.forEach((record) => {
    const date = new Date(record.billing_date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + record.amount_billed;
  });

  // Top customers
  const customerTotals: Record<string, number> = {};
  records.forEach((record) => {
    customerTotals[record.customer_id] =
      (customerTotals[record.customer_id] || 0) + record.amount_billed;
  });

  const topCustomers = Object.entries(customerTotals)
    .map(([customer_id, total]) => ({ customer_id, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Plan totals
  const planTotals: Record<string, { revenue: number; usage: number }> = {};
  records.forEach((record) => {
    if (!planTotals[record.plan]) {
      planTotals[record.plan] = { revenue: 0, usage: 0 };
    }
    planTotals[record.plan].revenue += record.amount_billed;
    planTotals[record.plan].usage += record.data_used;
  });

  return {
    totalRevenue,
    avgBillPerCustomer,
    monthlyRevenue,
    topCustomers,
    planTotals,
  };
}

// Helper function to detect anomalies and calculate health score
function detectAnomaliesAndScore(records: any[], stats: any) {
  const anomalies: string[] = [];
  let healthScore = 100;

  // Check for billing anomalies
  records.forEach((record, index) => {
    const expectedBill = record.data_used * 0.5; // Assume $0.5 per GB
    const billDifference = Math.abs(record.amount_billed - expectedBill);

    if (billDifference > expectedBill * 0.2) {
      // 20% threshold
      anomalies.push(
        `Customer ${record.customer_id} has unusual billing: KSH${record.amount_billed} for ${record.data_used}GB`,
      );
      healthScore -= 5;
    }
  });

  // Check for missing data
  const requiredFields = [
    'customer_id',
    'plan',
    'data_used',
    'amount_billed',
    'billing_date',
  ];
  records.forEach((record, index) => {
    requiredFields.forEach((field) => {
      if (!record[field] || record[field] === '') {
        anomalies.push(`Record ${index + 1} missing ${field}`);
        healthScore -= 2;
      }
    });
  });

  // Check for negative values
  records.forEach((record, index) => {
    if (record.amount_billed < 0 || record.data_used < 0) {
      anomalies.push(`Record ${index + 1} has negative values`);
      healthScore -= 10;
    }
  });

  return { anomalies, healthScore: Math.max(0, healthScore) };
}

// Main analysis function
async function analyzeBillingData({
  csv_data,
  json_data,
}: {
  csv_data?: string;
  json_data?: any[];
}) {
  let records: any[] = [];

  if (csv_data) {
    const parsedRecords = parseCsvToRecords(csv_data);
    records = coerceRecords(parsedRecords);
  } else if (json_data) {
    records = coerceRecords(json_data);
  } else {
    throw new Error('No data provided');
  }

  // Generate session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Compute statistics
  const stats = computeBillingStats(records);

  // Detect anomalies and calculate health score
  const { anomalies, healthScore } = detectAnomaliesAndScore(records, stats);

  // Generate insights (simplified for production)
  const insights = `BillIntel Analysis Complete

📊 REVENUE INSIGHTS:
• Total Revenue: KSH${stats.totalRevenue.toFixed(2)}
• Average Bill per Customer: KSH${stats.avgBillPerCustomer.toFixed(2)}
• Records Processed: ${records.length}

🎯 HEALTH SCORE: ${healthScore}/100
${healthScore >= 80 ? '✅ Excellent billing health' : healthScore >= 60 ? '⚠️ Good with room for improvement' : '❌ Needs attention'}

${anomalies.length > 0 ? `⚠️ ${anomalies.length} anomalies detected` : '✅ No anomalies detected'}

💡 RECOMMENDATIONS:
• Monitor billing accuracy regularly
• Analyze customer usage patterns
• Review plan performance metrics`;

  return {
    session_id: sessionId,
    stats,
    anomalies,
    healthScore,
    insights,
  };
}

// Helper function to save analysis to Firestore
async function saveAnalysisToFirestore(
  userId: string,
  sessionId: string,
  analysisData: any,
) {
  try {
    const analysisRef = db.collection('analysis_results').doc(sessionId);
    await analysisRef.set({
      userId,
      sessionId,
      ...analysisData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true, id: sessionId };
  } catch (error) {
    console.error('Error saving analysis to Firestore:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to save billing records to Firestore
async function saveBillingRecordsToFirestore(userId: string, records: any[]) {
  try {
    const batch = db.batch();
    const recordsRef = db.collection('billing_records');

    records.forEach((record) => {
      const docRef = recordsRef.doc();
      batch.set(docRef, {
        userId,
        ...record,
        createdAt: new Date(),
      });
    });

    await batch.commit();
    return { success: true, count: records.length };
  } catch (error) {
    console.error('Error saving billing records to Firestore:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get user analyses from Firestore
async function getUserAnalysesFromFirestore(
  userId: string,
  limit: number = 20,
) {
  try {
    const analysesRef = db
      .collection('analysis_results')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await analysesRef.get();
    const analyses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: analyses };
  } catch (error) {
    console.error('Error getting user analyses from Firestore:', error);
    // Return empty data instead of failing
    return { success: true, data: [], error: 'Firestore not available' };
  }
}

// Export the main analysis function
export const billIntelAnalyzeFunction = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    console.log('BillIntel analysis function called with data:', request.data);

    try {
      const { csv_data, json_data, userId } = request.data;
      const result = await analyzeBillingData({ csv_data, json_data });

      // Save to Firestore if userId is provided
      if (userId) {
        await saveAnalysisToFirestore(userId, result.session_id, result);
      }

      console.log('Analysis completed successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in analysis function:', error);
      throw error;
    }
  },
);

// Export function to get user analyses
export const getUserAnalyses = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { userId, limit = 20 } = request.data;
    return await getUserAnalysesFromFirestore(userId, limit);
  },
);

// Export function to save billing records
export const saveBillingRecords = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { userId, records } = request.data;
    return await saveBillingRecordsToFirestore(userId, records);
  },
);

// Export function to get user dashboard data
export const getUserDashboard = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { userId } = request.data;

    try {
      // Get user's analyses
      const analysesResult = await getUserAnalysesFromFirestore(userId, 50);

      // Handle case where Firestore is not available
      if (
        !analysesResult.success &&
        analysesResult.error === 'Firestore not available'
      ) {
        return {
          success: true,
          data: {
            total_analyses: 0,
            total_revenue_analyzed: 0,
            recent_analyses: [],
            message: 'No historical data available (Firestore not connected)',
          },
        };
      }

      if (!analysesResult.success) {
        throw new Error(analysesResult.error);
      }

      const analyses = analysesResult.data;
      const totalAnalyses = analyses.length;
      let totalRevenue = 0;
      for (const analysis of analyses) {
        totalRevenue += analysis.stats?.totalRevenue || 0;
      }

      return {
        success: true,
        data: {
          total_analyses: totalAnalyses,
          total_revenue_analyzed: totalRevenue,
          recent_analyses: analyses.slice(0, 5),
        },
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      return {
        success: true,
        data: {
          total_analyses: 0,
          total_revenue_analyzed: 0,
          recent_analyses: [],
          message: 'Dashboard data not available',
        },
      };
    }
  },
);

// Export HTTP function for direct requests using v1
export const billIntelAnalyzeHTTP = https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    console.log('HTTP function called with body:', req.body);
    const { csv_data, json_data, userId } = req.body;
    const result = await analyzeBillingData({ csv_data, json_data });

    // Save to Firestore if userId is provided
    if (userId) {
      await saveAnalysisToFirestore(userId, result.session_id, result);
    }

    console.log('HTTP function returning result:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('HTTP function error:', error);
    res.status(500).json({ error: error.message });
  }
});

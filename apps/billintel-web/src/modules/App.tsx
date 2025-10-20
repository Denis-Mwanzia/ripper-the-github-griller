import React, { useMemo, useState } from 'react'

function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result ?? ''))
		reader.onerror = (e) => reject(e)
		reader.readAsText(file)
	})
}

export const App: React.FC = () => {
	const [file, setFile] = useState<File | null>(null)
	const [csvText, setCsvText] = useState<string>('')
	const [jsonText, setJsonText] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<any>(null)
	const [error, setError] = useState<string>('')

	const hasInput = useMemo(() => !!file || !!csvText || !!jsonText, [file, csvText, jsonText])

	async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0]
		if (!f) return
		setFile(f)
		setError('')
	}

	async function analyze() {
		try {
			setLoading(true)
			setError('')

			let payload: any = { period: 'adhoc' }
			if (file) {
				const text = await readFileAsText(file)
				if (file.name.endsWith('.csv')) payload.data_csv = text
				else payload.data_json = JSON.parse(text)
			} else if (csvText.trim()) {
				payload.data_csv = csvText
			} else if (jsonText.trim()) {
				payload.data_json = JSON.parse(jsonText)
			}

			// Firebase callable functions expect { data: ... } and return { result: ... }
			const res = await fetch('/api/billintel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: payload }),
			})
			if (!res.ok) throw new Error(`Request failed: ${res.status}`)
			const wrapped = await res.json()
			const data = wrapped?.result ?? wrapped
			setResult(data)
		} catch (e: any) {
			setError(e?.message ?? 'Failed to analyze')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 text-gray-900">
			<header className="border-b bg-white">
				<div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
					<h1 className="text-xl font-semibold">BillIntel</h1>
					<p className="text-sm text-gray-600">Smarter Billing. Faster Insights. Powered by AI.</p>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
				<section className="grid md:grid-cols-2 gap-6">
					<div className="bg-white border rounded-lg p-4 space-y-4">
						<h2 className="font-medium">Billing Data Input</h2>
						<label htmlFor="billing-file" className="text-sm font-medium">Upload CSV or JSON</label>
						<input id="billing-file" title="Upload billing CSV or JSON" type="file" accept=".csv,.json" onChange={onFileChange} className="block w-full" />
						<div>
							<label className="text-sm font-medium">Or paste CSV</label>
							<textarea className="mt-1 w-full h-28 border rounded p-2 font-mono text-sm" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="customer_id,plan,data_used,amount_billed,billing_date" />
						</div>
						<div>
							<label className="text-sm font-medium">Or paste JSON array</label>
							<textarea className="mt-1 w-full h-28 border rounded p-2 font-mono text-sm" value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='[{"customer_id":"C001","plan":"Basic","data_used":45,"amount_billed":25,"billing_date":"2025-07-01"}]' />
						</div>
						<button disabled={!hasInput || loading} onClick={analyze} className="inline-flex items-center gap-2 rounded bg-black text-white px-4 py-2 disabled:opacity-50">
							{loading ? 'Analyzing…' : 'Analyze'}
						</button>
						{error && <p className="text-sm text-red-600">{error}</p>}
					</div>
					<div className="bg-white border rounded-lg p-4">
						<h2 className="font-medium mb-2">Insights</h2>
						{result ? (
							<div className="space-y-3">
								<p className="whitespace-pre-line">{result.insights}</p>
								<div className="text-sm grid grid-cols-2 gap-3">
									<div className="p-3 bg-gray-50 rounded">
										<div className="text-gray-600">Total Revenue</div>
										<div className="text-lg font-semibold">${result.stats.totalRevenue.toFixed(2)}</div>
									</div>
									<div className="p-3 bg-gray-50 rounded">
										<div className="text-gray-600">Avg Bill / Customer</div>
										<div className="text-lg font-semibold">${result.stats.avgBillPerCustomer.toFixed(2)}</div>
									</div>
									<div className="p-3 bg-gray-50 rounded col-span-2">
										<div className="text-gray-600 mb-1">Bill Health Score</div>
										<div className="text-xl font-semibold">{result.healthScore} / 100</div>
									</div>
								</div>
								<div>
									<h3 className="font-medium">Top Customers</h3>
									<ul className="text-sm list-disc pl-5">
										{result.stats.topCustomers.map((c: any) => (
											<li key={c.customer_id}>{c.customer_id}: ${c.total.toFixed(2)}</li>
										))}
									</ul>
								</div>
								{result.anomalies?.length > 0 && (
									<div>
										<h3 className="font-medium">Anomalies</h3>
										<ul className="text-sm list-disc pl-5 text-red-700">
											{result.anomalies.map((a: string, i: number) => (
												<li key={i}>{a}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						) : (
							<p className="text-sm text-gray-600">Upload data and click Analyze to see AI insights.</p>
						)}
					</div>
				</section>
				<section className="bg-white border rounded-lg p-4">
					<h2 className="font-medium mb-2">Historical Analyses</h2>
					<p className="text-sm text-gray-600">Coming soon: compare saved runs to track trends over time.</p>
				</section>
			</main>
			<footer className="border-t bg-white">
				<div className="mx-auto max-w-5xl px-4 py-4 text-sm text-gray-600">MIT Licensed. © BillIntel</div>
			</footer>
		</div>
	)
}

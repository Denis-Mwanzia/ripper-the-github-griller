import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Users,
  Target,
  Activity,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  User,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Header } from '../components/Header';
import { FileUpload } from '../components/FileUpload';
import { AnalyzeButton } from '../components/AnalyzeButton';
import { MetricCard } from '../components/MetricCard';
import { ChartCard } from '../components/ChartCard';
import { InsightsCard } from '../components/InsightsCard';
import { HistoricalAnalysis } from '../components/HistoricalAnalysis';
import { UserDashboard } from '../components/UserDashboard';
import { AuthModal } from '../components/AuthModal';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { UserDataService } from '../services/userDataFirebase';
import { formatCurrency } from '../utils/currency';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

export const App: React.FC = () => {
  const { user, signOut } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'upload' | 'insights' | 'history' | 'dashboard'
  >('upload');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const hasInput = useMemo(() => !!file, [file]);

  const analyze = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let payload: any = {};
      if (file) {
        const text = await readFileAsText(file);
        if (file.name.endsWith('.csv')) payload.csv_data = text;
        else payload.json_data = JSON.parse(text);
      }

      // Add userId if user is authenticated
      if (user?.id) {
        payload.userId = user.id;
      }

      const res = await fetch(
        'http://localhost:5001/gen-lang-client-0921236969/us-central1/billIntelAnalyzeFunction',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload }),
        },
      );

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const wrapped = await res.json();
      const data = wrapped?.result ?? wrapped;
      // Analysis completed successfully
      setResult(data);
      setActiveTab('insights');

      // Analysis is automatically saved to Firestore by the backend function
      if (user && data) {
        // Analysis completed and saved to Firestore
      }
    } catch (e: any) {
      console.error('Analysis error:', e);

      if (e.message?.includes('Failed to fetch')) {
        setError(
          'Unable to connect to the analysis service. Please check your internet connection and try again.',
        );
      } else if (e.message?.includes('404')) {
        setError(
          'Analysis service not found. Please ensure the backend is running.',
        );
      } else if (e.message?.includes('500')) {
        setError(
          'Analysis service error. Please try again or contact support if the issue persists.',
        );
      } else if (e.message?.includes('JSON')) {
        setError('Invalid JSON format. Please check your data and try again.');
      } else {
        setError(e?.message ?? 'Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [file]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      return;
    }

    if (!f.name.endsWith('.csv') && !f.name.endsWith('.json')) {
      setError('Please upload a CSV or JSON file');
      e.target.value = '';
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      // 10MB
      setError('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    // File accepted
    setFile(f);
    setError('');
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;

    if (!f.name.endsWith('.csv') && !f.name.endsWith('.json')) {
      setError('Please upload a CSV or JSON file');
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      // 10MB
      setError('File size must be less than 10MB');
      return;
    }
    setFile(f);
    setError('');
  }, []);

  // Historical comparison function
  const handleHistoricalCompare = useCallback(async (sessionIds: string[]) => {
    try {
      setLoading(true);
      setError('');

      // Mock comparison result for demo purposes
      const mockComparisonResult = {
        comparisons: [
          {
            session_id: 'session_1',
            period: 'monthly',
            total_revenue: 12500,
            health_score: 85,
            anomalies_count: 3,
            created_at: '2025-01-15T10:30:00Z',
          },
          {
            session_id: 'session_2',
            period: 'weekly',
            total_revenue: 11800,
            health_score: 78,
            anomalies_count: 5,
            created_at: '2025-01-22T14:15:00Z',
          },
        ],
        trends: {
          revenue_trend: 'increasing',
          health_trend: 'declining',
          anomaly_trend: 'increasing',
        },
        insights:
          'Based on the comparison of your historical analyses, we can see that while revenue has been increasing (+Ksh 700 from weekly to monthly), the health score has declined from 85 to 78, indicating potential billing inconsistencies. The anomaly count has increased from 3 to 5, suggesting the need for immediate attention to billing processes. We recommend reviewing the billing validation rules and implementing automated checks to improve the health score.',
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Handle the comparison result
      // Historical comparison completed

      // You could store this result in state if needed
      // setComparisonResult(mockComparisonResult);
    } catch (e: any) {
      console.error('Historical comparison error:', e);
      setError('Failed to compare historical analyses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const chartData = useMemo(() => {
    if (!result?.stats) return null;

    const monthlyData = Object.entries(result.stats.monthlyRevenue || {}).map(
      ([month, revenue]) => ({
        month,
        revenue: Number(revenue),
      }),
    );

    const planData = Object.entries(result.stats.planTotals || {}).map(
      ([plan, data]: [string, any]) => ({
        plan,
        revenue: data.revenue,
        usage: data.usage,
      }),
    );

    return { monthlyData, planData };
  }, [result]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setActiveTab('upload');
      setResult(null);
      setFile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [signOut]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 bg-pattern"></div>

      <Header
        hasResult={!!result}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
                  Transform Your
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block sm:inline">
                    {' '}
                    Billing Data
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Upload your billing data and get instant AI-powered insights,
                  anomaly detection, and comprehensive analytics that drive
                  business decisions.
                </p>
              </motion.div>

              {/* Upload Section */}
              <FileUpload
                file={file}
                error={error}
                onFileChange={onFileChange}
                onDrop={onDrop}
              />

              {/* Analyze Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <AnalyzeButton
                  hasInput={hasInput}
                  loading={loading}
                  onAnalyze={analyze}
                />
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {result ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      icon={DollarSign}
                      title="Total Revenue"
                      value={formatCurrency(result.stats.totalRevenue)}
                      color="text-emerald-600"
                      bgColor="bg-gradient-to-br from-emerald-100 to-green-100"
                      delay={0.1}
                    />
                    <MetricCard
                      icon={Users}
                      title="Average Bill"
                      value={formatCurrency(result.stats.avgBillPerCustomer)}
                      color="text-blue-600"
                      bgColor="bg-gradient-to-br from-blue-100 to-cyan-100"
                      delay={0.2}
                    />
                    <MetricCard
                      icon={Target}
                      title="Health Score"
                      value={`${result.healthScore}/100`}
                      color="text-purple-600"
                      bgColor="bg-gradient-to-br from-purple-100 to-pink-100"
                      delay={0.3}
                    />
                    <MetricCard
                      icon={Activity}
                      title="Anomalies"
                      value={`${result.anomalies?.length || 0}`}
                      color="text-orange-600"
                      bgColor="bg-gradient-to-br from-orange-100 to-red-100"
                      delay={0.4}
                    />
                  </div>

                  {/* Charts */}
                  {chartData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {chartData.monthlyData.length > 0 && (
                        <ChartCard
                          title="Revenue Trend"
                          icon={TrendingUp}
                          delay={0.5}
                        >
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData.monthlyData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                              />
                              <XAxis dataKey="month" stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '12px',
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                fill="url(#colorGradient)"
                                strokeWidth={3}
                              />
                              <defs>
                                <linearGradient
                                  id="colorGradient"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.1}
                                  />
                                </linearGradient>
                              </defs>
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      )}

                      {chartData.planData.length > 0 && (
                        <ChartCard
                          title="Plan Performance"
                          icon={BarChart3}
                          delay={0.6}
                        >
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.planData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                              />
                              <XAxis dataKey="plan" stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '12px',
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                }}
                              />
                              <Bar
                                dataKey="revenue"
                                fill="url(#barGradient)"
                                radius={[4, 4, 0, 0]}
                              />
                              <defs>
                                <linearGradient
                                  id="barGradient"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#8b5cf6"
                                    stopOpacity={0.8}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#8b5cf6"
                                    stopOpacity={0.6}
                                  />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      )}
                    </div>
                  )}

                  {/* AI Insights */}
                  <InsightsCard insights={result.insights} />

                  {/* Top Customers & Anomalies */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Customers */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
                    >
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Top Customers
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {result.stats.topCustomers.map(
                          (customer: any, index: number) => (
                            <motion.div
                              key={customer.customer_id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9 + index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-sm font-bold text-blue-600">
                                    #{index + 1}
                                  </span>
                                </div>
                                <span className="font-semibold text-gray-900 text-lg">
                                  {customer.customer_id}
                                </span>
                              </div>
                              <span className="font-bold text-gray-900 text-lg">
                                {formatCurrency(customer.total)}
                              </span>
                            </motion.div>
                          ),
                        )}
                      </div>
                    </motion.div>

                    {/* Anomalies */}
                    {result.anomalies?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
                      >
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Billing Anomalies
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {result.anomalies.map(
                            (anomaly: string, index: number) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.0 + index * 0.1 }}
                                className="flex items-start space-x-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-200 hover:shadow-lg transition-all duration-300"
                              >
                                <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-red-700 font-medium">
                                  {anomaly}
                                </span>
                              </motion.div>
                            ),
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <BarChart3 className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    No Analysis Yet
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Upload your billing data to get AI-powered insights
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('upload')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg"
                  >
                    Upload Data
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && user && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <HistoricalAnalysis
                onCompare={handleHistoricalCompare}
                loading={loading}
                userId={user?.id}
              />
            </motion.div>
          )}

          {activeTab === 'history' && !user && (
            <motion.div
              key="history-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-20"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <User className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Sign In Required
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Please sign in to view your analysis history
              </p>
            </motion.div>
          )}

          {activeTab === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <UserDashboard userId={user?.id} />
            </motion.div>
          )}

          {activeTab === 'dashboard' && !user && (
            <motion.div
              key="dashboard-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-20"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <User className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Sign In Required
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Please sign in to view your personal dashboard and analysis
                history
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg"
              >
                Sign In
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <Footer />
    </div>
  );
};

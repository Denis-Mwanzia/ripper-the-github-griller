import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { UserDataServiceLocal } from '../services/userDataLocal';
import { formatCurrency } from '../utils/currency';

interface HistoricalAnalysisProps {
  onCompare: (sessionIds: string[]) => void;
  loading: boolean;
  userId?: string;
}

interface AnalysisHistory {
  session_id: string;
  period: string;
  total_revenue: number;
  health_score: number;
  anomalies_count: number;
  created_at: string;
}

interface ComparisonResult {
  comparisons: AnalysisHistory[];
  trends: {
    revenue_trend: string;
    health_trend: string;
    anomaly_trend: string;
  };
  insights: string;
}

export const HistoricalAnalysis: React.FC<HistoricalAnalysisProps> = ({
  onCompare,
  loading,
  userId,
}) => {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  // Load analysis history from Supabase
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        setHistoryLoading(false);
        return;
      }

      try {
        setHistoryLoading(true);
        const { data, error } = await UserDataServiceLocal.getUserAnalyses(
          userId,
          20,
        );

        if (error) {
          setHistoryError(error);
        } else if (data) {
          // Transform the data to match the expected format
          const transformedHistory: AnalysisHistory[] = data.map(
            (analysis: any) => ({
              session_id: analysis.session_id,
              period: 'adhoc', // Default period for user analyses
              total_revenue: analysis.stats?.totalRevenue || 0,
              health_score: analysis.healthScore || 0,
              anomalies_count: analysis.anomalies?.length || 0,
              created_at: analysis.createdAt?.toDate?.() || new Date(),
            }),
          );
          setHistory(transformedHistory);
        }
      } catch (err: any) {
        setHistoryError(err.message);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId],
    );
  };

  const handleCompare = async () => {
    if (selectedSessions.length >= 2) {
      await onCompare(selectedSessions);
      setShowComparison(true);

      // Get selected analyses for comparison
      const selectedAnalyses = history.filter((h) =>
        selectedSessions.includes(h.session_id),
      );

      // Calculate trends
      const revenues = selectedAnalyses.map((a) => a.total_revenue);
      const healthScores = selectedAnalyses.map((a) => a.health_score);
      const anomalies = selectedAnalyses.map((a) => a.anomalies_count);

      const revenueTrend =
        revenues.length > 1 && revenues[0] > revenues[revenues.length - 1]
          ? 'increasing'
          : 'declining';
      const healthTrend =
        healthScores.length > 1 &&
        healthScores[0] > healthScores[healthScores.length - 1]
          ? 'declining'
          : 'improving';
      const anomalyTrend =
        anomalies.length > 1 && anomalies[0] < anomalies[anomalies.length - 1]
          ? 'increasing'
          : 'decreasing';

      // Generate insights based on real data
      const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
      const avgHealthScore =
        healthScores.reduce((sum, score) => sum + score, 0) /
        healthScores.length;
      const totalAnomalies = anomalies.reduce((sum, count) => sum + count, 0);

      const insights = `Based on your ${selectedAnalyses.length} analyses, your total revenue is ${formatCurrency(totalRevenue)} with an average health score of ${Math.round(avgHealthScore)}/100. The ${revenueTrend} revenue trend and ${healthTrend} health trend suggest ${anomalyTrend} billing issues. Total anomalies detected: ${totalAnomalies}.`;

      const comparisonResult: ComparisonResult = {
        comparisons: selectedAnalyses,
        trends: {
          revenue_trend: revenueTrend,
          health_trend: healthTrend,
          anomaly_trend: anomalyTrend,
        },
        insights,
      };

      setComparisonResult(comparisonResult);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return 'text-green-600';
      case 'decreasing':
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">
          Error loading history: {historyError}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center py-20">
        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
          <History className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          Sign In Required
        </h3>
        <p className="text-gray-600 mb-8 text-lg">
          Please sign in to view your analysis history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Analysis History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Analysis History</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((analysis, index) => (
            <motion.div
              key={analysis.session_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                selectedSessions.includes(analysis.session_id)
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => handleSessionToggle(analysis.session_id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  {analysis.period.charAt(0).toUpperCase() +
                    analysis.period.slice(1)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(analysis.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(analysis.total_revenue)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Health Score:</span>
                  <span
                    className={`font-semibold ${
                      analysis.health_score >= 80
                        ? 'text-green-600'
                        : analysis.health_score >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {analysis.health_score}/100
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Anomalies:</span>
                  <span className="font-semibold text-gray-900">
                    {analysis.anomalies_count}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedSessions.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompare}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Comparing...'
                : `Compare ${selectedSessions.length} Analyses`}
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Comparison Results */}
      {showComparison && comparisonResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 shadow-xl border border-blue-200/50"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Historical Comparison
            </h3>
          </div>

          {/* Trends */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                {getTrendIcon(comparisonResult.trends.revenue_trend)}
                <h4 className="font-semibold text-gray-900">Revenue Trend</h4>
              </div>
              <p
                className={`text-lg font-bold ${getTrendColor(comparisonResult.trends.revenue_trend)}`}
              >
                {comparisonResult.trends.revenue_trend.charAt(0).toUpperCase() +
                  comparisonResult.trends.revenue_trend.slice(1)}
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                {getTrendIcon(comparisonResult.trends.health_trend)}
                <h4 className="font-semibold text-gray-900">Health Trend</h4>
              </div>
              <p
                className={`text-lg font-bold ${getTrendColor(comparisonResult.trends.health_trend)}`}
              >
                {comparisonResult.trends.health_trend.charAt(0).toUpperCase() +
                  comparisonResult.trends.health_trend.slice(1)}
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                {getTrendIcon(comparisonResult.trends.anomaly_trend)}
                <h4 className="font-semibold text-gray-900">Anomaly Trend</h4>
              </div>
              <p
                className={`text-lg font-bold ${getTrendColor(comparisonResult.trends.anomaly_trend)}`}
              >
                {comparisonResult.trends.anomaly_trend.charAt(0).toUpperCase() +
                  comparisonResult.trends.anomaly_trend.slice(1)}
              </p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>AI Analysis Insights</span>
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {comparisonResult.insights}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

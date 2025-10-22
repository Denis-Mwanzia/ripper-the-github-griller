import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Activity,
} from 'lucide-react';
import { UserDataService } from '../services/userDataFirebase';
import { UserDashboard as UserDashboardType } from '../services/userDataFirebase';
import { formatCurrency } from '../utils/currency';

interface UserDashboardProps {
  userId: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ userId }) => {
  const [dashboard, setDashboard] = useState<UserDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const { data, error } = await UserDataService.getUserDashboard(userId);

        if (error) {
          setError(error);
        } else {
          setDashboard(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-600">No dashboard data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-600">
              Here's your billing analysis overview
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.total_analyses}
              </p>
              <p className="text-sm text-gray-600">Total Analyses</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard.total_revenue_analyzed)}
              </p>
              <p className="text-sm text-gray-600">Revenue Analyzed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.recent_analyses.length > 0
                  ? Math.round(
                      dashboard.recent_analyses.reduce(
                        (sum, analysis) => sum + analysis.healthScore,
                        0,
                      ) / dashboard.recent_analyses.length,
                    )
                  : 0}
                /100
              </p>
              <p className="text-sm text-gray-600">Avg Health Score</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.recent_analyses.length > 0
                  ? (() => {
                      try {
                        const dateValue =
                          dashboard.recent_analyses[0].createdAt;
                        let date;

                        if (dateValue?.toDate) {
                          // Firestore Timestamp
                          date = dateValue.toDate();
                        } else if (dateValue?.seconds) {
                          // Firestore Timestamp object
                          date = new Date(dateValue.seconds * 1000);
                        } else if (typeof dateValue === 'string') {
                          // String date
                          date = new Date(dateValue);
                        } else if (dateValue instanceof Date) {
                          // Already a Date object
                          date = dateValue;
                        } else {
                          // Fallback to current date
                          date = new Date();
                        }

                        return date.toLocaleDateString();
                      } catch (error) {
                        console.error('Date parsing error:', error);
                        return 'Recent';
                      }
                    })()
                  : 'Never'}
              </p>
              <p className="text-sm text-gray-600">Last Analysis</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Analyses */}
      {dashboard.recent_analyses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Recent Analyses</h3>
          </div>

          <div className="space-y-4">
            {dashboard.recent_analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Analysis {analysis.session_id.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        try {
                          const dateValue = analysis.createdAt;
                          let date;

                          if (dateValue?.toDate) {
                            // Firestore Timestamp
                            date = dateValue.toDate();
                          } else if (dateValue?.seconds) {
                            // Firestore Timestamp object
                            date = new Date(dateValue.seconds * 1000);
                          } else if (typeof dateValue === 'string') {
                            // String date
                            date = new Date(dateValue);
                          } else if (dateValue instanceof Date) {
                            // Already a Date object
                            date = dateValue;
                          } else {
                            // Fallback to current date
                            date = new Date();
                          }

                          return date.toLocaleDateString();
                        } catch (error) {
                          console.error('Date parsing error:', error);
                          return 'Recent';
                        }
                      })()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(analysis.stats.totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {analysis.healthScore}/100 Health
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {dashboard.total_analyses === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <BarChart3 className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            No Analyses Yet
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            Upload your first billing data to get started with AI-powered
            insights
          </p>
        </motion.div>
      )}
    </div>
  );
};

import { AnalysisResult, UserDashboard } from './userDataFirebase';

// Local version of AnalysisResult that uses Date instead of Timestamp
interface LocalAnalysisResult {
  id: string;
  session_id: string;
  userId: string;
  stats: {
    totalRevenue: number;
    avgBillPerCustomer: number;
    monthlyRevenue: Record<string, number>;
    topCustomers: Array<{ customer_id: string; total: number }>;
    planTotals: Record<string, { revenue: number; usage: number }>;
  };
  anomalies: string[];
  healthScore: number;
  insights: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserDataServiceLocal {
  private static STORAGE_KEY = 'billintel_analyses';
  private static USER_KEY = 'billintel_user';

  // Get user analyses from localStorage
  static async getUserAnalyses(userId: string, limitCount: number = 20) {
    try {
      const analyses = this.getStoredAnalyses(userId);
      const limitedAnalyses = analyses.slice(0, limitCount);
      // Convert to AnalysisResult format for compatibility
      const convertedAnalyses: AnalysisResult[] = limitedAnalyses.map(
        (analysis) => ({
          ...analysis,
          createdAt: analysis.createdAt as any, // Convert Date to Timestamp-like object
          updatedAt: analysis.updatedAt as any,
        }),
      );
      return { data: convertedAnalyses, error: null };
    } catch (error: any) {
      console.error('Error getting user analyses:', error);
      return { data: null, error: error.message };
    }
  }

  // Get user dashboard data from localStorage
  static async getUserDashboard(userId: string) {
    try {
      const analyses = this.getStoredAnalyses(userId);
      const totalAnalyses = analyses.length;
      const totalRevenue = analyses.reduce(
        (sum, analysis) => sum + (analysis.stats?.totalRevenue || 0),
        0,
      );
      const recentAnalyses = analyses.slice(0, 5);

      // Convert to AnalysisResult format for compatibility
      const convertedRecentAnalyses: AnalysisResult[] = recentAnalyses.map(
        (analysis) => ({
          ...analysis,
          createdAt: analysis.createdAt as any, // Convert Date to Timestamp-like object
          updatedAt: analysis.updatedAt as any,
        }),
      );

      const dashboard: UserDashboard = {
        total_analyses: totalAnalyses,
        total_revenue_analyzed: totalRevenue,
        recent_analyses: convertedRecentAnalyses,
      };

      return { data: dashboard, error: null };
    } catch (error: any) {
      console.error('Error getting user dashboard:', error);
      return { data: null, error: error.message };
    }
  }

  // Save analysis to localStorage
  static saveAnalysis(userId: string, analysis: any) {
    try {
      const analyses = this.getStoredAnalyses(userId);
      const newAnalysis: LocalAnalysisResult = {
        id: analysis.session_id,
        session_id: analysis.session_id,
        userId,
        stats: analysis.stats,
        anomalies: analysis.anomalies || [],
        healthScore: analysis.healthScore,
        insights: analysis.insights,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      analyses.unshift(newAnalysis); // Add to beginning
      this.setStoredAnalyses(userId, analyses);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error saving analysis:', error);
      return { success: false, error: error.message };
    }
  }

  // Get stored analyses for a user
  private static getStoredAnalyses(userId: string): LocalAnalysisResult[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (stored) {
        const analyses = JSON.parse(stored);
        // Convert date strings back to Date objects
        return analyses.map((analysis: any) => ({
          ...analysis,
          createdAt: new Date(analysis.createdAt),
          updatedAt: new Date(analysis.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error parsing stored analyses:', error);
      return [];
    }
  }

  // Set stored analyses for a user
  private static setStoredAnalyses(
    userId: string,
    analyses: LocalAnalysisResult[],
  ) {
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(analyses),
      );
    } catch (error) {
      console.error('Error storing analyses:', error);
    }
  }

  // Clear all data for a user
  static clearUserData(userId: string) {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
      localStorage.removeItem(`${this.USER_KEY}_${userId}`);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Get analysis by session ID
  static async getAnalysisById(sessionId: string) {
    try {
      // Search through all users' data (not ideal but works for demo)
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.STORAGE_KEY)) {
          const analyses = JSON.parse(localStorage.getItem(key) || '[]');
          const analysis = analyses.find(
            (a: any) => a.session_id === sessionId,
          );
          if (analysis) {
            return {
              data: {
                ...analysis,
                createdAt: new Date(analysis.createdAt),
                updatedAt: new Date(analysis.updatedAt),
              },
              error: null,
            };
          }
        }
      }
      return { data: null, error: 'Analysis not found' };
    } catch (error: any) {
      console.error('Error getting analysis by ID:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete analysis
  static async deleteAnalysis(sessionId: string) {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.STORAGE_KEY)) {
          const analyses = JSON.parse(localStorage.getItem(key) || '[]');
          const filteredAnalyses = analyses.filter(
            (a: any) => a.session_id !== sessionId,
          );
          localStorage.setItem(key, JSON.stringify(filteredAnalyses));
        }
      }
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting analysis:', error);
      return { success: false, error: error.message };
    }
  }
}

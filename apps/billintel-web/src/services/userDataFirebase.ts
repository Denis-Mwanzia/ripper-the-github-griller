import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

export interface AnalysisResult {
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDashboard {
  total_analyses: number;
  total_revenue_analyzed: number;
  recent_analyses: AnalysisResult[];
}

export class UserDataService {
  // Get user analyses from Firebase Functions
  static async getUserAnalyses(userId: string, limitCount: number = 20) {
    try {
      const getUserAnalysesFunction = httpsCallable(
        functions,
        'getUserAnalyses',
      );
      const result = await getUserAnalysesFunction({
        userId,
        limit: limitCount,
      });

      const data = result.data as any;
      if (data.success) {
        return { data: data.data, error: null };
      } else {
        return { data: null, error: data.error };
      }
    } catch (error: any) {
      console.error('Error getting user analyses:', error);
      return { data: null, error: error.message };
    }
  }

  // Get user dashboard data from Firebase Functions
  static async getUserDashboard(userId: string) {
    try {
      const getUserDashboardFunction = httpsCallable(
        functions,
        'getUserDashboard',
      );
      const result = await getUserDashboardFunction({ userId });

      const data = result.data as any;
      if (data.success) {
        return { data: data.data, error: null };
      } else {
        return { data: null, error: data.error };
      }
    } catch (error: any) {
      console.error('Error getting user dashboard:', error);
      return { data: null, error: error.message };
    }
  }

  // Save billing records to Firebase Functions
  static async saveBillingRecords(userId: string, records: any[]) {
    try {
      const saveBillingRecordsFunction = httpsCallable(
        functions,
        'saveBillingRecords',
      );
      const result = await saveBillingRecordsFunction({
        userId,
        records,
      });

      const data = result.data as any;
      if (data.success) {
        return { success: true, count: data.count };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Error saving billing records:', error);
      return { success: false, error: error.message };
    }
  }

  // Get analysis by session ID
  static async getAnalysisById(sessionId: string) {
    try {
      const analysisRef = doc(db, 'analysis_results', sessionId);
      const analysisSnap = await getDoc(analysisRef);

      if (analysisSnap.exists()) {
        return {
          data: { id: analysisSnap.id, ...analysisSnap.data() },
          error: null,
        };
      } else {
        return { data: null, error: 'Analysis not found' };
      }
    } catch (error: any) {
      console.error('Error getting analysis by ID:', error);
      return { data: null, error: error.message };
    }
  }

  // Get user's billing records
  static async getUserBillingRecords(userId: string, limitCount: number = 50) {
    try {
      const recordsRef = collection(db, 'billing_records');
      const q = query(
        recordsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { data: records, error: null };
    } catch (error: any) {
      console.error('Error getting user billing records:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete analysis
  static async deleteAnalysis(sessionId: string) {
    try {
      const analysisRef = doc(db, 'analysis_results', sessionId);
      await deleteDoc(analysisRef);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting analysis:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, profileData: any) {
    try {
      const profileRef = doc(db, 'user_profiles', userId);
      await updateDoc(profileRef, {
        ...profileData,
        updatedAt: Timestamp.now(),
      });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }
}

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export class AuthService {
  static async signUp(email: string, password: string, name?: string) {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user: User = {
        id: result.user.uid,
        email: result.user.email || '',
        name: name || result.user.displayName || email.split('@')[0],
        created_at:
          result.user.metadata.creationTime || new Date().toISOString(),
      };
      return { user, error: null };
    } catch (error: any) {
      console.error('Firebase signup error:', error);
      return { user: null, error: error.message };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user: User = {
        id: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || email.split('@')[0],
        created_at:
          result.user.metadata.creationTime || new Date().toISOString(),
      };
      return { user, error: null };
    } catch (error: any) {
      console.error('Firebase signin error:', error);
      return { user: null, error: error.message };
    }
  }

  static async signOut() {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error: any) {
      console.error('Firebase signout error:', error);
      return { error: error.message };
    }
  }

  static async getCurrentUser() {
    try {
      const user = auth.currentUser;
      if (!user) return { user: null, error: null };

      const transformedUser: User = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0],
        created_at: user.metadata.creationTime || new Date().toISOString(),
      };

      return { user: transformedUser, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          created_at:
            firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

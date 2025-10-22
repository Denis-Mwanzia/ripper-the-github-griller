import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development (only if available)
if (import.meta.env.DEV) {
  // Check if emulators are available before connecting
  const connectToEmulators = async () => {
    try {
      // Only connect to Functions emulator (doesn't require Java)
      if (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        // Connected to Functions emulator
      }

      // Skip Auth emulator for now (requires Java)
      // if (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
      //   try {
      //     connectAuthEmulator(auth, `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`);
      //     console.log('Connected to Auth emulator');
      //   } catch (authError) {
      //     console.log('Auth emulator not available (Java required), using production auth');
      //   }
      // }

      // Connect to Firestore emulator for local development
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        // Connected to Firestore emulator
      } catch (firestoreError) {
        // Firestore emulator already connected or not available
      }

      // Try to connect to Storage emulator (requires Java)
      if (import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST) {
        try {
          connectStorageEmulator(storage, 'localhost', 9199);
          // Connected to Storage emulator
        } catch (storageError) {
          // Storage emulator not available (Java required), using production Storage
        }
      }
    } catch (error) {
      // Some emulators not available, using production services
    }
  };

  connectToEmulators();
}

export default app;

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyAVGVRt_kUrxpxLGT9oqNXNVUhg27DjzzE',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'gen-lang-client-0921236969.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0921236969',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'gen-lang-client-0921236969.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '83063394983',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:83063394983:web:eabaaaccaf8204b59a8182',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to emulators in development (only if available)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  // Check if emulators are available before connecting
  const connectToEmulators = async () => {
    try {
      // Only connect to Functions emulator if explicitly enabled
      if (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST) {
        connectFunctionsEmulator(functions, 'localhost', 5002);
        console.log('Connected to Functions emulator');
      }

      // Connect to Firestore emulator for local development
      try {
        connectFirestoreEmulator(db, 'localhost', 8082);
        console.log('Connected to Firestore emulator');
      } catch (firestoreError) {
        // Firestore emulator already connected or not available
        console.log('Firestore emulator not available, using production');
      }

      // Try to connect to Auth emulator
      try {
        connectAuthEmulator(auth, 'http://localhost:9098');
        console.log('Connected to Auth emulator');
      } catch (authError) {
        console.log('Auth emulator not available, using production auth');
      }

      // Try to connect to Storage emulator
      try {
        connectStorageEmulator(storage, 'localhost', 9198);
        console.log('Connected to Storage emulator');
      } catch (storageError) {
        console.log('Storage emulator not available, using production Storage');
      }
    } catch (error) {
      console.log('Some emulators not available, using production services');
    }
  };

  connectToEmulators();
} else {
  console.log('Using production Firebase services');
}

export default app;

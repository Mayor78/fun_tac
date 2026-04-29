// src/lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  update, 
  remove, 
  get, 
  child,
  push,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  runTransaction
} from 'firebase/database';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized');
} else {
  app = getApp();
}

export const db = getDatabase(app);
export const auth = getAuth(app);


// Export all functions
export {
  ref,
  set,
  onValue,
  update,
  remove,
  get,
  child,
  push,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  runTransaction,
  updatePassword
};

export default app;
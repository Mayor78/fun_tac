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
  serverTimestamp
} from 'firebase/database';

// TODO: Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://tic-tac-70f37-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase is already initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized with Realtime Database');
} else {
  app = getApp();
  console.log('✅ Using existing Firebase instance');
}

export const db = getDatabase(app);

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
  serverTimestamp
};

export default app;
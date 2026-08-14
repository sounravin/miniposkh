import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  type Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if configured and enable reliable long-polling
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    }, databaseId);
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
})();

// Firestore Collections helpers
export const usersCollection = collection(db, 'users');
export const productsCollection = collection(db, 'products');
export const ordersCollection = collection(db, 'orders');
export const expensesCollection = collection(db, 'expenses');
export const customersCollection = collection(db, 'customers');
export const tablesCollection = collection(db, 'tables');
export const settingsCollection = collection(db, 'settings');
export const logsCollection = collection(db, 'activity_logs');

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
};


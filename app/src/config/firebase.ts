import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-ZjZO1Bt5aX5_mwgLxadCvoVOg3LyiE4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thamvantamly-e51c8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thamvantamly-e51c8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thamvantamly-e51c8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "109182238360",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:109182238360:web:e06a0b11c0eab164d89aed",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V4MENHLKPH",
};

// Tránh khởi tạo lại khi HMR (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth instance dùng chung toàn app
export const auth = getAuth(app);

// Firestore instance dùng chung toàn app
export const db = getFirestore(app);

// Realtime Database instance dùng chung toàn app
export const database = getDatabase(app);

// Storage instance dùng chung toàn app
export const storage = getStorage(app);

let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
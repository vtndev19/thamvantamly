import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC-ZjZO1Bt5aX5_mwgLxadCvoVOg3LyiE4",
  authDomain: "thamvantamly-e51c8.firebaseapp.com",
  databaseURL: "https://thamvantamly-e51c8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "thamvantamly-e51c8",
  storageBucket: "thamvantamly-e51c8.firebasestorage.app",
  messagingSenderId: "109182238360",
  appId: "1:109182238360:web:e06a0b11c0eab164d89aed",
  measurementId: "G-V4MENHLKPH",
};

// Tránh khởi tạo lại khi HMR (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth instance dùng chung toàn app
export const auth = getAuth(app);

// Firestore instance dùng chung toàn app
export const db = getFirestore(app);

// Realtime Database instance dùng chung toàn app
export const database = getDatabase(app);

let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
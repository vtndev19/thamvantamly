import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC-ZjZO1Bt5aX5_mwgLxadCvoVOg3LyiE4",
  authDomain: "thamvantamly-e51c8.firebaseapp.com",
  projectId: "thamvantamly-e51c8",
  storageBucket: "thamvantamly-e51c8.firebasestorage.app",
  messagingSenderId: "109182238360",
  appId: "1:109182238360:web:e06a0b11c0eab164d89aed",
  measurementId: "G-V4MENHLKPH",
};

// Tránh khởi tạo lại khi HMR (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Auth
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

// Analytics (chỉ chạy ở browser)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };
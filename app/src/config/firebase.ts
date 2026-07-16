import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-ZjZO1Bt5aX5_mwgLxadCvoVOg3LyiE4",
  authDomain: "thamvantamly-e51c8.firebaseapp.com",
  projectId: "thamvantamly-e51c8",
  storageBucket: "thamvantamly-e51c8.firebasestorage.app",
  messagingSenderId: "109182238360",
  appId: "1:109182238360:web:e06a0b11c0eab164d89aed",
  measurementId: "G-V4MENHLKPH",
};

const app = initializeApp(firebaseConfig);

// Auth instance dùng chung toàn app
export const auth = getAuth(app);

// Firestore instance dùng chung toàn app
export const db = getFirestore(app);

let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
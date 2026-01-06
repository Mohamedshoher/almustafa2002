// Initializing Firebase using the modular SDK (v9+)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for Al-Mustafa project
const firebaseConfig = {
  apiKey: "AIzaSyBapc-EMi7affuDBH94q__GhPz2jbYo6wM",
  authDomain: "almustafa-d017c.firebaseapp.com",
  projectId: "almustafa-d017c",
  storageBucket: "almustafa-d017c.firebasestorage.app",
  messagingSenderId: "569254557626",
  appId: "1:569254557626:web:0dc71af7d5067403a88f83",
  measurementId: "G-1H8STX6389"
};

// Initialize Firebase app and Firestore instance for the application
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

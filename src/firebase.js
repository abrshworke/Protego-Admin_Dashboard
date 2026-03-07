// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAq8-984cQJJX8Xa3-a6TSC9YHyVVnsZ0M",
  authDomain: "protego-dbf97.firebaseapp.com",
  projectId: "protego-dbf97",
  storageBucket: "protego-dbf97.firebasestorage.app",
  messagingSenderId: "456407781308",
  appId: "1:456407781308:web:29ce1757833251321aa5b9",
  measurementId: "G-7P7ZL4862R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firestore
export const db = getFirestore(app);

// Analytics (optional)
export const analytics = getAnalytics(app);
//auth
export const auth = getAuth(app);

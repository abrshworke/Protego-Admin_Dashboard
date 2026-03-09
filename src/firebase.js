import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAq8-984cQJJX8Xa3-a6TSC9YHyVVnsZ0M",
  authDomain: "protego-dbf97.firebaseapp.com",
  projectId: "protego-dbf97",
  storageBucket: "protego-dbf97.firebasestorage.app",
  messagingSenderId: "456407781308",
  appId: "1:456407781308:web:29ce1757833251321aa5b9",
  measurementId: "G-7P7ZL4862R",
};

// Primary app — admin session
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Secondary app — for creating new users without affecting admin session
const secondaryApp = initializeApp(firebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);

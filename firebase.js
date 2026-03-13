import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Build-safe defaults prevent prerender crashes in environments without client env injection.
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "AIzaSyDUMMYKEYFORBUILDTIMEONLY000000000",
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || "dummy-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_APP_ID || "1:1234567890:web:dummy1234567890"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

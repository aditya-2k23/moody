import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID
};

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const isSSR = typeof window === "undefined";
  // Next.js sets various environment variables during build.
  // We want to avoid throwing during 'next build' (prerendering) if vars are missing.
  const isBuildContext = process.env.NODE_ENV === "production" && isSSR;

  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value || value.trim() === "")
    .map(([key]) => `NEXT_PUBLIC_${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`);

  if (missingKeys.length > 0) {
    const errorMsg = `Firebase configuration is missing required environment variables: ${missingKeys.join(", ")}`;

    if (isBuildContext) {
      console.warn(`[Firebase] ${errorMsg}. Skipping initialization during build.`);
      // Return a dummy app that won't crash until someone tries to use it,
      // which shouldn't happen during a standard build prerender of static shells.
      return initializeApp({
        apiKey: "BUILD_TIME_ONLY",
        authDomain: "BUILD_TIME_ONLY",
        projectId: "BUILD_TIME_ONLY",
        storageBucket: "BUILD_TIME_ONLY",
        messagingSenderId: "BUILD_TIME_ONLY",
        appId: "BUILD_TIME_ONLY"
      });
    } else {
      console.error(`[Firebase] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Validate that the environment variable exists and is non-empty
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey || serviceAccountKey.trim() === "") {
    const errorMsg = "[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing or empty. " +
      "Please set it to your Firebase service account JSON credentials.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Parse the service account JSON with error handling
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (parseError) {
    // Do not log the contents of FIREBASE_SERVICE_ACCOUNT_KEY, only safe metadata
    const errorMsg = `[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON. ` +
      `Error: ${parseError.message}. ` +
      `(Value length: ${serviceAccountKey.length} characters)`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate that the parsed object has required fields (don't log field names)
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    const missingFields = [];
    if (!serviceAccount.project_id) missingFields.push("project_id");
    if (!serviceAccount.private_key) missingFields.push("private_key");
    if (!serviceAccount.client_email) missingFields.push("client_email");

    const errorMsg = `[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields: ${missingFields.join(", ")}. ` +
      "Ensure your service account JSON includes project_id, private_key, and client_email.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminApp = initAdmin();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

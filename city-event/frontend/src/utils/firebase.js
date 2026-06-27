import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Validate that all required Firebase environment variables are set
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required Firebase environment variables:', missingVars);
  console.error('Please copy .env.example to .env.local and fill in your Firebase credentials');
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase and export the instances
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics is lazy-initialized because:
//  1. It depends on browser APIs (IndexedDB, cookies) that don't exist in
//     Node (tests, SSR).
//  2. We should only start tracking after the user has granted consent
//     (GDPR). Callers should await `enableAnalytics()` after consent.
let analyticsInstance = null;
let analyticsInitPromise = null;
export const enableAnalytics = async () => {
  if (analyticsInstance) return analyticsInstance;
  if (analyticsInitPromise) return analyticsInitPromise;
  analyticsInitPromise = (async () => {
    if (typeof window === 'undefined') return null;
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  })();
  return analyticsInitPromise;
};
// Backwards-compatible export — null until enableAnalytics() resolves.
// Code that just needs "the analytics instance" can keep importing it,
// but the value will be null in non-browser environments.
export const analytics = null;

// Initialize App Check (uses reCAPTCHA v3 site key from env)
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (import.meta.env.DEV) {
  console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY not set — App Check disabled in dev');
}
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function hasRequiredConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

function getFirebaseApp() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!hasRequiredConfig()) {
    throw new Error('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.');
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  isSupported()
    .then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignore analytics initialization errors in unsupported environments.
    });

  return app;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error('Firebase authentication is only available in the browser.');
  }
  return getAuth(app);
}

export function getGoogleProvider() {
  return new GoogleAuthProvider();
}

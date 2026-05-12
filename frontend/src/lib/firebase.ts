// Firebase Client SDK — initialised once from NEXT_PUBLIC_* env vars
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: if env vars are missing (e.g. Vercel build without env configured),
// create a no-op app so the build doesn't crash during SSG.
let app: FirebaseApp;

if (!firebaseConfig.apiKey) {
  console.warn(
    '[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is not set — Firebase will not work. ' +
    'Add Firebase env vars in Vercel → Project Settings → Environment Variables.'
  );
  // Provide a dummy config so initializeApp doesn't throw during build
  app = getApps().length
    ? getApp()
    : initializeApp({ apiKey: 'dummy', projectId: 'dummy', appId: 'dummy' });
} else {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request email and profile scopes from Google
googleProvider.addScope('email');
googleProvider.addScope('profile');

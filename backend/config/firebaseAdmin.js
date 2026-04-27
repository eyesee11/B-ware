const admin = require('firebase-admin');

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error('Firebase Admin credentials are not configured');
  }

  return {
    projectId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
  };
}

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = getFirebaseConfig();

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function verifyFirebaseIdToken(idToken) {
  try {
    const app = getFirebaseAdminApp();
    return await app.auth().verifyIdToken(idToken, true);
  } catch (adminError) {
    // Fallback for local/dev setups where service-account credentials are not configured.
    // This still validates the ID token against Firebase Auth using Identity Toolkit.
    return verifyFirebaseIdTokenWithWebApi(idToken, adminError);
  }
}

function makeAuthError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

async function verifyFirebaseIdTokenWithWebApi(idToken, originalError) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    throw originalError;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeAuthError('auth/invalid-id-token', data?.error?.message || 'Invalid Firebase ID token');
  }

  const account = data?.users?.[0];
  if (!account?.localId) {
    throw makeAuthError('auth/invalid-id-token', 'Invalid Firebase ID token');
  }

  return {
    uid: account.localId,
    email: account.email,
    name: account.displayName,
  };
}

module.exports = {
  verifyFirebaseIdToken,
};

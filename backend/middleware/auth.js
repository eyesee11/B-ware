const admin = require('../services/firebaseAdmin');
const redis = require('../config/redis');

// Verifies Firebase ID token from: Authorization: Bearer <idToken>
module.exports = async function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = header.split(' ')[1];

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.error('[auth middleware] Token verification failed:', err.code || err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Block requests if this session was explicitly logged out
  // Allow /sync to pass through so it can clear the blacklist upon fresh login
  if (!req.originalUrl || !req.originalUrl.includes('/sync')) {
    try {
      const blacklisted = await redis.get(`session_blacklist:${decoded.uid}`);
      if (blacklisted) {
        return res.status(401).json({ error: 'Session has been revoked. Please log in again.' });
      }
    } catch {
      // Redis down — skip blacklist check rather than blocking the request
    }

    // Require email verification for all protected routes except /sync, /logout, and /verify-email
    // Only enforce this for email/password users (who have email_verified)
    if (decoded.email && decoded.email_verified === false) {
      if (!req.originalUrl || (!req.originalUrl.includes('/verify-email') && !req.originalUrl.includes('/logout'))) {
        return res.status(403).json({ error: 'Please verify your email address to access this resource.' });
      }
    }
  }

  req.user = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.email?.split('@')[0] || 'Analyst',
    picture: decoded.picture || null,
    email_verified: decoded.email_verified || false,
    role: decoded.role || 'user', // supports Firebase custom claims (e.g. admin)
  };

  next();
};

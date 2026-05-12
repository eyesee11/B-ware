const admin = require('../services/firebaseAdmin');
const redis = require('../config/redis');

// Same as auth.js but never rejects — sets req.user if token is valid, otherwise continues anonymously
module.exports = async function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];

  if (!header?.startsWith('Bearer ')) {
    return next(); // no token — continue as guest
  }

  const idToken = header.split(' ')[1];

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    return next(); // invalid token — continue as guest
  }

  try {
    const blacklisted = await redis.get(`session_blacklist:${decoded.uid}`);
    if (blacklisted) {
      return next(); // session revoked — treat as guest
    }
  } catch {
    // Redis down — continue anyway
  }

  req.user = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.email?.split('@')[0] || 'Analyst',
    picture: decoded.picture || null,
    email_verified: decoded.email_verified || false,
    role: decoded.role || 'user',
  };

  next();
};

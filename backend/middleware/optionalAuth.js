const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

module.exports = async function optionalAuth(req, res, next) {
  const header = req.headers["authorization"];
  
  // If no auth header, continue without user info
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Invalid token, continue without user info
    return next();
  }

  try {
    const blacklisted = await redis.get(`jwt_blacklist:${decoded.jti}`);
    if (blacklisted) {
      // Token revoked, continue without user info
      return next();
    }
  } catch {
    // Redis unavailable, continue anyway
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    jti: decoded.jti,
    exp: decoded.exp,
  };

  next();
};

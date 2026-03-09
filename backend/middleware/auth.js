const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

module.exports = async function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const blacklisted = await redis.get(`jwt_blacklist:${decoded.jti}`);
  if (blacklisted)
    return res.status(401).json({ error: "Token has been revoked" });

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    jti: decoded.jti,
    exp: decoded.exp,
  };

  next();
};

const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const auth = require("../controllers/authController");
const requireAuth = require("../middleware/auth");

// Stricter rate limit for login / register — 20 attempts per 15 minutes per IP.
// This protects against brute-force and credential-stuffing attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests, please try again later" },
});

router.post("/register", authLimiter, auth.register);
router.post("/login", authLimiter, auth.login);
router.post("/logout", requireAuth, auth.logout);
router.get("/me", requireAuth, auth.getMe);

module.exports = router;

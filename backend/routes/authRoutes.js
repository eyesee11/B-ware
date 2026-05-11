const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

// Strict rate limit for auth-adjacent endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later' },
});

// Sync Firebase user → MySQL after any sign-in (email/pass or Google)
router.post('/sync', requireAuth, auth.syncUser);

// Get current user profile from MySQL
router.get('/me', requireAuth, auth.getMe);

// Logout: revokes Firebase refresh tokens + blacklists session in Redis
router.post('/logout', requireAuth, auth.logout);

// Forgot password: generates Firebase reset link → sends via Nodemailer
router.post('/forgot-password', authLimiter, auth.forgotPassword);

module.exports = router;

const router      = require('express').Router();
const auth        = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login',    auth.login);
router.post('/logout',   requireAuth, auth.logout);
router.get('/me',        requireAuth, auth.getMe);

module.exports = router;

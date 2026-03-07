const router      = require('express').Router();
const claims      = require('../controllers/claimController');
const requireAuth = require('../middleware/auth');

router.post('/verify', requireAuth, claims.submitClaim);
router.post('/quick',  requireAuth, claims.submitQuick);
router.post('/deep',   requireAuth, claims.submitDeep);
router.get('/stats',   requireAuth, claims.getStats);  
router.get('/',        requireAuth, claims.getUserClaims);
router.get('/:id',     requireAuth, claims.getClaimById);

module.exports = router;

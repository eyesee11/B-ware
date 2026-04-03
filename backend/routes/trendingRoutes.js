const router      = require('express').Router();
const trending    = require('../controllers/trendingController');
const requireAuth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/',         optionalAuth, trending.getTrending);
router.get('/sources',  trending.getSourceStats);
router.get('/:id',      trending.getTrendingById);
router.post('/refresh', requireAuth, trending.refreshTrending); 

module.exports = router;

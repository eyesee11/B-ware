const router      = require('express').Router();
const outlets     = require('../controllers/outletController');
const optionalAuth = require('../middleware/optionalAuth');
const requireAuth = require('../middleware/auth');

router.get('/available',    outlets.getAvailableOutlets);
router.get('/',             optionalAuth, outlets.getUserOutlets);
router.post('/',            requireAuth, outlets.updateUserOutlets);

module.exports = router;

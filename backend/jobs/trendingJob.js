const cron  = require('node-cron');
const redis = require('../config/redis');
const { runTrendingRefresh } = require('../controllers/trendingController');

// every 30 min — Redis NX lock prevents overlap if a run is still going
cron.schedule('*/30 * * * *', async () => {
  const lock = await redis.set('trending_job_lock', '1', 'NX', 'EX', 300);
  if (!lock) return;

  try {
    await runTrendingRefresh();
  } catch (err) {
    console.error('trending cron:', err.message);
  } finally {
    await redis.del('trending_job_lock');
  }
});

console.log('trending cron scheduled (every 30 min)');

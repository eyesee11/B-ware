const cron = require("node-cron"); // library to run scheduled jobs
const redis = require("../config/redis"); 
const { runTrendingRefresh } = require("../controllers/trendingController"); // function that refreshes trending stories

// schedule cron job to run once a day (at midnight)
cron.schedule("0 0 * * *", async () => {

  // create a redis lock so multiple cron jobs don't run at the same time
  const lock = await redis.set("trending_job_lock", "1", "NX", "EX", 300);

  // if lock already exists, exit (another job is running)
  if (!lock) return;

  try {
    // run the trending refresh process
    await runTrendingRefresh();

  } catch (err) {
    // log error if something fails
    console.error("trending cron:", err.message);

  } finally {
    // remove lock after job finishes
    await redis.del("trending_job_lock");

  }
});

console.log("trending cron scheduled (once a day)");
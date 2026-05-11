/**
 * One-time script to populate trending stories immediately.
 * Run: node scripts/seed-trending-now.js
 */

require("dotenv").config();
const db = require("../config/db");
const { runTrendingRefresh } = require("../controllers/trendingController");

(async () => {
  try {
    await db.query("SELECT 1"); // warm up DB
    console.log("🚀 Running trending refresh now...\n");
    const count = await runTrendingRefresh();
    console.log(`\n✅ Done! Added ${count} new trending stories.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Refresh failed:", err.message);
    process.exit(1);
  }
})();

/**
 * Cleanup: Remove orphan claims rows with old INT user_ids,
 * then add the final FK: claims.user_id → users.firebase_uid
 *
 * Run once: node scripts/cleanup-orphan-claims.js
 */

require("dotenv").config();
const db = require("../config/db");

async function run() {
  try {
    console.log("🧹 Cleaning up orphan claims...");

    // Delete claims whose user_id doesn't match any firebase_uid
    const [del] = await db.query(`
      DELETE FROM claims
      WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT firebase_uid FROM users)
    `);
    console.log(`  ✓ Deleted ${del.affectedRows} orphan claim row(s)`);

    // Also clean verification_log rows whose claim_id no longer exists
    const [delLog] = await db.query(`
      DELETE FROM verification_log
      WHERE claim_id NOT IN (SELECT id FROM claims)
    `);
    console.log(`  ✓ Deleted ${delLog.affectedRows} orphan verification_log row(s)`);

    // Now add the FK safely
    console.log("\n🔗 Adding FK: claims.user_id → users.firebase_uid...");
    try {
      await db.query(`
        ALTER TABLE claims
          ADD CONSTRAINT fk_claims_firebase_uid
          FOREIGN KEY (user_id) REFERENCES users(firebase_uid)
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("  ✓ FK added successfully");
    } catch (e) {
      if (e.message.includes("Duplicate key name")) {
        console.log("  ✓ FK already exists");
      } else {
        console.log("  ⚠ FK skipped:", e.message);
      }
    }

    console.log("\n✅ All done! Database is clean and ready.\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

run();

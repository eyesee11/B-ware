/**
 * Migration: Change user_id columns from INT → VARCHAR(128)
 * to support Firebase UID strings like 'FjMBIQh8ElQV5IajgtuN94H4AOy1'
 *
 * Run once: node scripts/migrate-firebase-uid.js
 */

require("dotenv").config();
const db = require("../config/db");

async function migrate() {
  console.log("🔧 Starting Firebase UID migration...\n");

  try {
    // ── 1. Drop foreign keys that reference users.id ──────────────────────────
    console.log("Step 1: Dropping foreign key constraints...");

    // Try to drop FK on claims table (may vary by MySQL naming)
    const fkQueries = [
      "ALTER TABLE claims DROP FOREIGN KEY claims_ibfk_1",
      "ALTER TABLE activity_log DROP FOREIGN KEY activity_log_ibfk_1",
    ];

    for (const q of fkQueries) {
      try {
        await db.query(q);
        console.log(`  ✓ ${q}`);
      } catch (e) {
        // FK may already be gone or named differently — safe to skip
        console.log(`  ⚠ Skipped (not found): ${q.split(" FOREIGN")[0]}`);
      }
    }

    // ── 2. Change users.id → VARCHAR(128) ────────────────────────────────────
    console.log("\nStep 2: Altering users.id to VARCHAR(128)...");
    await db.query(`
      ALTER TABLE users
        MODIFY id VARCHAR(128) NOT NULL
    `);
    console.log("  ✓ users.id → VARCHAR(128)");

    // ── 3. Change claims.user_id → VARCHAR(128) ───────────────────────────────
    console.log("\nStep 3: Altering claims.user_id to VARCHAR(128)...");
    await db.query(`
      ALTER TABLE claims
        MODIFY user_id VARCHAR(128) DEFAULT NULL
    `);
    console.log("  ✓ claims.user_id → VARCHAR(128)");

    // ── 4. Change activity_log.user_id if the table exists ────────────────────
    console.log("\nStep 4: Altering activity_log.user_id (if exists)...");
    try {
      await db.query(`
        ALTER TABLE activity_log
          MODIFY user_id VARCHAR(128) DEFAULT NULL
      `);
      console.log("  ✓ activity_log.user_id → VARCHAR(128)");
    } catch (e) {
      console.log("  ⚠ activity_log table not found — skipping");
    }

    // ── 5. Re-add FK: claims.user_id → users.id ──────────────────────────────
    console.log("\nStep 5: Re-adding foreign key on claims...");
    try {
      await db.query(`
        ALTER TABLE claims
          ADD CONSTRAINT fk_claims_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log("  ✓ FK claims → users restored");
    } catch (e) {
      console.log("  ⚠ Could not add FK (will work without it):", e.message);
    }

    console.log("\n✅ Migration complete! Firebase UIDs will now save correctly.\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

migrate();

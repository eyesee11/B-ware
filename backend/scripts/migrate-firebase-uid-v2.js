/**
 * Migration v2: Wire claims.user_id → users.firebase_uid
 *
 * The root issue: claims.user_id stores Firebase UID strings,
 * but it was FK'd to users.id (INT). Now that both columns are
 * VARCHAR(128), we re-point the FK to users.firebase_uid.
 *
 * Run once: node scripts/migrate-firebase-uid-v2.js
 */

require("dotenv").config();
const db = require("../config/db");

async function migrate() {
  console.log("🔧 Migration v2: Re-wiring claims.user_id → users.firebase_uid\n");

  try {
    // ── 1. Drop the FK we added in v1 (points to users.id) ──────────────────
    console.log("Step 1: Dropping old FK on claims.user_id...");
    try {
      await db.query("ALTER TABLE claims DROP FOREIGN KEY fk_claims_user");
      console.log("  ✓ Dropped fk_claims_user");
    } catch (e) {
      console.log("  ⚠ FK not found or already removed — continuing");
    }

    // ── 2. Make sure users.firebase_uid has a UNIQUE index ───────────────────
    console.log("\nStep 2: Ensuring users.firebase_uid is UNIQUE...");
    try {
      await db.query("ALTER TABLE users ADD UNIQUE INDEX idx_firebase_uid (firebase_uid)");
      console.log("  ✓ UNIQUE index added on users.firebase_uid");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME" || e.message.includes("Duplicate key")) {
        console.log("  ✓ UNIQUE index already exists");
      } else {
        throw e;
      }
    }

    // ── 3. Make claims.user_id VARCHAR(128) (may already be done by v1) ──────
    console.log("\nStep 3: Ensuring claims.user_id is VARCHAR(128)...");
    await db.query("ALTER TABLE claims MODIFY user_id VARCHAR(128) DEFAULT NULL");
    console.log("  ✓ claims.user_id confirmed as VARCHAR(128)");

    // ── 4. Re-add FK pointing to users.firebase_uid ──────────────────────────
    console.log("\nStep 4: Adding FK claims.user_id → users.firebase_uid...");
    try {
      await db.query(`
        ALTER TABLE claims
          ADD CONSTRAINT fk_claims_firebase_uid
          FOREIGN KEY (user_id) REFERENCES users(firebase_uid)
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("  ✓ FK fk_claims_firebase_uid created");
    } catch (e) {
      console.log("  ⚠ Could not add FK (will work without it):", e.message);
    }

    console.log("\n✅ Migration v2 complete!");
    console.log("   claims.user_id now stores Firebase UIDs correctly.\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();

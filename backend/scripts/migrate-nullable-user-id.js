require("dotenv").config();
const db = require("../config/db");

async function migrate() {
  try {
    console.log("Altering claims table to make user_id nullable...");
    
    // Drop the foreign key constraint first
    await db.query(
      "ALTER TABLE claims DROP FOREIGN KEY claims_ibfk_1"
    );
    
    // Change user_id to allow NULL
    await db.query(
      "ALTER TABLE claims MODIFY user_id INT DEFAULT NULL"
    );
    
    // Re-add the foreign key constraint
    await db.query(
      "ALTER TABLE claims ADD CONSTRAINT claims_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
    );

    console.log("✓ Migration complete: user_id is now nullable");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();

require('dotenv').config();
const db = require('./config/db');

async function migrateDecimalPrecision() {
  try {
    console.log('🔄 Starting decimal precision migration...');

    // Update claims table
    await db.query(`
      ALTER TABLE claims 
      MODIFY extracted_value DECIMAL(20,2) DEFAULT NULL
    `);
    console.log('✓ Updated claims.extracted_value to DECIMAL(20,2)');

    // Update official_data_cache table
    await db.query(`
      ALTER TABLE official_data_cache 
      MODIFY value DECIMAL(20,2) NOT NULL
    `);
    console.log('✓ Updated official_data_cache.value to DECIMAL(20,2)');

    // Update verification_log table columns
    await db.query(`
      ALTER TABLE verification_log 
      MODIFY official_value DECIMAL(20,2) DEFAULT NULL,
      MODIFY claimed_value DECIMAL(20,2) DEFAULT NULL,
      MODIFY difference DECIMAL(20,2) DEFAULT NULL
    `);
    console.log('✓ Updated verification_log numeric columns to DECIMAL(20,2)');

    console.log('✅ Migration complete: All decimal columns now support values up to 999,999,999,999,999,999.99');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateDecimalPrecision();

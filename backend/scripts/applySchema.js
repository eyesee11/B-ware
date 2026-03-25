const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

async function run() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  console.log(`[schema] applying ${schemaPath}`);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await db.query(sql);
    console.log('[schema] database schema applied successfully');
  } catch (err) {
    console.error('[schema] failed to apply schema:', err.message);
  } finally {
    await db.end();
    process.exit(0);
  }
}

run();

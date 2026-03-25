require('dotenv').config();
const db = require('./config/db');

async function checkDb() {
  try {
    const [claims] = await db.query('SHOW COLUMNS FROM claims;');
    console.log('--- CLAIMS TABLE ---');
    console.table(claims);

    const [vlog] = await db.query('SHOW COLUMNS FROM verification_log;');
    console.log('--- VERIFICATION_LOG TABLE ---');
    console.table(vlog);

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

checkDb();

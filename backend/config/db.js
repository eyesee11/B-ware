const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const caPath = path.join(__dirname, 'ca.pem');
let caCert;

try {
  caCert = fs.readFileSync(caPath);
} catch (err) {
  console.error(`[MySQL] Failed to read CA certificate at ${caPath}:`, err.message);
  throw err;
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: caCert,
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false, // TODO: replace with true once correct CA is installed
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
};

console.log(
  `[MySQL] Connecting to ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user} (db=${dbConfig.database})`,
);

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then(conn => { console.log('MySQL connected'); conn.release(); })
  .catch(err => { console.error('MySQL failed:', err.message); });

module.exports = pool;
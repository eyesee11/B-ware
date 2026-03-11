const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT || 3306,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
});

pool.getConnection()
  .then(conn => { console.log('MySQL connected'); conn.release(); })
  .catch(err => { console.error('MySQL failed:', err.message); });

module.exports = pool;
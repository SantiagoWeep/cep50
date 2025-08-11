const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

module.exports = {
  query: (...params) => pool.query(...params),
  execute: (...params) => pool.execute(...params),
  getConnection: () => pool.getConnection() // ✅ Agregado
};

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Exporta un objeto con método query que llama a pool.query
module.exports = {
  query: (...params) => pool.query(...params),
  execute: (...params) => pool.execute(...params)
};

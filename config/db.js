// backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Per caricare le variabili da .env

// Crea il pool di connessioni
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Database Pool creato.');

module.exports = pool;
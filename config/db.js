// backend/config/db.js
const postgres = require('postgres');
require('dotenv').config();

// Preferisci una singola connection string (DATABASE_URL), altrimenti componi dai singoli campi
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("ATTENZIONE: Nessuna DATABASE_URL trovata nelle variabili d'ambiente. Assicurati di impostarla.");
}

// Inizializza il client PostgreSQL. Abilita SSL per le connessioni a Supabase/hosting.
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
});

// Test della connessione in background
(async () => {
  try {
    await sql`SELECT 1`;
    console.log('✅ Connesso al database PostgreSQL.');
  } catch (err) {
    console.error('❌ Errore di connessione al database:', err && err.message ? err.message : err);
  }
})();

module.exports = sql;

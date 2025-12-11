const db = require("../config/db");

exports.getProfile = async (req, res) => {
  try {
    const rows = await db`SELECT id, email, created_at FROM users WHERE id = ${req.user.id}`;
    if (!rows || rows.length === 0) return res.status(404).json({ message: "Utente non trovato." });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero del profilo." });
  }
};

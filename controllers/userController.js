const db = require("../config/db");

exports.getProfile = async (req, res) => {
  try {
    const rows = await db`SELECT id, email, created_at FROM users WHERE id = ${req.user.id}`;
    if (!rows || rows.length === 0) return res.status(404).json({ message: "Utente non trovato." });
    const user = rows[0];

    // Recupera anche le ricette generate dall'utente
    const recipes = await db`SELECT id, title, ingredients, steps, estimated_time, created_at FROM recipes WHERE user_id = ${req.user.id} ORDER BY created_at DESC`;

    res.status(200).json({ ...user, recipes });
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero del profilo." });
  }
};

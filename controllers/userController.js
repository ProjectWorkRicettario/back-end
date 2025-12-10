const db = require('../config/db');

// GET: Ottiene i dati base dell'utente loggato
exports.getProfile = async (req, res) => {
    try {
        // Selezioniamo solo i dati non sensibili (escludiamo password_hash)
        const [users] = await db.query(
            'SELECT id, email, created_at FROM users WHERE id = ?', 
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero del profilo.' });
    }
};
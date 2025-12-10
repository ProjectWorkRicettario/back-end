const db = require('../config/db');

// GET: Ottiene tutti gli ingredienti di un utente
exports.getInventory = async (req, res) => {
    try {
        // L'ID utente viene preso dalla sessione (grazie a authMiddleware)
        const [items] = await db.query('SELECT * FROM inventory WHERE user_id = ?', [req.user.id]);
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dell\'inventario.' });
    }
};

// POST: Aggiunge un nuovo ingrediente
exports.addItem = async (req, res) => {
    const { name, quantity } = req.body;
    
    if (!name || !quantity) {
        return res.status(400).json({ message: 'Nome e quantità sono richiesti.' });
    }

    try {
        await db.query(
            'INSERT INTO inventory (user_id, name, quantity) VALUES (?, ?, ?)',
            [req.user.id, name, quantity]
        );
        // Ritorniamo l'inventario aggiornato (o solo l'item creato)
        res.status(201).json({ message: 'Ingrediente aggiunto con successo.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore nell\'aggiunta dell\'ingrediente.' });
    }
};

// DELETE: Rimuove un ingrediente
exports.deleteItem = async (req, res) => {
    const { itemId } = req.params; // ID dell'item da eliminare

    try {
        const [result] = await db.query(
            'DELETE FROM inventory WHERE id = ? AND user_id = ?', 
            [itemId, req.user.id] // Assicurati che l'utente stia eliminando SOLO i suoi item
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ingrediente non trovato o non di proprietà.' });
        }
        res.status(200).json({ message: 'Ingrediente rimosso.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore nella rimozione.' });
    }
};
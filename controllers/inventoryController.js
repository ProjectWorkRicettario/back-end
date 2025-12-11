const db = require("../config/db");

exports.getInventory = async (req, res) => {
  try {
    const items = await db`SELECT * FROM inventory WHERE user_id = ${req.user.id}`;
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero dell'inventario." });
  }
};

exports.addItem = async (req, res) => {
  const { name, quantity } = req.body;
  if (!name || !quantity)
    return res.status(400).json({ message: "Nome e quantità sono richiesti." });

  try {
    const inserted = await db`
      INSERT INTO inventory (user_id, name, quantity)
      VALUES (${req.user.id}, ${name}, ${quantity})
      RETURNING *
    `;
    res.status(201).json({ message: "Ingrediente aggiunto con successo.", item: inserted && inserted[0] });
  } catch (error) {
    res.status(500).json({ message: "Errore nell'aggiunta dell'ingrediente." });
  }
};

exports.deleteItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const deleted = await db`
      DELETE FROM inventory
      WHERE id = ${itemId} AND user_id = ${req.user.id}
      RETURNING *
    `;

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ message: 'Ingrediente non trovato o non di proprietà.' });
    }

    res.status(200).json({ message: 'Ingrediente rimosso.' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella rimozione.' });
  }
};

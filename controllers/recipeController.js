const db = require("../config/db");
const { callAI } = require("../utils/ai");

// ===============================
// POST /api/recipes/generate
// Genera 3 ricette usando l'inventario dell'utente
// ===============================
exports.generateRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1) Recupera inventario utente
    const inventory =
      await db`SELECT name, quantity FROM inventory WHERE user_id = ${userId}`;

    if (!inventory || inventory.length === 0) {
      return res.status(400).json({
        message:
          "Inventario vuoto. Aggiungi ingredienti prima di generare ricette.",
      });
    }

    // 2) Costruzione prompt
    const itemsList = inventory
      .map((i) => `${i.name} (${i.quantity})`)
      .join(", ");

    const prompt = `
        Sei uno chef esperto.
        Genera ESATTAMENTE 3 ricette usando SOLO questi ingredienti:
        ${itemsList}

        Rispetta queste regole:
        - Usa solo ingredienti forniti
        - Ricette realistiche
        - Nessun testo extra, solo dati strutturati
        - Rispondi solo con un formato json valido
    `;

    // 3) Chiamata AI (restituisce già un array JS)
    const recipes = await callAI(prompt);

    if (!Array.isArray(recipes)) {
      throw new Error("Risposta AI non è un array");
    }

    // 4) Inserimento nel DB
    const inserted = [];

    for (const r of recipes.slice(0, 3)) {
      const title = (r.title || "").slice(0, 200);
      const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
      const steps = Array.isArray(r.steps) ? r.steps : [];
      const estimated_time = r.estimated_time || null;

      const rows = await db`
        INSERT INTO recipes (
          user_id,
          title,
          ingredients,
          steps,
          estimated_time
        )
        VALUES (
          ${userId},
          ${title},
          ${ingredients},
          ${steps},
          ${estimated_time}
        )
        RETURNING *
      `;

      if (rows && rows[0]) {
        inserted.push(rows[0]);
      }
    }

    // 5) Risposta
    res.status(201).json({
      message: "Ricette generate con successo",
      recipes: inserted,
    });
  } catch (error) {
    console.error("Errore generateRecipes:", error);
    res.status(500).json({
      message: "Errore interno durante la generazione delle ricette.",
    });
  }
};

// ===============================
// GET /api/recipes
// Ritorna tutte le ricette dell'utente
// ===============================
exports.getRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await db`
      SELECT
        id,
        title,
        ingredients,
        steps,
        estimated_time,
        created_at
      FROM recipes
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    res.status(200).json(rows);
  } catch (error) {
    console.error("Errore getRecipes:", error);
    res.status(500).json({
      message: "Errore nel recupero delle ricette.",
    });
  }
};


exports.deleteRecipe = async (req, res) => {
  const { recipeId } = req.params;
  try {
    const deleted = await db`
      DELETE FROM recipes 
      WHERE id = ${recipeId} AND user_id = ${req.user.id}
      RETURNING *
    `;
    if (!deleted.length) return res.status(404).json({ message: "Ricetta non trovata." });
    res.status(200).json({ message: "Ricetta eliminata con successo." });
  } catch (error) {
    res.status(500).json({ message: "Errore durante l'eliminazione." });
  }
};

exports.shareRecipe = async (req, res) => {
  const { recipeId, receiverEmail } = req.body;
  const senderId = req.user.id; // Preso dal token di autenticazione

  try {
    // 1. Troviamo l'ID dell'utente a cui vogliamo inviare la ricetta
    const receiver = await db`SELECT id FROM users WHERE email = ${receiverEmail}`;
    
    if (!receiver || receiver.length === 0) {
      return res.status(404).json({ message: "Utente destinatario non trovato." });
    }

    // 2. Inseriamo il record nella tabella delle condivisioni
    await db`
      INSERT INTO shared_recipes (sender_id, receiver_id, recipe_id)
      VALUES (${senderId}, ${receiver[0].id}, ${recipeId})
    `;

    res.status(200).json({ message: "Ricetta condivisa con successo!" });
  } catch (error) {
    console.error("Errore condivisione:", error);
    res.status(500).json({ message: "Errore interno durante la condivisione." });
  }
};

// In controllers/recipeController.js

exports.getSharedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    // Selezioniamo i dati della ricetta facendo un JOIN tra shared_recipes, recipes e users
    const rows = await db`
      SELECT 
        r.id, 
        r.title, 
        r.ingredients, 
        r.steps, 
        r.estimated_time, 
        u.email as shared_by,
        s.created_at
      FROM shared_recipes s
      JOIN recipes r ON s.recipe_id = r.id
      JOIN users u ON s.sender_id = u.id
      WHERE s.receiver_id = ${userId}
      ORDER BY s.created_at DESC
    `;

    res.status(200).json(rows);
  } catch (error) {
    console.error("Errore getSharedRecipes:", error);
    res.status(500).json({ message: "Errore nel recupero delle ricette condivise." });
  }
};

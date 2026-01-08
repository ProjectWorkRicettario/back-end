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

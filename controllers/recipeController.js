const db = require("../config/db");
const { callAI } = require("../utils/ai");

// Genera 3 ricette usando l'inventario dell'utente e le salva nel DB
exports.generateRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1) Prendi inventario dell'utente
    const inventory =
      await db`SELECT name, quantity FROM inventory WHERE user_id = ${userId}`;

    // Costruiamo il prompt: chiediamo 3 ricette in formato JSON
    const itemsList = inventory
      .map((i) => `${i.name} (${i.quantity})`)
      .join(", ");

    const prompt = `Genera esattamente 3 ricette di cucina creative in formato JSON. Usa SOLO gli ingredienti disponibili nel seguente inventario: ${itemsList}.\n\nOgni ricetta deve avere: title, ingredients (array di oggetti con name e quantity), steps (array di istruzioni testuali), estimated_time (string).\n\nRispondi SOLO con un JSON array con 3 oggetti. Esempio: [{"title":"...","ingredients":[{"name":"","quantity":""}],"steps":["..."],"estimated_time":"30 min"}, ...]`;

    // 2) Chiama l'API Gemini
    const output = await callAI(prompt);

    // 3) Parsiamo il JSON dall'output del modello (tolleranza a eventuale testo extra)
    let jsonText = output.trim();
    // Spesso il modello possa includere testo prima o dopo il JSON; cerchiamo il primo '[' e l'ultimo ']'
    const firstIdx = jsonText.indexOf("[");
    const lastIdx = jsonText.lastIndexOf("]");
    if (firstIdx !== -1 && lastIdx !== -1) {
      jsonText = jsonText.slice(firstIdx, lastIdx + 1);
    }

    let recipes;
    try {
      recipes = JSON.parse(jsonText);
      if (!Array.isArray(recipes))
        throw new Error("Parsed content is not an array");
    } catch (err) {
      console.error("Errore parsing JSON da Gemini:", err.message);
      return res.status(500).json({
        message: "Errore nel parsing della risposta del generatore di ricette.",
      });
    }

    // 4) Inserisci ogni ricetta nel DB (ROWS: id, user_id, title, ingredients jsonb, steps jsonb, estimated_time)
    const inserted = [];
    for (const r of recipes.slice(0, 3)) {
      const title = (r.title || "").slice(0, 200);
      const ingredients = r.ingredients || [];
      const steps = r.steps || [];
      const estimated_time = r.estimated_time || null;

      const rows = await db`
        INSERT INTO recipes (user_id, title, ingredients, steps, estimated_time)
        VALUES (${userId}, ${title}, ${ingredients}, ${steps}, ${estimated_time})
        RETURNING *
      `;

      inserted.push(rows && rows[0] ? rows[0] : null);
    }

    // 5) Restituisci le ricette appena create
    res.status(201).json({ message: "Ricette generate", recipes: inserted });
  } catch (error) {
    console.error("Errore generateRecipes:", error);
    res.status(500).json({
      message: "Errore interno durante la generazione delle ricette.",
    });
  }
};

// GET /api/recipes
// Ritorna tutte le ricette generate dall'utente
exports.getRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows =
      await db`SELECT id, title, ingredients, steps, estimated_time, created_at FROM recipes WHERE user_id = ${userId} ORDER BY created_at DESC`;
    res.status(200).json(rows);
  } catch (error) {
    console.error("Errore getRecipes:", error);
    res.status(500).json({ message: "Errore nel recupero delle ricette." });
  }
};

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

    const prompt = `
        Sei uno chef esperto. Genera esattamente 3 ricette in formato JSON rigoroso (RFC 8259).
        Usa SOLO gli ingredienti: ${itemsList}.

        Regole Tassative:
        1. Rispondi SOLO con il JSON array. Niente testo prima o dopo.
        2. Usa le doppie virgolette per tutte le chiavi e le stringhe (es: "name": "valore").
        3. NESSUNA virgola finale (trailing comma) dopo l'ultimo elemento.

        Struttura richiesta:
        [
        {
            "title": "Nome Ricetta",
            "ingredients": [{"name": "Ingrediente", "quantity": "Qta"}],
            "steps": ["Step 1", "Step 2"],
            "estimated_time": "30 min"
        }
        ]
        `;

    // 2) Chiama l'API Gemini
    const output = await callAI(prompt);

    // 3) Pulizia aggressiva del JSON
    let jsonText = output.trim();

    // Rimuoviamo eventuali blocchi markdown tipo ```json o ```
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "");

    // Cerchiamo la prima parentesi quadra aperta e l'ultima chiusa
    const firstIdx = jsonText.indexOf("[");
    const lastIdx = jsonText.lastIndexOf("]");

    if (firstIdx !== -1 && lastIdx !== -1) {
      jsonText = jsonText.substring(firstIdx, lastIdx + 1);
    }

    // FIX EXTRA: A volte Gemini mette virgole finali illegali (trailing commas)
    // Questo è un trucco regex per rimuoverle prima di chiudere } o ]
    jsonText = jsonText.replace(/,\s*([\]}])/g, "$1");

    let recipes;
    try {
      recipes = JSON.parse(jsonText);
      if (!Array.isArray(recipes))
        throw new Error("Parsed content is not an array");
    } catch (err) {
      // Se fallisce, stampiamo il testo che ha causato l'errore per debuggarlo
      console.error("JSON PARSE ERROR. Text was:", jsonText);
      console.error("Original Error:", err.message);

      return res.status(500).json({
        message: "Errore nel parsing della risposta del generatore di ricette.",
        debugInfo: err.message, // Opzionale: rimandalo al frontend per vederlo subito
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

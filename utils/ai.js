const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

async function callAI(prompt) {
  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY non impostata");
  }

  const _fetch =
    typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,

      // ⚠️ IMPORTANTE: JSON strutturato garantito
      responseMimeType: "application/json",

      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                },
                required: ["name", "quantity"],
              },
            },
            steps: {
              type: "array",
              items: { type: "string" },
            },
            estimated_time: { type: "string" },
          },
          required: ["title", "ingredients", "steps", "estimated_time"],
        },
      },
    },
  };

  const res = await _fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Gemini API Error:", res.status, text);
    throw new Error(`AI API error: ${res.status}`);
  }

  const data = await res.json();

  /*
    Con responseSchema:
    Gemini restituisce SEMPRE JSON valido
    in candidates[0].content.parts[0].text
  */
  const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOut) {
    throw new Error("Risposta vuota da Gemini");
  }

  let parsed;
  try {
    parsed = JSON.parse(textOut);
  } catch (err) {
    console.error("JSON NON PARSABILE:", textOut);
    throw new Error("Risposta AI non è JSON valido");
  }

  return parsed;
}

module.exports = { callAI };

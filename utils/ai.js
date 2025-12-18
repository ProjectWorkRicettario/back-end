const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

async function callAI(prompt) {
  if (!AI_API_KEY) throw new Error("AI_API_KEY non impostata");

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
      responseMimeType: "application/json",
    },
  };

  const res = await _fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Gemini API Error: ${res.status} - ${text}`);
    throw new Error(`AI API error: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Estrazione della risposta specifica per Gemini
  let textOut = null;
  if (
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0]
  ) {
    textOut = data.candidates[0].content.parts[0].text;
  }

  if (!textOut) throw new Error("Nessuna risposta generata dall'AI");

  return textOut;
}

module.exports = { callAI };

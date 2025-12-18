const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "text-bison-001";

async function callAI(prompt) {
  if (!AI_API_KEY) throw new Error("AI_API_KEY non impostata");

  const _fetch =
    typeof fetch !== "undefined" ? fetch : (await import("node-fetch")).default;

  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${AI_MODEL}:generate?key=${AI_API_KEY}`;

  const body = {
    prompt: { text: prompt },
    temperature: 0.7,
    maxOutputTokens: 1024,
  };

  const res = await _fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error: ${res.status} ${text}`);
  }
  
  const data = await res.json();
  let textOut = null;
  if (data.candidates && data.candidates[0] && data.candidates[0].output)
    textOut = data.candidates[0].output;
  if (
    !textOut &&
    data.candidate &&
    data.candidate[0] &&
    data.candidate[0].content
  )
    textOut = data.candidate[0].content;
  if (!textOut && data.output) textOut = data.output;
  if (!textOut) textOut = JSON.stringify(data);

  return textOut;
}

module.exports = { callAI };

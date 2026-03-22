// Gemini 2.5 Flash Lite — Free tier subject to quota and availability
// Get key at: https://aistudio.google.com/app/apikey

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function gemini(prompt: string, systemInstruction?: string, jsonMode = false): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env.local');

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

export async function geminiJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const raw = await gemini(prompt, systemInstruction, true);
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try stripping markdown fences
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean) as T;
  }
}

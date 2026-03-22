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

function cleanJSON(raw: string): string {
  let s = raw.trim();
  // Strip BOM
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  // Strip markdown code fences
  s = s.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  // Remove trailing commas before ] or }
  s = s.replace(/,\s*([\]\}])/g, '$1');
  return s;
}

export async function geminiJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const raw = await gemini(prompt, systemInstruction, true);
  const cleaned = cleanJSON(raw);

  try {
    const parsed = JSON.parse(cleaned);
    // If we expected an array but got { questions: [...] } or { data: [...] }, unwrap it
    if (Array.isArray(parsed)) return parsed as T;
    if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
        return parsed[keys[0]] as T;
      }
    }
    return parsed as T;
  } catch {
    // Try to extract JSON array from the response
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]) as T; } catch { /* fall through */ }
    }
    throw new Error('Failed to parse AI response as JSON. Please try again.');
  }
}

export async function geminiJSONWithRetry<T>(prompt: string, systemInstruction?: string, retries = 1): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await geminiJSON<T>(prompt, systemInstruction);
    } catch (e) {
      if (i === retries) throw e;
      // Wait briefly before retry
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Failed after retries');
}

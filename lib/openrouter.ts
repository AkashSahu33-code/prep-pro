const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'stepfun/step-3.5-flash:free';

export async function openrouter(prompt: string, systemInstruction?: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to .env.local');
  }

  const messages: { role: string; content: string }[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'PrepPro',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      throw new Error('Rate limited by OpenRouter. Wait a moment and try again.');
    }
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error('Empty response from OpenRouter');
  return text;
}

function cleanJSON(raw: string): string {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  s = s.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  s = s.replace(/,\s*([\]\}])/g, '$1');
  return s;
}

export async function openrouterJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const raw = await openrouter(prompt, systemInstruction);
  const cleaned = cleanJSON(raw);

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as T;
    if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
        return parsed[keys[0]] as T;
      }
    }
    return parsed as T;
  } catch {
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]) as T; } catch { /* fall through */ }
    }
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as T; } catch { /* fall through */ }
    }
    throw new Error('Failed to parse AI response as JSON. Please try again.');
  }
}

export async function openrouterJSONWithRetry<T>(prompt: string, systemInstruction?: string, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await openrouterJSON<T>(prompt, systemInstruction);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Failed after retries');
}

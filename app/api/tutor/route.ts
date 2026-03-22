import { NextRequest, NextResponse } from 'next/server';
import { gemini } from '../../../lib/gemini';

const SYSTEM = `You are an expert AI tutor for Indian students (CBSE, JEE, NEET, UPSC).
You answer questions grounded in NCERT textbooks and standard educational sources.
Rules:
- Never hallucinate facts. If unsure, say "I'm not certain, please verify in your NCERT textbook."
- Use **bold** for key terms, numbered steps for problems.
- Give Indian context examples where relevant.
- For math/physics problems, show every step clearly.
- You may respond in Hinglish if the student writes in Hindi/Hinglish.
- Keep answers clear, structured and at the student's level.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, subject } = await req.json();

    // Build conversation context for Gemini (it doesn't support multi-turn natively in REST, so we flatten)
    const history = messages.slice(0, -1).map((m: any) =>
      `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
    ).join('\n\n');

    const lastMsg = messages[messages.length - 1].content;
    const prompt = history
      ? `Previous conversation:\n${history}\n\nStudent's new question: ${lastMsg}`
      : lastMsg;

    const subjectCtx = subject ? `\nFocus subject: ${subject}` : '';
    const reply = await gemini(prompt, SYSTEM + subjectCtx);

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { openrouterJSON } from '../../../../lib/openrouter';

const SYSTEM = `You are an AI that extracts key facts about a student from their tutoring conversation.
Extract only important, reusable facts like:
- Student's weak areas or topics they struggle with
- Their grade/class level or exam target (JEE, NEET, CBSE, etc.)
- Learning preferences (language, explanation style)
- Topics they've mastered
- Any personal context that helps tutoring

Return a JSON array of short fact strings. If no useful facts can be extracted, return an empty array [].
Maximum 5 facts per extraction. Be concise — each fact should be one short sentence.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length < 4) {
      return NextResponse.json({ facts: [] });
    }

    // Take the last 10 messages for context
    const recent = messages.slice(-10).map((m: any) =>
      `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
    ).join('\n');

    const prompt = `Extract key reusable facts about this student from the following conversation:\n\n${recent}\n\nReturn a JSON array of short fact strings.`;

    const facts = await openrouterJSON<string[]>(prompt, SYSTEM);
    return NextResponse.json({ facts: Array.isArray(facts) ? facts : [] });
  } catch (e: any) {
    // Memory extraction is non-critical, don't fail the whole flow
    return NextResponse.json({ facts: [] });
  }
}

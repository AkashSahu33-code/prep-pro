import { NextRequest, NextResponse } from 'next/server';
import { openrouterJSON } from '../../../lib/openrouter';

const SYSTEM = `You are an expert teacher. Generate study card content for a concept.
Return ONLY valid JSON, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, conceptName } = await req.json();

    const prompt = `Create a comprehensive study card for: "${conceptName}" (${subject} - ${topic})

Return this JSON:
{
  "definition": "Clear 1-2 sentence definition",
  "explanation": "Detailed explanation in simple language (3-5 sentences)",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "formula": "Main formula if applicable, else null",
  "example": "One concrete worked example",
  "mnemonics": "Memory trick or mnemonic if helpful, else null",
  "commonMistakes": ["mistake 1", "mistake 2"],
  "relatedConcepts": ["concept 1", "concept 2"],
  "ncertRef": "NCERT chapter/page reference if known"
}`;

    const card = await openrouterJSON(prompt, SYSTEM);
    return NextResponse.json({ card });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { geminiJSON } from '../../../lib/gemini';

const SYSTEM = `You are an expert question paper setter for JEE, NEET, CBSE and UPSC exams.
Generate questions that exactly match PYQ (Previous Year Question) style and difficulty.
Return ONLY a valid JSON array. No explanation, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, difficulty, questionType, count, weakConcepts } = await req.json();

    const prompt = `Generate ${count || 5} ${difficulty} ${questionType} questions on ${subject} - ${topic}.
${weakConcepts ? `Target these weak concepts: ${weakConcepts}` : ''}

Return a JSON array (not wrapped in any object):
[
  {
    "id": 1,
    "question": "Full question text",
    "type": "mcq",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A",
    "explanation": "Detailed step-by-step solution explaining why A is correct and why others are wrong",
    "concept": "Underlying concept name",
    "difficulty": "${difficulty}",
    "pyqYear": "2023 JEE Mains" or null,
    "hints": ["First hint", "Second hint"]
  }
]

Rules:
- For MCQ: always 4 options labelled A) B) C) D)
- correct field is just the letter: "A", "B", "C", or "D"
- For fill/short: options can be null
- Make questions realistic exam-level, not too easy
- Explanation must be detailed enough to teach from scratch`;

    const questions = await geminiJSON<any[]>(prompt, SYSTEM);
    return NextResponse.json({ questions: Array.isArray(questions) ? questions : questions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

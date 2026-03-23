import { NextRequest, NextResponse } from 'next/server';
import { openrouterJSONWithRetry } from '../../../lib/openrouter';

const SYSTEM = `You are an expert question paper setter for JEE, NEET, CBSE and UPSC exams.
Generate questions that exactly match PYQ (Previous Year Question) style and difficulty.
Return ONLY a valid JSON array. No explanation, no markdown fences, no wrapping object.`;

interface RawQuestion {
  id?: number; question?: string; type?: string; options?: string[];
  correct?: string; explanation?: string; concept?: string;
  difficulty?: string; pyqYear?: string | null; hints?: string[];
}

function validateAndNormalize(raw: any[], count: number): RawQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, count).map((q: any, i: number) => ({
    id: i + 1,
    question: q.question || q.text || `Question ${i + 1}`,
    type: q.type || 'mcq',
    options: Array.isArray(q.options) ? q.options : null,
    correct: typeof q.correct === 'string' ? q.correct.trim().charAt(0).toUpperCase() : (q.answer || 'A'),
    explanation: q.explanation || q.solution || 'No explanation provided.',
    concept: q.concept || q.topic || 'General',
    difficulty: q.difficulty || 'medium',
    pyqYear: q.pyqYear || q.pyq_year || null,
    hints: Array.isArray(q.hints) ? q.hints : [],
  }));
}

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
- Explanation must be detailed enough to teach from scratch
- Return ONLY the JSON array, no other text`;

    const rawQuestions = await openrouterJSONWithRetry<any[]>(prompt, SYSTEM, 2);
    const questions = validateAndNormalize(rawQuestions, count || 5);

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Could not generate valid questions. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (e: any) {
    const message = e.message || 'Unknown error';
    if (message.includes('parse') || message.includes('JSON')) {
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again — this is usually a one-time issue.' }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

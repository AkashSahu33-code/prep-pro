import { NextRequest, NextResponse } from 'next/server';
import { openrouterJSON } from '../../../lib/openrouter';

const SYSTEM = `You are a study performance analyst. Analyse the student's learning data and return actionable insights.
Return ONLY valid JSON, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { concepts, sessions, weakSubjects } = await req.json();

    const prompt = `Analyse this student's study data and return insights as JSON:

Concepts tracked: ${JSON.stringify(concepts?.slice(0, 20))}
Total concepts: ${concepts?.length}
Recent sessions count: ${sessions?.length}
Weak subjects flagged: ${weakSubjects?.join(', ') || 'none'}

Return:
{
  "overallScore": 72,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": [
    { "priority": "high", "action": "Focus on X", "reason": "Because Y" }
  ],
  "studyPattern": "Morning studier, short sessions",
  "predictedRetention": "68%",
  "nextMilestone": "After 3 more reviews of Thermodynamics, you'll have it mastered",
  "motivationalMessage": "Short encouraging message in Hinglish"
}`;

    const insights = await openrouterJSON(prompt, SYSTEM);
    return NextResponse.json({ insights });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

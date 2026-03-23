import { NextRequest, NextResponse } from 'next/server';
import { openrouterJSON } from '../../../lib/openrouter';

const SYSTEM = `You are an expert study planner for Indian competitive exam students.
You create realistic, adaptive study schedules optimised around forgetting curves and spaced repetition principles.
Always return ONLY valid JSON matching the exact schema requested. No explanation, no markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const { subjects, examDate, hoursPerDay, weakAreas, completedTopics } = await req.json();

    const today = new Date().toISOString().split('T')[0];
    const daysLeft = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);

    const prompt = `Create a detailed study plan and return ONLY this JSON structure:
{
  "overview": "string",
  "daysLeft": ${daysLeft},
  "weeklyPlan": [
    {
      "week": 1,
      "theme": "string",
      "days": [
        {
          "day": "Monday",
          "date": "string",
          "sessions": [
            {
              "subject": "string",
              "topic": "string",
              "duration": 90,
              "type": "study|revision|practice|test",
              "priority": "high|medium|low",
              "notes": "string"
            }
          ],
          "totalHours": 3.5,
          "tip": "string"
        }
      ]
    }
  ],
  "strategies": ["string"],
  "milestones": [{ "week": 1, "goal": "string", "checkpoints": ["string"] }]
}

Student data:
- Subjects: ${subjects.join(', ')}
- Exam date: ${examDate} (${daysLeft} days from today: ${today})
- Hours per day: ${hoursPerDay}
- Weak areas: ${weakAreas || 'none specified'}
- Already completed: ${completedTopics || 'nothing yet'}

Generate ${Math.min(Math.ceil(daysLeft / 7), 4)} weeks. Prioritise weak areas. Include revision and mock tests in later weeks.`;

    const plan = await openrouterJSON(prompt, SYSTEM);
    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

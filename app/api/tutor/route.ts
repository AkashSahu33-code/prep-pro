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
- Keep answers clear, structured and at the student's level.
- IMPORTANT: When explaining concepts that involve processes, relationships, hierarchies, cycles, or comparisons, include a Mermaid diagram to visualize it. Use \`\`\`mermaid code blocks.
- Supported Mermaid types: flowchart (graph TD/LR), sequenceDiagram, classDiagram, stateDiagram-v2, pie, mindmap, timeline.
- Examples of when to use diagrams:
  - Biology: Cell division stages, metabolic pathways, food chains, organ systems
  - Physics: Circuit diagrams, force diagrams, process flows
  - Chemistry: Reaction mechanisms, periodic table relationships, bonding
  - Math: Solution flowcharts, geometric relationships
  - History: Timelines, cause-effect chains
- Keep Mermaid syntax simple and valid. Quote labels with special characters using brackets like ["Label text"].
- You can include multiple diagrams if needed for complex topics.`;


export async function POST(req: NextRequest) {
  try {
    const { messages, subject, memories, fileContext } = await req.json();

    // Build conversation context for Gemini (flatten multi-turn)
    const history = messages.slice(0, -1).map((m: any) =>
      `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
    ).join('\n\n');

    const lastMsg = messages[messages.length - 1].content;
    const prompt = history
      ? `Previous conversation:\n${history}\n\nStudent's new question: ${lastMsg}`
      : lastMsg;

    // Build enhanced system prompt
    let systemPrompt = SYSTEM;

    if (subject) {
      systemPrompt += `\nFocus subject: ${subject}`;
    }

    if (memories && Array.isArray(memories) && memories.length > 0) {
      const memoryLines = memories.slice(0, 15).map((m: string) => `- ${m}`).join('\n');
      systemPrompt += `\n\nKnown facts about this student (use these to personalize your responses):\n${memoryLines}`;
    }

    if (fileContext) {
      systemPrompt += `\n\nThe student has uploaded a document for reference. Here is the extracted content:\n---\n${fileContext}\n---\nUse this content to answer questions when relevant. Quote specific parts when answering.`;
    }

    const reply = await gemini(prompt, systemPrompt);

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

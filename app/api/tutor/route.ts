import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '../../../lib/openrouter';

const SYSTEM = `You are an expert AI tutor for Indian students (CBSE, JEE, NEET, UPSC).
You answer questions grounded in NCERT textbooks and standard educational sources.
Rules:
- Never hallucinate facts. If unsure, say "I'm not certain, please verify in your NCERT textbook."
- Use **bold** for key terms, numbered steps for problems.
- Give Indian context examples where relevant.
- For math/physics problems, show every step clearly.
- You may respond in Hinglish if the student writes in Hindi/Hinglish.
- Keep answers clear, structured and at the student's level.

- Examples of when to use diagrams:
  - Biology: Cell division stages, metabolic pathways, food chains, organ systems
  - Physics: Circuit diagrams, force diagrams, process flows
  - Chemistry: Reaction mechanisms, periodic table relationships, bonding
  - Math: Solution flowcharts, geometric relationships
  - History: Timelines, cause-effect chains
- EXTREMELY IMPORTANT: When visual illustrations, diagrams, or real-life examples would aid understanding, you MUST insert a visual description tag exactly like \`[IMAGE: detailed description of what should be drawn]\`.

- You can include multiple diagrams or images if needed.`;

// ---- Context Management Utilities ----

// Rough token estimation (~4 chars per token for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Hard limits for context management
const MAX_CONTEXT_TOKENS = 6000;    // Keep well within model limits
const SUMMARY_THRESHOLD = 12;       // Number of messages before we start summarizing
const RECENT_MESSAGES_KEEP = 6;     // Always keep the last N messages in full
const MAX_FILE_CONTEXT_CHARS = 4000; // Truncate file context if too long

// Summarize older messages into a brief context paragraph
async function summarizeOlderMessages(messages: { role: string; content: string }[]): Promise<string> {
  if (messages.length === 0) return '';

  const text = messages.map(m =>
    `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
  ).join('\n');

  // If the older messages are small enough, don't bother with AI summarization
  if (estimateTokens(text) < 400) {
    return text;
  }

  try {
    const summary = await openrouter(
      `Summarize this tutoring conversation into a brief paragraph (max 150 words). Focus on: topics discussed, key concepts taught, any problems being worked on, and the student's understanding level.\n\n${text.slice(0, 6000)}`,
      'You are a concise summarizer. Output only the summary paragraph, nothing else.'
    );
    return summary;
  } catch {
    // If summarization fails, do a manual trim: take first & last message of old section
    const first = `${messages[0].role === 'user' ? 'Student' : 'Tutor'}: ${messages[0].content.slice(0, 200)}...`;
    const last = `${messages[messages.length - 1].role === 'user' ? 'Student' : 'Tutor'}: ${messages[messages.length - 1].content.slice(0, 200)}...`;
    return `[Earlier conversation summary]\n${first}\n...(${messages.length - 2} messages omitted)...\n${last}`;
  }
}

// Trim individual message content if it's excessively long
function trimMessage(content: string, maxChars: number = 1500): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + '\n...[response truncated for context management]';
}

// Build optimized conversation context
async function buildContext(
  messages: { role: string; content: string }[],
  fileContext?: string,
  memories?: string[],
  subject?: string
): Promise<{ prompt: string; systemPrompt: string }> {

  let systemPrompt = SYSTEM;

  if (subject) {
    systemPrompt += `\nFocus subject: ${subject}`;
  }

  if (memories && Array.isArray(memories) && memories.length > 0) {
    const memoryLines = memories.slice(0, 15).map((m: string) => `- ${m}`).join('\n');
    systemPrompt += `\n\nKnown facts about this student (use these to personalize your responses):\n${memoryLines}`;
  }

  if (fileContext) {
    // Truncate file context if it's too large
    const trimmedFileContext = fileContext.length > MAX_FILE_CONTEXT_CHARS
      ? fileContext.slice(0, MAX_FILE_CONTEXT_CHARS) + '\n...[document truncated — ask the student to reference specific sections]'
      : fileContext;
    systemPrompt += `\n\nThe student has uploaded a document for reference. Here is the extracted content:\n---\n${trimmedFileContext}\n---\nUse this content to answer questions when relevant. Quote specific parts when answering.`;
  }

  const lastMsg = messages[messages.length - 1].content;
  const previousMessages = messages.slice(0, -1);

  // If conversation is short, use all messages directly (no trimming needed)
  if (previousMessages.length <= SUMMARY_THRESHOLD) {
    const history = previousMessages.map(m =>
      `${m.role === 'user' ? 'Student' : 'Tutor'}: ${trimMessage(m.content)}`
    ).join('\n\n');

    const prompt = history
      ? `Previous conversation:\n${history}\n\nStudent's new question: ${lastMsg}`
      : lastMsg;

    // Final safety check on total size
    const totalTokens = estimateTokens(systemPrompt) + estimateTokens(prompt);
    if (totalTokens <= MAX_CONTEXT_TOKENS) {
      return { prompt, systemPrompt };
    }
  }

  // For longer conversations: summarize older messages, keep recent ones in full
  const olderMessages = previousMessages.slice(0, -RECENT_MESSAGES_KEEP);
  const recentMessages = previousMessages.slice(-RECENT_MESSAGES_KEEP);

  // Trim each older message before summarizing
  const trimmedOlder = olderMessages.map(m => ({
    ...m,
    content: trimMessage(m.content, 500)
  }));

  const summary = await summarizeOlderMessages(trimmedOlder);

  const recentHistory = recentMessages.map(m =>
    `${m.role === 'user' ? 'Student' : 'Tutor'}: ${trimMessage(m.content)}`
  ).join('\n\n');

  let prompt = '';
  if (summary) {
    prompt += `[Summary of earlier conversation]\n${summary}\n\n`;
  }
  if (recentHistory) {
    prompt += `Recent conversation:\n${recentHistory}\n\n`;
  }
  prompt += `Student's new question: ${lastMsg}`;

  // Final safety: if still too large, aggressively trim
  let totalTokens = estimateTokens(systemPrompt) + estimateTokens(prompt);
  if (totalTokens > MAX_CONTEXT_TOKENS) {
    // Drop the summary and only keep last few messages
    const minimalHistory = previousMessages.slice(-3).map(m =>
      `${m.role === 'user' ? 'Student' : 'Tutor'}: ${trimMessage(m.content, 800)}`
    ).join('\n\n');
    prompt = minimalHistory
      ? `Recent conversation:\n${minimalHistory}\n\nStudent's new question: ${lastMsg}`
      : lastMsg;
  }

  return { prompt, systemPrompt };
}


export async function POST(req: NextRequest) {
  try {
    const { messages, subject, memories, fileContext } = await req.json();

    const { prompt, systemPrompt } = await buildContext(
      messages, fileContext, memories, subject
    );

    const reply = await openrouter(prompt, systemPrompt);

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

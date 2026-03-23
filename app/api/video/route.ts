import { NextRequest, NextResponse } from 'next/server';
import { openrouterJSON } from '../../../lib/openrouter';

const SYSTEM = `You are an expert educational content processor that creates structured study notes.
Extract and organise all educational content from the given video information.
Return ONLY valid JSON. No markdown, no explanation.`;

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Fetch transcript using youtube-transcript package via dynamic import
async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript');
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    return segments.map((s: any) => s.text).join(' ');
  } catch {
    return '';
  }
}

// Fetch video metadata from YouTube oEmbed (free, no key needed)
async function fetchVideoMeta(videoId: string): Promise<{ title: string; author: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const d = await res.json();
      return { title: d.title || '', author: d.author_name || '' };
    }
  } catch {}
  return { title: '', author: '' };
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, videoTitle, subject } = await req.json();

    const videoId = extractVideoId(videoUrl);
    let transcript = '';
    let meta = { title: videoTitle || '', author: '' };

    if (videoId) {
      const [t, m] = await Promise.all([fetchTranscript(videoId), fetchVideoMeta(videoId)]);
      transcript = t;
      if (!meta.title && m.title) meta = m;
    }

    const transcriptSection = transcript
      ? `\n\nVIDEO TRANSCRIPT (${transcript.length} chars):\n${transcript.slice(0, 12000)}`
      : `\n\nNo transcript available. Generate comprehensive notes based on the video title/topic.`;

    const prompt = `Process this educational YouTube video and return structured notes as JSON:

Video URL: ${videoUrl}
Video Title: ${meta.title || videoTitle || 'Unknown'}
Channel: ${meta.author || 'Unknown'}
Subject context: ${subject || 'auto-detect'}
${transcriptSection}

Return this exact JSON structure:
{
  "title": "Clean video title",
  "subject": "Detected subject",
  "duration": "Estimated duration string",
  "summary": "3-4 sentence executive summary of what this video teaches",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "conceptMap": [
    {
      "concept": "Concept name",
      "definition": "Clear definition",
      "examples": ["example 1", "example 2"],
      "relatedConcepts": ["related1", "related2"]
    }
  ],
  "structuredNotes": [
    {
      "section": "Section title",
      "timestamp": "0:00",
      "content": "Detailed paragraph notes for this section",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "formulas": ["formula if any, else empty"]
    }
  ],
  "flashcards": [
    { "front": "Term or question", "back": "Definition or answer" }
  ],
  "practiceQuestions": ["Question 1?", "Question 2?", "Question 3?"],
  "furtherReading": ["NCERT reference", "Book chapter"],
  "hindiSummary": "2-3 lines in Hinglish summarising the video for quick revision"
}

Generate at least 5 concept map entries, 4 structured note sections, 8 flashcards, 5 practice questions.`;

    const notes = await openrouterJSON(prompt, SYSTEM);
    return NextResponse.json({ notes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

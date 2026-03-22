// File text extraction utility — supports PDF, TXT, MD, CSV
// PDFs are processed via Gemini API (native multimodal support, no browser deps)
// Text files are read directly

const MAX_CHARS = 30000; // Cap to fit in Gemini context window
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export interface ParsedFile {
  text: string;
  filename: string;
  pageCount?: number;
  truncated: boolean;
}

async function extractPDFWithGemini(buffer: Buffer): Promise<{ text: string; pageCount?: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set — required for PDF processing');

  const base64 = buffer.toString('base64');

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
          { text: 'Extract ALL text content from this PDF document. Return the complete text exactly as it appears in reading order, preserving headings, paragraphs, lists, and table structure. Do NOT summarize, skip, or paraphrase any content.\n\nAdditionally, for any images, diagrams, charts, graphs, or figures found in the PDF:\n- Describe what the image/diagram shows in detail inside [IMAGE: ...] tags\n- For charts/graphs, describe the data points, axes, and trends\n- For diagrams, describe the components, connections, and labels\n- For photos, describe the relevant content\n\nExample: [IMAGE: A labeled diagram of the human heart showing four chambers - left atrium, right atrium, left ventricle, right ventricle, with arrows indicating blood flow direction]' }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PDF extraction failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Could not extract text from PDF. The file may be empty or image-only.');

  return { text };
}

export async function parseFileBuffer(buffer: Buffer, filename: string): Promise<ParsedFile> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  let text = '';
  let pageCount: number | undefined;

  switch (ext) {
    case 'pdf': {
      const result = await extractPDFWithGemini(buffer);
      text = result.text;
      pageCount = result.pageCount;
      break;
    }
    case 'txt':
    case 'md':
    case 'csv':
    case 'log':
    case 'json':
    case 'xml':
    case 'html': {
      text = buffer.toString('utf-8');
      break;
    }
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: PDF, TXT, MD, CSV, JSON, XML, HTML`);
  }

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  const truncated = text.length > MAX_CHARS;
  if (truncated) {
    text = text.slice(0, MAX_CHARS) + '\n\n[... content truncated for length ...]';
  }

  return { text, filename, pageCount, truncated };
}

export function getSupportedExtensions(): string[] {
  return ['pdf', 'txt', 'md', 'csv', 'log', 'json', 'xml', 'html'];
}

export function getAcceptString(): string {
  return '.pdf,.txt,.md,.csv,.log,.json,.xml,.html';
}

// File text extraction utility — supports PDF, TXT, MD, CSV
// PDFs are processed via Gemini 1.5 Flash for high quality multimodal extraction
// Text files are read directly

const MAX_CHARS = 30000;

export interface ParsedFile {
  text: string;
  filename: string;
  pageCount?: number;
  truncated: boolean;
}

async function extractPDFWithGemini(buffer: Buffer): Promise<{ text: string; pageCount?: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');

  // Convert buffer to base64
  const base64 = buffer.toString('base64');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Extract ALL text content from this PDF document.
Return the complete text exactly as it appears in reading order, preserving headings, paragraphs, lists, and table structure.
Do NOT summarize, skip, or paraphrase any content.

Additionally, for any images, diagrams, charts, graphs, or figures found in the PDF:
- Describe what the image/diagram shows in detail inside [IMAGE: ...] tags
- For charts/graphs, describe the data points, axes, and trends
- For diagrams, describe the components, connections, and labels
- For photos, describe the relevant content

Example: [IMAGE: A labeled diagram of the human heart showing four chambers - left atrium, right atrium, left ventricle, right ventricle, with arrows indicating blood flow direction]`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
      }
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini PDF extraction error:', err);
    throw new Error(`PDF extraction failed (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Could not extract text from PDF. The file may be empty or image-only without clear text.');
  }

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

  // Clean up excessive whitespace safely
  try {
    text = text.replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    text = text.trim();
  }

  const truncated = text.length > MAX_CHARS;
  if (truncated) {
    // Keep first 80%, last 20%
    const keepStart = Math.floor(MAX_CHARS * 0.8);
    const keepEnd = Math.floor(MAX_CHARS * 0.2);
    text = text.slice(0, keepStart) + 
           '\n\n... [content truncated for length] ...\n\n' + 
           text.slice(-keepEnd);
  }

  return { text, filename, pageCount, truncated };
}

export function getSupportedExtensions(): string[] {
  return ['pdf', 'txt', 'md', 'csv', 'log', 'json', 'xml', 'html'];
}

export function getAcceptString(): string {
  return '.pdf,.txt,.md,.csv,.log,.json,.xml,.html';
}

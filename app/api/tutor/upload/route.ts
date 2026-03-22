import { NextRequest, NextResponse } from 'next/server';
import { parseFileBuffer } from '../../../../lib/fileParser';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await parseFileBuffer(buffer, file.name);

    return NextResponse.json({
      text: result.text,
      filename: result.filename,
      pageCount: result.pageCount,
      truncated: result.truncated,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to parse file' }, { status: 500 });
  }
}

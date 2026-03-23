import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dubbing_id = searchParams.get('id');

    if (!dubbing_id) {
      return NextResponse.json({ error: 'Missing dubbing id' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_key_here') {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs Status Error:', errText);
      return NextResponse.json({ error: `Status check failed: ${errText}` }, { status: response.status });
    }

    const data = await response.json();

    // data contains: status ('dubbing' | 'dubbed' | 'failed'), target_languages, source_language, etc.
    return NextResponse.json({
      status: data.status,
      target_languages: data.target_languages,
      source_language: data.source_language,
      error: data.error || null,
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}

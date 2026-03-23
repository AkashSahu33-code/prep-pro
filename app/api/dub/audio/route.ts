import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dubbing_id = searchParams.get('id');
    const language_code = searchParams.get('lang');

    if (!dubbing_id || !language_code) {
      return NextResponse.json({ error: 'Missing dubbing id or language code' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_key_here') {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/dubbing/${dubbing_id}/audio/${language_code}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs Audio Error:', errText);
      return NextResponse.json({ error: `Audio fetch failed: ${errText}` }, { status: response.status });
    }

    // Stream the audio back to client
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error('Audio fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch audio' }, { status: 500 });
  }
}

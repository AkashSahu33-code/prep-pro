import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Language name -> ISO 639-1 code mapping
const languageMap: Record<string, string> = {
  'Hindi': 'hi',
  'Bengali': 'bn',
  'Kannada': 'kn',
  'Malayalam': 'ml',
  'Marathi': 'mr',
  'Odia': 'or',
  'Punjabi': 'pa',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Gujarati': 'gu',
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Chinese': 'zh',
  'Arabic': 'ar',
  'Russian': 'ru',
  'Turkish': 'tr',
  'Dutch': 'nl',
  'Polish': 'pl',
  'Indonesian': 'id',
  'Vietnamese': 'vi',
  'Thai': 'th',
  'Filipino': 'fil',
};

export async function POST(req: Request) {
  try {
    const { videoUrl, targetLanguage } = await req.json();

    if (!videoUrl || !targetLanguage) {
      return NextResponse.json({ error: 'Missing videoUrl or targetLanguage' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_key_here') {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured in .env.local' }, { status: 500 });
    }

    const targetLangCode = languageMap[targetLanguage] || 'hi';

    // Use FormData for ElevenLabs Dubbing API
    const formData = new FormData();
    formData.append('source_url', videoUrl);
    formData.append('source_lang', 'auto');
    formData.append('target_lang', targetLangCode);
    formData.append('num_speakers', '0'); // auto-detect speakers
    formData.append('watermark', 'true'); // Required for free-tier; set to 'false' on Creator+ plans
    formData.append('end_time', '5'); // Limit to first 20 seconds (~500 credits)

    const response = await fetch('https://api.elevenlabs.io/v1/dubbing', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs Dubbing API Error:', errText);
      return NextResponse.json({ error: `Dubbing API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();

    // ElevenLabs returns { dubbing_id, expected_duration_sec }
    return NextResponse.json({
      dubbing_id: data.dubbing_id,
      expected_duration_sec: data.expected_duration_sec,
    });

  } catch (error: any) {
    console.error('Dub initiation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start dubbing' }, { status: 500 });
  }
}

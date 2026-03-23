'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic2, Loader2, Volume2, Globe, Sparkles, CheckCircle2, AlertCircle, Clock, Download } from 'lucide-react';

type DubStatus = 'idle' | 'initiating' | 'dubbing' | 'dubbed' | 'failed';

// Language name -> ISO 639-1 code mapping (must match backend)
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

const LANGUAGE_GROUPS = {
  'Indic Languages': ['Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia'],
  'European Languages': ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Russian', 'Turkish'],
  'Asian Languages': ['Japanese', 'Korean', 'Chinese', 'Thai', 'Vietnamese', 'Indonesian', 'Filipino', 'Arabic'],
};

export default function AutoDub() {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [error, setError] = useState('');
  
  const [dubStatus, setDubStatus] = useState<DubStatus>('idle');
  const [dubbingId, setDubbingId] = useState<string | null>(null);
  const [expectedDuration, setExpectedDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Extract YouTube ID
  const getVideoId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Poll for dubbing status
  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/dub/status?id=${id}`);
        const data = await res.json();
        
        if (data.status === 'dubbed') {
          setDubStatus('dubbed');
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Fetch the dubbed audio
          const langCode = languageMap[language] || 'hi';
          const audioRes = await fetch(`/api/dub/audio?id=${id}&lang=${langCode}`);
          
          if (audioRes.ok) {
            const blob = await audioRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            setAudioUrl(blobUrl);
          } else {
            const errData = await audioRes.json().catch(() => ({ error: 'Failed to fetch audio' }));
            setError(errData.error || 'Failed to fetch dubbed audio');
            setDubStatus('failed');
          }
        } else if (data.status === 'failed') {
          setDubStatus('failed');
          setError(data.error || 'Dubbing failed. Please try again.');
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 5000);
  }, [language]);

  const handleProcess = async () => {
    if (!url.trim()) return;
    
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    
    setDubStatus('initiating');
    setError('');
    setAudioUrl(null);
    setElapsedTime(0);
    setDubbingId(null);
    
    try {
      const res = await fetch('/api/dub/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url, targetLanguage: language })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to start dubbing.');
        setDubStatus('failed');
        return;
      }
      
      if (data.dubbing_id) {
        setDubbingId(data.dubbing_id);
        setExpectedDuration(data.expected_duration_sec || 60);
        setDubStatus('dubbing');
        
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        
        startPolling(data.dubbing_id);
      } else {
        setError('No dubbing ID received. Check your API key.');
        setDubStatus('failed');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
      setDubStatus('failed');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = expectedDuration > 0
    ? Math.min(100, Math.round((elapsedTime / expectedDuration) * 100))
    : 0;

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sky-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mic2 size={20} color="var(--sky)" strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22 }}>Auto-Dub </h1>
            <span className="badge badge-blue">Beta</span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2 }}>
            Powered by ElevenLabs &bull; AI dubbing with voice cloning in 32+ languages
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24, fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Sparkles size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          This feature uses ElevenLabs AI to automatically dub YouTube videos &mdash; it clones the speaker&apos;s voice, 
          translates the content, and generates a dubbed audio track. 
          Mute the video and play the dubbed audio below for the best experience.
        </div>
      </div>

      {/* Input Controls */}
      <div className="card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>YouTube URL</label>
            <input className="input" placeholder="https://youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Target Language</label>
            <select className="input" value={language} onChange={e => setLanguage(e.target.value)} style={{ width: 160 }}>
              {Object.entries(LANGUAGE_GROUPS).map(([group, langs]) => (
                <optgroup label={group} key={group}>
                  {langs.map(lang => (
                    <option key={lang}>{lang}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleProcess} 
            disabled={dubStatus === 'initiating' || dubStatus === 'dubbing' || !url.trim()} 
            style={{ height: 42 }}
          >
            {dubStatus === 'initiating' ? <><Loader2 size={14} className="spin" /> Starting...</> 
             : dubStatus === 'dubbing' ? <><Loader2 size={14} className="spin" /> Dubbing...</>
             : <><Globe size={14} /> Generate Dub</>}
          </button>
        </div>
        {error && <p style={{ color: 'var(--rose)', fontSize: 13, marginTop: 12 }}>{error}</p>}
      </div>

      {/* Dubbing Progress */}
      {(dubStatus === 'dubbing' || dubStatus === 'initiating') && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="pulse-soft" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sky)' }} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {dubStatus === 'initiating' ? 'Initializing dubbing engine...' : 'AI is dubbing your video...'}
            </span>
          </div>
          
          {dubStatus === 'dubbing' && (
            <>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-3)', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ 
                  height: '100%', 
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, var(--sky), var(--accent))',
                  width: `${progressPercent}%`,
                  transition: 'width 1s linear'
                }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Elapsed: {formatTime(elapsedTime)}
                </span>
                <span>Est. ~{formatTime(Math.ceil(expectedDuration))} total</span>
              </div>
            </>
          )}
          
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            ElevenLabs is transcribing, translating to {language}, and cloning the speaker&apos;s voice. 
            This usually takes 1-3 minutes depending on video length.
          </div>
        </div>
      )}

      {/* Dubbing Complete - Video + Audio Player */}
      {dubStatus === 'dubbed' && audioUrl && videoId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Video + Audio Area */}
          <div>
            {/* YouTube embed via iframe - always works */}
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'black' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
              />
            </div>
            
            {/* Dubbed Audio Player */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--sky)', fontSize: 13 }}>
                <Volume2 size={14} /> 
                Dubbed Audio ({language})
              </div>
              <audio 
                controls 
                src={audioUrl} 
                style={{ width: '100%', borderRadius: 8 }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8 }}>
                💡 Tip: Mute the YouTube video above, then play this dubbed audio track for the full experience.
              </p>
            </div>
          </div>

          {/* Info Panel */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="section-label" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', margin: 0 }}>
              Dub Info
            </div>
            
            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13 }}>
                <CheckCircle2 size={16} /> Dubbing Complete
              </div>
              
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>Language:</strong> {language}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>Duration:</strong> {formatTime(Math.ceil(expectedDuration))}
                </div>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Engine:</strong> ElevenLabs AI
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                {/* Download button */}
                <a 
                  href={audioUrl} 
                  download={`dubbed_${language.toLowerCase()}.mp3`}
                  className="btn btn-secondary"
                  style={{ textAlign: 'center', textDecoration: 'none', fontSize: 13, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Download size={14} /> Download Dubbed Audio
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failed state */}
      {dubStatus === 'failed' && (
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'var(--rose)' }}>
          <AlertCircle size={20} color="var(--rose)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Dubbing Failed</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{error || 'An unexpected error occurred. Please try again.'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

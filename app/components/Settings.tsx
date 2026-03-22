'use client';
import { useState, useEffect } from 'react';
import { getStorageData, setStorageData } from '../../lib/store';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const k = getStorageData<string>('gemini_key_hint', '');
    setSavedKey(k);
  }, []);

  const saveKey = () => {
    // Note: in production, the key lives in .env.local server-side
    // This just stores a hint for the UI
    setStorageData('gemini_key_hint', apiKey ? '••••••••' + apiKey.slice(-4) : '');
    setSavedKey(apiKey ? '••••••••' + apiKey.slice(-4) : '');
    setApiKey('');
    alert('Note: The API key must be set in .env.local on the server side. See setup instructions below.');
  };

  const clearData = () => {
    if (confirm('Clear ALL study data (concepts, sessions, plans)? This cannot be undone.')) {
      ['concepts', 'sessions', 'streak', 'planner_data'].forEach(k => localStorage.removeItem(k));
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>⚙️ Settings</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Configure your StudyAI app</p>
      </div>

      {/* API Setup */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 6 }}>🔑 API Key Setup</h3>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
          StudyAI uses <strong style={{ color: 'var(--accent-2)' }}>Google Gemini 1.5 Flash</strong> — completely free with 1,500 requests/day and 1M tokens/minute.
        </p>

        <div style={{ padding: 16, background: 'var(--bg-3)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--accent-2)' }}>Setup Instructions</div>
          <ol style={{ paddingLeft: 18, color: 'var(--text-2)', fontSize: 13, lineHeight: 2 }}>
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>aistudio.google.com/app/apikey</a></li>
            <li>Sign in with your Google account (free)</li>
            <li>Click <strong style={{ color: 'var(--text)' }}>"Create API Key"</strong></li>
            <li>Create a file <code style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4, color: 'var(--green)' }}>.env.local</code> in your project root</li>
            <li>Add this line: <code style={{ background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 4, color: 'var(--green)' }}>GEMINI_API_KEY=your_key_here</code></li>
            <li>Restart the dev server: <code style={{ background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 4, color: 'var(--green)' }}>npm run dev</code></li>
          </ol>
        </div>

        <div style={{ padding: 14, background: 'var(--accent-glow)', borderRadius: 8, border: '1px solid rgba(124,106,247,0.2)', fontSize: 13, color: 'var(--text-2)' }}>
          <strong style={{ color: 'var(--accent-2)' }}>Free Tier Limits:</strong> 15 requests/min • 1,500 requests/day • 1M tokens/min — more than enough for daily studying!
        </div>
      </div>

      {/* Free Services */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>🆓 Free Services Used</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'Google Gemini 1.5 Flash', use: 'AI Tutor, Questions, Planner, Video Notes, Concept Cards', free: '1500 req/day', color: 'var(--blue)' },
            { name: 'YouTube oEmbed API', use: 'Video title & metadata extraction', free: 'Unlimited', color: 'var(--red)' },
            { name: 'youtube-transcript (npm)', use: 'Real transcript extraction from YouTube', free: 'No API key needed', color: 'var(--amber)' },
            { name: 'localStorage (Browser)', use: 'Concepts, sessions, study data persistence', free: '5–10 MB', color: 'var(--green)' },
            { name: 'Web Speech API (Browser)', use: 'Text-to-speech for study cards', free: 'Browser built-in', color: 'var(--accent)' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.use}</div>
              </div>
              <span className="badge badge-green" style={{ flexShrink: 0 }}>{s.free}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>💾 Data Management</h3>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16 }}>All your study data is stored locally in your browser. No accounts, no cloud, no tracking.</p>
        {cleared && <div style={{ padding: 10, background: 'var(--green-dim)', borderRadius: 8, fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>✓ All data cleared successfully.</div>}
        <button className="btn-secondary" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={clearData}>
          🗑 Clear All Study Data
        </button>
      </div>

      {/* About */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 12 }}>ℹ️ About StudyAI</h3>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
          <p>StudyAI is a full-stack Next.js application implementing all 5 modules from the hackathon brief:</p>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '🔁 Spaced Repetition Engine — SM-2 algorithm, knowledge graph, AI study cards',
              '📅 Autonomous Study Planner — AI-generated week-by-week schedules',
              '⚡ Practice & Question Generator — PYQ-pattern MCQs with explanations',
              '🤖 AI Tutor with RAG — NCERT-grounded doubt solving in English/Hinglish',
              '🎬 Video Content Processor — YouTube transcript → structured notes + flashcards',
            ].map((f, i) => <div key={i} style={{ padding: '6px 10px', background: 'var(--bg-3)', borderRadius: 6, fontSize: 12 }}>{f}</div>)}
          </div>
          <p style={{ marginTop: 12 }}>Built with: Next.js 15 · TypeScript · Gemini 1.5 Flash API · youtube-transcript · localStorage</p>
        </div>
      </div>
    </div>
  );
}

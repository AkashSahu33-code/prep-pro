'use client';
import { useState } from 'react';
import { SUBJECTS } from '../../lib/store';
import { exportToMarkdown, downloadAsMarkdown, downloadAsJSON } from '../../lib/export';
import { speak, stopSpeaking } from '../../lib/tts';

interface VideoNotes {
  title: string; subject: string; duration: string; summary: string;
  keyTopics: string[];
  conceptMap: { concept: string; definition: string; examples: string[]; relatedConcepts: string[] }[];
  structuredNotes: { section: string; timestamp: string; content: string; keyPoints: string[]; formulas: string[] }[];
  flashcards: { front: string; back: string }[];
  practiceQuestions: string[];
  furtherReading: string[];
  hindiSummary: string;
}

export default function VideoProcessor() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Auto-detect');
  const [notes, setNotes] = useState<VideoNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'concepts' | 'practice'>('notes');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [showFlashBack, setShowFlashBack] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory] = useState<{ url: string; title: string; subject: string }[]>([]);

  const process = async () => {
    if (!url.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url, videoTitle: title, subject }),
      });
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
        setActiveTab('notes');
        setHistory(prev => [{ url, title: data.notes.title, subject: data.notes.subject }, ...prev.slice(0, 4)]);
      } else setError(data.error || 'Failed to process video');
    } catch { setError('Network error — check your connection'); }
    setLoading(false);
  };

  const handleSpeak = (text: string) => {
    if (speaking) { stopSpeaking(); setSpeaking(false); }
    else { speak(text, 'en-IN'); setSpeaking(true); setTimeout(() => setSpeaking(false), text.length * 60); }
  };

  const handleExportMD = () => {
    if (!notes) return;
    downloadAsMarkdown(exportToMarkdown(notes), `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`);
  };

  const handleExportJSON = () => {
    if (!notes) return;
    downloadAsJSON(notes, `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.json`);
  };

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>🎬 Multimodal Content Processor</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>YouTube URL → real transcript extraction → structured notes, flashcards, concept maps</p>
      </div>

      {/* Input card */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>YouTube Video URL *</label>
            <input className="input" placeholder="https://youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && process()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Video Title / Topic (improves accuracy)</label>
              <input className="input" placeholder="e.g., Newton's Laws — Class 11 Physics" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Subject</label>
              <select className="input" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: 160 }}>
                <option>Auto-detect</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
          <button className="btn-primary" onClick={process} disabled={loading || !url.trim()} style={{ justifyContent: 'center' }}>
            {loading
              ? <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /><span style={{ marginLeft: 10 }}>Fetching transcript & generating notes...</span></>
              : '🎬 Process Video'}
          </button>
        </div>
      </div>

      {/* History pills */}
      {history.length > 0 && !notes && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Syne', textTransform: 'uppercase' }}>Recent</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setUrl(h.url); setTitle(h.title); setSubject(h.subject); }}
                style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12 }}>
                🎬 {h.title.slice(0, 30)}
              </button>
            ))}
          </div>
        </div>
      )}

      {notes && (
        <div>
          {/* Video header */}
          <div style={{ marginBottom: 20, padding: 20, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎬</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, marginBottom: 6 }}>{notes.title}</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="badge badge-blue">{notes.subject}</span>
                  <span className="badge badge-purple">{notes.duration}</span>
                  {notes.keyTopics?.slice(0, 4).map((t, i) => <span key={i} className="badge badge-green" style={{ fontSize: 11 }}>{t}</span>)}
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>{notes.summary}</p>
                {notes.hindiSummary && (
                  <div style={{ padding: '8px 12px', background: 'var(--amber-dim)', borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 600 }}>🇮🇳 </span>
                    <span style={{ color: 'var(--text-2)' }}>{notes.hindiSummary}</span>
                  </div>
                )}
              </div>
              {/* Export controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleExportMD}>⬇ .md</button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleExportJSON}>⬇ .json</button>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px', border: '1px solid var(--border)' }} onClick={() => setNotes(null)}>✕ Clear</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[
              { id: 'notes', label: '📝 Notes' },
              { id: 'flashcards', label: `🃏 Flashcards (${notes.flashcards?.length || 0})` },
              { id: 'concepts', label: `🗺 Concepts (${notes.conceptMap?.length || 0})` },
              { id: 'practice', label: `❓ Practice (${notes.practiceQuestions?.length || 0})` },
            ].map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id as any)}>{t.label}</button>
            ))}
          </div>

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {notes.structuredNotes?.map((s, i) => (
                <div key={i} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ fontSize: 16 }}>{s.section}</h3>
                      {s.timestamp && <span className="badge badge-purple" style={{ fontSize: 11 }}>⏱ {s.timestamp}</span>}
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => handleSpeak(s.content)}>
                      {speaking ? '⏹ Stop' : '🔊 Listen'}
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>{s.content}</p>
                  {s.keyPoints?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent-2)', marginBottom: 6, textTransform: 'uppercase' }}>Key Points</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {s.keyPoints.map((p, pi) => (
                          <div key={pi} style={{ padding: '6px 10px', background: 'var(--bg-3)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', borderLeft: '2px solid var(--accent)' }}>
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.formulas?.filter(f => f).length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontFamily: 'Syne', fontWeight: 700, color: 'var(--green)', marginBottom: 6, textTransform: 'uppercase' }}>Formulas</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {s.formulas.filter(f => f).map((f, fi) => (
                          <code key={fi} style={{ padding: '5px 10px', background: 'var(--bg-3)', borderRadius: 6, fontSize: 13, color: 'var(--green)', border: '1px solid rgba(52,211,153,0.2)' }}>{f}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {notes.furtherReading?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 12 }}>📚 Further Reading</h3>
                  {notes.furtherReading.map((r, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: i < notes.furtherReading.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13, color: 'var(--text-2)' }}>→ {r}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flashcards tab */}
          {activeTab === 'flashcards' && (
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              {notes.flashcards?.length > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: 13, marginBottom: 12 }}>
                    <span>Card {flashcardIdx + 1} / {notes.flashcards.length}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => handleSpeak(showFlashBack ? notes.flashcards[flashcardIdx].back : notes.flashcards[flashcardIdx].front)}>
                        🔊 Listen
                      </button>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setFlashcardIdx(0); setShowFlashBack(false); }}>Reset</button>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 20 }}>
                    <div className="progress-fill" style={{ width: `${((flashcardIdx + 1) / notes.flashcards.length) * 100}%` }} />
                  </div>
                  <div onClick={() => setShowFlashBack(!showFlashBack)}
                    style={{ padding: 40, background: 'var(--surface)', border: `2px solid ${showFlashBack ? 'var(--green)' : 'var(--border)'}`, borderRadius: 16, cursor: 'pointer', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 20, fontFamily: 'Syne', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {showFlashBack ? '✓ Answer' : 'Question'} — tap to flip
                    </div>
                    <p style={{ fontSize: 18, lineHeight: 1.6, color: showFlashBack ? 'var(--green)' : 'var(--text)' }}>
                      {showFlashBack ? notes.flashcards[flashcardIdx].back : notes.flashcards[flashcardIdx].front}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} disabled={flashcardIdx === 0}
                      onClick={() => { setFlashcardIdx(i => i - 1); setShowFlashBack(false); }}>← Prev</button>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={flashcardIdx === notes.flashcards.length - 1}
                      onClick={() => { setFlashcardIdx(i => i + 1); setShowFlashBack(false); }}>Next →</button>
                  </div>
                </>
              ) : <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No flashcards generated.</p>}
            </div>
          )}

          {/* Concepts tab */}
          {activeTab === 'concepts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {notes.conceptMap?.map((c, i) => (
                <div key={i} className="card" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--accent-2)', marginBottom: 8 }}>{c.concept}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>{c.definition}</p>
                  {c.examples?.length > 0 && (
                    <div style={{ marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-3)', fontFamily: 'Syne', fontWeight: 600 }}>EG: </span>
                      <span style={{ color: 'var(--green)' }}>{c.examples.join(', ')}</span>
                    </div>
                  )}
                  {c.relatedConcepts?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {c.relatedConcepts.map((r, ri) => <span key={ri} className="badge badge-blue" style={{ fontSize: 11 }}>{r}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Practice tab */}
          {activeTab === 'practice' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Practice Questions from this Video</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.practiceQuestions?.map((q, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: '3px solid var(--accent)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent-2)', fontSize: 13, flexShrink: 0 }}>Q{i + 1}</span>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

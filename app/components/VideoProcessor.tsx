'use client';
import { useState } from 'react';
import { SUBJECTS } from '../../lib/store';
import { exportToMarkdown, downloadAsMarkdown, downloadAsJSON } from '../../lib/export';
import { speak, stopSpeaking } from '../../lib/tts';
import {
  Video, Loader2, Download, X, ChevronLeft, ChevronRight,
  Volume2, VolumeX, RotateCcw, BookOpen, LayoutList, FileQuestion, Map
} from 'lucide-react';

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
  const [url, setUrl]           = useState('');
  const [title, setTitle]       = useState('');
  const [subject, setSubject]   = useState('Auto-detect');
  const [notes, setNotes]       = useState<VideoNotes | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'concepts' | 'practice'>('notes');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [showFlashBack, setShowFlashBack] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory]   = useState<{ url: string; title: string; subject: string }[]>([]);

  const process = async () => {
    if (!url.trim()) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoUrl: url, videoTitle: title, subject }) });
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes); setActiveTab('notes');
        setHistory(prev => [{ url, title: data.notes.title, subject: data.notes.subject }, ...prev.slice(0, 4)]);
      } else setError(data.error || 'Failed to process video. Try a different URL.');
    } catch { setError('Network error — check your connection.'); }
    setLoading(false);
  };

  const handleSpeak = (text: string) => {
    if (speaking) { stopSpeaking(); setSpeaking(false); }
    else { speak(text, 'en-IN'); setSpeaking(true); setTimeout(() => setSpeaking(false), text.length * 60); }
  };

  const TABS = [
    { id: 'notes',     label: 'Notes',     icon: LayoutList   },
    { id: 'flashcards',label: 'Flashcards',icon: BookOpen,  count: notes?.flashcards?.length },
    { id: 'concepts',  label: 'Concepts',  icon: Map,       count: notes?.conceptMap?.length },
    { id: 'practice',  label: 'Practice',  icon: FileQuestion, count: notes?.practiceQuestions?.length },
  ] as const;

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--rose-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Video size={20} color="var(--rose)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontSize: 22 }}>Lecture Digest</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2 }}>
            YouTube URL → real transcript → structured notes, flashcards &amp; concept maps
          </p>
        </div>
      </div>

      {/* Input card */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>YouTube URL *</label>
            <input className="input" placeholder="https://youtube.com/watch?v=..."
              value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && process()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Title / Topic (improves accuracy)</label>
              <input className="input" placeholder="e.g., Newton's Laws — Class 11 Physics" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Subject</label>
              <select className="input" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: 160 }}>
                <option>Auto-detect</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--rose-dim)', borderRadius: 9, color: 'var(--rose)', fontSize: 13, border: '1px solid rgba(244,63,94,0.2)' }}>
              {error}
            </div>
          )}
          <button className="btn btn-primary" onClick={process} disabled={loading || !url.trim()} style={{ justifyContent: 'center' }}>
            {loading
              ? <><Loader2 size={14} className="spin" /> Fetching transcript &amp; generating notes...</>
              : <><Video size={14} /> Process Video</>}
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && !notes && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 9 }}>Recent</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setUrl(h.url); setTitle(h.title); setSubject(h.subject); }} style={{ padding: '5px 13px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Video size={12} strokeWidth={2} /> {h.title.slice(0, 32)}
              </button>
            ))}
          </div>
        </div>
      )}

      {notes && (
        <div>
          {/* Video meta */}
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--rose-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(244,63,94,0.2)' }}>
                <Video size={20} color="var(--rose)" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>{notes.title}</h2>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 11 }}>
                  <span className="badge badge-blue">{notes.subject}</span>
                  <span className="badge badge-purple">{notes.duration}</span>
                  {notes.keyTopics?.slice(0, 4).map((t, i) => <span key={i} className="badge badge-green" style={{ fontSize: 11 }}>{t}</span>)}
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.7, marginBottom: notes.hindiSummary ? 12 : 0 }}>{notes.summary}</p>
                {notes.hindiSummary && (
                  <div style={{ padding: '9px 14px', background: 'var(--amber-dim)', borderRadius: 9, fontSize: 13.5, color: 'var(--text-2)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 600, marginRight: 6 }}>HI:</span>{notes.hindiSummary}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { if (notes) downloadAsMarkdown(exportToMarkdown(notes), `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`); }}>
                  <Download size={13} /> .md
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { if (notes) downloadAsJSON(notes, `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.json`); }}>
                  <Download size={13} /> .json
                </button>
                <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }} onClick={() => setNotes(null)}>
                  <X size={13} /> Clear
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <t.icon size={13} strokeWidth={2} />
                {t.label}
                {'count' in t && typeof t.count === 'number' && t.count > 0 && (
                  <span style={{ fontSize: 10, background: 'var(--accent-dim)', color: 'var(--accent-h)', borderRadius: 100, padding: '1px 6px', marginLeft: 2 }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {notes.structuredNotes?.map((s, i) => (
                <div key={i} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ fontSize: 15 }}>{s.section}</h3>
                      {s.timestamp && <span className="badge badge-purple" style={{ fontSize: 11 }}>{s.timestamp}</span>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleSpeak(s.content)} style={{ gap: 5 }}>
                      {speaking ? <><VolumeX size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.8, marginBottom: 14 }}>{s.content}</p>
                  {s.keyPoints?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="section-label" style={{ color: 'var(--accent-h)', marginBottom: 8 }}>Key Points</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {s.keyPoints.map((p, pi) => (
                          <div key={pi} style={{ padding: '7px 12px', background: 'var(--bg-3)', borderRadius: 7, fontSize: 13, color: 'var(--text-2)', borderLeft: '2px solid var(--accent)' }}>{p}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.formulas?.filter(f => f).length > 0 && (
                    <div>
                      <div className="section-label" style={{ color: 'var(--emerald)', marginBottom: 7 }}>Formulas</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {s.formulas.filter(f => f).map((f, fi) => (
                          <code key={fi} style={{ padding: '5px 10px', background: 'var(--bg-3)', borderRadius: 7, fontSize: 13, color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'JetBrains Mono' }}>{f}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {notes.furtherReading?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <BookOpen size={15} color="var(--text-2)" strokeWidth={2} />
                    <h3 style={{ fontSize: 14 }}>Further Reading</h3>
                  </div>
                  {notes.furtherReading.map((r, i) => (
                    <div key={i} style={{ padding: '7px 0', borderBottom: i < notes.furtherReading.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13, color: 'var(--text-2)' }}>
                      — {r}
                    </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: 12.5, marginBottom: 10 }}>
                    <span>Card {flashcardIdx + 1} / {notes.flashcards.length}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleSpeak(showFlashBack ? notes.flashcards[flashcardIdx].back : notes.flashcards[flashcardIdx].front)}>
                        {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setFlashcardIdx(0); setShowFlashBack(false); }}>
                        <RotateCcw size={13} /> Reset
                      </button>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 20 }}>
                    <div className="progress-fill" style={{ width: `${((flashcardIdx + 1) / notes.flashcards.length) * 100}%` }} />
                  </div>
                  <div onClick={() => setShowFlashBack(!showFlashBack)} style={{ padding: 40, background: 'var(--surface)', border: `2px solid ${showFlashBack ? 'var(--emerald)' : 'var(--border)'}`, borderRadius: 16, cursor: 'pointer', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s' }}>
                    <div className="section-label" style={{ marginBottom: 20, color: showFlashBack ? 'var(--emerald)' : 'var(--text-3)' }}>
                      {showFlashBack ? 'Answer' : 'Question'} — tap to flip
                    </div>
                    <p style={{ fontSize: 18, lineHeight: 1.6, color: showFlashBack ? 'var(--emerald)' : 'var(--text)' }}>
                      {showFlashBack ? notes.flashcards[flashcardIdx].back : notes.flashcards[flashcardIdx].front}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} disabled={flashcardIdx === 0}
                      onClick={() => { setFlashcardIdx(i => i - 1); setShowFlashBack(false); }}>
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={flashcardIdx === notes.flashcards.length - 1}
                      onClick={() => { setFlashcardIdx(i => i + 1); setShowFlashBack(false); }}>
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              ) : <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No flashcards were generated for this video.</p>}
            </div>
          )}

          {/* Concepts tab */}
          {activeTab === 'concepts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {notes.conceptMap?.map((c, i) => (
                <div key={i} className="card" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--accent-h)', marginBottom: 8 }}>{c.concept}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>{c.definition}</p>
                  {c.examples?.length > 0 && (
                    <div style={{ marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>e.g. </span>
                      <span style={{ color: 'var(--emerald)' }}>{c.examples.join(', ')}</span>
                    </div>
                  )}
                  {c.relatedConcepts?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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
              <h3 style={{ fontSize: 14, marginBottom: 16 }}>Practice Questions from this Video</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.practiceQuestions?.map((q, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 9, borderLeft: '3px solid var(--accent)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--accent-h)', fontSize: 13, flexShrink: 0 }}>Q{i + 1}</span>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{q}</p>
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

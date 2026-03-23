'use client';
import { useState, useEffect } from 'react';
import { Concept, calculateNextReview, getStorageData, setStorageData, SUBJECTS, TOPICS } from '../../lib/store';
import {
  BrainCircuit, Plus, BarChart2, Clock, CheckCircle2,
  Percent, Trash2, ChevronDown, ChevronUp, Loader2, BookOpen
} from 'lucide-react';

const QUALITY_OPTIONS = [
  { q: 0, label: 'Blackout',  color: '#f43f5e' },
  { q: 1, label: 'Very Hard', color: '#f97316' },
  { q: 2, label: 'Hard',      color: '#f59e0b' },
  { q: 3, label: 'Good',      color: '#84cc16' },
  { q: 4, label: 'Easy',      color: '#22c55e' },
  { q: 5, label: 'Perfect',   color: '#10b981' },
];

interface ConceptCard {
  definition: string; explanation: string; keyPoints: string[];
  formula: string | null; example: string; mnemonics: string | null;
  commonMistakes: string[]; relatedConcepts: string[]; ncertRef: string;
}

export default function SpacedRepetition() {
  const [concepts, setConcepts]     = useState<Concept[]>([]);
  const [view, setView]             = useState<'overview' | 'review' | 'add'>('overview');
  const [reviewIdx, setReviewIdx]   = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardData, setCardData]     = useState<Record<string, ConceptCard>>({});
  const [loadingCard, setLoadingCard] = useState(false);
  const [newConcept, setNewConcept] = useState({ subject: 'Physics', topic: '', name: '', notes: '' });
  const [adding, setAdding]         = useState(false);
  const [filterSubject, setFilterSubject] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = getStorageData<any[]>('concepts', []);
    if (saved.length === 0) {
      const now = new Date();
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow  = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
      const dummyConcepts: Concept[] = [
        { id:'1',  name:"Newton's First Law",       subject:'Physics',      topic:'Mechanics',            notes:'Law of Inertia',                    lastStudied:new Date(now.getTime()-2*86400000), nextReview:new Date(now.getTime()+5*86400000), interval:7,  easeFactor:2.6, repetitions:4, quality:5 },
        { id:'2',  name:"Kinematics Equations",     subject:'Physics',      topic:'Mechanics',            notes:'v=u+at, s=ut+½at²',                lastStudied:new Date(now.getTime()-7*86400000), nextReview:yesterday,                         interval:6,  easeFactor:2.3, repetitions:3, quality:3 },
        { id:'3',  name:"Ohm's Law",                subject:'Physics',      topic:'Electromagnetism',      notes:'V=IR',                             lastStudied:new Date(now.getTime()-14*86400000),nextReview:new Date(now.getTime()+10*86400000),interval:24, easeFactor:2.7, repetitions:6, quality:4 },
        { id:'4',  name:"Mitochondria Function",    subject:'Biology',      topic:'Cell Biology',         notes:'ATP production via cellular respiration',lastStudied:new Date(now.getTime()-3*86400000), nextReview:new Date(now.getTime()+2*86400000), interval:5,  easeFactor:2.5, repetitions:3, quality:4 },
        { id:'5',  name:"Mitosis vs Meiosis",       subject:'Biology',      topic:'Cell Biology',         notes:'Somatic vs Germ cells',             lastStudied:yesterday,                          nextReview:now,                               interval:1,  easeFactor:1.9, repetitions:1, quality:2 },
        { id:'6',  name:"Photosynthesis Stages",    subject:'Biology',      topic:'Plant Physiology',     notes:'Light & Dark reactions',            lastStudied:yesterday,                          nextReview:tomorrow,                          interval:2,  easeFactor:2.4, repetitions:2, quality:4 },
        { id:'7',  name:"Haber Process",            subject:'Chemistry',    topic:'Industrial Chemistry', notes:'N2 + 3H2 → 2NH3',                 lastStudied:new Date(now.getTime()-5*86400000), nextReview:yesterday,                         interval:4,  easeFactor:2.2, repetitions:2, quality:3 },
        { id:'8',  name:"Le Chatelier's Principle", subject:'Chemistry',    topic:'Physical Chemistry',   notes:'Equilibrium shifts under stress',   lastStudied:new Date(now.getTime()-2*86400000), nextReview:new Date(now.getTime()+4*86400000), interval:6,  easeFactor:2.6, repetitions:3, quality:5 },
        { id:'9',  name:"SN1 vs SN2 Reactions",     subject:'Chemistry',    topic:'Organic Chemistry',    notes:'Nucleophilic substitution mechanisms',lastStudied:now,                               nextReview:now,                               interval:1,  easeFactor:2.5, repetitions:0, quality:0 },
        { id:'10', name:"Integration by Parts",     subject:'Mathematics',  topic:'Calculus',             notes:'ILATE rule',                        lastStudied:yesterday,                          nextReview:now,                               interval:1,  easeFactor:2.1, repetitions:1, quality:2 },
        { id:'11', name:"Bayes' Theorem",           subject:'Mathematics',  topic:'Probability',          notes:"P(A|B) = P(B|A)P(A)/P(B)",         lastStudied:new Date(now.getTime()-10*86400000),nextReview:new Date(now.getTime()+5*86400000), interval:15, easeFactor:2.5, repetitions:4, quality:4 },
        { id:'12', name:"Matrix Determinants",      subject:'Mathematics',  topic:'Algebra',              notes:'Cross-multiplication rule',          lastStudied:new Date(now.getTime()-30*86400000),nextReview:new Date(now.getTime()+20*86400000),interval:50, easeFactor:3.0, repetitions:8, quality:5 },
        { id:'13', name:"El Niño Phenomenon",       subject:'Geography',    topic:'Climatology',          notes:'Warming of central/eastern Pacific', lastStudied:new Date(now.getTime()-2*86400000), nextReview:now,                               interval:2,  easeFactor:2.3, repetitions:2, quality:3 },
        { id:'14', name:"Fundamental Rights",       subject:'Polity',       topic:'Constitution',         notes:'Part III, Articles 12-35',          lastStudied:new Date(now.getTime()-12*86400000),nextReview:new Date(now.getTime()+8*86400000), interval:20, easeFactor:2.7, repetitions:5, quality:5 },
      ];
      setConcepts(dummyConcepts);
      setStorageData('concepts', dummyConcepts);
    } else {
      setConcepts(saved.map(c => ({ ...c, nextReview: new Date(c.nextReview), lastStudied: new Date(c.lastStudied) })));
    }
  }, []);

  const save = (updated: Concept[]) => { setConcepts(updated); setStorageData('concepts', updated); };

  const fetchCard = async (concept: Concept) => {
    if (cardData[concept.id]) return;
    setLoadingCard(true);
    try {
      const res = await fetch('/api/concept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: concept.subject, topic: concept.topic, conceptName: concept.name }),
      });
      const data = await res.json();
      if (data.card) setCardData(prev => ({ ...prev, [concept.id]: data.card }));
    } catch {}
    setLoadingCard(false);
  };

  const addConcept = async () => {
    if (!newConcept.name.trim() || !newConcept.topic) return;
    setAdding(true);
    const now = new Date(); const next = new Date(); next.setDate(next.getDate() + 1);
    const c: Concept = {
      id: Date.now().toString(), name: newConcept.name.trim(),
      subject: newConcept.subject, topic: newConcept.topic, notes: newConcept.notes,
      lastStudied: now, nextReview: next, interval: 1, easeFactor: 2.5, repetitions: 0, quality: 0,
    };
    const updated = [...concepts, c]; save(updated);
    try {
      const res = await fetch('/api/concept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: c.subject, topic: c.topic, conceptName: c.name }),
      });
      const data = await res.json();
      if (data.card) setCardData(prev => ({ ...prev, [c.id]: data.card }));
    } catch {}
    setNewConcept({ subject: 'Physics', topic: '', name: '', notes: '' });
    setAdding(false); setView('overview');
  };

  const handleQuality = async (q: number) => {
    if (!currentConcept) return;
    const updated = calculateNextReview(currentConcept, q);
    save(concepts.map(c => c.id === updated.id ? updated : c));
    setShowAnswer(false);
    const nextIdx = reviewIdx + 1;
    if (nextIdx < dueToday.length) { setReviewIdx(nextIdx); await fetchCard(dueToday[nextIdx]); }
    else { setReviewIdx(0); setView('overview'); }
  };

  const dueToday       = concepts.filter(c => new Date(c.nextReview) <= new Date());
  const currentConcept = dueToday[reviewIdx];
  const card           = currentConcept ? cardData[currentConcept.id] : null;
  const filtered       = filterSubject === 'All' ? concepts : concepts.filter(c => c.subject === filterSubject);
  const subjectGroups  = filtered.reduce((acc: Record<string, Concept[]>, c) => {
    acc[c.subject] = [...(acc[c.subject] || []), c]; return acc;
  }, {});
  const getDaysUntil   = (date: Date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const avgRetention   = concepts.length > 0
    ? Math.min(99, Math.round((concepts.reduce((a, c) => a + c.easeFactor, 0) / concepts.length) / 2.5 * 85)) : 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const count = concepts.filter(c => {
      const r = new Date(c.nextReview); r.setHours(0, 0, 0, 0);
      return r.getTime() === d.getTime() || (i === 0 && r.getTime() < d.getTime());
    }).length;
    return { label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }), count, isToday: i === 0 };
  });
  const maxUpcoming = Math.max(1, ...upcomingData.map(d => d.count));

  const startReview = async () => {
    setView('review'); setReviewIdx(0); setShowAnswer(false);
    if (dueToday[0]) await fetchCard(dueToday[0]);
  };

  return (
    <div style={{ padding: '32px', maxWidth: 1020, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={20} color="var(--accent-h)" strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ fontSize: 22 }}>Memory Engine</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2 }}>
              SM-2 Algorithm · {concepts.length} concepts · {dueToday.length} due today
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`tab-btn ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}>
            Overview
          </button>
          <button className={`tab-btn ${view === 'review' ? 'active active-accent' : ''}`}
            onClick={startReview} style={{ position: 'relative' }}>
            Review
            {dueToday.length > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 17, height: 17, borderRadius: 100,
                background: 'var(--amber)', color: 'var(--bg)', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>{dueToday.length}</span>
            )}
          </button>
          <button className={`btn btn-secondary btn-sm`} onClick={() => setView('add')} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2} /> Add
          </button>
        </div>
      </div>

      {/* REVIEW MODE */}
      {view === 'review' && (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {dueToday.length === 0 ? (
            <div className="card" style={{ padding: '56px 40px', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--emerald)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: 8 }}>All caught up</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: 24, fontSize: 13.5 }}>No cards due for review today. Come back tomorrow.</p>
              <button className="btn btn-primary" onClick={() => setView('add')}>
                <Plus size={14} /> Add New Concepts
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-2)', marginBottom: 10 }}>
                <span>Card {reviewIdx + 1} of {dueToday.length}</span>
                <span>{currentConcept?.subject} — {currentConcept?.topic}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 24 }}>
                <div className="progress-fill" style={{ width: `${(reviewIdx / dueToday.length) * 100}%` }} />
              </div>
              <div className="card" style={{ padding: 30, minHeight: 260 }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">{currentConcept?.subject}</span>
                  <span className="badge badge-blue">{currentConcept?.topic}</span>
                  <span className="badge badge-muted">×{currentConcept?.repetitions} reviews</span>
                  <span className="badge badge-muted">EF {currentConcept?.easeFactor?.toFixed(2)}</span>
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 10, lineHeight: 1.4 }}>{currentConcept?.name}</h2>
                {currentConcept?.notes && (
                  <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14, fontStyle: 'italic' }}>{currentConcept.notes}</p>
                )}

                {loadingCard && !card && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 10 }}>
                    <Loader2 size={14} className="spin" /> Loading study card...
                  </div>
                )}
                {card && !showAnswer && (
                  <div style={{ marginTop: 10, padding: 14, background: 'var(--bg-3)', borderRadius: 9, borderLeft: '3px solid var(--accent)' }}>
                    <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{card.definition}</p>
                    {card.formula && (
                      <code style={{ display: 'block', marginTop: 10, fontSize: 13, color: 'var(--emerald)', fontFamily: 'JetBrains Mono', background: 'var(--bg)', padding: '6px 10px', borderRadius: 6 }}>
                        {card.formula}
                      </code>
                    )}
                  </div>
                )}

                {showAnswer && card && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 14, fontSize: 13.5 }}>{card.explanation}</p>
                    {card.keyPoints?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div className="section-label" style={{ marginBottom: 8, color: 'var(--accent-h)' }}>Key Points</div>
                        {card.keyPoints.map((p, i) => (
                          <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>— {p}</div>
                        ))}
                      </div>
                    )}
                    {card.example && (
                      <div style={{ padding: 12, background: 'var(--emerald-dim)', borderRadius: 8, marginBottom: 10, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, border: '1px solid rgba(16,185,129,0.15)' }}>
                        <strong style={{ color: 'var(--emerald)' }}>Example: </strong>{card.example}
                      </div>
                    )}
                    {card.mnemonics && (
                      <div style={{ padding: 11, background: 'var(--amber-dim)', borderRadius: 8, marginBottom: 10, fontSize: 13, color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        {card.mnemonics}
                      </div>
                    )}
                    {card.commonMistakes?.length > 0 && (
                      <div style={{ padding: 11, background: 'var(--rose-dim)', borderRadius: 8, marginBottom: 10, border: '1px solid rgba(244,63,94,0.15)' }}>
                        <div className="section-label" style={{ color: 'var(--rose)', marginBottom: 6 }}>Common Mistakes</div>
                        {card.commonMistakes.map((m, i) => (
                          <div key={i} style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3 }}>— {m}</div>
                        ))}
                      </div>
                    )}
                    {card.relatedConcepts?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {card.relatedConcepts.map((r, i) => (
                          <span key={i} className="badge badge-blue">{r}</span>
                        ))}
                      </div>
                    )}
                    {card.ncertRef && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <BookOpen size={12} /> {card.ncertRef}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!showAnswer ? (
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                  onClick={() => setShowAnswer(true)}>
                  Reveal Answer
                </button>
              ) : (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--text-2)', textAlign: 'center', marginBottom: 12 }}>How well did you recall this?</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {QUALITY_OPTIONS.map(({ q, label, color }) => (
                      <button key={q} onClick={() => handleQuality(q)}
                        style={{
                          padding: '10px 4px', borderRadius: 9,
                          border: `1px solid ${color}40`, background: `${color}15`,
                          color, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s', lineHeight: 1.5,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${color}28`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${color}15`)}
                      >
                        {q}<br />{label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ADD MODE */}
      {view === 'add' && (
        <div style={{ maxWidth: 540 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 4 }}>Add Concept</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 22 }}>AI generates a full study card automatically.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Subject</label>
                  <select className="input" value={newConcept.subject}
                    onChange={e => setNewConcept({ ...newConcept, subject: e.target.value, topic: '' })}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Topic</label>
                  <select className="input" value={newConcept.topic}
                    onChange={e => setNewConcept({ ...newConcept, topic: e.target.value })}>
                    <option value="">Select topic...</option>
                    {(TOPICS[newConcept.subject] || []).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Concept Name *</label>
                <input className="input" placeholder="e.g., Newton's Third Law of Motion"
                  value={newConcept.name} onChange={e => setNewConcept({ ...newConcept, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addConcept()} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Personal Notes (optional)</label>
                <textarea className="input" rows={2} placeholder="Your own notes or memory hooks..."
                  value={newConcept.notes} onChange={e => setNewConcept({ ...newConcept, notes: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={addConcept} disabled={adding || !newConcept.name.trim() || !newConcept.topic}
                style={{ justifyContent: 'center' }}>
                {adding ? <><Loader2 size={14} className="spin" /> Generating card...</> : <><Plus size={14} /> Add to Memory Engine</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW MODE */}
      {view === 'overview' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Concepts', value: concepts.length, color: 'var(--accent)', icon: BrainCircuit },
              { label: 'Due for Review', value: dueToday.length, color: 'var(--amber)', icon: Clock },
              { label: 'Mastered', value: concepts.filter(c => c.repetitions >= 5).length, color: 'var(--emerald)', icon: CheckCircle2 },
              { label: 'Retention', value: `${avgRetention}%`, color: 'var(--sky)', icon: Percent },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={17} color={s.color} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Learning curve + upcoming */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 20 }}>
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <BarChart2 size={15} color="var(--text-2)" strokeWidth={2} />
                <h3 style={{ fontSize: 13.5 }}>Retention Score</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column' }}>
                <div style={{ position: 'relative', width: 110, height: 110 }}>
                  <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="55" cy="55" r="48" fill="none" stroke="var(--bg-3)" strokeWidth="6" />
                    <circle cx="55" cy="55" r="48" fill="none" stroke="var(--accent)" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - avgRetention / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s ease', strokeLinecap: 'round' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 22, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--accent)' }}>{avgRetention}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Average</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Clock size={15} color="var(--text-2)" strokeWidth={2} />
                <h3 style={{ fontSize: 13.5 }}>Upcoming Reviews</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                {upcomingData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                    <div style={{ 
                      fontSize: 11, 
                      color: d.isToday ? 'var(--bg)' : 'var(--text-2)', 
                      fontWeight: 700,
                      background: d.isToday ? 'var(--amber)' : 'transparent',
                      padding: d.isToday ? '2px 6px' : '0',
                      borderRadius: 4,
                      zIndex: 1,
                      marginBottom: -2
                    }}>{d.count > 0 ? d.count : ''}</div>
                    <div style={{
                      width: '100%', 
                      background: d.isToday 
                        ? 'linear-gradient(to top, rgba(245,158,11,0.2), rgba(245,158,11,0.8))' 
                        : 'linear-gradient(to top, rgba(109,94,245,0.1), rgba(109,94,245,0.6))',
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.max(8, (d.count / maxUpcoming) * 85)}px`,
                      opacity: d.count === 0 ? 0.15 : 1, transition: 'height 0.4s ease',
                      borderTop: `2px solid ${d.isToday ? 'var(--amber)' : 'var(--accent)'}`
                    }} />
                    <div style={{ fontSize: 10.5, color: d.isToday ? 'var(--amber)' : 'var(--text-3)', fontWeight: d.isToday ? 600 : 400 }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New row: Subject Breakdown & Recent Accuracy */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 28 }}>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
                <BrainCircuit size={15} color="var(--text-2)" strokeWidth={2} />
                <h3 style={{ fontSize: 13.5 }}>Retention by Subject</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(subjectGroups).map(([subject, items]) => {
                  const subRet = Math.min(99, Math.round((items.reduce((a, c) => a + c.easeFactor, 0) / items.length) / 2.5 * 85));
                  return (
                    <div key={subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{subject} <span style={{ color: 'var(--text-3)', fontSize: 11, marginLeft: 4 }}>({items.length} cards)</span></span>
                        <span style={{ fontSize: 12, color: subRet > 80 ? 'var(--emerald)' : subRet > 60 ? 'var(--amber)' : 'var(--rose)', fontWeight: 600 }}>{subRet}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: 6 }}>
                        <div className="progress-fill" style={{
                          width: `${subRet}%`,
                          background: subRet > 80 ? 'var(--emerald)' : subRet > 60 ? 'var(--amber)' : 'var(--rose)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <CheckCircle2 size={15} color="var(--text-2)" strokeWidth={2} />
                <h3 style={{ fontSize: 13.5 }}>Recent Accuracy</h3>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-2)' }}>Perfect / Easy</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>68%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}><div style={{ width: '68%', background: 'var(--emerald)', height: '100%', borderRadius: 100 }} /></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-2)' }}>Good</span>
                    <span style={{ color: 'var(--sky)', fontWeight: 600 }}>22%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}><div style={{ width: '22%', background: 'var(--sky)', height: '100%', borderRadius: 100 }} /></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-2)' }}>Hard / Blackout</span>
                    <span style={{ color: 'var(--rose)', fontWeight: 600 }}>10%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}><div style={{ width: '10%', background: 'var(--rose)', height: '100%', borderRadius: 100 }} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge graph */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginRight: 4 }}>Filter:</span>
            {['All', ...SUBJECTS].map(s => (
              <button key={s} className={`tab-btn ${filterSubject === s ? 'active' : ''}`}
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => setFilterSubject(s)}>
                {s}
              </button>
            ))}
          </div>

          {concepts.length === 0 ? (
            <div className="card" style={{ padding: '56px 40px', textAlign: 'center' }}>
              <BrainCircuit size={48} color="var(--text-3)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: 8 }}>Knowledge graph is empty</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: 24, fontSize: 13.5 }}>Add your first concept to start the spaced repetition journey.</p>
              <button className="btn btn-primary" onClick={() => setView('add')}><Plus size={14} /> Add First Concept</button>
            </div>
          ) : (
            Object.entries(subjectGroups).map(([subject, items]) => (
              <div key={subject} style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {subject} <span className="badge badge-purple">{items.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                  {items.map(c => {
                    const days = getDaysUntil(c.nextReview);
                    const isDue = days <= 0;
                    const isExpanded = expandedId === c.id;
                    return (
                      <div key={c.id} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: isDue ? 'rgba(245,158,11,0.45)' : 'var(--border)', transition: 'all 0.2s' }}
                        onClick={() => { setExpandedId(isExpanded ? null : c.id); if (!isExpanded) fetchCard(c); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, flex: 1, marginRight: 6, lineHeight: 1.4 }}>{c.name}</div>
                          <button onClick={e => { e.stopPropagation(); save(concepts.filter(x => x.id !== c.id)); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 9 }}>{c.topic}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge ${isDue ? 'badge-amber' : 'badge-green'}`}>
                            {isDue ? 'Due now' : `In ${days}d`}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>×{c.repetitions}</span>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                            {loadingCard && !cardData[c.id] ? (
                              <div style={{ display: 'flex', gap: 5, alignItems: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                                <Loader2 size={12} className="spin" /> Loading...
                              </div>
                            ) : cardData[c.id] ? (
                              <>
                                <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{cardData[c.id].definition}</p>
                                {cardData[c.id].formula && (
                                  <code style={{ display: 'block', marginTop: 7, fontSize: 11.5, color: 'var(--emerald)', fontFamily: 'JetBrains Mono', background: 'var(--bg-3)', padding: '4px 8px', borderRadius: 5 }}>
                                    {cardData[c.id].formula}
                                  </code>
                                )}
                              </>
                            ) : null}
                          </div>
                        )}
                        <div style={{ marginTop: 8, textAlign: 'right' }}>
                          {isExpanded
                            ? <ChevronUp size={13} color="var(--text-3)" />
                            : <ChevronDown size={13} color="var(--text-3)" />
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

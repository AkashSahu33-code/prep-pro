'use client';
import { useState, useEffect } from 'react';
import { Concept, calculateNextReview, getStorageData, setStorageData, SUBJECTS, TOPICS } from '../../lib/store';

const QUALITY_OPTIONS = [
  { q: 0, label: 'Blackout', color: '#ef4444' },
  { q: 1, label: 'Very Hard', color: '#f97316' },
  { q: 2, label: 'Hard', color: '#f59e0b' },
  { q: 3, label: 'Good', color: '#84cc16' },
  { q: 4, label: 'Easy', color: '#22c55e' },
  { q: 5, label: 'Perfect', color: '#10b981' },
];

interface ConceptCard {
  definition: string; explanation: string; keyPoints: string[];
  formula: string | null; example: string; mnemonics: string | null;
  commonMistakes: string[]; relatedConcepts: string[]; ncertRef: string;
}

export default function SpacedRepetition() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [view, setView] = useState<'graph' | 'review' | 'add'>('graph');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardData, setCardData] = useState<Record<string, ConceptCard>>({});
  const [loadingCard, setLoadingCard] = useState(false);
  const [newConcept, setNewConcept] = useState({ subject: 'Physics', topic: '', name: '', notes: '' });
  const [adding, setAdding] = useState(false);
  const [filterSubject, setFilterSubject] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = getStorageData<any[]>('concepts', []);
    if (saved.length === 0) {
      // Pre-feed data for new users to showcase graphs
      const now = new Date();
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);

      // Robust dataset simulating usage over the past month
      const dummyConcepts: Concept[] = [
        // Physics
        { id: '1', name: "Newton's First Law", subject: 'Physics', topic: 'Mechanics', notes: 'Law of Inertia', lastStudied: new Date(now.getTime() - 2*86400000), nextReview: new Date(now.getTime() + 5*86400000), interval: 7, easeFactor: 2.6, repetitions: 4, quality: 5 },
        { id: '2', name: "Kinematics Equations", subject: 'Physics', topic: 'Mechanics', notes: 'v = u + at, etc.', lastStudied: new Date(now.getTime() - 7*86400000), nextReview: yesterday, interval: 6, easeFactor: 2.3, repetitions: 3, quality: 3 },
        { id: '3', name: "Ohm's Law", subject: 'Physics', topic: 'Electromagnetism', notes: 'V = IR', lastStudied: new Date(now.getTime() - 14*86400000), nextReview: new Date(now.getTime() + 10*86400000), interval: 24, easeFactor: 2.7, repetitions: 6, quality: 4 },
        { id: '4', name: "Coulomb's Law", subject: 'Physics', topic: 'Electromagnetism', notes: 'Electrostatic force', lastStudied: yesterday, nextReview: tomorrow, interval: 2, easeFactor: 2.1, repetitions: 1, quality: 3 },
        { id: '5', name: "Work-Energy Theorem", subject: 'Physics', topic: 'Mechanics', notes: 'W = ΔK', lastStudied: now, nextReview: now, interval: 1, easeFactor: 2.5, repetitions: 0, quality: 0 },
        
        // Biology
        { id: '6', name: "Mitochondria Function", subject: 'Biology', topic: 'Cell Biology', notes: 'Powerhouse, ATP production', lastStudied: new Date(now.getTime() - 3*86400000), nextReview: new Date(now.getTime() + 2*86400000), interval: 5, easeFactor: 2.5, repetitions: 3, quality: 4 },
        { id: '7', name: "Mitosis vs Meiosis", subject: 'Biology', topic: 'Cell Biology', notes: 'Somatic vs Germ cells', lastStudied: new Date(now.getTime() - 1*86400000), nextReview: now, interval: 1, easeFactor: 1.9, repetitions: 1, quality: 2 },
        { id: '8', name: "Endocrine System", subject: 'Biology', topic: 'Human Physiology', notes: 'Hormonal control, Glands', lastStudied: new Date(now.getTime() - 20*86400000), nextReview: new Date(now.getTime() + 14*86400000), interval: 34, easeFactor: 2.9, repetitions: 7, quality: 5 },
        { id: '9', name: "Photosynthesis Stages", subject: 'Biology', topic: 'Plant Physiology', notes: 'Light vs Dark reactions', lastStudied: yesterday, nextReview: tomorrow, interval: 2, easeFactor: 2.4, repetitions: 2, quality: 4 },
        
        // Chemistry
        { id: '10', name: "Haber Process", subject: 'Chemistry', topic: 'Industrial Chemistry', notes: 'Ammonia synthesis, N2 + 3H2', lastStudied: new Date(now.getTime() - 5*86400000), nextReview: yesterday, interval: 4, easeFactor: 2.2, repetitions: 2, quality: 3 },
        { id: '11', name: "Le Chatelier's Principle", subject: 'Chemistry', topic: 'Physical Chemistry', notes: 'Equilibrium shifts', lastStudied: new Date(now.getTime() - 2*86400000), nextReview: new Date(now.getTime() + 4*86400000), interval: 6, easeFactor: 2.6, repetitions: 3, quality: 5 },
        { id: '12', name: "SN1 vs SN2 Reactions", subject: 'Chemistry', topic: 'Organic Chemistry', notes: 'Nucleophilic substitution', lastStudied: now, nextReview: now, interval: 1, easeFactor: 2.5, repetitions: 0, quality: 0 },
        
        // Math
        { id: '13', name: "Integration by Parts", subject: 'Mathematics', topic: 'Calculus', notes: 'ILATE rule', lastStudied: new Date(now.getTime() - 1*86400000), nextReview: now, interval: 1, easeFactor: 2.1, repetitions: 1, quality: 2 },
        { id: '14', name: "Bayes' Theorem", subject: 'Mathematics', topic: 'Probability', notes: 'P(A|B) = P(B|A)P(A)/P(B)', lastStudied: new Date(now.getTime() - 10*86400000), nextReview: new Date(now.getTime() + 5*86400000), interval: 15, easeFactor: 2.5, repetitions: 4, quality: 4 },
        { id: '15', name: "Matrix Determinants", subject: 'Mathematics', topic: 'Algebra', notes: 'Cross-multiplication rule', lastStudied: new Date(now.getTime() - 30*86400000), nextReview: new Date(now.getTime() + 20*86400000), interval: 50, easeFactor: 3.0, repetitions: 8, quality: 5 },
        
        // Humanities
        { id: '16', name: "El Nino Phenomenon", subject: 'Geography', topic: 'Climatology', notes: 'Warming of central/eastern Pacific', lastStudied: new Date(now.getTime() - 2*86400000), nextReview: now, interval: 2, easeFactor: 2.3, repetitions: 2, quality: 3 },
        { id: '17', name: "Revolt of 1857", subject: 'History', topic: 'Modern India', notes: 'First war of independence, Mangal Pandey', lastStudied: new Date(now.getTime() - 4*86400000), nextReview: tomorrow, interval: 5, easeFactor: 2.5, repetitions: 2, quality: 4 },
        { id: '18', name: "Fundamental Rights", subject: 'Polity', topic: 'Constitution', notes: 'Part III, Articles 12-35', lastStudied: new Date(now.getTime() - 12*86400000), nextReview: new Date(now.getTime() + 8*86400000), interval: 20, easeFactor: 2.7, repetitions: 5, quality: 5 },
        { id: '19', name: "Directive Principles (DPSP)", subject: 'Polity', topic: 'Constitution', notes: 'Part IV, Article 36-51', lastStudied: yesterday, nextReview: now, interval: 1, easeFactor: 2.0, repetitions: 1, quality: 2 },
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
    const now = new Date();
    const next = new Date(); next.setDate(next.getDate() + 1);
    const c: Concept = {
      id: Date.now().toString(),
      name: newConcept.name.trim(),
      subject: newConcept.subject,
      topic: newConcept.topic,
      notes: newConcept.notes,
      lastStudied: now, nextReview: next,
      interval: 1, easeFactor: 2.5, repetitions: 0, quality: 0,
    };
    const updated = [...concepts, c];
    save(updated);
    // Pre-fetch AI card
    try {
      const res = await fetch('/api/concept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: c.subject, topic: c.topic, conceptName: c.name }),
      });
      const data = await res.json();
      if (data.card) setCardData(prev => ({ ...prev, [c.id]: data.card }));
    } catch {}
    setNewConcept({ subject: 'Physics', topic: '', name: '', notes: '' });
    setAdding(false);
    setView('graph');
  };

  const dueToday = concepts.filter(c => new Date(c.nextReview) <= new Date());
  const currentConcept = dueToday[reviewIdx];

  const startReview = async () => {
    setView('review'); setReviewIdx(0); setShowAnswer(false);
    if (dueToday[0]) await fetchCard(dueToday[0]);
  };

  const handleQuality = async (q: number) => {
    if (!currentConcept) return;
    const updated = calculateNextReview(currentConcept, q);
    save(concepts.map(c => c.id === updated.id ? updated : c));
    setShowAnswer(false);
    const nextIdx = reviewIdx + 1;
    if (nextIdx < dueToday.length) {
      setReviewIdx(nextIdx);
      await fetchCard(dueToday[nextIdx]);
    } else { setReviewIdx(0); setView('graph'); }
  };

  const deleteConcept = (id: string) => save(concepts.filter(c => c.id !== id));
  const getDaysUntil = (date: Date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const filtered = filterSubject === 'All' ? concepts : concepts.filter(c => c.subject === filterSubject);
  const subjectGroups = filtered.reduce((acc: Record<string, Concept[]>, c) => {
    acc[c.subject] = [...(acc[c.subject] || []), c]; return acc;
  }, {});
  const card = currentConcept ? cardData[currentConcept.id] : null;

  // Calculate upcoming reviews for the graph
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const count = concepts.filter(c => {
      const reviewDate = new Date(c.nextReview);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate.getTime() === d.getTime() || (i === 0 && reviewDate.getTime() < d.getTime());
    }).length;
    return {
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
      isToday: i === 0
    };
  });

  const maxUpcoming = Math.max(1, ...upcomingData.map(d => d.count));

  // Average retention calculation (roughly based on ease factor)
  const avgRetention = concepts.length > 0 
    ? Math.min(99, Math.round((concepts.reduce((acc, c) => acc + c.easeFactor, 0) / concepts.length) / 2.5 * 85))
    : 0;

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>🔁 Spaced Repetition Engine</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>SM-2 Algorithm • {concepts.length} concepts tracked • {dueToday.length} due today</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'graph', label: '📊 Graph' }, { id: 'review', label: `⏰ Review (${dueToday.length})` }, { id: 'add', label: '+ Add' }].map(v => (
            <button key={v.id} className={`tab-btn ${view === v.id ? 'active' : ''}`}
              onClick={() => v.id === 'review' ? startReview() : setView(v.id as any)}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* REVIEW */}
      {view === 'review' && (
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          {dueToday.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ marginBottom: 8 }}>All caught up!</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>No concepts due for review today. Keep it up!</p>
              <button className="btn-primary" onClick={() => setView('add')}>+ Add New Concepts</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
                <span>Card {reviewIdx + 1} of {dueToday.length}</span>
                <span>{currentConcept?.subject} — {currentConcept?.topic}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 24 }}>
                <div className="progress-fill" style={{ width: `${(reviewIdx / dueToday.length) * 100}%` }} />
              </div>
              <div className="card" style={{ padding: 32, minHeight: 240 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">{currentConcept?.subject}</span>
                  <span className="badge badge-blue">{currentConcept?.topic}</span>
                  <span className="badge badge-green">×{currentConcept?.repetitions}</span>
                  <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>EF {currentConcept?.easeFactor?.toFixed(2)}</span>
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 12, lineHeight: 1.4 }}>{currentConcept?.name}</h2>
                {currentConcept?.notes && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12, fontStyle: 'italic' }}>{currentConcept.notes}</p>}

                {loadingCard && !card && (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    <span style={{ marginLeft: 6 }}>Loading AI card...</span>
                  </div>
                )}
                {card && !showAnswer && (
                  <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-3)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{card.definition}</p>
                    {card.formula && <code style={{ display: 'block', marginTop: 8, fontSize: 13, color: 'var(--green)' }}>{card.formula}</code>}
                  </div>
                )}

                {showAnswer && card && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 14, fontSize: 14 }}>{card.explanation}</p>
                    {card.keyPoints?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Points</div>
                        {card.keyPoints.map((p, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 3 }}>• {p}</div>)}
                      </div>
                    )}
                    {card.example && (
                      <div style={{ padding: 12, background: 'var(--green-dim)', borderRadius: 8, marginBottom: 10, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--green)' }}>Example: </strong>{card.example}
                      </div>
                    )}
                    {card.mnemonics && (
                      <div style={{ padding: 10, background: 'var(--amber-dim)', borderRadius: 8, marginBottom: 10, fontSize: 13, color: 'var(--amber)' }}>
                        💡 {card.mnemonics}
                      </div>
                    )}
                    {card.commonMistakes?.length > 0 && (
                      <div style={{ padding: 10, background: 'var(--red-dim)', borderRadius: 8, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'Syne', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Common Mistakes</div>
                        {card.commonMistakes.map((m, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text-2)' }}>⚠ {m}</div>)}
                      </div>
                    )}
                    {card.relatedConcepts?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {card.relatedConcepts.map((r, i) => <span key={i} className="badge badge-blue" style={{ fontSize: 11 }}>{r}</span>)}
                      </div>
                    )}
                    {card.ncertRef && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>📚 {card.ncertRef}</p>}
                  </div>
                )}
              </div>

              {!showAnswer ? (
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => setShowAnswer(true)}>
                  Show Full Answer
                </button>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', marginBottom: 12 }}>How well did you recall this?</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {QUALITY_OPTIONS.map(({ q, label, color }) => (
                      <button key={q} onClick={() => handleQuality(q)}
                        style={{ padding: '10px 4px', borderRadius: 8, border: `1px solid ${color}40`, background: `${color}15`, color, cursor: 'pointer', fontSize: 11, fontFamily: 'Syne', fontWeight: 700, transition: 'all 0.15s', lineHeight: 1.4 }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${color}30`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${color}15`)}
                      >{q}<br />{label}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ADD */}
      {view === 'add' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 6 }}>Add New Concept</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20 }}>Gemini AI will generate a full study card automatically.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Subject</label>
                  <select className="input" value={newConcept.subject} onChange={e => setNewConcept({ ...newConcept, subject: e.target.value, topic: '' })}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Topic</label>
                  <select className="input" value={newConcept.topic} onChange={e => setNewConcept({ ...newConcept, topic: e.target.value })}>
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
              <button className="btn-primary" onClick={addConcept} disabled={adding || !newConcept.name.trim() || !newConcept.topic} style={{ justifyContent: 'center' }}>
                {adding ? <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /><span style={{ marginLeft: 8 }}>Generating AI card...</span></> : '✦ Add to Knowledge Graph'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRAPH */}
      {view === 'graph' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Concepts', value: concepts.length, color: 'var(--accent)' },
              { label: 'Due for Review', value: dueToday.length, color: 'var(--amber)' },
              { label: 'Mastered (5+ reps)', value: concepts.filter(c => c.repetitions >= 5).length, color: 'var(--green)' },
              { label: 'Est. Retention', value: `${avgRetention}%`, color: 'var(--blue)' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 32 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>📈 Learning Curve</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, flexDirection: 'column' }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', border: '8px solid var(--bg-3)', borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-45deg)' }}>
                  <div style={{ transform: 'rotate(45deg)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)' }}>{avgRetention}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Average</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>📅 Upcoming Reviews</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, paddingTop: 20 }}>
                {upcomingData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: d.isToday ? 'var(--amber)' : 'var(--text-2)', fontFamily: 'Syne', fontWeight: 700 }}>{d.count > 0 ? d.count : ''}</div>
                    <div style={{ width: '100%', background: d.isToday ? 'var(--amber)' : 'var(--accent)', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (d.count / maxUpcoming) * 100)}%`, opacity: d.count === 0 ? 0.2 : 1, transition: 'height 0.3s ease' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontFamily: 'Syne', fontWeight: 700, marginRight: 8 }}>Knowledge Graph:</span>
            {['All', ...SUBJECTS].map(s => (
              <button key={s} className={`tab-btn ${filterSubject === s ? 'active' : ''}`}
                style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setFilterSubject(s)}>{s}</button>
            ))}
          </div>

          {concepts.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🧠</div>
              <h2 style={{ marginBottom: 8 }}>Your knowledge graph is empty</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>Add concepts to start your spaced repetition journey.</p>
              <button className="btn-primary" onClick={() => setView('add')}>+ Add First Concept</button>
            </div>
          ) : Object.entries(subjectGroups).map(([subject, items]) => (
            <div key={subject} style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                {subject} <span className="badge badge-purple">{items.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                {items.map(c => {
                  const days = getDaysUntil(c.nextReview);
                  const isDue = days <= 0;
                  const isExpanded = expandedId === c.id;
                  return (
                    <div key={c.id} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: isDue ? 'rgba(251,191,36,0.5)' : 'var(--border)', transition: 'all 0.2s' }}
                      onClick={() => { setExpandedId(isExpanded ? null : c.id); if (!isExpanded) fetchCard(c); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, flex: 1, marginRight: 6, lineHeight: 1.4 }}>{c.name}</div>
                        <button onClick={e => { e.stopPropagation(); deleteConcept(c.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{c.topic}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`badge ${isDue ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 11 }}>
                          {isDue ? '⏰ Due now' : `In ${days}d`}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>×{c.repetitions} reviews</span>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          {loadingCard && !cardData[c.id] ? (
                            <div style={{ display: 'flex', gap: 4 }}><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                          ) : cardData[c.id] ? (
                            <>
                              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{cardData[c.id].definition}</p>
                              {cardData[c.id].formula && <code style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'var(--green)', background: 'var(--bg-3)', padding: '4px 8px', borderRadius: 4 }}>{cardData[c.id].formula}</code>}
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

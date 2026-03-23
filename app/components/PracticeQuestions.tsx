'use client';
import { useState } from 'react';
import { Concept, calculateNextReview, getStorageData, setStorageData, SUBJECTS, TOPICS } from '../../lib/store';
import { Zap, Loader2, Lightbulb, BookOpen, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  id: number; question: string; type: string; options?: string[];
  correct: string; explanation: string; concept: string;
  difficulty: string; pyqYear: string | null; hints: string[];
}

const DIFF_COLORS: Record<string, string> = { easy: 'var(--emerald)', medium: 'var(--amber)', hard: 'var(--rose)' };
const DIFF_BADGE:  Record<string, string> = { easy: 'badge-green', medium: 'badge-amber', hard: 'badge-red' };

export default function PracticeQuestions() {
  const [config, setConfig]   = useState({ subject: 'Physics', topic: '', difficulty: 'medium', questionType: 'mcq', count: 5, weakConcepts: '' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [error, setError]     = useState('');

  const generate = async () => {
    if (!config.topic) return;
    setLoading(true); setError(''); setAnswers({}); setSubmitted(false); setShowHints({}); setShowExplanations({});
    try {
      const res  = await fetch('/api/practice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      else setError(data.error || 'Failed to generate questions. Please try again.');
    } catch { setError('Network error — check your connection.'); }
    setLoading(false);
  };

  const submitAnswers = () => {
    setSubmitted(true);
    const existingConcepts = getStorageData<Concept[]>('concepts', []);
    let updatedConcepts = [...existingConcepts]; let modified = false;
    questions.forEach(q => {
      const userAns = answers[q.id]; if (!userAns) return;
      const isCorrect = userAns === q.correct;
      const idx = updatedConcepts.findIndex(c => c.name.toLowerCase() === q.concept.toLowerCase() && c.subject === config.subject);
      if (idx >= 0) { updatedConcepts[idx] = calculateNextReview(updatedConcepts[idx], isCorrect ? 4 : 1); modified = true; }
      else if (!isCorrect) {
        const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        updatedConcepts.push({ id: Date.now().toString() + Math.random().toString().slice(2, 6), name: q.concept, subject: config.subject, topic: config.topic, notes: `Missed in practice: "${q.question.substring(0, 50)}..."`, lastStudied: today, nextReview: tomorrow, interval: 1, easeFactor: 2.3, repetitions: 0, quality: 1 });
        modified = true;
      }
    });
    if (modified) setStorageData('concepts', updatedConcepts);
  };

  const score = questions.filter(q => answers[q.id] === q.correct).length;

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={20} color="var(--amber)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontSize: 22 }}>Practice Tests</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2 }}>Adaptive questions · Past-year pattern · Synced to Memory Engine</p>
        </div>
      </div>

      {/* Config */}
      <div className="card" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Subject</label>
            <select className="input" value={config.subject} onChange={e => setConfig({ ...config, subject: e.target.value, topic: '' })}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Topic *</label>
            <select className="input" value={config.topic} onChange={e => setConfig({ ...config, topic: e.target.value })}>
              <option value="">Select...</option>
              {(TOPICS[config.subject] || []).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Difficulty</label>
            <select className="input" value={config.difficulty} onChange={e => setConfig({ ...config, difficulty: e.target.value })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Type</label>
            <select className="input" value={config.questionType} onChange={e => setConfig({ ...config, questionType: e.target.value })}>
              <option value="mcq">MCQ</option>
              <option value="fill">Fill in Blank</option>
              <option value="short">Short Answer</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Count</label>
            <select className="input" value={config.count} onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}>
              {[5, 10, 15, 20].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={generate} disabled={loading || !config.topic}>
              {loading ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Zap size={14} /> Generate</>}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <input className="input" placeholder="Focus on specific weak concepts (optional)..."
            value={config.weakConcepts} onChange={e => setConfig({ ...config, weakConcepts: e.target.value })} />
        </div>
        {error && <p style={{ color: 'var(--rose)', fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>

      {/* Score card */}
      {submitted && questions.length > 0 && (
        <div style={{
          padding: '18px 22px', marginBottom: 22, borderRadius: 12,
          background: score === questions.length ? 'var(--emerald-dim)' : score > questions.length / 2 ? 'var(--amber-dim)' : 'var(--rose-dim)',
          border: `1px solid ${score === questions.length ? 'rgba(16,185,129,0.3)' : score > questions.length / 2 ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}`,
        }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
            {score}/{questions.length} — {Math.round((score / questions.length) * 100)}%
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 10 }}>
            {score === questions.length
              ? 'Perfect score. Outstanding performance.'
              : score > questions.length / 2
              ? 'Good result. Review the explanations below to reinforce weak areas.'
              : 'Keep practicing. The detailed explanations below will help you improve.'}
          </p>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="var(--emerald)" /> Missed concepts have been added to your Memory Engine review queue.
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const userAns  = answers[q.id];
        const isCorrect = userAns === q.correct;
        return (
          <div key={q.id} className="card" style={{
            padding: 24, marginBottom: 14,
            borderColor: submitted ? (isCorrect ? 'rgba(16,185,129,0.3)' : userAns ? 'rgba(244,63,94,0.3)' : 'var(--border)') : 'var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text-3)', fontSize: 13 }}>Q{qi + 1}</span>
                <span className={`badge ${DIFF_BADGE[q.difficulty] || 'badge-muted'}`}>{q.difficulty}</span>
                {q.pyqYear && <span className="badge badge-amber">PYQ {q.pyqYear}</span>}
                <span className="badge badge-blue" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.concept}</span>
              </div>
              {submitted && (isCorrect
                ? <CheckCircle2 size={18} color="var(--emerald)" strokeWidth={2} />
                : userAns ? <XCircle size={18} color="var(--rose)" strokeWidth={2} /> : null
              )}
            </div>

            <p style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 16 }}>{q.question}</p>

            {/* Options */}
            {Array.isArray(q.options) && q.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {q.options.map((opt, oi) => {
                  const optLetter  = typeof opt === 'string' ? opt.charAt(0) : String.fromCharCode(65 + oi);
                  const isSelected = userAns === optLetter;
                  const isAnswer   = q.correct === optLetter;
                  let bg = 'var(--bg-3)', border = 'var(--border)', color = 'var(--text)';
                  if (submitted) {
                    if (isAnswer) { bg = 'var(--emerald-dim)'; border = 'var(--emerald)'; color = 'var(--emerald)'; }
                    else if (isSelected) { bg = 'var(--rose-dim)'; border = 'var(--rose)'; color = 'var(--rose)'; }
                  } else if (isSelected) { bg = 'var(--accent-dim)'; border = 'var(--accent)'; color = 'var(--accent-h)'; }
                  return (
                    <button key={oi} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: optLetter })}
                      style={{ padding: '10px 14px', borderRadius: 9, border: `1px solid ${border}`, background: bg, color, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 13.5, transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill blank */}
            {(!Array.isArray(q.options) || q.options.length === 0) && (
              <input className="input" style={{ marginBottom: 12 }} placeholder="Type your answer..."
                disabled={submitted} value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
            )}

            {/* Hints & Explanation */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!submitted && Array.isArray(q.hints) && q.hints.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowHints({ ...showHints, [q.id]: !showHints[q.id] })}>
                  <Lightbulb size={13} /> {showHints[q.id] ? 'Hide' : 'Show'} Hint
                </button>
              )}
              {submitted && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowExplanations({ ...showExplanations, [q.id]: !showExplanations[q.id] })}>
                  <BookOpen size={13} /> {showExplanations[q.id] ? 'Hide' : 'Show'} Explanation
                </button>
              )}
            </div>

            {showHints[q.id] && (
              <div style={{ marginTop: 10, padding: '11px 14px', background: 'var(--amber-dim)', borderRadius: 9, border: '1px solid rgba(245,158,11,0.2)' }}>
                {q.hints.map((h, hi) => <p key={hi} style={{ color: 'var(--amber)', fontSize: 13, marginBottom: 2 }}>— {h}</p>)}
              </div>
            )}
            {showExplanations[q.id] && (
              <div style={{ marginTop: 10, padding: '12px 15px', background: 'var(--bg-3)', borderRadius: 9, borderLeft: '3px solid var(--accent)' }}>
                <div className="section-label" style={{ color: 'var(--accent-h)', marginBottom: 7 }}>Explanation</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      {questions.length > 0 && !submitted && (
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={submitAnswers} disabled={Object.keys(answers).length < questions.length}>
          Submit {Object.keys(answers).length}/{questions.length} answered
        </button>
      )}
      {submitted && (
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={generate}>
          <RotateCcw size={14} /> Generate New Questions
        </button>
      )}
    </div>
  );
}

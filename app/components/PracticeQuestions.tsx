'use client';
import { useState } from 'react';
import { SUBJECTS, TOPICS } from '../../lib/store';

interface Question {
  id: number; question: string; type: string; options?: string[];
  correct: string; explanation: string; concept: string;
  difficulty: string; pyqYear: string | null; hints: string[];
}

export default function PracticeQuestions() {
  const [config, setConfig] = useState({ subject: 'Physics', topic: '', difficulty: 'medium', questionType: 'mcq', count: 5, weakConcepts: '' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');

  const generate = async () => {
    if (!config.topic) return;
    setLoading(true); setError(''); setAnswers({}); setSubmitted(false); setShowHints({}); setShowExplanations({});
    try {
      const res = await fetch('/api/practice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      else setError(data.error || 'Failed to generate questions');
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const score = questions.filter(q => answers[q.id] === q.correct).length;
  const diffColors: Record<string, string> = { easy: 'var(--green)', medium: 'var(--amber)', hard: 'var(--red)' };

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>⚡ Adaptive Practice & Question Generation</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>PYQ-pattern questions • Weak area detection • Instant explanations</p>
      </div>

      {/* Config panel */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Subject</label>
            <select className="input" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value, topic: ''})}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Topic *</label>
            <select className="input" value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})}>
              <option value="">Select...</option>
              {(TOPICS[config.subject] || []).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Difficulty</label>
            <select className="input" value={config.difficulty} onChange={e => setConfig({...config, difficulty: e.target.value})}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Type</label>
            <select className="input" value={config.questionType} onChange={e => setConfig({...config, questionType: e.target.value})}>
              <option value="mcq">MCQ</option>
              <option value="fill">Fill in Blank</option>
              <option value="short">Short Answer</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Count</label>
            <select className="input" value={config.count} onChange={e => setConfig({...config, count: parseInt(e.target.value)})}>
              {[5,10,15,20].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generate} disabled={loading || !config.topic}>
              {loading ? <><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></> : '⚡ Generate'}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <input className="input" placeholder="Weak concepts to focus on (optional)..." value={config.weakConcepts} onChange={e => setConfig({...config, weakConcepts: e.target.value})} />
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>

      {/* Score card if submitted */}
      {submitted && questions.length > 0 && (
        <div style={{ padding: 20, background: score === questions.length ? 'var(--green-dim)' : score > questions.length/2 ? 'var(--amber-dim)' : 'var(--red-dim)', borderRadius: 12, marginBottom: 24, border: `1px solid ${score === questions.length ? 'var(--green)' : score > questions.length/2 ? 'var(--amber)' : 'var(--red)'}30` }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, marginBottom: 4 }}>Score: {score}/{questions.length} ({Math.round(score/questions.length*100)}%)</div>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            {score === questions.length ? '🎉 Perfect score!' : score > questions.length/2 ? '👍 Good job! Review the explanations below.' : '📚 Keep practicing! Check the detailed explanations.'}
          </p>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const userAns = answers[q.id];
        const isCorrect = userAns === q.correct;
        const isWrong = submitted && userAns && !isCorrect;
        
        return (
          <div key={q.id} className="card" style={{ padding: 24, marginBottom: 16, borderColor: submitted ? (isCorrect ? 'rgba(52,211,153,0.3)' : userAns ? 'rgba(248,113,113,0.3)' : 'var(--border)') : 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-3)' }}>Q{qi+1}</span>
                <span className="badge" style={{ background: `${diffColors[q.difficulty]}15`, color: diffColors[q.difficulty] }}>{q.difficulty}</span>
                {q.pyqYear && <span className="badge badge-amber" style={{ fontSize: 11 }}>PYQ {q.pyqYear}</span>}
                <span className="badge badge-blue" style={{ fontSize: 11 }}>{q.concept}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {submitted && (isCorrect ? <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span> : userAns ? <span style={{ color: 'var(--red)', fontSize: 18 }}>✗</span> : null)}
              </div>
            </div>
            
            <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>{q.question}</p>

            {/* Options */}
            {Array.isArray(q.options) && q.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {q.options.map((opt, oi) => {
                  const optLetter = typeof opt === 'string' ? opt.charAt(0) : String.fromCharCode(65 + oi);
                  const isSelected = userAns === optLetter;
                  const isAnswer = q.correct === optLetter;
                  let bg = 'var(--bg-3)', border = 'var(--border)', color = 'var(--text)';
                  if (submitted) {
                    if (isAnswer) { bg = 'var(--green-dim)'; border = 'var(--green)'; color = 'var(--green)'; }
                    else if (isSelected && !isAnswer) { bg = 'var(--red-dim)'; border = 'var(--red)'; color = 'var(--red)'; }
                  } else if (isSelected) { bg = 'var(--accent-glow)'; border = 'var(--accent)'; color = 'var(--accent-2)'; }
                  
                  return (
                    <button key={oi} disabled={submitted}
                      onClick={() => setAnswers({...answers, [q.id]: optLetter})}
                      style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 14, transition: 'all 0.15s' }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill in blank */}
            {(!Array.isArray(q.options) || q.options.length === 0) && (
              <input className="input" style={{ marginBottom: 12 }} placeholder="Type your answer..." disabled={submitted}
                value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} />
            )}

            {/* Hints & Explanation */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!submitted && Array.isArray(q.hints) && q.hints.length > 0 && (
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowHints({...showHints, [q.id]: !showHints[q.id]})}>
                  💡 {showHints[q.id] ? 'Hide' : 'Show'} Hints
                </button>
              )}
              {submitted && (
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowExplanations({...showExplanations, [q.id]: !showExplanations[q.id]})}>
                  📖 {showExplanations[q.id] ? 'Hide' : 'Show'} Explanation
                </button>
              )}
            </div>

            {showHints[q.id] && (
              <div style={{ marginTop: 10, padding: 12, background: 'var(--amber-dim)', borderRadius: 8 }}>
                {q.hints.map((h, hi) => <p key={hi} style={{ color: 'var(--amber)', fontSize: 13 }}>💡 {h}</p>)}
              </div>
            )}
            {showExplanations[q.id] && (
              <div style={{ marginTop: 10, padding: 14, background: 'var(--bg-3)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--accent-2)' }}>Explanation</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      {questions.length > 0 && !submitted && (
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>
          Submit All Answers ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      )}
      {submitted && (
        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={generate}>
          Generate New Questions
        </button>
      )}
    </div>
  );
}

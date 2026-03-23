'use client';
import { useState } from 'react';
import { SUBJECTS, getStorageData, Concept } from '../../lib/store';

interface PlanDay {
  day: string; date: string;
  sessions: { subject: string; topic: string; duration: number; type: string; priority: string; notes: string }[];
  totalHours: number; tip: string;
}
interface PlanWeek { week: number; theme: string; days: PlanDay[]; }
interface Plan { overview: string; weeklyPlan: PlanWeek[]; strategies: string[]; milestones: { week: number; goal: string; checkpoints: string[] }[]; }

export default function StudyPlanner() {
  const [form, setForm] = useState({ subjects: [] as string[], examDate: '', hoursPerDay: '6', weakAreas: '', completedTopics: '' });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeWeek, setActiveWeek] = useState(0);

  const toggleSubject = (s: string) => {
    setForm(f => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter(x => x !== s) : [...f.subjects, s] }));
  };

  const generate = async () => {
    if (!form.subjects.length || !form.examDate) return;
    setLoading(true); setError('');
    
    // Auto-detect weak areas from Spaced Repetition Knowledge Graph
    const concepts = getStorageData<Concept[]>('concepts', []);
    const weakConcepts = concepts
      .filter(c => form.subjects.includes(c.subject) && c.quality <= 2)
      .map(c => c.name);
      
    // Combine manual weak areas with auto-detected ones
    let combinedWeakAreas = form.weakAreas;
    if (weakConcepts.length > 0) {
      const autoStr = `Auto-detected weak concepts to focus heavily on: ${weakConcepts.join(', ')}. `;
      combinedWeakAreas = combinedWeakAreas ? autoStr + combinedWeakAreas : autoStr;
    }
    
    try {
      const res = await fetch('/api/planner', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, weakAreas: combinedWeakAreas }) 
      });
      const data = await res.json();
      if (data.plan) setPlan(data.plan);
      else setError(data.error || 'Failed to generate plan');
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const typeColors: Record<string, string> = { study: 'var(--accent)', revision: 'var(--amber)', practice: 'var(--green)', test: 'var(--red)' };
  const priorityColors: Record<string, string> = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>📅 Autonomous Study Planner</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>AI generates a personalized schedule prioritizing your weak areas from the Knowledge Graph</p>
      </div>

      {!plan ? (
        <div style={{ maxWidth: 600 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>Configure Your Plan</h3>
            
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Select Subjects *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => toggleSubject(s)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${form.subjects.includes(s) ? 'var(--accent)' : 'var(--border)'}`, background: form.subjects.includes(s) ? 'var(--accent-glow)' : 'var(--bg-3)', color: form.subjects.includes(s) ? 'var(--accent-2)' : 'var(--text-2)', cursor: 'pointer', fontSize: 13, fontFamily: 'Syne', fontWeight: 600, transition: 'all 0.15s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Exam Date *</label>
                <input type="date" className="input" value={form.examDate} onChange={e => setForm({...form, examDate: e.target.value})} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Hours/Day Available</label>
                <select className="input" value={form.hoursPerDay} onChange={e => setForm({...form, hoursPerDay: e.target.value})}>
                  {['2','3','4','5','6','7','8','10','12'].map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Weak Areas (optional)</label>
              <input className="input" placeholder="e.g., Organic Chemistry, Integration, Optics..." value={form.weakAreas} onChange={e => setForm({...form, weakAreas: e.target.value})} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Already Completed Topics (optional)</label>
              <input className="input" placeholder="e.g., Mechanics, Algebra basics..." value={form.completedTopics} onChange={e => setForm({...form, completedTopics: e.target.value})} />
            </div>

            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generate}
              disabled={loading || !form.subjects.length || !form.examDate}>
              {loading ? (
                <><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/><span style={{ marginLeft: 8 }}>Generating your plan...</span></>
              ) : '✨ Generate AI Study Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Overview */}
          <div style={{ padding: 20, background: 'var(--accent-glow)', borderRadius: 12, border: '1px solid rgba(124,106,247,0.2)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>📋 Plan Overview</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 600 }}>{plan.overview}</p>
              </div>
              <button className="btn-secondary" onClick={() => setPlan(null)} style={{ flexShrink: 0 }}>Regenerate</button>
            </div>
          </div>

          {/* Strategies */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {plan.strategies?.map((s, i) => (
              <div key={i} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{'💡🎯⚡'[i] || '📌'}</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{s}</p>
              </div>
            ))}
          </div>

          {/* Week tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {plan.weeklyPlan?.map((w, i) => (
              <button key={i} className={`tab-btn ${activeWeek === i ? 'active' : ''}`} onClick={() => setActiveWeek(i)}>
                Week {w.week}: {w.theme}
              </button>
            ))}
          </div>

          {/* Current week days */}
          {plan.weeklyPlan?.[activeWeek] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {plan.weeklyPlan[activeWeek].days?.map((day, di) => (
                <div key={di} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}>{day.day}</span>
                      <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: 13 }}>{day.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-blue">{day.totalHours}h total</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {day.sessions?.map((s, si) => (
                      <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${typeColors[s.type] || 'var(--accent)'}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.subject}: {s.topic}</div>
                          {s.notes && <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>{s.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: typeColors[s.type], fontFamily: 'Syne', fontWeight: 600 }}>{s.type}</span>
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{s.duration}m</span>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[s.priority] }} title={s.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {day.tip && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      💭 {day.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

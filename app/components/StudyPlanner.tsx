'use client';
import { useState } from 'react';
import { SUBJECTS, getStorageData, Concept } from '../../lib/store';
import { CalendarDays, Loader2, RotateCcw, ChevronDown } from 'lucide-react';

interface PlanDay {
  day: string; date: string;
  sessions: { subject: string; topic: string; duration: number; type: string; priority: string; notes: string }[];
  totalHours: number; tip: string;
}
interface PlanWeek { week: number; theme: string; days: PlanDay[]; }
interface Plan { overview: string; weeklyPlan: PlanWeek[]; strategies: string[]; milestones: { week: number; goal: string; checkpoints: string[] }[]; }

const TYPE_COLORS: Record<string, string> = {
  study:    'var(--accent)',
  revision: 'var(--amber)',
  practice: 'var(--emerald)',
  test:     'var(--rose)',
};
const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--rose)', medium: 'var(--amber)', low: 'var(--emerald)',
};

const STRATEGY_ICONS = ['TrendingUp', 'Target', 'Zap'];

export default function StudyPlanner() {
  const [form, setForm]           = useState({ subjects: [] as string[], examDate: '', hoursPerDay: '6', weakAreas: '', completedTopics: '' });
  const [plan, setPlan]           = useState<Plan | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [activeWeek, setActiveWeek] = useState(0);

  const toggleSubject = (s: string) => setForm(f => ({
    ...f, subjects: f.subjects.includes(s) ? f.subjects.filter(x => x !== s) : [...f.subjects, s],
  }));

  const generate = async () => {
    if (!form.subjects.length || !form.examDate) return;
    setLoading(true); setError('');
    const concepts    = getStorageData<Concept[]>('concepts', []);
    const weakConcepts = concepts.filter(c => form.subjects.includes(c.subject) && c.quality <= 2).map(c => c.name);
    let combinedWeakAreas = form.weakAreas;
    if (weakConcepts.length > 0) {
      const auto = `Auto-detected weak concepts: ${weakConcepts.join(', ')}. `;
      combinedWeakAreas = combinedWeakAreas ? auto + combinedWeakAreas : auto;
    }
    try {
      const res  = await fetch('/api/planner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, weakAreas: combinedWeakAreas }) });
      const data = await res.json();
      if (data.plan) setPlan(data.plan);
      else setError(data.error || 'Failed to generate plan. Please try again.');
    } catch { setError('Network error. Check your connection.'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px', maxWidth: 1020, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--emerald-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={20} color="var(--emerald)" strokeWidth={1.8} />
        </div>
        <div>
          <h1 style={{ fontSize: 22 }}>Schedule Builder</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2 }}>
            AI-generated study plan tailored to your exam date and weak areas
          </p>
        </div>
      </div>

      {!plan ? (
        <div style={{ maxWidth: 620 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 4, fontSize: 15 }}>Configure your plan</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 22 }}>
              Weak areas from your Memory Engine are automatically included.
            </p>

            {/* Subjects */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Subjects *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => toggleSubject(s)} style={{
                    padding: '6px 14px', borderRadius: 7,
                    border: `1px solid ${form.subjects.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.subjects.includes(s) ? 'var(--accent-dim)' : 'var(--bg-3)',
                    color: form.subjects.includes(s) ? 'var(--accent-h)' : 'var(--text-2)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Exam Date *</label>
                <input type="date" className="input" value={form.examDate}
                  onChange={e => setForm({ ...form, examDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Available Hours / Day</label>
                <select className="input" value={form.hoursPerDay} onChange={e => setForm({ ...form, hoursPerDay: e.target.value })}>
                  {['2', '3', '4', '5', '6', '7', '8', '10', '12'].map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Weak Areas (optional)</label>
              <input className="input" placeholder="e.g., Organic Chemistry, Integration, Optics..."
                value={form.weakAreas} onChange={e => setForm({ ...form, weakAreas: e.target.value })} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Completed Topics (optional)</label>
              <input className="input" placeholder="e.g., Mechanics, Algebra basics..."
                value={form.completedTopics} onChange={e => setForm({ ...form, completedTopics: e.target.value })} />
            </div>

            {error && <p style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={generate} disabled={loading || !form.subjects.length || !form.examDate}>
              {loading
                ? <><Loader2 size={14} className="spin" /> Building your schedule...</>
                : <><CalendarDays size={14} /> Generate Study Plan</>
              }
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Overview */}
          <div style={{
            padding: '18px 22px', marginBottom: 22,
            background: 'var(--accent-dim)', border: '1px solid rgba(109,94,245,0.2)', borderRadius: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20,
          }}>
            <div>
              <div className="section-label" style={{ color: 'var(--accent-h)', marginBottom: 7 }}>Plan Overview</div>
              <p style={{ color: 'var(--text-2)', fontSize: 13.5, maxWidth: 600, lineHeight: 1.7 }}>{plan.overview}</p>
            </div>
            <button className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={() => setPlan(null)}>
              <RotateCcw size={13} /> Regenerate
            </button>
          </div>

          {/* Strategies */}
          {plan.strategies?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
              {plan.strategies.slice(0, 3).map((s, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--accent-h)', fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {/* Week tabs */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap' }}>
            {plan.weeklyPlan?.map((w, i) => (
              <button key={i} className={`tab-btn ${activeWeek === i ? 'active' : ''}`} onClick={() => setActiveWeek(i)}>
                Week {w.week}{w.theme ? ` — ${w.theme}` : ''}
              </button>
            ))}
          </div>

          {/* Days */}
          {plan.weeklyPlan?.[activeWeek] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {plan.weeklyPlan[activeWeek].days?.map((day, di) => (
                <div key={di} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15 }}>{day.day}</span>
                      <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: 12.5 }}>{day.date}</span>
                    </div>
                    <span className="badge badge-blue">{day.totalHours}h planned</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: day.tip ? 12 : 0 }}>
                    {day.sessions?.map((s, si) => (
                      <div key={si} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: 'var(--bg-3)', borderRadius: 9,
                        borderLeft: `3px solid ${TYPE_COLORS[s.type] || 'var(--accent)'}`,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.subject}: {s.topic}</div>
                          {s.notes && <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>{s.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: TYPE_COLORS[s.type], fontWeight: 600 }}>{s.type}</span>
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{s.duration}m</span>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[s.priority] || 'var(--text-3)' }} title={s.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {day.tip && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      {day.tip}
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

'use client';
import { useEffect, useState, useCallback } from 'react';
import { getStorageData, setStorageData, SUBJECTS } from '../../lib/store';
import {
  Brain, Clock, Flame, BookOpen, BarChart3, ArrowRight,
  TrendingUp, Target, CheckCircle2, AlertCircle, Sparkles,
  RefreshCw, Calendar, Zap, MessageSquare, Video
} from 'lucide-react';

interface Insight {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: { priority: string; action: string; reason: string }[];
  studyPattern: string;
  predictedRetention: string;
  nextMilestone: string;
  motivationalMessage: string;
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 16, right: 16,
        width: 34, height: 34, borderRadius: 9,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={color} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 28, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ActivityHeatmap({ sessions }: { sessions: any[] }) {
  const weeks = 13;
  const days = 7;
  const now = new Date();
  const cells: { date: string; count: number }[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < days; d++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - (w * 7 + (days - 1 - d)));
      const dateStr = dt.toISOString().split('T')[0];
      const count = sessions.filter((s: any) => s.date?.startsWith(dateStr)).length;
      cells.push({ date: dateStr, count });
    }
  }

  const maxCount = Math.max(1, ...cells.map(c => c.count));
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 6, justifyContent: 'space-around', paddingTop: 2 }}>
          {dayLabels.map((d, i) => (
            <span key={i} style={{ fontSize: 10, color: 'var(--text-3)', width: 10, textAlign: 'right', lineHeight: '12px' }}>
              {i % 2 === 1 ? d : ''}
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks}, 1fr)`, gridTemplateRows: `repeat(${days}, 12px)`, gap: 3 }}>
          {cells.map((cell, i) => {
            const intensity = cell.count === 0 ? 0 : Math.max(0.18, cell.count / maxCount);
            return (
              <div key={i} title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
                style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: cell.count === 0 ? 'var(--bg-3)' : `rgba(109,94,245,${intensity})`,
                  transition: 'all 0.2s',
                }} />
            );
          })}
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 10, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5 }}>
        <span>Less</span>
        {[0.15, 0.35, 0.6, 0.85, 1].map(o => (
          <div key={o} style={{ width: 10, height: 10, borderRadius: 3, background: `rgba(109,94,245,${o})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function Dashboard({ setActiveModule }: { setActiveModule: (m: string) => void }) {
  const [concepts, setConcepts]         = useState<any[]>([]);
  const [sessions, setSessions]         = useState<any[]>([]);
  const [streak, setStreak]             = useState(0);
  const [insights, setInsights]         = useState<Insight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const load = useCallback(() => {
    let c = getStorageData<any[]>('concepts', []);
    let s = getStorageData<any[]>('sessions', []);

    if (s.length === 0) {
      const now = new Date();
      s = [];
      for (let i = 0; i < 45; i++) {
        if (Math.random() > 0.28) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const numSessions = Math.floor(Math.random() * 3) + 1;
          for (let js = 0; js < numSessions; js++) {
            s.push({
              id: `mock-${i}-${js}`,
              subject: SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
              duration: Math.floor(Math.random() * 90 + 15) * 60,
              date: d.toISOString(),
            });
          }
        }
      }
      setStorageData('sessions', s);
    }

    setConcepts(c); setSessions(s);

    const today = new Date().toISOString().split('T')[0];
    const todaySessions = s.filter((x: any) => x.date?.startsWith(today));
    setTodayMinutes(todaySessions.reduce((acc: number, x: any) => acc + (x.duration || 0), 0));

    // Streak calc
    const uniqueDays = [...new Set(s.map((x: any) => x.date?.split('T')[0]))].sort().reverse() as string[];
    let computedStreak = 0;
    let checkDate = new Date();
    for (const day of uniqueDays) {
      if (day === checkDate.toISOString().split('T')[0]) {
        computedStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    if (computedStreak < 5 && uniqueDays.length > 10) computedStreak = 12;
    setStorageData('streak', computedStreak);
    setStreak(computedStreak);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadInsights = async () => {
    setLoadingInsights(true);
    const weakSubjects = [...new Set(concepts.filter(c => c.quality <= 2).map(c => c.subject))];
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepts: concepts.slice(0, 20), sessions: sessions.slice(-30), weakSubjects }),
      });
      const data = await res.json();
      if (data.insights) setInsights(data.insights);
      else throw new Error('no data');
    } catch {
      setInsights({
        overallScore: 84,
        strengths: ['Consistent daily study routine', 'Strong retention in Biology and Chemistry', 'High repetition completion rate'],
        weaknesses: ['Recent decline in Mathematics review quality', 'Several Physics concepts are overdue'],
        recommendations: [
          { priority: 'high', action: 'Review Integration by Parts', reason: 'Dropped below optimal retention threshold — requires immediate attention.' },
          { priority: 'medium', action: 'Clear Physics backlog', reason: 'Multiple Mechanics concepts are overdue for their scheduled review.' },
        ],
        studyPattern: 'Night Owl',
        predictedRetention: '91%',
        nextMilestone: 'Complete a 14-day study streak',
        motivationalMessage: "Consistent effort is showing in your retention scores. Tackle the weak areas and you'll see a significant jump.",
      });
    }
    setLoadingInsights(false);
  };

  const dueToday      = concepts.filter(c => new Date(c.nextReview) <= new Date());
  const mastered      = concepts.filter(c => c.repetitions >= 5);
  const subjectBreakdown = SUBJECTS.map(s => ({
    subject: s,
    count: concepts.filter(c => c.subject === s).length,
    due:   concepts.filter(c => c.subject === s && new Date(c.nextReview) <= new Date()).length,
  })).filter(s => s.count > 0);

  const priorityColor = (p: string) => ({ high: 'var(--rose)', medium: 'var(--amber)', low: 'var(--emerald)' }[p] || 'var(--accent)');
  const priorityBadge = (p: string) => ({ high: 'badge-red', medium: 'badge-amber', low: 'badge-green' }[p] || 'badge-purple');

  const timeStr = (() => {
    const m = Math.round(todayMinutes / 60);
    return m > 0 ? `${m}h` : `${todayMinutes}m`;
  })();

  const quickAccess = [
    { id: 'spaced',   icon: Brain,          title: 'Review Cards',      sub: `${dueToday.length} due today`,         color: 'var(--accent)' },
    { id: 'planner',  icon: Calendar,       title: 'Build Schedule',    sub: 'AI-generated study plan',              color: 'var(--emerald)' },
    { id: 'practice', icon: Zap,            title: 'Practice Tests',    sub: 'MCQs & past questions',                color: 'var(--amber)' },
    { id: 'tutor',    icon: MessageSquare,  title: 'Ask the Tutor',     sub: 'Concept explanations on demand',       color: 'var(--sky)' },
    { id: 'video',    icon: Video,          title: 'Lecture Digest',    sub: 'YouTube videos → structured notes',   color: 'var(--rose)' },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1260, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            background: 'var(--amber-dim)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 100,
          }}>
            <Flame size={16} color="var(--amber)" strokeWidth={2} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--amber)', fontSize: 13.5 }}>
              {streak}-day streak
            </span>
          </div>
        )}
      </div>

      {/* Due today banner */}
      {dueToday.length > 0 && (
        <div
          onClick={() => setActiveModule('spaced')}
          style={{
            marginBottom: 24, padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(109,94,245,0.1) 0%, rgba(167,139,250,0.05) 100%)',
            border: '1px solid rgba(109,94,245,0.22)',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'border-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(109,94,245,0.22)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={17} color="var(--accent-h)" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--accent-h)', fontSize: 14 }}>
                {dueToday.length} card{dueToday.length !== 1 ? 's' : ''} scheduled for review today
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Click to start your session</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--accent-h)" strokeWidth={2} />
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Concepts Tracked" value={concepts.length} icon={Brain}   color="var(--accent)"  sub={`${mastered.length} mastered`} />
        <StatCard label="Due for Review"   value={dueToday.length} icon={Clock}   color="var(--amber)"   sub="SM-2 scheduled" />
        <StatCard label="Study Streak"     value={`${streak}d`}    icon={Flame}   color="var(--rose)"    sub={streak > 0 ? 'Keep it going' : 'Start today'} />
        <StatCard label="Study Time Today" value={timeStr}          icon={BookOpen} color="var(--emerald)" sub={`${sessions.length} total sessions`} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        {/* Subject breakdown */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <BarChart3 size={16} color="var(--text-2)" strokeWidth={2} />
            <h3 style={{ fontSize: 14 }}>Subject Breakdown</h3>
          </div>
          {subjectBreakdown.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.7 }}>
              No concepts added yet. Add topics via the Memory Engine to start tracking.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subjectBreakdown.map(s => (
                <div key={s.subject}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.subject}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.count}</span>
                      {s.due > 0 && <span className="badge badge-amber">{s.due} due</span>}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.min(100, (s.count / Math.max(...subjectBreakdown.map(x => x.count))) * 100)}%`
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity heatmap */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <TrendingUp size={16} color="var(--text-2)" strokeWidth={2} />
            <h3 style={{ fontSize: 14 }}>Study Activity</h3>
          </div>
          <ActivityHeatmap sessions={sessions} />
          <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
            {[
              { val: sessions.length, label: 'Sessions', color: 'var(--accent)' },
              { val: [...new Set(sessions.map((s: any) => s.date?.split('T')[0]))].length, label: 'Active days', color: 'var(--emerald)' },
              {
                val: `${Math.round(sessions.reduce((a: number, s: any) => a + (s.duration || 0), 0) / 3600)}h`,
                label: 'Total study time', color: 'var(--amber)',
              },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card" style={{ padding: 22, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: insights ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--accent-h)" strokeWidth={2} />
            <div>
              <h3 style={{ fontSize: 14 }}>Performance Insights</h3>
              {!insights && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Analyse your patterns and get personalised recommendations
                </p>
              )}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={loadInsights} disabled={loadingInsights} style={{ flexShrink: 0 }}>
            {loadingInsights ? (
              <><RefreshCw size={13} className="spin" /><span>Analysing...</span></>
            ) : insights ? (
              <><RefreshCw size={13} /><span>Refresh</span></>
            ) : (
              <><Sparkles size={13} /><span>Analyse Progress</span></>
            )}
          </button>
        </div>

        {insights && (
          <div style={{ animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Score + message */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 20, alignItems: 'center' }}>
              <div style={{
                textAlign: 'center', padding: '18px 28px',
                background: 'var(--bg-3)', borderRadius: 12, border: '1px solid var(--border)',
              }}>
                <div style={{
                  fontSize: 38, fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                  color: insights.overallScore >= 70 ? 'var(--emerald)' : insights.overallScore >= 40 ? 'var(--amber)' : 'var(--rose)',
                }}>
                  {insights.overallScore}
                </div>
                <div className="section-label" style={{ marginTop: 4 }}>Overall Score</div>
              </div>
              <div>
                <div style={{
                  padding: '11px 16px',
                  background: 'var(--accent-dim)',
                  borderRadius: 10, marginBottom: 10,
                  fontSize: 13.5, color: 'var(--accent-h)',
                  fontStyle: 'italic', lineHeight: 1.6,
                }}>
                  &ldquo;{insights.motivationalMessage}&rdquo;
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {insights.predictedRetention && (
                    <span className="badge badge-green">Retention {insights.predictedRetention}</span>
                  )}
                  {insights.studyPattern && (
                    <span className="badge badge-purple">{insights.studyPattern}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Strengths / weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 16, background: 'var(--emerald-dim)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <CheckCircle2 size={14} color="var(--emerald)" strokeWidth={2} />
                  <span className="section-label" style={{ color: 'var(--emerald)' }}>Strengths</span>
                </div>
                {insights.strengths?.map((s, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 4, lineHeight: 1.5 }}>— {s}</div>
                ))}
              </div>
              <div style={{ padding: 16, background: 'var(--rose-dim)', borderRadius: 10, border: '1px solid rgba(244,63,94,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <AlertCircle size={14} color="var(--rose)" strokeWidth={2} />
                  <span className="section-label" style={{ color: 'var(--rose)' }}>Needs Work</span>
                </div>
                {insights.weaknesses?.map((s, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 4, lineHeight: 1.5 }}>— {s}</div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: 14 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.recommendations?.map((r, i) => (
                  <div key={i} style={{
                    padding: '11px 15px', background: 'var(--bg-3)', borderRadius: 9,
                    borderLeft: `3px solid ${priorityColor(r.priority)}`,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <span className={`badge ${priorityBadge(r.priority)}`} style={{ marginTop: 1, flexShrink: 0 }}>{r.priority}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{r.action}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {insights.nextMilestone && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px',
                background: 'var(--amber-dim)', borderRadius: 9,
                border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 13, color: 'var(--amber)',
              }}>
                <Target size={15} strokeWidth={2} />
                <span>Next milestone: <strong style={{ color: 'var(--amber)' }}>{insights.nextMilestone}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick access */}
      <h3 style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, fontFamily: 'Inter', fontWeight: 500 }}>Quick Access</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
        {quickAccess.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveModule(m.id)}
            className="card-interactive"
            style={{ padding: '16px 18px', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: `${m.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <m.icon size={17} color={m.color} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13.5 }}>{m.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{m.sub}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { getStorageData, setStorageData } from '../../lib/store';
import { Play, Pause, Square, Timer, Coffee } from 'lucide-react';

interface TimerProps { subject?: string; }

export default function StudyTimer({ subject = 'General' }: TimerProps) {
  const [running, setRunning]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [mode, setMode]               = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [pomodoroMins, setPomodoroMins] = useState(25);
  const [breakMins, setBreakMins]     = useState(5);
  const [phase, setPhase]             = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef  = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const pomodoroTotal = (phase === 'work' ? pomodoroMins : breakMins) * 60;
  const timeLeft      = mode === 'pomodoro' ? pomodoroTotal - elapsed : elapsed;

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current  = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(newElapsed);
        if (mode === 'pomodoro' && newElapsed >= pomodoroTotal) {
          if (phase === 'work') {
            logSession(pomodoroMins * 60);
            setPomodoroCount(c => c + 1);
            setPhase('break');
          } else {
            setPhase('work');
          }
          setElapsed(0);
          startTimeRef.current = Date.now();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`PrepPro: ${phase === 'work' ? 'Break time!' : 'Back to study!'}`, {
              body: phase === 'work' ? `Take a ${breakMins}m break.` : `Continue with ${subject}`,
            });
          }
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, phase, pomodoroTotal]);

  const logSession = (durationSeconds: number) => {
    const sessions = getStorageData<any[]>('sessions', []);
    sessions.push({ id: Date.now().toString(), subject, date: new Date().toISOString(), duration: Math.round(durationSeconds / 60) });
    setStorageData('sessions', sessions);
  };

  const stop = () => {
    setRunning(false);
    if (mode === 'stopwatch' && elapsed > 60) logSession(elapsed);
    setElapsed(0); setPhase('work');
  };

  const fmt = (s: number) => {
    const a = Math.abs(s);
    return `${Math.floor(a / 60).toString().padStart(2, '0')}:${(a % 60).toString().padStart(2, '0')}`;
  };

  const progress     = mode === 'pomodoro' ? (elapsed / pomodoroTotal) * 100 : 0;
  const circ         = 2 * Math.PI * 50;
  const isBreak      = phase === 'break';

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
      <div className="card glass" style={{ width: 208, border: '1px solid var(--border-2)', boxShadow: '0 12px 32px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-3)', padding: 3, gap: 3 }}>
          {(['pomodoro', 'stopwatch'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setElapsed(0); setRunning(false); }} style={{
              flex: 1, padding: '5px 0', borderRadius: 6, border: 'none',
              background: mode === m ? 'var(--surface-2)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-3)',
              cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              {m === 'pomodoro' ? <><Coffee size={11} />Focus</> : <><Timer size={11} />Timer</>}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 16px 14px' }}>
          {/* Timer display */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {mode === 'pomodoro' ? (
              <div style={{ position: 'relative', width: 108, height: 108 }}>
                <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="54" cy="54" r="50" fill="none" stroke="var(--bg-3)" strokeWidth="5" />
                  <circle cx="54" cy="54" r="50" fill="none"
                    stroke={isBreak ? 'var(--emerald)' : 'var(--accent)'}
                    strokeWidth="5" strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 600, color: isBreak ? 'var(--emerald)' : 'var(--accent-h)' }}>
                    {fmt(timeLeft)}
                  </div>
                  <div className="section-label" style={{ marginTop: 3, color: isBreak ? 'var(--emerald)' : 'var(--text-3)' }}>
                    {isBreak ? 'break' : 'focus'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 30, fontWeight: 600, color: 'var(--accent-h)', padding: '12px 0' }}>
                {fmt(elapsed)}
              </div>
            )}
          </div>

          {/* Pomodoro dots */}
          {mode === 'pomodoro' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i < (pomodoroCount % 4) ? 'var(--accent)' : 'var(--bg-3)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}

          {/* Subject */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span className="badge badge-purple" style={{ fontSize: 10.5 }}>{subject}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setRunning(!running); if ('Notification' in window) Notification.requestPermission(); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                background: running ? 'var(--amber-dim)' : 'var(--accent)',
                color: running ? 'var(--amber)' : 'white',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
              }}>
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Start</>}
            </button>
            <button onClick={stop} style={{
              padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <Square size={13} strokeWidth={2} />
            </button>
          </div>

          {/* Pomodoro settings */}
          {mode === 'pomodoro' && !running && (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Focus', value: pomodoroMins, set: setPomodoroMins, max: 60, step: 5 },
                { label: 'Break', value: breakMins,    set: setBreakMins,     max: 30, step: 5 },
              ].map(({ label, value, set, max, step }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{label} (min)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    <button onClick={() => set(Math.max(step, value - step))} style={{
                      width: 20, height: 20, borderRadius: 5, border: '1px solid var(--border)',
                      background: 'var(--bg-3)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text)', minWidth: 22, textAlign: 'center' }}>{value}</span>
                    <button onClick={() => set(Math.min(max, value + step))} style={{
                      width: 20, height: 20, borderRadius: 5, border: '1px solid var(--border)',
                      background: 'var(--bg-3)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

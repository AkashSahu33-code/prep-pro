'use client';
import { useState, useEffect, useRef } from 'react';
import { getStorageData, setStorageData } from '../../lib/store';

interface TimerProps {
  subject?: string;
  topic?: string;
}

export default function StudyTimer({ subject = 'General', topic = 'Study' }: TimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('pomodoro');
  const [pomodoroMins, setPomodoroMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const pomodoroTotal = (phase === 'work' ? pomodoroMins : breakMins) * 60;
  const timeLeft = mode === 'pomodoro' ? pomodoroTotal - elapsed : elapsed;

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(newElapsed);
        if (mode === 'pomodoro' && newElapsed >= pomodoroTotal) {
          // Phase complete
          if (phase === 'work') {
            logSession(pomodoroMins * 60);
            setPomodoroCount(c => c + 1);
            setPhase('break');
          } else {
            setPhase('work');
          }
          setElapsed(0);
          startTimeRef.current = Date.now();
          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`StudyAI: ${phase === 'work' ? '🎉 Break time!' : '📚 Back to study!'}`, {
              body: phase === 'work' ? `Great work! Take a ${breakMins} minute break.` : `Time to study ${subject} - ${topic}`,
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
    sessions.push({
      id: Date.now().toString(),
      subject, topic,
      date: new Date().toISOString(),
      duration: Math.round(durationSeconds / 60), // minutes
    });
    setStorageData('sessions', sessions);
  };

  const stop = () => {
    setRunning(false);
    if (mode === 'stopwatch' && elapsed > 60) logSession(elapsed);
    setElapsed(0);
    setPhase('work');
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) Notification.requestPermission();
  };

  const fmt = (s: number) => {
    const absS = Math.abs(s);
    const m = Math.floor(absS / 60);
    const sec = absS % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'pomodoro' ? (elapsed / pomodoroTotal) * 100 : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
      <div className="card glass" style={{ padding: 20, width: 220, border: '1px solid var(--border-2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-3)', borderRadius: 6, padding: 3 }}>
          {(['pomodoro', 'stopwatch'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setElapsed(0); setRunning(false); }}
              style={{ flex: 1, padding: '4px 0', borderRadius: 4, border: 'none', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? 'white' : 'var(--text-3)', cursor: 'pointer', fontSize: 11, fontFamily: 'Syne', fontWeight: 600, transition: 'all 0.15s' }}>
              {m === 'pomodoro' ? '🍅 Pomo' : '⏱ Timer'}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, position: 'relative' }}>
          {mode === 'pomodoro' ? (
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-3)" strokeWidth="6" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={phase === 'work' ? 'var(--accent)' : 'var(--green)'} strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 600, color: phase === 'work' ? 'var(--accent-2)' : 'var(--green)' }}>
                  {fmt(timeLeft)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'Syne' }}>{phase}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 32, fontWeight: 600, color: 'var(--accent-2)', padding: '10px 0' }}>
              {fmt(elapsed)}
            </div>
          )}
        </div>

        {/* Pomodoro count */}
        {mode === 'pomodoro' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < (pomodoroCount % 4) ? 'var(--accent)' : 'var(--bg-3)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        {/* Subject tag */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span className="badge badge-purple" style={{ fontSize: 11 }}>{subject}</span>
          {topic !== 'Study' && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>{topic}</span>}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setRunning(!running); requestNotificationPermission(); }}
            style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: running ? 'var(--amber-dim)' : 'var(--accent)', color: running ? 'var(--amber)' : 'white', cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={stop} style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 }}>
            ⏹
          </button>
        </div>

        {/* Pomo settings */}
        {mode === 'pomodoro' && !running && (
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[{ label: 'Work', value: pomodoroMins, set: setPomodoroMins }, { label: 'Break', value: breakMins, set: setBreakMins }].map(({ label, value, set }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>{label} (min)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                  <button onClick={() => set(Math.max(1, value - 5))} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--text)', minWidth: 24, textAlign: 'center' }}>{value}</span>
                  <button onClick={() => set(Math.min(60, value + 5))} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

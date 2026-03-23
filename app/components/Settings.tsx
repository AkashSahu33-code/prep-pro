'use client';
import { useState } from 'react';
import { useTheme } from '../layout';
import { Sun, Moon, Trash2, HardDrive, Palette, Info } from 'lucide-react';

export default function Settings() {
  const { theme, toggle } = useTheme();
  const [cleared, setCleared] = useState(false);

  const clearData = () => {
    if (confirm('This will permanently delete all your concepts, sessions, and study history. Continue?')) {
      ['concepts', 'sessions', 'streak', 'planner_data', 'chatStore', 'memories'].forEach(k => localStorage.removeItem(k));
      setCleared(true);
      setTimeout(() => setCleared(false), 4000);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22 }}>Settings</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 4 }}>Manage your preferences and account data</p>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Palette size={16} color="var(--text-2)" strokeWidth={2} />
          <h3 style={{ fontSize: 14 }}>Appearance</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13.5 }}>Color theme</div>
            <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>
              Currently using {theme === 'dark' ? 'dark' : 'light'} mode
            </div>
          </div>
          <button
            onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-2)',
              borderRadius: 9, cursor: 'pointer',
              color: 'var(--text)', fontSize: 13, fontWeight: 500,
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {theme === 'dark'
              ? <><Sun size={15} strokeWidth={2} /> Switch to Light</>
              : <><Moon size={15} strokeWidth={2} /> Switch to Dark</>
            }
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <HardDrive size={16} color="var(--text-2)" strokeWidth={2} />
          <h3 style={{ fontSize: 14 }}>Data & Storage</h3>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
          All study data is stored locally in your browser — no accounts, no cloud sync, no tracking.
        </p>
        {cleared && (
          <div style={{ padding: '10px 14px', background: 'var(--emerald-dim)', borderRadius: 9, fontSize: 13, color: 'var(--emerald)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, border: '1px solid rgba(16,185,129,0.2)' }}>
            All data has been cleared successfully.
          </div>
        )}
        <button className="btn btn-danger" onClick={clearData}>
          <Trash2 size={14} strokeWidth={2} /> Clear All Study Data
        </button>
      </div>

      {/* About */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Info size={16} color="var(--text-2)" strokeWidth={2} />
          <h3 style={{ fontSize: 14 }}>About PrepPro</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Memory Algorithm', value: 'SM-2 (SuperMemo 2)' },
            { label: 'AI Model', value: 'Stepfun via OpenRouter' },
            { label: 'Storage', value: 'Browser localStorage (private)' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

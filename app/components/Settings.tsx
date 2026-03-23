'use client';
import { useState } from 'react';

export default function Settings() {
  const [cleared, setCleared] = useState(false);

  const clearData = () => {
    if (confirm('Clear ALL study data (concepts, sessions, plans)? This cannot be undone.')) {
      ['concepts', 'sessions', 'streak', 'planner_data'].forEach(k => localStorage.removeItem(k));
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>⚙️ Settings</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Configure your StudyAI app</p>
      </div>

      {/* Data Management */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>💾 Data Management</h3>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16 }}>All your study data is stored locally in your browser. No accounts, no cloud, no tracking.</p>
        {cleared && <div style={{ padding: 10, background: 'var(--green-dim)', borderRadius: 8, fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>✓ All data cleared successfully.</div>}
        <button className="btn-secondary" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={clearData}>
          🗑 Clear All Study Data
        </button>
      </div>
    </div>
  );
}

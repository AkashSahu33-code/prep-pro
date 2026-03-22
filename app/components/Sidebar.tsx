'use client';
import { useState } from 'react';

interface SidebarProps { activeModule: string; setActiveModule: (m: string) => void; }

const modules = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'spaced', icon: '🔁', label: 'Spaced Repetition' },
  { id: 'planner', icon: '📅', label: 'Study Planner' },
  { id: 'practice', icon: '⚡', label: 'Practice Questions' },
  { id: 'tutor', icon: '🤖', label: 'AI Tutor' },
  { id: 'video', icon: '🎬', label: 'Video Processor' },
];

export default function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{ width: collapsed ? 60 : 238, minHeight: '100vh', background: 'var(--bg-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✦</div>
        {!collapsed && <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>StudyAI</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {modules.map(m => (
          <button key={m.id} className={`sidebar-item ${activeModule === m.id ? 'active' : ''}`}
            onClick={() => setActiveModule(m.id)} title={collapsed ? m.label : ''}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 12px', overflow: 'hidden' }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{m.icon}</span>
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{m.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button className={`sidebar-item ${activeModule === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveModule('settings')}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 12px' }}>
          <span style={{ fontSize: 17, flexShrink: 0 }}>⚙️</span>
          {!collapsed && <span style={{ fontSize: 13 }}>Settings</span>}
        </button>
        <button className="sidebar-item" onClick={() => setCollapsed(!collapsed)}
          style={{ justifyContent: 'center', padding: '8px' }}>
          <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{collapsed ? '→' : '←'}</span>
        </button>
      </div>
    </aside>
  );
}

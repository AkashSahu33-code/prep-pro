'use client';
import { useState } from 'react';
import {
  LayoutDashboard, BrainCircuit, CalendarDays, Zap,
  MessageSquare, Video, Settings, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

interface SidebarProps { activeModule: string; setActiveModule: (m: string) => void; }

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'spaced',    icon: BrainCircuit,   label: 'Memory Engine' },
  { id: 'planner',  icon: CalendarDays,   label: 'Schedule Builder' },
  { id: 'practice', icon: Zap,            label: 'Practice Tests' },
  { id: 'tutor',    icon: MessageSquare,  label: 'AI Tutor' },
  { id: 'video',    icon: Video,          label: 'Lecture Digest' },
  { id: 'autodub',  icon: Sparkles,       label: 'Auto-Dub' },
];

export default function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{
      width: collapsed ? 58 : 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 20,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '14px 0' : '14px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 56,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--violet))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(109,94,245,0.4)',
        }}>
          <Sparkles size={14} color="white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <span style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: 17,
            color: 'var(--text)',
            letterSpacing: '-0.04em',
            whiteSpace: 'nowrap',
          }}>
            PrepPro
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {!collapsed && (
          <div className="section-label" style={{ padding: '10px 8px 6px' }}>Navigation</div>
        )}
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`nav-item ${activeModule === id ? 'active' : ''}`}
            onClick={() => setActiveModule(id)}
            title={collapsed ? label : ''}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '8px 10px' }}
          >
            <Icon size={17} strokeWidth={1.8} />
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '6px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button
          className={`nav-item ${activeModule === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveModule('settings')}
          title={collapsed ? 'Settings' : ''}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '8px 10px' }}
        >
          <Settings size={17} strokeWidth={1.8} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          className="nav-item"
          onClick={() => setCollapsed((c: boolean) => !c)}
          style={{ justifyContent: 'center', padding: '8px' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={15} strokeWidth={2} style={{ color: 'var(--text-3)' }} />
            : <ChevronLeft  size={15} strokeWidth={2} style={{ color: 'var(--text-3)' }} />
          }
        </button>
      </div>
    </aside>
  );
}

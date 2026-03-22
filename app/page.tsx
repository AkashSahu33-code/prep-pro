'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SpacedRepetition from './components/SpacedRepetition';
import StudyPlanner from './components/StudyPlanner';
import PracticeQuestions from './components/PracticeQuestions';
import AITutor from './components/AITutor';
import VideoProcessor from './components/VideoProcessor';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

// Timer uses browser APIs, load client-side only
const StudyTimer = dynamic(() => import('./components/StudyTimer'), { ssr: false });

const MODULE_SUBJECTS: Record<string, string> = {
  spaced: 'Spaced Repetition',
  planner: 'Study Planning',
  practice: 'Practice',
  tutor: 'AI Tutoring',
  video: 'Video Study',
};

export default function Home() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showTimer, setShowTimer] = useState(true);
  const isTutor = activeModule === 'tutor';

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':  return <Dashboard setActiveModule={setActiveModule} />;
      case 'spaced':     return <SpacedRepetition />;
      case 'planner':    return <StudyPlanner />;
      case 'practice':   return <PracticeQuestions />;
      case 'tutor':      return <AITutor />;
      case 'video':      return <VideoProcessor />;
      case 'settings':   return <Settings />;
      default:           return <Dashboard setActiveModule={setActiveModule} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      <main style={{ flex: 1, overflowY: isTutor ? 'hidden' : 'auto', background: 'var(--bg)', position: 'relative', height: '100%' }}>
        {/* Ambient gradient */}
        <div style={{ position: 'fixed', top: 0, right: 0, width: 700, height: 700, background: 'radial-gradient(ellipse at top right, rgba(124,106,247,0.05) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Timer toggle button */}
        {activeModule !== 'dashboard' && activeModule !== 'settings' && (
          <button onClick={() => setShowTimer(v => !v)}
            style={{ position: 'fixed', bottom: showTimer ? 220 : 24, right: 24, zIndex: 200, width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'bottom 0.3s ease' }}
            title={showTimer ? 'Hide timer' : 'Show study timer'}>
            ⏱
          </button>
        )}

        <div style={{ position: 'relative', zIndex: 1, height: isTutor ? '100%' : 'auto', minHeight: isTutor ? '100%' : undefined }}>
          <ErrorBoundary>
            {renderModule()}
          </ErrorBoundary>
        </div>
      </main>

      {/* Floating study timer */}
      {showTimer && activeModule !== 'dashboard' && activeModule !== 'settings' && (
        <StudyTimer subject={MODULE_SUBJECTS[activeModule] || 'Study'} />
      )}
    </div>
  );
}

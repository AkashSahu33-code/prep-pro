'use client';
import { useState, createContext, useContext, useEffect } from 'react';
import type { Metadata } from "next";
import "./globals.css";

// Theme context
export const ThemeCtx = createContext<{ theme: string; toggle: () => void }>({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.className = saved === 'light' ? 'light' : '';
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.className = next === 'light' ? 'light' : '';
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>PrepPro — Intelligent Study Platform</title>
        <meta name="description" content="AI-powered spaced repetition, adaptive scheduling, practice testing, and personal tutoring — all in one place." />
      </head>
      <body>
        <ThemeCtx.Provider value={{ theme, toggle }}>
          {children}
        </ThemeCtx.Provider>
      </body>
    </html>
  );
}

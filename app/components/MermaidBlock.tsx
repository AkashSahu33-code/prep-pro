'use client';
import { useEffect, useRef, useState } from 'react';

interface MermaidBlockProps {
  chart: string;
}

export default function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#7c6af7',
            primaryTextColor: '#e8e8f0',
            primaryBorderColor: '#7c6af7',
            lineColor: '#5a5a75',
            secondaryColor: '#252535',
            tertiaryColor: '#1e1e2e',
            background: '#1e1e2e',
            mainBkg: '#252535',
            secondBkg: '#1a1a24',
            border1: '#2a2a3d',
            border2: '#363650',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            nodeBorder: '#7c6af7',
            clusterBkg: '#1a1a24',
            clusterBorder: '#2a2a3d',
            edgeLabelBackground: '#1e1e2e',
            nodeTextColor: '#e8e8f0',
          },
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
          sequence: { useMaxWidth: true },
        });

        const { svg: rendered } = await mermaid.render(idRef.current, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to render diagram');
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)', margin: '10px 0', fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
        <div style={{ marginBottom: 6, color: 'var(--amber)', fontSize: 11 }}>⚠️ Diagram rendering failed</div>
        {chart}
      </div>
    );
  }

  if (!svg) {
    return (
      <div style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)', margin: '10px 0', textAlign: 'center' }}>
        <div className="typing-dot" style={{ display: 'inline-block' }} />
        <div className="typing-dot" style={{ display: 'inline-block' }} />
        <div className="typing-dot" style={{ display: 'inline-block' }} />
      </div>
    );
  }

  return (
    <div ref={containerRef}
      style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)', margin: '10px 0', overflowX: 'auto', textAlign: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

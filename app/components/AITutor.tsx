'use client';
import { useState, useRef, useEffect } from 'react';
import { SUBJECTS } from '../../lib/store';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }

function formatResponse(text: string) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

const QUICK_PROMPTS = [
  "Explain Newton's Laws with examples",
  "How does photosynthesis work?",
  "Differentiate mitosis vs meiosis",
  "Solve: ∫x² dx step by step",
  "What is Ohm's Law? Give examples",
  "Explain the Krebs cycle simply",
  "What are p-block elements?",
  "Explain oxidation and reduction",
];

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Namaste! 🙏 I\'m your AI Tutor, powered by **Gemini 1.5 Flash** and grounded in NCERT & standard textbooks.\n\nAsk me anything — Physics, Chemistry, Maths, Biology, History, and more. I can explain in **English or Hinglish** — your choice!',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Auto-detect');
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, subject: subject !== 'Auto-detect' ? subject : undefined }),
      });
      const data = await res.json();
      if (data.error?.includes('GEMINI_API_KEY')) {
        setApiKeyMissing(true);
        setMessages([...newMessages, { role: 'assistant', content: '⚠️ **Gemini API key not configured.** Please add your free API key to `.env.local`:\n\n`GEMINI_API_KEY=your_key`\n\nGet a free key at: https://aistudio.google.com/app/apikey', timestamp: new Date() }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.reply || data.error || 'Could not get a response.', timestamp: new Date() }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ Network error. Please check your connection.', timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--bg-2)' }}>
        <div>
          <h1 style={{ fontSize: 20, marginBottom: 1 }}>🤖 AI Tutor</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 12 }}>Gemini 1.5 Flash • NCERT-grounded • Free tier</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', fontSize: 13, padding: '7px 12px' }} value={subject} onChange={e => setSubject(e.target.value)}>
            <option>Auto-detect</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setMessages([{ role: 'assistant', content: 'Conversation cleared! Ask me anything 😊', timestamp: new Date() }])}>
            🗑 Clear
          </button>
        </div>
      </div>

      {/* API key warning */}
      {apiKeyMissing && (
        <div style={{ padding: '10px 28px', background: 'var(--amber-dim)', borderBottom: '1px solid var(--amber)', flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: 'var(--amber)' }}>
            ⚠️ Add <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4 }}>GEMINI_API_KEY</code> to <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4 }}>.env.local</code> — free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline' }}>aistudio.google.com</a>
          </p>
        </div>
      )}

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'Syne', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Try asking</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s', fontFamily: 'DM Sans' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent-2)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-2)'; }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, border: '1px solid var(--border)' }}>
              {m.role === 'user' ? '👤' : '🤖'}
            </div>
            <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px', background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)', border: m.role === 'user' ? 'none' : '1px solid var(--border)' }}>
              <div className="prose-ai" style={{ color: m.role === 'user' ? 'white' : 'var(--text)', fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(m.content)}</p>` }} />
              <div style={{ fontSize: 10, color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--text-3)', marginTop: 6 }}>
                {m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: '1px solid var(--border)' }}>🤖</div>
            <div style={{ padding: '14px 18px', borderRadius: '2px 12px 12px 12px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-2)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea ref={inputRef} className="input" rows={2}
            style={{ resize: 'none', minHeight: 48, maxHeight: 120, lineHeight: 1.5 }}
            placeholder="Type your doubt... (Enter to send, Shift+Enter for new line)"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />
          <button className="btn-primary" style={{ height: 48, minWidth: 80, justifyContent: 'center', flexShrink: 0 }}
            onClick={() => send()} disabled={loading || !input.trim()}>
            Send ↑
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
          Powered by Gemini 1.5 Flash (free tier) • Grounded in NCERT & standard textbooks
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SUBJECTS } from '../../lib/store';
import {
  Conversation, ChatMessage, ChatAttachment,
  createConversation, getAllConversations, getConversation,
  updateConversation, deleteConversation, autoTitle,
} from '../../lib/chatStore';
import { getMemories, addMemories, getMemoriesForPrompt, deleteMemory, MemoryItem } from '../../lib/memory';

// Dynamic import MermaidBlock to avoid SSR issues
const MermaidBlock = dynamic(() => import('./MermaidBlock'), { ssr: false });

interface DisplayMessage { role: 'user' | 'assistant'; content: string; timestamp: Date; }

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

interface ContentSegment {
  type: 'text' | 'mermaid' | 'code';
  content: string;
  language?: string;
}

function parseMessageContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  // Match ```mermaid ... ``` and ```language ... ``` blocks
  const codeBlockRegex = /```(\w*)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: 'text', content: text });
    }
    const lang = match[1].toLowerCase();
    const code = match[2].trim();
    if (lang === 'mermaid') {
      segments.push({ type: 'mermaid', content: code });
    } else {
      segments.push({ type: 'code', content: code, language: lang || 'text' });
    }
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: 'text', content: text });
  }

  if (segments.length === 0) segments.push({ type: 'text', content });
  return segments;
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="prose-ai" style={{ color: 'white', fontSize: 14 }}
      dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(content)}</p>` }} />;
  }

  const segments = parseMessageContent(content);

  return (
    <div className="prose-ai" style={{ color: 'var(--text)', fontSize: 14 }}>
      {segments.map((seg, i) => {
        if (seg.type === 'mermaid') {
          return <MermaidBlock key={i} chart={seg.content} />;
        }
        if (seg.type === 'code') {
          return (
            <div key={i} style={{ margin: '10px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ padding: '4px 12px', background: 'var(--surface-2)', fontSize: 11, color: 'var(--text-3)', fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>
                {seg.language}
              </div>
              <pre style={{ padding: '12px 14px', background: 'var(--bg-3)', margin: 0, overflowX: 'auto', fontSize: 13, lineHeight: 1.6 }}>
                <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{seg.content}</code>
              </pre>
            </div>
          );
        }
        return <div key={i} dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(seg.content)}</p>` }} />;
      })}
    </div>
  );
}

const QUICK_PROMPTS = [
  "Explain Newton's Laws with examples",
  "How does photosynthesis work?",
  "Differentiate mitosis vs meiosis",
  "Solve: ∫x² dx step by step",
  "What is Ohm's Law? Give examples",
  "Explain the Krebs cycle simply",
];

export default function AITutor() {
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  // UI state
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Auto-detect');
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ filename: string; text: string } | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [memories, setMemoriesState] = useState<MemoryItem[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    const all = getAllConversations();
    setConversations(all);
    if (all.length > 0) {
      loadConversation(all[0].id);
    }
    setMemoriesState(getMemories());
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversation = (id: string) => {
    const convo = getConversation(id);
    if (!convo) return;
    setActiveConvoId(id);
    setMessages(convo.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    setAttachments(convo.attachments || []);
    setPendingFile(null);
    setEditingTitle(false);
  };

  const handleNewChat = () => {
    const convo = createConversation();
    setConversations([convo, ...conversations]);
    setActiveConvoId(convo.id);
    setMessages([]);
    setAttachments([]);
    setPendingFile(null);
    setEditingTitle(false);
    inputRef.current?.focus();
  };

  const handleDeleteConvo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeConvoId === id) {
      if (updated.length > 0) {
        loadConversation(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const saveCurrentMessages = useCallback((msgs: DisplayMessage[], atts?: ChatAttachment[], title?: string) => {
    if (!activeConvoId) return;
    const chatMsgs: ChatMessage[] = msgs.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    const updates: any = { messages: chatMsgs };
    if (atts) updates.attachments = atts;
    if (title) updates.title = title;
    updateConversation(activeConvoId, updates);
    setConversations(getAllConversations());
  }, [activeConvoId]);

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/tutor/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        const att: ChatAttachment = { filename: data.filename, text: data.text, pageCount: data.pageCount };
        setPendingFile({ filename: data.filename, text: data.text });
        const newAtts = [...attachments, att];
        setAttachments(newAtts);
        if (activeConvoId) {
          saveCurrentMessages(messages, newAtts);
        }
      }
    } catch {
      alert('Failed to upload file. Please try again.');
    }
    setUploadingFile(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Extract memories periodically
  const extractMemories = async (msgs: DisplayMessage[]) => {
    if (msgs.length < 6 || msgs.length % 5 !== 0) return; // every 5 messages
    try {
      const apiMsgs = msgs.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/tutor/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs }),
      });
      const data = await res.json();
      if (data.facts && data.facts.length > 0) {
        addMemories(data.facts, subject !== 'Auto-detect' ? subject : undefined);
        setMemoriesState(getMemories());
      }
    } catch { /* non-critical */ }
  };

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    // Ensure active conversation exists
    let convoId = activeConvoId;
    if (!convoId) {
      const convo = createConversation(autoTitle(msg));
      setConversations(prev => [convo, ...prev.filter(c => c.id !== convo.id)]);
      convoId = convo.id;
      setActiveConvoId(convoId);
    }

    const userMsg: DisplayMessage = { role: 'user', content: msg, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Auto-title on first user message
    if (newMessages.filter(m => m.role === 'user').length === 1) {
      const title = autoTitle(msg);
      updateConversation(convoId, { title });
      setConversations(getAllConversations());
    }

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      // Build file context from all attachments
      const fileContext = attachments.length > 0
        ? attachments.map(a => `[File: ${a.filename}]\n${a.text}`).join('\n\n---\n\n')
        : undefined;

      // Get memory facts for the prompt
      const memoryFacts = getMemories().map(m => m.fact);

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          subject: subject !== 'Auto-detect' ? subject : undefined,
          memories: memoryFacts.length > 0 ? memoryFacts : undefined,
          fileContext,
        }),
      });
      const data = await res.json();

      let replyContent: string;
      if (data.error?.includes('GEMINI_API_KEY')) {
        setApiKeyMissing(true);
        replyContent = '⚠️ **Gemini API key not configured.** Please add your free API key to `.env.local`:\n\n`GEMINI_API_KEY=your_key`\n\nGet a free key at: https://aistudio.google.com/app/apikey';
      } else {
        replyContent = data.reply || data.error || 'Could not get a response.';
      }

      const finalMessages = [...newMessages, { role: 'assistant' as const, content: replyContent, timestamp: new Date() }];
      setMessages(finalMessages);
      saveCurrentMessages(finalMessages, attachments);

      // Try to extract memories
      extractMemories(finalMessages);
    } catch {
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: '⚠️ Network error. Please check your connection.', timestamp: new Date() }];
      setMessages(finalMessages);
      saveCurrentMessages(finalMessages, attachments);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleRenameConvo = () => {
    if (!activeConvoId || !titleInput.trim()) return;
    updateConversation(activeConvoId, { title: titleInput.trim() });
    setConversations(getAllConversations());
    setEditingTitle(false);
  };

  const activeConvo = conversations.find(c => c.id === activeConvoId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Conversation Sidebar */}
      <div style={{
        width: sidebarOpen ? 260 : 0,
        minHeight: '100%',
        background: 'var(--bg)',
        borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '8px 12px' }} onClick={handleNewChat}>
            + New Chat
          </button>
          <button className="btn-ghost" style={{ padding: '8px', fontSize: 12 }} onClick={() => setShowMemory(!showMemory)} title="Memory">
            🧠
          </button>
        </div>

        {/* Memory Panel */}
        {showMemory && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', maxHeight: 200, overflowY: 'auto', background: 'var(--bg-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Memory ({memories.length})</span>
            </div>
            {memories.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>No memories yet. Chat more and I&apos;ll remember key facts!</p>
            )}
            {memories.slice(0, 15).map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{m.fact}</span>
                <button onClick={() => { deleteMemory(m.id); setMemoriesState(getMemories()); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 10, flexShrink: 0, padding: '2px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {conversations.map(c => (
            <div key={c.id}
              onClick={() => loadConversation(c.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 2,
                background: c.id === activeConvoId ? 'var(--accent-glow)' : 'transparent',
                border: c.id === activeConvoId ? '1px solid rgba(124,106,247,0.2)' : '1px solid transparent',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { if (c.id !== activeConvoId)(e.currentTarget.style.background = 'var(--surface-2)'); }}
              onMouseLeave={e => { if (c.id !== activeConvoId)(e.currentTarget.style.background = 'transparent'); }}
            >
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: c.id === activeConvoId ? 'var(--accent-2)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                  {c.title}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {c.messages.length} msgs • {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <button onClick={(e) => handleDeleteConvo(c.id, e)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, padding: '2px 4px', opacity: 0.5, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                title="Delete conversation">
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <button className="btn-ghost" style={{ padding: '6px 8px', fontSize: 14 }} onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editingTitle ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className="input" style={{ fontSize: 14, padding: '4px 8px', width: 240 }}
                    value={titleInput} onChange={e => setTitleInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameConvo(); if (e.key === 'Escape') setEditingTitle(false); }}
                    autoFocus />
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleRenameConvo}>✓</button>
                </div>
              ) : (
                <h1 style={{ fontSize: 17, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  onClick={() => { if (activeConvo) { setEditingTitle(true); setTitleInput(activeConvo.title); } }}
                  title="Click to rename">
                  🤖 {activeConvo?.title || 'AI Tutor'}
                </h1>
              )}
              <p style={{ color: 'var(--text-3)', fontSize: 11 }}>Gemini 2.5 Flash Lite • NCERT-grounded</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <select className="input" style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }} value={subject} onChange={e => setSubject(e.target.value)}>
              <option>Auto-detect</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Attachments bar */}
        {attachments.length > 0 && (
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--bg-2)', flexShrink: 0 }}>
            {attachments.map((att, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'var(--accent-glow)', border: '1px solid rgba(124,106,247,0.2)', fontSize: 12, color: 'var(--accent-2)' }}>
                📎 {att.filename} {att.pageCount ? `(${att.pageCount}p)` : ''}
                <button onClick={() => {
                  const newAtts = attachments.filter((_, j) => j !== i);
                  setAttachments(newAtts);
                  if (activeConvoId) saveCurrentMessages(messages, newAtts);
                }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* API key warning */}
        {apiKeyMissing && (
          <div style={{ padding: '8px 20px', background: 'var(--amber-dim)', borderBottom: '1px solid var(--amber)', flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--amber)' }}>
              ⚠️ Add <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4 }}>GEMINI_API_KEY</code> to <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4 }}>.env.local</code>
            </p>
          </div>
        )}

        {/* Quick prompts for empty chat */}
        {messages.length === 0 && (
          <div style={{ padding: '20px 28px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 24, marginTop: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>AI Tutor</h2>
              <p style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
                Ask questions, upload study materials, and get personalized explanations grounded in NCERT textbooks.
              </p>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, fontFamily: 'Syne', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Try asking</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => send(p)}
                  style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s', fontFamily: 'DM Sans' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent-2)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-2)'; }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease forwards' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, border: '1px solid var(--border)' }}>
                {m.role === 'user' ? '👤' : '🤖'}
              </div>
              <div style={{ maxWidth: '82%', padding: '11px 15px', borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px', background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)', border: m.role === 'user' ? 'none' : '1px solid var(--border)' }}>
                <MessageContent content={m.content} isUser={m.role === 'user'} />
                <div style={{ fontSize: 10, color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--text-3)', marginTop: 5 }}>
                  {m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, border: '1px solid var(--border)' }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: '2px 12px 12px 12px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Pending file indicator */}
        {pendingFile && (
          <div style={{ padding: '6px 20px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'var(--green-dim)', border: '1px solid rgba(52,211,153,0.2)', fontSize: 12, color: 'var(--green)' }}>
              ✓ {pendingFile.filename} ready — ask any question about it!
              <button onClick={() => setPendingFile(null)}
                style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 11 }}>✕</button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {/* File upload */}
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv,.log,.json,.xml,.html"
              onChange={handleFileUpload} style={{ display: 'none' }} />
            <button className="btn-ghost" style={{ height: 44, padding: '0 10px', fontSize: 16, flexShrink: 0 }}
              onClick={() => fileRef.current?.click()} disabled={uploadingFile} title="Attach file (PDF, TXT, etc.)">
              {uploadingFile ? '⏳' : '📎'}
            </button>

            <textarea ref={inputRef} className="input" rows={2}
              style={{ resize: 'none', minHeight: 44, maxHeight: 120, lineHeight: 1.5 }}
              placeholder="Type your doubt... (Enter to send, Shift+Enter for new line)"
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />
            <button className="btn-primary" style={{ height: 44, minWidth: 70, justifyContent: 'center', flexShrink: 0, fontSize: 13, padding: '0 16px' }}
              onClick={() => send()} disabled={loading || !input.trim()}>
              Send ↑
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5 }}>
            Gemini 2.5 Flash Lite (free) • {attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Attach PDFs & docs for context'} • {memories.length > 0 ? `${memories.length} memories` : 'Building memory...'}
          </p>
        </div>
      </div>
    </div>
  );
}

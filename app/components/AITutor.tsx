'use client';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { SUBJECTS } from '../../lib/store';
import {
  Conversation, ChatMessage, ChatAttachment,
  createConversation, getAllConversations, getConversation,
  updateConversation, deleteConversation, autoTitle,
} from '../../lib/chatStore';
import { getMemories, addMemories, deleteMemory, MemoryItem } from '../../lib/memory';
import {
  MessageSquare, Plus, Trash2, Brain, Paperclip, Mic, MicOff,
  Volume2, VolumeX, Send, PanelLeftClose, PanelLeftOpen, Pencil, Check, X, Loader2
} from 'lucide-react';

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

interface ContentSegment { type: 'text' | 'code' | 'image-desc' | 'image-url' | 'math-block'; content: string; language?: string; url?: string; }

function parseMessageContent(content: string | any[]): ContentSegment[] {
  if (typeof content !== 'string') {
    try { content = Array.isArray(content) ? JSON.stringify(content) : String(content); } catch { content = ''; }
  }
  const segments: ContentSegment[] = [];
  const codeBlockRegex = /```(\w*)\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0, match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) extractInlineSegments(text, segments);
    }
    segments.push({ type: 'code', content: match[2].trim(), language: match[1].toLowerCase() || 'text' });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) { const text = content.slice(lastIndex).trim(); if (text) extractInlineSegments(text, segments); }
  if (segments.length === 0) segments.push({ type: 'text', content });
  return segments;
}

function extractInlineSegments(text: string, segments: ContentSegment[]) {
  const pattern = /\[IMAGE:\s*([\s\S]*?)\]|!\[([^\]]*)\]\(([^)]+)\)|\$\$([\s\S]*?)\$\$/g;
  let last = 0, m;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) { const before = text.slice(last, m.index).trim(); if (before) segments.push({ type: 'text', content: before }); }
    if (m[1] !== undefined) segments.push({ type: 'image-desc', content: m[1].trim() });
    else if (m[3] !== undefined) segments.push({ type: 'image-url', content: (m[2] || '').trim(), url: m[3].trim() });
    else if (m[4] !== undefined) segments.push({ type: 'math-block', content: m[4].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) { const r = text.slice(last).trim(); if (r) segments.push({ type: 'text', content: r }); }
}

const ImageBlock = memo(function ImageBlock({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div style={{ margin: '12px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={{ position: 'relative', width: '100%', minHeight: status === 'loaded' ? 'auto' : 160, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {status === 'loading' && <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
        {status === 'error' && <p style={{ fontSize: 12, color: 'var(--text-3)', padding: 16, textAlign: 'center' }}>{alt || 'Image unavailable'}</p>}
        {status !== 'error' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} style={{ width: '100%', height: 'auto', display: status === 'loaded' ? 'block' : 'none', maxHeight: 360, objectFit: 'contain' }}
            loading="lazy" onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />
        )}
      </div>
    </div>
  );
});

const GeneratedImageBlock = memo(function GeneratedImageBlock({ prompt }: { prompt: string }) {
  const [status, setStatus]   = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [retry, setRetry]     = useState(0);

  useEffect(() => {
    let cancelled = false; setStatus('loading'); setImageUrl(null);
    const ctrl = new AbortController(); const timeout = setTimeout(() => ctrl.abort(), 30000);
    fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { clearTimeout(timeout); if (cancelled) return; if (d.url) setImageUrl(d.url); else setStatus('error'); })
      .catch(() => { clearTimeout(timeout); if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; clearTimeout(timeout); ctrl.abort(); };
  }, [prompt, retry]);

  return (
    <div style={{ margin: '12px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={{ position: 'relative', width: '100%', minHeight: status === 'loaded' ? 'auto' : 160, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
        {status === 'loading' && <><div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><span style={{ fontSize: 11, color: 'var(--text-3)' }}>Generating illustration...</span></>}
        {status === 'error' && (<><p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '0 16px' }}>{prompt}</p>{retry < 2 && <button onClick={() => setRetry(c => c + 1)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 11 }}>Retry</button>}</>)}
        {imageUrl && status !== 'error' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={prompt} style={{ width: '100%', height: 'auto', display: status === 'loaded' ? 'block' : 'none', maxHeight: 360, objectFit: 'contain' }}
            loading="lazy" onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />
        )}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
        <div className="section-label" style={{ color: 'var(--accent-h)', marginBottom: 2 }}>AI Illustration</div>
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0 }}>{prompt}</p>
      </div>
    </div>
  );
});

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) return <div className="prose-ai" style={{ color: 'white', fontSize: 13.5 }} dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(content)}</p>` }} />;
  const segments = parseMessageContent(content);
  return (
    <div className="prose-ai">
      {segments.map((seg, i) => {
        if (seg.type === 'code') return (
          <div key={i} style={{ margin: '10px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {seg.language && <div style={{ padding: '4px 12px', background: 'var(--surface-2)', fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{seg.language}</div>}
            <pre style={{ padding: '12px 14px', background: 'var(--bg-3)', margin: 0, overflowX: 'auto', fontSize: 12.5, lineHeight: 1.6 }}>
              <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{seg.content}</code>
            </pre>
          </div>
        );
        if (seg.type === 'image-desc') return <GeneratedImageBlock key={`img-${i}`} prompt={seg.content} />;
        if (seg.type === 'image-url') return <ImageBlock key={i} src={seg.url!} alt={seg.content} />;
        if (seg.type === 'math-block') return (
          <div key={i} style={{ margin: '10px 0', padding: '14px 18px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, serif', fontSize: 15, textAlign: 'center', overflowX: 'auto', letterSpacing: '0.5px' }}>
            {seg.content}
          </div>
        );
        return <div key={i} dangerouslySetInnerHTML={{ __html: `<p>${formatResponse(seg.content)}</p>` }} />;
      })}
    </div>
  );
}

const QUICK_PROMPTS = [
  "Explain Newton's Laws with real-world examples",
  "How does photosynthesis work?",
  "Difference between mitosis and meiosis",
  "Solve: ∫x² dx step by step",
  "What is Ohm's Law? Explain with a circuit example",
  "Explain the Krebs cycle in simple terms",
];

export default function AITutor() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages]           = useState<DisplayMessage[]>([]);
  const [attachments, setAttachments]     = useState<ChatAttachment[]>([]);
  const [isListening, setIsListening]     = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const recognitionRef = useRef<any>(null);
  const [input, setInput]                 = useState('');
  const [subject, setSubject]             = useState('Auto-detect');
  const [loading, setLoading]             = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile, setPendingFile]     = useState<{ filename: string; text: string } | null>(null);
  const [showMemory, setShowMemory]       = useState(false);
  const [memories, setMemoriesState]      = useState<MemoryItem[]>([]);
  const [editingTitle, setEditingTitle]   = useState(false);
  const [titleInput, setTitleInput]       = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const all = getAllConversations();
    setConversations(all);
    if (all.length > 0) loadConversation(all[0].id);
    setMemoriesState(getMemories());

    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.onresult = (event: any) => {
        let final = '', interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        const text = final || interim;
        if (text) setInput(prev => prev ? prev + ' ' + text : text);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversation = (id: string) => {
    const convo = getConversation(id); if (!convo) return;
    setActiveConvoId(id);
    setMessages(convo.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    setAttachments(convo.attachments || []);
    setPendingFile(null); setEditingTitle(false);
  };

  const handleNewChat = () => {
    const convo = createConversation();
    setConversations([convo, ...conversations]);
    setActiveConvoId(convo.id); setMessages([]); setAttachments([]);
    setPendingFile(null); setEditingTitle(false);
    inputRef.current?.focus();
  };

  const handleDeleteConvo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id); setConversations(updated);
    if (activeConvoId === id) { if (updated.length > 0) loadConversation(updated[0].id); else handleNewChat(); }
  };

  const saveCurrentMessages = useCallback((msgs: DisplayMessage[], atts?: ChatAttachment[]) => {
    if (!activeConvoId) return;
    const chatMsgs: ChatMessage[] = msgs.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString() }));
    const updates: any = { messages: chatMsgs };
    if (atts) updates.attachments = atts;
    updateConversation(activeConvoId, updates);
    setConversations(getAllConversations());
  }, [activeConvoId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res  = await fetch('/api/tutor/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) { alert(data.error); } else {
        const att: ChatAttachment = { filename: data.filename, text: data.text, pageCount: data.pageCount };
        setPendingFile({ filename: data.filename, text: data.text });
        const newAtts = [...attachments, att]; setAttachments(newAtts);
        if (activeConvoId) saveCurrentMessages(messages, newAtts);
      }
    } catch { alert('Failed to upload file.'); }
    setUploadingFile(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const extractMemories = async (msgs: DisplayMessage[]) => {
    if (msgs.length < 6 || msgs.length % 5 !== 0) return;
    try {
      const res  = await fetch('/api/tutor/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, content: m.content })) }) });
      const data = await res.json();
      if (data.facts?.length > 0) { addMemories(data.facts, subject !== 'Auto-detect' ? subject : undefined); setMemoriesState(getMemories()); }
    } catch {}
  };

  const send = async (text?: string) => {
    const msg = (text || input).trim(); if (!msg || loading) return;
    let convoId = activeConvoId;
    if (!convoId) { const convo = createConversation(autoTitle(msg)); setConversations(prev => [convo, ...prev.filter(c => c.id !== convo.id)]); convoId = convo.id; setActiveConvoId(convoId); }

    const userMsg: DisplayMessage = { role: 'user', content: msg, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setLoading(true);

    if (newMessages.filter(m => m.role === 'user').length === 1) {
      const title = autoTitle(msg); updateConversation(convoId, { title }); setConversations(getAllConversations());
    }

    try {
      const apiMessages  = newMessages.map(m => ({ role: m.role, content: m.content }));
      const fileContext  = attachments.length > 0 ? attachments.map(a => `[File: ${a.filename}]\n${a.text}`).join('\n\n---\n\n') : undefined;
      const memoryFacts  = getMemories().map(m => m.fact);
      const res  = await fetch('/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: apiMessages, subject: subject !== 'Auto-detect' ? subject : undefined, memories: memoryFacts.length > 0 ? memoryFacts : undefined, fileContext }) });
      const data = await res.json();
      let replyContent: string;
      if (data.error?.includes('Ollama') || data.error?.includes('ECONNREFUSED')) {
        setApiKeyMissing(true);
        replyContent = '**Ollama not detected.** Start it with:\n\n`ollama serve`\n\nEnsure the model is available: `ollama pull gemma3:4b`';
      } else {
        replyContent = data.reply || data.error || 'Could not get a response.';
      }
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: replyContent, timestamp: new Date() }];
      setMessages(finalMessages); saveCurrentMessages(finalMessages, attachments);
      extractMemories(finalMessages);
    } catch {
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: 'Network error. Please check your connection.', timestamp: new Date() }];
      setMessages(finalMessages); saveCurrentMessages(finalMessages, attachments);
    }
    setLoading(false);
  };

  const toggleListen = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else {
      if (recognitionRef.current) { recognitionRef.current.start(); setIsListening(true); }
      else alert("Speech recognition isn't supported in your browser.");
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_~`#\[\]]/g, '').replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[IMAGE:.*?\]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN'; utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true); utterance.onend = () => setIsSpeaking(false); utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); setIsSpeaking(false); } };

  const handleRenameConvo = () => {
    if (!activeConvoId || !titleInput.trim()) return;
    updateConversation(activeConvoId, { title: titleInput.trim() }); setConversations(getAllConversations()); setEditingTitle(false);
  };

  const activeConvo = conversations.find(c => c.id === activeConvoId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Conversation sidebar */}
      <div style={{ width: sidebarOpen ? 256 : 0, minHeight: '100%', background: 'var(--bg-2)', borderRight: sidebarOpen ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12.5, padding: '7px 10px' }} onClick={handleNewChat}>
            <Plus size={13} /> New Chat
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMemory(!showMemory)} title="Long-term memory" style={{ padding: '7px 9px' }}>
            <Brain size={14} strokeWidth={2} />
          </button>
        </div>

        {showMemory && (
          <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--border)', maxHeight: 180, overflowY: 'auto', background: 'var(--bg-3)' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Memory ({memories.length})</div>
            {memories.length === 0
              ? <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>No memories yet. Chat more and key facts will be remembered.</p>
              : memories.slice(0, 15).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{m.fact}</span>
                  <button onClick={() => { deleteMemory(m.id); setMemoriesState(getMemories()); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0, padding: 2 }}>
                    <X size={11} />
                  </button>
                </div>
              ))
            }
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {conversations.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 8px', textAlign: 'center' }}>No conversations yet</p>
          )}
          {conversations.map(c => (
            <div key={c.id} onClick={() => loadConversation(c.id)}
              style={{ padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: c.id === activeConvoId ? 'var(--accent-dim)' : 'transparent', border: c.id === activeConvoId ? '1px solid rgba(109,94,245,0.2)' : '1px solid transparent', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { if (c.id !== activeConvoId) (e.currentTarget.style.background = 'var(--surface-2)'); }}
              onMouseLeave={e => { if (c.id !== activeConvoId) (e.currentTarget.style.background = 'transparent'); }}
            >
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: 12.5, color: c.id === activeConvoId ? 'var(--accent-h)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{c.title}</p>
                <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{c.messages.length} msgs · {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <button onClick={e => handleDeleteConvo(c.id, e)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', opacity: 0.5, flexShrink: 0, padding: 2 }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '6px 8px' }}>
              {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editingTitle ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className="input" style={{ fontSize: 13.5, padding: '4px 8px', width: 240, height: 30 }}
                    value={titleInput} onChange={e => setTitleInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameConvo(); if (e.key === 'Escape') setEditingTitle(false); }} autoFocus />
                  <button className="btn btn-ghost btn-xs" onClick={handleRenameConvo}><Check size={12} /></button>
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditingTitle(false)}><X size={12} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter', fontWeight: 600 }}>
                    {activeConvo?.title || 'AI Tutor'}
                  </h1>
                  {activeConvo && (
                    <button className="btn btn-ghost btn-xs" style={{ padding: '3px 5px', opacity: 0.5 }} onClick={() => { setEditingTitle(true); setTitleInput(activeConvo.title); }}>
                      <Pencil size={11} />
                    </button>
                  )}
                </div>
              )}
              <p style={{ color: 'var(--text-3)', fontSize: 10.5, marginTop: 1 }}>StepFun Flash · OpenRouter</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <select className="input" style={{ width: 'auto', fontSize: 12, padding: '5px 9px', height: 32 }} value={subject} onChange={e => setSubject(e.target.value)}>
              <option>Auto-detect</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Attachments bar */}
        {attachments.length > 0 && (
          <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 7, flexWrap: 'wrap', background: 'var(--bg-2)', flexShrink: 0 }}>
            {attachments.map((att, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 100, background: 'var(--accent-dim)', border: '1px solid rgba(109,94,245,0.2)', fontSize: 11.5, color: 'var(--accent-h)' }}>
                <Paperclip size={11} /> {att.filename}{att.pageCount ? ` (${att.pageCount}p)` : ''}
                <button onClick={() => { const na = attachments.filter((_, j) => j !== i); setAttachments(na); if (activeConvoId) saveCurrentMessages(messages, na); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 1, display: 'flex' }}><X size={10} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Connection warning */}
        {apiKeyMissing && (
          <div style={{ padding: '7px 18px', background: 'var(--amber-dim)', borderBottom: '1px solid var(--amber)', flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--amber)' }}>Connection error — check your internet or API key configuration.</p>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{ padding: '24px 28px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 28, marginTop: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <MessageSquare size={24} color="var(--accent-h)" strokeWidth={1.8} />
              </div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>AI Tutor</h2>
              <p style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
                Ask questions, upload study materials, and get clear explanations with examples.
              </p>
            </div>
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 12 }}>Try asking</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 620, margin: '0 auto' }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => send(p)} style={{ padding: '8px 14px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12.5, transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent-h)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-2)'; }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease forwards' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                {m.role === 'user'
                  ? <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>U</span>
                  : <MessageSquare size={13} color="var(--text-2)" strokeWidth={2} />
                }
              </div>
              <div style={{ maxWidth: '82%', padding: '11px 15px', borderRadius: m.role === 'user' ? '12px 3px 12px 12px' : '3px 12px 12px 12px', background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)', border: m.role === 'user' ? 'none' : '1px solid var(--border)' }}>
                <MessageContent content={m.content} isUser={m.role === 'user'} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--text-3)' }}>
                    {m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {m.role === 'assistant' && (
                    <button onClick={() => isSpeaking ? stopSpeaking() : speakText(m.content)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '1px 5px', color: isSpeaking ? 'var(--accent)' : 'var(--text-2)', display: 'flex', alignItems: 'center' }}
                      title={isSpeaking ? 'Stop reading' : 'Read aloud'}>
                      {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <MessageSquare size={13} color="var(--text-2)" strokeWidth={2} />
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '3px 12px 12px 12px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Pending file */}
        {pendingFile && (
          <div style={{ padding: '5px 18px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: 'var(--emerald)' }}>
              <Check size={12} /> {pendingFile.filename} ready — ask anything about it
              <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', color: 'var(--emerald)', cursor: 'pointer', padding: 2, display: 'flex' }}><X size={11} /></button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv,.json,.xml,.html" onChange={handleFileUpload} style={{ display: 'none' }} />
            <button className="btn btn-ghost" style={{ height: 40, padding: '0 9px', flexShrink: 0, color: uploadingFile ? 'var(--amber)' : 'var(--text-2)' }}
              onClick={() => fileRef.current?.click()} disabled={uploadingFile} title="Attach file">
              {uploadingFile ? <Loader2 size={15} className="spin" /> : <Paperclip size={15} strokeWidth={2} />}
            </button>

            <textarea ref={inputRef} className="input" rows={2}
              style={{ resize: 'none', minHeight: 40, maxHeight: 120, lineHeight: 1.5, flex: 1, padding: '10px 12px' }}
              placeholder={isListening ? 'Listening...' : 'Ask anything... (Enter to send, Shift+Enter for new line)'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />

            <button className="btn btn-ghost" style={{ height: 40, padding: '0 9px', flexShrink: 0, color: isListening ? 'var(--rose)' : 'var(--text-2)', background: isListening ? 'var(--rose-dim)' : 'transparent' }}
              onClick={toggleListen} title={isListening ? 'Stop listening' : 'Dictate'}>
              {isListening ? <MicOff size={15} strokeWidth={2} /> : <Mic size={15} strokeWidth={2} />}
            </button>

            <button className="btn btn-primary" style={{ height: 40, minWidth: 64, justifyContent: 'center', flexShrink: 0 }}
              onClick={() => send()} disabled={loading || !input.trim()}>
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
          <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 6 }}>
            StepFun 3.5 Flash · {attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Attach PDFs & docs'} · {memories.length > 0 ? `${memories.length} memories` : 'Building memory'}
          </p>
        </div>
      </div>
    </div>
  );
}

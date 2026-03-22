// Conversation persistence using localStorage

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string for serialization
}

export interface ChatAttachment {
  filename: string;
  text: string; // extracted text
  pageCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'studyai-conversations';
const MAX_CONVERSATIONS = 50;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadAll(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(convos: Conversation[]): void {
  if (typeof window === 'undefined') return;
  // Keep only the latest MAX_CONVERSATIONS
  const trimmed = convos.slice(0, MAX_CONVERSATIONS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // localStorage full — remove oldest conversations and retry
    const reduced = trimmed.slice(0, Math.floor(trimmed.length / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
  }
}

export function createConversation(title?: string): Conversation {
  const now = new Date().toISOString();
  const convo: Conversation = {
    id: generateId(),
    title: title || 'New Conversation',
    messages: [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAll();
  all.unshift(convo); // newest first
  saveAll(all);
  return convo;
}

export function getConversation(id: string): Conversation | null {
  return loadAll().find(c => c.id === id) || null;
}

export function getAllConversations(): Conversation[] {
  return loadAll();
}

export function updateConversation(id: string, updates: Partial<Pick<Conversation, 'messages' | 'attachments' | 'title'>>): Conversation | null {
  const all = loadAll();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return null;

  if (updates.messages) all[idx].messages = updates.messages;
  if (updates.attachments) all[idx].attachments = updates.attachments;
  if (updates.title) all[idx].title = updates.title;
  all[idx].updatedAt = new Date().toISOString();

  // Move to top (most recently used)
  const [updated] = all.splice(idx, 1);
  all.unshift(updated);
  saveAll(all);
  return updated;
}

export function deleteConversation(id: string): void {
  const all = loadAll().filter(c => c.id !== id);
  saveAll(all);
}

export function renameConversation(id: string, title: string): Conversation | null {
  return updateConversation(id, { title });
}

export function autoTitle(firstMessage: string): string {
  // Take first 40 chars of the first user message as title
  const clean = firstMessage.replace(/\n/g, ' ').trim();
  if (clean.length <= 40) return clean;
  return clean.slice(0, 40).trim() + '…';
}

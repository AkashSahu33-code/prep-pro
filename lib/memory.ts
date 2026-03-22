// Long-term memory: persistent facts about the student across conversations

export interface MemoryItem {
  id: string;
  fact: string;
  subject?: string;
  createdAt: string;
}

const STORAGE_KEY = 'studyai-memory';
const MAX_MEMORIES = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getMemories(): MemoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMemories(items: MemoryItem[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = items.slice(0, MAX_MEMORIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function addMemories(facts: string[], subject?: string): void {
  const existing = getMemories();
  const existingFacts = new Set(existing.map(m => m.fact.toLowerCase()));
  const now = new Date().toISOString();

  const newItems: MemoryItem[] = facts
    .filter(f => f.trim() && !existingFacts.has(f.trim().toLowerCase()))
    .map(f => ({
      id: generateId(),
      fact: f.trim(),
      subject,
      createdAt: now,
    }));

  if (newItems.length === 0) return;
  saveMemories([...newItems, ...existing]); // newest first
}

export function deleteMemory(id: string): void {
  saveMemories(getMemories().filter(m => m.id !== id));
}

export function clearAllMemories(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getMemoriesForPrompt(): string {
  const memories = getMemories();
  if (memories.length === 0) return '';
  const lines = memories.slice(0, 20).map(m => `- ${m.fact}`);
  return `\nKnown facts about this student:\n${lines.join('\n')}`;
}

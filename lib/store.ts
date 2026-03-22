export interface Concept {
  id: string;
  name: string;       // human-readable concept name
  subject: string;
  topic: string;
  notes?: string;
  lastStudied: Date;
  nextReview: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
  quality: number;
}

export interface StudySession {
  id: string; conceptId: string; date: Date; quality: number; timeSpent: number;
}

// SM-2 Spaced Repetition Algorithm
export function calculateNextReview(concept: Concept, quality: number): Concept {
  let { interval, easeFactor, repetitions } = concept;
  if (quality < 3) { repetitions = 0; interval = 1; }
  else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { ...concept, interval, easeFactor, repetitions, quality, nextReview, lastStudied: new Date() };
}

export function getStorageData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; }
  catch { return defaultValue; }
}

export function setStorageData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'History', 'Geography', 'English', 'Computer Science', 'Economics'];

export const TOPICS: Record<string, string[]> = {
  Physics: ['Mechanics', 'Thermodynamics', 'Electrostatics', 'Magnetism', 'Optics', 'Modern Physics', 'Waves & Sound'],
  Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Electrochemistry', 'Chemical Kinetics'],
  Mathematics: ['Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Probability & Statistics', 'Vectors', 'Complex Numbers'],
  Biology: ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology', 'Plant Biology', 'Evolution', 'Biotechnology'],
  History: ['Ancient India', 'Medieval India', 'Modern India', 'World History', 'Indian Independence'],
  Geography: ['Physical Geography', 'Human Geography', 'Indian Geography', 'World Geography', 'Climatology'],
  English: ['Grammar', 'Literature', 'Writing Skills', 'Reading Comprehension', 'Vocabulary'],
  'Computer Science': ['Programming Fundamentals', 'Data Structures', 'Algorithms', 'Database Management', 'Networking', 'OOP'],
  Economics: ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'Statistics', 'Development Economics'],
};

# StudyAI — AI-Powered Study Companion

Full-stack Next.js app with 5 AI-powered study modules. Uses **100% free APIs**.

## 🚀 Quick Start

```bash
npm install
# Add your free Gemini API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Setup (2 minutes)

1. Get a **free** Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create `.env.local` in the project root:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Run `npm run dev`

**Free tier**: 1,500 requests/day · 15 req/min · No credit card needed

## 📦 Features

| Module | Description | Free Service |
|--------|-------------|-------------|
| 🔁 Spaced Repetition | SM-2 algorithm, knowledge graph, AI study cards | Gemini Flash |
| 📅 Study Planner | Personalized weekly schedule from exam date | Gemini Flash |
| ⚡ Practice Questions | PYQ-pattern MCQs with hints & explanations | Gemini Flash |
| 🤖 AI Tutor | NCERT-grounded doubt solving in English/Hinglish | Gemini Flash |
| 🎬 Video Processor | YouTube → structured notes, flashcards, concept maps | Gemini Flash + youtube-transcript |

## 🆓 Free Services Used

- **Google Gemini 1.5 Flash** — All AI features (free at Google AI Studio)
- **youtube-transcript** — Transcript extraction from YouTube (no key needed)
- **YouTube oEmbed** — Video metadata (free, no key needed)
- **localStorage** — All study data stored in browser (no backend/DB needed)

## 🛠 Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Google Gemini 1.5 Flash API
- youtube-transcript npm package
- localStorage for persistence

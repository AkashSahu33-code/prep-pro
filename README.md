# 🎓 PrepPro — Intelligent Study Platform

PrepPro is a comprehensive, AI-powered learning platform designed primarily for students preparing for competitive exams (CBSE, JEE, NEET, UPSC). It combines modern learning techniques like spaced repetition with advanced AI to create a personalized, highly effective study environment.
It was a team project, made during Dev-Clash Hackathon 2026, NIT Raipur, where we secured 2nd position competing over 100+ teams 
---

## ✨ Core Features

### 🧠 Memory Engine (Spaced Repetition)
- Implements the **SM-2 Algorithm** to optimize retention.
- AI automatically generates flashcards (definition, key points, formulas, common mistakes) from just a topic name.
- Tracks retention rates, due reviews, and provides a continuous learning loop.
- Visual knowledge graph and subject-by-subject accuracy breakdown.

### 🤖 Context-Aware AI Tutor
- An expert tutor powered by the **OpenRouter API** (defaulting to `stepfun/step-3.5-flash`).
- **Long-term Memory:** Automatically extracts and remembers key facts about the student to personalize future answers.
- **Context Management:** Handles long conversations seamlessly by intelligently summarizing older messages to prevent token limits.
- Supports file uploads (PDFs, text) and can answer questions based on the uploaded document.

### 🎙️ Auto-Dub & Video Digest
- **ElevenLabs Integration:** Automatically dubs educational YouTube videos into 30+ regional and international languages while preserving the original speaker's voice.
- Transcribes YouTube videos into structured lecture notes, summaries, and key takeaways using `youtube-transcript`.

### 📊 Comprehensive Dashboard
- Tracks study sessions, streaks, and total hours studied with an interactive GitHub-style heatmap.
- **AI Performance Insights:** Analyzes your recent performance across subjects and provides actionable recommendations (e.g., "Clear Physics backlog").

### 📋 Study Planner & Practice (Modules)
- AI-generated daily, weekly, and monthly schedules based on the student's goals.
- Automated generation of Multiple Choice Questions (MCQs) for continuous practice.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** Vanilla CSS variables and minimal utility classes (`globals.css`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [OpenRouter API](https://openrouter.ai/) for the Tutor, [ElevenLabs API](https://elevenlabs.io/) for Dubbing.
- **State/Storage:** High-performance client-side `localStorage` abstraction for blazing fast offline-first speed.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed (v18+ recommended).

### 1. Clone & Install
\`\`\`bash
git clone https://github.com/yourusername/studyai-final.git
cd studyai-final
npm install
\`\`\`

### 2. Environment Variables
Create a \`.env.local\` file in the root directory and add your API keys. You can use \`.env.local.example\` as a reference.

\`\`\`env
# .env.local
OPENROUTER_API_KEY=your_openrouter_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
\`\`\`

*(Note: The AI tutor requires an OpenRouter key to function. The Auto-Dub feature requires an ElevenLabs key).*

### 3. Run the Development Server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🎨 UI/UX Design

PrepPro uses a premium, highly responsive design system with both **Light Mode** (default) and **Dark Mode**. It utilizes modern aesthetics like glassmorphism, soft gradients, and micro-animations to keep the reading experience engaging without being distracting.

---

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

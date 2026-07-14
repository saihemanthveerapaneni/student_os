# 🎓 StudentOS - Project Submission Document

## 1. Project Overview
- **Project Name:** StudentOS
- **Tagline:** Your day, sorted. The ultimate neubrutalist academic planner & AI study companion.
- **Objective:** To provide students with a unified, distraction-free dashboard that integrates essential academic tools, optimizing their daily schedules, task management, and study processes by leveraging Artificial Intelligence.

## 2. Core Features & Capabilities
- **📅 Interactive Timetable:** Dynamic tracking of daily classes, start/end times, and room locations with automatic highlighting of the next upcoming class.
- **🛠️ Smart Task Board:** Categorized assignment management (Pending, In Progress, Completed) featuring urgent due-date filters.
- **📝 Notes & AI Summarizer:** Rich text lecture notes capture with instant AI-driven summarization for extracting key takeaways and action items.
- **🤖 AI Study Assistant & Quiz Generator:** Context-aware AI trained to solve academic questions, break down complex concepts, and generate quizzes for active recall and exam preparation.
- **🎯 GPA Forecaster:** Dynamic calculator that allows students to log subjects, assign credits, and calculate target scores to reach their academic goals.
- **📊 Attendance Tracker:** Visual tracking of attended versus total lectures to ensure students maintain required attendance thresholds.
- **🔍 Universal Search:** A global command menu for instant searching across courses, tasks, notes, and schedules.

## 3. Technology Stack
### Frontend UI/UX
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Styling:** Tailwind CSS v4
- **Design Language:** High-contrast Neubrutalist Aesthetic with micro-animations

### Backend & Database
- **Framework:** FastAPI (Python 3.13) & Uvicorn
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **AI Integration:** Multi-provider AI support including Anthropic Claude, OpenAI GPT-4o, and Groq APIs.

## 4. Architecture & Data Flow
StudentOS implements a highly resilient **hybrid data layer**:
- **Live Mode (Cloud):** Secure, authenticated API calls to the FastAPI backend, utilizing Supabase authorization tokens. User data is safely stored and isolated in PostgreSQL via RLS policies.
- **Fallback Mode (Local/Guest):** Intelligent network error catching that gracefully defaults to the browser's `localStorage`. This ensures uninterrupted, offline access to academic data without requiring an active backend connection or internet access.

## 5. Development & Implementation Details
- **Frontend Structure:** Modular component-driven architecture using Next.js App Router for strict separation of concerns (`/dashboard`, `/timetable`, `/assignments`, `/notes`, `/ai-assistant`, `/gpa-calculator`).
- **Backend Services:** Modular FastAPI structure isolating route handlers (`routers/`) and business logic (`services/`) alongside robust Supabase client integrations.
- **Developer Experience (DX):** Single-command concurrent execution (`npm run dev`) that spins up both the Next.js frontend and FastAPI backend simultaneously for rapid testing and review.

## 6. Key Achievements for the Internship
- Successfully architected and deployed a full-stack web application from scratch.
- Integrated modern AI capabilities directly into the student workflow.
- Solved data-persistence challenges by designing a robust offline-first fallback mechanism.
- Implemented a unique, modern UI/UX design system (Neubrutalism) that stands out visually.

---
*Prepared for Internship Project Submission Evaluation Panel.*

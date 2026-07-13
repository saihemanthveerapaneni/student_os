# 🎓 StudentOS

StudentOS is a premium, neubrutalist-styled academic planner, study companion, and task organizer designed to help students optimize their daily schedules, manage grades, and leverage AI-driven study tools. 

Built with a modern web architecture, it offers a stunning, high-contrast, responsive visual layout and a robust **hybrid data sync** mechanism that works seamlessly either locally (via `localStorage` fallback) or connected to a cloud backend (FastAPI + Supabase).

---

## 🚀 Key Features

StudentOS brings together several essential academic tools in a unified dashboard:

### 1. 📅 Interactive Timetable
*   **Day-by-Day Scheduling**: Keep track of daily classes, starting/ending times, and room locations.
*   **Next-Class Indicator**: The dashboard automatically displays your next upcoming class at a glance.

### 2. 📝 Notes & Study AI Summarizer
*   **Rich Text Notes**: Capture lectures, structure ideas, and organize academic content with tags.
*   **AI Summarizer**: Instantly condense long study notes into concise summaries, key takeaways, and action items using advanced AI language models.

### 3. 🎯 GPA Target Calculator
*   **Credit Weighting**: Log subjects, assign course credits, and enter expected grades (10.0 scale).
*   **CGPA Forecasting**: Calculate target scores dynamically to understand exactly what grades are needed to reach your academic goals.

### 4. 📊 Attendance Tracker
*   **Visual Status Indicators**: Track overall attended vs. total lectures per course.
*   **Target Monitoring**: Compare current attendance percentages against minimum requirements (e.g. 75%) to avoid falling short.

### 5. 🛠️ Assignments & Task Board
*   **Status Classification**: Categorize academic deliverables into *Pending*, *In Progress*, and *Completed*.
*   **Smart Filters**: View all items or isolate only urgent assignments due today.

### 6. 🤖 AI Student Assistant
*   **Context-Aware Chat**: Converse with an AI helper trained to solve academic questions, break down complex concepts, and guide student work.

### 7. ✏️ Quiz Generator
*   **Interactive Test Creation**: Generate multiple-choice or short-answer practice tests on-demand using AI based on your custom input or notes.

### 8. 🔍 Universal Search
*   **Global Filter Overlay**: Access a central command menu to immediately search across courses, timetables, tasks, and notes in real-time.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, and Google Fonts (Outfit, Anton, Space Grotesk).
*   **Backend**: FastAPI (Python 3.13) + Uvicorn.
*   **Database & Authentication**: Supabase (PostgreSQL with Row-Level Security).
*   **AI Integration**: Hybrid support for **Anthropic (Claude)**, **OpenAI (GPT-4o)**, and **Groq** APIs.

---

## 📂 Architecture & Data Flow

StudentOS implements a highly resilient data layer in `src/utils/api.ts`:
*   **Live Mode**: Performs fetch calls to the FastAPI backend, utilizing Supabase authorization tokens and updating the cloud PostgreSQL database.
*   **Fallback Mode**: If the local FastAPI server is offline, the client automatically catches errors and defaults to `localStorage` operations. This ensures that you can run and use the application locally with full functionality without any backend database configuration.

---

## ⚙️ Project Setup & Installation

### 1. Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Supabase Account (optional, for cloud sync)

### 2. Frontend Configuration
From the project root:
1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the Supabase variables in `.env.local` (or leave them default to run in fallback/local mode).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Configuration
Navigate to the backend folder:
1. Move to the backend folder:
   ```bash
   cd studentos-backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and configure keys (Supabase keys and AI provider keys like `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.):
   ```bash
   cp .env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   python app/main.py
   ```
   The API backend will boot up at [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## 🛡️ Database & Security (Supabase)

To set up the cloud database tables and secure access:
1. Run the database definitions in `supabase/schema.sql`.
2. Apply the RLS policies in `supabase/rls_policies.sql` to restrict users to only view and edit their own academic data.
3. Use `supabase/migration.sql` to populate any initial structure or configurations.

# StudentOS

StudentOS is a premium, unified operating system and dashboard designed for college students to coordinate their academic schedules (notes, timetables, assignments, attendance metrics) alongside a context-aware AI tutor powered by Groq.

---

## Folder Structure

```
student-os/
├── frontend/                 # Next.js 15 (App Router) Frontend App
│   ├── app/                  # Route layouts, pages (Dashboard, Notes, etc.)
│   ├── components/           # Reusable UI elements (Sidebar, Navbar)
│   ├── lib/                  # Configurations (Supabase Client helper)
│   ├── store/                # Zustand global UI & Auth stores
│   └── vercel.json           # Vercel deployment blueprint
│
├── backend/                  # FastAPI Backend API Server
│   ├── routers/              # AI Streams, Analytics, and PDF File extractors
│   ├── services/             # AIService (wrapper for Groq API models)
│   ├── config.py             # Configuration loader
│   ├── requirements.txt      # Python dependencies list
│   └── main.py               # FastAPI application entrypoint
│
├── supabase/                 # Database Migrations & Initial seeds
│   ├── migrations/           # PostgreSQL schemas, cascading deletes, RLS
│   └── seed.sql              # Automated user onboarding seed documentation
│
└── render.yaml               # Render web services deployment blueprint
```

---

## Architecture Diagram

```
                       ┌─────────────────────────┐
                       │  College Student User   │
                       └────────────┬────────────┘
                                    │
                        Interacts / HTTPS / SSE
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │    Next.js Frontend     │
                       └────────────┬────────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
     Direct Auth / CRUD / Realtime             AI / OCR / Analytics
                   │                                 │
                   ▼                                 ▼
       ┌──────────────────────┐           ┌──────────────────────┐
       │  Supabase Platform   │◄──────────┤   FastAPI Backend    │
       │ (PostgreSQL, Storage)│           └──────────┬───────────┘
       └──────────────────────┘                      │
                                               Groq LLM SDK
                                                     │
                                                     ▼
                                          ┌──────────────────────┐
                                          │       Groq API       │
                                          └──────────────────────┘
```

---

## Database Setup & Row-Level Security

All tables reside in the `public` schema of Supabase PostgreSQL. Standard migrations are stored under `supabase/migrations/20260710_init_schema.sql`.

### Relational Schema
- **users**: Extends Supabase auth database profile information (avatar, name).
- **courses**: Unique university class catalogs (color styles, professors, rooms).
- **timetable**: Day indices (0-6) and start/end time grids. Prevents overlaps.
- **notes** & **note_versions**: Rich markdown lecture records with automatic text extraction imports and version auditing history.
- **assignments**: Deliverables sorted by High/Medium/Low priority and Pending/Submitted/Overdue statuses.
- **attendance**: Logged dates of presence/absence metrics.
- **ai_chats**: Chat history thread messages stored as JSONB arrays.
- **notifications**: Realtime system and deadline alert triggers.

### Row Level Security (RLS)
Every table is locked down using Postgres Row-Level Security. Policies enforce that `auth.uid() = user_id` for all select, insert, update, and delete actions. Users can only access their own data.

---

## Environment Variables

### Frontend (`frontend/.env.local`)
Create a file named `.env.local` inside the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (`backend/.env` or system env)
Create a file named `.env` inside the `backend/` directory:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Service Role Key or Anon Key)
GROQ_API_KEY=gsk_your_groq_api_key_string...
```

---

## Installation & Setup Guide

### 1. Database Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/migrations/20260710_init_schema.sql` and run it. This will create all tables, indexes, RLS policies, and the onboarding seed trigger automatically.

### 2. Run Backend (FastAPI)
Navigate to the `backend` folder, set up your python environment, install dependencies, and start uvicorn:
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
The backend API server will start on `http://localhost:8000`.

### 3. Run Frontend (Next.js)
Navigate to the `frontend` folder, install packages, and boot the Next.js dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## API Documentation

The FastAPI backend exposes the following endpoints (interactive OpenAPI docs are available at `http://localhost:8000/docs`):

### 1. AI Chat router (`/api/ai`)
- **`POST /api/ai/chat`**: Streams completion response chunks using the specified model (`llama3.3`, `llama3.1`, `qwen`, `deepseek`) and the system context preset (`study_chat`, `explain_concepts`, `summarize_notes`, `generate_quiz`, `generate_flashcards`, `study_plan`, `assignment_help`, `code_help`).

### 2. Analytics router (`/api/analytics`)
- **`GET /api/analytics/summary?user_id={UUID}`**: Collects attendance and pending task tallies to return:
  - Subject attendance rates.
  - Low attendance criteria threshold alert flags.
  - Actionable study recommendations.

### 3. File router (`/api/files`)
- **`POST /api/files/extract-text`**: Accepts a PDF file upload, reads and parses its pages, and returns extracted plain text content.

---

## Deployment Guide

### Frontend Deployment (Vercel)
1. Commit the workspace to a GitHub repository.
2. Link the repository to [Vercel](https://vercel.com).
3. Set the Root Directory to `frontend`.
4. Configure the environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Click **Deploy**.

### Backend Deployment (Render)
1. Render automatically picks up the blueprint from the `render.yaml` file in your workspace root.
2. Link the GitHub repository to [Render](https://render.com).
3. Create a new **Web Service** from the blueprint.
4. Fill in the required environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, and `GROQ_API_KEY`.
5. Render will build and deploy the container.

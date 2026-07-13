-- ============================================================
-- StudentOS — Supabase Postgres Schema
-- Run this FIRST in the Supabase SQL Editor.
-- Then run rls_policies.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text unique not null,
  gender text check (gender in ('male', 'female', 'other')),
  avatar_url text,
  theme text not null default 'light' check (theme in ('light','dark')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- COURSES (subjects — underpins timetable / notes / assignments / attendance)
-- ------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  instructor text,
  accent_color text not null default 'cornflower',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TIMETABLE (Screen 2)
-- ------------------------------------------------------------
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  day_of_week text not null check (
    day_of_week in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
  ),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- ------------------------------------------------------------
-- NOTES (Screen 3)
-- ------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  content text,
  tags text[] default '{}',
  accent_color text not null default 'cream',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- ASSIGNMENTS (Screen 4)
-- ------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type assignment_status as enum ('pending', 'in_progress', 'done');
  end if;
end $$;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  status assignment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ATTENDANCE (Screen 5)
-- ------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present', 'absent');
  end if;
end $$;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  date date not null,
  status attendance_status not null,
  created_at timestamptz not null default now(),
  unique (course_id, date)
);

-- ------------------------------------------------------------
-- GPA SUBJECTS (Screen 7)
-- ------------------------------------------------------------
create table if not exists public.gpa_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  credit_hours numeric not null check (credit_hours > 0),
  grade text,
  grade_point numeric,
  semester text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- AI CHAT HISTORY (Screen 6)
-- ------------------------------------------------------------
create table if not exists public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null default gen_random_uuid(),
  role text not null check (role in ('user','assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- QUIZZES (Screen 8)
-- ------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_note_id uuid references public.notes(id) on delete set null,
  title text,
  questions jsonb not null, -- [{ "question": "...", "options": ["...","...","...","..."], "correct_index": 0 }]
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score numeric not null,
  total numeric not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- NOTE SUMMARIES (Screen 9)
-- ------------------------------------------------------------
create table if not exists public.note_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  original_text text,
  summary_text text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Helpful indexes
-- ------------------------------------------------------------
create index idx_courses_user on public.courses(user_id);
create index idx_timetable_user on public.timetable(user_id);
create index idx_timetable_day on public.timetable(day_of_week);
create index idx_notes_user on public.notes(user_id);
create index idx_notes_course on public.notes(course_id);
create index idx_assignments_user on public.assignments(user_id);
create index idx_assignments_status on public.assignments(status);
create index idx_attendance_user on public.attendance(user_id);
create index idx_attendance_course on public.attendance(course_id);
create index idx_gpa_subjects_user on public.gpa_subjects(user_id);
create index idx_ai_chats_user_session on public.ai_chats(user_id, session_id);
create index idx_quizzes_user on public.quizzes(user_id);
create index idx_note_summaries_user on public.note_summaries(user_id);

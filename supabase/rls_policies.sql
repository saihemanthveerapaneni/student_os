-- ============================================================
-- StudentOS — Row Level Security Policies
-- Run this AFTER schema.sql
-- Ensures every user can only read/write their own rows.
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- COURSES
alter table public.courses enable row level security;

drop policy if exists "courses_select_own" on public.courses;
create policy "courses_select_own" on public.courses
  for select using (auth.uid() = user_id);
drop policy if exists "courses_insert_own" on public.courses;
create policy "courses_insert_own" on public.courses
  for insert with check (auth.uid() = user_id);
drop policy if exists "courses_update_own" on public.courses;
create policy "courses_update_own" on public.courses
  for update using (auth.uid() = user_id);
drop policy if exists "courses_delete_own" on public.courses;
create policy "courses_delete_own" on public.courses
  for delete using (auth.uid() = user_id);

-- TIMETABLE
alter table public.timetable enable row level security;

drop policy if exists "timetable_select_own" on public.timetable;
create policy "timetable_select_own" on public.timetable
  for select using (auth.uid() = user_id);
drop policy if exists "timetable_insert_own" on public.timetable;
create policy "timetable_insert_own" on public.timetable
  for insert with check (auth.uid() = user_id);
drop policy if exists "timetable_update_own" on public.timetable;
create policy "timetable_update_own" on public.timetable
  for update using (auth.uid() = user_id);
drop policy if exists "timetable_delete_own" on public.timetable;
create policy "timetable_delete_own" on public.timetable
  for delete using (auth.uid() = user_id);

-- NOTES
alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id);
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

-- ASSIGNMENTS
alter table public.assignments enable row level security;

drop policy if exists "assignments_select_own" on public.assignments;
create policy "assignments_select_own" on public.assignments
  for select using (auth.uid() = user_id);
drop policy if exists "assignments_insert_own" on public.assignments;
create policy "assignments_insert_own" on public.assignments
  for insert with check (auth.uid() = user_id);
drop policy if exists "assignments_update_own" on public.assignments;
create policy "assignments_update_own" on public.assignments
  for update using (auth.uid() = user_id);
drop policy if exists "assignments_delete_own" on public.assignments;
create policy "assignments_delete_own" on public.assignments
  for delete using (auth.uid() = user_id);

-- ATTENDANCE
alter table public.attendance enable row level security;

drop policy if exists "attendance_select_own" on public.attendance;
create policy "attendance_select_own" on public.attendance
  for select using (auth.uid() = user_id);
drop policy if exists "attendance_insert_own" on public.attendance;
create policy "attendance_insert_own" on public.attendance
  for insert with check (auth.uid() = user_id);
drop policy if exists "attendance_update_own" on public.attendance;
create policy "attendance_update_own" on public.attendance
  for update using (auth.uid() = user_id);
drop policy if exists "attendance_delete_own" on public.attendance;
create policy "attendance_delete_own" on public.attendance
  for delete using (auth.uid() = user_id);

-- GPA SUBJECTS
alter table public.gpa_subjects enable row level security;

drop policy if exists "gpa_subjects_select_own" on public.gpa_subjects;
create policy "gpa_subjects_select_own" on public.gpa_subjects
  for select using (auth.uid() = user_id);
drop policy if exists "gpa_subjects_insert_own" on public.gpa_subjects;
create policy "gpa_subjects_insert_own" on public.gpa_subjects
  for insert with check (auth.uid() = user_id);
drop policy if exists "gpa_subjects_update_own" on public.gpa_subjects;
create policy "gpa_subjects_update_own" on public.gpa_subjects
  for update using (auth.uid() = user_id);
drop policy if exists "gpa_subjects_delete_own" on public.gpa_subjects;
create policy "gpa_subjects_delete_own" on public.gpa_subjects
  for delete using (auth.uid() = user_id);

-- AI CHATS
alter table public.ai_chats enable row level security;

drop policy if exists "ai_chats_select_own" on public.ai_chats;
create policy "ai_chats_select_own" on public.ai_chats
  for select using (auth.uid() = user_id);
drop policy if exists "ai_chats_insert_own" on public.ai_chats;
create policy "ai_chats_insert_own" on public.ai_chats
  for insert with check (auth.uid() = user_id);
drop policy if exists "ai_chats_delete_own" on public.ai_chats;
create policy "ai_chats_delete_own" on public.ai_chats
  for delete using (auth.uid() = user_id);

-- QUIZZES
alter table public.quizzes enable row level security;

drop policy if exists "quizzes_select_own" on public.quizzes;
create policy "quizzes_select_own" on public.quizzes
  for select using (auth.uid() = user_id);
drop policy if exists "quizzes_insert_own" on public.quizzes;
create policy "quizzes_insert_own" on public.quizzes
  for insert with check (auth.uid() = user_id);
drop policy if exists "quizzes_delete_own" on public.quizzes;
create policy "quizzes_delete_own" on public.quizzes
  for delete using (auth.uid() = user_id);

-- QUIZ ATTEMPTS
alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (auth.uid() = user_id);
drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;
create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- NOTE SUMMARIES
alter table public.note_summaries enable row level security;

drop policy if exists "note_summaries_select_own" on public.note_summaries;
create policy "note_summaries_select_own" on public.note_summaries
  for select using (auth.uid() = user_id);
drop policy if exists "note_summaries_insert_own" on public.note_summaries;
create policy "note_summaries_insert_own" on public.note_summaries
  for insert with check (auth.uid() = user_id);
drop policy if exists "note_summaries_delete_own" on public.note_summaries;
create policy "note_summaries_delete_own" on public.note_summaries
  for delete using (auth.uid() = user_id);

-- NOTE: FastAPI connects using the SERVICE ROLE key, which bypasses RLS
-- by design (it acts as an admin). RLS here protects you in case the
-- frontend ever queries Supabase directly with the anon/user key.

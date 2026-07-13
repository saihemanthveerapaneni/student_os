-- ============================================================
-- StudentOS — Database Migration v2 (Profiles & Settings)
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Extend profiles table with Basic & Academic Info
alter table public.profiles
  add column gender text check (gender in ('male', 'female', 'other')),
  add column student_id text,
  add column phone text,
  add column date_of_birth date,
  add column bio text,
  add column college_name text,
  add column department text,
  add column branch text,
  add column semester text,
  add column batch text,
  add column advisor text,
  add column linkedin_url text,
  add column github_url text,
  add column portfolio_url text,
  add column skills jsonb default '[]',
  add column interests jsonb default '[]',
  add column certifications jsonb default '[]';

-- Create separate table for user Settings
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'light' check (theme in ('light','dark','system')),
  accent_color text default 'yellow',
  font_size text default 'medium',
  notifications jsonb default '{}',       -- e.g. {"assignments": true, "exams": true, ...}
  timetable_prefs jsonb default '{}',     -- e.g. {"week_start":"Monday","class_duration":60}
  ai_prefs jsonb default '{}',            -- e.g. {"model":"anthropic","response_length":"medium"}
  calendar_prefs jsonb default '{}',
  privacy jsonb default '{}',
  language text default 'en',
  timezone text default 'UTC',
  date_format text default 'DD/MM/YYYY',
  time_format text default '24h',
  updated_at timestamptz default now()
);

-- Enable RLS for settings table
alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings_upsert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id);

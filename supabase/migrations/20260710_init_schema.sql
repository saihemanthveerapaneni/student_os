-- Initial database schema setup for StudentOS

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create Users table (linked to auth.users)
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Courses table
create table public.courses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    code text not null,
    name text not null,
    color text not null,
    instructor text,
    classroom text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Timetable table
create table public.timetable (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    course_id uuid references public.courses(id) on delete cascade not null,
    day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
    start_time time not null,
    end_time time not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint check_time_order check (start_time < end_time)
);

-- 5. Create Notes table
create table public.notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    course_id uuid references public.courses(id) on delete set null,
    title text not null,
    content text default '' not null,
    tags text[] default '{}'::text[] not null,
    folder text default 'General' not null,
    is_pinned boolean default false not null,
    pdf_url text,
    image_url text,
    version integer default 1 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Note Versions table (for note history)
create table public.note_versions (
    id uuid default gen_random_uuid() primary key,
    note_id uuid references public.notes(id) on delete cascade not null,
    version integer not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create Assignments table
create table public.assignments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    course_id uuid references public.courses(id) on delete set null,
    title text not null,
    description text,
    priority text not null check (priority in ('low', 'medium', 'high')),
    status text not null check (status in ('pending', 'submitted', 'overdue')),
    due_date timestamp with time zone not null,
    reminder_at timestamp with time zone,
    file_attachments text[] default '{}'::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create Attendance table
create table public.attendance (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    course_id uuid references public.courses(id) on delete cascade not null,
    date date not null,
    status text not null check (status in ('present', 'absent')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create AI Chats table
create table public.ai_chats (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    model_name text not null,
    messages jsonb default '[]'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Create Notifications table
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    content text not null,
    is_read boolean default false not null,
    type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Create Indexes for performance
create index idx_courses_user_id on public.courses(user_id);
create index idx_timetable_user_id on public.timetable(user_id);
create index idx_notes_user_id on public.notes(user_id);
create index idx_assignments_user_id on public.assignments(user_id);
create index idx_attendance_user_id on public.attendance(user_id);
create index idx_ai_chats_user_id on public.ai_chats(user_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notes_course_id on public.notes(course_id);
create index idx_timetable_course_id on public.timetable(course_id);
create index idx_assignments_course_id on public.assignments(course_id);
create index idx_attendance_course_id on public.attendance(course_id);

-- 12. Seed Generator Function
create or replace function public.seed_user_data(target_user_id uuid)
returns void as $$
declare
  course_algo_id uuid;
  course_db_id uuid;
  course_math_id uuid;
  course_lit_id uuid;
  note_ds_id uuid;
begin
  -- Insert Courses
  insert into public.courses (user_id, code, name, color, instructor, classroom)
  values (target_user_id, 'CS401', 'Advanced Algorithms', '#4648d4', 'Dr. Helen Carter', 'Room 302, Science Block')
  returning id into course_algo_id;

  insert into public.courses (user_id, code, name, color, instructor, classroom)
  values (target_user_id, 'CS305', 'Database Systems', '#006b5f', 'Prof. Marcus Vance', 'Online Lab')
  returning id into course_db_id;

  insert into public.courses (user_id, code, name, color, instructor, classroom)
  values (target_user_id, 'MATH202', 'Linear Algebra', '#994100', 'Dr. Sarah Jenkins', 'Hall B')
  returning id into course_math_id;

  insert into public.courses (user_id, code, name, color, instructor, classroom)
  values (target_user_id, 'ENG105', 'Modern Literature', '#ba1a1a', 'Prof. Alice Wood', 'Online (Zoom)')
  returning id into course_lit_id;

  -- Insert Timetable Slots
  -- Mon 09:00 - 10:30
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_algo_id, 1, '09:00:00', '10:30:00');
  -- Wed 09:00 - 10:30
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_algo_id, 3, '09:00:00', '10:30:00');

  -- Mon 11:00 - 12:30
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_db_id, 1, '11:00:00', '12:30:00');
  -- Wed 11:00 - 12:30
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_db_id, 3, '11:00:00', '12:30:00');

  -- Tue 13:00 - 15:00
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_math_id, 2, '13:00:00', '15:00:00');
  -- Thu 13:00 - 15:00
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_math_id, 4, '13:00:00', '15:00:00');

  -- Fri 09:00 - 11:00
  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time)
  values (target_user_id, course_lit_id, 5, '09:00:00', '11:00:00');

  -- Insert Notes
  insert into public.notes (user_id, course_id, title, content, tags, folder, is_pinned, version)
  values (target_user_id, course_algo_id, 'Data Structures Overview', 
    'A comprehensive review of linear and non-linear data structures. Covers arrays, linked lists, stacks, queues, trees (binary, AVL, Red-Black), and graphs. Key focus on time complexity for search, insert, and delete operations.', 
    array['exam-prep', 'algorithms'], 'Computer Science', true, 1)
  returning id into note_ds_id;

  insert into public.notes (user_id, course_id, title, content, tags, folder, is_pinned, version)
  values (target_user_id, course_algo_id, 'Big O Notation Cheatsheet', 
    'O(1) Constant Time: Array index access. O(log n) Logarithmic: Binary search. O(n) Linear: Simple loop. O(n log n) Linearithmic: Merge sort. O(n^2) Quadratic: Nested loops. Remember dropping constants and non-dominant terms.', 
    array['algorithms'], 'Computer Science', false, 1);

  insert into public.notes (user_id, course_id, title, content, tags, folder, is_pinned, version)
  values (target_user_id, course_algo_id, 'React State Management', 
    'Comparing useState, useReducer, and Context API vs external libraries like Redux and Zustand. Context is great for low-frequency updates like theme/auth. Redux provides predictable state container but with boilerplate overhead.', 
    array['project'], 'Computer Science', false, 1);

  insert into public.notes (user_id, course_id, title, content, tags, folder, is_pinned, version)
  values (target_user_id, course_algo_id, 'REST API Design Principles', 
    'Stateless operations, client-server architecture, cacheability. Use nouns for resources (e.g., /users instead of /getUsers). Proper use of HTTP methods: GET, POST, PUT, PATCH, DELETE. Status codes mapping.', 
    array['web-dev'], 'Computer Science', false, 1);

  -- Insert note version history
  insert into public.note_versions(note_id, version, content)
  values (note_ds_id, 1, 'A comprehensive review of linear and non-linear data structures. Covers arrays, linked lists, stacks, queues, trees (binary, AVL, Red-Black), and graphs. Key focus on time complexity for search, insert, and delete operations.');

  -- Insert Assignments
  insert into public.assignments (user_id, course_id, title, description, priority, status, due_date)
  values (target_user_id, course_algo_id, 'Algorithms Midterm Project', 'Submit documentation and initial code structure for binary tree visualizer.', 'high', 'pending', now() + interval '10 hours');

  insert into public.assignments (user_id, course_id, title, description, priority, status, due_date)
  values (target_user_id, course_lit_id, 'Essay Draft 1: Modernism', '1500 words on AI implications in modern society and literature.', 'medium', 'pending', now() + interval '1 day 5 hours');

  insert into public.assignments (user_id, course_id, title, description, priority, status, due_date)
  values (target_user_id, course_math_id, 'Weekly Problem Set #4', 'Solve problems 1-15 in chapter 4 of Linear Algebra textbook.', 'low', 'pending', now() + interval '3 days 10 hours');

  -- Insert Attendance (history)
  insert into public.attendance (user_id, course_id, date, status) values
  (target_user_id, course_algo_id, current_date - 1, 'present'),
  (target_user_id, course_algo_id, current_date - 3, 'present'),
  (target_user_id, course_algo_id, current_date - 8, 'present'),
  (target_user_id, course_algo_id, current_date - 10, 'absent'),
  (target_user_id, course_db_id, current_date - 1, 'present'),
  (target_user_id, course_db_id, current_date - 3, 'present'),
  (target_user_id, course_db_id, current_date - 8, 'present'),
  (target_user_id, course_db_id, current_date - 10, 'present'),
  (target_user_id, course_math_id, current_date - 2, 'present'),
  (target_user_id, course_math_id, current_date - 4, 'absent'),
  (target_user_id, course_math_id, current_date - 9, 'present'),
  (target_user_id, course_math_id, current_date - 11, 'present'),
  (target_user_id, course_lit_id, current_date - 5, 'present'),
  (target_user_id, course_lit_id, current_date - 12, 'present');

  -- Insert Notifications
  insert into public.notifications (user_id, title, content, type)
  values (target_user_id, 'Welcome to StudentOS', 'Explore your new academic dashboard. Check your timetable and notes to get started!', 'info');

  insert into public.notifications (user_id, title, content, type)
  values (target_user_id, 'Upcoming Deadline', 'Your Algorithms Midterm Project is due today at 11:59 PM.', 'warning');
end;
$$ language plpgsql security definer;

-- 13. Setup Profile & Seed Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Automatically seed initial data for user
  perform public.seed_user_data(new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 14. Enable Row-Level Security (RLS)
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.timetable enable row level security;
alter table public.notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.assignments enable row level security;
alter table public.attendance enable row level security;
alter table public.ai_chats enable row level security;
alter table public.notifications enable row level security;

-- 15. Define RLS Policies

-- Users policies
create policy "Users can read own profile" on public.users
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
    for update using (auth.uid() = id);

-- Courses policies
create policy "Users can perform all operations on own courses" on public.courses
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Timetable policies
create policy "Users can perform all operations on own timetable" on public.timetable
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notes policies
create policy "Users can perform all operations on own notes" on public.notes
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note versions policies
create policy "Users can read own note versions" on public.note_versions
    for select using (
        exists (
            select 1 from public.notes
            where notes.id = note_versions.note_id and notes.user_id = auth.uid()
        )
    );

create policy "Users can insert own note versions" on public.note_versions
    for insert with check (
        exists (
            select 1 from public.notes
            where notes.id = note_versions.note_id and notes.user_id = auth.uid()
        )
    );

-- Assignments policies
create policy "Users can perform all operations on own assignments" on public.assignments
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Attendance policies
create policy "Users can perform all operations on own attendance" on public.attendance
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI Chats policies
create policy "Users can perform all operations on own ai_chats" on public.ai_chats
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications policies
create policy "Users can perform all operations on own notifications" on public.notifications
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '../../utils/api';

// Mappings for GPA points (10 point scale)
const gradePoints: Record<string, number> = {
  'A+': 10.0,
  'A': 9.0,
  'B+': 8.0,
  'B': 7.0,
  'C+': 6.0,
  'C': 5.0,
  'D': 4.0,
  'F': 0.0,
};

interface TimetableItem {
  id: string;
  name: string;
  time: string;
  day: string;
  room: string;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface AssignmentItem {
  id: string;
  title: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'done';
}

interface AttendanceItem {
  id: string;
  course: string;
  attended: number;
  total: number;
}

interface GPASubjectItem {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

export default function Dashboard() {
  const { theme } = useTheme();
  
  // Dashboard states loaded dynamically from API
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [gpaSubjects, setGpaSubjects] = useState<GPASubjectItem[]>([]);
  const [profileName, setProfileName] = useState('');
  
  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'done'>('pending');

  const loadData = async () => {
    try {
      const tData = await api.getTimetable();
      const mapped = tData.map((item: any) => ({
        id: item.id,
        name: item.subject,
        time: `${item.startTime} - ${item.endTime}`,
        day: item.day,
        room: item.location
      }));
      setTimetable(mapped);
    } catch (e) {}

    try {
      const nData = await api.getNotes();
      const mappedNotes = nData.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        tags: [item.tag]
      }));
      setNotes(mappedNotes);
    } catch (e) {}

    try {
      const aData = await api.getAssignments();
      const mappedAssignments = aData.map((item: any) => {
        let statusVal: 'pending' | 'in_progress' | 'done' = 'pending';
        if (item.status === 'In Progress') statusVal = 'in_progress';
        else if (item.status === 'Done') statusVal = 'done';
        
        return {
          id: item.id,
          title: item.title,
          due_date: item.dueDate,
          status: statusVal
        };
      });
      setAssignments(mappedAssignments);
    } catch (e) {}

    try {
      const attData = await api.getAttendance();
      setAttendance(attData);
    } catch (e) {}

    try {
      const gData = await api.getGpaSubjects();
      setGpaSubjects(gData);
    } catch (e) {}

    try {
      const profile = await api.getProfile();
      if (profile && profile.name) {
        setProfileName(profile.name.split(' ')[0]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadData();

    // Listen for storage events (e.g. updates made on other pages)
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask = {
      title: taskTitle,
      due_date: taskDueDate,
      status: taskStatus,
    };

    try {
      await api.addAssignmentItem(newTask);
      await loadData();
    } catch (e) {
      console.error(e);
    }
    
    // Reset modal
    setTaskTitle('');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskStatus('pending');
    setIsTaskModalOpen(false);
  };

  // Derived dashboard metrics
  const activeAssignmentsCount = assignments.filter((a) => a.status !== 'done').length;
  const totalNotesCount = notes.length;
  
  // Next class solver
  const nextClass = timetable.length > 0 ? timetable[0] : null;

  // Attendance stats calculator
  let totalAttended = 0;
  let totalClasses = 0;
  attendance.forEach((item) => {
    totalAttended += item.attended;
    totalClasses += item.total;
  });
  const overallAttendance = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

  // GPA calculator
  let gpaTotalCredits = 0;
  let gpaTotalPoints = 0;
  gpaSubjects.forEach((sub) => {
    const pts = gradePoints[sub.grade];
    if (pts !== undefined) {
      gpaTotalCredits += sub.credits;
      gpaTotalPoints += sub.credits * pts;
    }
  });
  const cgpa = gpaTotalCredits === 0 ? 0.0 : Math.round((gpaTotalPoints / gpaTotalCredits) * 10) / 10;

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar />

      {theme === 'light' ? (
        /* ================= LIGHT MODE DASHBOARD ================= */
        <main className="flex-grow max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 flex flex-col gap-12 w-full">
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-[3px] border-on-surface pb-8 relative">
            <div className="flex flex-col gap-2">
              <h1 
                className="font-anton text-5xl md:text-7xl text-secondary-container uppercase"
                style={{
                  textShadow: '4px 4px 0px #1a1b22, -2px -2px 0 #1a1b22, 2px -2px 0 #1a1b22, -2px 2px 0 #1a1b22, 2px 2px 0 #1a1b22'
                }}
              >
                YOUR DAY, SORTED
              </h1>
              <Link href="/assignments?filter=Due+Today">
                <p className="font-archivo-narrow text-lg md:text-xl text-on-surface font-bold bg-background inline-block w-max px-2 py-1 neubrutal-border neubrutal-shadow rotate-1 cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2">
                  You have {activeAssignmentsCount} assignments due today.
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </p>
              </Link>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-tertiary-container text-white font-space-grotesk font-bold text-sm md:text-base px-6 py-3 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover transition-all uppercase whitespace-nowrap block cursor-pointer text-on-surface"
            >
              + New Task
            </button>
          </section>

          {/* Bento Grid Layout */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Timetable Card (Blue) */}
            <Link href="/timetable" className="block group">
              <div className="bg-primary-container text-white p-6 neubrutal-border neubrutal-shadow rounded-lg -rotate-1 group-hover:rotate-0 transition-all duration-300 h-full flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-space-grotesk font-bold uppercase text-base">Timetable</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    calendar_today
                  </span>
                </div>
                <div className="bg-background text-on-surface p-4 neubrutal-border rounded">
                  {nextClass ? (
                    <>
                      <p className="font-archivo-narrow text-lg font-bold">Next class: {nextClass.name}</p>
                      <p className="font-archivo-narrow text-base text-on-surface-variant">at {nextClass.time}, {nextClass.room}</p>
                    </>
                  ) : (
                    <p className="font-archivo-narrow text-lg font-bold">No classes scheduled.</p>
                  )}
                </div>
              </div>
            </Link>

            {/* Notes Card (Lavender/Light Blue) */}
            <Link href="/notes" className="block md:col-span-2 group">
              <div className="bg-primary-fixed text-on-surface p-6 neubrutal-border neubrutal-shadow rounded-lg rotate-2 group-hover:rotate-0 transition-all duration-300 h-full flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-space-grotesk font-bold uppercase text-base">Notes</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    description
                  </span>
                </div>
                <div className="flex items-center gap-4 text-on-surface">
                  <span className="font-anton text-4xl md:text-5xl bg-background px-4 py-2 neubrutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {totalNotesCount}
                  </span>
                  <p className="font-archivo-narrow text-lg md:text-xl font-bold">notes captured this semester.</p>
                </div>
              </div>
            </Link>

            {/* Assignments Card (Cream) */}
            <Link href="/assignments" className="block md:col-span-2 md:row-span-2 group">
              <div className="bg-[#F5F0DC] text-on-surface p-6 neubrutal-border neubrutal-shadow rounded-lg rotate-1 group-hover:rotate-0 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b-[3px] border-on-surface pb-2">
                  <h2 className="font-space-grotesk font-bold uppercase text-base">Assignments</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    assignment
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {assignments.length > 0 ? (
                    assignments.slice(0, 3).map((item) => {
                      const isDone = item.status === 'done';
                      const isPending = item.status === 'pending';
                      
                      let tagBg = 'bg-[#ffe251] text-on-surface';
                      if (isDone) tagBg = 'bg-primary-fixed text-on-surface';
                      else if (isPending) tagBg = 'bg-error-container text-on-error-container';

                      return (
                        <div 
                          key={item.id} 
                          className="flex justify-between items-center bg-background p-3 neubrutal-border rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <span className={`font-archivo-narrow text-base font-bold ${isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                            {item.title}
                          </span>
                          <span className={`font-space-grotesk text-xs uppercase px-2 py-1 neubrutal-border rounded-sm ${tagBg}`}>
                            {isDone ? 'Done' : isPending ? 'Urgent' : 'In Progress'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="font-archivo-narrow text-lg font-bold text-center py-6 opacity-60">
                      No assignments found. Add one above!
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* Attendance Card (Green) */}
            <Link href="/attendance" className="block group">
              <div className="bg-secondary text-white p-6 neubrutal-border neubrutal-shadow rounded-lg -rotate-2 group-hover:rotate-0 transition-all duration-300 flex flex-col items-center justify-center text-center h-full">
                <h2 className="font-space-grotesk font-bold uppercase text-base mb-4 w-full text-left">Attendance</h2>
                <div className="w-24 h-24 rounded-full border-8 border-background border-t-secondary-container mb-4 flex items-center justify-center bg-on-surface shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <span className="font-anton text-2xl text-background">{overallAttendance}%</span>
                </div>
                <p className="font-archivo-narrow text-sm font-bold bg-background text-on-surface px-2 py-1 neubrutal-border">
                  {overallAttendance >= 75 ? 'Safe Zone: Keep it up!' : 'Attendance alert: Go to class!'}
                </p>
              </div>
            </Link>

            {/* Performance Card (GPA) (Orange-Red) */}
            <Link href="/gpa-calculator" className="block group">
              <div className="bg-tertiary-container text-white p-6 neubrutal-border neubrutal-shadow rounded-lg rotate-1 group-hover:rotate-0 transition-all duration-300 flex flex-col justify-between h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-space-grotesk font-bold uppercase text-base">Performance</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    trending_up
                  </span>
                </div>
                <div className="bg-background text-on-surface p-4 neubrutal-border rounded mt-auto">
                  <p className="font-archivo-narrow text-sm text-on-surface-variant uppercase mb-1">Current CGPA</p>
                  <p className="font-anton text-4xl">{cgpa.toFixed(1)}</p>
                </div>
              </div>
            </Link>

            {/* AI Study Assistant Card (Yellow) */}
            <Link href="/ai-assistant" className="block md:col-span-3 group">
              <div className="bg-secondary-container text-on-surface p-6 neubrutal-border neubrutal-shadow rounded-lg -rotate-1 group-hover:rotate-0 transition-all duration-300 flex justify-between items-center cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background rounded-full neubrutal-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>
                      forum
                    </span>
                  </div>
                  <span className="font-anton text-2xl uppercase tracking-tight">Ask bot anything...</span>
                </div>
                <span className="material-symbols-outlined text-[32px]">arrow_forward</span>
              </div>
            </Link>

            {/* Quick Settings Section */}
            <div className="md:col-span-3 flex flex-col gap-6 mt-4 border-t-4 border-on-surface pt-8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-on-surface">settings</span>
                <h2 className="font-anton text-3xl uppercase text-on-surface">Settings Options</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/settings" className="bg-[#ffe251] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Account</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">person</span>
                </Link>
                <Link href="/settings" className="bg-[#b4c5ff] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Appearance</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">palette</span>
                </Link>
                <Link href="/settings" className="bg-[#4ade80] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Timetable</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">schedule</span>
                </Link>
                <Link href="/settings" className="bg-[#ffb59d] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">AI Assistant</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">psychology</span>
                </Link>
                <Link href="/settings" className="bg-[#F5F0DC] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Calendar</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">calendar_today</span>
                </Link>
                <Link href="/settings" className="bg-[#ff5c5c] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">About</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">info</span>
                </Link>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* ================= DARK MODE DASHBOARD ================= */
        <main className="flex-grow max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 flex flex-col gap-12 w-full">
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="max-w-2xl flex flex-col gap-4">
              <div className="inline-block bg-[#ffe251] text-[#1a1b22] px-3 py-1 font-space-grotesk font-bold border-2 border-on-surface w-max -rotate-2">
                NEW SEMESTER
              </div>
              <h1 
                className="font-anton text-5xl md:text-7xl text-[#ffe251] uppercase"
                style={{
                  textShadow: '4px 4px 0px #e2e2eb, -1px -1px 0 #e2e2eb, 1px -1px 0 #e2e2eb, -1px 1px 0 #e2e2eb, 1px 1px 0 #e2e2eb'
                }}
              >
                Welcome Back
                {profileName ? (
                  <>
                    , <br />
                    <span className="text-[#ff5c5c]">{profileName}</span>
                  </>
                ) : null}
              </h1>
              <p className="font-archivo-narrow text-lg md:text-xl text-surface-container-low max-w-lg">
                You have {activeAssignmentsCount} assignments pending and {totalNotesCount} notes saved. Let&apos;s crush it.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <Link href="/assignments">
                  <span className="bg-[#ff5c5c] text-[#1a1b22] px-6 py-3 rounded-full font-space-grotesk font-bold uppercase neubrutal-border neubrutal-shadow neubrutal-hover block cursor-pointer">
                    View Deadlines
                  </span>
                </Link>
                <Link href="/ai-assistant">
                  <span className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-space-grotesk font-bold uppercase neubrutal-border neubrutal-shadow neubrutal-hover block cursor-pointer">
                    Ask AI Tutor
                  </span>
                </Link>
              </div>
            </div>

            {/* Today Card */}
            <div className="w-full md:w-80 h-64 bg-primary border-4 border-on-surface p-6 rounded-xl rotate-2 relative overflow-hidden flex items-center justify-center shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined text-9xl text-[#ffe251] opacity-30 absolute -right-4 -bottom-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                calendar_month
              </span>
              <div className="flex flex-col items-center justify-center z-10">
                <span className="font-anton text-2xl text-white tracking-widest">TODAY</span>
                <span className="font-anton text-7xl text-[#ffe251] mt-2">
                  {new Date().getDate()}
                </span>
              </div>
            </div>
          </section>

          {/* Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="bg-surface p-6 neubrutal-border neubrutal-shadow rounded-xl -rotate-1 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-on-surface pb-2">
                <h2 className="font-anton text-xl text-[#ffb59d] uppercase">Quick Actions</h2>
                <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bolt
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/notes" className="block">
                  <span className="w-full bg-[#4a6fd7] text-white p-4 rounded-xl border-3 border-on-surface shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                    <span className="material-symbols-outlined">edit_note</span>
                    <span className="font-space-grotesk text-sm font-bold">New Note</span>
                  </span>
                </Link>
                <button 
                  onClick={() => setIsTaskModalOpen(true)}
                  className="block w-full text-left"
                >
                  <span className="w-full bg-[#ffe251] text-[#1a1b22] p-4 rounded-xl border-3 border-on-surface shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                    <span className="material-symbols-outlined">task</span>
                    <span className="font-space-grotesk text-sm font-bold">Add Task</span>
                  </span>
                </button>
                <Link href="/gpa-calculator" className="block">
                  <span className="w-full bg-[#4ade80] text-[#1a1b22] p-4 rounded-xl border-3 border-on-surface shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                    <span className="material-symbols-outlined">calculate</span>
                    <span className="font-space-grotesk text-sm font-bold">GPA Calc</span>
                  </span>
                </Link>
                <Link href="/timetable" className="block">
                  <span className="w-full bg-[#ff5c5c] text-[#1a1b22] p-4 rounded-xl border-3 border-on-surface shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex justify-center items-center gap-2 cursor-pointer text-center text-on-surface">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="font-space-grotesk text-sm font-bold uppercase">View Schedule</span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Up Next (Timetable Preview) */}
            <div className="bg-surface p-6 neubrutal-border neubrutal-shadow rounded-xl rotate-1 md:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-on-surface pb-2">
                <h2 className="font-anton text-xl text-[#b4c5ff] uppercase">Up Next</h2>
                <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>
                  schedule
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {timetable.slice(0, 3).map((item, index) => {
                  const bgs = ['bg-[#4a6fd7]', 'bg-[#ff5c5c]', 'bg-[#ffe251]'];
                  const bg = bgs[index % bgs.length];
                  const textClass = bg === 'bg-[#ffe251]' ? 'text-[#1a1b22]' : 'text-white';

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-4 bg-background p-3 neubrutal-border rounded shadow-[3px_3px_0_var(--shadow-color)]"
                    >
                      <span className={`${bg} ${textClass} px-2.5 py-1 font-space-grotesk font-bold text-xs rounded`}>
                        {item.time}
                      </span>
                      <span className="font-archivo-narrow text-base font-bold text-on-surface">
                        {item.name} — {item.room}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance Quick Card */}
            <Link href="/attendance" className="block group">
              <div className="bg-surface p-6 neubrutal-border neubrutal-shadow rounded-xl rotate-1 group-hover:rotate-0 transition-transform h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b-2 border-on-surface pb-2 mb-4">
                  <h2 className="font-anton text-xl text-[#ffe251] uppercase">Attendance</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rule
                  </span>
                </div>
                <div className="flex items-center justify-between bg-background p-4 neubrutal-border rounded shadow-[3px_3px_0_var(--shadow-color)]">
                  <div>
                    <p className="font-anton text-4xl text-[#ff5c5c]">{overallAttendance}%</p>
                    <p className="font-archivo-narrow text-sm text-on-surface-variant uppercase mt-1">Overall</p>
                  </div>
                  <span className={`font-space-grotesk text-xs uppercase px-2 py-1 font-bold border-2 border-on-surface ${overallAttendance >= 75 ? 'bg-[#ffe251] text-[#1a1b22]' : 'bg-[#ff5c5c] text-white'}`}>
                    {overallAttendance >= 75 ? 'Safe zone' : 'Low rate'}
                  </span>
                </div>
              </div>
            </Link>

            {/* GPA Card */}
            <Link href="/gpa-calculator" className="block group">
              <div className="bg-surface p-6 neubrutal-border neubrutal-shadow rounded-xl -rotate-1 group-hover:rotate-0 transition-transform h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b-2 border-on-surface pb-2 mb-4">
                  <h2 className="font-anton text-xl text-[#b4c5ff] uppercase">Academic Standing</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    grade
                  </span>
                </div>
                <div className="flex items-center justify-between bg-background p-4 neubrutal-border rounded shadow-[3px_3px_0_var(--shadow-color)]">
                  <div>
                    <p className="font-anton text-4xl text-[#4a6fd7]">{cgpa.toFixed(1)}</p>
                    <p className="font-archivo-narrow text-sm text-on-surface-variant uppercase mt-1">Current CGPA</p>
                  </div>
                  <span className="font-space-grotesk text-xs uppercase bg-[#4a6fd7] text-white px-2 py-1 font-bold border-2 border-on-surface">
                    Level 4
                  </span>
                </div>
              </div>
            </Link>

            {/* Search Card */}
            <Link href="/search" className="block group">
              <div className="bg-surface p-6 neubrutal-border neubrutal-shadow rounded-xl rotate-2 group-hover:rotate-0 transition-transform h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b-2 border-on-surface pb-2 mb-4">
                  <h2 className="font-anton text-xl text-[#ffb59d] uppercase">Global Search</h2>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    manage_search
                  </span>
                </div>
                <div className="bg-[#ffb59d] text-[#1a1b22] p-4 neubrutal-border rounded shadow-[3px_3px_0_var(--shadow-color)] font-space-grotesk font-bold text-center">
                  Search across Notes, Timetable, & Assignments
                </div>
              </div>
            </Link>

            {/* Quick Settings Section */}
            <div className="md:col-span-3 flex flex-col gap-6 mt-4 border-t-4 border-on-surface pt-8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-on-surface">settings</span>
                <h2 className="font-anton text-3xl uppercase text-on-surface">Settings Options</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/settings" className="bg-[#ffe251] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Account</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">person</span>
                </Link>
                <Link href="/settings" className="bg-[#b4c5ff] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Appearance</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">palette</span>
                </Link>
                <Link href="/settings" className="bg-[#4ade80] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Timetable</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">schedule</span>
                </Link>
                <Link href="/settings" className="bg-[#ffb59d] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">AI Assistant</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">psychology</span>
                </Link>
                <Link href="/settings" className="bg-[#F5F0DC] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">Calendar</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">calendar_today</span>
                </Link>
                <Link href="/settings" className="bg-[#ff5c5c] text-[#1a1b22] p-4 neubrutal-border neubrutal-shadow rounded-lg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-between group">
                  <span className="font-space-grotesk font-bold uppercase text-sm">About</span>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">info</span>
                </Link>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Task Modal (Quick Add Modal) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div 
            className="absolute inset-0 cursor-default"
            onClick={() => setIsTaskModalOpen(false)}
          />
          <div className="bg-[#F5F0DC] text-[#1A1A2E] border-4 border-on-surface p-6 rounded-lg w-full max-w-md relative rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)] z-10 animate-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface hover:scale-110 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
              Add Task
            </h3>

            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none text-[#1a1b22]"
                  placeholder="e.g. History Essay Draft"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-space-grotesk font-bold focus:outline-none text-[#1a1b22]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-space-grotesk font-bold focus:outline-none text-[#1a1b22]"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 bg-[#ffe251] text-on-surface border-3 border-on-surface py-3 font-space-grotesk font-bold uppercase tracking-wider shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

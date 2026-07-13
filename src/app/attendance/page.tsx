'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '../../utils/api';

interface SubjectAttendance {
  id: string;
  name: string;
  attended: number;
  total: number;
  colorClass: string;
}

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const loadAttendance = async () => {
    try {
      const list = await api.getAttendance();
      const mapped = list.map((item: any) => ({
        id: item.id,
        name: item.course || item.name || 'Subject',
        attended: item.attended,
        total: item.total,
        colorClass: item.colorClass || 'bg-[#ffe251]',
      }));
      setSubjects(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const updateAttended = async (id: string, delta: number) => {
    const sub = subjects.find((s) => s.id === id);
    if (!sub) return;
    
    const newAttended = Math.max(0, sub.attended + delta);
    const newTotal = Math.max(newAttended, sub.total + (delta > 0 && newAttended > sub.total ? delta : 0));
    
    try {
      await api.updateAttendanceItem(id, { attended: newAttended, total: newTotal });
      await loadAttendance();
    } catch (e) {
      console.error(e);
    }
  };

  const updateTotal = async (id: string, delta: number) => {
    const sub = subjects.find((s) => s.id === id);
    if (!sub) return;

    const newTotal = Math.max(0, sub.total + delta);
    const newAttended = Math.min(sub.attended, newTotal);

    try {
      await api.updateAttendanceItem(id, { attended: newAttended, total: newTotal });
      await loadAttendance();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const colors = ['bg-[#ffe251]', 'bg-[#dbe1ff]', 'bg-[#ffdbd0]', 'bg-[#ffb59d]', 'bg-[#b4c5ff]', 'bg-[#F5F0DC]'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newSub = {
      course: newSubjectName,
      attended: 0,
      total: 0,
      colorClass: randomColor,
    };

    // Save attendance
    try {
      const savedList = JSON.parse(localStorage.getItem('studentos_attendance') || '[]');
      const updated = [...savedList, { ...newSub, id: Date.now().toString() }];
      localStorage.setItem('studentos_attendance', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      await loadAttendance();
    } catch (e) {
      console.error(e);
    }

    setNewSubjectName('');
    setIsModalOpen(false);
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const savedList = JSON.parse(localStorage.getItem('studentos_attendance') || '[]');
      const updated = savedList.filter((s: any) => s.id !== id);
      localStorage.setItem('studentos_attendance', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      await loadAttendance();
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate overall metrics
  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
  
  const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

  let statusMessage = '';
  let isSafe = true;

  if (totalClasses > 0) {
    const requiredAttended = Math.ceil(0.75 * totalClasses);
    if (overallPercentage >= 75) {
      const maxMissable = Math.floor((totalAttended - 0.75 * totalClasses) / 0.75);
      if (maxMissable > 0) {
        statusMessage = `You are safe. You can bunk next ${maxMissable} classes without falling below 75%.`;
      } else {
        statusMessage = `You are exactly on the boundary. Do not bunk any more classes!`;
      }
    } else {
      isSafe = false;
      const needToAttend = Math.ceil((0.75 * totalClasses - totalAttended) / 0.25);
      statusMessage = `Attendance alert! You need to attend next ${needToAttend} classes consecutively to reach 75%.`;
    }
  } else {
    statusMessage = 'Add subjects to start tracking attendance ratio.';
  }

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col gap-8 text-[#1A1A2E]">
        {/* Header Controls */}
        <header className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="transform -rotate-1 self-start">
            <h1 className="font-anton text-4xl md:text-5xl text-on-surface uppercase tracking-wider">
              ATTENDANCE TRACKER
            </h1>
            <p className="font-archivo-narrow text-base text-on-surface bg-secondary-container inline-block px-2 py-1 neubrutal-border mt-2 rotate-1">
              Know exactly when you can bunk. No guessing.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-[#ffe251] text-on-surface font-space-grotesk font-bold px-6 py-3 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center gap-2 cursor-pointer text-on-surface"
          >
            <span className="material-symbols-outlined">add</span> Add Subject
          </button>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Attendance Status Circle Card */}
          <div className="bg-background neubrutal-border neubrutal-shadow p-6 rounded-lg flex flex-col items-center justify-center text-center -rotate-1 gap-6">
            <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2 w-full text-left">
              Overall Status
            </h2>

            <div className="w-40 h-40 rounded-full border-12 border-primary-fixed border-t-primary flex items-center justify-center bg-on-surface shadow-[4px_4px_0_rgba(0,0,0,1)] relative">
              <span className="font-anton text-4xl text-background">{overallPercentage}%</span>
            </div>

            <div className={`p-4 neubrutal-border rounded shadow-[3px_3px_0_rgba(0,0,0,1)] font-space-grotesk font-bold text-sm uppercase ${
              isSafe ? 'bg-[#4ade80] text-on-surface' : 'bg-[#ff5c5c] text-white'
            }`}>
              {statusMessage}
            </div>
          </div>

          {/* Subjects Attendance Cards List */}
          <div className="md:col-span-2 bg-[#F5F0DC] p-6 neubrutal-border neubrutal-shadow rounded-lg rotate-1 flex flex-col gap-4">
            <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2">
              Course Details
            </h2>

            <div className="flex flex-col gap-4">
              {subjects.length > 0 ? (
                subjects.map((sub, index) => {
                  const isEven = index % 2 === 0;
                  const percentage = sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100);
                  const isSubjectSafe = percentage >= 75;

                  return (
                    <div
                      key={sub.id}
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-background p-4 neubrutal-border rounded shadow-[2px_2px_0px_var(--shadow-color)] gap-4 text-on-surface ${
                        isEven ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]'
                      }`}
                    >
                      <div className="flex-grow">
                        <span className="font-space-grotesk font-bold text-base text-on-surface">
                          {sub.name}
                        </span>
                        <div className="flex gap-2 items-center mt-1">
                          <span className={`text-[10px] font-space-grotesk font-bold uppercase px-1.5 py-0.5 border rounded-sm ${
                            isSubjectSafe ? 'bg-[#4ade80] text-on-surface' : 'bg-[#ff5c5c] text-white'
                          }`}>
                            {percentage}%
                          </span>
                          <span className="text-xs text-on-surface-variant font-archivo-narrow">
                            Total Lectures: {sub.total}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-space-grotesk font-bold uppercase text-on-surface-variant mb-1">Attended</span>
                          <div className="flex items-center border-2 border-on-surface bg-white shadow-[1px_1px_0_rgba(0,0,0,1)]">
                            <button
                              onClick={() => updateAttended(sub.id, -1)}
                              className="px-2 py-0.5 font-bold hover:bg-surface-container cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 font-anton text-sm">{sub.attended}</span>
                            <button
                              onClick={() => updateAttended(sub.id, 1)}
                              className="px-2 py-0.5 font-bold hover:bg-surface-container cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-space-grotesk font-bold uppercase text-on-surface-variant mb-1">Total Classes</span>
                          <div className="flex items-center border-2 border-on-surface bg-white shadow-[1px_1px_0_rgba(0,0,0,1)]">
                            <button
                              onClick={() => updateTotal(sub.id, -1)}
                              className="px-2 py-0.5 font-bold hover:bg-surface-container cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 font-anton text-sm">{sub.total}</span>
                            <button
                              onClick={() => updateTotal(sub.id, 1)}
                              className="px-2 py-0.5 font-bold hover:bg-surface-container cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="text-on-surface hover:text-red-600 p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-background text-on-surface p-8 neubrutal-border rounded text-center font-space-grotesk font-bold uppercase">
                  No subjects found. Click Add Subject to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F0DC] text-on-surface neubrutal-border neubrutal-shadow rounded-lg p-6 w-full max-w-sm relative rotate-1 text-[#1A1A2E]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface hover:scale-110 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
              Add Subject
            </h3>

            <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  placeholder="e.g. Advanced Calculus"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-[#ffe251] text-on-surface border-3 border-on-surface py-3 font-space-grotesk font-bold uppercase tracking-wider neubrutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer"
              >
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '../../utils/api';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  status: 'Due Today' | 'In Progress' | 'Done';
  dueDate: string;
  notes?: string;
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Due Today' | 'Done'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Due Today' | 'In Progress' | 'Done'>('Due Today');
  const [notes, setNotes] = useState('');

  const loadAssignments = async () => {
    try {
      const list = await api.getAssignments();
      setAssignments(list as any[]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  // Handle action=new or filter= from URL query params
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
    }
    const f = searchParams.get('filter');
    if (f === 'Due Today' || f === 'Pending' || f === 'Done' || f === 'All') {
      setFilter(f);
    }
  }, [searchParams]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject) return;

    const newAssignment = {
      title,
      subject,
      status,
      dueDate: dueDate || 'No Date',
      notes,
    };

    try {
      await api.addAssignmentItem(newAssignment);
      await loadAssignments();
    } catch (e) {
      console.error(e);
    }
    
    // Reset Form
    setTitle('');
    setSubject('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setStatus('Due Today');
    setNotes('');
    setIsModalOpen(false);
  };

  const handleCycleStatus = async (item: Assignment) => {
    let nextStatus: 'Due Today' | 'In Progress' | 'Done' = 'Due Today';
    if (item.status === 'Due Today') nextStatus = 'In Progress';
    else if (item.status === 'In Progress') nextStatus = 'Done';

    try {
      await api.updateAssignmentItem(item.id, { status: nextStatus });
      await loadAssignments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteAssignmentItem(id);
      await loadAssignments();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'Due Today') return item.status === 'Due Today';
    if (filter === 'Pending') return item.status === 'Due Today' || item.status === 'In Progress';
    if (filter === 'Done') return item.status === 'Done';
    return true;
  });

  return (
    <main className="flex-grow w-full px-6 md:px-8 py-8 flex flex-col gap-8 max-w-5xl mx-auto text-[#1A1A2E]">
      {/* Header Controls */}
      <header className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="transform -rotate-1 self-start">
          <h1 className="font-anton text-4xl md:text-5xl text-on-surface uppercase tracking-wider">
            Assignments
          </h1>
          <p className="font-archivo-narrow text-base text-on-surface bg-secondary-container inline-block px-2 py-1 neubrutal-border mt-2 rotate-1">
            Do them now or cry later.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#ffe251] text-on-surface font-space-grotesk font-bold px-6 py-3 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer text-on-surface"
        >
          <span className="material-symbols-outlined">add</span>
          New Task
        </button>
      </header>

      {/* Tab Filters */}
      <section aria-label="Assignment Status" className="flex flex-wrap gap-3">
        {(['All', 'Due Today', 'Pending', 'Done'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-2 font-space-grotesk font-bold rounded-sm neubrutal-border neubrutal-shadow transition-all cursor-pointer ${
              filter === tab
                ? 'bg-primary text-white translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {tab}
          </button>
        ))}
      </section>

      {/* Assignment Lists */}
      <section className="bg-[#F5F0DC] p-6 neubrutal-border neubrutal-shadow rounded-lg flex flex-col gap-4 rotate-1">
        <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2 flex justify-between items-center">
          <span>Task Board</span>
          <span className="bg-background text-on-surface text-xs font-space-grotesk font-bold py-1 px-2 border-2 border-on-surface">
            {filteredAssignments.length} ITEMS
          </span>
        </h2>

        <div className="flex flex-col gap-4">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={item.id}
                  onClick={() => handleCycleStatus(item)}
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-background p-4 neubrutal-border rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.01] transition-transform cursor-pointer gap-4 ${
                    isEven ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox status indicator */}
                    <div className="w-6 h-6 border-3 border-on-surface flex items-center justify-center bg-white rounded-sm shrink-0">
                      {item.status === 'Done' && (
                        <span className="material-symbols-outlined text-green-700 font-bold text-lg">
                          check
                        </span>
                      )}
                      {item.status === 'In Progress' && (
                        <span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm" />
                      )}
                    </div>
                    <div>
                      <span
                        className={`font-archivo-narrow text-lg font-bold text-on-surface ${
                          item.status === 'Done' ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {item.title}
                      </span>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="bg-primary-fixed text-on-primary-fixed border border-on-surface text-[10px] font-space-grotesk font-bold uppercase px-1.5 py-0.5 rounded-sm text-on-surface">
                          {item.subject}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-on-surface-variant font-archivo-narrow">
                            — {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                    <div className="flex flex-col items-end">
                      <span className="font-space-grotesk text-xs font-bold uppercase text-on-surface-variant">
                        Due Date
                      </span>
                      <span className="font-anton text-sm text-on-surface uppercase mt-0.5">
                        {item.dueDate}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteAssignment(item.id, e)}
                      className="text-on-surface hover:text-red-600 hover:scale-110 transition-transform p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-background text-on-surface p-8 neubrutal-border rounded text-center font-space-grotesk font-bold uppercase">
              No tasks found. Click &quot;New Task&quot; to begin.
            </div>
          )}
        </div>
      </section>

      {/* New Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F0DC] text-on-surface neubrutal-border neubrutal-shadow rounded-lg p-6 w-full max-w-md relative -rotate-1">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface hover:scale-110 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
              Create New Task
            </h3>

            <form onSubmit={handleAddAssignment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  placeholder="e.g. Lab Report Write-up"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Subject / Tag</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                    placeholder="e.g. Chemistry"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-space-grotesk font-bold focus:outline-none"
                  >
                    <option value="Due Today">Due Today</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none resize-none"
                  placeholder="Add details about the task..."
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-[#ffe251] text-on-surface border-3 border-on-surface py-3 font-space-grotesk font-bold uppercase tracking-wider neubrutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AssignmentsPage() {
  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar />
      <Suspense fallback={<div className="flex-grow flex items-center justify-center font-anton text-2xl uppercase">Loading Tasks...</div>}>
        <AssignmentsContent />
      </Suspense>
      <Footer />
    </div>
  );
}

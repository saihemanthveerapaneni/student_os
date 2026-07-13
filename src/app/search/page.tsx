'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '../../utils/api';

interface SearchResultNote {
  id: string;
  title: string;
  content: string;
  tag: string;
  date: string;
  color: string;
}

interface SearchResultAssignment {
  id: string;
  title: string;
  subject: string;
  status: string;
  dueDate: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [notesResults, setNotesResults] = useState<SearchResultNote[]>([]);
  const [assignmentsResults, setAssignmentsResults] = useState<SearchResultAssignment[]>([]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setNotesResults([]);
        setAssignmentsResults([]);
        return;
      }

      try {
        const results = await api.globalSearch(query);
        
        // Map assignments status values for UI display
        const mappedAssignments = (results.assignments || []).map((item: any) => {
          let uiStatus = 'Due Today';
          if (item.status === 'in_progress' || item.status === 'In Progress') uiStatus = 'In Progress';
          else if (item.status === 'done' || item.status === 'Done') uiStatus = 'Done';
          
          return {
            id: item.id || Date.now().toString(),
            title: item.title || '',
            subject: item.subject || 'General',
            status: uiStatus,
            dueDate: item.dueDate || item.due_date || 'No Date',
          };
        });

        // Map notes tags for UI display
        const mappedNotes = (results.notes || []).map((item: any) => {
          let t = 'Misc';
          if (Array.isArray(item.tags) && item.tags.length > 0) t = item.tags[0];
          else if (item.tag) t = item.tag;

          return {
            id: item.id || Date.now().toString(),
            title: item.title || 'Untitled Note',
            content: item.content || '',
            tag: t,
            date: item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            color: item.color || 'bg-[#ffe251]',
          };
        });

        setNotesResults(mappedNotes);
        setAssignmentsResults(mappedAssignments);
      } catch (e) {
        console.error(e);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col gap-8 text-[#1A1A2E]">
      {/* Search input bar */}
      <div className="relative w-full flex items-center">
        <span className="material-symbols-outlined absolute left-4 text-on-surface z-10">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#F5F0DC] border-3 border-on-surface rounded-none py-4 pl-12 pr-4 font-archivo-narrow text-xl text-on-surface focus:outline-none focus:ring-0 placeholder:text-on-surface/40 shadow-[4px_4px_0px_var(--shadow-color)]"
          placeholder="Global search (notes, assignments, subject tags)..."
        />
      </div>

      <div className="flex flex-col gap-8">
        {/* Notes Section */}
        <section className="bg-background neubrutal-border neubrutal-shadow p-6 rounded-lg rotate-1">
          <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2 mb-4 flex justify-between items-center">
            <span>Notes Matches</span>
            <span className="bg-primary-fixed text-on-surface text-xs font-space-grotesk font-bold py-1 px-2 border-2 border-on-surface">
              {notesResults.length} MATCHES
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notesResults.length > 0 ? (
              notesResults.map((note) => (
                <div
                  key={note.id}
                  className={`${note.color} p-4 border-3 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 rotate-m1`}
                >
                  <div className="flex justify-between items-center">
                    <span className="bg-white border border-on-surface px-1.5 py-0.5 text-[10px] font-space-grotesk font-bold uppercase text-on-surface">
                      {note.tag}
                    </span>
                    <span className="text-[10px] font-space-grotesk font-bold text-on-surface">
                      {note.date}
                    </span>
                  </div>
                  <h3 className="font-anton text-lg uppercase text-on-surface">{note.title}</h3>
                  <p className="font-archivo-narrow text-sm text-on-surface/85 line-clamp-3">
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center text-on-surface-variant py-4 font-space-grotesk font-bold uppercase text-xs">
                No note matches found.
              </p>
            )}
          </div>
        </section>

        {/* Assignments Section */}
        <section className="bg-background neubrutal-border neubrutal-shadow p-6 rounded-lg -rotate-1">
          <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2 mb-4 flex justify-between items-center">
            <span>Assignments Matches</span>
            <span className="bg-primary-fixed text-on-surface text-xs font-space-grotesk font-bold py-1 px-2 border-2 border-on-surface">
              {assignmentsResults.length} MATCHES
            </span>
          </h2>

          <div className="flex flex-col gap-3">
            {assignmentsResults.length > 0 ? (
              assignmentsResults.map((assign) => {
                const isDone = assign.status === 'Done';
                const isPending = assign.status === 'Due Today';
                
                let tagBg = 'bg-[#ffe251] text-[#1a1b22]';
                if (isDone) tagBg = 'bg-primary-fixed text-on-surface';
                else if (isPending) tagBg = 'bg-error-container text-on-error-container';

                return (
                  <div
                    key={assign.id}
                    className="flex justify-between items-center bg-white p-3 border-3 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm rotate-p1"
                  >
                    <div>
                      <h3 className={`font-space-grotesk font-bold text-base ${isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {assign.title}
                      </h3>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="bg-primary-fixed text-on-primary-fixed border border-on-surface text-[10px] font-space-grotesk font-bold uppercase px-1.5 py-0.5 rounded-sm">
                          {assign.subject}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-[8px] font-space-grotesk font-bold text-on-surface-variant uppercase">Due</span>
                        <span className="font-anton text-xs text-on-surface">{assign.dueDate}</span>
                      </div>
                      <span className={`font-space-grotesk text-[10px] uppercase px-2 py-1 border-2 border-on-surface rounded-sm font-bold ${tagBg}`}>
                        {assign.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-on-surface-variant py-4 font-space-grotesk font-bold uppercase text-xs">
                No assignment matches found.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar />
      <Suspense fallback={<div className="flex-grow flex items-center justify-center font-anton text-2xl uppercase">Loading Search Results...</div>}>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '../../utils/api';

interface Note {
  id: string;
  title: string;
  content: string;
  tag: string;
  date: string;
  color: string;
  pinned?: boolean;
}

function NotesContent() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('');
  const [color, setColor] = useState('bg-[#ffe251]');
  const [pinned, setPinned] = useState(false);

  const loadNotes = async () => {
    try {
      const list = await api.getNotes();
      setNotes(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Load from API on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Handle action=new from URL query params
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newNote = {
      title,
      content,
      tag: tag.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      color,
      pinned,
    };

    try {
      await api.addNoteItem(newNote);
      await loadNotes();
    } catch (e) {
      console.error(e);
    }

    setTitle('');
    setContent('');
    setTag('');
    setColor('bg-[#ffe251]');
    setPinned(false);
    setIsModalOpen(false);
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNoteItem(id);
      await loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    setNotes(updated);
    // sync back
    localStorage.setItem('studentos_notes', JSON.stringify(updated));
  };

  const availableTags = ['All', ...Array.from(new Set(notes.map((note) => note.tag).filter(Boolean)))];

  const filteredNotes = notes.filter((note) => {
    const matchesTag = selectedTag === 'All' || note.tag === selectedTag;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  // Sort notes so pinned ones are at the top
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <main className="flex-grow w-full px-6 md:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header Controls */}
      <header className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-2/3 flex items-center">
          <span className="material-symbols-outlined absolute left-4 text-on-surface z-10">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F0DC] dark:bg-surface border-3 border-on-surface rounded-none py-3 pl-12 pr-4 font-archivo-narrow text-lg text-on-surface focus:outline-none focus:ring-0 placeholder:text-on-surface/50 shadow-[4px_4px_0px_var(--shadow-color)]"
            placeholder="Search notes..."
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-[#ffe251] text-on-surface font-space-grotesk font-bold px-6 py-3 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer text-on-surface"
          >
            <span className="material-symbols-outlined">add</span>
            New Note
          </button>

          <Link href="/notes/summarizer" className="flex-1 md:flex-none">
            <span className="bg-primary text-white font-space-grotesk font-bold px-6 py-3 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer h-full text-white">
              <span className="material-symbols-outlined">summarize</span>
              Summarize
            </span>
          </Link>
        </div>
      </header>

      {/* Filters */}
      <section aria-label="Note Subjects" className="flex flex-wrap gap-3">
        {availableTags.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`px-5 py-2 rounded-full font-space-grotesk font-bold neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer ${
              selectedTag === t
                ? 'bg-primary text-white translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white text-on-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </section>

      {/* Notes Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {sortedNotes.length > 0 ? (
          sortedNotes.map((n, i) => {
            const rotateDeg = (i % 3) - 1; // tilts between -1, 0, 1 degree
            return (
              <article
                key={n.id}
                style={{ transform: `rotate(${rotateDeg}deg)` }}
                className={`${n.color} text-on-surface p-6 neubrutal-border neubrutal-shadow flex flex-col gap-4 hover:rotate-0 hover:scale-[1.02] transition-all cursor-pointer relative group`}
              >
                <button
                  onClick={(e) => handleDeleteNote(n.id, e)}
                  className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 hover:scale-110 text-xs font-bold bg-white border-2 border-on-surface w-6 h-6 rounded-full flex items-center justify-center shadow-[1px_1px_0_rgba(0,0,0,1)] transition-opacity"
                  title="Delete note"
                >
                  ×
                </button>
                <div className="flex justify-between items-start">
                  <span className="inline-block border-2 border-on-surface bg-white px-2 py-1 text-xs font-space-grotesk font-bold uppercase text-on-surface">
                    {n.tag}
                  </span>
                  <button
                    onClick={(e) => togglePin(n.id, e)}
                    className={`hover:scale-125 transition-transform text-on-surface ${
                      n.pinned ? 'opacity-100' : 'opacity-30 hover:opacity-75'
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: n.pinned ? "'FILL' 1" : "'FILL' 0" }}>
                      push_pin
                    </span>
                  </button>
                </div>

                <h3 className="font-anton text-xl uppercase leading-tight text-on-surface">
                  {n.title}
                </h3>
                
                <p className="font-archivo-narrow text-base text-on-surface/90 flex-grow whitespace-pre-wrap">
                  {n.content}
                </p>

                <div className="pt-4 border-t-2 border-on-surface/20 flex justify-between items-center text-xs text-on-surface">
                  <span className="font-space-grotesk font-bold">Edited: {n.date}</span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full bg-white text-on-surface p-8 neubrutal-border neubrutal-shadow text-center font-space-grotesk font-bold uppercase rotate-1">
            No notes found. Create a new one!
          </div>
        )}
      </section>

      {/* New Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F0DC] text-on-surface neubrutal-border neubrutal-shadow rounded-lg p-6 w-full max-w-md relative -rotate-1 text-[#1A1A2E]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface hover:scale-110 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
              Create New Note
            </h3>

            <form onSubmit={handleAddNote} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  placeholder="Note Title"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Content</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none resize-none"
                  placeholder="Write your study notes here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                    placeholder="Add a tag"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Note Color</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  >
                    <option value="bg-[#ffe251]">Yellow</option>
                    <option value="bg-[#ffdbd0]">Red-Orange</option>
                    <option value="bg-[#dbe1ff]">Blue-Grey</option>
                    <option value="bg-[#b4c5ff]">Cornflower</option>
                    <option value="bg-[#FAF8FF]">White</option>
                    <option value="bg-[#ffb59d]">Salmon</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 bg-[#ffe251] text-on-surface border-3 border-on-surface py-3 font-space-grotesk font-bold uppercase tracking-wider neubrutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer"
              >
                Create Note
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function NotesPage() {
  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar />
      <Suspense fallback={<div className="flex-grow flex items-center justify-center font-anton text-2xl uppercase">Loading Notes...</div>}>
        <NotesContent />
      </Suspense>
      <Footer />
    </div>
  );
}

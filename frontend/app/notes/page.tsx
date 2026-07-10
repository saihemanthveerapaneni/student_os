"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/store/useAuthStore";

interface Course {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  is_pinned: boolean;
  pdf_url?: string;
  image_url?: string;
  version: number;
  course_id?: string;
  updated_at: string;
}

interface NoteVersion {
  id: string;
  version: number;
  content: string;
  created_at: string;
}

export default function NotesPage() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("Computer Science");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorFolder, setEditorFolder] = useState("Computer Science");
  const [editorTags, setEditorTags] = useState("");
  const [editorCourse, setEditorCourse] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<NoteVersion[]>([]);
  
  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const folders = ["Computer Science", "History", "Physics", "Literature", "General"];

  const loadNotesData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, code, name, color")
        .eq("user_id", user.id);
      setCourses(coursesData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      setNotes(notesData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotesData();
  }, [user?.id]);

  // Open note in editor
  const handleOpenEditor = async (note: Note | null) => {
    if (note) {
      setEditingNote(note);
      setEditorTitle(note.title);
      setEditorContent(note.content);
      setEditorFolder(note.folder);
      setEditorTags(note.tags.join(", "));
      setEditorCourse(note.course_id || "");
      
      // Load note version history
      const { data: versions } = await supabase
        .from("note_versions")
        .select("*")
        .eq("note_id", note.id)
        .order("version", { ascending: false });
      setHistoryVersions(versions || []);
    } else {
      setEditingNote(null);
      setEditorTitle("");
      setEditorContent("");
      setEditorFolder(selectedFolder);
      setEditorTags("");
      setEditorCourse("");
      setHistoryVersions([]);
    }
    setIsHistoryOpen(false);
    setIsEditorOpen(true);
  };

  // Save Note (Update or Insert)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle || !user?.id) return;

    const tagsArray = editorTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.startsWith("#") ? t : `#${t}`)
      .filter((t) => t.length > 1);

    try {
      if (editingNote) {
        // Save history version of current state before updating
        await supabase.from("note_versions").insert({
          note_id: editingNote.id,
          version: editingNote.version,
          content: editingNote.content
        });

        // Update note
        const newVersion = editingNote.version + 1;
        const { error } = await supabase
          .from("notes")
          .update({
            title: editorTitle,
            content: editorContent,
            folder: editorFolder,
            tags: tagsArray,
            course_id: editorCourse || null,
            version: newVersion,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingNote.id);

        if (error) throw error;
      } else {
        // Insert note
        const { error } = await supabase.from("notes").insert({
          user_id: user.id,
          title: editorTitle,
          content: editorContent,
          folder: editorFolder,
          tags: tagsArray,
          course_id: editorCourse || null,
          version: 1
        });

        if (error) throw error;
      }
      setIsEditorOpen(false);
      loadNotesData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (!error) {
      setIsEditorOpen(false);
      loadNotesData();
    }
  };

  // Toggle Pin Status
  const togglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id);
    if (!error) {
      loadNotesData();
    }
  };

  // PDF Text Extraction via FastAPI Backend
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/files/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to process file on backend.");
      }

      const data = await res.json();
      if (data.text) {
        setEditorContent((prev) => `${prev}\n\n### Extracted from ${file.name}:\n${data.text}`);
      }
    } catch (err: any) {
      setUploadError("Failed to extract text. Make sure the backend server is running.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Restore Note Version
  const handleRestoreVersion = (version: NoteVersion) => {
    setEditorContent(version.content);
    setIsHistoryOpen(false);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesFolder = n.folder === selectedFolder;
    const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
    const matchesSearch = searchQuery
      ? n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesFolder && matchesTag && matchesSearch;
  });

  // Extract all unique tags for the sidebar list
  const allTags = Array.from(
    new Set(notes.filter((n) => n.folder === selectedFolder).flatMap((n) => n.tags))
  );

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm bg-surface dark:bg-surface-container-low mt-4">
        {/* Left Panel: Subject Folders */}
        <aside className="w-72 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant/30 flex flex-col py-lg px-md overflow-y-auto">
          <div className="flex items-center justify-between mb-md px-xs">
            <h2 className="text-title-md font-bold text-on-surface">Notebooks</h2>
            <button 
              onClick={() => handleOpenEditor(null)}
              className="text-primary hover:bg-primary-container/10 p-xs rounded-md transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="create_new_folder">add_circle</span>
            </button>
          </div>
          
          <div className="space-y-base flex-grow">
            {folders.map((folder) => {
              const isActive = selectedFolder === folder;
              const count = notes.filter(n => n.folder === folder).length;
              return (
                <button 
                  key={folder}
                  onClick={() => { setSelectedFolder(folder); setSelectedTag(null); }}
                  className={`w-full flex items-center justify-between px-sm py-2.5 rounded-lg text-body-md transition-all cursor-pointer ${
                    isActive 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <div className="flex items-center gap-sm">
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? "icon-fill" : ""}`}>
                      {isActive ? "folder_open" : "folder"}
                    </span>
                    <span>{folder}</span>
                  </div>
                  <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${isActive ? "bg-surface-container-lowest shadow-sm" : "bg-surface-container-high"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tags section */}
          <div className="mt-xl pt-lg border-t border-outline-variant/20">
            <h3 className="text-label-md font-bold text-outline px-xs mb-sm uppercase tracking-wider">Tags</h3>
            {allTags.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant px-xs">No tags in folder</p>
            ) : (
              <div className="flex flex-wrap gap-xs px-xs">
                {allTags.map((tag) => (
                  <span 
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2.5 py-1 rounded-md text-label-md font-medium cursor-pointer transition-colors ${
                      selectedTag === tag 
                        ? "bg-primary text-on-primary" 
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel: Notes Grid */}
        <section className="flex-1 flex flex-col p-lg overflow-y-auto bg-background/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
            <div>
              <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">{selectedFolder}</h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                {filteredNotes.length} notes • Last edited recently
              </p>
            </div>
            
            <div className="flex items-center gap-xs">
              <div className="relative">
                <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="pl-9 pr-4 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none"
                />
              </div>
              <button 
                onClick={() => handleOpenEditor(null)}
                className="flex items-center gap-xs px-md py-1.5 bg-primary text-on-primary rounded-lg text-body-md font-medium hover:bg-primary/95 shadow-sm cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Note
              </button>
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant py-20">
              <span className="material-symbols-outlined text-[48px] text-outline/40 mb-3">description</span>
              <h3 className="text-title-lg font-bold">No notes found</h3>
              <p className="text-body-md">Create your first lecture note to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md auto-rows-max">
              {filteredNotes.map((note) => (
                <article 
                  key={note.id}
                  onClick={() => handleOpenEditor(note)}
                  className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-md flex flex-col gap-sm border border-outline-variant/20 hover:border-primary/30 shadow-sm hover:shadow transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-title-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {note.title}
                    </h3>
                    <div className="flex gap-xs">
                      <button 
                        onClick={(e) => togglePin(note, e)}
                        className={`transition-colors cursor-pointer p-0.5 rounded ${
                          note.is_pinned ? "text-primary" : "text-outline/40 hover:text-outline"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${note.is_pinned ? "icon-fill" : ""}`}>
                          push_pin
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-body-md text-on-surface-variant line-clamp-3 flex-grow leading-relaxed">
                    {note.content || "Empty content. Click to begin writing notes..."}
                  </p>

                  <div className="flex items-center justify-between pt-sm border-t border-outline-variant/10 mt-auto">
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(note.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex gap-xs">
                      {note.tags.slice(0, 1).map(t => (
                        <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold uppercase tracking-wider">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Editor slide-over modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end p-0 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-surface-container-low w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-outline-variant/30 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center px-lg py-md border-b border-outline-variant/20 bg-background/50">
              <div className="flex items-center gap-sm">
                <h3 className="text-title-lg font-bold text-on-surface">
                  {editingNote ? "Edit Note" : "New Note"}
                </h3>
                {editingNote && (
                  <span className="text-[10px] bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface-variant font-bold">
                    v{editingNote.version}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-sm">
                {editingNote && (
                  <button 
                    type="button"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="flex items-center gap-xs px-sm py-1.5 border border-outline-variant rounded-lg text-body-md text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    History
                  </button>
                )}
                {editingNote && (
                  <button 
                    type="button"
                    onClick={() => handleDeleteNote(editingNote.id)}
                    className="text-error hover:bg-error/10 p-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                )}
                <button onClick={() => setIsEditorOpen(false)} className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-lg space-y-md custom-scrollbar">
                {/* Title */}
                <div>
                  <label className="block text-title-md font-semibold text-on-surface mb-1">Title</label>
                  <input 
                    type="text" 
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    placeholder="Lecture Title..."
                    required
                    className="w-full px-sm py-2.5 bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none"
                  />
                </div>

                {/* Folder & Course */}
                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <label className="block text-title-md font-semibold text-on-surface mb-1">Notebook Folder</label>
                    <select 
                      value={editorFolder}
                      onChange={(e) => setEditorFolder(e.target.value)}
                      className="w-full px-sm py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none"
                    >
                      {folders.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-title-md font-semibold text-on-surface mb-1">Course Code</label>
                    <select 
                      value={editorCourse}
                      onChange={(e) => setEditorCourse(e.target.value)}
                      className="w-full px-sm py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none"
                    >
                      <option value="">None</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-title-md font-semibold text-on-surface mb-1">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={editorTags}
                    onChange={(e) => setEditorTags(e.target.value)}
                    placeholder="exam-prep, algorithms, graph-theory"
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none"
                  />
                </div>

                {/* File Attachment Upload */}
                <div>
                  <label className="block text-title-md font-semibold text-on-surface mb-1">Attachments (PDF text import)</label>
                  <div className="flex items-center gap-sm">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handlePDFUpload}
                      disabled={uploadingFile}
                      className="text-body-md text-on-surface-variant file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-body-md file:font-semibold file:bg-primary/10 file:text-primary file:hover:bg-primary/20 file:cursor-pointer disabled:opacity-50"
                    />
                    {uploadingFile && <span className="text-[11px] text-primary animate-pulse">Extracting text on backend...</span>}
                  </div>
                  {uploadError && <p className="text-[10px] text-error mt-1">{uploadError}</p>}
                </div>

                {/* Content editor */}
                <div className="flex flex-col h-80">
                  <label className="block text-title-md font-semibold text-on-surface mb-1">Note Content (supports markdown)</label>
                  <textarea 
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Type lecture details here..."
                    className="w-full flex-1 p-sm bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface focus:outline-none font-mono resize-none custom-scrollbar"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-lg border-t border-outline-variant/20 bg-background/50 flex justify-end gap-sm">
                <button 
                  type="button" 
                  onClick={() => setIsEditorOpen(false)}
                  className="px-md py-2 border border-outline-variant rounded-lg text-body-md font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-lg py-2 bg-primary text-on-primary rounded-lg text-body-md font-semibold hover:bg-primary/95 shadow cursor-pointer transition-colors"
                >
                  Save Note
                </button>
              </div>
            </form>

            {/* Version History Sidebar */}
            {isHistoryOpen && (
              <div className="absolute right-0 top-16 w-80 h-[calc(100%-64px)] bg-surface-container-high border-l border-outline-variant/30 z-10 flex flex-col p-md">
                <h4 className="text-title-md font-bold text-on-surface mb-md">Version History</h4>
                {historyVersions.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">No previous versions saved.</p>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-sm pr-xs custom-scrollbar">
                    {historyVersions.map((v) => (
                      <div key={v.id} className="p-sm bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-primary">v{v.version}</span>
                          <span className="text-[10px] text-on-surface-variant">
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-body-md text-on-surface-variant line-clamp-2 mb-2 font-mono text-xs">
                          {v.content}
                        </p>
                        <button 
                          onClick={() => handleRestoreVersion(v)}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Restore content
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </AppLayout>
  );
}

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

interface Assignment {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "submitted" | "overdue";
  due_date: string;
  reminder_at?: string;
  course_id?: string;
  courses?: Course;
}

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "submitted" | "overdue">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newReminderDate, setNewReminderDate] = useState("");

  const loadAssignmentsData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Fetch Courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id);
      setCourses(coursesData || []);

      // Fetch Assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*, courses(*)")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });
      setAssignments(assignmentsData as any[] || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignmentsData();
  }, [user?.id]);

  // Handle Mark Done (Check/Uncheck)
  const handleToggleStatus = async (task: Assignment) => {
    const nextStatus = task.status === "submitted" ? "pending" : "submitted";
    const { error } = await supabase
      .from("assignments")
      .update({ status: nextStatus })
      .eq("id", task.id);
    if (!error) {
      loadAssignmentsData();
    }
  };

  // Add Assignment
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDueDate || !user?.id) return;

    try {
      const { error } = await supabase.from("assignments").insert({
        user_id: user.id,
        course_id: newCourse || null,
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        status: "pending",
        due_date: new Date(newDueDate).toISOString(),
        reminder_at: newReminderDate ? new Date(newReminderDate).toISOString() : null
      });

      if (!error) {
        setIsDialogOpen(false);
        // Reset fields
        setNewTitle("");
        setNewDescription("");
        setNewCourse("");
        setNewDueDate("");
        setNewPriority("medium");
        setNewReminderDate("");
        loadAssignmentsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Remove this assignment task?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (!error) {
      loadAssignmentsData();
    }
  };

  // Calculate Progress count
  const totalCount = assignments.length;
  const submittedCount = assignments.filter(a => a.status === "submitted").length;
  const progressPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  // Filter Tasks
  const filteredAssignments = assignments.filter((a) => {
    // 1. Tab Check
    let matchesTab = a.status === activeTab;
    // Special check for overdue
    if (activeTab === "overdue") {
      matchesTab = a.status === "pending" && new Date(a.due_date) < new Date();
    } else if (activeTab === "pending") {
      // Pending only matches not-overdue pending tasks
      matchesTab = a.status === "pending" && new Date(a.due_date) >= new Date();
    }

    // 2. Search query check
    const matchesSearch = searchQuery
      ? a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // 3. Priority filter check
    const matchesPriority = priorityFilter === "all" ? true : a.priority === priorityFilter;

    return matchesTab && matchesSearch && matchesPriority;
  });

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface mb-2 tracking-tight">Assignments</h1>
          <p className="text-body-lg text-on-surface-variant">Stay on top of your deliverables and deadlines.</p>
        </div>
        <div className="flex items-center gap-xs">
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-sm py-2 bg-surface border border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-body-md font-medium hover:bg-primary/95 shadow-sm cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Assignment
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-6 border-b border-outline-variant/30 mb-6">
        <button 
          onClick={() => setActiveTab("pending")}
          className={`pb-3 border-b-2 text-title-md font-semibold cursor-pointer transition-colors ${
            activeTab === "pending" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Pending <span className="ml-1 inline-flex items-center justify-center bg-primary-container/10 text-primary text-[10px] font-bold h-5 px-2 rounded-full">
            {assignments.filter(a => a.status === "pending" && new Date(a.due_date) >= new Date()).length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("submitted")}
          className={`pb-3 border-b-2 text-title-md font-semibold cursor-pointer transition-colors ${
            activeTab === "submitted" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Submitted <span className="ml-1 inline-flex items-center justify-center bg-secondary-container/20 text-secondary text-[10px] font-bold h-5 px-2 rounded-full">
            {assignments.filter(a => a.status === "submitted").length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("overdue")}
          className={`pb-3 border-b-2 text-title-md font-semibold cursor-pointer transition-colors ${
            activeTab === "overdue" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Overdue <span className="ml-1 inline-flex items-center justify-center bg-error-container text-on-error-container text-[10px] font-bold h-5 px-2 rounded-full">
            {assignments.filter(a => a.status === "pending" && new Date(a.due_date) < new Date()).length}
          </span>
        </button>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column: Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container dark:bg-surface-container-low border border-outline-variant/30 rounded-xl text-body-md focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="bg-surface-container animate-pulse h-40 rounded-xl"></div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-xl border border-outline-variant/20 shadow-sm text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] text-outline/35 mb-2">assignment_turned_in</span>
              <h3 className="text-title-lg font-bold">No assignments found</h3>
              <p className="text-body-md mt-1">There are no assignments in this view matching your filters.</p>
            </div>
          ) : (
            filteredAssignments.map((task) => {
              const isHigh = task.priority === "high";
              const isMed = task.priority === "medium";
              const isOverdue = new Date(task.due_date) < new Date() && task.status === "pending";
              
              return (
                <div 
                  key={task.id} 
                  className={`bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-md shadow-sm border border-outline-variant/20 hover:border-primary/20 transition-all group flex items-start gap-md border-l-4 ${
                    isOverdue 
                      ? "border-l-error" 
                      : isHigh 
                      ? "border-l-orange-500" 
                      : isMed 
                      ? "border-l-primary" 
                      : "border-l-outline"
                  }`}
                >
                  <div className="pt-1">
                    <input 
                      type="checkbox"
                      checked={task.status === "submitted"}
                      onChange={() => handleToggleStatus(task)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-xs">
                        {task.courses && (
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ 
                              backgroundColor: `${task.courses.color}15`, 
                              color: task.courses.color 
                            }}
                          >
                            {task.courses.code}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isHigh 
                            ? "bg-error-container text-on-error-container" 
                            : isMed 
                            ? "bg-primary-container/10 text-primary" 
                            : "bg-surface-variant text-on-surface-variant"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteAssignment(task.id)}
                        className="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                    
                    <h3 className={`text-title-lg font-bold text-on-surface truncate ${task.status === "submitted" ? "line-through opacity-50" : ""}`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-body-md text-on-surface-variant mt-1.5 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-md flex items-center gap-md text-label-md text-on-surface-variant font-medium">
                      <div className={`flex items-center gap-xs ${isOverdue ? "text-error font-bold" : ""}`}>
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>
                          {isOverdue ? "Overdue: " : "Due: "}
                          {new Date(task.due_date).toLocaleString(undefined, { 
                            month: "short", 
                            day: "numeric", 
                            hour: "numeric", 
                            minute: "2-digit" 
                          })}
                        </span>
                      </div>
                      {task.reminder_at && (
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                          <span>Reminder set</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Progress & Quick widgets */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            <h4 className="text-title-md font-bold text-on-surface mb-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[20px]" data-icon="monitoring">monitoring</span>
              Weekly Progress
            </h4>
            <div className="mb-2 flex justify-between text-label-md text-on-surface-variant">
              <span>Tasks Completed</span>
              <span className="font-semibold text-on-surface">{submittedCount} / {totalCount}</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2.5 mb-4">
              <div 
                className="bg-secondary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-body-md text-on-surface-variant">
              {progressPercent === 100 
                ? "Perfect! You have completed all your tasks." 
                : `You are ${progressPercent}% done with your assignments. Keep pushing!`}
            </p>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            <h4 className="text-title-md font-bold text-on-surface mb-md">Priority Matrix</h4>
            <div className="space-y-sm text-body-md">
              <div className="flex justify-between items-center p-2 rounded bg-error-container/20">
                <span className="font-semibold text-error">High Priority</span>
                <span className="font-bold">{assignments.filter(a => a.priority === "high" && a.status === "pending").length} pending</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-primary-container/10">
                <span className="font-semibold text-primary">Medium Priority</span>
                <span className="font-bold">{assignments.filter(a => a.priority === "medium" && a.status === "pending").length} pending</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-surface-container">
                <span className="font-semibold text-on-surface-variant">Low Priority</span>
                <span className="font-bold">{assignments.filter(a => a.priority === "low" && a.status === "pending").length} pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Assignment Dialog Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg border border-outline-variant/30 shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h3 className="text-title-lg font-bold text-on-surface">Add New Assignment</h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAssignment} className="flex flex-col gap-md">
              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Assignment Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Algorithms Term Project"
                  required
                  className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Link to Course</label>
                <select 
                  value={newCourse} 
                  onChange={(e) => setNewCourse(e.target.value)}
                  className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                >
                  <option value="">None / General</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-title-md font-medium text-on-surface mb-1.5">Due Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-title-md font-medium text-on-surface mb-1.5">Set Reminder</label>
                  <input 
                    type="datetime-local" 
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Priority</label>
                <select 
                  value={newPriority} 
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Task Description</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Notes, references, requirements..."
                  className="w-full h-20 px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none resize-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/95 text-on-primary py-2.5 rounded-lg font-medium text-body-md shadow cursor-pointer mt-md"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

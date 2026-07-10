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
  instructor: string;
  classroom: string;
}

interface TimetableSlot {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  courses: Course;
}

export default function TimetablePage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDay, setSelectedDay] = useState(1); // 1 = Monday
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [dialogError, setDialogError] = useState("");

  // Course Dialog State (in case they need to make a course)
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseColor, setNewCourseColor] = useState("#4648d4");
  const [newCourseInstructor, setNewCourseInstructor] = useState("");
  const [newCourseClassroom, setNewCourseClassroom] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];

  const loadTimetableData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Fetch Courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id);
      setCourses(coursesData || []);

      // Fetch Timetable Slots
      const { data: slotsData } = await supabase
        .from("timetable")
        .select("id, course_id, day_of_week, start_time, end_time, courses(*)")
        .eq("user_id", user.id);
      setSlots(slotsData as any[] || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetableData();
  }, [user?.id]);

  // Check Overlaps
  const checkOverlap = (day: number, start: string, end: string): boolean => {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);

    return slots.some(slot => {
      if (slot.day_of_week !== day) return false;
      const sMin = timeToMinutes(slot.start_time);
      const eMin = timeToMinutes(slot.end_time);
      return startMin < eMin && endMin > sMin;
    });
  };

  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError("");

    if (!selectedCourse) {
      setDialogError("Please select a course.");
      return;
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setDialogError("Start time must be before end time.");
      return;
    }

    // Run conflict detection
    const isConflict = checkOverlap(Number(selectedDay), startTime, endTime);
    if (isConflict) {
      setDialogError("Conflict detected! This slot overlaps with an existing class schedule.");
      return;
    }

    try {
      const { error } = await supabase.from("timetable").insert({
        user_id: user?.id,
        course_id: selectedCourse,
        day_of_week: Number(selectedDay),
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });

      if (error) {
        setDialogError(error.message);
      } else {
        setIsDialogOpen(false);
        loadTimetableData();
      }
    } catch (err) {
      setDialogError("Failed to add slot.");
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode || !newCourseName) return;

    try {
      const { data, error } = await supabase.from("courses").insert({
        user_id: user?.id,
        code: newCourseCode,
        name: newCourseName,
        color: newCourseColor,
        instructor: newCourseInstructor,
        classroom: newCourseClassroom
      }).select().single();

      if (!error && data) {
        setCourses(prev => [...prev, data]);
        setSelectedCourse(data.id);
        setIsCourseDialogOpen(false);
        // Reset inputs
        setNewCourseCode("");
        setNewCourseName("");
        setNewCourseColor("#4648d4");
        setNewCourseInstructor("");
        setNewCourseClassroom("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to remove this timetable slot?")) return;
    const { error } = await supabase.from("timetable").delete().eq("id", slotId);
    if (!error) {
      loadTimetableData();
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Timetable</h1>
          <p className="text-body-lg text-on-surface-variant">Review and coordinate your weekly class schedules.</p>
        </div>
        <div className="flex items-center gap-xs">
          <button 
            onClick={() => setIsCourseDialogOpen(true)}
            className="flex items-center gap-xs px-sm py-2 bg-surface border border-outline-variant/40 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container shadow-sm cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            New Course
          </button>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-xs px-md py-2 bg-primary text-on-primary rounded-lg text-body-md font-medium hover:bg-primary/95 shadow-sm cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface-container-lowest animate-pulse h-96 rounded-xl"></div>
      ) : (
        <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl border border-outline-variant/20 shadow-sm overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px] grid grid-cols-6 border-b border-outline-variant/30">
            {/* Hour Header spacer */}
            <div className="p-md text-right border-r border-outline-variant/30 font-semibold text-label-md text-on-surface-variant uppercase">
              Time
            </div>
            {/* Days headers */}
            {days.map((day, i) => (
              <div key={day} className="p-md text-center font-bold text-title-md text-on-surface border-r border-outline-variant/30 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="min-w-[800px] flex flex-col">
            {hours.map((hour, rowIdx) => {
              const hourNumber = 9 + rowIdx; // 9, 10, 11...
              
              return (
                <div key={hour} className="grid grid-cols-6 border-b border-outline-variant/10 last:border-b-0 min-h-[90px]">
                  {/* Time label */}
                  <div className="p-sm text-right border-r border-outline-variant/30 text-label-md text-on-surface-variant pt-2">
                    {hour}
                  </div>
                  
                  {/* Day cells (1 to 5) */}
                  {[1, 2, 3, 4, 5].map((dayCode) => {
                    // Filter slots matching this hour and day
                    const matchingSlots = slots.filter((slot) => {
                      if (slot.day_of_week !== dayCode) return false;
                      const startH = Number(slot.start_time.split(":")[0]);
                      return startH === hourNumber;
                    });

                    return (
                      <div key={dayCode} className="p-1 border-r border-outline-variant/15 last:border-r-0 relative flex flex-col gap-1 bg-background/5">
                        {matchingSlots.map((slot) => (
                          <div 
                            key={slot.id} 
                            className="p-2 rounded-lg border shadow-sm group cursor-pointer hover:shadow transition-shadow flex flex-col h-full text-left"
                            style={{ 
                              backgroundColor: `${slot.courses?.color || "#4648d4"}15`,
                              borderColor: `${slot.courses?.color || "#4648d4"}40`
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span 
                                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: slot.courses?.color || "#4648d4",
                                  color: "#ffffff"
                                }}
                              >
                                {slot.courses?.code}
                              </span>
                              <button 
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error/80 cursor-pointer p-0.5 rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                            <h4 className="font-semibold text-body-md text-on-surface leading-snug mt-1 truncate">
                              {slot.courses?.name}
                            </h4>
                            <p className="text-[10px] text-on-surface-variant flex items-center gap-0.5 mt-auto truncate">
                              <span className="material-symbols-outlined text-[12px]">location_on</span>
                              {slot.courses?.classroom || "N/A"}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Timetable Schedule Slot Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg border border-outline-variant/30 shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h3 className="text-title-lg font-bold text-on-surface">Add Timetable Slot</h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {dialogError && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{dialogError}</span>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="flex flex-col gap-md">
              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Select Course</label>
                {courses.length === 0 ? (
                  <div className="text-label-md text-on-surface-variant">
                    No courses available.{" "}
                    <button 
                      type="button" 
                      onClick={() => setIsCourseDialogOpen(true)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Create one first
                    </button>
                  </div>
                ) : (
                  <select 
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Day of Week</label>
                <select 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-title-md font-medium text-on-surface mb-1.5">Start Time</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-title-md font-medium text-on-surface mb-1.5">End Time</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/95 text-on-primary py-2.5 rounded-lg font-medium text-body-md shadow cursor-pointer mt-md"
              >
                Add Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Course Dialog */}
      {isCourseDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg border border-outline-variant/30 shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h3 className="text-title-lg font-bold text-on-surface">Create New Course</h3>
              <button onClick={() => setIsCourseDialogOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="flex flex-col gap-md">
              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Course Code</label>
                <input 
                  type="text" 
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="CS401"
                  required
                  className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Course Name</label>
                <input 
                  type="text" 
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Advanced Algorithms"
                  required
                  className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-title-md font-medium text-on-surface mb-1.5">Instructor</label>
                  <input 
                    type="text" 
                    value={newCourseInstructor}
                    onChange={(e) => setNewCourseInstructor(e.target.value)}
                    placeholder="Dr. Carter"
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-title-md font-medium text-on-surface mb-1.5">Classroom</label>
                  <input 
                    type="text" 
                    value={newCourseClassroom}
                    onChange={(e) => setNewCourseClassroom(e.target.value)}
                    placeholder="Rm 302"
                    className="w-full px-sm py-2 bg-surface-container border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-title-md font-medium text-on-surface mb-1.5">Accent Color</label>
                <div className="flex gap-sm items-center">
                  <input 
                    type="color" 
                    value={newCourseColor}
                    onChange={(e) => setNewCourseColor(e.target.value)}
                    className="w-10 h-10 border border-outline-variant rounded cursor-pointer bg-transparent"
                  />
                  <span className="text-body-md text-on-surface-variant font-mono">{newCourseColor}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/95 text-on-primary py-2.5 rounded-lg font-medium text-body-md shadow cursor-pointer mt-md"
              >
                Create Course
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

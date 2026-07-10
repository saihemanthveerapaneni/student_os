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
}

interface AttendanceRecord {
  id: string;
  course_id: string;
  date: string;
  status: "present" | "absent";
  courses: Course;
}

interface CourseStats extends Course {
  present: number;
  total: number;
  percentage: number;
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<CourseStats[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttendanceData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      // 1. Fetch Courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id);
      const coursesList = coursesData || [];

      // 2. Fetch Attendance Records
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*, courses(*)")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      const recordsList: AttendanceRecord[] = attendanceData as any[] || [];
      setHistory(recordsList);

      // 3. Compute stats per course
      const calculatedStats: CourseStats[] = coursesList.map((course: any) => {
        const courseRecords = recordsList.filter((r) => r.course_id === course.id);
        const total = courseRecords.length;
        const present = courseRecords.filter((r) => r.status === "present").length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

        return {
          ...course,
          present,
          total,
          percentage
        };
      });

      setStats(calculatedStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [user?.id]);

  // Log new attendance record
  const handleLogAttendance = async (courseId: string, status: "present" | "absent") => {
    if (!user?.id) return;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    try {
      // Check if record already exists for today & course
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("attendance")
          .update({ status })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase.from("attendance").insert({
          user_id: user.id,
          course_id: courseId,
          date: today,
          status
        });
      }
      loadAttendanceData();
    } catch (e) {
      console.error(e);
    }
  };

  // Remove log
  const handleRemoveLog = async (id: string) => {
    if (!confirm("Are you sure you want to remove this log?")) return;
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (!error) {
      loadAttendanceData();
    }
  };

  // Overall attendance calculations
  const totalClasses = stats.reduce((acc, curr) => acc + curr.total, 0);
  const totalPresent = stats.reduce((acc, curr) => acc + curr.present, 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;

  return (
    <AppLayout>
      <div className="mb-lg">
        <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Attendance Analytics</h1>
        <p className="text-body-lg text-on-surface-variant font-medium">Keep track of your course presence and maintain minimum criteria.</p>
      </div>

      {loading ? (
        <div className="bg-surface-container animate-pulse h-96 rounded-xl"></div>
      ) : (
        <div className="space-y-lg">
          {/* Summary Bento Header Card */}
          <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg flex flex-col md:flex-row items-center justify-between gap-lg shadow-sm">
            <div className="flex items-center gap-md">
              <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
              </div>
              <div>
                <h2 className="text-headline-md font-bold text-on-background">{overallPercentage}%</h2>
                <p className="text-body-md text-on-surface-variant font-medium">Overall Academic Presence</p>
              </div>
            </div>
            
            <div className="flex flex-col w-full md:w-64 gap-xs">
              <div className="flex justify-between text-label-md text-on-surface-variant">
                <span>Present Lectures</span>
                <span className="font-semibold text-on-surface">{totalPresent} / {totalClasses}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-3">
                <div 
                  className="bg-secondary h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${overallPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Subject-Wise Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {stats.map((course) => {
              const isLow = course.percentage < 75 && course.total > 0;
              return (
                <div 
                  key={course.id}
                  className={`bg-surface-container-lowest dark:bg-surface-container-low border rounded-xl p-md shadow-sm flex flex-col gap-md transition-all ${
                    isLow ? "border-error/40 bg-error/5" : "border-outline-variant/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${course.color}15`, color: course.color }}
                      >
                        {course.code}
                      </span>
                      <h3 className="text-title-lg font-bold text-on-surface mt-1 truncate">{course.name}</h3>
                      <p className="text-body-md text-on-surface-variant mt-0.5">Instructor: {course.instructor || "Professor"}</p>
                    </div>

                    <div className="text-right">
                      <div className={`text-headline-md font-bold ${isLow ? "text-error" : "text-on-surface"}`}>
                        {course.percentage}%
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-semibold">
                        {course.present} of {course.total} classes
                      </span>
                    </div>
                  </div>

                  {/* Warning label for low attendance */}
                  {isLow && (
                    <div className="p-2.5 bg-error-container text-on-error-container rounded-lg text-[11px] flex items-center gap-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                      <span>Warning: Attendance below 75% minimum criteria. Attend next lectures to recover.</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${isLow ? "bg-error" : "bg-primary"}`} 
                      style={{ 
                        width: `${course.percentage}%`,
                        backgroundColor: isLow ? undefined : course.color 
                      }}
                    ></div>
                  </div>

                  {/* Mark attendance for today */}
                  <div className="flex items-center justify-between border-t border-outline-variant/10 pt-sm mt-auto">
                    <span className="text-label-md text-on-surface-variant font-medium">Log Today's Class:</span>
                    <div className="flex gap-xs">
                      <button 
                        onClick={() => handleLogAttendance(course.id, "present")}
                        className="px-sm py-1.5 bg-secondary-container/20 hover:bg-secondary-container/30 text-secondary border border-secondary/20 rounded-lg text-label-md font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Present
                      </button>
                      <button 
                        onClick={() => handleLogAttendance(course.id, "absent")}
                        className="px-sm py-1.5 bg-error-container/20 hover:bg-error-container/30 text-error border border-error/20 rounded-lg text-label-md font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attendance History log */}
          <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            <h3 className="text-title-lg font-bold text-on-surface mb-md">Attendance History Feed</h3>
            
            {history.length === 0 ? (
              <p className="text-body-md text-on-surface-variant text-center py-6">No attendance records logged yet.</p>
            ) : (
              <div className="divide-y divide-outline-variant/10 max-h-80 overflow-y-auto custom-scrollbar pr-xs">
                {history.map((record) => {
                  const isPresent = record.status === "present";
                  return (
                    <div key={record.id} className="py-sm flex justify-between items-center group">
                      <div>
                        <div className="flex items-center gap-xs">
                          <span className="text-body-md font-bold text-on-surface">{record.courses?.name}</span>
                          <span 
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold"
                            style={{ backgroundColor: `${record.courses?.color}15`, color: record.courses?.color }}
                          >
                            {record.courses?.code}
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(record.date).toLocaleDateString(undefined, { 
                            weekday: "short", 
                            month: "short", 
                            day: "numeric" 
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-md">
                        <span className={`px-2.5 py-1 rounded-full text-label-md font-bold ${
                          isPresent 
                            ? "bg-secondary-container/20 text-secondary" 
                            : "bg-error-container/20 text-error"
                        }`}>
                          {isPresent ? "Present" : "Absent"}
                        </span>
                        <button 
                          onClick={() => handleRemoveLog(record.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-error cursor-pointer p-0.5 rounded"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

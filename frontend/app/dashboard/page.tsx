"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  start_time: string;
  end_time: string;
  day_of_week: number;
  courses: Course;
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "submitted" | "overdue";
  courses: Course;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [classesCount, setClassesCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [attendancePercent, setAttendancePercent] = useState(88); // fallback
  const [todaySchedule, setTodaySchedule] = useState<TimetableSlot[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Assignment[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const todayDay = new Date().getDay(); // 0 = Sunday, 1 = Monday...

        // 1. Fetch Classes Today
        const { data: timetableData } = await supabase
          .from("timetable")
          .select("id, start_time, end_time, day_of_week, courses(*)")
          .eq("user_id", user.id)
          .eq("day_of_week", todayDay)
          .order("start_time");

        if (timetableData) {
          setClassesCount(timetableData.length);
          setTodaySchedule(timetableData as any[]);
        }

        // 2. Fetch Pending Assignments
        const { count: assignmentCount } = await supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending");
        setPendingCount(assignmentCount || 0);

        // 3. Fetch Upcoming Deadlines (Limit 3)
        const { data: deadlinesData } = await supabase
          .from("assignments")
          .select("id, title, due_date, priority, status, courses(*)")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("due_date")
          .limit(3);
        if (deadlinesData) {
          setUpcomingDeadlines(deadlinesData as any[]);
        }

        // 4. Fetch Attendance Percentage
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("status")
          .eq("user_id", user.id);
        
        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter((a: any) => a.status === "present").length;
          const percentage = Math.round((presentCount / attendanceData.length) * 100);
          setAttendancePercent(percentage);
        }

        // 5. Fetch recommendations from FastAPI backend analytics summary
        try {
          const response = await fetch(`http://localhost:8000/api/analytics/summary?user_id=${user.id}`);
          if (response.ok) {
            const result = await response.json();
            setRecommendations(result.recommendations || []);
            if (result.overall_percentage) {
              setAttendancePercent(result.overall_percentage);
            }
          }
        } catch (e) {
          console.warn("FastAPI analytics backend not reachable, using calculated values.", e);
        }

      } catch (err) {
        console.error("Error gathering dashboard datasets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const defaultRecommendations = [
    "Attend next session of CS401 to keep attendance above 75%.",
    "Complete urgent project: 'Algorithms Midterm Project' due today.",
    "Schedule a study plan to catch up on missed lecture notes."
  ];

  return (
    <AppLayout>
      {/* Welcome Header */}
      <div className="mb-lg">
        <h2 className="text-headline-lg font-bold text-on-background mb-xs tracking-tight">
          Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "Alex"}!
        </h2>
        <p className="text-body-lg text-on-surface-variant">Here is what's happening with your studies today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl animate-pulse">
          <div className="h-28 bg-surface-container rounded-xl"></div>
          <div className="h-28 bg-surface-container rounded-xl"></div>
          <div className="h-28 bg-surface-container rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* Summary Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
            {/* Today's Classes */}
            <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-md border border-outline-variant/15 ambient-shadow hover:-translate-y-1 transition-transform duration-200">
              <div className="flex justify-between items-start mb-sm">
                <div className="p-xs bg-primary-container/10 text-primary rounded-lg">
                  <span className="material-symbols-outlined text-[20px]" data-icon="class">class</span>
                </div>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1">Today's Classes</p>
              <h3 className="text-headline-md font-bold text-on-background">{classesCount}</h3>
            </div>

            {/* Pending Assignments */}
            <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-md border border-outline-variant/15 ambient-shadow hover:-translate-y-1 transition-transform duration-200">
              <div className="flex justify-between items-start mb-sm">
                <div className="p-xs bg-tertiary-container/10 text-tertiary rounded-lg">
                  <span className="material-symbols-outlined text-[20px]" data-icon="assignment_late">assignment_late</span>
                </div>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1">Pending Assignments</p>
              <h3 className="text-headline-md font-bold text-on-background">{pendingCount}</h3>
            </div>

            {/* Attendance percentage progress */}
            <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-md border border-outline-variant/15 ambient-shadow hover:-translate-y-1 transition-transform duration-200">
              <div className="flex justify-between items-start mb-sm">
                <div className="p-xs bg-secondary-container/20 text-secondary rounded-lg">
                  <span className="material-symbols-outlined text-[20px]" data-icon="done_all">done_all</span>
                </div>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1">Overall Attendance</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-headline-md font-bold text-on-background">{attendancePercent}%</h3>
                <span className="text-[10px] text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full font-semibold">
                  Good Standings
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-3">
                <div 
                  className="bg-secondary h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${attendancePercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Double Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Left Column: Schedule (Span 2) */}
            <div className="lg:col-span-2 flex flex-col gap-lg">
              <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-lg border border-outline-variant/15 ambient-shadow">
                <div className="flex justify-between items-center mb-md">
                  <h3 className="text-title-lg font-bold text-on-background">Today's Schedule</h3>
                  <Link href="/timetable" className="text-primary hover:text-primary-container font-semibold text-label-md hover:underline">
                    View Full Timetable
                  </Link>
                </div>
                
                {todaySchedule.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] text-outline/50 mb-2">event_busy</span>
                    <p className="text-body-md">No classes scheduled for today.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-surface-container-high/60 flex flex-col gap-md">
                    {todaySchedule.map((slot) => {
                      const start = slot.start_time.slice(0, 5);
                      const end = slot.end_time.slice(0, 5);
                      return (
                        <div key={slot.id} className="relative">
                          <div 
                            className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest dark:border-surface-container-low"
                            style={{ backgroundColor: slot.courses?.color || "#6366f1" }}
                          ></div>
                          <div className="bg-surface dark:bg-surface-container-lowest p-md rounded-lg border border-outline-variant/20 flex justify-between items-center group hover:bg-surface-container-high/30 transition-colors">
                            <div>
                              <p className="text-[11px] font-semibold mb-1" style={{ color: slot.courses?.color }}>
                                {start} - {end}
                              </p>
                              <h4 className="text-title-md font-bold text-on-background">{slot.courses?.name}</h4>
                              <p className="text-body-md text-on-surface-variant flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                {slot.courses?.classroom || "No classroom"}
                              </p>
                            </div>
                            <span 
                              className="text-[10px] font-bold px-2.5 py-1 rounded-md"
                              style={{ 
                                backgroundColor: `${slot.courses?.color}15`, 
                                color: slot.courses?.color 
                              }}
                            >
                              {slot.courses?.code}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Study recommendations widget */}
              <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-lg border border-outline-variant/15 ambient-shadow">
                <h3 className="text-title-lg font-bold text-on-background mb-sm">AI Study Recommendations</h3>
                <p className="text-body-md text-on-surface-variant mb-md">Smart observations to optimize your study workflow:</p>
                <ul className="space-y-sm">
                  {(recommendations.length > 0 ? recommendations : defaultRecommendations).map((rec, i) => (
                    <li key={i} className="flex gap-sm items-start text-body-md text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 icon-fill">lightbulb</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Deadlines (Span 1) */}
            <div className="flex flex-col gap-lg">
              <div className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl p-lg border border-outline-variant/15 ambient-shadow h-full">
                <div className="flex justify-between items-center mb-md">
                  <h3 className="text-title-lg font-bold text-on-background">Upcoming Deadlines</h3>
                  <Link href="/assignments" className="text-primary hover:text-primary-container text-label-md font-semibold hover:underline">
                    View Tasks
                  </Link>
                </div>
                
                {upcomingDeadlines.length === 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[36px] text-outline/40 mb-2">check_circle</span>
                    <p className="text-body-md">All caught up! No pending assignments.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-sm">
                    {upcomingDeadlines.map((task) => {
                      const isHigh = task.priority === "high";
                      const isMed = task.priority === "medium";
                      return (
                        <div 
                          key={task.id} 
                          className="p-sm rounded-lg border border-outline-variant/20 hover:bg-surface-container-high/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isHigh 
                                ? "bg-error-container text-on-error-container" 
                                : isMed 
                                ? "bg-tertiary-container/30 text-tertiary" 
                                : "bg-surface-variant text-on-surface-variant"
                            }`}>
                              {task.priority} Priority
                            </span>
                            <span className="text-label-md text-on-surface-variant">
                              {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <h4 className="text-title-md font-bold text-on-background mb-1">{task.title}</h4>
                          <p className="text-body-md text-on-surface-variant line-clamp-2">
                            {task.courses?.name ? `${task.courses.code}: ` : ""}{task.courses?.classroom ? `In-class submission.` : "Submit online."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import useAuthStore from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { profile } = useAuthStore();
  const [coursesCount, setCoursesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);

  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBDUnxqYI3mKMD8wcVTo1SFRSWwtDgr8B_h-PVq7WjIk9g6Zb1Ge5FXp5n2B8qShm0Z9JSRiX8VdX7qHg2rZMdXUAyXhci_4kp7kIaCuK_Bb9f0dr-7fk00WSe8zPeZAArKYLx0dagtzIJ-AAz_ib1Piq6-w0G8k8bMXePsj6y5USqVmkGgifYh40vz8nBgldLUaVLNTiMgmoFBQvux7u-kmcPAlF214gH0yyL0lI_gzdgmb0W-uN2qCA";

  useEffect(() => {
    if (!profile?.id) return;

    const fetchCounts = async () => {
      // 1. Courses count
      const { count: cCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);
      setCoursesCount(cCount || 0);

      // 2. Notes count
      const { count: nCount } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);
      setNotesCount(nCount || 0);

      // 3. Assignments count
      const { count: aCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);
      setAssignmentsCount(aCount || 0);
    };

    fetchCounts();
  }, [profile?.id]);

  return (
    <AppLayout>
      <div className="mb-lg">
        <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Student Profile</h1>
        <p className="text-body-lg text-on-surface-variant font-medium">Review your university academic standing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* User Card */}
        <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm flex flex-col items-center text-center">
          <img 
            alt="Profile Avatar" 
            src={profile?.avatar_url || defaultAvatar} 
            className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md mb-md"
          />
          <h2 className="text-headline-md font-bold text-on-surface leading-tight">
            {profile?.full_name || "Alex Student"}
          </h2>
          <p className="text-body-md text-on-surface-variant mb-md font-medium">
            {profile?.email || "alex@university.edu"}
          </p>
          
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-label-md font-bold uppercase tracking-wider">
            Active Student
          </span>
        </div>

        {/* Academic Standings stats */}
        <div className="lg:col-span-2 space-y-lg">
          <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            <h3 className="text-title-lg font-bold text-on-surface mb-md">Academic Standings</h3>
            
            <div className="grid grid-cols-3 gap-md">
              <div className="bg-surface p-md rounded-xl border border-outline-variant/15 text-center">
                <span className="block text-headline-md font-bold text-primary">{coursesCount}</span>
                <span className="block text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider mt-1">
                  Enrolled Courses
                </span>
              </div>
              <div className="bg-surface p-md rounded-xl border border-outline-variant/15 text-center">
                <span className="block text-headline-md font-bold text-secondary">{notesCount}</span>
                <span className="block text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider mt-1">
                  Created Notes
                </span>
              </div>
              <div className="bg-surface p-md rounded-xl border border-outline-variant/15 text-center">
                <span className="block text-headline-md font-bold text-tertiary">{assignmentsCount}</span>
                <span className="block text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider mt-1">
                  Total Tasks
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            <h3 className="text-title-lg font-bold text-on-surface mb-sm">University Details</h3>
            <div className="divide-y divide-outline-variant/10 text-body-md">
              <div className="py-sm flex justify-between">
                <span className="text-on-surface-variant">Academic Calendar Year</span>
                <span className="font-semibold text-on-surface">2026 / 2027</span>
              </div>
              <div className="py-sm flex justify-between">
                <span className="text-on-surface-variant">Major Specialty</span>
                <span className="font-semibold text-on-surface">Computer Science</span>
              </div>
              <div className="py-sm flex justify-between">
                <span className="text-on-surface-variant">Current Semester</span>
                <span className="font-semibold text-on-surface">Fall Semester</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

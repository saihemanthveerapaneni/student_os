"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useUIStore from "@/store/useUIStore";
import useAuthStore from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { theme, toggleTheme, isSidebarCollapsed } = useUIStore();
  const { profile } = useAuthStore();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBDUnxqYI3mKMD8wcVTo1SFRSWwtDgr8B_h-PVq7WjIk9g6Zb1Ge5FXp5n2B8qShm0Z9JSRiX8VdX7qHg2rZMdXUAyXhci_4kp7kIaCuK_Bb9f0dr-7fk00WSe8zPeZAArKYLx0dagtzIJ-AAz_ib1Piq6-w0G8k8bMXePsj6y5USqVmkGgifYh40vz8nBgldLUaVLNTiMgmoFBQvux7u-kmcPAlF214gH0yyL0lI_gzdgmb0W-uN2qCA";

  useEffect(() => {
    if (!profile?.id) return;

    // Load initial unread notification count
    const loadUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);
      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    };
    loadUnreadCount();

    // Subscribe to Realtime notifications channel for instant counts
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return (
    <header 
      className={`fixed top-0 right-0 z-30 h-16 px-xl backdrop-blur-md bg-surface/80 dark:bg-surface-dim/80 shadow-sm flex justify-between items-center transition-all duration-300 border-b border-surface-container-high/40 w-full ${
        isSidebarCollapsed ? "md:w-[calc(100%-72px)] md:ml-[72px]" : "md:w-[calc(100%-260px)] md:ml-[260px]"
      }`}
    >
      {/* Search Input Bar (Matches Left align from Stitch) */}
      <div className="flex items-center bg-surface-container dark:bg-surface-container-low rounded-full px-sm py-1.5 w-64 md:w-80 border border-outline-variant/20 focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50 transition-all shadow-sm">
        <span className="material-symbols-outlined text-outline text-[20px]" data-icon="search">search</span>
        <input 
          className="bg-transparent border-none outline-none text-body-md font-body-md ml-xs w-full text-on-surface focus:ring-0 placeholder-on-surface-variant/50" 
          placeholder="Search anything..." 
          type="text" 
        />
      </div>

      {/* Trailing navbar actions */}
      <div className="flex items-center gap-md">
        {/* Theme switcher */}
        <button 
          onClick={toggleTheme}
          className="text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer" 
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <span className="material-symbols-outlined text-[20px]">dark_mode</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">light_mode</span>
          )}
        </button>

        {/* Notifications */}
        <Link href="/dashboard?notifications=true" className="relative text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high p-2 rounded-full transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
          )}
        </Link>

        {/* User image profile */}
        <Link href="/profile" className="flex items-center">
          <img 
            alt="User Profile" 
            className="w-8 h-8 rounded-full object-cover border border-outline-variant/60 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
            src={profile?.avatar_url || defaultAvatar}
          />
        </Link>
      </div>
    </header>
  );
}

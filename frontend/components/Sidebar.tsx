"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useUIStore from "@/store/useUIStore";
import useAuthStore from "@/store/useAuthStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUIStore();
  const { profile } = useAuthStore();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Timetable", href: "/timetable", icon: "calendar_month" },
    { name: "Notes", href: "/notes", icon: "description" },
    { name: "Assignments", href: "/assignments", icon: "assignment" },
    { name: "Attendance", href: "/attendance", icon: "fact_check" },
    { name: "AI Assistant", href: "/ai", icon: "smart_toy" },
  ];

  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBDUnxqYI3mKMD8wcVTo1SFRSWwtDgr8B_h-PVq7WjIk9g6Zb1Ge5FXp5n2B8qShm0Z9JSRiX8VdX7qHg2rZMdXUAyXhci_4kp7kIaCuK_Bb9f0dr-7fk00WSe8zPeZAArKYLx0dagtzIJ-AAz_ib1Piq6-w0G8k8bMXePsj6y5USqVmkGgifYh40vz8nBgldLUaVLNTiMgmoFBQvux7u-kmcPAlF214gH0yyL0lI_gzdgmb0W-uN2qCA";

  return (
    <nav 
      className={`hidden md:flex flex-col h-screen py-lg px-md bg-surface dark:bg-surface-container-low border-r border-outline-variant/30 fixed left-0 top-0 transition-all duration-300 z-40 ${
        isSidebarCollapsed ? "w-sidebar-collapsed" : "w-sidebar-width"
      }`}
    >
      {/* Brand logo */}
      <div className="flex items-center gap-xs mb-xl px-xs">
        <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-[20px] icon-fill">school</span>
        </div>
        {!isSidebarCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-title-lg font-bold text-primary dark:text-primary-container leading-none">StudentOS</h1>
            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Academic Hub</p>
          </div>
        )}
      </div>

      {/* Quick Add CTA */}
      <Link href="/assignments?add=true" className="w-full">
        <button className="w-full bg-primary hover:bg-primary/95 text-on-primary rounded-lg py-2.5 font-medium transition-colors flex justify-center items-center gap-2 shadow-sm text-body-md">
          <span className="material-symbols-outlined text-[18px]">add</span>
          {!isSidebarCollapsed && "Add Task"}
        </button>
      </Link>

      {/* Navigation List */}
      <ul className="flex flex-col gap-base flex-grow mt-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-sm px-sm py-2.5 rounded-lg text-body-md transition-all duration-200 ${
                  isActive
                    ? "text-primary font-bold border-l-4 border-primary bg-primary-container/10 dark:bg-primary-container/20 dark:text-primary-container scale-[0.98]"
                    : "text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "icon-fill" : ""}`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            </li>
          );
        })}
        
        {/* Settings at the bottom of navigation */}
        <li className="mt-md border-t border-outline-variant/20 pt-md">
          <Link
            href="/settings"
            className={`flex items-center gap-sm px-sm py-2.5 rounded-lg text-body-md transition-all duration-200 ${
              pathname === "/settings"
                ? "text-primary font-bold border-l-4 border-primary bg-primary-container/10 dark:bg-primary-container/20 dark:text-primary-container scale-[0.98]"
                : "text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${pathname === "/settings" ? "icon-fill" : ""}`}>
              settings
            </span>
            {!isSidebarCollapsed && <span>Settings</span>}
          </Link>
        </li>
      </ul>

      {/* Profile Footer */}
      <div className="mt-auto border-t border-outline-variant/20 pt-md">
        <Link
          href="/profile"
          className={`flex items-center gap-sm px-sm py-2.5 rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container-high transition-colors ${
            pathname === "/profile" ? "text-primary font-bold bg-primary-container/10" : ""
          }`}
        >
          <img 
            alt="Profile Picture" 
            className="w-8 h-8 rounded-full object-cover border border-outline-variant"
            src={profile?.avatar_url || defaultAvatar}
          />
          {!isSidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-on-surface font-semibold truncate leading-tight">
                {profile?.full_name || "Alex Student"}
              </span>
              <span className="text-[10px] text-on-surface-variant truncate">
                {profile?.email || "alex@university.edu"}
              </span>
            </div>
          )}
        </Link>
      </div>
    </nav>
  );
}

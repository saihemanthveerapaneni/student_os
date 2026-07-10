"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import useUIStore from "@/store/useUIStore";
import useAuthStore from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSidebarCollapsed } = useUIStore();
  const { user, setUser, fetchProfile, loading } = useAuthStore();

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        router.push("/login");
      }
    };
    checkSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, fetchProfile, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-xs">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <span className="text-body-md font-medium text-on-surface-variant">Loading StudentOS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to login
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex font-body-md">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content viewport */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar-width"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-md md:p-lg lg:p-xl mt-16 max-w-max-content-width mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

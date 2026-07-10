"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      setIsLoggedIn(!!session);
      setSessionChecked(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background relative overflow-hidden flex flex-col justify-between">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 10% 20%, var(--primary) 0%, transparent 60%)" }}></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 90% 80%, var(--secondary) 0%, transparent 60%)" }}></div>

      {/* Header / Nav */}
      <header className="max-w-max-content-width mx-auto w-full h-20 px-xl flex justify-between items-center z-10">
        <div className="flex items-center gap-xs">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px] icon-fill">school</span>
          </div>
          <div>
            <span className="font-headline-md text-headline-md tracking-tight text-primary dark:text-primary-container leading-none">StudentOS</span>
            <span className="block text-[10px] text-on-surface-variant font-medium mt-0.5">Academic Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          {sessionChecked && (
            isLoggedIn ? (
              <Link href="/dashboard">
                <button className="bg-primary hover:bg-primary/95 text-on-primary px-sm py-2 rounded-xl text-body-md font-semibold transition-all shadow-sm">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-on-surface-variant hover:text-on-surface font-semibold text-body-md transition-colors">
                  Log In
                </Link>
                <Link href="/register">
                  <button className="bg-primary hover:bg-primary/95 text-on-primary px-sm py-2 rounded-xl text-body-md font-semibold transition-all shadow-sm">
                    Get Started
                  </button>
                </Link>
              </>
            )
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center z-10 flex flex-col items-center flex-grow justify-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-label-md font-semibold mb-6">
          <span className="material-symbols-outlined text-[16px] icon-fill">star</span>
          Experience Cognitive Calm
        </div>
        
        <h1 className="text-[40px] md:text-[56px] font-bold tracking-tight text-on-surface leading-tight max-w-3xl mb-6">
          The unified operating system for <span className="text-primary dark:text-primary-container">college students</span>.
        </h1>
        
        <p className="text-body-lg md:text-[18px] text-on-surface-variant max-w-2xl leading-relaxed mb-10">
          Manage your timetable, write rich markdown lecture notes, track upcoming assignments, monitor attendance, and receive instant study guidance from an integrated AI Assistant.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href={isLoggedIn ? "/dashboard" : "/register"}>
            <button className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-on-primary px-xl py-3.5 rounded-xl text-title-md font-semibold transition-all shadow-md hover:shadow-lg transform active:scale-98 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">rocket_launch</span>
              {isLoggedIn ? "Go to Dashboard" : "Create Free Account"}
            </button>
          </Link>
          <Link href="/login">
            <button className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low text-on-surface px-xl py-3.5 rounded-xl text-title-md font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">login</span>
              Log In to StudentOS
            </button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-left w-full max-w-5xl mt-8">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-lg ambient-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center mb-md">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
            <h3 className="text-title-lg font-bold text-on-surface mb-2">Smart Timetable</h3>
            <p className="text-body-md text-on-surface-variant">Weekly view schedules with conflict detection overlays and color coordinates.</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-lg ambient-shadow">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center mb-md">
              <span className="material-symbols-outlined text-[22px]">description</span>
            </div>
            <h3 className="text-title-lg font-bold text-on-surface mb-2">Rich Markdown Notes</h3>
            <p className="text-body-md text-on-surface-variant">Write lecture notes in Markdown format, pin favorites, and attach lecture PDFs.</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-lg ambient-shadow">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center mb-md">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <h3 className="text-title-lg font-bold text-on-surface mb-2">Groq AI Assistant</h3>
            <p className="text-body-md text-on-surface-variant">Summarize lecture notes, generate customized exam quizzes, and resolve math doubts instantly.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-md px-xl text-center text-label-md text-on-surface-variant z-10 bg-surface/20">
        © {new Date().getFullYear()} StudentOS. Designed for high-achieving college students.
      </footer>
    </div>
  );
}

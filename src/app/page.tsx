'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '../utils/api';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#5B7FE8] grid-bg p-6 text-on-surface text-center">
      {/* Landing card frame */}
      <div className="max-w-xl w-full bg-[#faf8ff] neubrutal-border neubrutal-shadow p-8 md:p-12 rounded-lg flex flex-col items-center gap-8 relative overflow-hidden rotate-1">
        {/* Notebook spiral decorations on the side to look like a physical notebook */}
        <div className="absolute top-0 bottom-0 left-2 flex flex-col justify-around pointer-events-none opacity-30">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-6 h-6 border-4 border-on-surface rounded-full bg-transparent" />
          ))}
        </div>

        {/* Scattered/tilted icon card 1 */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#ffe251] border-3 border-on-surface rounded rotate-12 flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)] pointer-events-none">
          <span className="material-symbols-outlined text-4xl">menu_book</span>
        </div>

        {/* Scattered/tilted icon card 2 */}
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#ffb59d] border-3 border-on-surface rounded -rotate-12 flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)] pointer-events-none">
          <span className="material-symbols-outlined text-4xl">edit_note</span>
        </div>

        {/* Logo box */}
        <div className="bg-[#ffe251] px-6 py-2 border-4 border-on-surface shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-2">
          <h1 className="font-anton text-5xl md:text-6xl uppercase tracking-wider text-on-surface">
            STUDENTOS
          </h1>
        </div>

        {/* Tagline */}
        <div className="flex flex-col gap-2">
          <p className="font-space-grotesk font-bold text-xl uppercase text-on-surface">
            Your day, sorted.
          </p>
          <p className="font-archivo-narrow text-base md:text-lg text-on-surface-variant max-w-sm mt-2">
            The raw digital scrapbook for academic planning, study AI assistants, and grade targets.
          </p>
        </div>

        {/* Action Flows */}
        <div className="w-full flex flex-col items-center gap-4">
          {/* Primary CTA Button to Sign In */}
          <Link href="/signin" className="w-full">
            <span className="w-full bg-[#ff5c5c] text-white font-space-grotesk font-bold text-lg md:text-xl py-4 rounded-full border-4 border-on-surface shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all block cursor-pointer uppercase tracking-widest">
              GET STARTED
            </span>
          </Link>

          {/* Secondary Guest Entrance Link */}
          <Link 
            href="/dashboard" 
            onClick={() => {
              api.clearCachedUserData();
              const guestProfile = {
                name: "Guest User",
                email: "guest@studentos.app",
                gender: '',
                class: '',
                section: '',
                year: '',
                student_id: '',
                phone: '',
                date_of_birth: '',
                bio: '',
                college_name: '',
                department: '',
                branch: '',
                semester: '',
                batch: '',
                advisor: '',
                linkedin_url: '',
                github_url: '',
                portfolio_url: '',
                skills: [],
                interests: [],
                certifications: [],
                custom_links: [],
              };
              localStorage.setItem('studentos_profile', JSON.stringify(guestProfile));
              window.dispatchEvent(new Event('storage'));
            }}
            className="font-space-grotesk font-bold text-xs uppercase tracking-wider text-on-surface/70 hover:text-[#ff5c5c] underline underline-offset-4 decoration-2 transition-colors"
          >
            Enter as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}

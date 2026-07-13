'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { api } from '../../utils/api';

export default function SignInPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      api.clearCachedUserData();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-container bg-grid-pattern flex flex-col items-center justify-center p-4 text-on-surface relative overflow-hidden">
      {/* Decorative Scattered Background Elements */}
      <div className="absolute top-10 left-10 -rotate-12 hidden lg:block opacity-85 pointer-events-none">
        <div className="bg-secondary-fixed text-on-surface border-4 border-on-surface px-6 py-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] font-anton text-2xl uppercase">
          STAY FOCUSED
        </div>
      </div>
      <div className="absolute bottom-20 right-10 rotate-6 hidden lg:block opacity-85 pointer-events-none">
        <div className="bg-tertiary-container text-white border-4 border-on-surface px-6 py-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] font-anton text-2xl uppercase">
          NO DISTRACTIONS
        </div>
      </div>

      {/* Floating Paper bits for visual flavor */}
      <div className="absolute top-1/4 right-[10%] w-16 h-20 bg-white border-2 border-on-surface rotate-12 opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-[5%] w-24 h-24 bg-[#ffe251] border-2 border-on-surface rotate-[-15deg] opacity-20 pointer-events-none"></div>
      <div className="absolute top-2/3 right-[15%] w-12 h-12 bg-tertiary-container border-2 border-on-surface rotate-45 opacity-20 pointer-events-none"></div>

      {/* Main Sign In Card */}
      <main className="w-full max-w-lg transition-transform duration-500 hover:rotate-1 z-10">
        <div className="bg-[#F5F0DC] border-4 border-on-surface shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative -rotate-2">
          
          {/* Spiral Notebook Accent */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex justify-center items-center bg-[#F5F0DC] border-3 border-on-surface px-2.5 py-1 rounded shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-on-surface text-3xl font-bold">
              menu_book
            </span>
          </div>

          {/* Header */}
          <div className="text-center mb-10 mt-2">
            <h1 
              className="font-anton text-4xl md:text-5xl text-[#ffe251] uppercase mb-2 tracking-tight"
              style={{
                textShadow: '3px 3px 0px #1a1b22, -1px -1px 0 #1a1b22, 1px -1px 0 #1a1b22, -1px 1px 0 #1a1b22, 1px 1px 0 #1a1b22'
              }}
            >
              WELCOME BACK
            </h1>
            <p className="font-archivo-narrow text-lg md:text-xl text-on-surface-variant italic font-bold">
              &ldquo;Time to crush those goals.&rdquo;
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-[#ff5c5c]/10 border-2 border-[#ff5c5c] text-[#ff5c5c] px-4 py-3 font-space-grotesk font-bold text-sm">
                {error}
              </div>
            )}
            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-space-grotesk font-bold text-sm text-on-surface block uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F0DC] border-4 border-on-surface px-4 py-3 font-archivo-narrow text-lg text-on-surface focus:outline-none focus:bg-white focus:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all placeholder:text-on-surface-variant/50" 
                  placeholder="student@university.edu"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface opacity-50 font-bold">
                  alternate_email
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="font-space-grotesk font-bold text-sm text-on-surface block uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F5F0DC] border-4 border-on-surface px-4 py-3 font-archivo-narrow text-lg text-on-surface focus:outline-none focus:bg-white focus:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all placeholder:text-on-surface-variant/50" 
                  placeholder="••••••••"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface opacity-50 font-bold">
                  lock
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-4">
              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff5c5c] text-white font-space-grotesk font-bold py-4 rounded-full border-4 border-on-surface shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'VALIDATING...' : 'SIGN IN'}
                {!loading && (
                  <span className="material-symbols-outlined font-bold">arrow_forward</span>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Link */}
          <div className="mt-8 text-center border-t-2 border-on-surface/20 pt-6">
            <Link href="/signup" className="group inline-flex items-center gap-2">
              <span className="font-archivo-narrow text-base font-bold text-on-surface">Don&apos;t have an account?</span>
              <span className="font-space-grotesk font-bold text-xs uppercase text-on-surface bg-[#ffe251] px-2 py-1 border-2 border-on-surface group-hover:bg-[#ff5c5c] group-hover:text-white transition-all rotate-[-2deg] group-hover:rotate-[2deg] inline-block shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                Sign up
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Identity */}
      <footer className="mt-12 text-center space-y-2 z-10">
        <div className="flex items-center justify-center gap-2">
          <span className="bg-[#ffe251] text-on-surface px-3 py-1 border-4 border-on-surface shadow-[2px_2px_0px_rgba(0,0,0,1)] font-anton text-xl uppercase">
            StudentOS
          </span>
        </div>
        <p className="font-space-grotesk text-[10px] text-on-surface font-bold uppercase tracking-[0.2em] opacity-80">
          © 2026 Stay Productive
        </p>
      </footer>
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { api } from '../../utils/api';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      api.clearCachedUserData();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      setSuccessMessage('Account created! Check your email to confirm your account, then sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary bg-grid-pattern flex flex-col items-center justify-center p-4 text-on-surface relative overflow-hidden">
      {/* Decorative Scattered Background Cards */}
      <div className="absolute -bottom-4 -left-8 w-32 h-40 bg-tertiary-container border-4 border-on-surface neubrutal-shadow rotate-12 opacity-50 pointer-events-none"></div>
      <div className="absolute -top-12 -right-4 w-48 h-12 bg-secondary-container border-4 border-on-surface neubrutal-shadow -rotate-6 opacity-40 pointer-events-none"></div>

      {/* Main Sign Up Card */}
      <main className="w-full max-w-lg transition-transform duration-500 hover:rotate-1 z-10">
        <div className="bg-[#F5F0DC] border-4 border-on-surface shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative rotate-1">
          
          {/* Spiral Notebook Accent */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex justify-center items-center bg-[#F5F0DC] border-3 border-on-surface px-2.5 py-1 rounded shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-on-surface text-3xl font-bold">
              edit_document
            </span>
          </div>

          {/* Header */}
          <div className="text-center mb-8 mt-2">
            <h1 
              className="font-anton text-4xl md:text-5xl text-[#ffe251] uppercase mb-2 tracking-tight"
              style={{
                textShadow: '3px 3px 0px #1a1b22, -1px -1px 0 #1a1b22, 1px -1px 0 #1a1b22, -1px 1px 0 #1a1b22, 1px 1px 0 #1a1b22'
              }}
            >
              CREATE ACCOUNT
            </h1>
            <p className="font-archivo-narrow text-lg text-on-surface-variant italic font-bold">
              &ldquo;Join the productivity revolution.&rdquo;
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-[#ff5c5c]/10 border-2 border-[#ff5c5c] text-[#ff5c5c] px-4 py-3 font-space-grotesk font-bold text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-[#4ade80]/20 border-2 border-[#4ade80] text-[#0d3f1d] px-4 py-3 font-space-grotesk font-bold text-sm">
                {successMessage}
              </div>
            )}
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full-name" className="font-space-grotesk font-bold text-sm text-on-surface uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border-4 border-on-surface p-3 font-archivo-narrow text-base text-on-surface focus:outline-none focus:ring-0 focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] placeholder:text-on-surface-variant/40"
                placeholder="Alex Student"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-space-grotesk font-bold text-sm text-on-surface uppercase tracking-wider">
                University Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-4 border-on-surface p-3 font-archivo-narrow text-base text-on-surface focus:outline-none focus:ring-0 focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] placeholder:text-on-surface-variant/40"
                placeholder="alex@university.edu"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-space-grotesk font-bold text-sm text-on-surface uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-4 border-on-surface p-3 font-archivo-narrow text-base text-on-surface focus:outline-none focus:ring-0 focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] placeholder:text-on-surface-variant/40"
                placeholder="••••••••"
              />
            </div>

            {/* Grass green CREATE ACCOUNT button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#4ade80] text-on-surface font-space-grotesk font-bold text-lg py-4 border-4 border-on-surface rounded-full shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none active:scale-95 transition-all uppercase tracking-widest mt-4 cursor-pointer"
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Bottom Link */}
          <footer className="mt-8 text-center border-t-2 border-on-surface/20 pt-6">
            <Link href="/signin" className="group inline-block font-space-grotesk font-bold text-on-surface transition-all hover:rotate-2">
              Already have an account?&nbsp;
              <span className="text-primary hover:text-primary-container underline decoration-4 underline-offset-4 transition-colors">
                Sign in
              </span>
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}

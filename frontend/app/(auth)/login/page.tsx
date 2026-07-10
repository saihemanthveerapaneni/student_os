"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    } catch (err) {
      setErrorMsg(`Failed to initialize ${provider} login.`);
    }
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-background text-on-surface antialiased min-h-screen flex">
      {/* Left Pane: Branding & Illustration (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Radial decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #ffffff 0%, transparent 50%)" }}></div>
        <div className="absolute bottom-0 right-0 w-3/4 h-3/4 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 80%, #ffffff 0%, transparent 60%)" }}></div>
        
        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-surface-container-lowest rounded-lg flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-[24px] icon-fill">school</span>
          </div>
          <span className="font-headline-md text-headline-md text-on-primary tracking-tight">StudentOS</span>
        </div>

        {/* Hero image and titles */}
        <div className="z-10 flex flex-col items-center text-center mt-[-10%]">
          <div className="w-full max-w-lg mb-12 relative">
            <div className="absolute inset-0 bg-primary-container/20 rounded-2xl blur-2xl transform scale-105"></div>
            <img 
              className="relative w-full h-auto object-contain rounded-2xl drop-shadow-2xl" 
              alt="StudentOS Study Illustration" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ-fHqr2GYJAYIT4J_jN3enhUKl1Q0x25i-fc1JSpLFNLn6FPUf5IGi4ELQvvmoz8cFqxiVgY6xUaWEWgdd4IfkyFfn7ArPl4XTD7qrEaTjxdJNU3QomWD5nuww0g0ub5_8jw6RGYkAbLKqqh-l4t7q2tbEXABuG2uKQ4j6vwbMG1zvinh-cbfjgmqQ64so8P9qXlfLLhaaEWtuB2R1Jbw0KF5vQ_NMelmNtAmapQNMjAKx8ukLYtPxA"
            />
          </div>
          <h1 className="font-display-lg text-[40px] md:text-display-lg text-on-primary mb-6 leading-tight font-bold">Elevate Your Learning</h1>
          <p className="font-body-lg text-body-lg text-primary-container max-w-md mx-auto opacity-90">
            Experience cognitive calm. Manage your complex academic schedule, track deadlines, and maintain focus with our streamlined, intelligent workspace.
          </p>
        </div>

        {/* Social Proof */}
        <div className="z-10 flex items-center gap-4 text-primary-container font-label-md text-label-md opacity-80">
          <div className="flex -space-x-2">
            <img className="w-8 h-8 rounded-full border-2 border-primary object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzaJf5BAoztDUIIyYzETVuLpmQnsu1wzJ74qMo0bxmpgfBJpxld0vRXnD0Ymjc5-XV5zaJBEErlCojCPOgSlg2E2wij3hlYuzDp65Cm0F2VhIwXFm53iKa2fivjgcr8Dfqto1Wq42r-64YVzFog3nzsSeYaARpp_iW0JJ-IXB-_2ZUPnaPhzWHKgtVoW4Ikwdy2OK9ELs3phfggfMiMD-LevJ33C6S0Hv4SPUo-WfcxFZnI8zXX6vxOg" alt="Student 1" />
            <img className="w-8 h-8 rounded-full border-2 border-primary object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC575SM0AcANWjUrlGYd5gzabPcNnNlfNRSYnCrbtFYM3lzVC-5agy1SmjVwJkpz9u5RHWL-FgbBjCHC9n7WA6ZjP9DIQdHLUoFRSOV90NCLE8vpLqcDjP8RbNDLKtsCW-C95uKtTzT7EhdeO_IgB21wWxTAOA6ZZXfH7XSfk-1VgPZc91ttNAGWHfSGwIZxTauOOd_Xj4rHPnVssZ8zSuKzAVFOv150ZFp-yZ4nGgbnAHRCio2PuieCQ" alt="Student 2" />
            <img className="w-8 h-8 rounded-full border-2 border-primary object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJf4VIPikKkSBBXCQT1Q7vicrAOA8BEfT47K1oKHK6QgLrbzCOOzKwonvfjhb9qrOv1PImLBQxbMoeBktLBHQ1wkrZvNZ3mNF6UAQdXgJBlNyG-n5V8Fe5GhhXQjc0Zzp8B-xPN7kvVdWAMqv9TiBOELlb9d_gI_D6yJNvO-u58q6WzwG2gpGxBuClwkChrAGDVJ_53A6ulhUVx44hsk3XKGExhJYztjKzNouae9L7H6ly5UzMuR5Zzg" alt="Student 3" />
          </div>
          <span>Trusted by 10,000+ high-achieving students.</span>
        </div>
      </div>

      {/* Right Pane: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 bg-surface-container-lowest dark:bg-surface-container-lowest relative">
        {/* Mobile Brand Logo */}
        <div className="flex lg:hidden items-center gap-3 mb-12 absolute top-8 left-6 sm:left-12">
          <div className="w-8 h-8 bg-primary text-on-primary rounded-md flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[18px] icon-fill">school</span>
          </div>
          <span className="font-title-lg text-title-lg text-on-surface tracking-tight">StudentOS</span>
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">Welcome back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Log in to your account to continue organizing your academic journey.</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-body-md flex items-start gap-xs">
              <span className="material-symbols-outlined text-[20px] text-error flex-shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google SSO Login */}
          <div className="mb-6">
            <button 
              onClick={() => handleOAuthLogin("google")}
              type="button" 
              className="w-full flex justify-center items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-title-md hover:bg-surface-container-low transition-colors duration-200 shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-outline-variant/40"></div>
            <span className="px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Or email login</span>
            <div className="flex-grow h-px bg-outline-variant/40"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block font-title-md text-title-md text-on-surface mb-1.5" htmlFor="email">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">mail</span>
                </div>
                <input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-title-md text-title-md text-on-surface" htmlFor="password">Password</label>
                <Link href="/forgot" className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
                </div>
                <input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-on-primary bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-title-md text-title-md transition-all duration-200 mt-2 hover:shadow-md transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </form>

          {/* Toggle Register */}
          <p className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
            Don't have an account? 
            <Link href="/register" className="font-title-md text-title-md text-primary hover:underline hover:text-primary-container transition-colors ml-1">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

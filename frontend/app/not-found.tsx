"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-error-container text-error rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <span className="material-symbols-outlined text-[32px]">error</span>
      </div>
      
      <h1 className="text-headline-lg font-bold text-on-surface mb-2 tracking-tight">404 - Page Not Found</h1>
      <p className="text-body-lg text-on-surface-variant max-w-md mb-8">
        The page you are looking for does not exist or has been relocated to another semester.
      </p>

      <Link href="/dashboard">
        <button className="bg-primary hover:bg-primary/95 text-on-primary px-lg py-2.5 rounded-xl text-body-md font-semibold transition-all shadow-sm cursor-pointer">
          Back to Dashboard
        </button>
      </Link>
    </div>
  );
}

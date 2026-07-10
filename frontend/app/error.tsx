"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-error-container text-on-error-container rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <span className="material-symbols-outlined text-[32px] text-error">warning</span>
      </div>
      
      <h1 className="text-headline-lg font-bold text-on-surface mb-2 tracking-tight">Something went wrong!</h1>
      <p className="text-body-lg text-on-surface-variant max-w-md mb-8">
        We encountered an error loading this section. You can try refreshing the page view.
      </p>

      <div className="flex gap-sm">
        <button 
          onClick={() => reset()}
          className="bg-primary hover:bg-primary/95 text-on-primary px-lg py-2.5 rounded-xl text-body-md font-semibold transition-all shadow-sm cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-highest border-t-4 border-on-surface mt-auto z-40">
      <span className="font-anton text-xl text-on-surface uppercase">StudentOS</span>
      <div className="flex gap-6">
        <Link href="#" className="font-space-grotesk text-sm text-on-surface-variant hover:text-primary transition-colors uppercase">
          Privacy
        </Link>
        <Link href="#" className="font-space-grotesk text-sm text-on-surface-variant hover:text-primary transition-colors uppercase">
          Terms
        </Link>
        <Link href="#" className="font-space-grotesk text-sm text-on-surface-variant hover:text-primary transition-colors uppercase">
          Support
        </Link>
      </div>
      <span className="font-archivo-narrow text-base text-on-surface">
        © 2026 StudentOS. Stay Productive.
      </span>
    </footer>
  );
}

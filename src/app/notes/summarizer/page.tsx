'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NoteSummarizerPage() {
  const [originalText, setOriginalText] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = originalText.trim() === '' ? 0 : originalText.trim().split(/\s+/).length;

  const handleSummarize = () => {
    if (!originalText.trim()) return;

    setLoading(true);
    setSummary([]);
    setCopied(false);

    // Simulate AI summary generation
    setTimeout(() => {
      const sentences = originalText
        .split(/[.!?]+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 10);

      const bulletPoints = sentences.length > 0
        ? sentences.slice(0, 4).map((sentence, index) =>
            index === 0 ? `Main idea: ${sentence}` : `Key point ${index + 1}: ${sentence}`
          )
        : [];

      setSummary(bulletPoints);
      setLoading(false);
    }, 1500); // 1.5s delay
  };

  const handleCopySummary = () => {
    if (summary.length === 0) return;
    const textToCopy = summary.map((point, index) => `${index + 1}. ${point}`).join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="min-h-screen flex flex-col quadrille-bg">
      <Navbar />

      <main className="flex-grow flex flex-col px-6 md:px-8 py-8 gap-8 max-w-7xl mx-auto w-full relative">
        <header className="mb-4 transform rotate-1 self-start">
          <h1 className="font-anton text-4xl md:text-5xl text-on-surface uppercase tracking-wider drop-shadow-[2px_2px_0px_var(--shadow-color)]">
            Note Summarizer
          </h1>
          <p className="font-archivo-narrow text-base text-white bg-on-surface inline-block px-3 py-1 mt-2 border-3 border-on-surface transform -rotate-1">
            Condense your chaos into clarity.
          </p>
        </header>

        {/* Split Layout: Left side shows original notes in cream card, right side shows AI summary in yellow card */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full relative z-10">
          {/* Left Card: Original Notes (Cream Card) */}
          <div className="flex-1 bg-[#F5F0DC] border-3 border-on-surface p-6 flex flex-col gap-4 transform -rotate-1 hover:rotate-0 transition-all duration-200 shadow-[4px_4px_0px_var(--shadow-color)]">
            <div className="flex justify-between items-center border-b-4 border-on-surface pb-2">
              <h2 className="font-anton text-lg text-[#1A1A2E] flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  edit_document
                </span>
                Original Notes
              </h2>
              <span className="bg-secondary-container text-on-surface border-2 border-on-surface px-2 py-1 font-space-grotesk font-bold text-xs uppercase">
                Input
              </span>
            </div>
            <div className="flex-grow relative h-64 lg:h-96 flex flex-col">
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="w-full flex-grow bg-transparent border-none resize-none focus:ring-0 font-archivo-narrow text-lg text-[#1A1A2E] p-0 placeholder:text-[#1A1A2E]/50 focus:outline-none"
                placeholder="Paste your messy lecture notes here..."
              />
              <div className="text-on-surface-variant font-space-grotesk font-bold text-xs self-end mt-2">
                {wordCount} words
              </div>
            </div>
          </div>

          {/* Center: Summarize Button */}
          <div className="flex justify-center items-center py-4 lg:py-0 z-20">
            <button
              onClick={handleSummarize}
              disabled={loading || !originalText.trim()}
              className={`bg-tertiary-container text-white border-4 border-on-surface rounded-full p-6 flex flex-col items-center justify-center gap-2 transform lg:rotate-90 hover:scale-110 active:scale-95 transition-all shadow-[4px_4px_0_var(--shadow-color)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group`}
            >
              <span className="font-anton text-base uppercase tracking-widest group-hover:-translate-y-1 transition-transform">
                {loading ? 'Processing' : 'Summarize'}
              </span>
              <span className="material-symbols-outlined text-4xl group-hover:translate-y-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                {loading ? 'sync' : 'arrow_downward'}
              </span>
            </button>
          </div>

          {/* Right Card: AI Summary (Yellow Card) */}
          <div className="flex-1 bg-[#ffe251] border-3 border-on-surface p-6 flex flex-col gap-4 transform rotate-1 hover:rotate-0 transition-all duration-200 shadow-[4px_4px_0px_var(--shadow-color)]">
            <div className="flex justify-between items-center border-b-4 border-on-surface pb-2">
              <h2 className="font-anton text-lg text-[#1A1A2E] flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                AI Summary
              </h2>
              <span className="bg-primary-container text-white border-2 border-on-surface px-2 py-1 font-space-grotesk font-bold text-xs uppercase">
                Output
              </span>
            </div>
            
            <div className="flex-grow overflow-y-auto min-h-[250px] flex flex-col justify-between">
              {loading ? (
                <div className="h-full flex flex-col justify-center items-center gap-4 py-12">
                  <div className="w-12 h-12 border-4 border-dashed border-on-surface rounded-full animate-spin" />
                  <p className="font-space-grotesk font-bold text-sm uppercase text-[#1A1A2E]">Crunching the notes...</p>
                </div>
              ) : summary.length > 0 ? (
                <div className="flex flex-col gap-6 h-full justify-between">
                  <ul className="font-archivo-narrow text-lg text-[#1A1A2E] space-y-4">
                    {summary.map((point, index) => (
                      <li key={index} className="flex gap-3 items-start bg-background p-3 neubrutal-border shadow-[2px_2px_0_var(--shadow-color)] rounded">
                        <span className="bg-secondary-container text-on-surface border border-on-surface w-6 h-6 flex items-center justify-center font-space-grotesk font-bold text-xs rounded-full shrink-0">
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{point}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Copy Summary Button below */}
                  <button
                    onClick={handleCopySummary}
                    className="w-full mt-4 bg-background text-on-surface border-3 border-on-surface py-2.5 font-space-grotesk font-bold text-sm uppercase shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    {copied ? 'COPIED!' : 'COPY SUMMARY'}
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center opacity-65 p-6 py-12 text-[#1A1A2E]">
                  <span className="material-symbols-outlined text-5xl mb-2">psychology</span>
                  <p className="font-space-grotesk font-bold uppercase text-sm">
                    Summary output will appear here after you paste original notes and click Summarize.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

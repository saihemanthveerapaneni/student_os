'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

const buildQuestionsFromText = (text: string): Question[] => {
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 8);

  if (sentences.length === 0) {
    return [];
  }

  const firstSentence = sentences[0];
  const secondSentence = sentences[1] || firstSentence;
  const thirdSentence = sentences[2] || secondSentence;
  const keywords = firstSentence
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 4)
    .join(' ');

  return [
    {
      id: 'generated-1',
      questionText: `What is the main focus described in ${keywords ? `the notes about "${keywords}"` : 'your notes'}?`,
      options: [firstSentence, secondSentence, thirdSentence, 'A follow-up study action'],
      correctAnswer: firstSentence,
    },
    {
      id: 'generated-2',
      questionText: 'Which statement best matches the important detail in your notes?',
      options: [secondSentence, 'A general reminder', 'An unrelated topic', 'A placeholder answer'],
      correctAnswer: secondSentence,
    },
  ];
};

export default function QuizGeneratorPage() {
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleGenerateQuiz = () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setSelectedAnswers({});

    // Simulate AI generation delay
    setTimeout(() => {
      const generated = buildQuestionsFromText(inputText);
      setQuestions(generated);
      setLoading(false);
    }, 1200);
  };

  const handleOptionChange = (questionId: string, option: string) => {
    if (selectedAnswers[questionId]) return; // Only allow one selection
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: option,
    });
  };

  // Calculate score
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = questions.reduce((acc, q) => {
    if (selectedAnswers[q.id] === q.correctAnswer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col quadrille-bg">
      <Navbar />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col gap-12">
        {/* Header Section */}
        <header className="flex flex-col gap-2 rotate-m1 self-start">
          <div className="inline-flex items-center gap-2 bg-primary-fixed border-3 border-on-surface px-3 py-1 rounded-sm shadow-[2px_2px_0px_var(--shadow-color)] w-max">
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-space-grotesk font-bold text-xs uppercase text-on-surface">AI Assistant</span>
          </div>
          <h1 className="font-anton text-4xl md:text-5xl text-on-surface">QUIZ GENERATOR</h1>
          <p className="font-archivo-narrow text-base md:text-lg text-on-surface-variant max-w-2xl">
            Paste your messy notes below and let the chaos engine build a test for you.
          </p>
        </header>

        {/* Input Area */}
        <section className="flex flex-col gap-6 rotate-p1 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="font-space-grotesk font-bold text-sm text-on-surface uppercase tracking-wider">
              Source Material
            </label>
            {/* Large cream textarea with black outline */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-[#F5F0DC] border-4 border-on-surface rounded-none p-4 font-archivo-narrow text-lg text-[#1A1A2E] shadow-[4px_4px_0px_var(--shadow-color)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all resize-y"
              placeholder="Paste lecture notes, copied textbook paragraphs, or syllabus details here..."
              rows={5}
            />
          </div>
          {/* Orange-Red Generate Quiz button */}
          <button
            onClick={handleGenerateQuiz}
            disabled={loading || !inputText.trim()}
            className="self-end bg-[#E8734A] text-white border-4 border-on-surface rounded-full px-8 py-3 font-space-grotesk font-bold text-sm md:text-base uppercase tracking-widest shadow-[4px_4px_0px_var(--shadow-color)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined">magic_button</span>
            {loading ? 'GENERATING...' : 'GENERATE QUIZ'}
          </button>
        </section>

        {/* Generated Quiz Section */}
        {(loading || questions.length > 0) && (
          <section className="flex flex-col gap-8 mt-4">
            <h2 className="font-anton text-2xl text-on-surface border-b-4 border-on-surface pb-2 inline-block w-max uppercase">
              YOUR QUIZ
            </h2>

            {loading ? (
              <div className="bg-[#F5F0DC] border-4 border-on-surface p-8 text-center flex flex-col items-center justify-center gap-4 shadow-[4px_4px_0_var(--shadow-color)]">
                <div className="w-12 h-12 border-4 border-dashed border-primary rounded-full animate-spin" />
                <p className="font-space-grotesk font-bold text-sm uppercase">Drafting test questions...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {questions.map((q, idx) => {
                    const isEven = idx % 2 === 0;
                    const selected = selectedAnswers[q.id];

                    return (
                      <article
                        key={q.id}
                        className={`bg-[#F5F0DC] border-4 border-on-surface p-6 shadow-[6px_6px_0px_var(--shadow-color)] flex flex-col gap-6 hover:rotate-0 transition-transform ${
                          isEven ? 'rotate-m2' : 'rotate-p1'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="bg-secondary-container text-on-surface border-3 border-on-surface w-10 h-10 flex items-center justify-center font-anton text-xl rounded-full shrink-0 shadow-[2px_2px_0px_var(--shadow-color)]">
                            {idx + 1}
                          </span>
                          <h3 className="font-archivo-narrow text-lg font-bold text-on-surface pt-1">
                            {q.questionText}
                          </h3>
                        </div>

                        {/* MCQ cards with 4 pill-style answer options */}
                        <div className="flex flex-col gap-3 pl-1 md:pl-14">
                          {q.options.map((option) => {
                            const isOptionSelected = selected === option;
                            const isCorrect = option === q.correctAnswer;

                            let bgClass = 'bg-white hover:bg-surface-container';
                            let borderClass = 'border-3 border-on-surface';
                            let icon = null;

                            // Once selected, correct answer is highlighted green with a check icon
                            if (selected) {
                              if (isCorrect) {
                                bgClass = 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-700 dark:border-green-400';
                                icon = (
                                  <span className="material-symbols-outlined text-green-700 dark:text-green-400 font-bold absolute right-4">
                                    check_circle
                                  </span>
                                );
                              } else if (isOptionSelected) {
                                bgClass = 'bg-[#ffdad6] text-red-900 border-red-500';
                                icon = (
                                  <span className="material-symbols-outlined text-red-600 font-bold absolute right-4">
                                    cancel
                                  </span>
                                );
                              }
                            }

                            return (
                              <label
                                key={option}
                                className={`flex items-center gap-3 p-3 ${bgClass} ${borderClass} rounded-full shadow-[2px_2px_0px_var(--shadow-color)] cursor-pointer relative overflow-hidden transition-all`}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={isOptionSelected}
                                  disabled={!!selected}
                                  onChange={() => handleOptionChange(q.id, option)}
                                  className="w-5 h-5 border-2 border-on-surface text-primary focus:ring-0 cursor-pointer"
                                />
                                <span className="font-archivo-narrow text-base font-bold text-on-surface">
                                  {option}
                                </span>
                                {icon}
                              </label>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Score Summary (Visible once some answers are selected) */}
                {answeredCount === questions.length && (
                  <div className="bg-background border-4 border-on-surface p-6 shadow-[6px_6px_0_var(--shadow-color)] max-w-md w-full mx-auto text-center flex flex-col items-center gap-4 rotate-1">
                    <h3 className="font-anton text-2xl text-primary uppercase">Quiz Completed!</h3>
                    <p className="font-archivo-narrow text-xl font-bold">
                      Your Score: <span className="text-[#bf542e] font-anton text-3xl">{score}</span> / {questions.length}
                    </p>
                    <div className="w-full bg-[#ffe251] border-2 border-on-surface p-3 font-space-grotesk font-bold uppercase text-xs shadow-[2px_2px_0_var(--shadow-color)] text-on-surface">
                      {score === questions.length ? 'Perfect Score! Absolute Legend!' : 'Nice try! Review notes and try again.'}
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      className="mt-2 bg-[#E8734A] text-white border-3 border-on-surface px-6 py-2 font-space-grotesk font-bold text-xs uppercase shadow-[2px_2px_0_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 cursor-pointer"
                    >
                      Reset & Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

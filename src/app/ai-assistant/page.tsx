'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClearChatModal from '@/components/ClearChatModal';
import { api } from '../../utils/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "I'm awake. Paste your notes, ask a question, or tell me to explain something complex. What are we studying today?",
      timestamp: '', // set client-side only to avoid SSR hydration mismatch
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stable time formatter — always 24h HH:MM to avoid AM/PM locale mismatch between server & client
  const getTime = () =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Load chat history from localStorage on mount; also stamp the initial greeting time
  useEffect(() => {
    // Stamp initial greeting with client-side time
    setMessages((prev) =>
      prev.map((m) => (m.id === '1' && m.timestamp === '' ? { ...m, timestamp: getTime() } : m))
    );

    const saved = localStorage.getItem('studentos_ai_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Guard: only keep messages that have valid text and sender fields
        const valid = Array.isArray(parsed)
          ? parsed.filter((m: any) => typeof m.text === 'string' && m.sender)
          : [];
        if (valid.length > 0) setMessages(valid);
      } catch (e) {}
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: getTime(),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    localStorage.setItem('studentos_ai_chats', JSON.stringify(updatedWithUser));
    setInputText('');
    setIsTyping(true);

    try {
      // Map message history to backend required schema format
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const botResponseText = await api.sendAiChatQuery(text, historyPayload);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText || "Sorry, I didn't get a response. Make sure the backend is running and try again!",
        timestamp: getTime(),
      };

      const finalMessages = [...updatedWithUser, botMsg];
      setMessages(finalMessages);
      localStorage.setItem('studentos_ai_chats', JSON.stringify(finalMessages));
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  const handleClearChat = async () => {
    setIsClearing(true);
    setErrorMsg('');
    try {
      await api.clearAiChats();
      // On success, reset UI state
      const defaultMsg: Message = {
        id: '1',
        sender: 'bot',
        text: "I'm awake. Paste your notes, ask a question, or tell me to explain something complex. What are we studying today?",
        timestamp: getTime(),
      };
      setMessages([defaultMsg]);
      localStorage.removeItem('studentos_ai_chats');
      setIsClearModalOpen(false);
    } catch (e) {
      console.error("Failed to clear chat:", e);
      setErrorMsg("Couldn't clear chat, try again");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col quadrille-bg text-[#1A1A2E]">
      <Navbar />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col gap-2 self-start relative w-full">
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 bg-primary-fixed border-3 border-on-surface px-3 py-1 rounded-sm shadow-[2px_2px_0px_var(--shadow-color)] w-max">
                <span className="material-symbols-outlined text-on-surface">psychology</span>
                <span className="font-space-grotesk font-bold text-xs uppercase text-on-surface">AI Assistant</span>
              </div>
              <h1 className="font-anton text-4xl md:text-5xl text-on-surface">OS BOT</h1>
            </div>
            
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="bg-[#F5F0DC] border-3 border-on-surface p-2 rounded shadow-[3px_3px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-on-surface flex items-center justify-center group"
              title="Clear Chat History"
            >
              <span className="material-symbols-outlined group-hover:text-[#ff5252] transition-colors">mop</span>
            </button>
          </div>
          
          <p className="font-archivo-narrow text-base md:text-lg text-on-surface-variant max-w-2xl">
            Ask me to summarize, quiz, or explain. I feed on messy academic inputs.
          </p>
          {errorMsg && (
            <p className="font-space-grotesk font-bold text-sm text-[#ff5252] bg-white border-2 border-[#ff5252] px-3 py-1 mt-2 inline-block w-max">
              {errorMsg}
            </p>
          )}
        </header>

        {/* Chat Dashboard Container */}
        <section className="flex-grow flex flex-col bg-[#F5F0DC] border-4 border-on-surface p-4 md:p-6 shadow-[6px_6px_0px_var(--shadow-color)] rotate-[0.5deg] min-h-[400px]">
          {/* Scrollable messages container */}
          <div className="flex-grow overflow-y-auto mb-6 flex flex-col gap-4 max-h-[450px] pr-2">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    isBot ? 'self-start items-start' : 'self-end items-end'
                  }`}
                >
                  <div
                    className={`p-4 border-3 border-on-surface rounded shadow-[3px_3px_0_var(--shadow-color)] ${
                      isBot
                        ? 'bg-background text-on-surface -rotate-1'
                        : 'bg-primary text-white rotate-1'
                    }`}
                  >
                    <p className="font-archivo-narrow text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        const safeText = msg.text ?? '';
                        return safeText.includes('[') ? (
                          <span>
                            {safeText.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                              const match = part.match(/\[(.*?)\]\((.*?)\)/);
                              if (match) {
                                return (
                                  <Link
                                    key={i}
                                    href={match[2]}
                                    className="underline font-bold text-[#ffb59d] hover:text-[#ffe251]"
                                  >
                                    {match[1]}
                                  </Link>
                                );
                              }
                              return part;
                            })}
                          </span>
                        ) : (
                          safeText
                        );
                      })()}
                    </p>
                  </div>
                  <span className="font-space-grotesk text-[10px] text-on-surface-variant mt-1.5 px-2">
                    {isBot ? 'OS BOT' : 'YOU'} • {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div className="self-start flex flex-col items-start max-w-[80%]">
                <div className="p-4 border-3 border-on-surface rounded bg-background text-on-surface -rotate-1 shadow-[3px_3px_0_var(--shadow-color)]">
                  <div className="flex items-center gap-1.5 py-1 px-2">
                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce delay-75" />
                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce delay-150" />
                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-2 mt-auto border-t-3 border-on-surface pt-4">
            {/* Focus hint label */}
            <div className="flex items-center gap-2 h-4">
              {isFocused ? (
                <span className="flex items-center gap-1.5 font-space-grotesk font-bold text-[11px] uppercase text-primary">
                  <span className="inline-block w-0.5 h-3.5 bg-primary animate-[blink_1s_step-end_infinite] rounded-sm" />
                  Typing...
                </span>
              ) : (
                <span className="font-space-grotesk text-[11px] uppercase text-on-surface/40 tracking-wide">
                  Click to type your question
                </span>
              )}
            </div>
            <div className="flex gap-4 items-stretch">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoComplete="off"
                spellCheck={false}
                className={`flex-grow bg-white p-4 font-sans text-base md:text-lg resize-none rounded-none text-[#1a1b22] transition-all duration-150 min-h-[60px] focus:outline-none ${
                  isFocused
                    ? 'border-4 border-[#ffe251] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-3 border-on-surface'
                } placeholder:text-on-surface/30`}
                placeholder="Ask anything (e.g. quiz me on fourier transforms, or explain integrals)..."
              />
              <button
                onClick={() => handleSend(inputText)}
                className="bg-primary text-white font-space-grotesk font-bold px-6 py-3 rounded-none neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center cursor-pointer text-white"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ClearChatModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearChat}
        isClearing={isClearing}
      />
    </div>
  );
}

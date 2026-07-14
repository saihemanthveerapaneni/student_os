'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClearChatModal from '@/components/ClearChatModal';
import { api } from '../../utils/api';
import { useTheme } from '@/components/ThemeProvider';
import { createClient } from '@/lib/supabase/client';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';

  timetablePrefs: {
    weekStart: string;
    classDuration: number;
    breakDuration: number;
    autoHighlight: boolean;
  };
  aiPrefs: {
    model: string;
    responseLength: 'short' | 'medium' | 'long';
    studyMode: boolean;
    aiSuggestions: boolean;
  };
  calendarPrefs: {
    defaultView: 'day' | 'week';
    weekStartsMonday: boolean;
  };

}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'light',
    accentColor: 'yellow',
    fontSize: 'medium',
    timetablePrefs: {
      weekStart: 'Monday',
      classDuration: 60,
      breakDuration: 10,
      autoHighlight: true,
    },
    aiPrefs: {
      model: 'Claude 3.5 Sonnet',
      responseLength: 'medium',
      studyMode: true,
      aiSuggestions: true,
    },
    calendarPrefs: {
      defaultView: 'week',
      weekStartsMonday: true,
    },
  });

  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get('section');
      if (sectionParam) {
        const sectionId = parseInt(sectionParam, 10);
        if (!isNaN(sectionId) && sectionId >= 1 && sectionId <= 6) {
          // Collapse all and only expand the selected one
          setExpandedSections({ [sectionId]: true });
          
          // Scroll down to ensure it's visible if it's lower down
          setTimeout(() => {
            const sectionTitles = [
              '1. ACCOUNT SETTINGS',
              '2. APPEARANCE & STYLING',
              '3. TIMETABLE PREFERENCES',
              '4. AI ASSISTANT',
              '5. CALENDAR CONFIGURATIONS',
              '6. ABOUT STUDENTOS'
            ];
            // Just a basic scroll approach
            window.scrollTo({ top: (sectionId - 1) * 120, behavior: 'smooth' });
          }, 300);
        }
      }
    }
  }, []);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const { theme: currentTheme, setThemeState, setAccentColor, setFontSize } = useTheme();

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (updated: SettingsState) => {
    setSettings(updated);
    try {
      await api.updateSettings(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSection = (id: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };



  const handleActionClick = (action: string) => {
    if (action === 'clear_chat') {
      setActiveModal('clear_chat');
    } else if (action === 'delete_data') {
      setActiveModal('delete_data');
    } else if (action === 'delete_account') {
      setActiveModal('delete_account');
    }
  };

  const handleClearChat = async () => {
    setIsClearingChat(true);
    try {
      await api.clearAiChats();
      localStorage.removeItem('studentos_ai_chats');
      showToast('AI Chat History cleared successfully!');
      setActiveModal(null);
    } catch (e) {
      console.error("Failed to clear chat:", e);
      showToast("Couldn't clear chat, try again");
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleChangePassword = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) {
        showToast('Error: ' + error.message);
      } else {
        showToast('Password reset email dispatched to ' + user.email);
      }
    } else {
      showToast('No email associated with account.');
    }
  };

  const executeModalAction = async () => {
    if (activeModal === 'delete_data') {
      localStorage.clear();
      showToast('All browser local data has been reset.');
      setTimeout(() => window.location.reload(), 1500);
    } else if (activeModal === 'delete_account') {
      const supabase = createClient();
      await supabase.auth.signOut();
      localStorage.clear();
      showToast('Account deleted and signed out successfully!');
      setTimeout(() => window.location.href = '/', 1000);
    }
    setActiveModal(null);
  };

  const showToast = (txt: string) => {
    setMessage(txt);
    setTimeout(() => setMessage(null), 3000);
  };

  const exportData = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('studentos_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'studentos_data_export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Your StudentOS data backup generated successfully!');
  };

  return (
    <div className="min-h-screen flex flex-col quadrille-bg">
      <Navbar />

      <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-8 py-8 flex flex-col gap-8">
        <header className="transform -rotate-1 self-start">
          <h1 className="font-anton text-4xl md:text-5xl text-on-surface uppercase tracking-wider">
            APP SETTINGS
          </h1>
          <p className="font-archivo-narrow text-base text-on-surface bg-secondary-container inline-block px-2 py-1 neubrutal-border mt-2 rotate-1">
            Tune your OS configurations, notifications, and preferences.
          </p>
        </header>

        {/* Settings Panel Grid */}
        <section className="bg-[#F5F0DC] border-4 border-on-surface p-6 md:p-8 rounded-lg shadow-[6px_6px_0px_var(--shadow-color)] rotate-1 flex flex-col gap-6 text-[#1A1A2E]">
          
          {/* Section 1: Account */}
          <div className="border-3 border-on-surface bg-background rounded shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
            <button
              onClick={() => toggleSection(1)}
              className="w-full flex justify-between items-center p-4 bg-surface-container border-b-3 border-on-surface font-anton text-lg uppercase text-on-surface cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">person</span>
                1. Account Settings
              </span>
              <span className="material-symbols-outlined">
                {expandedSections[1] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedSections[1] && (
              <div className="p-5 flex flex-col gap-4 font-archivo-narrow text-base text-on-surface">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-on-surface/10 pb-4">
                  <div>
                    <h3 className="font-bold text-lg">Manage Profile Details</h3>
                    <p className="text-on-surface-variant text-sm">Update Student Roll ID, Branch, Major, and Social links.</p>
                  </div>
                  <button 
                    onClick={() => window.dispatchEvent(new Event('open-profile-modal'))}
                    className="text-sm font-space-grotesk font-bold uppercase bg-[#ffe251] px-3 py-1.5 border-2 border-on-surface shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-on-surface"
                  >
                    Open Profile Editor
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-on-surface/10 pb-4">
                  <div>
                    <h3 className="font-bold text-lg">Login Credentials</h3>
                    <p className="text-on-surface-variant text-sm">Change password or update email notifications.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleChangePassword}
                      className="bg-white border-2 border-on-surface py-1 px-3 font-space-grotesk font-bold text-xs uppercase shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-on-surface"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-red-600">Danger Zone</h3>
                    <p className="text-on-surface-variant text-sm">Permanently delete your profile data.</p>
                  </div>
                  <button
                    onClick={() => handleActionClick('delete_account')}
                    className="bg-[#ff5c5c] text-white border-3 border-on-surface px-4 py-2 font-space-grotesk font-bold text-xs uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Appearance */}
          <div className="border-3 border-on-surface bg-background rounded shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
            <button
              onClick={() => toggleSection(2)}
              className="w-full flex justify-between items-center p-4 bg-surface-container border-b-3 border-on-surface font-anton text-lg uppercase text-on-surface cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">palette</span>
                2. Appearance & Styling
              </span>
              <span className="material-symbols-outlined">
                {expandedSections[2] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedSections[2] && (
              <div className="p-5 flex flex-col gap-6 font-archivo-narrow text-base text-on-surface">
                {/* Theme Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base uppercase font-space-grotesk">Interface Theme</h3>
                    <p className="text-on-surface-variant text-sm">Choose the active style configuration.</p>
                  </div>
                  <div className="flex border-3 border-on-surface p-1 bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] rounded-sm">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          saveSettings({ ...settings, theme: t as any });
                          setThemeState(t as any);
                        }}
                        className={`px-3 py-1 font-space-grotesk font-bold text-xs uppercase transition-colors cursor-pointer ${
                          settings.theme === t ? 'bg-[#ffe251] text-on-surface' : 'text-on-surface/50 hover:text-on-surface'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base uppercase font-space-grotesk">Accent Colors</h3>
                    <p className="text-on-surface-variant text-sm">Choose theme highlights color palette.</p>
                  </div>
                  <div className="flex gap-2">
                    {['yellow', 'blue', 'red', 'green', 'purple'].map((c) => {
                      const bgClass = {
                        yellow: 'bg-[#ffe251]',
                        blue: 'bg-[#5B7FE8]',
                        red: 'bg-[#ff5c5c]',
                        green: 'bg-[#4ade80]',
                        purple: 'bg-[#b4c5ff]',
                      }[c];

                      const borderClass = settings.accentColor === c ? 'border-black ring-2 ring-black ring-offset-2' : 'border-on-surface/30';

                      return (
                        <button
                          key={c}
                          onClick={() => {
                            saveSettings({ ...settings, accentColor: c });
                            setAccentColor(c);
                          }}
                          className={`w-6 h-6 rounded-full border-2 ${bgClass} ${borderClass} cursor-pointer transition-all`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base uppercase font-space-grotesk">Text Font Size</h3>
                    <p className="text-on-surface-variant text-sm">Adjust text size across the notebook panels.</p>
                  </div>
                  <div className="flex border-3 border-on-surface p-1 bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] rounded-sm">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          saveSettings({ ...settings, fontSize: size as any });
                          setFontSize(size);
                        }}
                        className={`px-3 py-1 font-space-grotesk font-bold text-xs uppercase transition-colors cursor-pointer ${
                          settings.fontSize === size ? 'bg-[#ffe251] text-on-surface' : 'text-on-surface/50 hover:text-on-surface'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Timetable Prefs */}
          <div className="border-3 border-on-surface bg-background rounded shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
            <button
              onClick={() => toggleSection(4)}
              className="w-full flex justify-between items-center p-4 bg-surface-container border-b-3 border-on-surface font-anton text-lg uppercase text-on-surface cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">schedule</span>
                3. Timetable preferences
              </span>
              <span className="material-symbols-outlined">
                {expandedSections[4] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedSections[4] && (
              <div className="p-5 flex flex-col gap-4 font-archivo-narrow text-base text-on-surface">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-space-grotesk font-bold text-xs uppercase">First Day of the Week</label>
                    <select
                      value={settings.timetablePrefs.weekStart}
                      onChange={(e) => saveSettings({
                        ...settings,
                        timetablePrefs: { ...settings.timetablePrefs, weekStart: e.target.value }
                      })}
                      className="bg-white border-2 border-on-surface p-2 text-sm font-space-grotesk font-bold text-[#1a1b22]"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-space-grotesk font-bold text-xs uppercase">Default Class Duration (mins)</label>
                    <select
                      value={settings.timetablePrefs.classDuration}
                      onChange={(e) => saveSettings({
                        ...settings,
                        timetablePrefs: { ...settings.timetablePrefs, classDuration: parseInt(e.target.value) }
                      })}
                      className="bg-white border-2 border-on-surface p-2 text-sm font-space-grotesk font-bold text-[#1a1b22]"
                    >
                      <option value="45">45</option>
                      <option value="50">50</option>
                      <option value="60">60</option>
                      <option value="90">90</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-surface p-3 border-2 border-on-surface shadow-[2px_2px_0_rgba(0,0,0,1)] rounded mt-2">
                  <span className="font-bold">Auto-highlight current class block</span>
                  <button
                    onClick={() => saveSettings({
                      ...settings,
                      timetablePrefs: { ...settings.timetablePrefs, autoHighlight: !settings.timetablePrefs.autoHighlight }
                    })}
                    className={`w-12 h-6 rounded-full border-2 border-on-surface transition-colors cursor-pointer relative p-0.5 ${
                      settings.timetablePrefs.autoHighlight ? 'bg-[#4ade80]' : 'bg-surface-container-high'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-on-surface border border-on-surface transition-all ${
                      settings.timetablePrefs.autoHighlight ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: AI Assistant */}
          <div className="border-3 border-on-surface bg-background rounded shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
            <button
              onClick={() => toggleSection(5)}
              className="w-full flex justify-between items-center p-4 bg-surface-container border-b-3 border-on-surface font-anton text-lg uppercase text-on-surface cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">psychology</span>
                4. AI Assistant
              </span>
              <span className="material-symbols-outlined">
                {expandedSections[5] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedSections[5] && (
              <div className="p-5 flex flex-col gap-4 font-archivo-narrow text-base text-on-surface">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-space-grotesk font-bold text-xs uppercase">Preferred AI model</label>
                    <select
                      value={settings.aiPrefs.model}
                      onChange={(e) => saveSettings({
                        ...settings,
                        aiPrefs: { ...settings.aiPrefs, model: e.target.value }
                      })}
                      className="bg-white border-2 border-on-surface p-2 text-sm font-space-grotesk font-bold text-[#1a1b22]"
                    >
                      <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                      <option value="GPT-4o">GPT-4o</option>
                      <option value="GPT-4o-mini">GPT-4o-mini</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-space-grotesk font-bold text-xs uppercase">Response length</label>
                    <div className="flex border-2 border-on-surface p-1 bg-white rounded-sm">
                      {['short', 'medium', 'long'].map((len) => (
                        <button
                          key={len}
                          onClick={() => saveSettings({
                            ...settings,
                            aiPrefs: { ...settings.aiPrefs, responseLength: len as any }
                          })}
                          className={`flex-grow px-2 py-1 font-space-grotesk font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                            settings.aiPrefs.responseLength === len ? 'bg-[#ffe251] text-on-surface' : 'text-on-surface/50'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-surface p-3 border-2 border-on-surface shadow-[2px_2px_0_rgba(0,0,0,1)] rounded mt-2">
                  <span className="font-bold">Enable active study mode</span>
                  <button
                    onClick={() => saveSettings({
                      ...settings,
                      aiPrefs: { ...settings.aiPrefs, studyMode: !settings.aiPrefs.studyMode }
                    })}
                    className={`w-12 h-6 rounded-full border-2 border-on-surface transition-colors cursor-pointer relative p-0.5 ${
                      settings.aiPrefs.studyMode ? 'bg-[#4ade80]' : 'bg-surface-container-high'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-on-surface border border-on-surface transition-all ${
                      settings.aiPrefs.studyMode ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <button
                  onClick={() => handleActionClick('clear_chat')}
                  className="w-full mt-2 bg-[#ff5c5c] text-white border-3 border-on-surface py-2 font-space-grotesk font-bold text-xs uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-center"
                >
                  Clear AI chat history
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Calendar */}
          <div className="border-3 border-on-surface bg-background rounded shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
            <button
              onClick={() => toggleSection(6)}
              className="w-full flex justify-between items-center p-4 bg-surface-container border-b-3 border-on-surface font-anton text-lg uppercase text-on-surface cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">calendar_today</span>
                5. Calendar configurations
              </span>
              <span className="material-symbols-outlined">
                {expandedSections[6] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedSections[6] && (
              <div className="p-5 flex flex-col gap-4 font-archivo-narrow text-base text-on-surface">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold">Default calendar view</h3>
                    <p className="text-on-surface-variant text-sm">Select defaults for timetable dashboard.</p>
                  </div>
                  <div className="flex border-3 border-on-surface p-1 bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] rounded-sm">
                    {['day', 'week'].map((v) => (
                      <button
                        key={v}
                        onClick={() => saveSettings({
                          ...settings,
                          calendarPrefs: { ...settings.calendarPrefs, defaultView: v as any }
                        })}
                        className={`px-3 py-1 font-space-grotesk font-bold text-xs uppercase transition-colors cursor-pointer ${
                          settings.calendarPrefs.defaultView === v ? 'bg-[#ffe251] text-on-surface' : 'text-on-surface/50'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Section 6: About */}
          <div className="border-3 border-on-surface bg-background rounded shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
            <button
              onClick={() => toggleSection(9)}
              className="w-full flex justify-between items-center p-4 bg-surface-container border-b-3 border-on-surface font-anton text-lg uppercase text-on-surface cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                6. About StudentOS
              </span>
              <span className="material-symbols-outlined">
                {expandedSections[9] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedSections[9] && (
              <div className="p-5 flex flex-col gap-4 font-archivo-narrow text-base text-on-surface">
                <div className="flex justify-between border-b border-on-surface/10 pb-3">
                  <span className="font-bold">App Version</span>
                  <span className="font-space-grotesk font-bold text-xs uppercase bg-[#ffe251] px-2 py-0.5 border-2 border-on-surface shadow-[1px_1px_0_rgba(0,0,0,1)]">
                    v1.2.0
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Link href="#" className="bg-white border-2 border-on-surface p-3 font-space-grotesk font-bold text-xs uppercase text-center shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-on-surface">
                    Privacy Policy
                  </Link>
                  <Link href="#" className="bg-white border-2 border-on-surface p-3 font-space-grotesk font-bold text-xs uppercase text-center shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-on-surface">
                    Terms & Conditions
                  </Link>
                  <button 
                    onClick={() => showToast('Connecting support ticket portal...')}
                    className="col-span-2 bg-white border-2 border-on-surface p-3 font-space-grotesk font-bold text-xs uppercase text-center shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-on-surface"
                  >
                    Contact support
                  </button>
                </div>
              </div>
            )}
          </div>

        </section>
      </main>

      {/* Clear Chat Modal */}
      <ClearChatModal
        isOpen={activeModal === 'clear_chat'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleClearChat}
        isClearing={isClearingChat}
      />

      {/* Confirmation Modal */}
      {activeModal && activeModal !== 'clear_chat' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div 
            className="absolute inset-0 cursor-default" 
            onClick={() => setActiveModal(null)} 
          />
          <div className="bg-[#F5F0DC] text-[#1A1A2E] border-4 border-on-surface p-6 rounded-lg w-full max-w-sm relative rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)] z-10 animate-in zoom-in-95 duration-100">
            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#ff5c5c]">
              Are you sure?
            </h3>
            
            <p className="font-archivo-narrow text-base font-bold mb-6 text-on-surface">
              {activeModal === 'delete_data' && 'This will clear all dashboard entries, notes, timetable classes, and assignments saved in your browser local storage.'}
              {activeModal === 'delete_account' && 'Permanently delete your profile parameters and signout of the university session?'}
            </p>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border-3 border-on-surface font-space-grotesk font-bold uppercase text-xs rounded-full hover:bg-background cursor-pointer text-on-surface"
              >
                No, Go Back
              </button>
              <button
                onClick={executeModalAction}
                className="px-5 py-2 bg-[#ff5c5c] text-white border-3 border-on-surface font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2.5px] hover:translate-y-[2.5px] hover:shadow-none transition-all cursor-pointer"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 bg-[#4ade80] text-on-surface border-4 border-on-surface py-3 px-6 rounded shadow-[4px_4px_0px_var(--shadow-color)] z-50 animate-bounce font-space-grotesk font-bold text-sm uppercase">
          {message}
        </div>
      )}

      <Footer />
    </div>
  );
}

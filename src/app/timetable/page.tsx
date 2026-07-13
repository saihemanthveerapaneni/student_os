'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '../../utils/api';

interface ClassBlock {
  id: string;
  subject: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // '08:00'
  endTime: string; // '09:30'
  location: string;
  colorClass: string; // e.g. 'bg-primary text-white'
  textColor: string;
}

const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function TimetablePage() {
  const [viewMode, setViewMode] = useState<'WEEK' | 'DAY'>('WEEK');
  const [activeDay, setActiveDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [blocks, setBlocks] = useState<ClassBlock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [day, setDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [startHour, setStartHour] = useState('08:00');
  const [duration, setDuration] = useState('1.5');
  const [colorScheme, setColorScheme] = useState('bg-primary');

  // Load from API on mount
  const loadTimetable = async () => {
    try {
      const list = await api.getTimetable();
      setBlocks(list as any[]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const getPositionStyles = (block: ClassBlock) => {
    const startParts = block.startTime.split(':');
    const startH = parseInt(startParts[0]);
    const startM = parseInt(startParts[1]) || 0;

    const endParts = block.endTime.split(':');
    const endH = parseInt(endParts[0]);
    const endM = parseInt(endParts[1]) || 0;

    const startDecimal = startH + startM / 60;
    const endDecimal = endH + endM / 60;
    const durationHrs = endDecimal - startDecimal;

    // Grid starts at 08:00
    const topOffset = (startDecimal - 8) * 100; // 100px per hour
    const heightVal = durationHrs * 100 - 10; // slightly shorter for gap

    return {
      top: `${topOffset}px`,
      height: `${heightVal}px`,
    };
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !location) return;

    const startH = parseInt(startHour.split(':')[0]);
    const durationNum = parseFloat(duration);
    const endDecimal = startH + durationNum;
    
    const endH = Math.floor(endDecimal);
    const endM = (endDecimal - endH) * 60;
    const formattedEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    let textColor = 'text-on-surface';
    if (colorScheme === 'bg-primary') {
      textColor = 'text-white';
    }

    const newBlock = {
      subject,
      location,
      day,
      startTime: startHour,
      endTime: formattedEnd,
      colorClass: colorScheme,
      textColor,
    };

    try {
      await api.addTimetableItem(newBlock);
      await loadTimetable();
    } catch (e) {
      console.error(e);
    }
    
    // Reset Form
    setSubject('');
    setLocation('');
    setDay('Monday');
    setStartHour('08:00');
    setDuration('1.5');
    setColorScheme('bg-primary');
    setIsModalOpen(false);
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await api.deleteTimetableItem(id);
      await loadTimetable();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col quadrille-bg">
      <Navbar />

      <main className="flex-grow w-full px-6 md:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto relative">
        {/* Header Controls */}
        <header className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="transform -rotate-1 self-start">
            <h1 className="font-anton text-4xl md:text-5xl text-on-surface uppercase tracking-wider">
              TIMETABLE
            </h1>
            <p className="font-archivo-narrow text-base text-on-surface bg-secondary-container inline-block px-2 py-1 neubrutal-border mt-2 rotate-1">
              Your weekly grind, visualised.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-6 py-2 font-space-grotesk font-bold rounded-sm neubrutal-border neubrutal-shadow transition-all cursor-pointer ${
                viewMode === 'WEEK'
                  ? 'bg-primary text-white translate-x-0.5 translate-y-0.5 shadow-none'
                  : 'bg-white text-on-surface hover:bg-surface-container-low'
              }`}
            >
              WEEK
            </button>
            <button
              onClick={() => setViewMode('DAY')}
              className={`px-6 py-2 font-space-grotesk font-bold rounded-sm neubrutal-border neubrutal-shadow transition-all cursor-pointer ${
                viewMode === 'DAY'
                  ? 'bg-primary text-white translate-x-0.5 translate-y-0.5 shadow-none'
                  : 'bg-white text-on-surface hover:bg-surface-container-low'
              }`}
            >
              DAY
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#ffe251] text-on-surface font-space-grotesk font-bold px-6 py-2 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span> Add Class
            </button>
          </div>
        </header>

        {/* Day Selectors for Mobile/Day View */}
        {viewMode === 'DAY' && (
          <div className="flex flex-wrap gap-2 justify-center">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`px-4 py-2 font-space-grotesk font-bold rounded-full neubrutal-border neubrutal-shadow transition-all cursor-pointer ${
                  activeDay === d
                    ? 'bg-secondary-container text-on-surface translate-x-0.5 translate-y-0.5 shadow-none'
                    : 'bg-white text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Timetable Grid */}
        <div className="bg-background neubrutal-border neubrutal-shadow p-6 rounded-lg overflow-x-auto text-[#1A1A2E]">
          <div className="min-w-[800px]">
            {/* Grid Header */}
            <div className="grid grid-cols-[100px_repeat(6,1fr)] border-b-4 border-on-surface pb-4 font-space-grotesk font-bold uppercase text-center text-on-surface">
              <div>Time</div>
              {viewMode === 'WEEK' ? (
                days.map((d) => <div key={d}>{d}</div>)
              ) : (
                <div className="col-span-6">{activeDay}</div>
              )}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-[100px_repeat(6,1fr)] relative pt-4">
              {/* Hour Labels */}
              <div className="flex flex-col gap-[76px] font-space-grotesk font-bold text-on-surface-variant pt-2 text-center">
                {hours.map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>

              {/* Time slots grid lines (Absolute positioning for dashed lines) */}
              <div className="absolute left-[100px] right-0 top-0 bottom-0 pointer-events-none flex flex-col justify-between py-5">
                {hours.map((h) => (
                  <div key={h} className="border-t-2 border-dashed border-on-surface/20 w-full" />
                ))}
              </div>

              {/* Timetable Blocks */}
              {viewMode === 'WEEK' ? (
                days.map((d) => {
                  const dayBlocks = blocks.filter((b) => b.day === d);
                  return (
                    <div key={d} className="relative h-[600px] border-r-2 border-on-surface/5 last:border-r-0">
                      {dayBlocks.map((b) => {
                        const style = getPositionStyles(b);
                        const isEven = b.id.charCodeAt(b.id.length - 1) % 2 === 0;
                        return (
                          <div
                            key={b.id}
                            style={style}
                            className={`absolute left-2 right-2 p-3 neubrutal-border neubrutal-shadow rounded ${
                              b.colorClass
                            } ${b.textColor} ${
                              isEven ? 'rotate-1' : '-rotate-1'
                            } hover:rotate-0 hover:scale-[1.02] transition-all duration-200 z-10 flex flex-col justify-between`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteBlock(b.id);
                              }}
                              className="absolute top-1 right-1 text-xs opacity-75 hover:opacity-100 hover:scale-110 transition-all font-bold cursor-pointer bg-white text-on-surface border-2 border-on-surface w-5 h-5 rounded-full flex items-center justify-center shadow-[1px_1px_0_rgba(0,0,0,1)]"
                              title="Delete class block"
                            >
                              ×
                            </button>
                            <div>
                              <div className="font-space-grotesk font-bold text-sm leading-tight pr-3">
                                {b.subject}
                              </div>
                              <div className="font-archivo-narrow text-xs opacity-90 mt-1">
                                {b.startTime} - {b.endTime}
                              </div>
                            </div>
                            <div className="font-space-grotesk font-bold text-[10px] bg-background text-on-surface px-1 py-0.5 border border-on-surface rounded w-max mt-2">
                              {b.location}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                /* Day View Body (stretch columns to span whole width) */
                <div className="col-span-6 relative h-[600px] px-4">
                  {blocks
                    .filter((b) => b.day === activeDay)
                    .map((b) => {
                      const style = getPositionStyles(b);
                      return (
                        <div
                          key={b.id}
                          style={style}
                          className={`absolute left-4 right-4 p-4 neubrutal-border neubrutal-shadow rounded ${
                            b.colorClass
                          } ${b.textColor} hover:scale-[1.01] transition-all duration-200 z-10 flex flex-col justify-between`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteBlock(b.id);
                            }}
                            className="absolute top-2 right-2 text-sm opacity-75 hover:opacity-100 hover:scale-110 transition-all font-bold cursor-pointer bg-white text-on-surface border-2 border-on-surface w-6 h-6 rounded-full flex items-center justify-center shadow-[1px_1px_0_rgba(0,0,0,1)]"
                          >
                            ×
                          </button>
                          <div>
                            <div className="font-space-grotesk font-bold text-lg leading-tight pr-6">
                              {b.subject}
                            </div>
                            <div className="font-archivo-narrow text-sm opacity-90 mt-1">
                              {b.startTime} - {b.endTime}
                            </div>
                          </div>
                          <div className="font-space-grotesk font-bold text-xs bg-background text-on-surface px-2.5 py-1 border-2 border-on-surface rounded w-max mt-4">
                            {b.location}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F0DC] text-[#1A1A2E] border-4 border-on-surface p-6 rounded-lg w-full max-w-md relative rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)] z-10 animate-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface hover:scale-110 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
              Add Class Block
            </h3>

            <form onSubmit={handleAddBlock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Class/Subject Name</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  placeholder="e.g. Advanced Physics"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Room / Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  placeholder="e.g. Room 402"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as any)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Start Hour</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  >
                    <option value="1">1 Hour</option>
                    <option value="1.5">1.5 Hours</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Card Color</label>
                  <select
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                  >
                    <option value="bg-primary">Blue</option>
                    <option value="bg-secondary-container">Yellow</option>
                    <option value="bg-tertiary-fixed">Red</option>
                    <option value="bg-primary-fixed-dim">Light Blue</option>
                    <option value="bg-secondary text-white">Green</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 bg-[#ffe251] text-on-surface border-3 border-on-surface py-3 font-space-grotesk font-bold uppercase tracking-wider neubrutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer"
              >
                Add to Timetable
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

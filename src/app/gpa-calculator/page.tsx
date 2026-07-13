'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '../../utils/api';

interface CourseGrade {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

// Grade Points Mapping (10 point scale)
const gradePoints: Record<string, number> = {
  'A+': 10.0,
  'A': 9.0,
  'B+': 8.0,
  'B': 7.0,
  'C+': 6.0,
  'C': 5.0,
  'D': 4.0,
  'F': 0.0,
};

const gradesList = Object.keys(gradePoints);

export default function GPACalculatorPage() {
  const [courses, setCourses] = useState<CourseGrade[]>([]);
  const [reverseMode, setReverseMode] = useState(false);
  const [targetSGPA, setTargetSGPA] = useState(8.6);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [newGrade, setNewGrade] = useState('A');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadGpaSubjects = async () => {
    try {
      const list = await api.getGpaSubjects();
      setCourses(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Load from API on mount
  useEffect(() => {
    loadGpaSubjects();
  }, []);

  const handleUpdateCourse = async (id: string, field: 'credits' | 'grade', value: any) => {
    try {
      await api.updateGpaSubject(id, { [field]: value });
      await loadGpaSubjects();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const newCourse = {
      name: newCourseName,
      credits: newCredits,
      grade: newGrade,
    };

    try {
      await api.addGpaSubject(newCourse);
      await loadGpaSubjects();
    } catch (e) {
      console.error(e);
    }
    
    setNewCourseName('');
    setNewCredits(3);
    setNewGrade('A');
    setIsModalOpen(false);
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await api.deleteGpaSubject(id);
      await loadGpaSubjects();
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate standard GPA
  let totalCredits = 0;
  let totalPoints = 0;

  courses.forEach((course) => {
    const points = gradePoints[course.grade];
    if (points !== undefined) {
      totalCredits += course.credits;
      totalPoints += course.credits * points;
    }
  });

  const semesterGPA = totalCredits === 0 ? 0 : Math.round((totalPoints / totalCredits) * 100) / 100;

  // Calculate required target grades in reverse mode
  const getRequiredGrades = (): { courseId: string; grade: string; marks: string }[] => {
    if (totalCredits === 0) return [];
    
    const targetPointsNeeded = targetSGPA * totalCredits;
    let accumulatedPoints = 0;
    
    const sorted = [...courses].sort((a, b) => b.credits - a.credits);
    const resultsMap: Record<string, { grade: string; marks: string }> = {};
    
    sorted.forEach((course, idx) => {
      const remainingCourses = sorted.slice(idx + 1);
      const remainingCredits = remainingCourses.reduce((sum, c) => sum + c.credits, 0);
      
      let chosenGrade = 'F';
      let chosenMarks = '< 40%';
      
      const gradesInOrder = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
      const marksMap: Record<string, string> = {
        'F': '< 40% Marks',
        'D': '40-50% Marks',
        'C': '50-60% Marks',
        'C+': '60-70% Marks',
        'B': '70-75% Marks',
        'B+': '75-80% Marks',
        'A': '80-90% Marks',
        'A+': '> 90% Marks',
      };
      
      for (const g of gradesInOrder) {
        const pts = gradePoints[g];
        const prospectiveTotal = accumulatedPoints + (course.credits * pts) + (remainingCredits * 10.0);
        if (prospectiveTotal >= targetPointsNeeded) {
          chosenGrade = g;
          chosenMarks = marksMap[g];
          break;
        }
      }
      
      accumulatedPoints += course.credits * gradePoints[chosenGrade];
      resultsMap[course.id] = { grade: chosenGrade, marks: chosenMarks };
    });
    
    return courses.map((c) => ({
      courseId: c.id,
      grade: resultsMap[c.id]?.grade || 'A',
      marks: resultsMap[c.id]?.marks || '> 80%',
    }));
  };

  const reverseModeResults = getRequiredGrades();

  return (
    <div className="min-h-screen flex flex-col quadrille-bg">
      <Navbar />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 md:px-8 py-8 flex flex-col gap-8 text-[#1A1A2E]">
        {/* Header Controls */}
        <header className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="transform -rotate-1 self-start">
            <h1 className="font-anton text-4xl md:text-5xl text-on-surface uppercase tracking-wider">
              GPA CRUNCHER
            </h1>
            <p className="font-archivo-narrow text-base text-on-surface bg-secondary-container inline-block px-2 py-1 neubrutal-border mt-2 rotate-1">
              Calculate semester targets with cold hard math.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Mode Toggle Switch */}
            <div className="flex border-3 border-on-surface p-1 bg-white shadow-[2px_2px_0_var(--shadow-color)] rounded-sm">
              <button
                onClick={() => setReverseMode(false)}
                className={`px-3 py-1.5 font-space-grotesk font-bold text-xs uppercase transition-colors cursor-pointer ${
                  !reverseMode ? 'bg-[#ffe251] text-on-surface' : 'text-on-surface/60 hover:text-on-surface'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setReverseMode(true)}
                className={`px-3 py-1.5 font-space-grotesk font-bold text-xs uppercase transition-colors cursor-pointer ${
                  reverseMode ? 'bg-[#ffe251] text-on-surface' : 'text-on-surface/60 hover:text-on-surface'
                }`}
              >
                Reverse (Target)
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#ffe251] text-on-surface font-space-grotesk font-bold px-6 py-3 rounded-full neubrutal-border neubrutal-shadow neubrutal-hover hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer text-on-surface"
            >
              <span className="material-symbols-outlined">add</span>
              Add Course
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* GPA Score Widget */}
          <div className="bg-background neubrutal-border neubrutal-shadow p-6 rounded-lg flex flex-col items-center justify-center text-center -rotate-1 gap-6">
            <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2 w-full text-left">
              Overview
            </h2>

            {reverseMode ? (
              /* REVERSE MODE OUTPUT RESULT CARD */
              <div className="bg-[#ff5c5c] text-white border-4 border-on-surface p-6 rounded shadow-[4px_4px_0_var(--shadow-color)] w-full rotate-2">
                <p className="font-space-grotesk font-bold text-xs uppercase tracking-wider mb-2 text-[#ffe251]">
                  Target SGPA
                </p>
                <h3 
                  className="font-anton text-6xl text-[#ffe251]"
                  style={{
                    textShadow: '3px 3px 0px #1a1b22, -1px -1px 0 #1a1b22, 1px -1px 0 #1a1b22, -1px 1px 0 #1a1b22, 1px 1px 0 #1a1b22'
                  }}
                >
                  {targetSGPA.toFixed(1)}
                </h3>
                <p className="font-archivo-narrow text-xs opacity-90 mt-3 font-bold bg-[#1a1b22] py-1 px-2 border-2 border-white rounded text-white">
                  Calculated grades listed below!
                </p>
              </div>
            ) : (
              /* STANDARD MODE OUTPUT RESULT CARD */
              <div className="bg-primary text-white border-4 border-on-surface p-6 rounded shadow-[4px_4px_0_var(--shadow-color)] w-full rotate-2">
                <p className="font-space-grotesk font-bold text-xs uppercase tracking-wider mb-2 text-[#ffe251]">
                  Your SGPA
                </p>
                <h3 
                  className="font-anton text-6xl text-[#ffe251]"
                  style={{
                    textShadow: '3px 3px 0px #1a1b22, -1px -1px 0 #1a1b22, 1px -1px 0 #1a1b22, -1px 1px 0 #1a1b22, 1px 1px 0 #1a1b22'
                  }}
                >
                  {semesterGPA.toFixed(2)}
                </h3>
                <p className="font-archivo-narrow text-xs opacity-80 mt-2 text-white">
                  Based on {totalCredits} total credits.
                </p>
              </div>
            )}

            <div className="bg-[#ffe251] text-[#1a1b22] border-4 border-on-surface p-4 rounded shadow-[4px_4px_0_var(--shadow-color)] w-full -rotate-1">
              <p className="font-space-grotesk font-bold text-xs uppercase tracking-wider mb-1">
                Cumulative CGPA
              </p>
              <h4 className="font-anton text-3xl">{courses.length > 0 ? semesterGPA.toFixed(2) : '—'}</h4>
              <p className="font-archivo-narrow text-[10px] uppercase font-bold opacity-60">
                {courses.length > 0 ? 'Based on your entered courses' : 'Add courses to see your GPA'}
              </p>
            </div>
          </div>

          {/* Courses Form Table Widget */}
          <div className="md:col-span-2 bg-[#F5F0DC] p-6 neubrutal-border neubrutal-shadow rounded-lg rotate-1 flex flex-col gap-4">
            <h2 className="font-anton text-xl text-on-surface uppercase border-b-3 border-on-surface pb-2 flex justify-between items-center">
              <span>{reverseMode ? 'Required Grades Calculator' : 'Semester 4 Courses'}</span>
              <span className="bg-background text-on-surface text-xs font-space-grotesk font-bold py-1 px-2 border-2 border-on-surface">
                {courses.length} courses
              </span>
            </h2>

            {reverseMode && (
              <div className="flex items-center gap-4 bg-background p-4 neubrutal-border rounded mb-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-2xl">track_changes</span>
                <div className="flex-grow flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Target SGPA Goal</label>
                  <input
                    type="range"
                    min="4.0"
                    max="10.0"
                    step="0.1"
                    value={targetSGPA}
                    onChange={(e) => setTargetSGPA(parseFloat(e.target.value))}
                    className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold font-space-grotesk mt-1">
                    <span>4.0</span>
                    <span className="text-primary font-anton text-base bg-secondary-container px-2 border border-on-surface">{targetSGPA.toFixed(1)}</span>
                    <span>10.0</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {courses.length > 0 ? (
                courses.map((course, idx) => {
                  const isEven = idx % 2 === 0;
                  const reverseResult = reverseModeResults.find((r) => r.courseId === course.id);

                  return (
                    <div
                      key={course.id}
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-background p-4 neubrutal-border rounded shadow-[2px_2px_0px_var(--shadow-color)] gap-4 text-on-surface ${
                        isEven ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]'
                      }`}
                    >
                      <div className="flex-grow">
                        <span className="font-space-grotesk font-bold text-base text-on-surface">
                          {course.name}
                        </span>
                        <div className="text-xs text-on-surface-variant font-archivo-narrow mt-1">
                          Credits: {course.credits}
                        </div>
                      </div>

                      {/* Select controls for Credits and Grade */}
                      <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                        {!reverseMode ? (
                          /* STANDARD MODE SELECTS */
                          <>
                            <div className="flex items-center gap-2">
                              <label className="font-space-grotesk font-bold text-xs uppercase text-on-surface-variant">
                                Credits:
                              </label>
                              <select
                                value={course.credits}
                                onChange={(e) =>
                                  handleUpdateCourse(course.id, 'credits', parseInt(e.target.value))
                                }
                                className="bg-white border-2 border-on-surface p-1 text-sm font-space-grotesk font-bold focus:outline-none text-[#1a1b22]"
                              >
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="font-space-grotesk font-bold text-xs uppercase text-on-surface-variant">
                                Grade:
                              </label>
                              <select
                                value={course.grade}
                                onChange={(e) => handleUpdateCourse(course.id, 'grade', e.target.value)}
                                className="bg-white border-2 border-on-surface p-1 text-sm font-space-grotesk font-bold focus:outline-none text-[#1a1b22]"
                              >
                                {gradesList.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          /* REVERSE MODE OUTPUT SHOWCASE */
                          <div className="flex items-center gap-3">
                            <span className="font-space-grotesk text-xs uppercase font-bold text-on-surface-variant">
                              Required:
                            </span>
                            <span className="bg-[#ff5c5c] text-white border-2 border-on-surface px-3 py-1 font-anton text-sm uppercase rounded shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                              {reverseResult?.grade}
                            </span>
                            <span className="bg-[#ffe251] text-[#1a1b22] border-2 border-on-surface px-2.5 py-1 font-space-grotesk font-bold text-xs uppercase rounded shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                              {reverseResult?.marks}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-on-surface hover:text-red-600 p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-background text-on-surface p-8 neubrutal-border rounded text-center font-space-grotesk font-bold uppercase">
                  No courses added. Click &quot;Add Course&quot; to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F0DC] text-[#1A1A2E] neubrutal-border neubrutal-shadow rounded-lg p-6 w-full max-w-md relative rotate-1 animate-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface hover:scale-110 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
              Add Course
            </h3>

            <form onSubmit={handleAddCourse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-space-grotesk font-bold text-xs uppercase">Course Name</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full bg-white border-3 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none text-[#1a1b22]"
                  placeholder="e.g. Modern Art History"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Credits</label>
                  <select
                    value={newCredits}
                    onChange={(e) => setNewCredits(parseInt(e.target.value))}
                    className="w-full bg-white border-3 border-on-surface p-2 font-space-grotesk font-bold focus:outline-none text-[#1a1b22]"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-space-grotesk font-bold text-xs uppercase">Expected Grade</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-white border-3 border-on-surface p-2 font-space-grotesk font-bold focus:outline-none text-[#1a1b22]"
                  >
                    {gradesList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 bg-[#ffe251] text-on-surface border-3 border-on-surface py-3 font-space-grotesk font-bold uppercase tracking-wider shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95 cursor-pointer text-center"
              >
                Add Course
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

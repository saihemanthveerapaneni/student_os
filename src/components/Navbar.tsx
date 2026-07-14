'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { api } from '../utils/api';
import { createClient } from '@/lib/supabase/client';

// Mappings for GPA points
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

interface CustomLink {
  label: string;
  url: string;
}

interface UserProfile {
  name: string;
  email: string;
  gender: string;
  class: string;
  section: string;
  year: string;
  student_id: string;
  phone: string;
  date_of_birth: string;
  bio: string;
  college_name: string;
  department: string;
  branch: string;
  semester: string;
  batch: string;
  advisor: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  skills: string[];
  interests: string[];
  certifications: string[];
  custom_links: CustomLink[];
}

const getGenderAvatar = (gender?: string) => {
  const normalizedGender = (gender || '').toLowerCase();

  if (normalizedGender === 'female') {
    return {
      icon: 'female',
      label: 'Female Profile Avatar',
      className: 'bg-[#ffb3d1] text-[#7a1243]',
    };
  }

  if (normalizedGender === 'male') {
    return {
      icon: 'male',
      label: 'Male Profile Avatar',
      className: 'bg-[#b4c5ff] text-[#093ea6]',
    };
  }

  return {
    icon: 'person',
    label: 'Student Profile Avatar',
    className: 'bg-[#ffe251] text-[#1a1b22]',
  };
};

const formatGender = (gender?: string) => {
  if (!gender) return 'Not set';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Collapsible cards toggle states
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(true);
  const [isSocialExpanded, setIsSocialExpanded] = useState(true);

  // Profile data state
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    gender: '',
    class: '',
    section: '',
    year: '',
    student_id: '',
    phone: '',
    date_of_birth: '',
    bio: '',
    college_name: '',
    department: '',
    branch: '',
    semester: '',
    batch: '',
    advisor: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    skills: [],
    interests: [],
    certifications: [],
    custom_links: [],
  });

  const [tempProfile, setTempProfile] = useState<UserProfile>({ ...profile });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      const tag = val.slice(0, -1).trim();
      if (tag && !(tempProfile.skills || []).includes(tag)) {
        setTempProfile((prev) => ({
          ...prev,
          skills: [...(prev.skills || []), tag]
        }));
      }
      setNewSkill('');
    } else {
      setNewSkill(val);
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      const tag = val.slice(0, -1).trim();
      if (tag && !(tempProfile.interests || []).includes(tag)) {
        setTempProfile((prev) => ({
          ...prev,
          interests: [...(prev.interests || []), tag]
        }));
      }
      setNewInterest('');
    } else {
      setNewInterest(val);
    }
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      const tag = val.slice(0, -1).trim();
      if (tag && !(tempProfile.certifications || []).includes(tag)) {
        setTempProfile((prev) => ({
          ...prev,
          certifications: [...(prev.certifications || []), tag]
        }));
      }
      setNewCertification('');
    } else {
      setNewCertification(val);
    }
  };

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'skills' | 'interests' | 'certifications',
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !(tempProfile[type] || []).includes(val)) {
        setTempProfile((prev) => ({
          ...prev,
          [type]: [...(prev[type] || []), val]
        }));
      }
      setInputValue('');
    }
  };

  const removeTag = (type: 'skills' | 'interests' | 'certifications', index: number) => {
    setTempProfile((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index)
    }));
  };

  // Live stat states loaded from other modules
  const [stats, setStats] = useState({
    cgpa: 0,
    credits: 0,
    attendancePct: 0,
    studyStreak: 0,
    assignmentsCompleted: 0,
    notesUploaded: 0,
  });

  // Load profile and compute statistics from api
  const loadProfileAndStats = async () => {
    // Load profile from API
    try {
      setProfileError(null);
      const data = await api.getProfile();
      setProfile((prev) => ({
        ...prev,
        ...data,
        skills: data.skills || [],
        interests: data.interests || [],
        certifications: data.certifications || [],
      }));
    } catch (e) {
      console.error(e);
      setProfileError("Unable to load profile — check your connection.");
      setProfile((prev) => ({
        ...prev,
        name: '',
        email: '',
        gender: '',
        class: '',
        section: '',
        year: '',
        student_id: '',
        phone: '',
        date_of_birth: '',
        bio: '',
        college_name: '',
        department: '',
        branch: '',
        semester: '',
        batch: '',
        advisor: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        skills: [],
        interests: [],
        certifications: [],
        custom_links: [],
      }));
    }

    // Compute Live Statistics
    let cgpaVal = 0;
    let creditsVal = 0;
    try {
      const list = await api.getGpaSubjects();
      let totCredits = 0;
      let totPoints = 0;
      list.forEach((sub: any) => {
        const pts = gradePoints[sub.grade];
        if (pts !== undefined) {
          totCredits += sub.credits;
          totPoints += sub.credits * pts;
        }
      });
      if (totCredits > 0) {
        cgpaVal = Math.round((totPoints / totCredits) * 10) / 10;
        creditsVal = totCredits;
      }
    } catch (e) {}

    let attPct = 0;
    try {
      const list = await api.getAttendance();
      let attended = 0;
      let total = 0;
      list.forEach((item: any) => {
        attended += item.attended;
        total += item.total;
      });
      if (total > 0) {
        attPct = Math.round((attended / total) * 100);
      }
    } catch (e) {}

    let notesCount = 0;
    try {
      const notesList = await api.getNotes();
      notesCount = notesList.length;
    } catch (e) {}

    let doneAssignments = 0;
    try {
      const assignmentsList = await api.getAssignments();
      doneAssignments = assignmentsList.filter((a: any) => a.status === 'done').length;
    } catch (e) {}

    setStats({
      cgpa: cgpaVal,
      credits: creditsVal,
      attendancePct: attPct,
      studyStreak: 5,
      assignmentsCompleted: doneAssignments,
      notesUploaded: notesCount,
    });
  };

  useEffect(() => {
    loadProfileAndStats();
    
    // Refresh stats when storage updates or focus returns
    window.addEventListener('storage', loadProfileAndStats);
    return () => {
      window.removeEventListener('storage', loadProfileAndStats);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const handleOpenProfileModal = () => {
      setTempProfile({ ...profile });
      setIsEditingProfile(true);
      setIsProfileOpen(true);
    };
    window.addEventListener('open-profile-modal', handleOpenProfileModal);
    return () => window.removeEventListener('open-profile-modal', handleOpenProfileModal);
  }, [profile]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.updateProfile(tempProfile);
      if (response && response.status === 'success') {
        let updatedProfile = tempProfile;
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          updatedProfile = {
            ...tempProfile,
            ...response.data[0],
            skills: response.data[0].skills || [],
            interests: response.data[0].interests || [],
            certifications: response.data[0].certifications || [],
            custom_links: response.data[0].custom_links || tempProfile.custom_links || [],
          };
        } else if (response.updated_data) {
          updatedProfile = {
            ...tempProfile,
            ...response.updated_data,
            skills: response.updated_data.skills || [],
            interests: response.updated_data.interests || [],
            certifications: response.updated_data.certifications || [],
            custom_links: response.updated_data.custom_links || tempProfile.custom_links || [],
          };
        }
        setProfile(updatedProfile);
      } else {
        setProfile(tempProfile);
      }
    } catch (e) {
      console.error(e);
      setProfile(tempProfile);
    }
    setIsEditingProfile(false);
  };

  const navItems = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Timetable', path: '/timetable' },
    { name: 'Notes', path: '/notes' },
    { name: 'Assignments', path: '/assignments' },
    { name: 'Attendance', path: '/attendance' },
    { name: 'GPA', path: '/gpa-calculator' },
    { name: 'AI Assistant', path: '/ai-assistant' },
  ];

  const avatar = getGenderAvatar(profile.gender);

  return (
    <header className="w-full sticky top-0 z-50 bg-background border-b-4 border-on-surface shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-colors duration-200">
      <div className="flex justify-between items-center w-full px-6 md:px-8 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <span className="font-anton text-2xl md:text-3xl bg-secondary-container px-3 py-1 border-4 border-on-surface shadow-[4px_4px_0px_0px_var(--shadow-color)] text-on-surface block hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all uppercase cursor-pointer">
              StudentOS
            </span>
          </Link>

          {/* Search bar inside Navbar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface z-10">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-3 border-on-surface rounded-full bg-surface-container-highest text-on-surface font-space-grotesk font-bold focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_var(--shadow-color)]"
              placeholder="Search..."
            />
          </form>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`font-space-grotesk font-bold text-base hover:translate-x-0.5 hover:translate-y-0.5 transition-all py-1 px-2 ${
                  isActive
                    ? 'text-primary underline decoration-4 underline-offset-8'
                    : 'text-on-surface'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Search, Toggle and Profile */}
        <div className="flex items-center gap-4 relative">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border-3 border-on-surface bg-secondary-container text-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Avatar Profile Button */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-10 h-10 rounded-full border-3 border-on-surface shadow-[2px_2px_0px_0px_var(--shadow-color)] flex items-center justify-center cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${avatar.className}`}
              title={avatar.label}
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">{avatar.icon}</span>
              <span className="sr-only">{avatar.label}</span>
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-3 w-48 bg-[#F5F0DC] text-[#1A1A2E] border-3 border-on-surface shadow-[4px_4px_0_rgba(0,0,0,1)] rounded-lg p-2 z-50 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setTempProfile({ ...profile });
                      setIsEditingProfile(false);
                      setIsProfileOpen(true);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-high rounded font-space-grotesk font-bold uppercase text-xs text-left w-full cursor-pointer text-[#1A1A2E]"
                  >
                    <span className="material-symbols-outlined text-base">person</span>
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/settings');
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-high rounded font-space-grotesk font-bold uppercase text-xs text-left w-full cursor-pointer text-[#1A1A2E]"
                  >
                    <span className="material-symbols-outlined text-base">settings</span>
                    Settings
                  </button>
                  <div className="border-t-2 border-on-surface my-1" />
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      api.clearCachedUserData();
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      router.push('/signin');
                      router.refresh();
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-high rounded font-space-grotesk font-bold uppercase text-xs text-left w-full cursor-pointer text-[#E8734A]"
                  >
                    <span className="material-symbols-outlined text-base text-[#E8734A]">logout</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-full border-3 border-on-surface bg-primary-fixed text-on-surface flex items-center justify-center shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span className="material-symbols-outlined">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div className="md:hidden w-full border-t-4 border-on-surface bg-background p-4 flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface z-10">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-3 border-on-surface rounded-full bg-surface-container-highest text-on-surface font-space-grotesk font-bold focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_var(--shadow-color)]"
              placeholder="Search..."
            />
          </form>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`font-space-grotesk font-bold text-base py-2 px-3 border-2 border-on-surface rounded shadow-[2px_2px_0px_0px_var(--shadow-color)] ${
                    isActive ? 'bg-primary text-white' : 'bg-surface text-on-surface'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Screen 1.5 — Profile Panel Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="absolute inset-0 cursor-default" 
            onClick={() => setIsProfileOpen(false)} 
          />
          
          <div className="bg-[#F5F0DC] text-[#1A1A2E] border-4 border-on-surface p-6 rounded-lg w-full max-w-2xl relative rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)] z-50 my-8 animate-in zoom-in-95 duration-150">
            {/* Header: Avatar, Name, Edit Profile Button, Close Button */}
            <header className="flex justify-between items-center border-b-4 border-on-surface pb-4 mb-6 relative">
              {/* Close "X" Button (top-left) */}
              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-10 h-10 border-3 border-on-surface bg-white text-on-surface rounded-full flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold">close</span>
              </button>

              <div className="flex items-center gap-4 pl-2">
                <div className={`w-16 h-16 rounded-full border-3 border-on-surface shadow-[2px_2px_0_rgba(0,0,0,1)] cursor-pointer hover:rotate-6 transition-transform flex items-center justify-center ${avatar.className}`}>
                  <span className="material-symbols-outlined text-4xl" aria-hidden="true">{avatar.icon}</span>
                  <span className="sr-only">{avatar.label}</span>
                </div>
                <h1 className="font-anton text-2xl md:text-3xl uppercase tracking-wider text-on-surface truncate max-w-[250px]">
                  {profileError ? 'Error' : profile.name}
                </h1>
              </div>


            </header>

            {/* Scrollable Modal Content */}
            <div className="max-h-[50vh] overflow-y-auto pr-2 flex flex-col gap-6">
              {profileError && (
                <div className="bg-[#ff5c5c]/10 border-2 border-[#ff5c5c] text-[#ff5c5c] px-4 py-3 font-space-grotesk font-bold text-sm">
                  {profileError}
                </div>
              )}
              {isEditingProfile ? (
                /* EDIT MODE COMPONENT */
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                  {/* Basic Info Editor */}
                  <div className="bg-[#FAF8FF] border-3 border-on-surface p-4 rounded-lg flex flex-col gap-4">
                    <h2 className="font-anton text-base uppercase text-primary border-b-2 border-on-surface pb-1">
                      Edit Basic Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          value={tempProfile.name || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Student Roll ID</label>
                        <input
                          type="text"
                          required
                          value={tempProfile.student_id || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, student_id: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">University Email</label>
                        <input
                          type="email"
                          required
                          value={tempProfile.email || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={tempProfile.phone || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Date of Birth</label>
                        <input
                          type="date"
                          required
                          value={tempProfile.date_of_birth || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, date_of_birth: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none text-[#1a1b22]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Gender</label>
                        <select
                          required
                          value={tempProfile.gender || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, gender: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none text-[#1a1b22]"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Bio / About</label>
                        <textarea
                          value={tempProfile.bio || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, bio: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic Info Editor */}
                  <div className="bg-[#FAF8FF] border-3 border-on-surface p-4 rounded-lg flex flex-col gap-4">
                    <h2 className="font-anton text-base uppercase text-secondary-container border-b-2 border-on-surface pb-1">
                      Edit Academic Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">College Name</label>
                        <input
                          type="text"
                          value={tempProfile.college_name || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, college_name: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Department</label>
                        <input
                          type="text"
                          value={tempProfile.department || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, department: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Branch / Major</label>
                        <input
                          type="text"
                          value={tempProfile.branch || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, branch: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="font-space-grotesk font-bold text-xs uppercase">Year</label>
                          <input
                            type="text"
                            value={tempProfile.year || ''}
                            onChange={(e) => setTempProfile({ ...tempProfile, year: e.target.value })}
                            className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-space-grotesk font-bold text-xs uppercase">Section</label>
                          <input
                            type="text"
                            value={tempProfile.section || ''}
                            onChange={(e) => setTempProfile({ ...tempProfile, section: e.target.value })}
                            className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EDIT SKILLS & BADGES */}
                  <div className="bg-[#FAF8FF] border-3 border-on-surface p-4 rounded-lg flex flex-col gap-4">
                    <h2 className="font-anton text-base uppercase text-[#ffe251] [-webkit-text-stroke:1px_#1a1b22] border-b-2 border-on-surface pb-1 flex justify-between items-center">
                      <span>EDIT SKILLS & BADGES</span>
                      <span className="material-symbols-outlined text-sm text-on-surface">construction</span>
                    </h2>
                    <div className="flex flex-col gap-4">
                      {/* DEVELOPMENT SKILLS */}
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Development Skills</label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white border-2 border-on-surface min-h-[42px] items-center">
                          {(tempProfile.skills || []).map((s, idx) => (
                            <span key={idx} className="bg-background text-on-surface border-2 border-on-surface px-2.5 py-0.5 rounded-full font-space-grotesk font-bold text-xs flex items-center gap-1">
                              {s}
                              <button
                                type="button"
                                onClick={() => removeTag('skills', idx)}
                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-on-surface/10 cursor-pointer text-on-surface focus:outline-none"
                              >
                                <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder={(tempProfile.skills || []).length === 0 ? "Type skill & press Enter or comma..." : ""}
                            value={newSkill}
                            onChange={handleSkillChange}
                            onKeyDown={(e) => handleTagKeyDown(e, 'skills', newSkill, setNewSkill)}
                            className="flex-grow min-w-[120px] bg-transparent text-sm font-archivo-narrow focus:outline-none border-none p-0"
                          />
                        </div>
                      </div>

                      {/* INTERESTS */}
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Interests</label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white border-2 border-on-surface min-h-[42px] items-center">
                          {(tempProfile.interests || []).map((i, idx) => (
                            <span key={idx} className="bg-secondary-container text-on-surface border-2 border-on-surface px-2.5 py-0.5 rounded-full font-space-grotesk font-bold text-xs flex items-center gap-1">
                              {i}
                              <button
                                type="button"
                                onClick={() => removeTag('interests', idx)}
                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-on-surface/10 cursor-pointer text-on-surface focus:outline-none"
                              >
                                <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder={(tempProfile.interests || []).length === 0 ? "Type interest & press Enter or comma..." : ""}
                            value={newInterest}
                            onChange={handleInterestChange}
                            onKeyDown={(e) => handleTagKeyDown(e, 'interests', newInterest, setNewInterest)}
                            className="flex-grow min-w-[120px] bg-transparent text-sm font-archivo-narrow focus:outline-none border-none p-0"
                          />
                        </div>
                      </div>

                      {/* CERTIFICATIONS */}
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase">Certifications</label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white border-2 border-on-surface min-h-[42px] items-center">
                          {(tempProfile.certifications || []).map((c, idx) => (
                            <span key={idx} className="bg-[#ffb59d] text-on-surface border-2 border-on-surface px-2.5 py-0.5 rounded-full font-space-grotesk font-bold text-xs flex items-center gap-1">
                              {c}
                              <button
                                type="button"
                                onClick={() => removeTag('certifications', idx)}
                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-on-surface/10 cursor-pointer text-on-surface focus:outline-none"
                              >
                                <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder={(tempProfile.certifications || []).length === 0 ? "Type certification & press Enter or comma..." : ""}
                            value={newCertification}
                            onChange={handleCertChange}
                            onKeyDown={(e) => handleTagKeyDown(e, 'certifications', newCertification, setNewCertification)}
                            className="flex-grow min-w-[120px] bg-transparent text-sm font-archivo-narrow focus:outline-none border-none p-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links Editor */}
                  <div className="bg-[#d4f7e2] border-3 border-on-surface p-4 rounded-lg flex flex-col gap-4">
                    <h2 className="font-anton text-base uppercase text-[#0d3f1d] border-b-2 border-on-surface pb-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">share</span>
                      Social Links
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">business_center</span>
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={tempProfile.linkedin_url || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, linkedin_url: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                          placeholder="https://linkedin.com/in/yourname"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-space-grotesk font-bold text-xs uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">terminal</span>
                          GitHub URL
                        </label>
                        <input
                          type="url"
                          value={tempProfile.github_url || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, github_url: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                          placeholder="https://github.com/yourhandle"
                        />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="font-space-grotesk font-bold text-xs uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">language</span>
                          Portfolio / Website URL
                        </label>
                        <input
                          type="url"
                          value={tempProfile.portfolio_url || ''}
                          onChange={(e) => setTempProfile({ ...tempProfile, portfolio_url: e.target.value })}
                          className="w-full bg-white border-2 border-on-surface p-2 font-archivo-narrow text-base focus:outline-none"
                          placeholder="https://yourportfolio.dev"
                        />
                      </div>
                    </div>

                    {/* Custom Links */}
                    <div className="flex flex-col gap-3">
                      <h3 className="font-space-grotesk font-bold text-xs uppercase text-[#0d3f1d]">Custom Links</h3>
                      {(tempProfile.custom_links || []).map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const updated = [...tempProfile.custom_links];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setTempProfile({ ...tempProfile, custom_links: updated });
                            }}
                            className="w-32 bg-white border-2 border-on-surface p-2 font-archivo-narrow text-sm focus:outline-none"
                            placeholder="Label"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...tempProfile.custom_links];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setTempProfile({ ...tempProfile, custom_links: updated });
                            }}
                            className="flex-grow bg-white border-2 border-on-surface p-2 font-archivo-narrow text-sm focus:outline-none"
                            placeholder="https://your-link.com"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = tempProfile.custom_links.filter((_, i) => i !== idx);
                              setTempProfile({ ...tempProfile, custom_links: updated });
                            }}
                            className="w-8 h-8 flex items-center justify-center border-2 border-on-surface bg-white text-on-surface rounded-full shadow-[1px_1px_0_rgba(0,0,0,1)] hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                            title="Remove link"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setTempProfile({
                            ...tempProfile,
                            custom_links: [...(tempProfile.custom_links || []), { label: '', url: '' }]
                          });
                        }}
                        className="self-start bg-[#ffe251] text-[#1a1b22] border-2 border-on-surface px-4 py-1.5 font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add_link</span>
                        Add Your Link
                      </button>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <footer className="flex justify-end gap-4 border-t-2 border-on-surface/20 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2 border-3 border-on-surface font-space-grotesk font-bold uppercase text-xs rounded-full hover:bg-background cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all text-on-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#4ade80] text-on-surface border-3 border-on-surface font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </footer>
                </form>
              ) : (
                /* READ-ONLY DISPLAY VIEW */
                <div className="flex flex-col gap-6">
                  {/* Basic Info (Cream Card) */}
                  <section className="bg-[#FAF8FF] border-3 border-on-surface p-5 rounded-lg flex flex-col gap-3 shadow-[3px_3px_0_var(--shadow-color)]">
                    <h2 className="font-anton text-base uppercase text-primary border-b-2 border-on-surface pb-1 flex justify-between items-center">
                      <span>Basic Info</span>
                      <span className="material-symbols-outlined text-sm">badge</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-archivo-narrow text-base">
                      <p><strong>Roll ID:</strong> {profile.student_id}</p>
                      <p><strong>Email:</strong> {profile.email}</p>
                      <p><strong>Phone:</strong> {profile.phone}</p>
                      <p><strong>DOB:</strong> {profile.date_of_birth}</p>
                      <p><strong>Gender:</strong> {formatGender(profile.gender)}</p>
                      <p className="md:col-span-2 mt-1"><strong>Bio:</strong> {profile.bio}</p>
                    </div>
                  </section>

                  {/* Academic Info (Lavender Card, tilted) */}
                  <section className="bg-primary-fixed text-on-surface border-3 border-on-surface p-5 rounded-lg flex flex-col gap-3 shadow-[3px_3px_0_var(--shadow-color)] -rotate-1 hover:rotate-0 transition-transform">
                    <h2 className="font-anton text-base uppercase text-[#093ea6] border-b-2 border-on-surface pb-1 flex justify-between items-center">
                      <span>Academic Details</span>
                      <span className="material-symbols-outlined text-sm">school</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-archivo-narrow text-base">
                      <p><strong>College:</strong> {profile.college_name}</p>
                      <p><strong>Dept:</strong> {profile.department}</p>
                      <p><strong>Branch:</strong> {profile.branch}</p>
                      <p><strong>Sem & Year:</strong> {profile.semester} / {profile.year}</p>
                      <p><strong>Section / Batch:</strong> Sec {profile.section} ({profile.batch})</p>
                      <p><strong>Mentor:</strong> {profile.advisor}</p>
                    </div>
                  </section>

                  {/* Academic Stats (Scattered Mini Cards, Read-Only) */}
                  <section className="flex flex-col gap-2">
                    <h2 className="font-anton text-base uppercase text-on-surface border-b-2 border-on-surface pb-1">
                      Live Performance Stats
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Stat 1 */}
                      <div className="bg-secondary-container p-3 border-3 border-on-surface rounded shadow-[2px_2px_0_var(--shadow-color)] rotate-1">
                        <span className="font-space-grotesk font-bold text-[10px] text-on-surface-variant uppercase block">CGPA</span>
                        <span className="font-anton text-2xl">{stats.cgpa.toFixed(1)}</span>
                      </div>
                      {/* Stat 2 */}
                      <div className="bg-primary-container text-white p-3 border-3 border-on-surface rounded shadow-[2px_2px_0_var(--shadow-color)] -rotate-1">
                        <span className="font-space-grotesk font-bold text-[10px] opacity-75 uppercase block">Credits Done</span>
                        <span className="font-anton text-2xl">{stats.credits}</span>
                      </div>
                      {/* Stat 3 */}
                      <div className="bg-secondary p-3 text-white border-3 border-on-surface rounded shadow-[2px_2px_0_var(--shadow-color)] rotate-2">
                        <span className="font-space-grotesk font-bold text-[10px] opacity-75 uppercase block">Attendance</span>
                        <span className="font-anton text-2xl">{stats.attendancePct}%</span>
                      </div>
                      {/* Stat 4 */}
                      <div className="bg-[#ffb59d] p-3 border-3 border-on-surface rounded shadow-[2px_2px_0_var(--shadow-color)] -rotate-2">
                        <span className="font-space-grotesk font-bold text-[10px] text-on-surface-variant uppercase block">Study Streak</span>
                        <span className="font-anton text-2xl">{stats.studyStreak} days</span>
                      </div>
                      {/* Stat 5 */}
                      <div className="bg-surface-container-high p-3 border-3 border-on-surface rounded shadow-[2px_2px_0_var(--shadow-color)] rotate-1">
                        <span className="font-space-grotesk font-bold text-[10px] text-on-surface-variant uppercase block">Tasks Done</span>
                        <span className="font-anton text-2xl">{stats.assignmentsCompleted}</span>
                      </div>
                      {/* Stat 6 */}
                      <div className="bg-primary-fixed p-3 border-3 border-on-surface rounded shadow-[2px_2px_0_var(--shadow-color)] -rotate-1">
                        <span className="font-space-grotesk font-bold text-[10px] text-on-surface-variant uppercase block">Notes Captured</span>
                        <span className="font-anton text-2xl">{stats.notesUploaded}</span>
                      </div>
                    </div>
                  </section>

                  {/* Skills (Collapsible Card) */}
                  <section className="bg-[#FAF8FF] border-3 border-on-surface rounded-lg shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
                    <button
                      onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                      className="w-full flex justify-between items-center p-4 font-anton text-base uppercase text-on-surface bg-surface-container-high border-b-3 border-on-surface text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">construction</span>
                        Skills & Badges
                      </span>
                      <span className="material-symbols-outlined">
                        {isSkillsExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isSkillsExpanded && (
                      <div className="p-4 flex flex-col gap-4">
                        <div>
                          <h3 className="font-space-grotesk font-bold text-xs uppercase text-on-surface-variant mb-2">Development Skills</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills.map((s) => (
                              <span key={s} className="bg-background text-on-surface border-2 border-on-surface px-2.5 py-0.5 rounded-full font-space-grotesk font-bold text-xs">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-space-grotesk font-bold text-xs uppercase text-on-surface-variant mb-2">Interests</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.interests.map((i) => (
                              <span key={i} className="bg-secondary-container text-on-surface border-2 border-on-surface px-2.5 py-0.5 rounded-full font-space-grotesk font-bold text-xs">
                                {i}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-space-grotesk font-bold text-xs uppercase text-on-surface-variant mb-2">Certifications</h3>
                          <ul className="list-disc pl-5 font-archivo-narrow text-sm font-bold text-on-surface-variant space-y-1">
                            {profile.certifications.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Social (Collapsible Card) */}
                  <section className="bg-[#4ade80] border-3 border-on-surface rounded-lg shadow-[3px_3px_0_var(--shadow-color)] overflow-hidden">
                    <button
                      onClick={() => setIsSocialExpanded(!isSocialExpanded)}
                      className="w-full flex justify-between items-center p-4 font-anton text-base uppercase text-[#0d3f1d] bg-[#42c572] border-b-3 border-on-surface text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">share</span>
                        Social Links
                      </span>
                      <span className="material-symbols-outlined">
                        {isSocialExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isSocialExpanded && (
                      <div className="p-4 flex flex-wrap gap-3 justify-center">
                        {profile.linkedin_url && (
                          <a 
                            href={profile.linkedin_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white border-3 border-on-surface px-4 py-2 font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 text-[#1a1b22]"
                          >
                            <span className="material-symbols-outlined text-sm">business_center</span>
                            LinkedIn
                          </a>
                        )}
                        {profile.github_url && (
                          <a 
                            href={profile.github_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white border-3 border-on-surface px-4 py-2 font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 text-[#1a1b22]"
                          >
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            GitHub
                          </a>
                        )}
                        {profile.portfolio_url && (
                          <a 
                            href={profile.portfolio_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white border-3 border-on-surface px-4 py-2 font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 text-[#1a1b22]"
                          >
                            <span className="material-symbols-outlined text-sm">language</span>
                            Portfolio
                          </a>
                        )}
                        {/* Custom Links */}
                        {(profile.custom_links || []).filter(l => l.url).map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#ffe251] border-3 border-on-surface px-4 py-2 font-space-grotesk font-bold uppercase text-xs rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 text-[#1a1b22]"
                          >
                            <span className="material-symbols-outlined text-sm">add_link</span>
                            {link.label || 'Link'}
                          </a>
                        ))}
                        {/* Show edit hint if no links */}
                        {!profile.linkedin_url && !profile.github_url && !profile.portfolio_url && (profile.custom_links || []).length === 0 && (
                          <p className="text-[#0d3f1d] font-space-grotesk font-bold text-xs opacity-70 text-center w-full">
                            No links added yet — click Edit Profile to add yours!
                          </p>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

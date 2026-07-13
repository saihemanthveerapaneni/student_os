import { getAccessToken, setAccessToken } from '@/lib/auth/token';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const getHeaders = async () => {
  let token = getAccessToken();
  if (!token) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        token = data.session.access_token;
        setAccessToken(token);
      }
    } catch (e) {
      console.warn('Failed to get supabase session', e);
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

async function request<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  body?: any,
  fallbackKey?: string,
  defaultFallback?: any,
  skipFallbackOnError: boolean = false
): Promise<T> {
  try {
    const url = `${API_BASE}${endpoint}`;
    const headers = await getHeaders();
    const options: RequestInit = {
      method,
      headers,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    const result = await response.json();
    
    if (fallbackKey && result) {
      let dataToSync = result;
      if (result.data) dataToSync = result.data;
      localStorage.setItem(fallbackKey, JSON.stringify(dataToSync));
    }
    return result as T;
  } catch (error) {
    console.warn(`API call failed to ${endpoint}, falling back to localStorage:`, error);
    if (skipFallbackOnError) {
      throw error;
    }
    if (fallbackKey) {
      const saved = localStorage.getItem(fallbackKey);
      if (saved) {
        try {
          return JSON.parse(saved) as T;
        } catch (e) {
          return defaultFallback as T;
        }
      }
      return defaultFallback as T;
    }
    throw error;
  }
}

export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  hasSession: async (): Promise<boolean> => {
    const headers = await getHeaders();
    return !!headers.Authorization;
  },

  clearCachedUserData: () => {
    const keys = [
      'studentos_profile',
      'studentos_timetable',
      'studentos_notes',
      'studentos_assignments',
      'studentos_attendance',
      'studentos_gpa_subjects'
    ];
    keys.forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new Event('storage'));
  },

  // Profile
  getProfile: async () => {
    const authenticated = await api.hasSession();
    if (!authenticated) {
      const saved = localStorage.getItem('studentos_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return {
        name: 'Guest User',
        email: 'guest@studentos.app',
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
      };
    }
    return request<any>('/users/me', 'GET', undefined, 'studentos_profile', undefined, true);
  },
  
  updateProfile: async (data: any) => {
    const authenticated = await api.hasSession();
    if (!authenticated) {
      localStorage.setItem('studentos_profile', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
      return { status: 'success', updated_data: data };
    }
    const result = await request<any>('/users/me', 'PUT', data, 'studentos_profile');
    localStorage.setItem('studentos_profile', JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
    return result;
  },

  // Settings
  getSettings: async () => {
    return request<any>('/users/settings', 'GET', undefined, 'studentos_settings', {
      theme: 'light',
      accentColor: 'yellow',
      fontSize: 'medium',
      notifications: {
        assignments: true,
        exams: true,
        timetable: true,
        attendance: true,
        dailyStudy: false,
        aiAssistant: true,
      },
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
      privacy: {
        visibility: 'public',
        hideStats: false,
      },
      region: {
        language: 'English',
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
    });
  },

  updateSettings: async (data: any) => {
    const result = await request<any>('/users/settings', 'PUT', data, 'studentos_settings');
    localStorage.setItem('studentos_settings', JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
    return result;
  },

  // Timetable
  getTimetable: async () => {
    const list = await request<any[]>('/timetable', 'GET', undefined, 'studentos_timetable', []);
    
    return list.map((item: any) => ({
      id: item.id || Date.now().toString(),
      subject: item.subject || item.course_name || item.name || 'Class',
      day: item.day || item.day_of_week || 'Monday',
      startTime: item.startTime || item.start_time || '08:00',
      endTime: item.endTime || item.end_time || '09:30',
      location: item.location || item.room || 'Room 101',
      colorClass: item.colorClass || item.color_class || 'bg-primary',
      textColor: item.textColor || item.text_color || 'text-white'
    }));
  },

  addTimetableItem: async (data: any) => {
    const backendData = {
      course_id: 'c1',
      day_of_week: data.day,
      start_time: data.startTime,
      end_time: data.endTime,
      room: data.location
    };
    try {
      const res = await request<any>('/timetable', 'POST', backendData);
      const current = JSON.parse(localStorage.getItem('studentos_timetable') || '[]');
      const updated = [...current, { ...data, id: res.id || Date.now().toString() }];
      localStorage.setItem('studentos_timetable', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return res;
    } catch {
      const current = JSON.parse(localStorage.getItem('studentos_timetable') || '[]');
      const updated = [...current, { ...data, id: Date.now().toString() }];
      localStorage.setItem('studentos_timetable', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return { id: Date.now().toString() };
    }
  },

  deleteTimetableItem: async (id: string) => {
    try {
      await request<any>(`/timetable/${id}`, 'DELETE');
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_timetable') || '[]');
    const updated = current.filter((item: any) => item.id !== id);
    localStorage.setItem('studentos_timetable', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  // Notes
  getNotes: async () => {
    const list = await request<any[]>('/notes', 'GET', undefined, 'studentos_notes', []);

    return list.map((item: any) => {
      let t = 'Misc';
      if (Array.isArray(item.tags) && item.tags.length > 0) t = item.tags[0];
      else if (item.tag) t = item.tag;

      return {
        id: item.id || Date.now().toString(),
        title: item.title || 'Untitled Note',
        content: item.content || '',
        tag: t,
        date: item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        color: item.color || 'bg-[#ffe251]',
        pinned: item.pinned || false
      };
    });
  },

  addNoteItem: async (data: any) => {
    const backendData = {
      title: data.title,
      content: data.content,
      tags: [data.tag]
    };
    try {
      const res = await request<any>('/notes', 'POST', backendData);
      const current = JSON.parse(localStorage.getItem('studentos_notes') || '[]');
      const updated = [...current, { ...data, id: res.id || Date.now().toString() }];
      localStorage.setItem('studentos_notes', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return res;
    } catch {
      const current = JSON.parse(localStorage.getItem('studentos_notes') || '[]');
      const updated = [...current, { ...data, id: Date.now().toString() }];
      localStorage.setItem('studentos_notes', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return { id: Date.now().toString() };
    }
  },

  deleteNoteItem: async (id: string) => {
    try {
      await request<any>(`/notes/${id}`, 'DELETE');
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_notes') || '[]');
    const updated = current.filter((item: any) => item.id !== id);
    localStorage.setItem('studentos_notes', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  // Assignments
  getAssignments: async () => {
    const list = await request<any[]>('/assignments', 'GET', undefined, 'studentos_assignments', []);
    
    return list.map((item: any) => {
      let uiStatus: 'Due Today' | 'In Progress' | 'Done' = 'Due Today';
      const s = String(item.status).toLowerCase();
      if (s === 'in_progress' || s === 'in progress') uiStatus = 'In Progress';
      else if (s === 'done') uiStatus = 'Done';
      
      return {
        id: item.id || Date.now().toString(),
        title: item.title || '',
        subject: item.subject || 'General',
        status: uiStatus,
        dueDate: item.dueDate || item.due_date || 'No Date',
        notes: item.notes || '',
      };
    });
  },

  addAssignmentItem: async (data: any) => {
    let backendStatus = 'pending';
    if (data.status === 'In Progress') backendStatus = 'in_progress';
    else if (data.status === 'Done') backendStatus = 'done';

    const backendData = {
      title: data.title,
      subject: data.subject,
      status: backendStatus,
      due_date: data.dueDate,
      notes: data.notes || ''
    };

    try {
      const res = await request<any>('/assignments', 'POST', backendData);
      const current = JSON.parse(localStorage.getItem('studentos_assignments') || '[]');
      const updated = [...current, { ...data, id: res.id || Date.now().toString() }];
      localStorage.setItem('studentos_assignments', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return res;
    } catch {
      const current = JSON.parse(localStorage.getItem('studentos_assignments') || '[]');
      const updated = [...current, { ...data, id: Date.now().toString() }];
      localStorage.setItem('studentos_assignments', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return { id: Date.now().toString() };
    }
  },

  updateAssignmentItem: async (id: string, data: any) => {
    const backendData: any = {};
    if (data.title) backendData.title = data.title;
    if (data.subject) backendData.subject = data.subject;
    if (data.status) {
      let bs = 'pending';
      if (data.status === 'In Progress') bs = 'in_progress';
      else if (data.status === 'Done') bs = 'done';
      backendData.status = bs;
    }
    if (data.dueDate) backendData.due_date = data.dueDate;
    if (data.notes) backendData.notes = data.notes;

    try {
      await request<any>(`/assignments/${id}`, 'PUT', backendData);
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_assignments') || '[]');
    const updated = current.map((item: any) => item.id === id ? { ...item, ...data } : item);
    localStorage.setItem('studentos_assignments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  deleteAssignmentItem: async (id: string) => {
    try {
      await request<any>(`/assignments/${id}`, 'DELETE');
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_assignments') || '[]');
    const updated = current.filter((item: any) => item.id !== id);
    localStorage.setItem('studentos_assignments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  // Attendance
  getAttendance: async () => {
    return request<any[]>('/attendance', 'GET', undefined, 'studentos_attendance', []);
  },

  updateAttendanceItem: async (id: string, data: any) => {
    try {
      await request<any>(`/attendance/${id}`, 'PUT', data);
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_attendance') || '[]');
    const updated = current.map((item: any) => item.id === id ? { ...item, ...data } : item);
    localStorage.setItem('studentos_attendance', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  // GPA subjects
  getGpaSubjects: async () => {
    return request<any[]>('/gpa/subjects', 'GET', undefined, 'studentos_gpa_subjects', []);
  },

  addGpaSubject: async (data: any) => {
    try {
      const res = await request<any>('/gpa/subjects', 'POST', data);
      const current = JSON.parse(localStorage.getItem('studentos_gpa_subjects') || '[]');
      const updated = [...current, { ...data, id: res.id || Date.now().toString() }];
      localStorage.setItem('studentos_gpa_subjects', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return res;
    } catch {
      const current = JSON.parse(localStorage.getItem('studentos_gpa_subjects') || '[]');
      const updated = [...current, { ...data, id: Date.now().toString() }];
      localStorage.setItem('studentos_gpa_subjects', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return { id: Date.now().toString() };
    }
  },

  updateGpaSubject: async (id: string, data: any) => {
    try {
      await request<any>(`/gpa/subjects/${id}`, 'PUT', data);
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_gpa_subjects') || '[]');
    const updated = current.map((item: any) => item.id === id ? { ...item, ...data } : item);
    localStorage.setItem('studentos_gpa_subjects', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  deleteGpaSubject: async (id: string) => {
    try {
      await request<any>(`/gpa/subjects/${id}`, 'DELETE');
    } catch {}
    const current = JSON.parse(localStorage.getItem('studentos_gpa_subjects') || '[]');
    const updated = current.filter((item: any) => item.id !== id);
    localStorage.setItem('studentos_gpa_subjects', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  // AI Chat
  sendAiChatQuery: async (message: string, history: any[] = []) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          chat_history: history
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const res = await response.json();
      return res.reply || res.response || '';
    } catch (error) {
      console.error("AI chat request failed:", error);
      return "Something went wrong communicating with the AI backend. Please try again.";
    }
  },
  
  clearAiChats: async () => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE}/ai/chats`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // Global Search
  globalSearch: async (query: string) => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
        headers
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch {
      const timetable = JSON.parse(localStorage.getItem('studentos_timetable') || '[]');
      const notes = JSON.parse(localStorage.getItem('studentos_notes') || '[]');
      const assignments = JSON.parse(localStorage.getItem('studentos_assignments') || '[]');
      
      const q = query.toLowerCase();
      
      const timetableResults = timetable.filter((c: any) => c.subject.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
      const noteResults = notes.filter((n: any) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
      const assignmentResults = assignments.filter((a: any) => a.title.toLowerCase().includes(q));
      
      return {
        query,
        timetable: timetableResults,
        notes: noteResults,
        assignments: assignmentResults
      };
    }
  }
};

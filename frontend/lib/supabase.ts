import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key";

// Detect if Supabase is unconfigured (using default placeholders)
const isUnconfigured = 
  supabaseUrl.includes("your-supabase-url") || 
  supabaseAnonKey.includes("your-supabase-anon-key") || 
  !supabaseUrl.startsWith("http");

const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBDUnxqYI3mKMD8wcVTo1SFRSWwtDgr8B_h-PVq7WjIk9g6Zb1Ge5FXp5n2B8qShm0Z9JSRiX8VdX7qHg2rZMdXUAyXhci_4kp7kIaCuK_Bb9f0dr-7fk00WSe8zPeZAArKYLx0dagtzIJ-AAz_ib1Piq6-w0G8k8bMXePsj6y5USqVmkGgifYh40vz8nBgldLUaVLNTiMgmoFBQvux7u-kmcPAlF214gH0yyL0lI_gzdgmb0W-uN2qCA";

class MockQueryBuilder {
  table: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' = 'select';
  payload: any = null;
  filters: Array<(item: any) => boolean> = [];
  sortCol: string = "";
  sortAsc: boolean = true;
  limitCount: number = 999;
  isSingle: boolean = false;
  isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = "*", options?: any) {
    this.queryType = 'select';
    return this;
  }

  insert(payload: any) {
    this.queryType = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.queryType = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.queryType = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      // If we are filtering on nested structures or joins
      if (column.includes(".")) return true; 
      return item[column] === value;
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortCol = column;
    this.sortAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  // Thenable method so it can be directly awaited
  async then(onfulfilled: any) {
    const res = await this.execute();
    return onfulfilled(res);
  }

  private async execute() {
    if (typeof window === "undefined") {
      return { data: [], error: null };
    }

    const key = `sb-mock-${this.table}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");

    if (this.queryType === 'select') {
      let result = list.filter((item: any) => {
        return this.filters.every(f => f(item));
      });

      // Handle mock relationships / joins
      if (this.table === "timetable" || this.table === "assignments" || this.table === "attendance") {
        const courses = JSON.parse(localStorage.getItem("sb-mock-courses") || "[]");
        result = result.map((item: any) => {
          const course = courses.find((c: any) => c.id === item.course_id);
          return { ...item, courses: course || null };
        });
      }

      if (this.sortCol) {
        result.sort((a: any, b: any) => {
          let valA = a[this.sortCol];
          let valB = b[this.sortCol];
          if (!valA) return 1;
          if (!valB) return -1;
          if (typeof valA === "string") {
            return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return this.sortAsc ? valA - valB : valB - valA;
        });
      }

      result = result.slice(0, this.limitCount);

      if (this.isSingle) {
        return { data: result[0] || null, error: result[0] ? null : { message: "Item not found" } };
      }
      if (this.isMaybeSingle) {
        return { data: result[0] || null, error: null };
      }

      return { data: result, error: null, count: result.length };
    }

    if (this.queryType === 'insert') {
      const records = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: any[] = [];

      for (const r of records) {
        const newRecord = {
          id: r.id || Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...r
        };
        list.push(newRecord);
        inserted.push(newRecord);
      }

      localStorage.setItem(key, JSON.stringify(list));
      return { data: Array.isArray(this.payload) ? inserted : inserted[0], error: null };
    }

    if (this.queryType === 'update') {
      let updated: any = null;
      const updatedList = list.map((item: any) => {
        const matches = this.filters.every(f => f(item));
        if (matches) {
          updated = { ...item, ...this.payload, updated_at: new Date().toISOString() };
          return updated;
        }
        return item;
      });

      localStorage.setItem(key, JSON.stringify(updatedList));
      return { data: updated, error: null };
    }

    if (this.queryType === 'delete') {
      const remaining = list.filter((item: any) => {
        return !this.filters.every(f => f(item));
      });
      localStorage.setItem(key, JSON.stringify(remaining));
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }
}

class MockSupabaseClient {
  auth = {
    signUp: async ({ email, password, options }: any) => {
      const user = {
        id: "mock-user-uuid",
        email,
        user_metadata: options?.data || { full_name: email.split("@")[0] }
      };
      
      if (typeof window !== "undefined") {
        localStorage.setItem("sb-mock-user", JSON.stringify(user));
        localStorage.setItem("sb-mock-session", JSON.stringify({ user }));
        
        // Seed user data locally
        this.seedMockData("mock-user-uuid");
      }
      
      return { data: { user, session: { user } }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      const user = {
        id: "mock-user-uuid",
        email,
        user_metadata: { full_name: "Alex Student" }
      };
      
      if (typeof window !== "undefined") {
        localStorage.setItem("sb-mock-user", JSON.stringify(user));
        localStorage.setItem("sb-mock-session", JSON.stringify({ user }));
        
        // Ensure data is seeded
        this.seedMockData("mock-user-uuid");
      }
      
      return { data: { user, session: { user } }, error: null };
    },
    getSession: async () => {
      if (typeof window === "undefined") return { data: { session: null }, error: null };
      const stored = localStorage.getItem("sb-mock-session");
      const session = stored ? JSON.parse(stored) : null;
      return { data: { session }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Simulate auth change listener
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sb-mock-session");
        const session = stored ? JSON.parse(stored) : null;
        setTimeout(() => callback("SIGNED_IN", session), 50);
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sb-mock-user");
        localStorage.removeItem("sb-mock-session");
      }
      return { error: null };
    }
  };

  from(table: string) {
    return new MockQueryBuilder(table);
  }

  channel(name: string) {
    return {
      on: (event: string, filter: any, callback: any) => {
        return {
          subscribe: () => ({ unsubscribe: () => {} })
        };
      },
      subscribe: () => ({ unsubscribe: () => {} })
    };
  }

  removeChannel(ch: any) {}

  private seedMockData(userId: string) {
    if (typeof window === "undefined") return;

    // Check if already seeded
    if (localStorage.getItem("sb-mock-courses")) return;

    // 1. Seed Courses
    const courses = [
      { id: "c1", user_id: userId, code: "CS401", name: "Advanced Algorithms", color: "#4648d4", instructor: "Dr. Helen Carter", classroom: "Room 302, Science Block" },
      { id: "c2", user_id: userId, code: "CS305", name: "Database Systems", color: "#006b5f", instructor: "Prof. Marcus Vance", classroom: "Online Lab" },
      { id: "c3", user_id: userId, code: "MATH202", name: "Linear Algebra", color: "#994100", instructor: "Dr. Sarah Jenkins", classroom: "Hall B" },
      { id: "c4", user_id: userId, code: "ENG105", name: "Modern Literature", color: "#ba1a1a", instructor: "Prof. Alice Wood", classroom: "Online (Zoom)" }
    ];
    localStorage.setItem("sb-mock-courses", JSON.stringify(courses));

    // 2. Seed Timetable slots
    const timetable = [
      { id: "t1", user_id: userId, course_id: "c1", day_of_week: 1, start_time: "09:00:00", end_time: "10:30:00" },
      { id: "t2", user_id: userId, course_id: "c1", day_of_week: 3, start_time: "09:00:00", end_time: "10:30:00" },
      { id: "t3", user_id: userId, course_id: "c2", day_of_week: 1, start_time: "11:00:00", end_time: "12:30:00" },
      { id: "t4", user_id: userId, course_id: "c2", day_of_week: 3, start_time: "11:00:00", end_time: "12:30:00" },
      { id: "t5", user_id: userId, course_id: "c3", day_of_week: 2, start_time: "13:00:00", end_time: "15:00:00" },
      { id: "t6", user_id: userId, course_id: "c3", day_of_week: 4, start_time: "13:00:00", end_time: "15:00:00" },
      { id: "t7", user_id: userId, course_id: "c4", day_of_week: 5, start_time: "09:00:00", end_time: "11:00:00" }
    ];
    localStorage.setItem("sb-mock-timetable", JSON.stringify(timetable));

    // 3. Seed Notes
    const notes = [
      { id: "n1", user_id: userId, course_id: "c1", title: "Data Structures Overview", content: "A comprehensive review of linear and non-linear data structures. Covers arrays, linked lists, stacks, queues, trees (binary, AVL, Red-Black), and graphs. Key focus on time complexity for search, insert, and delete operations.", tags: ["#exam-prep", "#algorithms"], folder: "Computer Science", is_pinned: true, version: 1, updated_at: new Date().toISOString() },
      { id: "n2", user_id: userId, course_id: "c1", title: "Big O Notation Cheatsheet", content: "O(1) Constant Time: Array index access. O(log n) Logarithmic: Binary search. O(n) Linear: Simple loop. O(n log n) Linearithmic: Merge sort. O(n^2) Quadratic: Nested loops. Remember dropping constants and non-dominant terms.", tags: ["#algorithms"], folder: "Computer Science", is_pinned: false, version: 1, updated_at: new Date().toISOString() },
      { id: "n3", user_id: userId, course_id: "c1", title: "React State Management", content: "Comparing useState, useReducer, and Context API vs external libraries like Redux and Zustand. Context is great for low-frequency updates like theme/auth. Redux provides predictable state container but with boilerplate overhead.", tags: ["#project"], folder: "Computer Science", is_pinned: false, version: 1, updated_at: new Date().toISOString() },
      { id: "n4", user_id: userId, course_id: "c1", title: "REST API Design Principles", content: "Stateless operations, client-server architecture, cacheability. Use nouns for resources (e.g., /users instead of /getUsers). Proper use of HTTP methods: GET, POST, PUT, PATCH, DELETE. Status codes mapping.", tags: ["#web-dev"], folder: "Computer Science", is_pinned: false, version: 1, updated_at: new Date().toISOString() }
    ];
    localStorage.setItem("sb-mock-notes", JSON.stringify(notes));

    // 4. Seed Assignments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const assignments = [
      { id: "a1", user_id: userId, course_id: "c1", title: "Algorithms Midterm Project", description: "Submit documentation and initial code structure for binary tree visualizer.", priority: "high", status: "pending", due_date: new Date().toISOString() },
      { id: "a2", user_id: userId, course_id: "c4", title: "Essay Draft 1: Modernism", description: "1500 words on AI implications in modern society and literature.", priority: "medium", status: "pending", due_date: tomorrow.toISOString() },
      { id: "a3", user_id: userId, course_id: "c3", title: "Weekly Problem Set #4", description: "Solve problems 1-15 in chapter 4 of Linear Algebra textbook.", priority: "low", status: "pending", due_date: inThreeDays.toISOString() }
    ];
    localStorage.setItem("sb-mock-assignments", JSON.stringify(assignments));

    // 5. Seed Attendance
    const attendance = [
      { id: "at1", user_id: userId, course_id: "c1", date: new Date().toISOString().split("T")[0], status: "present" },
      { id: "at2", user_id: userId, course_id: "c1", date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0], status: "present" },
      { id: "at3", user_id: userId, course_id: "c1", date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0], status: "present" },
      { id: "at4", user_id: userId, course_id: "c1", date: new Date(Date.now() - 86400000 * 10).toISOString().split("T")[0], status: "absent" },
      { id: "at5", user_id: userId, course_id: "c2", date: new Date().toISOString().split("T")[0], status: "present" },
      { id: "at6", user_id: userId, course_id: "c2", date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0], status: "present" },
      { id: "at7", user_id: userId, course_id: "c2", date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0], status: "present" },
      { id: "at8", user_id: userId, course_id: "c3", date: new Date().toISOString().split("T")[0], status: "present" },
      { id: "at9", user_id: userId, course_id: "c3", date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0], status: "absent" },
      { id: "at10", user_id: userId, course_id: "c4", date: new Date().toISOString().split("T")[0], status: "present" }
    ];
    localStorage.setItem("sb-mock-attendance", JSON.stringify(attendance));

    // 6. Seed Notifications
    const notifications = [
      { id: "no1", user_id: userId, title: "Welcome to StudentOS", content: "Explore your new academic dashboard. Check your timetable and notes to get started!", is_read: false, type: "info", created_at: new Date().toISOString() },
      { id: "no2", user_id: userId, title: "Upcoming Deadline", content: "Your Algorithms Midterm Project is due today.", is_read: false, type: "warning", created_at: new Date().toISOString() }
    ];
    localStorage.setItem("sb-mock-notifications", JSON.stringify(notifications));

    // 7. Seed Users profile
    const userProfile = { id: userId, email: "alex@university.edu", full_name: "Alex Student", avatar_url: defaultAvatar };
    localStorage.setItem("sb-mock-users", JSON.stringify([userProfile]));
  }
}

export const supabase = isUnconfigured 
  ? (new MockSupabaseClient() as any) 
  : createClient(supabaseUrl, supabaseAnonKey);

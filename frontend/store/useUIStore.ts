import { create } from "zustand";

interface UIState {
  theme: "light" | "dark";
  isSidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  isSidebarCollapsed: false,
  toggleTheme: () => 
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(nextTheme);
      }
      return { theme: nextTheme };
    }),
  setTheme: (theme) => 
    set(() => {
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
      }
      return { theme };
    }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
export default useUIStore;

"use client";

import AppLayout from "@/components/AppLayout";
import useUIStore from "@/store/useUIStore";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();
  const { signOut, profile } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AppLayout>
      <div className="mb-lg">
        <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-body-lg text-on-surface-variant font-medium">Configure your StudentOS profile preferences.</p>
      </div>

      <div className="max-w-xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/20 rounded-xl p-lg shadow-sm space-y-lg">
        {/* Profile Settings */}
        <div>
          <h3 className="text-title-lg font-bold text-on-surface mb-sm">Academic Profile</h3>
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <span className="block text-label-md text-on-surface-variant mb-1">Full Name</span>
              <input 
                type="text" 
                disabled
                value={profile?.full_name || "Alex Student"} 
                className="w-full px-sm py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface opacity-80"
              />
            </div>
            <div>
              <span className="block text-label-md text-on-surface-variant mb-1">Email Address</span>
              <input 
                type="text" 
                disabled
                value={profile?.email || "alex@university.edu"} 
                className="w-full px-sm py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-body-md text-on-surface opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Display / Theme Settings */}
        <div className="pt-lg border-t border-outline-variant/10">
          <h3 className="text-title-lg font-bold text-on-surface mb-sm">Workspace Display</h3>
          <div className="flex items-center justify-between p-md bg-surface-container/30 border border-outline-variant/15 rounded-xl">
            <div>
              <span className="block text-body-md font-bold text-on-surface">Toggle Color Mode</span>
              <span className="block text-[11px] text-on-surface-variant">Switch between Light Mode and Dark Mode displays.</span>
            </div>
            <button 
              onClick={toggleTheme}
              className="px-md py-2 bg-primary text-on-primary rounded-lg text-body-md font-semibold hover:bg-primary/95 cursor-pointer transition-colors shadow-sm"
            >
              Set {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        </div>

        {/* Reminders Notifications Rules */}
        <div className="pt-lg border-t border-outline-variant/10">
          <h3 className="text-title-lg font-bold text-on-surface mb-sm">Study Reminders</h3>
          <div className="space-y-sm text-body-md text-on-surface-variant font-medium">
            <label className="flex items-center gap-sm">
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
              <span>Email me assignments notifications 24h before due date.</span>
            </label>
            <label className="flex items-center gap-sm">
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
              <span>Notify me of class conflicts during schedule creations.</span>
            </label>
            <label className="flex items-center gap-sm">
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
              <span>Show warning banners when course attendance drops below 75%.</span>
            </label>
          </div>
        </div>

        {/* Session Log out */}
        <div className="pt-lg border-t border-outline-variant/10">
          <button 
            onClick={handleSignOut}
            className="w-full py-2.5 bg-error-container/20 hover:bg-error-container/30 text-error border border-error/25 rounded-lg font-bold text-body-md cursor-pointer transition-all shadow-sm"
          >
            Log Out of StudentOS
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

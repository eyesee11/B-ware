"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function AppHeader() {
  const { user } = useAuth();

  const handleNotificationClick = () => {
    alert("No new notifications");
  };

  return (
    <header className="fixed top-0 z-50 flex justify-between items-center w-full px-8 h-16 bg-white border-b border-slate-100">
      <div className="flex items-center gap-8">
        <div className="text-2xl font-black tracking-tighter text-slate-900 uppercase">B-WARE</div>
        <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-on-surface-variant"
            placeholder="Global Archive Search..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={handleNotificationClick}
          className="p-2 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <Link href="/profile" className="h-8 w-8 bg-surface-container-highest overflow-hidden hover:opacity-80 transition-opacity">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-600 text-white font-bold text-xs uppercase">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

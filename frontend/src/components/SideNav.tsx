"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "Verify", icon: "verified_user" },
  { href: "/trending",  label: "Trending", icon: "trending_up" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/history",   label: "History", icon: "history" },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/profile",  label: "Profile", icon: "account_circle" },
];

export default function SideNav() {
  const path = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-slate-50 border-r border-slate-100 flex flex-col py-8 gap-2 z-40">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 bg-primary"></div>
          <span className="uppercase tracking-widest text-[11px] font-bold text-on-surface">
            Forensic Portal
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Level 4 Access</p>
      </div>

      <Link
        href="/dashboard"
        className="mx-6 mb-4 py-3 text-center bg-primary text-on-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-all"
      >
        New Verification
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-3 uppercase tracking-widest text-[11px] font-bold transition-all duration-200 ${
                active
                  ? "text-red-600 bg-white border-l-4 border-red-600"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 pt-4 space-y-1">
        {bottomItems.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-2.5 uppercase tracking-widest text-[11px] font-bold transition-all ${
                active
                  ? "text-red-600 bg-white border-l-4 border-red-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-2.5 w-full text-left uppercase tracking-widest text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

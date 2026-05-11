"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function TopNav() {
  const path = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  const isAuthPage = path === "/login" || path === "/register" || path === "/forgot-password";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // On auth pages: always solid (no transparency glitch)
  // On landing: transparent → solid on scroll
  const solid = isAuthPage || scrolled;

  return (
    <nav
      className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 transition-all duration-300"
      style={{
        backgroundColor: solid ? "rgba(255,255,255,0.98)" : "transparent",
        backdropFilter: solid ? "blur(12px)" : "none",
        borderBottom: solid ? "1px solid rgba(228,228,231,0.8)" : "1px solid transparent",
        boxShadow: solid ? "0 1px 12px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span
          className={`text-xl font-black tracking-tighter transition-colors duration-300 ${
            solid ? "text-zinc-900" : "text-white"
          }`}
        >
          B-ware
        </span>
        <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.2em] text-red-600 mt-0.5">
          Forensic
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {isAuthenticated && !isAuthPage ? (
          // Authenticated nav
          <>
            <Link
              href="/dashboard"
              className={`hidden md:block font-bold text-sm transition-colors duration-300 ${
                solid ? "text-zinc-500 hover:text-zinc-900" : "text-white/80 hover:text-white"
              } ${path === "/dashboard" ? (solid ? "text-zinc-900" : "text-white") : ""}`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`hidden md:flex items-center gap-2 font-bold text-sm transition-colors duration-300 ${
                solid ? "text-zinc-500 hover:text-zinc-900" : "text-white/80 hover:text-white"
              }`}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-red-600"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              )}
              <span className="hidden lg:block">{user?.name?.split(" ")[0]}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          // Guest nav
          <>
            <Link
              href="/login"
              className={`font-bold text-sm transition-colors duration-300 ${
                path === "/login"
                  ? solid ? "text-zinc-900 border-b-2 border-red-600 pb-0.5" : "text-white border-b-2 border-red-600 pb-0.5"
                  : solid ? "text-zinc-500 hover:text-zinc-900" : "text-white/80 hover:text-white"
              }`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`font-bold text-sm transition-colors duration-300 ${
                path === "/register"
                  ? solid ? "text-zinc-900 border-b-2 border-red-600 pb-0.5" : "text-white border-b-2 border-red-600 pb-0.5"
                  : solid ? "text-zinc-500 hover:text-zinc-900" : "text-white/80 hover:text-white"
              }`}
            >
              Register
            </Link>
            <Link
              href="/register"
              className="bg-red-600 text-white px-5 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all active:scale-[0.98]"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

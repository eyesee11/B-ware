"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function TopNav() {
  const path = usePathname();
  const isLogin = path === "/login";
  const isRegister = path === "/register";
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const triggerHeight = window.innerHeight;
      const progress = Math.min(scrollTop / triggerHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate background color based on scroll progress
  const bgOpacity = scrollProgress;
  const bgColor = `rgba(255, 255, 255, ${bgOpacity})`;
  const borderOpacity = scrollProgress;
  const borderColor = `rgba(228, 228, 231, ${borderOpacity})`;
  const textColor = scrollProgress > 0.3 ? "text-zinc-900" : "text-white";
  const linkColor = scrollProgress > 0.3 ? "text-zinc-500 hover:text-red-600" : "text-white/80 hover:text-white";

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16" style={{
      backgroundColor: bgColor,
      borderBottomColor: borderColor,
      borderBottomWidth: "1px",
      transition: "background-color 0.3s ease, border-color 0.3s ease"
    }}>
      <Link href="/" className="flex items-center">
        <span className={`text-xl font-black tracking-tighter transition-colors duration-300 ${textColor}`}>B-ware</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/login"
          className={`font-bold text-sm transition-colors duration-300 ${
            isLogin
              ? scrollProgress > 0.3 ? "text-zinc-900 border-b-2 border-red-600" : "text-white border-b-2 border-red-600"
              : linkColor
          }`}
        >
          Login
        </Link>
        <Link
          href="/register"
          className={`font-bold text-sm transition-colors duration-300 ${
            isRegister
              ? scrollProgress > 0.3 ? "text-zinc-900 border-b-2 border-red-600" : "text-white border-b-2 border-red-600"
              : linkColor
          }`}
        >
          Register
        </Link>
        <Link
          href="/"
          className={`font-medium text-sm transition-colors duration-300 ${linkColor}`}
        >
          Documentation
        </Link>
        <Link
          href="/register"
          className={`bg-primary text-on-primary px-6 py-2 font-bold hover:bg-primary-dim transition-all active:scale-[0.98] text-sm ${
            scrollProgress > 0.3 ? "" : "opacity-90"
          }`}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

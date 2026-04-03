"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function TopNav() {
  const path = usePathname();
  const isLogin = path === "/login";
  const isRegister = path === "/register";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white flex justify-between items-center px-8 h-16 border-b border-zinc-100">
      <Link href="/" className="flex items-center">
        <span className="text-xl font-bold text-zinc-900">B-WARE</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/login"
          className={`font-bold text-sm transition-colors duration-200 ${
            isLogin
              ? "text-zinc-900 border-b-2 border-red-600"
              : "text-zinc-500 hover:text-red-600"
          }`}
        >
          Login
        </Link>
        <Link
          href="/register"
          className={`font-bold text-sm transition-colors duration-200 ${
            isRegister
              ? "text-zinc-900 border-b-2 border-red-600"
              : "text-zinc-500 hover:text-red-600"
          }`}
        >
          Register
        </Link>
        <Link
          href="/"
          className="text-zinc-500 font-medium text-sm hover:text-red-600 transition-colors duration-200"
        >
          Documentation
        </Link>
        <Link
          href="/register"
          className="bg-primary text-on-primary px-6 py-2 font-bold hover:bg-primary-dim transition-all active:scale-[0.98] text-sm"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

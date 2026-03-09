import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0F172A]/95 backdrop-blur-lg border-b border-slate-800/50"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight">
                B-ware
              </div>
              <div className="text-xs text-slate-400 -mt-1">
                AI Claim Verifier
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              How it Works
            </a>
            <a
              href="#demo"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Demo
            </a>
            <a
              href="#sources"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Data Sources
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-slate-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

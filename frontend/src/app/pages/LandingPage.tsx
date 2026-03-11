import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { ScrollProgress } from "../components/ScrollProgress";
import { HeroSection } from "../components/HeroSection";
import { StorytellingParallax } from "../components/StorytellingParallax";
import { RAVEngine } from "../components/RAVEngine";
import { InfographicsCapabilities } from "../components/InfographicsCapabilities";
import { TrendingRumoursExperience } from "../components/TrendingRumoursExperience";
import { ArchitecturePreview } from "../components/ArchitecturePreview";
import { ResearchTransparencyBlock } from "../components/ResearchTransparencyBlock";
import { FinalTransition } from "../components/FinalTransition";

function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Scroll progress indicator */}
      <ScrollProgress />

      {/* Subtle noise grain texture overlay */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Minimal header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40 px-6 py-6 backdrop-blur-xl bg-black/50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src="/logo.png" alt="B-ware logo" className="w-10 h-10 rounded-xl object-contain" />
            <div>
              <div className="text-white font-bold text-lg tracking-tight">
                B-ware
              </div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest -mt-1">
                No Lies Told
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#rav-engine"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              RAV Engine
            </a>
            <a
              href="#infographics"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Infographics
            </a>
            <a
              href="#trending"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Trending
            </a>
            <button
              onClick={() => navigate("/verify")}
              className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              Verify Claim
            </button>
            {user ? (
              <button
                onClick={() => { logout(); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Main content */}
      <main>
        <HeroSection />
        <StorytellingParallax />
        <div id="rav-engine">
          <RAVEngine />
        </div>
        <div id="infographics">
          <InfographicsCapabilities />
        </div>
        <div id="trending">
          <TrendingRumoursExperience />
        </div>
        <div id="architecture">
          <ArchitecturePreview />
        </div>
        <ResearchTransparencyBlock />
        <FinalTransition />
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="B-ware logo" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <div className="text-white font-bold text-sm">B-ware</div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider">
                  AI Economic Fact-Checking
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                API Documentation
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Research Paper
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div className="text-center text-xs text-slate-600">
            <p>© 2026 B-ware. All rights reserved.</p>
            <p className="mt-2">
              Powered by World Bank API, NewsAPI, Google Fact Check, and Gemini 1.5 Flash
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

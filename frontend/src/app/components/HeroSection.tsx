import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export function HeroSection() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 100]);

  // Animated number counter
  const [gdpClaimed] = useState(7.5);
  const [gdpOfficial] = useState(6.49);
  const [error, setError] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(15.48);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.section
      style={{ opacity }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-20"
    >
      {/* Animated beam spotlight */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 1000px at 50% 30%, rgba(37, 99, 235, 0.15), transparent)",
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Beam sweeps */}
      <div className="absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-blue-500/40 to-transparent"
            style={{
              left: `${20 + i * 30}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scaleY: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Faint financial line graph */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M 0 400 Q 200 320 400 360 T 800 300 L 1200 280 L 1600 310 L 2000 290"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Parallax star-field particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text Content */}
        <motion.div
          style={{ y }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-emerald-400 font-mono text-sm uppercase tracking-widest mb-6"
          >
            No Lies Told.
          </motion.div>

          {/* Hero headline */}
          <h1
            className="text-6xl font-serif font-bold text-white mb-6 tracking-tight leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Truth, Measured.
            <br />
            Not Assumed.
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] text-slate-300 mb-10 leading-relaxed max-w-xl">
            An AI system that verifies economic claims using real-time official
            data, multi-source evidence, and structured reasoning.
          </p>

          {/* CTAs with glowing gradient borders */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <button
              className="group relative px-8 py-4 bg-transparent text-white font-semibold rounded-xl overflow-hidden transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              <span className="relative z-10 flex items-center gap-2">
                Enter Platform
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Animated gradient border */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-75 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(90deg, #2563EB, #22C55E, #2563EB)",
                  backgroundSize: "200% 100%",
                  padding: "2px",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-full h-full bg-black rounded-xl" />
              </motion.div>
            </button>

            <button
              className="px-8 py-4 text-white font-semibold rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              onClick={() => navigate("/trending")}
            >
              View Trending Rumours →
            </button>
          </div>
        </motion.div>

        {/* Right: Floating Glass Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative"
        >
          {/* Floating animation */}
          <motion.div
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Glass card */}
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden group">
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(34,197,94,0.3))",
                  filter: "blur(30px)",
                }}
              />

              <div className="relative z-10">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">
                  Example Verification
                </div>

                {/* Claim */}
                <div className="mb-6">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                    Claim
                  </div>
                  <div
                    className="text-xl font-serif text-white leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    "India's GDP growth rate was {gdpClaimed}% in 2024"
                  </div>
                </div>

                {/* Official */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        Official
                      </div>
                      <div className="text-2xl font-mono font-bold text-emerald-400">
                        {gdpOfficial}%
                      </div>
                      <div className="text-xs text-slate-500">World Bank</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        Error
                      </div>
                      <motion.div
                        className="text-2xl font-mono font-bold text-red-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        {error.toFixed(2)}%
                      </motion.div>
                    </div>
                  </div>

                  {/* Bar comparison */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">
                        Claimed: {gdpClaimed}%
                      </div>
                      <motion.div
                        className="h-2 bg-blue-500/40 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, delay: 0.6 }}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1">
                        Official: {gdpOfficial}%
                      </div>
                      <motion.div
                        className="h-2 bg-emerald-500/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "86.5%" }}
                        transition={{ duration: 1, delay: 0.8 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Verdict */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">Verdict</div>
                  <div className="inline-flex px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-semibold">
                    Misleading
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-2 bg-white/50 rounded-full"
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
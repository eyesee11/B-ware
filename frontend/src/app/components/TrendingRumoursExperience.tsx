import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

const sources = [
  "Reuters",
  "AltNews",
  "FactCheck.org",
  "NewsAPI",
  "World Bank",
  "Google Fact Check",
];

export function TrendingRumoursExperience() {
  const [dangerScore, setDangerScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDangerScore(82);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Animated scrolling ticker */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden">
        <div className="flex">
          <motion.div
            className="flex gap-12 whitespace-nowrap py-4"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...sources, ...sources, ...sources].map((source, index) => (
              <div key={index} className="flex items-center gap-12">
                <span className="text-sm font-mono text-slate-600">
                  {source}
                </span>
                <span className="text-slate-700">•</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Moving red gradient wave */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "radial-gradient(circle 800px at 50% 50%, rgba(239, 68, 68, 0.5), transparent)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto pt-20">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className="text-6xl font-serif font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Danger Score: Real-Time Misinformation Tracking
          </h2>
        </motion.div>

        {/* Example rumour feed card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />

          <div className="relative z-10">
            {/* Headline */}
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="text-xs text-red-400 uppercase tracking-wider mb-2">
                  Trending Claim
                </div>
                <h3
                  className="text-3xl font-serif font-bold text-white mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  "Fiscal deficit hits 10%"
                </h3>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Danger Score
                </div>
                <motion.div
                  className="text-5xl font-mono font-bold text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {dangerScore}
                </motion.div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Confidence
                </div>
                <div className="text-5xl font-mono font-bold text-amber-400">
                  0.71
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Sources
                </div>
                <div className="text-5xl font-mono font-bold text-blue-400">
                  4
                </div>
              </div>
            </div>

            {/* Animated danger meter */}
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                Threat Level
              </div>
              <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "82%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  {/* Animated shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300">
            Explore Live Feed →
          </button>
        </motion.div>
      </div>
    </section>
  );
}

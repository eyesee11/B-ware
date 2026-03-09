import { motion } from "motion/react";

const sources = [
  { name: "World Bank", logo: "WB" },
  { name: "IMF", logo: "IMF" },
  { name: "RBI", logo: "RBI" },
  { name: "Google Fact Check", logo: "GFC" },
  { name: "NewsAPI", logo: "API" },
];

export function ResearchTransparencyBlock() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2
            className="text-6xl font-serif font-bold text-white mb-6 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built on Public Data.
          </h2>
          <p className="text-[17px] text-slate-400 max-w-2xl mx-auto">
            All verdicts are backed by traceable public datasets and documented
            sources.
          </p>
        </motion.div>

        {/* Logos grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {sources.map((source, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Minimalist logo placeholder */}
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-white/30 transition-colors">
                <span className="text-slate-500 font-mono text-xs font-bold group-hover:text-slate-300 transition-colors">
                  {source.logo}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {source.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Supporting badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold">
            ✓ Open Source Methodology
          </span>
          <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-semibold">
            ✓ Fully Auditable
          </span>
          <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 text-xs font-semibold">
            ✓ Research-Grade Accuracy
          </span>
        </motion.div>
      </div>
    </section>
  );
}

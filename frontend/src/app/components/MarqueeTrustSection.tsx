import { motion } from "motion/react";

const sources = [
  "World Bank",
  "IMF",
  "RBI",
  "data.gov",
  "Official Economic Data",
  "Public APIs",
];

export function MarqueeTrustSection() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Marquee */}
      <div className="relative mb-12">
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-12 whitespace-nowrap"
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
                <span className="text-2xl font-mono text-slate-600 font-semibold">
                  {source}
                </span>
                <span className="text-slate-700">•</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>

      {/* Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <p className="text-sm text-slate-400 uppercase tracking-widest">
          Built on public, government-backed datasets.
        </p>
      </motion.div>
    </section>
  );
}

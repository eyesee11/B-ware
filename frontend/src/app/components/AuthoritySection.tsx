import { motion } from "motion/react";

const dataSources = ["World Bank", "IMF", "RBI", "data.gov"];

export function AuthoritySection() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-16 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Powered by Public Data.
        </motion.h2>

        {/* Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {dataSources.map((source, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center"
            >
              <div className="text-2xl font-mono text-slate-500 hover:text-slate-300 transition-colors">
                {source}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-sm text-slate-500 uppercase tracking-widest"
        >
          Built on official economic datasets.
        </motion.p>
      </div>
    </section>
  );
}

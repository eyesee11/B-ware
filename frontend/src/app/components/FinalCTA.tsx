import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-48 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-12 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Ready to Verify a Claim?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8"
        >
          <button className="group relative px-12 py-6 bg-white text-black text-lg font-bold rounded-full hover:bg-blue-50 transition-all duration-300 overflow-hidden">
            <span className="relative z-10 flex items-center gap-3">
              Enter Platform
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)",
              }}
              whileHover={{ scale: 1.5 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              className="absolute inset-0"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(37,99,235,0.3)",
                  "0 0 60px rgba(37,99,235,0.5)",
                  "0 0 20px rgba(37,99,235,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-slate-400 text-sm"
        >
          Open the full verification dashboard.
        </motion.p>
      </div>
    </section>
  );
}

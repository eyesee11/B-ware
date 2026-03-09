import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function TransitionCTA() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      {/* Subtle spotlight */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 600px at 50% 50%, rgba(37, 99, 235, 0.1), transparent)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-6xl font-serif font-bold text-white mb-12 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Ready to test a claim?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <button className="group relative px-12 py-6 bg-white text-black text-lg font-bold rounded-2xl hover:bg-blue-50 transition-all duration-300 overflow-hidden">
            <span className="relative z-10 flex items-center gap-3">
              Enter the Platform
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            </span>

            {/* Animated glow */}
            <motion.div
              className="absolute inset-0"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(37,99,235,0.3)",
                  "0 0 60px rgba(37,99,235,0.6)",
                  "0 0 20px rgba(37,99,235,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Gradient on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundSize: "200% 100%" }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-sm text-slate-500"
        >
          Open the full AI verification system.
        </motion.p>
      </div>
    </section>
  );
}

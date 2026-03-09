import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export function FinalTransition() {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      {/* Subtle spotlight */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 800px at 50% 50%, rgba(37, 99, 235, 0.12), transparent)",
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-6xl font-serif font-bold text-white mb-16 tracking-tight leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Because facts should be verified,
          <br />
          not assumed.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          {/* Large glowing CTA */}
          <button
            onClick={() => navigate("/verify")}
            className="group relative px-12 py-6 bg-transparent text-white text-lg font-bold rounded-2xl overflow-hidden transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-3">
              Enter the Verification Platform
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            </span>

            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(90deg, #2563EB, #22C55E, #8B5CF6, #2563EB)",
                backgroundSize: "300% 100%",
                padding: "2px",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center" />
            </motion.div>

            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(37,99,235,0.3)",
                  "0 0 80px rgba(37,99,235,0.6)",
                  "0 0 30px rgba(37,99,235,0.3)",
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
          className="text-sm text-slate-500"
        >
          Open the full AI-powered dashboard.
        </motion.p>
      </div>
    </section>
  );
}
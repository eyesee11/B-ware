import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function StorytellingParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const lines = ["Misinformation spreads instantly.", "Verification requires intelligence."];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      {/* Layer 1: Moving grid */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 opacity-[0.03]"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37, 99, 235, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </motion.div>

      {/* Layer 2: Animated line chart */}
      <motion.div style={{ y: y2 }} className="absolute inset-0 opacity-[0.05]">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M 0 500 Q 150 400 300 420 T 600 380 L 900 350 L 1200 370 L 1500 340 L 1800 360"
            stroke="#22C55E"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      {/* Layer 3: Floating numeric data particles */}
      <div className="absolute inset-0">
        {[7.5, 6.49, 15.48, 82, 0.71, 100].map((num, i) => (
          <motion.div
            key={i}
            className="absolute font-mono text-blue-500/20 text-sm"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {num}%
          </motion.div>
        ))}
      </div>

      {/* Text content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-5xl mx-auto px-4 text-center"
      >
        {lines.map((line, index) => (
          <motion.h2
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.3 }}
            className="text-[44px] font-serif font-bold text-white mb-4 tracking-tight leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {line}
          </motion.h2>
        ))}
      </motion.div>
    </section>
  );
}

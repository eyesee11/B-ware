import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function CinematicTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const words = [
    "Misinformation",
    "moves",
    "fast.",
    "Data",
    "moves",
    "slower.",
    "We",
    "bridge",
    "the",
    "gap.",
  ];

  return (
    <motion.section
      ref={ref}
      style={{ opacity }}
      className="relative min-h-screen flex items-center justify-center py-32"
    >
      {/* Animated line graph background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M 0 300 Q 200 200 400 250 T 800 200 L 1200 150 L 1600 180 L 2000 160"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            viewport={{ once: true }}
          />
        </svg>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h2
          className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.3] tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {words.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="inline-block mr-4"
            >
              {word}
            </motion.span>
          ))}
        </h2>
      </div>
    </motion.section>
  );
}

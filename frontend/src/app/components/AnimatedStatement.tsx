import { motion } from "motion/react";

export function AnimatedStatement() {
  const lines = [
    "Misinformation spreads fast.",
    "Verification should move faster.",
  ];

  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37, 99, 235, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.5) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Animated beam sweep */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {lines.map((line, index) => (
          <motion.h2
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.4 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {line}
          </motion.h2>
        ))}
      </div>
    </section>
  );
}

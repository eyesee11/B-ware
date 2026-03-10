import { motion } from "motion/react";
import { Server, Database, Zap, Code } from "lucide-react";
import { useState } from "react";

const nodes = [
  { id: 1, label: "Browser", icon: Code, x: 20, y: 50 },
  { id: 2, label: "Node.js", icon: Server, x: 35, y: 50 },
  { id: 3, label: "MySQL", icon: Database, x: 50, y: 35 },
  { id: 4, label: "Redis Cache", icon: Zap, x: 50, y: 65 },
  { id: 5, label: "NLP Service", icon: Code, x: 65, y: 50 },
  { id: 6, label: "External APIs", icon: Server, x: 80, y: 50 },
];

const connections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 2, to: 5 },
  { from: 5, to: 6 },
];

export function ArchitecturePreview() {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const tooltips: Record<number, string> = {
    1: "React frontend with real-time WebSocket updates",
    2: "Express.js API server handling verification requests",
    3: "Persistent storage for claims, verdicts, and analytics",
    4: "High-speed caching layer for repeated queries",
    5: "Python FastAPI service for NLP and LLM processing",
    6: "World Bank, NewsAPI, Google Fact Check, Gemini API",
  };

  return (
    <section className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto">
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
            System Architecture
          </h2>
          <p className="text-[17px] text-slate-400">
            Distributed verification infrastructure
          </p>
        </motion.div>

        {/* Architecture diagram */}
        <div className="relative h-[500px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn, index) => {
              const fromNode = nodes.find((n) => n.id === conn.from);
              const toNode = nodes.find((n) => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              return (
                <motion.line
                  key={index}
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke="rgba(37, 99, 235, 0.3)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              );
            })}
          </svg>

          {/* Animated data pulses */}
          {connections.map((conn, index) => {
            const fromNode = nodes.find((n) => n.id === conn.from);
            const toNode = nodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            return (
              <motion.div
                key={`pulse-${index}`}
                className="absolute w-2 h-2 bg-blue-400 rounded-full"
                style={{
                  left: `${fromNode.x}%`,
                  top: `${fromNode.y}%`,
                }}
                animate={{
                  left: [`${fromNode.x}%`, `${toNode.x}%`],
                  top: [`${fromNode.y}%`, `${toNode.y}%`],
                  opacity: [1, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.4,
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Node circle */}
              <motion.div
                className="relative w-20 h-20 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/20 rounded-full flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.2 }}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow:
                      hoveredNode === node.id
                        ? "0 0 40px rgba(37, 99, 235, 0.6)"
                        : "0 0 20px rgba(37, 99, 235, 0.3)",
                  }}
                />

                <node.icon className="w-8 h-8 text-blue-400 relative z-10" />
              </motion.div>

              {/* Label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-white">
                {node.label}
              </div>

              {/* Tooltip */}
              {hoveredNode === node.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-black border border-white/20 rounded-xl p-3 text-xs text-slate-300 leading-relaxed shadow-xl"
                >
                  {tooltips[node.id]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/20" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Tech stack labels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {["React", "Node.js", "MySQL", "Redis", "Python FastAPI", "Gemini API"].map(
            (tech, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 font-mono"
              >
                {tech}
              </span>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}

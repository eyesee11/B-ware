import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface CredibilityMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function CredibilityMeter({
  score,
  size = 180,
  strokeWidth = 12,
  animate = true,
}: CredibilityMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (animate) {
      const duration = 2000;
      const steps = 60;
      const stepValue = score / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayScore(Math.min(stepValue * currentStep, score));
        if (currentStep >= steps) clearInterval(interval);
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setDisplayScore(score);
    }
  }, [score, animate]);

  const getColor = () => {
    if (score >= 70) return "#22C55E";
    if (score >= 40) return "#F59E0B";
    return "#EF4444";
  };

  const getStatus = () => {
    if (score >= 70) return "Verified";
    if (score >= 40) return "Misleading";
    return "False";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="font-mono text-5xl font-bold"
          style={{ color: getColor() }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(displayScore)}%
        </motion.div>
        <div className="mt-1 text-sm text-slate-400 tracking-wider uppercase">
          {getStatus()}
        </div>
      </div>
    </div>
  );
}

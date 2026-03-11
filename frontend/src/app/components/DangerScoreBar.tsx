interface DangerScoreBarProps {
  score: number; // 0-100
}

function getColor(score: number) {
  if (score >= 70) return "from-red-600 to-red-500";
  if (score >= 40) return "from-orange-500 to-amber-400";
  return "from-green-600 to-emerald-500";
}

export function DangerScoreBar({ score }: DangerScoreBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>Danger Score</span>
        <span>{score}/100</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor(score)} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

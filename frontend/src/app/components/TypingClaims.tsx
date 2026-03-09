import { motion } from "motion/react";
import { useEffect, useState } from "react";

const exampleClaims = [
  "Unemployment is highest ever in 2022",
  "Petrol prices doubled since 2014",
  "Tax increased by 200%",
  "GDP growth is 15% this quarter",
];

export function TypingClaims() {
  const [currentClaimIndex, setCurrentClaimIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentClaim = exampleClaims[currentClaimIndex];
    const typingSpeed = isDeleting ? 30 : 60;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentClaim.length) {
          setDisplayText(currentClaim.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentClaimIndex((prev) => (prev + 1) % exampleClaims.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentClaimIndex]);

  return (
    <div className="relative bg-[#1E293B] border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/30 transition-colors cursor-pointer group">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 animate-pulse" />
        <div className="flex-1 min-h-[60px]">
          <div className="text-sm text-slate-400 mb-2 tracking-wide uppercase">
            Example Claim
          </div>
          <div className="text-xl text-white font-medium">
            "{displayText}
            <motion.span
              className="inline-block w-0.5 h-6 bg-blue-500 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            "
          </div>
        </div>
        <div className="flex-shrink-0 px-3 py-1 text-xs text-slate-500 border border-slate-700 rounded-md group-hover:text-blue-400 group-hover:border-blue-500/50 transition-colors">
          Click to verify
        </div>
      </div>
    </div>
  );
}

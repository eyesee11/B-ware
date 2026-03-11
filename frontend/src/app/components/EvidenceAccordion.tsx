import { useState } from "react";

interface Evidence {
  source: string;
  title?: string;
  snippet?: string;
  url?: string;
  nli_label?: "entailment" | "contradiction" | "neutral";
  nli_score?: number;
}

interface EvidenceAccordionProps {
  evidence: Evidence[];
}

const labelColor: Record<string, string> = {
  entailment:    "text-green-400",
  contradiction: "text-red-400",
  neutral:       "text-slate-400",
};

export function EvidenceAccordion({ evidence }: EvidenceAccordionProps) {
  const [open, setOpen] = useState(false);

  if (!evidence?.length) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between px-4 py-3 text-sm text-white/70 hover:bg-white/5 transition-colors"
      >
        <span>Evidence ({evidence.length} sources)</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="divide-y divide-white/5">
          {evidence.map((e, i) => (
            <div key={i} className="px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-white">{e.source}</span>
                {e.nli_label && (
                  <span className={labelColor[e.nli_label] ?? "text-slate-400"}>
                    {e.nli_label}
                    {e.nli_score != null && ` (${(e.nli_score * 100).toFixed(0)}%)`}
                  </span>
                )}
              </div>
              {e.title && <p className="text-white/60 mt-1">{e.title}</p>}
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 text-xs mt-1 block"
                >
                  View source →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

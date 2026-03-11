/** Format NLP confidence (0.0–1.0) to percentage string */
export function fmtConfidence(c: number | null): string {
  if (c == null) return "—";
  return (c * 100).toFixed(1) + "%";
}

/** Format percentage error from Tier 1 numeric check */
export function fmtPctError(e: number | null): string {
  if (e == null) return "—";
  return e.toFixed(2) + "%";
}

/** Format an economic value (GDP, inflation rate, etc.) */
export function fmtValue(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** Format ISO date to a relative or absolute readable string */
export function fmtDate(iso: string | null): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  const diffH = (Date.now() - d.getTime()) / 3600000;
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Map NLP tier_used value to a human-readable label */
export function fmtTier(tier: string | null): string {
  const map: Record<string, string> = {
    tier1: "Tier 1 — Numeric Check",
    tier2: "Tier 2 — NLI Evidence",
    tier3: "Tier 3 — LLM Reasoning",
  };
  return tier ? (map[tier] ?? tier) : "Unknown";
}

================================================================================
FRONTEND — REMAINING TASKS
================================================================================
NLP service is live at: https://eyesee11-b-ware.hf.space
All backend API calls go through: https://b-ware-sand.vercel.app
Frontend NEVER calls port 5001 or HuggingFace directly.
The backend already handles auth, caching, and NLP proxying.
================================================================================

────────────────────────────────────────────────────────────────────────────────
TASK F-1 — Axios instance with JWT interceptor
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/api/axios.js

WHAT IS MISSING:
Every page that calls the backend needs a pre-configured Axios instance.
Currently no such file exists and `axios` is not in package.json.
Without this, all backend endpoints (claims, trending, auth) are unreachable.

HOW TO CREATE IT:

STEP 1 — Install axios
cd frontend
npm install axios

STEP 2 — Create frontend/src/api/axios.js

    import axios from "axios";

    const api = axios.create({
      baseURL: "https://b-ware-sand.vercel.app",
    });

    // attach JWT token to every request automatically
    api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // redirect to login on 401 globally
    api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    );

    export default api;

NLP RELATION:
This instance is the single entry point for all calls that ultimately
reach the NLP service. The chain is:
React component → api.post("/api/claims/verify") → Node backend
→ POST https://eyesee11-b-ware.hf.space/verify → result back to React

────────────────────────────────────────────────────────────────────────────────
TASK F-2 — AuthContext (JWT state management)
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/context/AuthContext.jsx

WHAT IS MISSING:
No global auth state exists. Pages cannot know if the user is logged in,
and there is no way to store/clear the JWT token from within components.

HOW TO CREATE IT:

import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(
JSON.parse(localStorage.getItem("user") || "null")
);

    async function login(email, password) {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }

    async function register(name, email, password) {
      const { data } = await api.post("/api/auth/register", { name, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }

    async function logout() {
      try { await api.post("/api/auth/logout"); } catch {}
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }

    return (
      <AuthContext.Provider value={{ user, login, register, logout }}>
        {children}
      </AuthContext.Provider>
    );

}

export const useAuth = () => useContext(AuthContext);

Then wrap the app in main.tsx:
<AuthProvider><App /></AuthProvider>

And add routes for /login and /register in routes.ts.

NLP RELATION:
The JWT token stored here is what the Axios interceptor (F-1) sends on
every request to the backend. Without a valid JWT, the backend rejects
all claims/verify calls and the NLP pipeline never fires.

────────────────────────────────────────────────────────────────────────────────
TASK F-3 — Login Page + Register Page
────────────────────────────────────────────────────────────────────────────────

FILES TO CREATE:
frontend/src/app/pages/LoginPage.tsx
frontend/src/app/pages/RegisterPage.tsx

WHAT IS MISSING:
There are no auth screens. The app has no way to issue a JWT token to the
user, so all protected backend endpoints (claim verification, history,
stats) are permanently inaccessible.

HOW TO CREATE THEM:

LoginPage.tsx: - Two inputs: email, password - On submit: call useAuth().login(email, password) - On success: navigate("/verify") - On error: show error message from err.response.data.error - Link to /register

RegisterPage.tsx: - Three inputs: name, email, password - On submit: call useAuth().register(name, email, password) - On success: navigate("/verify") - On error: display validation error - Link to /login

Add to routes.ts:
{ path: "/login", Component: LoginPage }
{ path: "/register", Component: RegisterPage }

NLP RELATION:
Login → JWT → all NLP-backed endpoints become accessible.
Without login, POST /api/claims/verify (which calls the NLP service)
returns 401 and no verification can happen.

────────────────────────────────────────────────────────────────────────────────
TASK F-4 — Wire ClaimSubmissionPage to real backend API
────────────────────────────────────────────────────────────────────────────────

FILE: frontend/src/app/pages/ClaimSubmissionPage.tsx

WHAT IS MISSING:
handleSubmit() currently does:
setTimeout(() => navigate("/result/example"), 2000)
It never calls the backend. The NLP pipeline is never invoked.

HOW TO FIX IT:

STEP 1 — Replace fake submit with real API call
import api from "../../api/axios";

    const handleSubmit = async () => {
      if (!claim.trim()) return;
      setIsSubmitting(true);
      try {
        const endpoint =
          selectedDepth === "quick" ? "/api/claims/quick"
          : selectedDepth === "deep"  ? "/api/claims/deep"
          : "/api/claims/verify";

        const { data } = await api.post(endpoint, { text: claim });
        navigate(`/result/${data.claim_id}`);
      } catch (err) {
        setError(err.response?.data?.error || "Verification failed");
      } finally {
        setIsSubmitting(false);
      }
    };

STEP 2 — Add error state display
const [error, setError] = useState("");
// render: {error && <p className="text-red-400">{error}</p>}

NLP RELATION:
/api/claims/verify → NLP POST /verify (adaptive 3-tier)
/api/claims/quick → NLP POST /verify/quick (Tier 1 only, fastest)
/api/claims/deep → NLP POST /verify/deep (forces all 3 tiers)

    The NLP service at https://eyesee11-b-ware.hf.space runs:
      Tier 1 — World Bank numeric comparison
      Tier 2 — BART-MNLI NLI against news/fact-check evidence
      Tier 3 — Gemini 1.5 Flash LLM reasoning
    The result (verdict, confidence, evidence, explanation) is stored in
    MySQL and returned as data.claim_id for the result page to fetch.

────────────────────────────────────────────────────────────────────────────────
TASK F-5 — Wire CredibilityResultPage to real backend API
────────────────────────────────────────────────────────────────────────────────

FILE: frontend/src/app/pages/CredibilityResultPage.tsx

WHAT IS MISSING:
The page uses a hardcoded `mockResult` object.
It ignores the `:id` URL param and never calls GET /api/claims/:id.

HOW TO FIX IT:

STEP 1 — Fetch real data on mount
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import api from "../../api/axios";

    const { id } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      api.get(`/api/claims/${id}`)
        .then(({ data }) => setResult(data))
        .catch(() => setResult(null))
        .finally(() => setLoading(false));
    }, [id]);

STEP 2 — Replace all mockResult._ references with result._
Key field mappings from the backend response:
mockResult.verdict → result.verdict
mockResult.credibilityScore → result.confidence \* 100 (or result.credibility_score)
mockResult.claimedValue → result.claimed_value
mockResult.officialValue → result.official_value
mockResult.percentageError → result.percentage_error
mockResult.tierUsed → result.tier_used
mockResult.tier3.llmExplanation → result.explanation
mockResult.tier2.articles → result.evidence_json (from JOIN with verification_log)

NLP RELATION:
The data shown on this page is the full output of the NLP RAV pipeline: - official_value: from World Bank API (Tier 1) - evidence_json: BART-MNLI NLI results from news/fact-check (Tier 2) - explanation: Gemini LLM reasoning (Tier 3, if escalated) - tier_used: which tier produced the final verdict

────────────────────────────────────────────────────────────────────────────────
TASK F-6 — Paragraph Analyzer Page (new page)
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/app/pages/AnalyzePage.tsx
ADD TO routes.ts: { path: "/analyze", Component: AnalyzePage }

WHAT IS MISSING:
The spec requires a dedicated page for multi-sentence paragraph analysis.
No such page exists. The NLP /analyze endpoint is never used by the frontend.

HOW TO CREATE IT:

UI structure: - Large <textarea> for paragraph input (up to 2000 chars) - "Analyze" button - Sentence-by-sentence results list

API call:
// Use /analyze on the NLP service via the backend proxy
// Note: the backend does not have a dedicated /analyze route.
// Either add one, or call /api/claims/verify per sentence on the frontend.

    Option A (recommended) — add a backend route first:
      POST /api/claims/analyze
        → backend calls NLP POST /analyze { text: paragraph }
        → returns array of { sentence, claim_probability, extraction }

    Option B — call /api/claims/verify for each extracted sentence
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const results = await Promise.all(
        sentences.map(s => api.post("/api/claims/verify", { text: s }))
      );

Result display per sentence: - Sentence text - claim_probability bar (from NLP /analyze response) - If claim_probability > 0.5: show VerdictBadge + confidence - Link to full result if verified

NLP RELATION:
POST https://eyesee11-b-ware.hf.space/analyze
Input: { text: "<full paragraph>" }
Output: { results: [{ sentence, claim_probability, extraction: { metric, value, year, confidence } }] }
This endpoint splits the paragraph, scores each sentence for "is this a
verifiable claim?", and extracts metric/value/year — all in one call.
The frontend then decides which sentences to send to /verify.

────────────────────────────────────────────────────────────────────────────────
TASK F-7 — Wire TrendAnalyticsPage (Dashboard) to real backend API
────────────────────────────────────────────────────────────────────────────────

FILE: frontend/src/app/pages/TrendAnalyticsPage.tsx

WHAT IS MISSING:
All stats (overviewStats, timelineData, scatterData, sourceLeaderboard) are
hardcoded arrays. The page never calls the backend.

HOW TO FIX IT:

STEP 1 — Fetch aggregate stats
import api from "../../api/axios";

    useEffect(() => {
      api.get("/api/claims/stats").then(({ data }) => {
        // data shape: { total, accurate, misleading, false, unverifiable, avg_confidence }
        setOverviewStats([
          { label: "Total Claims Verified", value: data.total },
          { label: "Accuracy Rate",         value: Math.round((data.accurate / data.total) * 100) },
          { label: "Misleading %",           value: Math.round((data.misleading / data.total) * 100) },
          { label: "False %",                value: Math.round((data.false / data.total) * 100) },
          { label: "Avg Confidence",         value: data.avg_confidence },
        ]);
      });
    }, []);

STEP 2 — Fetch claim history for table and charts
api.get("/api/claims?limit=50").then(({ data }) => {
setClaims(data.claims);
// derive timelineData by grouping data.claims by month
});

STEP 3 — Replace scatterData with real data
Map data.claims → { error: c.percentage_error, confidence: c.confidence }

NLP RELATION:
Every row in this table/chart is a past NLP verification result.
The `tier_used` column shows which NLP tier ran (tier1/tier2/tier3).
The `confidence` value is the NLP service's self-reported confidence.
The `percentage_error` comes from World Bank vs claimed value comparison.

────────────────────────────────────────────────────────────────────────────────
TASK F-8 — Wire TrendingRumoursPage to real backend API
────────────────────────────────────────────────────────────────────────────────

FILE: frontend/src/app/pages/TrendingRumoursPage.tsx

WHAT IS MISSING:
The page uses `mockRumours` — a hardcoded array.
It never calls GET /api/trending. There is no polling, no live filter,
no sort toggle, and the data shown has nothing to do with the NLP pipeline.

HOW TO FIX IT:

STEP 1 — Fetch real trending stories on mount + poll every 5 min
import api from "../../api/axios";

    const [stories, setStories] = useState([]);
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("danger");  // "danger" | "recency"

    const fetchTrending = () => {
      const params = filter !== "all" ? { verdict: filter } : {};
      api.get("/api/trending", { params }).then(({ data }) => {
        let sorted = data.stories;
        if (sort === "recency") {
          sorted = [...sorted].sort(
            (a, b) => new Date(b.published_at) - new Date(a.published_at)
          );
        }
        setStories(sorted);
      });
    };

    useEffect(() => {
      fetchTrending();
      const interval = setInterval(fetchTrending, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }, [filter, sort]);

STEP 2 — Replace mockRumours with stories in JSX
Map stories → card UI using:
story.headline, story.danger_score, story.confidence,
story.verdict, story.source_name, story.published_at,
story.claimed_value, story.official_value, story.pct_error

STEP 3 — Add filter chips (ALL | FALSE | MISLEADING | ACCURATE | UNVERIFIABLE)
<button onClick={() => setFilter("all")}>ALL</button>
<button onClick={() => setFilter("false")}>FALSE</button>
// etc.

STEP 4 — Add sort toggle
<button onClick={() => setSort("danger")}>DANGER SCORE</button>
<button onClick={() => setSort("recency")}>RECENCY</button>

NLP RELATION:
Every story.verdict, story.confidence, story.explanation, story.evidence_json
comes from the NLP RAV pipeline run by the backend cron job (every 30 min).
The backend calls POST /verify on each news headline → stores result in
trending_stories → this page reads and displays that data.

────────────────────────────────────────────────────────────────────────────────
TASK F-9 — Source Credibility Leaderboard Page (new page)
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/app/pages/SourcesPage.tsx
ADD TO routes.ts: { path: "/sources", Component: SourcesPage }

WHAT IS MISSING:
The spec requires a dedicated /sources page showing a table of news sources
ranked by their average danger score and false-claim rate.
Currently this data only appears as a small mock list in TrendAnalyticsPage.

HOW TO CREATE IT:

API call:
api.get("/api/trending/sources")
Response: { sources: [{ source_name, total_claims, accurate_count,
misleading_count, false_count, avg_danger_score }] }

Table columns:
Source Name | Total Claims | Accurate % | False % | Avg Danger Score
Sorted by avg_danger_score DESC (most dangerous first)

Compute derived columns:
accurate*pct = (accurate_count / total_claims * 100).toFixed(1) + "%"
false*pct = (false_count / total_claims * 100).toFixed(1) + "%"

NLP RELATION:
source_stats is populated by the backend cron job (trendingJob.js).
Each time the cron POSTs a headline to POST /verify (NLP service),
the returned verdict is aggregated per source into source_stats.
This page surfaces which publishers most frequently spread false/
misleading economic claims as judged by the NLP RAV pipeline.

────────────────────────────────────────────────────────────────────────────────
TASK F-10 — VerdictBadge component (fix missing unverifiable state)
────────────────────────────────────────────────────────────────────────────────

FILE: frontend/src/app/components/ResultBadge.tsx

WHAT IS MISSING:
The existing ResultBadge only handles "true" | "false" | "misleading".
The NLP service returns 4 verdicts: accurate | misleading | false | unverifiable.
The "unverifiable" case has no style, causing a render gap when the NLP
service cannot determine truth (no World Bank data + no NLI evidence).

HOW TO FIX IT:

Update the variants and labels maps to include all 4 NLP verdicts:

    const variants = {
      accurate:     "bg-green-500/10  text-green-500  border-green-500/50",
      misleading:   "bg-amber-500/10  text-amber-500  border-amber-500/50",
      false:        "bg-red-500/10    text-red-500    border-red-500/50",
      unverifiable: "bg-slate-500/10  text-slate-400  border-slate-500/50",
      // keep legacy "true" as alias for "accurate"
      true:         "bg-green-500/10  text-green-500  border-green-500/50",
    };

    const labels = {
      accurate:     "Accurate",
      misleading:   "Misleading",
      false:        "False",
      unverifiable: "Unverifiable",
      true:         "Verified",
    };

Update the TypeScript type:
status: "accurate" | "misleading" | "false" | "unverifiable" | "true"

NLP RELATION:
The NLP service verdict router returns "unverifiable" when: - Tier 1: no World Bank data found for the metric/year - Tier 2: NLI model returns mostly "neutral" (no strong evidence either way) - Tier 3: Gemini explicitly states insufficient information
This badge must display correctly for those NLP outcomes.

────────────────────────────────────────────────────────────────────────────────
TASK F-11 — DangerScoreBar component (new component)
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/app/components/DangerScoreBar.tsx

WHAT IS MISSING:
The TrendingRumoursPage spec calls for a 0-100 gradient bar showing
how dangerous each story is. No such component exists.

HOW TO CREATE IT:

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

NLP RELATION:
danger_score is computed from the NLP service output:
verdict_weight (from NLP verdict) + confidence_bonus (NLP confidence) + recency_bonus + spread_bonus (NLP evidence array length)
The bar visually represents the combined NLP analysis quality score.

────────────────────────────────────────────────────────────────────────────────
TASK F-12 — EvidenceAccordion component (new component)
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/app/components/EvidenceAccordion.tsx

WHAT IS MISSING:
The CredibilityResultPage spec shows an expandable list of evidence
snippets (from Tier 2 NLI). No such component exists, so none of the
Tier 2/3 NLP output is surfaced to users.

HOW TO CREATE IT:

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

export function EvidenceAccordion({ evidence }: EvidenceAccordionProps) {
const [open, setOpen] = useState(false);
if (!evidence?.length) return null;

    const labelColor = {
      entailment:    "text-green-400",
      contradiction: "text-red-400",
      neutral:       "text-slate-400",
    };

    return (
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <button onClick={() => setOpen(!open)}
          className="w-full flex justify-between px-4 py-3 text-sm text-white/70">
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
                    <span className={labelColor[e.nli_label]}>
                      {e.nli_label} ({(e.nli_score * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
                {e.title && <p className="text-white/60 mt-1">{e.title}</p>}
                {e.url && (
                  <a href={e.url} target="_blank" rel="noreferrer"
                    className="text-blue-400 text-xs mt-1 block">
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

NLP RELATION:
evidence[] is the Tier 2 output returned by the NLP service.
Each item is a news/fact-check snippet that BART-MNLI scored as
entailment / contradiction / neutral against the original claim.
nli_label and nli_score come directly from the NLP service response.

────────────────────────────────────────────────────────────────────────────────
TASK F-13 — FilterChips component (new component)
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/app/components/FilterChips.tsx

WHAT IS MISSING:
The TrendingRumoursPage needs filter chips to show ALL / FALSE / MISLEADING
/ ACCURATE / UNVERIFIABLE. No reusable component exists.

HOW TO CREATE IT:

const VERDICTS = ["all", "false", "misleading", "accurate", "unverifiable"];

const chipColors: Record<string, string> = {
all: "bg-white/10 text-white",
false: "bg-red-500/20 text-red-400 border-red-500/30",
misleading: "bg-amber-500/20 text-amber-400 border-amber-500/30",
accurate: "bg-green-500/20 text-green-400 border-green-500/30",
unverifiable: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

interface FilterChipsProps {
active: string;
onChange: (verdict: string) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
return (

<div className="flex flex-wrap gap-2">
{VERDICTS.map((v) => (
<button key={v}
onClick={() => onChange(v)}
className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border
              ${active === v ? chipColors[v] + " border-current" : "border-white/10 text-white/40"}
            `}>
{v}
</button>
))}
</div>
);
}

NLP RELATION:
The chip labels map directly to the verdict values returned by the NLP
service. Selecting a chip calls GET /api/trending?verdict=<chip> which
filters the trending_stories table by the NLP-assigned verdict.

────────────────────────────────────────────────────────────────────────────────
TASK F-14 — utils/formatters.ts
────────────────────────────────────────────────────────────────────────────────

FILE TO CREATE: frontend/src/utils/formatters.ts

WHAT IS MISSING:
No formatting utilities exist. Numbers and dates from the NLP/backend
responses are raw: 0.873421, "2026-03-09T12:00:00Z", 15.4823.
These need to be human-readable across multiple pages.

HOW TO CREATE IT:

// Format confidence from NLP response (0.0 → 1.0) to percentage string
export function fmtConfidence(c: number | null): string {
if (c == null) return "—";
return (c \* 100).toFixed(1) + "%";
}

// Format percentage error from NLP numeric check
export function fmtPctError(e: number | null): string {
if (e == null) return "—";
return e.toFixed(2) + "%";
}

// Format economic value (GDP in trillions, inflation rate, etc.)
export function fmtValue(v: number | null, metric?: string): string {
if (v == null) return "—";
return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Format ISO date string to readable relative or absolute date
export function fmtDate(iso: string | null): string {
if (!iso) return "Unknown";
const d = new Date(iso);
const diffH = (Date.now() - d.getTime()) / 3600000;
if (diffH < 1) return "Just now";
if (diffH < 24) return `${Math.floor(diffH)}h ago`;
return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Map NLP tier_used value to human-readable label
export function fmtTier(tier: string | null): string {
const map: Record<string, string> = {
tier1: "Tier 1 — Numeric Check",
tier2: "Tier 2 — NLI Evidence",
tier3: "Tier 3 — LLM Reasoning",
};
return tier ? (map[tier] ?? tier) : "Unknown";
}

NLP RELATION:
All values formatted here originate from the NLP service response: - confidence: NLP self-reported certainty - pct_error: Tier 1 World Bank numeric comparison result - tier_used: which NLP tier produced the final verdict - dates: published_at from news articles fetched by the trending cron job

================================================================================
END OF FRONTEND REMAINING TASKS
================================================================================

================================================================================
BACKEND — REMAINING TASKS
================================================================================
NLP service is live at: https://eyesee11-b-ware.hf.space
All tasks below require calling, storing, or acting on data from that service.
================================================================================

────────────────────────────────────────────────────────────────────────────────
TASK 1 — Google Fact Check API integration in trendingController.js
────────────────────────────────────────────────────────────────────────────────

FILE: backend/controllers/trendingController.js
INSIDE: runTrendingRefresh() (currently only fetches from NewsAPI)

WHAT IS MISSING:
The trending refresh function only calls NewsAPI /everything.
The spec requires a second data source: Google Fact Check API.
This source returns claims already investigated by AFP, AltNews, BOOM,
Snopes — these are the most viral, high-danger stories and are ideal
input for the RAV pipeline.

HOW TO ADD IT:

STEP 1 — Add env variable
In backend/.env and backend/.env.example add:
GOOGLE_FACT_CHECK_API_KEY=your_key_here

STEP 2 — Write the fetch function
Add this inside trendingController.js, alongside the NewsAPI block:

      async function fetchFromGoogleFactCheck() {
        const items = [];
        if (!process.env.GOOGLE_FACT_CHECK_API_KEY) {
          console.log("GOOGLE_FACT_CHECK_API_KEY not set — skipping");
          return items;
        }
        try {
          const { data } = await axios.get(
            "https://factchecktools.googleapis.com/v1alpha1/claims:search",
            {
              params: {
                query: "India economy",
                languageCode: "en",
                pageSize: 20,
                key: process.env.GOOGLE_FACT_CHECK_API_KEY,
              },
              timeout: 10000,
            }
          );

          for (const claim of data.claims || []) {
            const review = claim.claimReview?.[0];
            if (!review) continue;
            items.push({
              headline: claim.text,
              source_name: review.publisher?.name || "Unknown",
              source_url: review.url || null,
              published_at: claim.claimDate || null,
              content: claim.text,  // send directly to NLP /verify
            });
          }
        } catch (err) {
          console.error("Google Fact Check fetch failed:", err.message);
        }
        return items;
      }

STEP 3 — Merge with NewsAPI results in runTrendingRefresh()
Replace the current line:
const articles = [];
With:
const [newsArticles, factChecks] = await Promise.all([
fetchFromNewsAPI(),
fetchFromGoogleFactCheck(),
]);
const articles = [...newsArticles, ...factChecks];

    Then rename the inner fetchFromNewsAPI logic accordingly.

NLP RELATION:
Each Google Fact Check item's `content` field is sent to:
POST https://eyesee11-b-ware.hf.space/verify { text: item.content }
The same verify flow used for NewsAPI articles applies here.
The NLP service returns verdict, confidence, evidence[], explanation,
tier_used — all stored in trending_stories.

────────────────────────────────────────────────────────────────────────────────
TASK 2 — Add spread_bonus to calcDangerScore()
────────────────────────────────────────────────────────────────────────────────

FILE: backend/controllers/trendingController.js
INSIDE: calcDangerScore(verdict, confidence, publishedAt)

WHAT IS MISSING:
The spec defines 4 components for the danger score formula:
verdict_weight + confidence_bonus + recency_bonus + spread_bonus
The current implementation has the first three but is missing spread_bonus.
spread_bonus rewards stories corroborated by multiple sources.

HOW TO FIX IT:

STEP 1 — Update the function signature
Change:
function calcDangerScore(verdict, confidence, publishedAt)
To:
function calcDangerScore(verdict, confidence, publishedAt, sourceCount = 1)

STEP 2 — Add the bonus before the cap
Current code ends with:
return Math.min(Math.round(score), 100);

    Add before that line:
      // spread bonus: each additional corroborating source adds 5 points
      score += (sourceCount - 1) * 5;

STEP 3 — Pass sourceCount where calcDangerScore is called
In the processing loop inside runTrendingRefresh(), after the NLP call:
const score = calcDangerScore(
result.verdict,
result.confidence,
article.published_at,
result.evidence?.length ?? 1 // evidence array from NLP = proxy for source count
);

NLP RELATION:
The NLP service returns `evidence` — an array of snippets from Tier 2
(NewsAPI + Google Fact Check sources that were NLI-scored).
evidence.length is the best available proxy for "how many independent
sources corroborate or contradict this claim", making it the right value
to pass as sourceCount.

────────────────────────────────────────────────────────────────────────────────
TASK 3 — Filter: only save false/misleading stories to trending_stories
────────────────────────────────────────────────────────────────────────────────

FILE: backend/controllers/trendingController.js
INSIDE: runTrendingRefresh() — the processing loop

WHAT IS MISSING:
The spec says:
"Filter: only save if verdict === 'false' || 'misleading'"
Currently every story regardless of verdict is inserted into trending_stories.
This means accurate/unverifiable stories pollute the trending feed
which is supposed to surface dangerous/misleading content only.

HOW TO FIX IT:

STEP 1 — Add a verdict guard after the NLP call
In the processing loop, after:
const { data: result } = await nlp.post("/verify", { text: top.sentence });

    Add immediately after:
      // only surface stories that are harmful — accurate stories are not "trending rumours"
      if (!["false", "misleading"].includes(result.verdict)) continue;

STEP 2 — No other changes needed
The rest of the loop (calcDangerScore, INSERT into trending_stories) remains
exactly the same. The `continue` skips the DB insert for non-harmful verdicts.

NLP RELATION:
The verdict comes directly from:
POST https://eyesee11-b-ware.hf.space/verify → response.data.verdict
Possible values: "accurate" | "misleading" | "false" | "unverifiable"
Only "false" and "misleading" should be persisted.

================================================================================
END OF BACKEND REMAINING TASKS
================================================================================

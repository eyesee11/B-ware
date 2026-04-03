require("dotenv").config();
const db = require("../config/db");

const sampleStories = [
  {
    headline: "India's GDP growth slows to 5.2% in Q3 2024",
    claim_text: "India's GDP grew at 5.2% in Q3 2024",
    source_name: "Reuters",
    source_url: "https://reuters.com/india-gdp-q3-2024",
    published_at: new Date(Date.now() - 2 * 3600000),
    verdict: "accurate",
    confidence: 0.95,
    danger_score: 5,
    metric: "GDP growth rate",
    official_value: 5.2,
    claimed_value: 5.2,
    pct_error: 0,
    explanation: "Official government data confirms this figure.",
  },
  {
    headline: "Inflation rate hits 8-month high of 6.71% in India",
    claim_text: "Inflation in India reaches 6.71%",
    source_name: "Bloomberg",
    source_url: "https://bloomberg.com/india-inflation-671",
    published_at: new Date(Date.now() - 5 * 3600000),
    verdict: "accurate",
    confidence: 0.92,
    danger_score: 15,
    metric: "Inflation rate",
    official_value: 6.71,
    claimed_value: 6.71,
    pct_error: 0,
    explanation: "Confirmed by RBI's latest CPI data.",
  },
  {
    headline: "India's unemployment crosses 8% amid economic slowdown",
    claim_text: "Unemployment in India exceeds 8%",
    source_name: "The Guardian",
    source_url: "https://theguardian.com/india-unemployment-8",
    published_at: new Date(Date.now() - 8 * 3600000),
    verdict: "misleading",
    confidence: 0.78,
    danger_score: 45,
    metric: "Unemployment rate",
    official_value: 6.2,
    claimed_value: 8.0,
    pct_error: 29,
    explanation: "The figure is outdated; latest data shows 6.2%, not 8%.",
  },
  {
    headline: "Reserve Bank hikes repo rate to 7% to battle inflation",
    claim_text: "RBI increases repo rate to 7%",
    source_name: "Financial Times",
    source_url: "https://ft.com/rbi-repo-rate-7",
    published_at: new Date(Date.now() - 12 * 3600000),
    verdict: "false",
    confidence: 0.88,
    danger_score: 75,
    metric: "Repo rate",
    official_value: 6.5,
    claimed_value: 7.0,
    pct_error: 8,
    explanation: "RBI's current repo rate is 6.5%, not 7%. This is misleading.",
  },
  {
    headline: "India's forex reserves surge to new record high",
    claim_text: "India's forex reserves reach all-time high of $650 billion",
    source_name: "BBC",
    source_url: "https://bbc.com/india-forex-reserves",
    published_at: new Date(Date.now() - 1 * 3600000),
    verdict: "unverifiable",
    confidence: 0.45,
    danger_score: 20,
    metric: "Forex reserves",
    official_value: null,
    claimed_value: 650,
    pct_error: null,
    explanation: "Recent data not yet published; claim needs verification.",
  },
  {
    headline: "GST collection dips 15% in December amid holiday slump",
    claim_text: "GST collection declined by 15% in December",
    source_name: "Wall Street Journal",
    source_url: "https://wsj.com/india-gst-december",
    published_at: new Date(Date.now() - 18 * 3600000),
    verdict: "accurate",
    confidence: 0.91,
    danger_score: 10,
    metric: "GST collection",
    official_value: -15,
    claimed_value: -15,
    pct_error: 0,
    explanation: "Confirmed by Ministry of Finance official statements.",
  },
];

async function seedTrending() {
  try {
    console.log("Clearing existing trending stories...");
    await db.query("DELETE FROM trending_stories");

    console.log("Inserting sample trending stories...");
    for (const story of sampleStories) {
      const crypto = require("crypto");
      const urlHash = crypto
        .createHash("md5")
        .update(story.source_url)
        .digest("hex");

      await db.query(
        `INSERT INTO trending_stories
         (headline, claim_text, source_name, source_url, url_hash, published_at,
          verdict, confidence, danger_score, metric, official_value,
          claimed_value, pct_error, explanation, tier_used, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          story.headline,
          story.claim_text,
          story.source_name,
          story.source_url,
          urlHash,
          story.published_at,
          story.verdict,
          story.confidence,
          story.danger_score,
          story.metric,
          story.official_value,
          story.claimed_value,
          story.pct_error,
          story.explanation,
          "tier1",
          1,
        ]
      );
    }

    console.log(`✓ Successfully seeded ${sampleStories.length} trending stories`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err.message);
    process.exit(1);
  }
}

seedTrending();

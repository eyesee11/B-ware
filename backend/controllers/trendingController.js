const db = require("../config/db"); // mysql connection
const redis = require("../config/redis"); // redis used for caching
const nlp = require("../services/nlpService"); // service to call NLP verification api
const axios = require("axios"); // used to fetch news from NewsAPI
const crypto = require("crypto"); // used to hash url

/*
  function to calculate danger score for a story

  logic:
  false claim = highest base score
  misleading = medium
  unverifiable = low
  accurate = 0

  then we add:
  + confidence bonus
  + recency bonus (recent news more dangerous)
*/

function calcDangerScore(verdict, confidence, publishedAt,sourceCount=1) {
  const weights = {
    false: 80,
    misleading: 40,
    unverifiable: 15,
    accurate: 0,
  };

  let score = weights[verdict] || 0;

  // confidence bonus
  score += (confidence || 0) * 20;

  // recency bonus
  if (publishedAt) {
    const hoursOld = (Date.now() - new Date(publishedAt).getTime()) / 3600000;

    if (hoursOld < 2) score += 10;
    else if (hoursOld < 24) score += 5;
  }
  score+=(sourceCount-1)*5;
  // cap score at 100
  return Math.min(Math.round(score), 100);
}

// get trending stories feed
exports.getTrending = async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const filter = req.query.verdict;

  const cacheKey = `trending_feed:${filter || "all"}`;

  // check redis cache
  let cached = null;
  try {
    cached = await redis.get(cacheKey);
  } catch {
    /* Redis unavailable — fall through to DB */
  }
  if (cached) {
    try {
      return res.json(JSON.parse(cached));
    } catch {}
  }

  try {
    const allowed = ["accurate", "misleading", "false", "unverifiable"];

    const queryParams = [];
    let where = "WHERE is_active = 1";

    // optional filter by verdict
    if (filter && allowed.includes(filter)) {
      where += " AND verdict = ?";
      queryParams.push(filter);
    }

    queryParams.push(limit);

    const [rows] = await db.query(
      `SELECT id, headline, claim_text, source_name, source_url, published_at,
              fetched_at, verdict, confidence, danger_score, metric,
              official_value, claimed_value, pct_error, explanation, tier_used
       FROM trending_stories
       ${where}
       ORDER BY danger_score DESC
       LIMIT ?`,
      queryParams,
    );

    // get last update time
    const [[{ last_updated }]] = await db.query(
      "SELECT MAX(fetched_at) as last_updated FROM trending_stories WHERE is_active = 1",
    );

    const result = {
      stories: rows,
      last_updated,
      total: rows.length,
    };

    // cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

    res.json(result);
  } catch (err) {
    console.error("getTrending:", err.message);

    res.status(500).json({
      error: "Could not fetch trending stories",
    });
  }
};

// get reliability stats of sources
exports.getSourceStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT source_name, total_claims, accurate_count, misleading_count,
              false_count, avg_danger_score, last_updated
       FROM source_stats ORDER BY avg_danger_score DESC LIMIT 50`,
    );

    res.json({ sources: rows });
  } catch (err) {
    res.status(500).json({
      error: "Could not fetch source stats",
    });
  }
};

// get single trending story by id
exports.getTrendingById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM trending_stories WHERE id = ? AND is_active = 1",
      [req.params.id],
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "Story not found",
      });
    }

    const story = rows[0];

    // convert evidence json string to object
    if (story.evidence_json && typeof story.evidence_json === "string") {
      try {
        story.evidence_json = JSON.parse(story.evidence_json);
      } catch {}
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({
      error: "Could not fetch story",
    });
  }
};

// manual refresh endpoint (admin only)
exports.refreshTrending = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Admin only",
    });
  }

  try {
    const count = await runTrendingRefresh();

    res.json({
      refreshed: true,
      stories_processed: count,
    });
  } catch (err) {
    console.error("refreshTrending:", err.message);

    res.status(500).json({
      error: "Refresh failed",
    });
  }
};

// main function which fetches news and verifies them
async function runTrendingRefresh() {
  //inner function to fetch news from NewsAPI
  async function fetchFromNewsAPI() {
    const articles = [];

    if (process.env.NEWS_API_KEY) {
      try {
        const { data } = await axios.get("https://newsapi.org/v2/everything", {
          params: {
            q: "India economy GDP inflation unemployment",
            language: "en",
            sortBy: "publishedAt",
            pageSize: 20,
            apiKey: process.env.NEWS_API_KEY,
          },
          timeout: 10000,
        });
        for (const a of data.articles || []) {
          articles.push({
            headline: a.title,
            source_name: a.source?.name || "Unknown",
            source_url: a.url,
            published_at: a.publishedAt,
            content: a.description || a.title,
          });
        }
      } catch (err) {
        console.error("NewsAPI fetch failed:", err.message);
      }
    } else {
      console.log("NEWS_API_KEY not set — skipping news fetch");
    }
    return articles;
  }

  //inner function to fetch claims from Google fact check api
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
        },
      );
      // convert api response to our article format
      for (const claim of data.claims || []) {
        const review = claim.claimReview?.[0];
        if (!review) continue;
        items.push({
          headline: claim.title,
          source_name: claim.source?.name || "Unknown",
          source_url: claim.url,
          published_at: claim.publishedAt,
          content: claim.description || claim.title,
        });
      }
    } catch (err) {
      console.error("Google Fact check fetch failed:", err.message);
    }
    return items;
  }
  //fetch both sources in parallel
  const [newsArticles, factChecks] = await Promise.all([
    fetchFromNewsAPI(),
    fetchFromGoogleFactCheck(),
  ]);
  const articles = [...newsArticles, ...factChecks];

  // filter articles that are not already stored
  const fresh = [];

  for (const a of articles) {
    if (!a.source_url) continue;

    // compute hash in JS so MySQL can use the indexed url_hash column
    const urlHash = crypto.createHash("md5").update(a.source_url).digest("hex");

    const [exists] = await db.query(
      "SELECT id FROM trending_stories WHERE url_hash = ?",
      [urlHash],
    );

    if (exists.length === 0) fresh.push({ ...a, urlHash });
  }

  let processed = 0;

  // process each new article
  for (const article of fresh) {
    try {
      // analyze article text to extract claims
      const { data: analysis } = await nlp.post("/analyze", {
        text: article.content,
      });

      // pick claim with highest confidence
      const top = analysis.results?.sort(
        (a, b) => b.extraction.confidence - a.extraction.confidence,
      )[0];

      if (!top || top.extraction.confidence < 0.3) continue;

      // verify the extracted claim
      const { data: result } = await nlp.post("/verify", {
        text: top.sentence,
      });

      if (!["false", "misleading"].includes(result.verdict)) continue;

      const score = calcDangerScore(
        result.verdict,
        result.confidence,
        article.published_at,
        result.evidence?.length || 1,
      );

      // save trending story
      await db.query(
        `INSERT INTO trending_stories
           (headline, claim_text, source_name, source_url, url_hash, published_at,
            verdict, confidence, danger_score, metric, official_value,
            claimed_value, pct_error, explanation, evidence_json, tier_used)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          article.headline,
          top.sentence,
          article.source_name,
          article.source_url,
          article.urlHash,
          article.published_at || null,
          result.verdict,
          result.confidence,
          score,
          result.extracted_metric,
          result.official_value,
          result.extracted_value,
          result.percentage_error,
          result.explanation,
          JSON.stringify(result.evidence || []),
          result.tier_used,
        ],
      );

      processed++;
    } catch (err) {
      console.error(`skipping "${article.headline}":`, err.message);
    }
  }

  // deactivate stories older than 48 hours
  await db.query(
    "UPDATE trending_stories SET is_active = 0 WHERE fetched_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)",
  );

  // clear redis cache for trending feed (use pipeline to avoid arg-count limits)
  const keys = await redis.keys("trending_feed:*");
  if (keys.length > 0) {
    const pipeline = redis.pipeline();
    keys.forEach((k) => pipeline.del(k));
    await pipeline.exec();
  }

  console.log(`Trending refresh done: ${processed} new stories`);

  return processed;
}

exports.runTrendingRefresh = runTrendingRefresh;

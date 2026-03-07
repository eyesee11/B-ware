const db    = require('../config/db');
const redis = require('../config/redis');
const nlp   = require('../services/nlpService');
const axios = require('axios');

// danger score 0-100 based on verdict, confidence, and recency
function calcDangerScore(verdict, confidence, publishedAt) {
  const weights = { false: 80, misleading: 40, unverifiable: 15, accurate: 0 };
  let score = weights[verdict] || 0;
  score += (confidence || 0) * 20;

  if (publishedAt) {
    const hoursOld = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
    if (hoursOld < 2)       score += 10;
    else if (hoursOld < 24) score += 5;
  }

  return Math.min(Math.round(score), 100);
}

exports.getTrending = async (req, res) => {
  const limit    = Math.min(50, parseInt(req.query.limit) || 20);
  const filter   = req.query.verdict;
  const cacheKey = `trending_feed:${filter || 'all'}`;

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  try {
    const allowed = ['accurate', 'misleading', 'false', 'unverifiable'];
    const queryParams = [];
    let where = 'WHERE is_active = 1';

    if (filter && allowed.includes(filter)) {
      where += ' AND verdict = ?';
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
      queryParams
    );

    const [[{ last_updated }]] = await db.query(
      'SELECT MAX(fetched_at) as last_updated FROM trending_stories WHERE is_active = 1'
    );

    const result = { stories: rows, last_updated, total: rows.length };
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    res.json(result);
  } catch (err) {
    console.error('getTrending:', err.message);
    res.status(500).json({ error: 'Could not fetch trending stories' });
  }
};

exports.getSourceStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM source_stats ORDER BY avg_danger_score DESC LIMIT 50'
    );
    res.json({ sources: rows });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch source stats' });
  }
};

exports.getTrendingById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM trending_stories WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Story not found' });

    const story = rows[0];
    if (story.evidence_json && typeof story.evidence_json === 'string') {
      try { story.evidence_json = JSON.parse(story.evidence_json); } catch {}
    }
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch story' });
  }
};

exports.refreshTrending = async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });

  try {
    const count = await runTrendingRefresh();
    res.json({ refreshed: true, stories_processed: count });
  } catch (err) {
    console.error('refreshTrending:', err.message);
    res.status(500).json({ error: 'Refresh failed' });
  }
};

async function runTrendingRefresh() {
  const articles = [];

  if (process.env.NEWS_API_KEY) {
    try {
      const { data } = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'India economy GDP inflation unemployment',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: process.env.NEWS_API_KEY
        },
        timeout: 10000
      });

      for (const a of data.articles || []) {
        articles.push({
          headline:    a.title,
          source_name: a.source?.name || 'Unknown',
          source_url:  a.url,
          published_at: a.publishedAt,
          content:     a.description || a.title
        });
      }
    } catch (err) {
      console.error('NewsAPI fetch failed:', err.message);
    }
  } else {
    console.log('NEWS_API_KEY not set — skipping news fetch');
  }

  const fresh = [];
  for (const a of articles) {
    if (!a.source_url) continue;
    const [exists] = await db.query(
      'SELECT id FROM trending_stories WHERE source_url = ?', [a.source_url]
    );
    if (exists.length === 0) fresh.push(a);
  }

  let processed = 0;

  for (const article of fresh) {
    try {
      const { data: analysis } = await nlp.post('/analyze', { text: article.content });

      // pick highest-confidence claim from the article
      const top = analysis.results
        ?.sort((a, b) => b.extraction.confidence - a.extraction.confidence)[0];

      if (!top || top.extraction.confidence < 0.3) continue;

      const { data: result } = await nlp.post('/verify', { text: top.sentence });
      const score = calcDangerScore(result.verdict, result.confidence, article.published_at);

      await db.query(
        `INSERT INTO trending_stories
           (headline, claim_text, source_name, source_url, published_at,
            verdict, confidence, danger_score, metric, official_value,
            claimed_value, pct_error, explanation, evidence_json, tier_used)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          article.headline, top.sentence, article.source_name, article.source_url,
          article.published_at || null,
          result.verdict, result.confidence, score,
          result.extracted_metric, result.official_value, result.extracted_value,
          result.percentage_error, result.explanation,
          JSON.stringify(result.evidence || []), result.tier_used
        ]
      );

      await db.query(
        `INSERT INTO source_stats
           (source_name, total_claims, avg_danger_score, accurate_count, misleading_count, false_count)
         VALUES (?, 1, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           total_claims     = total_claims + 1,
           accurate_count   = accurate_count   + CASE WHEN ? = 'accurate'   THEN 1 ELSE 0 END,
           misleading_count = misleading_count + CASE WHEN ? = 'misleading' THEN 1 ELSE 0 END,
           false_count      = false_count      + CASE WHEN ? = 'false'      THEN 1 ELSE 0 END,
           avg_danger_score = ((avg_danger_score * (total_claims - 1)) + ?) / total_claims`,
        [
          article.source_name, score,
          result.verdict === 'accurate'   ? 1 : 0,
          result.verdict === 'misleading' ? 1 : 0,
          result.verdict === 'false'      ? 1 : 0,
          result.verdict, result.verdict, result.verdict,
          score
        ]
      );

      processed++;
    } catch (err) {
      console.error(`skipping "${article.headline}":`, err.message);
    }
  }

  await db.query(
    'UPDATE trending_stories SET is_active = 0 WHERE fetched_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)'
  );

  const keys = await redis.keys('trending_feed:*');
  if (keys.length > 0) await redis.del(...keys);

  console.log(`Trending refresh done: ${processed} new stories`);
  return processed;
}

exports.runTrendingRefresh = runTrendingRefresh;

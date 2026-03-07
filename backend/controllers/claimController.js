const crypto = require('crypto');
const db     = require('../config/db');
const redis  = require('../config/redis');
const nlp    = require('../services/nlpService');

function md5(text) {
  return crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');
}

// all 3 verify routes share this — only the NLP endpoint differs
async function runVerify(req, res, endpoint) {
  const { text } = req.body;

  if (!text || text.trim().length < 5)
    return res.status(400).json({ error: 'Claim text too short (min 5 chars)' });

  const userId = req.user.id;
  const hash   = md5(text);

  // same claim already verified? skip NLP, return from Redis cache
  const cached = await redis.get(`claim_result:${hash}`);
  if (cached) return res.json({ ...JSON.parse(cached), from_cache: true });

  let claimId;
  try {
    const [ins] = await db.query(
      'INSERT INTO claims (user_id, original_text, claim_hash, status) VALUES (?, ?, ?, ?)',
      [userId, text.trim(), hash, 'pending']
    );
    claimId = ins.insertId;

    const { data: r } = await nlp.post(endpoint, { text: text.trim() });

    // NLP response shape varies slightly across tiers — normalise it here
    const verdict      = r.verdict;
    const confidence   = r.confidence ?? null;
    const tierUsed     = r.tier_used ?? 'tier1';
    const explanation  = r.explanation ?? null;
    const officialVal  = r.official_value  ?? r.numeric_check?.official_value  ?? null;
    const claimedVal   = r.extracted_value ?? r.numeric_check?.claimed_value   ?? null;
    const pctError     = r.percentage_error ?? r.numeric_check?.percentage_error ?? null;
    const metric       = r.extracted_metric ?? r.extraction?.metric ?? null;
    const year         = r.extracted_year   ?? r.extraction?.year   ?? null;
    const tiersRun     = JSON.stringify(r.tiers_run ?? [tierUsed]);
    const evidenceJson = JSON.stringify(r.evidence   ?? []);

    await db.query(
      `INSERT INTO verification_log
         (claim_id, official_value, claimed_value, difference, percentage_error,
          verdict, tier_used, tiers_run, confidence, explanation, evidence_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        claimId, officialVal, claimedVal,
        officialVal != null && claimedVal != null ? Math.abs(officialVal - claimedVal) : null,
        pctError, verdict, tierUsed, tiersRun, confidence, explanation, evidenceJson
      ]
    );

    await db.query(
      `UPDATE claims SET
         extracted_metric  = ?,
         extracted_value   = ?,
         extracted_year    = ?,
         credibility_score = ?,
         verdict           = ?,
         confidence        = ?,
         status            = 'verified'
       WHERE id = ?`,
      [metric, claimedVal, year, confidence ? confidence * 100 : null, verdict, confidence, claimId]
    );

    const response = {
      claim_id: claimId,
      original_text: text.trim(),
      verdict, confidence,
      tier_used: tierUsed, explanation,
      official_value: officialVal, claimed_value: claimedVal, percentage_error: pctError,
      extracted_metric: metric, extracted_year: year,
      evidence: r.evidence ?? [],
      tiers_run: r.tiers_run ?? [tierUsed],
      source_url: r.source_url ?? r.numeric_check?.source_url ?? null
    };

    await redis.set(`claim_result:${hash}`, JSON.stringify(response), 'EX', 86400);
    res.json(response);
  } catch (err) {
    if (claimId)
      await db.query("UPDATE claims SET status = 'failed' WHERE id = ?", [claimId]);

    console.error('verify:', err.message);
    if (err.status === 422) return res.status(422).json({ error: err.nlpDetail || 'Invalid claim text' });
    if (err.status === 429) return res.status(429).json({ error: 'NLP rate limit hit, retry in a minute' });
    res.status(500).json({ error: 'Verification failed, please try again' });
  }
}

exports.submitClaim = (req, res) => runVerify(req, res, '/verify');
exports.submitQuick = (req, res) => runVerify(req, res, '/verify/quick');
exports.submitDeep  = (req, res) => runVerify(req, res, '/verify/deep');

exports.getUserClaims = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query(
      `SELECT id, original_text, extracted_metric, extracted_value,
              extracted_year, verdict, confidence, status, created_at
       FROM claims
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM claims WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ claims: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('getUserClaims:', err.message);
    res.status(500).json({ error: 'Could not fetch claims' });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*,
              v.official_value, v.claimed_value, v.difference, v.percentage_error,
              v.tier_used, v.tiers_run, v.confidence AS vlog_confidence,
              v.evidence_json, v.explanation, v.verified_at
       FROM claims c
       LEFT JOIN verification_log v ON v.claim_id = c.id
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Claim not found' });

    const claim = rows[0];
    if (claim.evidence_json && typeof claim.evidence_json === 'string') {
      try { claim.evidence_json = JSON.parse(claim.evidence_json); } catch {}
    }
    if (claim.tiers_run && typeof claim.tiers_run === 'string') {
      try { claim.tiers_run = JSON.parse(claim.tiers_run); } catch {}
    }

    res.json(claim);
  } catch (err) {
    console.error('getClaimById:', err.message);
    res.status(500).json({ error: 'Could not fetch claim' });
  }
};

exports.getStats = async (req, res) => {
  const cacheKey = `stats_cache:${req.user.id}`;
  const cached   = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  try {
    const [verdictRows] = await db.query(
      `SELECT verdict, COUNT(*) as count
       FROM claims
       WHERE user_id = ? AND status = 'verified'
       GROUP BY verdict`,
      [req.user.id]
    );

    const [[{ total, avg_conf }]] = await db.query(
      `SELECT COUNT(*) as total, AVG(confidence) as avg_conf
       FROM claims
       WHERE user_id = ? AND status = 'verified'`,
      [req.user.id]
    );

    const counts = { accurate: 0, misleading: 0, false: 0, unverifiable: 0 };
    for (const r of verdictRows) {
      if (r.verdict in counts) counts[r.verdict] = Number(r.count);
    }

    const stats = {
      total: total || 0,
      avg_confidence: parseFloat(avg_conf || 0).toFixed(2),
      ...counts
    };

    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    res.json(stats);
  } catch (err) {
    console.error('getStats:', err.message);
    res.status(500).json({ error: 'Could not fetch stats' });
  }
};

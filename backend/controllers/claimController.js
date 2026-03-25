const crypto = require("crypto"); // node module for hashing
const db = require("../config/db"); // mysql database connection
const redis = require("../config/redis"); // redis used for caching results
const nlp = require("../services/nlpService"); // service which calls NLP verification API

// create hash of claim text so we can cache same claim results
function hashText(text) {
  return crypto
    .createHash("sha256")
    .update(text.trim().toLowerCase())
    .digest("hex");
}

// this function is used by all verify routes
// only endpoint changes (normal / quick / deep verify)
async function runVerify(req, res, endpoint) {
  const text = req.body.text?.trim();

  // basic validation for claim text
  if (!text || text.length < 5) {
    return res
      .status(400)
      .json({ error: "Claim text too short (min 5 chars)" });
  }

  if (text.length > 2000) {
    return res
      .status(400)
      .json({ error: "Claim text too long (max 2000 chars)" });
  }

  const userId = req.user.id;
  const hash = hashText(text);

  // check if result already exists in redis cache
  let cached = null;
  try {
    cached = await redis.get(`claim_result:${hash}`);
  } catch {
    /* Redis unavailable — fall through to live verification */
  }

  if (cached) {
    try {
      return res.json({
        ...JSON.parse(cached),
        from_cache: true,
      });
    } catch {
      try {
        await redis.del(`claim_result:${hash}`);
      } catch {}
    }
  }

  let claimId;

  try {
    // first insert claim in database with pending status
    const [ins] = await db.query(
      "INSERT INTO claims (user_id, original_text, claim_hash, status) VALUES (?, ?, ?, ?)",
      [userId, text, hash, "pending"],
    );

    claimId = ins.insertId;

    // call NLP verification API
    const { data: r } = await nlp.post(endpoint, { text });

    // get values returned from NLP service
    const verdict = r.verdict;
    const confidence = r.confidence ?? null;
    const tierUsed = r.tier_used ?? "tier1";
    const explanation = r.explanation ?? null;

    const officialVal =
      r.official_value ?? r.numeric_check?.official_value ?? null;

    const claimedVal =
      r.extracted_value ?? r.numeric_check?.claimed_value ?? null;

    const pctError =
      r.percentage_error ?? r.numeric_check?.percentage_error ?? null;

    const metric = r.extracted_metric ?? r.extraction?.metric ?? null;
    const year = r.extracted_year ?? r.extraction?.year ?? null;

    const tiersRun = JSON.stringify(r.tiers_run ?? [tierUsed]);
    const evidenceJson = JSON.stringify(r.evidence ?? []);

    // calculate difference if both values exist
    const difference =
      officialVal != null && claimedVal != null
        ? Math.abs(officialVal - claimedVal)
        : null;

    // store verification details in verification_log table
    await db.query(
      `INSERT INTO verification_log
       (claim_id, official_value, claimed_value, difference, percentage_error,
        verdict, tier_used, tiers_run, confidence, explanation, evidence_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        claimId,
        officialVal,
        claimedVal,
        difference,
        pctError,
        verdict,
        tierUsed,
        tiersRun,
        confidence,
        explanation,
        evidenceJson,
      ],
    );

    // update claim record with extracted data and final verdict
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
      [
        metric,
        claimedVal,
        year,
        confidence ? confidence * 100 : null,
        verdict,
        confidence,
        claimId,
      ],
    );

    // response object returned to frontend
    const response = {
      claim_id: claimId,
      original_text: text,
      verdict,
      confidence,
      tier_used: tierUsed,
      explanation,
      official_value: officialVal,
      claimed_value: claimedVal,
      percentage_error: pctError,
      extracted_metric: metric,
      extracted_year: year,
      evidence: r.evidence ?? [],
      tiers_run: r.tiers_run ?? [tierUsed],
      source_url: r.source_url ?? r.numeric_check?.source_url ?? null,
    };

    // store result in redis for 24 hours
    await redis.set(
      `claim_result:${hash}`,
      JSON.stringify(response),
      "EX",
      86400,
    );

    res.json(response);
  } catch (err) {
    // if verification fails update claim status
    if (claimId) {
      await db.query("UPDATE claims SET status = 'failed' WHERE id = ?", [
        claimId,
      ]);
    }

    console.error("verify error:", err.message);

    // error handling for NLP API responses
    if (err.status === 422) {
      return res
        .status(422)
        .json({ error: err.nlpDetail || "Invalid claim text" });
    }

    if (err.status === 429) {
      return res.status(429).json({ error: "NLP rate limit hit, retry later" });
    }

    res.status(500).json({
      error: "Verification failed, please try again",
    });
  }
}

// endpoints using same verify logic
exports.submitClaim = (req, res) => runVerify(req, res, "/verify");
exports.submitQuick = (req, res) => runVerify(req, res, "/verify/quick");
exports.submitDeep = (req, res) => runVerify(req, res, "/verify/deep");

// get claims submitted by current user
exports.getUserClaims = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query(
      `SELECT id, original_text, extracted_metric, extracted_value,
              extracted_year, verdict, confidence, status, created_at
       FROM claims
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset],
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM claims WHERE user_id = ?",
      [req.user.id],
    );

    res.json({
      claims: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getUserClaims:", err.message);
    res.status(500).json({ error: "Could not fetch claims" });
  }
};

// get single claim details
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
      [req.params.id, req.user.id],
    );

    if (!rows[0]) return res.status(404).json({ error: "Claim not found" });

    const claim = rows[0];

    // convert stored json strings to objects
    try {
      if (claim.evidence_json)
        claim.evidence_json = JSON.parse(claim.evidence_json);
    } catch {}

    try {
      if (claim.tiers_run) claim.tiers_run = JSON.parse(claim.tiers_run);
    } catch {}

    res.json(claim);
  } catch (err) {
    console.error("getClaimById:", err.message);
    res.status(500).json({ error: "Could not fetch claim" });
  }
};

// statistics of user claims
exports.getStats = async (req, res) => {
  const cacheKey = `stats_cache:${req.user.id}`;

  // check if stats exist in redis
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
    const [verdictRows] = await db.query(
      `SELECT verdict, COUNT(*) as count
       FROM claims
       WHERE user_id = ? AND status = 'verified'
       GROUP BY verdict`,
      [req.user.id],
    );

    const [[{ total, avg_conf }]] = await db.query(
      `SELECT COUNT(*) as total, AVG(confidence) as avg_conf
       FROM claims
       WHERE user_id = ? AND status = 'verified'`,
      [req.user.id],
    );

    const counts = {
      accurate: 0,
      misleading: 0,
      false: 0,
      unverifiable: 0,
    };

    // fill verdict counts
    for (const r of verdictRows) {
      if (r.verdict in counts) counts[r.verdict] = Number(r.count);
    }

    const stats = {
      total: total || 0,
      avg_confidence: Number((avg_conf || 0).toFixed(2)),
      ...counts,
    };

    // cache stats for 10 minutes
    await redis.set(cacheKey, JSON.stringify(stats), "EX", 600);

    res.json(stats);
  } catch (err) {
    console.error("getStats:", err.message);
    res.status(500).json({ error: "Could not fetch stats" });
  }
};

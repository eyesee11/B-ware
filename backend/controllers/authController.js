const db = require("../config/db");
const redis = require("../config/redis");
const admin = require("../services/firebaseAdmin");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../services/emailService");

// ─────────────────────────────────────────────────────────────────────────────
// SYNC USER
// Called after any Firebase sign-in (email/pass or Google) to upsert the user
// row in MySQL and establish a Redis session.
// ─────────────────────────────────────────────────────────────────────────────
exports.syncUser = async (req, res) => {
  const { uid, email, name, picture } = req.user; // set by auth middleware

  try {
    // Check if this is a brand-new user before upsert
    const [existing] = await db.query(
      "SELECT id FROM users WHERE firebase_uid = ?",
      [uid],
    );
    const isNewUser = existing.length === 0;

    // Upsert user — insert or update name/picture on conflict
    await db.query(
      `INSERT INTO users (firebase_uid, email, name, avatar_url, role, created_at)
       VALUES (?, ?, ?, ?, 'user', NOW())
       ON DUPLICATE KEY UPDATE
         firebase_uid = COALESCE(VALUES(firebase_uid), firebase_uid),
         name         = COALESCE(VALUES(name), name),
         avatar_url   = COALESCE(VALUES(avatar_url), avatar_url),
         last_seen_at = NOW()`,
      [uid || null, email || null, name || null, picture || null],
    );

    // Fetch full user row (gets id, role, created_at, etc.)
    const [rows] = await db.query(
      `SELECT id, firebase_uid, name, email, avatar_url, role, created_at
       FROM users WHERE firebase_uid = ?`,
      [uid],
    );

    const user = rows[0];
    if (!user) {
      return res.status(500).json({ error: "User sync failed" });
    }

    // Store session in Redis (7-day TTL) and clear any old logout blacklist
    try {
      await redis.set(`session:${uid}`, "1", "EX", 7 * 24 * 60 * 60);
      await redis.del(`session_blacklist:${uid}`); // clear any old logout blacklist
    } catch (redisErr) {
      console.warn("[syncUser] Redis session store failed:", redisErr.message);
    }

    // Send verification email to brand-new email/password users (not Google OAuth)
    if (isNewUser && !req.user.email_verified) {
      try {
        const actionCodeSettings = {
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`,
        };
        const verifyLink = await admin
          .auth()
          .generateEmailVerificationLink(email, actionCodeSettings);
        await sendVerificationEmail(email, verifyLink);
        console.log(`[syncUser] Verification email sent to ${email}`);
      } catch (emailErr) {
        // Non-fatal — log but don't block the response
        console.warn(
          "[syncUser] Could not send verification email:",
          emailErr.message,
        );
      }
    }

    return res.json({
      user,
      emailVerificationSent: isNewUser && !req.user.email_verified,
    });
  } catch (err) {
    console.error("[syncUser] DB error:", err.message, err.stack);
    return res.status(500).json({ error: "Could not sync user: " + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firebase_uid, name, email, avatar_url, role, created_at
       FROM users WHERE firebase_uid = ?`,
      [req.user.uid],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("[getMe] DB error:", err.message);
    return res.status(500).json({ error: "Could not fetch user" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT — blacklist the Firebase UID session in Redis
// The Firebase ID token itself expires naturally (1 hour).
// We track a server-side blacklist so dashboard pages immediately reflect logout.
// ─────────────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  const { uid } = req.user;

  try {
    // Revoke all Firebase refresh tokens for this user
    await admin.auth().revokeRefreshTokens(uid);

    // Blacklist the session in Redis (24h covers any in-flight ID tokens)
    await redis.set(`session_blacklist:${uid}`, "1", "EX", 24 * 60 * 60);

    // Remove active session key
    await redis.del(`session:${uid}`);
  } catch (err) {
    console.error("[logout] Error:", err.message);
    // Still return success — client will clear its state
  }

  return res.json({ message: "Logged out" });
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — generate Firebase reset link → send via Nodemailer
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body ?? {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }

  const normalised = email.trim().toLowerCase();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(normalised)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    // Generate a Firebase password-reset link (works for email/password accounts)
    const resetLink = await admin.auth().generatePasswordResetLink(normalised);

    // Send the branded email via Nodemailer
    await sendPasswordResetEmail(normalised, resetLink);

    return res.json({ message: "Password reset email sent" });
  } catch (err) {
    // Firebase throws "auth/user-not-found" — return generic message for security
    console.error("[forgotPassword] Error:", err.code || err.message);
    // Generic response so we don't leak account existence
    return res.json({
      message:
        "If an account exists for this email, a reset link has been sent.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFICATION EMAIL — authenticated endpoint
// ─────────────────────────────────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  const { uid, email, emailVerified } = req.user;

  if (emailVerified) {
    return res.status(400).json({ error: "Email is already verified" });
  }

  try {
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`,
    };
    const verifyLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    await sendVerificationEmail(email, verifyLink);
    console.log(`[resendVerification] Sent to ${email}`);
    return res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error("[resendVerification] Error:", err.message);
    return res.status(500).json({ error: "Could not send verification email" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFIED STATUS — check if current user has verified email
// ─────────────────────────────────────────────────────────────────────────────
exports.getEmailVerifiedStatus = async (req, res) => {
  try {
    // Re-fetch from Firebase to get live emailVerified state
    const userRecord = await admin.auth().getUser(req.user.uid);
    return res.json({
      emailVerified: userRecord.emailVerified,
      email: userRecord.email,
    });
  } catch (err) {
    console.error("[getEmailVerifiedStatus] Error:", err.message);
    return res
      .status(500)
      .json({ error: "Could not fetch verification status" });
  }
};

const bcrypt = require("bcryptjs"); // used to hash passwords
const jwt = require("jsonwebtoken"); // used to create authentication token
const crypto = require("crypto"); // used to generate unique id for token
const db = require("../config/db"); // mysql database connection
const redis = require("../config/redis"); // redis connection for session

// basic email validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// function to generate jwt token
function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID(), // unique token id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }, // token expires in 7 days
  );
}

exports.register = async (req, res) => {
  const body = req.body ?? {};
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  // checking required fields
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email and password are required" });
  }

  // name length check
  if (name.length > 100) {
    return res
      .status(400)
      .json({ error: "Name must be 100 characters or fewer" });
  }

  // email validation
  if (email.length > 150 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // password validation
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  if (password.length > 128) {
    return res
      .status(400)
      .json({ error: "Password must be 128 characters or fewer" });
  }

  try {
    // check if email already exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // hash password before saving
    const hash = await bcrypt.hash(password, 10);

    // insert new user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash],
    );

    // fetch the full user record from DB (gets created_at, role default, etc.)
    const [rows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [result.insertId],
    );
    const user = rows[0];

    // store session in redis (matching login behavior)
    await redis.set(`session:${user.id}`, "1", "EX", 7 * 24 * 60 * 60);

    // return token and user data
    res.status(201).json({
      token: makeToken(user),
      user,
    });
  } catch (err) {
    console.error("register error:", err.message);
    res.status(500).json({ error: "Could not create account" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};

  // checking required fields
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  // email format check
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    // find user by email — only fetch columns we actually need
    const [rows] = await db.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
      [email],
    );

    const user = rows[0];

    // same error for wrong email or wrong password
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // store session in redis for 7 days
    await redis.set(`session:${user.id}`, "1", "EX", 7 * 24 * 60 * 60);

    res.json({
      token: makeToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = async (req, res) => {
  const { jti, id, exp } = req.user;

  // calculate remaining token time
  const ttl = exp - Math.floor(Date.now() / 1000);

  try {
    // blacklist token so it can't be used again
    if (ttl > 0) {
      await redis.set(`jwt_blacklist:${jti}`, "1", "EX", ttl);
    }

    // remove session from redis
    await redis.del(`session:${id}`);
  } catch (err) {
    console.error("logout redis error:", err.message);
    // token will expire naturally; still return success
  }

  res.json({ message: "Logged out" });
};

// ---------------- GET CURRENT USER ----------------
exports.getMe = async (req, res) => {
  try {
    // get user details from database
    const [rows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user" });
  }
};

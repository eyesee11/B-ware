const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../config/db');
const redis  = require('../config/redis');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    const user = { id: result.insertId, name, email, role: 'user' };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    console.error('register:', err.message);
    res.status(500).json({ error: 'Could not create account' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // same message for wrong email or wrong password — no user enumeration
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });

    await redis.set(`session:${user.id}`, '1', 'EX', 7 * 24 * 60 * 60);

    res.json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('login:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  const { jti, id, exp } = req.user;
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.set(`jwt_blacklist:${jti}`, '1', 'EX', ttl);
  await redis.del(`session:${id}`);
  res.json({ message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
};

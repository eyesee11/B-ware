const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const { default: RedisStore } = require('rate-limit-redis');
require('dotenv').config();

const db    = require('./config/db');
const redis = require('./config/redis');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));

// 100 req / 15 min per IP
app.use('/api/', rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down' }
}));

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/claims',   require('./routes/claimRoutes'));
app.use('/api/trending', require('./routes/trendingRoutes'));

app.get('/api/health', async (req, res) => {
  let dbOk = false, redisOk = false;
  try { await db.query('SELECT 1'); dbOk    = true; } catch {}
  try { await redis.ping();         redisOk = true; } catch {}
  res.json({
    status:    dbOk && redisOk ? 'healthy' : 'degraded',
    mysql:     dbOk    ? 'ok' : 'down',
    redis:     redisOk ? 'ok' : 'down',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => res.status(404).json({ error: `${req.method} ${req.path} not found` }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`B-ware backend → http://localhost:${PORT}`));

require('./jobs/trendingJob');
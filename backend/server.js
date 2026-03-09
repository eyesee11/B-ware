const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { default: RedisStore } = require("rate-limit-redis");
require("dotenv").config();

const db = require("./config/db");
const redis = require("./config/redis");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// Health check is before the rate limiter so uptime pings don't burn quota
app.get("/api/health", async (req, res) => {
  let dbOk = false,
    redisOk = false;
  try {
    await db.query("SELECT 1");
    dbOk = true;
  } catch {}
  try {
    await redis.ping();
    redisOk = true;
  } catch {}
  res.json({
    status: dbOk && redisOk ? "healthy" : "degraded",
    mysql: dbOk ? "ok" : "down",
    redis: redisOk ? "ok" : "down",
    timestamp: new Date().toISOString(),
  });
});

// 100 requests per 15 min per IP, stored in Redis
app.use(
  "/api/",
  rateLimit({
    store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, slow down" },
  }),
);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/claims", require("./routes/claimRoutes"));
app.use("/api/trending", require("./routes/trendingRoutes"));

app.use((req, res) =>
  res.status(404).json({ error: `${req.method} ${req.path} not found` }),
);

app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`B-ware backend → http://localhost:${PORT}`),
);

function shutdown(signal) {
  console.log(`${signal} — shutting down`);
  server.close(async () => {
    try {
      await db.end();
    } catch {}
    try {
      redis.disconnect();
    } catch {}
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

require("./jobs/trendingJob");

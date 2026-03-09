const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { default: RedisStore } = require("rate-limit-redis");
require("dotenv").config();

// -------------------- ENV VALIDATION --------------------
const REQUIRED_ENV = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`Missing required env vars: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// database and redis connections
const db = require("./config/db");
const redis = require("./config/redis");

const app = express();

// security headers (XSS, clickjacking, MIME sniffing, HSTS, etc.)
app.use(helmet());

// allow frontend to call backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// parse incoming JSON requests
app.use(express.json({ limit: "1mb" }));

// -------------------- HEALTH CHECK --------------------
// used to check if backend, mysql, and redis are working
app.get("/api/health", async (req, res) => {
  let dbOk = false,
    redisOk = false;

  try {
    await db.query("SELECT 1"); // test mysql connection
    dbOk = true;
  } catch {}

  try {
    await redis.ping(); // test redis connection
    redisOk = true;
  } catch {}

  res.json({
    status: dbOk && redisOk ? "healthy" : "degraded",
    mysql: dbOk ? "ok" : "down",
    redis: redisOk ? "ok" : "down",
    timestamp: new Date().toISOString(),
  });
});

// -------------------- RATE LIMIT --------------------
// limit API usage: 100 requests per 15 minutes per IP
app.use(
  "/api/",
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max requests
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, slow down" },
  }),
);

// -------------------- ROUTES --------------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/claims", require("./routes/claimRoutes"));
app.use("/api/trending", require("./routes/trendingRoutes"));

// -------------------- 404 HANDLER --------------------
app.use((req, res) =>
  res.status(404).json({ error: `${req.method} ${req.path} not found` }),
);

// -------------------- GLOBAL ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message);
  res.status(err.status && err.status < 500 ? err.status : 500).json({
    error:
      err.status && err.status < 500 ? err.message : "Internal server error",
  });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`B-ware backend running at http://localhost:${PORT}`);
});

// -------------------- GRACEFUL SHUTDOWN --------------------
// close database and redis properly when server stops
function shutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);

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

// start background job for trending claims
require("./jobs/trendingJob");

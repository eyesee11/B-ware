const request = require("supertest");

jest.mock("../config/db");
jest.mock("../config/redis");
jest.mock("rate-limit-redis", () => {
  return {
    default: class MockStore {
      increment = jest.fn().mockResolvedValue({ totalHits: 1, resetTime: new Date() });
      decrement = jest.fn();
      resetKey = jest.fn();
      resetAll = jest.fn();
    }
  };
});
jest.mock("../services/nlpService");

const app = require("../server");
const db = require("../config/db");
const redis = require("../config/redis");
const nlp = require("../services/nlpService");
const jwt = require("jsonwebtoken");

describe("Trending API", () => {
  let token;
  let adminToken;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 1, email: "test@test.com", role: "user", jti: "some-id" }, process.env.JWT_SECRET || "test-secret");
    adminToken = jwt.sign({ id: 2, email: "admin@test.com", role: "admin", jti: "admin-id" }, process.env.JWT_SECRET || "test-secret");
  });

  describe("GET /api/trending", () => {
    it("should return trending stories", async () => {
      redis.get.mockResolvedValueOnce(null);
      // DB call 1: user outlet preferences (empty)
      db.query.mockResolvedValueOnce([[]]);
      // DB call 2: fetch trending stories
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            headline: "Fake News 1",
            verdict: "false",
            danger_score: 90,
            source_name: "BBC"
          }
        ]
      ]);
      // DB call 3: MAX(fetched_at)
      db.query.mockResolvedValueOnce([[{ last_updated: "2023-01-01T00:00:00Z" }]]);

      const response = await request(app)
        .get("/api/trending")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.stories)).toBe(true);
      expect(response.body.stories[0].headline).toBe("Fake News 1");
    });
  });

  describe("GET /api/trending/sources", () => {
    it("should return source stats", async () => {
      db.query.mockResolvedValueOnce([[{ source_name: "BBC", count: 10 }]]);

      const response = await request(app)
        .get("/api/trending/sources");

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/trending/:id", () => {
    it("should return trending claim by id", async () => {
      db.query.mockResolvedValueOnce([[{ id: 1, headline: "Fake News" }]]);
      
      const response = await request(app)
        .get("/api/trending/1")
        .set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it("should return 404 if not found", async () => {
      db.query.mockResolvedValueOnce([[]]);
      const response = await request(app).get("/api/trending/999");
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/trending/refresh", () => {
    it("should initiate refresh", async () => {
      // Mock runTrendingRefresh internal db query calls? No, test reaches 200 before runTrendingRefresh actually blocks forever? 
      // Let's mock a fast return. We might need to mock nlp or db inside update!
      // But let's mock db.query to resolve empty arrays for whatever is called during refresh.
      db.query.mockResolvedValue([[]]);
      // The refresh hits NewsAPI, so we could mock axios.
      const axios = require('axios');
      jest.spyOn(axios, 'get').mockResolvedValue({ data: { articles: [] } });

      const response = await request(app)
        .post("/api/trending/refresh")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("refreshed");
    });
  });
});


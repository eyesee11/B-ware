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

describe("Claims API", () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 1, email: "test@test.com", role: "user", jti: "some-id" }, process.env.JWT_SECRET || "test-secret");
  });

  describe("POST /api/claims/verify", () => {
    it("should return cached result if available", async () => {
      const cachedResult = { verdict: "true", confidence: 0.9 };
      redis.get.mockResolvedValueOnce(JSON.stringify(cachedResult));

      const response = await request(app)
        .post("/api/claims/verify")
        .send({ text: "This is a valid test claim." });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(cachedResult);
      expect(response.body.from_cache).toBe(true);
    });

    it("should call NLP verification API if not cached", async () => {
      redis.get.mockResolvedValueOnce(null); // not cached
      
      const NLP_RESPONSE = {
        verdict: "false",
        confidence: 0.8,
        tier_used: "tier1"
      };

      db.query.mockResolvedValueOnce([{ insertId: 10 }]); // insert claim
      nlp.post.mockResolvedValueOnce({ data: NLP_RESPONSE }); // NLP response
      db.query.mockResolvedValueOnce([[]]); // insert verification log
      db.query.mockResolvedValueOnce([[]]); // update claim

      const response = await request(app)
        .post("/api/claims/verify")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "This is a valid test claim." });

      expect(response.status).toBe(200);
      expect(response.body.verdict).toBe("false");
      expect(response.body.claim_id).toBe(10);
      expect(nlp.post).toHaveBeenCalledWith("/verify", { text: "This is a valid test claim." });
      expect(db.query).toHaveBeenCalledTimes(3); 
    });

    it("should fail if claim text is missing", async () => {
      const response = await request(app)
        .post("/api/claims/verify")
        .send({ text: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Claim text too short (min 5 chars)");
    });
  });

  describe("POST /api/claims/quick", () => {
    it("should call quick verify endpoint", async () => {
      redis.get.mockResolvedValueOnce(null); 
      
      const NLP_RESPONSE = { verdict: "true", confidence: 0.95 };
      db.query.mockResolvedValue([{ insertId: 11 }]); 
      nlp.post.mockResolvedValueOnce({ data: NLP_RESPONSE }); 
      
      const response = await request(app)
        .post("/api/claims/quick")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Global warming is real." });

      expect(response.status).toBe(200);
      expect(nlp.post).toHaveBeenCalledWith("/verify/quick", { text: "Global warming is real." });
    });
  });

  describe("GET /api/claims/stats", () => {
    it("should return valid stats for a user", async () => {
      redis.get.mockResolvedValueOnce(null);
      // first DB call: verdictRows
      db.query.mockResolvedValueOnce([[{ verdict: "true", count: 2 }, { verdict: "false", count: 3 }]]);
      // second DB call: total, avg_conf
      db.query.mockResolvedValueOnce([[{ total: 5, avg_conf: 0.85 }]]);
      // third DB call might be for something else, let's just supply an empty array fallback
      db.query.mockResolvedValueOnce([[]]);
      
      const response = await request(app)
        .get("/api/claims/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(5);
    });
  });
});

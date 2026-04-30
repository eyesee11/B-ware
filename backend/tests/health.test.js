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

const app = require("../server");


const db = require("../config/db");
const redis = require("../config/redis");

describe("Health API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return healthy when db and redis are up", async () => {
    db.query.mockResolvedValue([[{ 1: 1 }]]);
    redis.ping.mockResolvedValue("PONG");

    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.mysql).toBe("ok");
    expect(response.body.redis).toBe("ok");
  });

  it("should return degraded when db is down", async () => {
    db.query.mockRejectedValue(new Error("DB Down"));
    redis.ping.mockResolvedValue("PONG");

    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("degraded");
    expect(response.body.mysql).toBe("down");
  });

  it("should return degraded when redis is down", async () => {
    db.query.mockResolvedValue([[{ 1: 1 }]]);
    redis.ping.mockRejectedValue(new Error("Redis Down"));

    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("degraded");
    expect(response.body.redis).toBe("down");
  });
});

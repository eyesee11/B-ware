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

const bcrypt = require("bcryptjs");
jest.spyOn(bcrypt, "hash");
jest.spyOn(bcrypt, "compare");

const app = require("../server");
const db = require("../config/db");
const redis = require("../config/redis");
const jwt = require("jsonwebtoken");

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      db.query
        .mockResolvedValueOnce([[]]) // check email exists -> none
        .mockResolvedValueOnce([{ insertId: 1 }]) // insert user
        .mockResolvedValueOnce([[{ id: 1, name: "Test User", email: "test@test.com", role: "user" }]]); // fetch inserted user

      bcrypt.hash.mockResolvedValueOnce("hashedpassword");

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@test.com",
          password: "password123"
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        id: 1,
        name: "Test User",
        email: "test@test.com",
        role: "user"
      });
      expect(redis.set).toHaveBeenCalled();
    });

    it("should fail if email is already registered", async () => {
      db.query.mockResolvedValueOnce([[{ id: 1 }]]); // email exists

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@test.com",
          password: "password123"
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Email already registered");
    });

    it("should fail validation on invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "password123"
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid email address");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      db.query.mockResolvedValueOnce([[{ id: 1, name: "Test User", email: "test@test.com", role: "user", password_hash: "hashedpassword" }]]);
      bcrypt.compare.mockResolvedValueOnce(true);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@test.com",
          password: "password123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        id: 1,
        name: "Test User",
        email: "test@test.com",
        role: "user"
      });
      expect(redis.set).toHaveBeenCalled();
    });

    it("should fail with incorrect password", async () => {
      db.query.mockResolvedValueOnce([[{ id: 1, password_hash: "hashed" }]]);
      bcrypt.compare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@test.com",
          password: "wrongpassword"
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid email or password");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return the current user if token is valid", async () => {
      const token = jwt.sign({ id: 1, email: "test@test.com", role: "user", jti: "some-id" }, process.env.JWT_SECRET || "test-secret");
      
      redis.get.mockResolvedValueOnce(null); // not blacklisted
      db.query.mockResolvedValueOnce([[{ id: 1, name: "Test User", email: "test@test.com", role: "user" }]]); // user found

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Test User");
    });

    it("should fail if no token provided", async () => {
      const response = await request(app).get("/api/auth/me");
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No token provided");
    });
  });
});

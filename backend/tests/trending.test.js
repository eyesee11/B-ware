jest.mock('../config/db');
jest.mock('../config/redis');
jest.mock('../services/firebaseAdmin');
jest.mock('../services/nlpService');
jest.mock('rate-limit-redis', () => ({
  default: class MockStore {
    increment = jest.fn().mockResolvedValue({ totalHits: 1, resetTime: new Date() });
    decrement = jest.fn();
    resetKey = jest.fn();
    resetAll = jest.fn();
  },
}));

const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const redis = require('../config/redis');
const admin = require('../services/firebaseAdmin');

const SAMPLE_STORY = {
  id: 1,
  headline: 'India GDP grew by 8%',
  claim_text: 'India GDP grew by 8% in FY2023',
  source_name: 'BBC',
  verdict: 'false',
  confidence: 0.87,
  danger_score: 82,
};

// Returns a mock decoded Firebase token with optional role override
const mockToken = (role = 'user') =>
  admin.auth().verifyIdToken.mockResolvedValue({
    uid: 'user-uid-xyz',
    email: 'user@example.com',
    name: 'Test User',
    picture: null,
    email_verified: true,
    role,
  });

describe('Trending API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    redis.keys.mockResolvedValue([]);
  });

  // GET /api/trending — optional auth
  describe('GET /api/trending', () => {
    it('returns trending stories for an anonymous user', async () => {
      db.query
        .mockResolvedValueOnce([[SAMPLE_STORY]])
        .mockResolvedValueOnce([[{ last_updated: '2024-01-01T00:00:00Z' }]]);

      const res = await request(app).get('/api/trending');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.stories)).toBe(true);
      expect(res.body.stories[0].headline).toBe('India GDP grew by 8%');
    });

    it('applies user outlet preferences when authenticated', async () => {
      mockToken();
      db.query
        .mockResolvedValueOnce([[{ outlet_name: 'BBC' }]])         // user preferences
        .mockResolvedValueOnce([[SAMPLE_STORY]])                    // filtered stories
        .mockResolvedValueOnce([[{ last_updated: '2024-01-01T00:00:00Z' }]]);

      const res = await request(app)
        .get('/api/trending')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.stories).toHaveLength(1);
    });

    it('returns cached stories without hitting DB', async () => {
      const cachedResult = { stories: [SAMPLE_STORY], last_updated: null, total: 1 };
      // No auth token, so only one redis.get call (cache check, not blacklist)
      redis.get.mockResolvedValueOnce(JSON.stringify(cachedResult));

      const res = await request(app).get('/api/trending');

      expect(res.status).toBe(200);
      expect(res.body.stories[0].headline).toBe('India GDP grew by 8%');
      expect(db.query).not.toHaveBeenCalled();
    });

    it('filters stories by verdict query param', async () => {
      db.query
        .mockResolvedValueOnce([[SAMPLE_STORY]])
        .mockResolvedValueOnce([[{ last_updated: null }]]);

      const res = await request(app).get('/api/trending?verdict=false');

      expect(res.status).toBe(200);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('verdict = ?'),
        expect.arrayContaining(['false']),
      );
    });
  });

  // GET /api/trending/sources — public
  describe('GET /api/trending/sources', () => {
    it('returns source reliability statistics', async () => {
      db.query.mockResolvedValueOnce([[
        { source_name: 'BBC', total_claims: 10, false_count: 6, avg_danger_score: 72 },
        { source_name: 'Reuters', total_claims: 8, false_count: 1, avg_danger_score: 20 },
      ]]);

      const res = await request(app).get('/api/trending/sources');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sources)).toBe(true);
      expect(res.body.sources[0].source_name).toBe('BBC');
    });

    it('returns an empty array when no data exists', async () => {
      db.query.mockResolvedValueOnce([[]]);
      const res = await request(app).get('/api/trending/sources');
      expect(res.status).toBe(200);
      expect(res.body.sources).toEqual([]);
    });
  });

  // GET /api/trending/:id — public
  describe('GET /api/trending/:id', () => {
    it('returns a single trending story by ID', async () => {
      db.query.mockResolvedValueOnce([[SAMPLE_STORY]]);

      const res = await request(app).get('/api/trending/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.headline).toBe('India GDP grew by 8%');
    });

    it('returns 404 if story does not exist or is inactive', async () => {
      db.query.mockResolvedValueOnce([[]]); // no rows

      const res = await request(app).get('/api/trending/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  });

  // POST /api/trending/refresh — requires auth + admin role
  describe('POST /api/trending/refresh', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).post('/api/trending/refresh');
      expect(res.status).toBe(401);
    });

    it('returns 403 for a regular (non-admin) user', async () => {
      mockToken('user');
      const res = await request(app)
        .post('/api/trending/refresh')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Admin only');
    });

    it('triggers a refresh for an admin user', async () => {
      mockToken('admin');

      // Prevent real HTTP calls to NewsAPI/Google
      const axios = require('axios');
      jest.spyOn(axios, 'get').mockResolvedValue({ data: { articles: [], claims: [] } });

      db.query.mockResolvedValue([[]]); // dedup + deactivate queries

      const res = await request(app)
        .post('/api/trending/refresh')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('refreshed', true);
      expect(res.body).toHaveProperty('stories_processed');
    });
  });
});

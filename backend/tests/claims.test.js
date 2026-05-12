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
const nlp = require('../services/nlpService');
const admin = require('../services/firebaseAdmin');

const FAKE_USER = {
  uid: 'user-uid-abc',
  email: 'tester@example.com',
  name: 'Tester',
  picture: null,
  email_verified: true,
};

// Sets up verifyIdToken to return a logged-in user
const mockAuth = (overrides = {}) =>
  admin.auth().verifyIdToken.mockResolvedValue({ ...FAKE_USER, ...overrides });

describe('Claims API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
  });

  // POST /api/claims/verify — optional auth, works for guests too
  describe('POST /api/claims/verify', () => {
    it('returns a cached result without hitting NLP', async () => {
      const cached = { verdict: 'true', confidence: 0.9, claim_id: 5 };
      redis.get.mockResolvedValueOnce(JSON.stringify(cached));

      const res = await request(app)
        .post('/api/claims/verify')
        .send({ text: 'India GDP grew by 8% in 2023.' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(cached);
      expect(res.body.from_cache).toBe(true);
      expect(nlp.post).not.toHaveBeenCalled();
    });

    it('calls NLP and stores result for a guest user (no auth)', async () => {
      redis.get.mockResolvedValueOnce(null);
      const NLP_RESPONSE = {
        verdict: 'false',
        confidence: 0.85,
        tier_used: 'tier1',
        explanation: 'Official data shows 6% growth.',
        evidence: [],
      };
      db.query
        .mockResolvedValueOnce([{ insertId: 42 }])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);
      nlp.post.mockResolvedValueOnce({ data: NLP_RESPONSE });

      const res = await request(app)
        .post('/api/claims/verify')
        .send({ text: 'India GDP grew by 8% in 2023.' });

      expect(res.status).toBe(200);
      expect(res.body.verdict).toBe('false');
      expect(res.body.claim_id).toBe(42);
      expect(nlp.post).toHaveBeenCalledWith('/verify', { text: 'India GDP grew by 8% in 2023.' });
    });

    it('returns 400 if text is too short (under 5 chars)', async () => {
      const res = await request(app).post('/api/claims/verify').send({ text: 'hi' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Claim text too short (min 5 chars)');
    });

    it('returns 400 if text is too long (over 2000 chars)', async () => {
      const res = await request(app).post('/api/claims/verify').send({ text: 'a'.repeat(2001) });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Claim text too long (max 2000 chars)');
    });

    it('returns 400 if text field is missing entirely', async () => {
      const res = await request(app).post('/api/claims/verify').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Claim text too short (min 5 chars)');
    });
  });

  // POST /api/claims/quick — requires auth
  describe('POST /api/claims/quick', () => {
    it('calls the quick NLP endpoint for an authenticated user', async () => {
      mockAuth();
      redis.get.mockResolvedValueOnce(null);
      db.query
        .mockResolvedValueOnce([{ insertId: 11 }])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);
      nlp.post.mockResolvedValueOnce({ data: { verdict: 'accurate', confidence: 0.95 } });

      const res = await request(app)
        .post('/api/claims/quick')
        .set('Authorization', 'Bearer fake-token')
        .send({ text: 'Global warming is accelerating.' });

      expect(res.status).toBe(200);
      expect(res.body.verdict).toBe('accurate');
      expect(nlp.post).toHaveBeenCalledWith('/verify/quick', { text: 'Global warming is accelerating.' });
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app).post('/api/claims/quick').send({ text: 'Some valid claim text.' });
      expect(res.status).toBe(401);
    });
  });

  // POST /api/claims/batch — requires auth
  describe('POST /api/claims/batch', () => {
    it('returns 400 for an empty claims array', async () => {
      mockAuth();
      const res = await request(app)
        .post('/api/claims/batch')
        .set('Authorization', 'Bearer fake-token')
        .send({ claims: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('claims must be non-empty array');
    });

    it('returns 400 when more than 50 claims are sent', async () => {
      mockAuth();
      const res = await request(app)
        .post('/api/claims/batch')
        .set('Authorization', 'Bearer fake-token')
        .send({ claims: Array(51).fill('Some valid test claim here.') });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Maximum 50 claims per batch');
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app).post('/api/claims/batch').send({ claims: ['Some claim'] });
      expect(res.status).toBe(401);
    });
  });

  // GET /api/claims/stats — requires auth
  describe('GET /api/claims/stats', () => {
    it('returns aggregated verdict stats for the current user', async () => {
      mockAuth();
      db.query
        .mockResolvedValueOnce([[{ verdict: 'accurate', count: 3 }, { verdict: 'false', count: 2 }]])
        .mockResolvedValueOnce([[{ total: 5, avg_conf: 0.88 }]]);

      const res = await request(app)
        .get('/api/claims/stats')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      expect(res.body.accurate).toBe(3);
      expect(res.body.false).toBe(2);
    });

    it('serves stats from Redis cache without hitting DB', async () => {
      mockAuth();
      const cached = { total: 10, accurate: 7, false: 2, misleading: 1, unverifiable: 0, avg_confidence: 0.91 };
      // First redis.get = auth blacklist check, second = stats cache
      redis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(cached));

      const res = await request(app)
        .get('/api/claims/stats')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(10);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app).get('/api/claims/stats');
      expect(res.status).toBe(401);
    });
  });

  // GET /api/claims/ — requires auth
  describe('GET /api/claims/', () => {
    it('returns a paginated list of the user\'s claims', async () => {
      mockAuth();
      db.query
        .mockResolvedValueOnce([[{ id: 1, original_text: 'Test claim', status: 'verified' }]])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const res = await request(app)
        .get('/api/claims/')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.claims[0].id).toBe(1);
      expect(res.body.pagination).toMatchObject({ page: 1, total: 1 });
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app).get('/api/claims/');
      expect(res.status).toBe(401);
    });
  });

  // GET /api/claims/:id — requires auth
  describe('GET /api/claims/:id', () => {
    it('returns a single claim by ID', async () => {
      mockAuth();
      db.query.mockResolvedValueOnce([[{ id: 5, original_text: 'Test claim text.', verdict: 'accurate' }]]);

      const res = await request(app)
        .get('/api/claims/5')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(5);
    });

    it('returns 404 if claim does not exist or belongs to another user', async () => {
      mockAuth();
      db.query.mockResolvedValueOnce([[]]); // no rows

      const res = await request(app)
        .get('/api/claims/999')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Claim not found');
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app).get('/api/claims/1');
      expect(res.status).toBe(401);
    });
  });
});

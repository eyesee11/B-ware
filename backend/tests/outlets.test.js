jest.mock('../config/db');
jest.mock('../config/redis');
jest.mock('../services/firebaseAdmin');
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

const AVAILABLE_OUTLETS = ['Bloomberg', 'The Guardian', 'BBC', 'Reuters', 'Wall Street Journal', 'Financial Times'];

const mockAuth = () =>
  admin.auth().verifyIdToken.mockResolvedValue({
    uid: 'user-uid-outlets',
    email: 'user@example.com',
    name: 'Outlet User',
    picture: null,
    email_verified: true,
  });

describe('Outlets API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
  });

  // GET /api/outlets/available — public, no auth needed
  describe('GET /api/outlets/available', () => {
    it('returns all 6 available outlets', async () => {
      const res = await request(app).get('/api/outlets/available');
      expect(res.status).toBe(200);
      expect(res.body.outlets).toEqual(AVAILABLE_OUTLETS);
      expect(res.body.outlets).toHaveLength(6);
    });
  });

  // GET /api/outlets/ — optional auth
  describe('GET /api/outlets/', () => {
    it('returns empty outlets for unauthenticated users (no DB call)', async () => {
      const res = await request(app).get('/api/outlets/');
      expect(res.status).toBe(200);
      expect(res.body.outlets).toEqual([]);
      expect(res.body.available).toEqual(AVAILABLE_OUTLETS);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('returns the user\'s selected outlets from DB', async () => {
      mockAuth();
      db.query.mockResolvedValueOnce([[{ outlet_name: 'BBC' }, { outlet_name: 'Reuters' }]]);

      const res = await request(app)
        .get('/api/outlets/')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.outlets).toEqual(['BBC', 'Reuters']);
    });

    it('returns empty array if user has no preferences set', async () => {
      mockAuth();
      db.query.mockResolvedValueOnce([[]]); // no preferences
      const res = await request(app)
        .get('/api/outlets/')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(200);
      expect(res.body.outlets).toEqual([]);
    });
  });

  // POST /api/outlets/ — requires auth
  describe('POST /api/outlets/', () => {
    it('saves new outlet preferences (DELETE then INSERT)', async () => {
      mockAuth();
      db.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/outlets/')
        .set('Authorization', 'Bearer fake-token')
        .send({ outlets: ['BBC', 'Reuters'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.outlets).toEqual(['BBC', 'Reuters']);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('clears all preferences when empty array is sent', async () => {
      mockAuth();
      db.query.mockResolvedValueOnce([[]]); // only DELETE

      const res = await request(app)
        .post('/api/outlets/')
        .set('Authorization', 'Bearer fake-token')
        .send({ outlets: [] });

      expect(res.status).toBe(200);
      expect(res.body.outlets).toEqual([]);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('returns 400 for invalid outlet names', async () => {
      mockAuth();
      const res = await request(app)
        .post('/api/outlets/')
        .set('Authorization', 'Bearer fake-token')
        .send({ outlets: ['FakeNews Daily'] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid outlets');
    });

    it('returns 400 if outlets is not an array', async () => {
      mockAuth();
      const res = await request(app)
        .post('/api/outlets/')
        .set('Authorization', 'Bearer fake-token')
        .send({ outlets: 'BBC' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('outlets must be an array');
    });

    it('returns 400 if any outlet in the list is invalid', async () => {
      mockAuth();
      const res = await request(app)
        .post('/api/outlets/')
        .set('Authorization', 'Bearer fake-token')
        .send({ outlets: ['BBC', 'InvalidSource'] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('InvalidSource');
    });

    it('returns 401 with no auth token', async () => {
      const res = await request(app).post('/api/outlets/').send({ outlets: ['BBC'] });
      expect(res.status).toBe(401);
    });
  });
});

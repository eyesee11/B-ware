// Mock all external dependencies before loading the app
jest.mock('../config/db');
jest.mock('../config/redis');
jest.mock('../services/firebaseAdmin');
jest.mock('../services/emailService');
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
const { sendPasswordResetEmail } = require('../services/emailService');

// Fake decoded Firebase token (what verifyIdToken resolves to)
const FAKE_USER = {
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: null,
  email_verified: true,
};

const mockValidToken = () => admin.auth().verifyIdToken.mockResolvedValue(FAKE_USER);
const mockInvalidToken = () =>
  admin.auth().verifyIdToken.mockRejectedValue(
    Object.assign(new Error('Token expired'), { code: 'auth/id-token-expired' })
  );

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null); // not blacklisted by default
  });

  describe('POST /api/auth/sync', () => {
    it('syncs a new Firebase user to MySQL and creates a Redis session', async () => {
      mockValidToken();
      db.query
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // upsert
        .mockResolvedValueOnce([[{
          id: 1,
          firebase_uid: 'firebase-uid-123',
          name: 'Test User',
          email: 'test@example.com',
          avatar_url: null,
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
        }]]); // fetch user
      redis.set.mockResolvedValue('OK');
      redis.del.mockResolvedValue(1);

      const res = await request(app)
        .post('/api/auth/sync')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ firebase_uid: 'firebase-uid-123', role: 'user' });
      expect(redis.set).toHaveBeenCalledWith('session:firebase-uid-123', '1', 'EX', expect.any(Number));
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post('/api/auth/sync');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('returns 401 for an invalid token', async () => {
      mockInvalidToken();
      const res = await request(app)
        .post('/api/auth/sync')
        .set('Authorization', 'Bearer bad-token');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid or expired token');
    });

    it('returns 401 when session is blacklisted in Redis', async () => {
      mockValidToken();
      redis.get.mockResolvedValue('1'); // blacklisted
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/revoked/i);
    });

    it('returns 500 if user row is missing after upsert', async () => {
      mockValidToken();
      db.query
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[]]); // empty SELECT
      const res = await request(app)
        .post('/api/auth/sync')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('User sync failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the authenticated user from MySQL', async () => {
      mockValidToken();
      db.query.mockResolvedValueOnce([[{
        id: 1,
        firebase_uid: 'firebase-uid-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      }]]);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ firebase_uid: 'firebase-uid-123', role: 'user' });
    });

    it('returns 404 if user is not in MySQL yet', async () => {
      mockValidToken();
      db.query.mockResolvedValueOnce([[]]); // no rows
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes Firebase tokens and blacklists the session', async () => {
      mockValidToken();
      admin.auth().revokeRefreshTokens.mockResolvedValue(undefined);
      redis.set.mockResolvedValue('OK');
      redis.del.mockResolvedValue(1);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out');
      expect(admin.auth().revokeRefreshTokens).toHaveBeenCalledWith('firebase-uid-123');
      expect(redis.set).toHaveBeenCalledWith(
        'session_blacklist:firebase-uid-123', '1', 'EX', expect.any(Number)
      );
      expect(redis.del).toHaveBeenCalledWith('session:firebase-uid-123');
    });

    it('still returns 200 even if Firebase revocation fails', async () => {
      mockValidToken();
      admin.auth().revokeRefreshTokens.mockRejectedValue(new Error('Firebase error'));
      redis.set.mockResolvedValue('OK');
      redis.del.mockResolvedValue(1);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out');
    });

    it('returns 401 with no token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('generates a reset link and sends it via email', async () => {
      admin.auth().generatePasswordResetLink.mockResolvedValue('https://reset.link/test');
      sendPasswordResetEmail.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password reset email sent');
      expect(admin.auth().generatePasswordResetLink).toHaveBeenCalledWith('user@example.com');
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', 'https://reset.link/test');
    });

    it('returns 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('email is required');
    });

    it('returns 400 for an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email address');
    });

    it('returns a generic message when Firebase throws (avoids leaking account existence)', async () => {
      const err = Object.assign(new Error('User not found'), { code: 'auth/user-not-found' });
      admin.auth().generatePasswordResetLink.mockRejectedValue(err);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ghost@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if an account exists/i);
    });

    it('normalises email to lowercase before processing', async () => {
      admin.auth().generatePasswordResetLink.mockResolvedValue('https://reset.link/test');
      sendPasswordResetEmail.mockResolvedValue(undefined);

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: '  User@Example.COM  ' });

      expect(admin.auth().generatePasswordResetLink).toHaveBeenCalledWith('user@example.com');
    });
  });
});

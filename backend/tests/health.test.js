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

describe('Health API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns healthy when DB and Redis are both up', async () => {
    db.query.mockResolvedValue([[{ 1: 1 }]]);
    redis.ping.mockResolvedValue('PONG');

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.mysql).toBe('ok');
    expect(res.body.redis).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('returns degraded when DB is down', async () => {
    db.query.mockRejectedValue(new Error('DB Down'));
    redis.ping.mockResolvedValue('PONG');

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.mysql).toBe('down');
    expect(res.body.redis).toBe('ok');
  });

  it('returns degraded when Redis is down', async () => {
    db.query.mockResolvedValue([[{ 1: 1 }]]);
    redis.ping.mockRejectedValue(new Error('Redis Down'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.mysql).toBe('ok');
    expect(res.body.redis).toBe('down');
  });

  it('returns degraded when both DB and Redis are down', async () => {
    db.query.mockRejectedValue(new Error('DB Down'));
    redis.ping.mockRejectedValue(new Error('Redis Down'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.mysql).toBe('down');
    expect(res.body.redis).toBe('down');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

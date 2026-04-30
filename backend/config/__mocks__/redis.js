const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue("OK"),
  setex: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue("PONG"),
  on: jest.fn(),
  disconnect: jest.fn(),
  scan: jest.fn().mockResolvedValue(["0", []]),
  mget: jest.fn().mockResolvedValue([]),
  call: jest.fn().mockResolvedValue(null),
  keys: jest.fn().mockResolvedValue([]),
};

module.exports = mockRedis;

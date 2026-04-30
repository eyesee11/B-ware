module.exports = {
  default: class RedisStore {
    constructor() {}
    increment = jest.fn().mockResolvedValue({ totalHits: 1, resetTime: new Date(Date.now() + 1000) });
    decrement = jest.fn().mockResolvedValue();
    resetKey = jest.fn().mockResolvedValue();
  }
};

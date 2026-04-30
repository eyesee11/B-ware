module.exports = {
  query: jest.fn().mockResolvedValue([[], []]),
  execute: jest.fn().mockResolvedValue([[], []]),
  end: jest.fn(),
};

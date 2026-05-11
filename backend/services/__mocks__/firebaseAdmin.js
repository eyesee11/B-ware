// Prevents process.exit(1) during tests — no real Firebase env vars needed.
// auth() always returns the same object so mocks set in tests affect the middleware too.
const authMethods = {
  verifyIdToken: jest.fn(),
  revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
  generatePasswordResetLink: jest.fn().mockResolvedValue('https://reset.link/test'),
};

module.exports = {
  auth: jest.fn(() => authMethods),
  apps: [{}], // pretend already initialised to skip init guard
};

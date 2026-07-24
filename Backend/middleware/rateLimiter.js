import rateLimit from 'express-rate-limit';

// Disable rate limiting during tests
const skipDuringTests = (req, _res) => {
  return process.env.NODE_ENV === 'test';
};

const createLimiter = (options) =>
  rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    skip: skipDuringTests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    },
  });

export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  // Local/dev: avoid locking yourself out while testing login.
  max: process.env.NODE_ENV === 'production' ? 10 : 200,
});

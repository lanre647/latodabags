const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('../config/env');

// Create rate limiter instance
// 100 requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.maxRequests, // Number of requests
  duration: config.rateLimit.windowMs / 1000, // Convert ms to seconds
  blockDuration: 0, // Do not block, just return 429
});

// Stricter rate limiter for authentication routes
const authRateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 900, // per 15 minutes (900 seconds)
  blockDuration: 900, // Block for 15 minutes after limit exceeded
});

// Payment rate limiter - more restrictive
const paymentRateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 900, // per 15 minutes
  blockDuration: 1800, // Block for 30 minutes after limit exceeded
});

// General rate limiter middleware
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await rateLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: 'Rate limiter error',
      });
    }
    
    // Rate limit exceeded
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.round(error.msBeforeNext / 1000) || 900,
    });
  }
};

// Authentication rate limiter middleware
const authRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await authRateLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: 'Rate limiter error',
      });
    }
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: Math.round(error.msBeforeNext / 1000) || 900,
    });
  }
};

// Payment rate limiter middleware
const paymentRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await paymentRateLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: 'Rate limiter error',
      });
    }
    
    res.status(429).json({
      success: false,
      message: 'Too many payment requests. Please try again after 30 minutes.',
      retryAfter: Math.round(error.msBeforeNext / 1000) || 1800,
    });
  }
};

module.exports = {
  rateLimiterMiddleware,
  authRateLimiterMiddleware,
  paymentRateLimiterMiddleware,
};
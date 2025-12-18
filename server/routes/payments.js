const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoSanitize = require('express-mongo-sanitize');
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
} = require('../controllers/paymentController');
const { isAuth } = require('../middleware/auth');
const { rateLimiterMiddleware } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

/**
 * Payment Routes
 * Secure payment processing using Paystack
 *
 * Features:
 * - Secure signature verification for webhooks
 * - Idempotent payment processing
 * - Input validation and sanitization
 * - Rate limiting on sensitive endpoints
 * - Detailed logging for compliance
 */

// ===== Validation Middleware =====

/**
 * Validate payment initialization request
 */
const validateInitializePayment = (req, res, next) => {
  // Sanitize inputs
  req.body = mongoSanitize.sanitize(req.body);
  req.params = mongoSanitize.sanitize(req.params);

  const schema = Joi.object({
    orderId: Joi.string()
      .hex()
      .length(24) // MongoDB ObjectId length
      .required()
      .messages({
        'string.hex': 'Order ID must be a valid ID',
        'string.length': 'Order ID format is invalid',
        'any.required': 'Order ID is required',
      }),

    amount: Joi.number().positive().optional().messages({
      'number.positive': 'Amount must be greater than 0',
      'number.base': 'Amount must be a number',
    }),
  });

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.body = value;
  next();
};

/**
 * Validate payment verification request
 */
const validateVerifyPayment = (req, res, next) => {
  // Sanitize params
  req.params = mongoSanitize.sanitize(req.params);

  const schema = Joi.object({
    reference: Joi.string().min(5).max(255).required().messages({
      'string.empty': 'Transaction reference is required',
      'string.min': 'Transaction reference format is invalid',
      'any.required': 'Transaction reference is required',
    }),
  });

  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.params = value;
  next();
};

/**
 * Middleware to capture raw body for webhook signature verification
 * This must be applied BEFORE express.json()
 */
const captureRawBody = (req, res, next) => {
  req.rawBody = '';

  req.on('data', (chunk) => {
    req.rawBody += chunk.toString();
  });

  req.on('end', () => {
    // Parse JSON after capturing raw body
    if (req.headers['content-type']?.includes('application/json')) {
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (error) {
        logger.error('Invalid JSON in webhook', {
          error: error.message,
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON payload',
        });
      }
    }
    next();
  });
};

/**
 * Webhook signature verification middleware
 */
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-paystack-signature'];

  if (!signature) {
    logger.warn('Webhook received without X-Paystack-Signature header');
    return res.status(401).json({
      success: false,
      message: 'Missing signature header',
    });
  }

  // Signature verification is done in the controller
  // but we log suspicious activity here
  next();
};

// ===== Routes =====

/**
 * @route   POST /api/v1/payment/initialize
 * @desc    Initialize a payment transaction
 * @access  Private (User)
 *
 * Request body:
 * {
 *   "orderId": "507f1f77bcf86cd799439011",
 *   "amount": 15000 // optional, defaults to order total
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "authorizationUrl": "https://checkout.paystack.com/...",
 *     "accessCode": "123456",
 *     "reference": "ref123456",
 *     "amount": 15000,
 *     "amountInKobo": 1500000
 *   }
 * }
 */
router.post(
  '/initialize',
  isAuth,
  rateLimiterMiddleware, // Prevent abuse
  validateInitializePayment,
  initializePayment
);

/**
 * @route   POST /api/v1/payment/verify/:reference
 * @desc    Verify a payment transaction with Paystack
 * @access  Private (User)
 *
 * URL Parameters:
 * - reference: Paystack transaction reference
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": "success",
 *     "amount": 15000,
 *     "depositPaid": true,
 *     "paidAt": "2025-12-18T10:30:00Z"
 *   }
 * }
 */
router.post(
  '/verify/:reference',
  isAuth,
  rateLimiterMiddleware, // Prevent abuse
  validateVerifyPayment,
  verifyPayment
);

/**
 * @route   POST /api/v1/payment/webhook
 * @desc    Paystack webhook endpoint for payment notifications
 * @access  Public (Verified via signature)
 *
 * Paystack sends webhook events:
 * - charge.success: Payment completed
 * - charge.failed: Payment failed
 * - transfer.success: Payout successful
 * - transfer.failed: Payout failed
 *
 * Security:
 * - Signature verified against PAYSTACK_SECRET_KEY
 * - Idempotent processing using reference
 * - Raw body required for signature verification
 *
 * Note:
 * This endpoint must be registered with Paystack at:
 * https://dashboard.paystack.co/#/settings/developers
 *
 * Webhook URL: https://yourdomain.com/api/v1/payment/webhook
 */
router.post('/webhook', captureRawBody, verifyWebhookSignature, handleWebhook);

/**
 * Health check endpoint for payment service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment service is operational',
    service: 'Paystack',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Error handling for payment routes
 */
router.use((err, req, res, next) => {
  logger.error('Payment route error', {
    error: err.message,
    path: req.path,
    method: req.method,
  });

  // Signature verification error
  if (err.message === 'Invalid webhook signature') {
    return res.status(401).json({
      success: false,
      message: 'Webhook signature verification failed',
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Payment processing error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = router;

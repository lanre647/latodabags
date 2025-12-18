const config = require('./env');

/**
 * Paystack Configuration
 * Using sandbox keys for development and testing
 * Switch to live keys only in production after merchant approval
 */

const paystackConfig = {
  // Use sandbox keys in development/test
  secretKey: config.paystack.secretKey,
  publicKey: config.paystack.publicKey,

  // API endpoints
  baseUrl: 'https://api.paystack.co',

  // Webhook settings
  webhook: {
    path: '/api/v1/payment/webhook',
    // The secret is used to verify webhook signatures
    secret: config.paystack.secretKey,
  },

  // Transaction settings
  transaction: {
    // Maximum amount in kobo (₦500,000 = 50,000,000 kobo)
    maxAmount: 50000000,
    // Minimum amount in kobo (₦100 = 10,000 kobo)
    minAmount: 10000,
    // Transaction timeout in seconds
    timeout: 3600,
  },

  // Retry settings for webhook processing
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  },
};

module.exports = paystackConfig;

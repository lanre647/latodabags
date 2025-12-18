const axios = require('axios');
const crypto = require('crypto');
const paystackConfig = require('../config/paystack');
const logger = require('../utils/logger');

/**
 * Paystack Service
 * Handles all Paystack API interactions securely
 */

class PaystackService {
  constructor() {
    this.baseUrl = paystackConfig.baseUrl;
    this.secretKey = paystackConfig.secretKey;
    this.publicKey = paystackConfig.publicKey;
  }

  /**
   * Initialize payment transaction
   * @param {string} email - Customer email
   * @param {number} amount - Amount in kobo
   * @param {object} metadata - Additional transaction data
   * @returns {Promise<{authorizationUrl, accessCode, reference}>}
   */
  async initializeTransaction(email, amount, metadata = {}) {
    try {
      // Validate amount
      if (amount < paystackConfig.transaction.minAmount) {
        throw new Error(
          `Amount must be at least ₦${
            paystackConfig.transaction.minAmount / 100
          }`
        );
      }

      if (amount > paystackConfig.transaction.maxAmount) {
        throw new Error(
          `Amount cannot exceed ₦${paystackConfig.transaction.maxAmount / 100}`
        );
      }

      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount,
          metadata,
          // Callback URL will be handled by frontend
          callback_url: process.env.CLIENT_URL + '/payment/callback',
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error(
          response.data.message || 'Failed to initialize transaction'
        );
      }

      logger.info('Paystack transaction initialized', {
        reference: response.data.data.reference,
        amount,
        email,
      });

      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    } catch (error) {
      logger.error('Paystack initialization error', {
        error: error.message,
        email,
        amount,
      });
      throw error;
    }
  }

  /**
   * Verify transaction with Paystack
   * @param {string} reference - Transaction reference
   * @returns {Promise<{status, amount, email, metadata}>}
   */
  async verifyTransaction(reference) {
    try {
      // Validate reference format
      if (!reference || typeof reference !== 'string' || reference.length < 5) {
        throw new Error('Invalid transaction reference');
      }

      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error(
          response.data.message || 'Transaction verification failed'
        );
      }

      const transaction = response.data.data;

      logger.info('Paystack transaction verified', {
        reference,
        status: transaction.status,
        amount: transaction.amount,
      });

      return {
        success: true,
        status: transaction.status, // 'success', 'failed', 'pending'
        amount: transaction.amount, // in kobo
        email: transaction.customer.email,
        customerId: transaction.customer.customer_code,
        metadata: transaction.metadata || {},
        paidAt: transaction.paid_at,
        authorizationCode: transaction.authorization.authorization_code,
      };
    } catch (error) {
      logger.error('Paystack verification error', {
        error: error.message,
        reference,
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature from Paystack
   * @param {string} signature - X-Paystack-Signature header
   * @param {string} body - Raw request body
   * @returns {boolean}
   */
  verifyWebhookSignature(signature, body) {
    try {
      if (!signature || !body) {
        logger.warn('Missing signature or body in webhook verification');
        return false;
      }

      // Create hash using the raw body and secret key
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(body)
        .digest('hex');

      const isValid = hash === signature;

      if (!isValid) {
        logger.warn('Invalid webhook signature', {
          expectedSignature: signature.substring(0, 10),
          calculatedSignature: hash.substring(0, 10),
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Webhook signature verification error', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get transaction details
   * @param {number} transactionId - Paystack transaction ID
   * @returns {Promise<object>}
   */
  async getTransaction(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error('Failed to fetch transaction');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Error fetching transaction', {
        error: error.message,
        transactionId,
      });
      throw error;
    }
  }

  /**
   * Create customer on Paystack
   * @param {string} email - Customer email
   * @param {string} first_name - First name
   * @param {string} last_name - Last name
   * @param {string} phone - Phone number
   * @returns {Promise<object>}
   */
  async createCustomer(email, first_name, last_name, phone) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customer`,
        {
          email,
          first_name,
          last_name,
          phone,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error('Failed to create customer');
      }

      logger.info('Paystack customer created', {
        customerId: response.data.data.id,
        email,
      });

      return response.data.data;
    } catch (error) {
      // If customer exists, continue silently
      if (error.response?.status === 422) {
        logger.warn('Customer already exists on Paystack', { email });
        return null;
      }

      logger.error('Error creating Paystack customer', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Parse and validate webhook event
   * @param {object} event - Paystack webhook event
   * @returns {object}
   */
  parseWebhookEvent(event) {
    if (!event || !event.event) {
      throw new Error('Invalid webhook event');
    }

    return {
      event: event.event,
      data: event.data,
      reference: event.data.reference,
      status: event.data.status,
      amount: event.data.amount,
      customer: event.data.customer,
      metadata: event.data.metadata || {},
    };
  }
}

module.exports = new PaystackService();

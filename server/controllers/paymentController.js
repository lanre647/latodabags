const paystackService = require('../services/paystackService');
const logger = require('../utils/logger');

/**
 * Payment Controller
 * Handles all payment operations securely
 */

/**
 * @desc    Initialize payment transaction
 * @route   POST /api/v1/payment/initialize
 * @access  Private
 * @param   {string} orderId - Order ID (required)
 * @param   {number} amount - Amount in Naira (optional, uses order total if not provided)
 */
exports.initializePayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const userId = req.user.id;

    // Validate orderId
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required and must be a string',
      });
    }

    // TODO: Fetch order from database
    // const order = await Order.findById(orderId);
    // if (!order) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Order not found',
    //   });
    // }

    // // Verify order belongs to user
    // if (order.userId.toString() !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to this order',
    //   });
    // }

    // // Check if order is already paid
    // if (order.paymentStatus === 'completed') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Order is already paid',
    //   });
    // }

    // Calculate amount in kobo
    // Paystack expects amount in kobo (1 Naira = 100 kobo)
    const orderTotal = amount || 10000; // TODO: Replace with order.totalAmount
    const amountInKobo = Math.round(orderTotal * 100);

    // Validate amount
    if (amountInKobo < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Order amount must be at least ₦100',
      });
    }

    if (amountInKobo > 50000000) {
      return res.status(400).json({
        success: false,
        message: 'Order amount cannot exceed ₦500,000',
      });
    }

    // Prepare metadata for transaction
    const metadata = {
      orderId,
      userId,
      orderDate: new Date().toISOString(),
      customSpecs: {}, // TODO: Include from order if needed
    };

    // TODO: Get user email
    const userEmail = 'customer@test.com'; // Replace with actual user email

    // Initialize transaction with Paystack
    const paystackResponse = await paystackService.initializeTransaction(
      userEmail,
      amountInKobo,
      metadata
    );

    // TODO: Update order with payment reference (idempotency key)
    // await Order.findByIdAndUpdate(orderId, {
    //   paymentReference: paystackResponse.reference,
    //   paymentStatus: 'pending',
    //   paymentInitiatedAt: new Date(),
    // });

    logger.info('Payment initialized successfully', {
      orderId,
      reference: paystackResponse.reference,
      amount: orderTotal,
    });

    res.status(200).json({
      success: true,
      message: 'Payment initialization successful',
      data: {
        authorizationUrl: paystackResponse.authorizationUrl,
        accessCode: paystackResponse.accessCode,
        reference: paystackResponse.reference,
        amount: orderTotal,
        amountInKobo,
      },
    });
  } catch (error) {
    logger.error('Payment initialization error', {
      error: error.message,
      orderId: req.body.orderId,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Verify payment transaction
 * @route   POST /api/v1/payment/verify/:reference
 * @access  Private
 * @param   {string} reference - Paystack transaction reference
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required',
      });
    }

    // Verify transaction with Paystack
    const verification = await paystackService.verifyTransaction(reference);

    if (verification.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: verification.status,
      });
    }

    // TODO: Update order with payment confirmation
    // const order = await Order.findOne({
    //   paymentReference: reference,
    //   userId,
    // });

    // if (!order) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Order not found',
    //   });
    // }

    // // Idempotency: Check if already processed
    // if (order.paymentStatus === 'completed') {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Payment already verified and processed',
    //     data: {
    //       orderId: order._id,
    //       paymentStatus: 'completed',
    //       depositPaid: true,
    //     },
    //   });
    // }

    // // Update order
    // order.paymentStatus = 'completed';
    // order.depositPaid = true;
    // order.paidAt = new Date();
    // order.authorizationCode = verification.authorizationCode;
    // await order.save();

    logger.info('Payment verified successfully', {
      reference,
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        status: verification.status,
        amount: verification.amount / 100, // Convert back to Naira
        depositPaid: true,
        paidAt: verification.paidAt,
      },
    });
  } catch (error) {
    logger.error('Payment verification error', {
      error: error.message,
      reference: req.params.reference,
    });

    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Paystack webhook handler
 * @route   POST /api/v1/payment/webhook
 * @access  Public (verified via signature)
 *
 * Handles:
 * - charge.success: Payment successful
 * - charge.failed: Payment failed
 * - transfer.success: Payout successful
 * - transfer.failed: Payout failed
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Get signature from header
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      logger.warn('Webhook received without signature');
      return res.status(400).json({
        success: false,
        message: 'Missing signature header',
      });
    }

    // Verify webhook signature
    // Note: Express middleware should pass raw body for this
    const isValidSignature = paystackService.verifyWebhookSignature(
      signature,
      req.rawBody || JSON.stringify(req.body)
    );

    if (!isValidSignature) {
      logger.warn('Webhook signature verification failed', {
        signature: signature.substring(0, 10),
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    // Parse webhook event
    const event = paystackService.parseWebhookEvent(req.body);

    logger.info('Valid webhook received', {
      event: event.event,
      reference: event.reference,
    });

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event);
        break;

      case 'charge.failed':
        await handleChargeFailed(event);
        break;

      case 'transfer.success':
        await handleTransferSuccess(event);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event);
        break;

      default:
        logger.info('Unhandled webhook event', {
          event: event.event,
        });
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error.message,
      body: req.body,
    });

    // Still return 200 to prevent Paystack retries
    res.status(200).json({
      success: false,
      message: 'Webhook processing error',
    });
  }
};

/**
 * Handle successful charge event
 * @private
 */
async function handleChargeSuccess(event) {
  try {
    const { reference, data } = event;

    logger.info('Processing successful charge', {
      reference,
      amount: data.amount,
    });

    // TODO: Update order payment status
    // const order = await Order.findOne({
    //   paymentReference: reference,
    // });

    // if (order) {
    //   // Idempotency: Check if already processed
    //   if (order.paymentStatus === 'completed') {
    //     logger.info('Payment already processed (idempotent)', { reference });
    //     return;
    //   }

    //   order.paymentStatus = 'completed';
    //   order.depositPaid = true;
    //   order.paidAt = new Date();
    //   order.authorizationCode = data.authorization.authorization_code;
    //   await order.save();

    //   // TODO: Send confirmation email to customer
    //   // TODO: Notify artisan about new order
    // }
  } catch (error) {
    logger.error('Error handling charge success', {
      error: error.message,
      reference: event.reference,
    });
  }
}

/**
 * Handle failed charge event
 * @private
 */
async function handleChargeFailed(event) {
  try {
    const { reference } = event;

    logger.warn('Processing failed charge', {
      reference,
    });

    // TODO: Update order payment status
    // const order = await Order.findOne({
    //   paymentReference: reference,
    // });

    // if (order) {
    //   order.paymentStatus = 'failed';
    //   order.failureReason = event.data.gateway_response || 'Unknown error';
    //   await order.save();

    //   // TODO: Send failure notification to customer
    // }
  } catch (error) {
    logger.error('Error handling charge failed', {
      error: error.message,
      reference: event.reference,
    });
  }
}

/**
 * Handle successful transfer event
 * @private
 */
async function handleTransferSuccess(event) {
  try {
    logger.info('Transfer successful', {
      transferId: event.data.id,
    });

    // TODO: Update artisan payout status if implemented
  } catch (error) {
    logger.error('Error handling transfer success', {
      error: error.message,
    });
  }
}

/**
 * Handle failed transfer event
 * @private
 */
async function handleTransferFailed(event) {
  try {
    logger.warn('Transfer failed', {
      transferId: event.data.id,
      reason: event.data.reason,
    });

    // TODO: Handle payout failure and retry logic
  } catch (error) {
    logger.error('Error handling transfer failed', {
      error: error.message,
    });
  }
}

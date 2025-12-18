const express = require('express');
const router = express.Router();
const {
  createCustomOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const {
  validateCreateCustomOrder,
  validateUpdateOrderStatus,
  validateQuery,
} = require('../middleware/orderValidation');
const { isAuth, isAdmin } = require('../middleware/auth');
const { rateLimiterMiddleware } = require('../middleware/rateLimiter');

// Apply rate limiter to all order routes
router.use(rateLimiterMiddleware);

// ===== Customer Routes =====

// @route   POST /api/v1/orders/custom
// @desc    Create custom order (validates customSpecs, calculates total, saves as PENDING)
// @access  Private
router.post('/custom', isAuth, validateCreateCustomOrder, createCustomOrder);

// @route   GET /api/v1/orders/my
// @desc    Get my orders (with user and product population)
// @access  Private
router.get('/my', isAuth, validateQuery, getMyOrders);

// @route   GET /api/v1/orders/:id
// @desc    Get single order (own order or admin)
// @access  Private
router.get('/:id', isAuth, getOrder);

// @route   PUT /api/v1/orders/:id/cancel
// @desc    Cancel order (only if status is pending)
// @access  Private
router.put('/:id/cancel', isAuth, cancelOrder);

// ===== Admin Routes =====

// @route   GET /api/v1/admin/orders
// @desc    Get all orders (admin only, with user and product population)
// @access  Private/Admin
router.get('/admin/all', isAuth, isAdmin, validateQuery, getAllOrders);

// @route   PUT /api/v1/admin/orders/:id/status
// @desc    Update order status (admin only)
// @access  Private/Admin
router.put('/admin/:id/status', isAuth, isAdmin, validateUpdateOrderStatus, updateOrderStatus);

module.exports = router;
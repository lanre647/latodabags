const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} = require('../controllers/productController');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateQuery,
} = require('../middleware/productValidation');
const { isAuth, isAdmin } = require('../middleware/auth');
const { rateLimiterMiddleware } = require('../middleware/rateLimiter');

// Apply general rate limiter to all product routes
router.use(rateLimiterMiddleware);

// @route   GET /api/v1/products
// @desc    Get all products with filtering and pagination
// @access  Public
// Query params: ?category=tote&limit=12&page=1&featured=true&search=leather&minPrice=1000&maxPrice=5000
router.get('/', validateQuery, getProducts);

// @route   GET /api/v1/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', validateQuery, getProductsByCategory);

// @route   GET /api/v1/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProduct);

// @route   POST /api/v1/products
// @desc    Create new product
// @access  Private/Admin only
router.post('/', isAuth, isAdmin, validateCreateProduct, createProduct);

// @route   PUT /api/v1/products/:id
// @desc    Update product
// @access  Private/Admin only
router.put('/:id', isAuth, isAdmin, validateUpdateProduct, updateProduct);

// @route   DELETE /api/v1/products/:id
// @desc    Delete product
// @access  Private/Admin only
router.delete('/:id', isAuth, isAdmin, deleteProduct);

module.exports = router;
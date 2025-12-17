const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getMe,
  logout,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateUpdateProfile,
  validateChangePassword,
} = require('../middleware/validation');
const { isAuth, verifyRefreshToken } = require('../middleware/auth');
const { authRateLimiterMiddleware } = require('../middleware/rateLimiter');

// Apply auth rate limiter to all auth routes
router.use(authRateLimiterMiddleware);

// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public (requires refresh token)
router.post('/refresh', validateRefreshToken, verifyRefreshToken, refreshToken);

// @route   GET /api/v1/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', isAuth, getMe);

// @route   GET /api/v1/auth/logout
// @desc    Logout user (clear refresh token)
// @access  Private
router.get('/logout', isAuth, logout);

// @route   PUT /api/v1/auth/update
// @desc    Update user profile
// @access  Private
router.put('/update', isAuth, validateUpdateProfile, updateProfile);

// @route   PUT /api/v1/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', isAuth, validateChangePassword, changePassword);

module.exports = router;
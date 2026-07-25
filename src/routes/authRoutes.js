/**
 * Authentication Routes
 * Maps API endpoint paths to their respective controller functions for user authentication.
 */
const express = require('express');
// Import the controller functions that handle the actual business logic
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * Maps the POST request at the /register path to the registerUser controller.
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 * Maps the POST request at the /login path to the loginUser controller.
 */
router.post('/login', loginUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password/:token', resetPassword);

// Export the router so it can be mounted in the main server.js file
module.exports = router;

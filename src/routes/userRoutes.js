/**
 * User Routes
 * Maps API endpoint paths to their respective controller functions for user-specific operations.
 */
const express = require('express');
// Import the controller functions that handle the actual business logic
const { registerOrLoginUser, getUserProfile, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/users
 * @desc    Register a new user or login existing (Legacy hybrid route)
 * @access  Public
 * Maps the root POST request to the registerOrLoginUser controller function.
 */
router.post('/', registerOrLoginUser);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile details by ID
 * @access  Public
 * Maps the GET request with a dynamic :id parameter to the getUserProfile controller function.
 */
router.get('/:id', getUserProfile);

// Export the router so it can be mounted in the main server.js file
module.exports = router;

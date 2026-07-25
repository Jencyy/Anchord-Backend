/**
 * Anchor Routes
 * Maps API endpoint paths to their respective controller functions for managing Anchors (time blocks).
 */
const express = require('express');
// Import the controller functions that handle the actual business logic
const { createAnchor, getAnchorsByUser, deleteAnchor } = require('../controllers/anchorController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/anchors
 * @desc    Create a new anchor (time block)
 * @access  Private
 * Maps the root POST request to the createAnchor controller function.
 */
router.post('/', auth, createAnchor);

/**
 * @route   GET /api/anchors
 * @desc    Get all anchors for a specific user
 * @access  Private
 */
router.get('/', auth, getAnchorsByUser);

/**
 * @route   DELETE /api/anchors/:id
 * @desc    Delete a specific anchor
 * @access  Private
 */
router.delete('/:id', auth, deleteAnchor);

// Export the router so it can be mounted in the main server.js file
module.exports = router;

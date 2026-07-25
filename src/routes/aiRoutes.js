/**
 * AI Routes
 * Maps API endpoint paths for AI functionality.
 */
const express = require('express');
const { parseSchedule, suggestAnchors } = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/ai/parse-schedule
 * @desc    Parse natural language schedule text into JSON blocks
 * @access  Private
 */
router.post('/parse-schedule', authMiddleware, parseSchedule);

// @route   POST /api/ai/suggest-anchors
// @desc    Suggest anchors to stack a new habit onto
// @access  Private
router.post('/suggest-anchors', authMiddleware, suggestAnchors);

module.exports = router;

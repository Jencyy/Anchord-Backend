/**
 * Habit Routes
 * Maps API endpoint paths to their respective controller functions for managing Habits.
 */
const express = require('express');
const router = express.Router();
// Import the controller functions that handle the actual business logic
const { getHabits, createHabit, deleteHabit, logHabit, getHabitLogs } = require('../controllers/habitController');
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/habits
 * @desc    Get user habits
 * @access  Private
 * Maps the GET request to the getHabits controller function.
 */
router.get('/', authMiddleware, getHabits);

/**
 * @route   GET /api/habits/logs
 * @desc    Get all habit logs for the user
 * @access  Private
 */
router.get('/logs', authMiddleware, getHabitLogs);

/**
 * @route   POST /api/habits
 * @desc    Create a new habit or multiple stacked habits
 * @access  Private
 * Maps the POST request to the createHabit controller function.
 */
router.post('/', authMiddleware, createHabit);

/**
 * @route   POST /api/habits/:id/logs
 * @desc    Log a habit completion for a specific date
 * @access  Private
 */
router.post('/:id/logs', authMiddleware, logHabit);

/**
 * @route   DELETE /api/habits/:id
 * @desc    Delete a specific habit by its ID
 * @access  Private
 * Maps the DELETE request to the deleteHabit controller function.
 */
router.delete('/:id', authMiddleware, deleteHabit);

// Export the router so it can be mounted in the main server.js file
module.exports = router;

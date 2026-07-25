/**
 * Habit Controller
 * Handles all logic related to habits, including fetching, creating, and deleting habits.
 * Manages tying habits to specific anchors.
 */
const Habit = require('../models/Habit');
const Anchor = require('../models/Anchor');
const HabitLog = require('../models/HabitLog');

/**
 * @desc    Get all habits for the logged-in user
 * @route   GET /api/habits
 * @access  Private (Requires authentication token)
 */
exports.getHabits = async (req, res) => {
  try {
    // 1. Query the database for all habits belonging to the authenticated user
    // .populate('anchorId') fetches the full Anchor object instead of just the ID
    const habits = await Habit.find({ userId: req.user.id }).populate('anchorId');
    
    // 2. Return the array of habits to the client
    res.json(habits);
  } catch (err) {
    // Log error and return standard server error on failure
    console.error('Error fetching habits:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Create a new habit or multiple habits if stacked onto multiple anchors
 * @route   POST /api/habits
 * @access  Private (Requires authentication token)
 */
exports.createHabit = async (req, res) => {
  // Extract habit details from the incoming request body
  const { name, frequency, normal_version, strategy, min_version_name, min_version_time, celebration, anchorId, anchorIds } = req.body;

  try {
    // 1. Determine which anchors to attach this habit to.
    // If 'anchorIds' array is provided, use it. Otherwise, fallback to a single 'anchorId'.
    const idsToProcess = anchorIds || (anchorId ? [anchorId] : []);
    
    // Validate that at least one anchor was provided
    if (idsToProcess.length === 0) {
      return res.status(400).json({ msg: 'Please provide at least one anchorId' });
    }

    // Array to hold the successfully saved habit documents
    const savedHabits = [];

    // 2. Loop through each provided anchor ID to create a separate habit instance
    for (const id of idsToProcess) {
      // Ensure the anchor actually exists and belongs to the authenticated user
      const anchor = await Anchor.findOne({ _id: id, userId: req.user.id });
      if (!anchor) {
        continue; // Skip this ID if it's invalid or unauthorized
      }

      // 3. Create a new Habit model instance linked to this specific anchor
      const newHabit = new Habit({
        userId: req.user.id,
        anchorId: id,
        name,
        frequency,
        normal_version,
        strategy,
        min_version_name,
        min_version_time,
        celebration,
      });

      // 4. Save the habit to the database and push it to the results array
      const savedHabit = await newHabit.save();
      savedHabits.push(savedHabit);
    }

    // 5. Return all created habits to the client
    res.json(savedHabits);
  } catch (err) {
    // Catch and log any server errors during creation
    console.error('Error creating habit:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Delete a specific habit
 * @route   DELETE /api/habits/:id
 * @access  Private (Requires authentication token)
 */
exports.deleteHabit = async (req, res) => {
  try {
    // 1. Find the habit by its ID in the database
    const habit = await Habit.findById(req.params.id);

    // If the habit does not exist, return a 404 Not Found
    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // 2. Ensure the authenticated user actually owns this habit before deleting
    // toString() is needed to compare the ObjectId to the string user.id
    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // 3. Delete the habit from the database
    await habit.deleteOne();
    
    // 4. Return a success message
    res.json({ msg: 'Habit removed' });
  } catch (err) {
    // Log error and return standard server error on failure
    console.error('Error deleting habit:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Get all habit logs for the logged-in user
 * @route   GET /api/habits/logs
 * @access  Private
 */
exports.getHabitLogs = async (req, res) => {
  try {
    const logs = await HabitLog.find({ userId: req.user.id });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching habit logs:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc    Log a habit completion for a specific date
 * @route   POST /api/habits/:id/logs
 * @access  Private
 */
exports.logHabit = async (req, res) => {
  const { date, status } = req.body;
  const habitId = req.params.id;

  if (!date || !status) {
    return res.status(400).json({ msg: 'Please provide date and status' });
  }

  const validStatuses = ['completed', 'failed', 'skipped', 'disrupted'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }

  try {
    // Ensure the habit belongs to the user
    const habit = await Habit.findById(habitId);
    if (!habit || habit.userId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Habit not found or unauthorized' });
    }

    // Upsert the log for this specific date and habit
    const log = await HabitLog.findOneAndUpdate(
      { userId: req.user.id, habitId, date },
      { status },
      { new: true, upsert: true } // Create if doesn't exist, otherwise update
    );

    res.json(log);
  } catch (err) {
    console.error('Error logging habit:', err.message);
    res.status(500).send('Server Error');
  }
};

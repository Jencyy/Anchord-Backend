/**
 * Anchor Controller
 * Handles all logic for managing "Anchors" (time blocks).
 * Includes creating anchors and fetching anchors for a specific user.
 */
const Anchor = require('../models/Anchor');

/**
 * @desc    Create a new anchor (time block) for a user
 * @route   POST /api/anchors
 * @access  Public (should potentially be protected with auth middleware)
 */
exports.createAnchor = async (req, res) => {
  // Extract anchor details from the request body
  const { label, time_start, time_end, day_type } = req.body;
  const userId = req.user.id; // Automatically get the logged-in user's ID

  try {
    // 1. Instantiate a new Anchor model object with the provided data
    const anchor = new Anchor({
      userId,
      label,
      time_start,
      time_end,
      day_type
    });

    // 2. Save the anchor object to the database
    await anchor.save();
    
    // 3. Return the successfully created anchor as a JSON response (201 Created)
    res.status(201).json(anchor);
  } catch (err) {
    // Log the FULL error so we can debug validation issues
    console.error('createAnchor error:', JSON.stringify(err, null, 2));
    console.error('err.message:', err.message);
    res.status(500).json({ msg: 'Server error', detail: err.message });
  }
};

/**
 * @desc    Get all anchors belonging to a specific user
 * @route   GET /api/anchors
 * @access  Private
 */
exports.getAnchorsByUser = async (req, res) => {
  try {
    // 1. Query the database for all anchors associated with the authenticated user
    // We use .sort({ time_start: 1 }) to arrange the retrieved anchors chronologically by start time
    const anchors = await Anchor.find({ userId: req.user.id }).sort({ time_start: 1 });
    
    // 2. Return the sorted list of anchors to the client
    res.json(anchors);
  } catch (err) {
    // Log error and return standard server error if querying fails
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Delete a specific anchor
 * @route   DELETE /api/anchors/:id
 * @access  Private
 */
exports.deleteAnchor = async (req, res) => {
  try {
    const anchor = await Anchor.findById(req.params.id);

    if (!anchor) {
      return res.status(404).json({ msg: 'Anchor not found' });
    }

    // Ensure user owns anchor
    if (anchor.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await anchor.deleteOne();

    res.json({ msg: 'Anchor removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

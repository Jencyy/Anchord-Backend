/**
 * User Controller
 * Handles user-specific logic separate from raw authentication.
 * Includes legacy registration/login combination and fetching user profiles.
 */
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new user or login an existing one
 * @route   POST /api/users
 * @access  Public
 * @note    This endpoint acts as a simplified hybrid of register and login.
 *          Consider replacing it fully with the more secure authController logic.
 */
exports.registerOrLoginUser = async (req, res) => {
  // Extract data from the incoming request body
  const { name, email, lifeStage } = req.body;

  try {
    // 1. Check if the user already exists in the database
    let user = await User.findOne({ email });

    if (user) {
      // If the user already exists, essentially treat it as a "login" and return the user profile
      return res.status(200).json(user);
    }

    // 2. If the user doesn't exist, create a new instance (Registration path)
    user = new User({
      name,
      email,
      lifeStage
    });

    // 3. Save the new user to the database
    await user.save();
    
    // 4. Return the newly created user as a JSON response (201 Created)
    res.status(201).json(user);
  } catch (err) {
    // Log error and return standard server error on failure
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Get an individual user's profile
 * @route   GET /api/users/:id
 * @access  Public (Should potentially be protected with auth middleware in the future)
 */
exports.getUserProfile = async (req, res) => {
  try {
    // 1. Query the database to find a user by the ID passed in the URL parameters
    const user = await User.findById(req.params.id);
    
    // 2. If no user is found with that ID, return a 404 Not Found error
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // 3. Return the user's profile data
    res.json(user);
  } catch (err) {
    // Log error and return standard server error on failure
    console.error(err.message);
    res.status(500).send('Server error');
  } 
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  const { name, email, lifeStage, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (lifeStage) user.lifeStage = lifeStage;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Return the updated user without the password
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      lifeStage: user.lifeStage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

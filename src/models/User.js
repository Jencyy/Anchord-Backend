/**
 * User Model
 * Represents a user in the Anchord system.
 * Contains user details like name, email, password, and their current life stage.
 */
const mongoose = require('mongoose');

// Define the schema structure for a User document
const userSchema = new mongoose.Schema({
  // The user's full name
  name: {
    type: String,
    required: true,
  },
  // The user's email address (must be unique for login)
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no two users can have the same email
  },
  // The hashed version of the user's password for security
  password: {
    type: String,
    required: true,
  },
  // Categorization of the user's current life situation
  lifeStage: {
    type: String,
    enum: ['Student', 'Working professional', 'Homemaker', 'Retired', 'Mixed'],
    required: true,
  },
  // Token used for resetting password
  resetPasswordToken: {
    type: String,
  },
  // Expiration time for the reset token
  resetPasswordExpires: {
    type: Date,
  },
  // Timestamp when the user was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model so it can be used for database operations
module.exports = mongoose.model('User', userSchema);

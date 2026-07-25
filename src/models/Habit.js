/**
 * Habit Model
 * Represents a user's habit that is stacked onto an existing Anchor.
 * Includes details for the minimum "lazy day" version.
 */
const mongoose = require('mongoose');

// Define the schema structure for a Habit document
const habitSchema = new mongoose.Schema({
  // Reference to the User who owns this habit
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Establishes a relationship with the User model
    required: true,
  },
  // Reference to the Anchor this habit is attached to
  anchorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anchor', // Establishes a relationship with the Anchor model
    required: true,
  },
  // The name or title of the habit (e.g., "Reading", "Exercise")
  name: {
    type: String,
    required: true,
  },
  // How often this habit should be performed
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'weekdays'],
    default: 'daily',
  },
  // The full, target version of the habit
  normal_version: {
    type: String,
    description: "The normal or target version of the habit (e.g., 'Read 10 pages' or '0 minutes on social media')",
  },
  // The strategy used to build or break the habit
  strategy: {
    type: String,
    description: "Atomic Habits style strategy for building or breaking this habit",
  },
  // The smallest acceptable version of the habit for days with low energy
  min_version_name: {
    type: String,
    required: true,
    description: "The lazy day version of the habit (e.g., 'Read 1 page')",
  },
  // Time it takes to complete the minimum version
  min_version_time: {
    type: Number,
    required: true,
    description: "Time cost of the minimum version in minutes",
  },
  // How the user will celebrate completing the habit to build a positive feedback loop
  celebration: {
    type: String,
    description: "Custom celebration message when completed",
  },
  // Timestamp when the habit was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model so it can be used for database operations
module.exports = mongoose.model('Habit', habitSchema);

/**
 * Anchor Model
 * Represents a fixed time block or "anchor" in a user's daily schedule.
 * Used for planning activities during a specific time of the day.
 */
const mongoose = require('mongoose');

// Define the schema structure for an Anchor document
const anchorSchema = new mongoose.Schema({
  // Reference to the User who owns this anchor
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Establishes a relationship with the User model
    required: true,
  },
  // The label or description of what the anchor is (e.g., "Deep Work", "Exercise")
  label: {
    type: String,
    required: true,
  },
  // The start time of the anchor in HH:MM format (e.g., "07:00")
  time_start: {
    type: String, 
    required: true,
  },
  // The end time of the anchor in HH:MM format (e.g., "08:00")
  time_end: {
    type: String,
    required: true,
  },
  // Specifies if this anchor applies to a regular weekday or a day off
  day_type: {
    type: String,
    enum: ['weekday', 'day_off'],
    required: true,
  },
  // Timestamp when the anchor was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model so it can be used for database operations
module.exports = mongoose.model('Anchor', anchorSchema);

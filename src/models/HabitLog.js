/**
 * HabitLog Model
 * Records a daily completion event for a specific habit.
 * Status can be 'completed', 'failed', 'skipped', or 'disrupted'.
 */
const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  date: {
    type: String, // Stored as YYYY-MM-DD to avoid timezone shifts
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'skipped', 'disrupted'],
    required: true,
  }
}, { timestamps: true });

// Ensure a user can only have one log per habit per day
habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);

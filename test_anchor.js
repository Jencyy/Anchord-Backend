/**
 * Quick test script: directly saves an Anchor document to MongoDB.
 * Run with: node test_anchor.js
 * This verifies the DB connection and model work correctly.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Anchor = require('./src/models/Anchor');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('Connected!');

    // Use a fake but valid ObjectId as a test userId
    const fakeUserId = new mongoose.Types.ObjectId();

    const anchor = new Anchor({
      userId: fakeUserId,
      label: 'Test Block',
      time_start: '07:00',
      time_end: '08:00',
      day_type: 'weekday',
    });

    await anchor.save();
    console.log('SUCCESS - Anchor saved:', anchor._id.toString());

    // Clean up the test document
    await Anchor.findByIdAndDelete(anchor._id);
    console.log('Cleanup done.');
  } catch (err) {
    console.error('FAILED:', err.message);
    console.error('Full error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();

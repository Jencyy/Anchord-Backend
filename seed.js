const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');
const Anchor = require('./src/models/Anchor');
const Habit = require('./src/models/Habit');
const HabitLog = require('./src/models/HabitLog');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Clear existing test data
    console.log('Clearing old test data...');
    await User.deleteMany({ email: 'test_figma@example.com' });
    
    // Create User
    console.log('Creating user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
      name: 'Figma AI Test',
      email: 'test_figma@example.com',
      password: hashedPassword,
      lifeStage: 'Working professional'
    });

    console.log('Creating anchors...');
    const anchor1 = await Anchor.create({
      userId: user._id,
      label: 'Wake Up & Morning Routine',
      time_start: '07:00',
      time_end: '08:00',
      day_type: 'weekday'
    });

    const anchor2 = await Anchor.create({
      userId: user._id,
      label: 'Commute to Work',
      time_start: '08:30',
      time_end: '09:30',
      day_type: 'weekday'
    });

    const anchor3 = await Anchor.create({
      userId: user._id,
      label: 'Lunch Break',
      time_start: '13:00',
      time_end: '14:00',
      day_type: 'weekday'
    });

    console.log('Creating habits...');
    const habit1 = await Habit.create({
      userId: user._id,
      anchorId: anchor1._id,
      name: 'Drink Water',
      frequency: 'daily',
      normal_version: 'Drink 500ml water',
      strategy: 'Make it obvious by placing bottle on nightstand',
      min_version_name: 'Drink 1 glass',
      min_version_time: 1,
      celebration: 'Fist pump!'
    });

    const habit2 = await Habit.create({
      userId: user._id,
      anchorId: anchor2._id,
      name: 'Listen to Podcast',
      frequency: 'weekdays',
      normal_version: 'Listen to 1 full episode',
      strategy: 'Temptation bundling',
      min_version_name: 'Listen for 5 mins',
      min_version_time: 5,
      celebration: 'Smile'
    });

    console.log('Creating habit logs (history/streaks)...');
    
    // Generate logs for the past 14 days
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - i);
      const dateString = logDate.toISOString().split('T')[0];
      
      // Drink Water - mostly completed, one day skipped, one day disrupted
      let status1 = 'completed';
      if (i === 5) status1 = 'failed';
      if (i === 2) status1 = 'disrupted';
      
      await HabitLog.create({
        userId: user._id,
        habitId: habit1._id,
        date: dateString,
        status: status1
      });

      // Podcast - completed only on weekdays
      const dayOfWeek = logDate.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        let status2 = 'completed';
        if (i === 7) status2 = 'skipped';
        await HabitLog.create({
          userId: user._id,
          habitId: habit2._id,
          date: dateString,
          status: status2
        });
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

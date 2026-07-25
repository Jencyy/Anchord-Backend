/**
 * Main server configuration and entry point for the Anchord Backend.
 * Sets up Express, middleware, routes, and the database connection.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Initialize Express application
const app = express();
// Define the port to run the server on, defaulting to 5000
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware Configuration
// ==========================================

// Enable CORS (Cross-Origin Resource Sharing) to allow requests from the frontend
app.use(cors());
// Parse incoming JSON payloads
app.use(express.json());

// ==========================================
// API Routes
// ==========================================

// Route for authentication-related endpoints (register, login)
app.use('/api/auth', require('./src/routes/authRoutes'));
// Route for user profile related endpoints
// app.use('/api/users', require('./src/routes/userRoutes')); // Replaced by authRoutes
// Route for anchor (time block) related endpoints
app.use('/api/anchors', require('./src/routes/anchorRoutes'));
// Route for AI features
app.use('/api/ai', require('./src/routes/aiRoutes'));
// Route for habits
app.use('/api/habits', require('./src/routes/habitRoutes'));

// ==========================================
// Database Connection Setup
// ==========================================

/**
 * Connects to the MongoDB database using Mongoose.
 * Exits the process with failure if connection fails.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4 // Forces IPv4, which fixes ECONNREFUSED on some networks
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// ==========================================
// Basic Health Check Route
// ==========================================

/**
 * Basic health check endpoint to verify if the server is running.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Anchord Backend is running' });
});

// ==========================================
// Server Initialization
// ==========================================

/**
 * Starts the server and attempts to connect to the database.
 * If MONGO_URI is missing, a warning is printed and server runs without DB.
 */
const startServer = async () => {
  if (process.env.MONGO_URI) {
    await connectDB();
  } else {
    console.warn('Warning: MONGO_URI is not set in .env file. Starting server without DB connection.');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Execute the server start function
startServer();
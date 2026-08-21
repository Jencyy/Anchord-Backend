/**
 * Auth Controller
 * Handles all logic related to user authentication.
 * Includes user registration and user login functionalities.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
  // Extract data from the incoming request body
  const { name, email, password, lifeStage } = req.body;

  try {
    // 1. Check if a user with this email already exists in the database
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, send a bad request response
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Create a new user instance if they do not exist
    user = new User({
      name,
      email,
      password,
      lifeStage
    });

    // 3. Hash the user's password before saving it to the database for security
    // Generate a salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hash the plain text password using the generated salt
    user.password = await bcrypt.hash(password, salt);

    // 4. Save the newly created user to the database
    await user.save();

    // 5. Generate a JSON Web Token (JWT) so the user is instantly logged in
    const payload = {
      user: {
        id: user.id // The unique ID given by MongoDB
      }
    };

    // Sign the token using our secret key
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' }, // Token will be valid for 5 days
      (err, token) => {
        if (err) throw err;
        // Respond with the token and user data (excluding password)
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, lifeStage: user.lifeStage } });
      }
    );
  } catch (err) {
    // Catch and log any server errors during registration
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Authenticate an existing user & get a token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  // Extract login credentials from the request body
  const { email, password } = req.body;

  try {
    // 1. Look for the user by their email in the database
    let user = await User.findOne({ email });

    // If the user is not found, return an error
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 2. Compare the provided plain text password with the hashed password stored in the DB
    const isMatch = await bcrypt.compare(password, user.password);

    // If passwords don't match, return an error
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 3. If credentials are correct, generate a JWT token for the user
    const payload = {
      user: {
        id: user.id
      }
    };

    // Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        // Send back the generated token along with the user's basic info
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, lifeStage: user.lifeStage } });
      }
    );
  } catch (err) {
    // Catch and log any server errors during login
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Authenticate with Google
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // 1. Check if user exists
    let user = await User.findOne({ email });

    // 2. If user doesn't exist, create a new one
    if (!user) {
      // Generate a highly secure random password since they use Google to login
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name,
        email,
        password: hashedPassword,
        lifeStage: 'Working professional' // Default life stage for Google signups
      });

      await user.save();
    }

    // 3. Generate JWT Token
    const jwtPayload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, lifeStage: user.lifeStage } });
      }
    );
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(400).json({ msg: 'Google login failed' });
  }
};

/**
 * @desc    Generate password reset token and send email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'There is no user with that email' });
    }

    // 2. Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 3. Hash the token and set to resetPasswordToken field (saving hashed version in DB is more secure)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 4. Set token expiration (e.g., 1 hour from now)
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds

    await user.save();

    // 5. Create reset URL to send to user
    // Uses FRONTEND_URL from .env so it works on local and live server
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the following link to reset your password: \n\n ${resetUrl}`;
    
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.5;">You are receiving this email because you (or someone else) requested a password reset for your Anchord account.</p>
        <p style="color: #555; line-height: 1.5;">Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">If you did not request this, please ignore this email and your password will remain unchanged. This link is only valid for 1 hour.</p>
      </div>
    `;

    try {
      // 6. Send email
      await sendEmail({
        email: user.email,
        subject: 'Anchord: Password Reset Request',
        message: message,
        html: htmlMessage, // Send the rich HTML version
      });

      res.status(200).json({ msg: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      return res.status(500).json({ msg: 'Email could not be sent' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    // 1. Get hashed token from the raw token provided in URL
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // 2. Find user by token and ensure token has not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // 3. Set the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // 4. Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ msg: 'Password successfully reset' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

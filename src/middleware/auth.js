/**
 * Authentication Middleware
 * This middleware intercepts incoming requests to protected routes.
 * It checks for a valid JSON Web Token (JWT) in the 'x-auth-token' header.
 * If valid, it extracts the user's data and attaches it to the request object (req.user).
 * If missing or invalid, it returns a 401 Unauthorized error.
 */
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Extract the token sent by the client in the request header
  const token = req.header('x-auth-token');

  // If no token is provided in the request, deny access immediately
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Attempt to verify the validity of the token
  try {
    // Decode the token using our secret key defined in environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded user payload to the request object
    // This allows subsequent route handlers to know exactly who is making the request
    req.user = decoded.user;
    
    // Pass control to the next middleware or the actual route handler
    next();
  } catch (err) {
    // If jwt.verify throws an error (e.g., token expired or tampered with), deny access
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

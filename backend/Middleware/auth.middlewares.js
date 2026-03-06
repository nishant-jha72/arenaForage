const asyncHandler = require('../utils/asyncHandler.util');
const ApiError = require('../utils/ApiError.util');
const { verifyToken } = require('../utils/jwtutils');
const User = require('../models/user.models');

// Protect routes - verify JWT token from cookie or header
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  const decoded = await verifyToken(token);

  if (!decoded) {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  if (!user.refreshToken) {
    throw new ApiError(401, 'Session expired, please login again');
  }

  req.user = user;

  next(); // 🔥🔥🔥 THIS WAS MISSING
});


// Optional auth - doesn't throw error if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check cookies first
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // Fallback to header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  }
next();
});

module.exports = {
  protect,
  optionalAuth
};
const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.utils');

const authMiddleware = (req, res, next) => {
    try {
        // Look for token in cookies first, then Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decodedToken;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};

module.exports = authMiddleware; // Direct export
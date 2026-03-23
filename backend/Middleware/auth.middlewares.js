const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.utils');

const authMiddleware = (req, res, next) => {
    try {
        // Look for token in cookies first, then Authorization header
        const token = req.cookies?.accessToken ||
                      req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // ✅ Only set req.user — never set req.admin here
        // Admin middleware sets req.admin using a DIFFERENT token (adminAccessToken)
        // and a DIFFERENT secret (same ACCESS_TOKEN_SECRET but different cookie name)
        req.user = { ...decodedToken, id: Number(decodedToken.id) };

        next();
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};

module.exports = authMiddleware;
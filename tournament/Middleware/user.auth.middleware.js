const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.util');
const axios = require('axios');

// ── Authenticate User ─────────────────────────────────────────────────────────
const userAuthMiddleware = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch user from main service instead of querying MySQL directly
        const response = await axios.get(
            `${process.env.MAIN_SERVICE_URL}/api/internal/users/${decoded.id}`,
            { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
        );

        const user = response.data?.data;
        if (!user) throw new ApiError(401, "User not found");

        if (user.isBanned) {
            throw new ApiError(403, "Your account has been banned.");
        }

        req.user = user;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};

module.exports = userAuthMiddleware;
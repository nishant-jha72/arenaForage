const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.util');
const axios = require('axios');

// ── Authenticate Admin ────────────────────────────────────────────────────────
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const token =
            req.cookies?.adminAccessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (decoded.role !== "admin") {
            throw new ApiError(403, "Access denied. Not an admin token.");
        }

        // Fetch admin from main service instead of querying MySQL directly
        const response = await axios.get(
            `${process.env.MAIN_SERVICE_URL}/api/internal/admins/${decoded.id}`,
            { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
        );

        const admin = response.data?.data;
        if (!admin) throw new ApiError(401, "Admin not found");

        if (admin.isBanned) {
            throw new ApiError(403, "Your account has been banned.");
        }

        req.admin = admin;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};

// ── Require Super Admin Verification ─────────────────────────────────────────
const requireSuperAdminVerification = (req, res, next) => {
    if (req.admin?.superAdminVerified !== "YES") {
        return next(new ApiError(
            403,
            "Your account is pending super admin approval. You cannot perform this action yet."
        ));
    }
    next();
};

module.exports = { adminAuthMiddleware, requireSuperAdminVerification };
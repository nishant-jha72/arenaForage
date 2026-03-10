const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.utils');
const Admin = require('../Models/Admin.model');

// ── Authenticate Admin ────────────────────────────────────────────────────────
// Verifies the adminAccessToken and sets req.admin
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

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            throw new ApiError(401, "Admin not found");
        }

        req.admin = admin;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};

// ── Require Super Admin Verification ─────────────────────────────────────────
// Use this on top of adminAuthMiddleware for action routes
// Admin can login and view profile, but cannot perform any actions
// until a super admin has approved their account
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
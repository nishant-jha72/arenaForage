const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.utils');
const SuperAdmin = require('../Models/SuperAdmin.model');

const superAdminAuthMiddleware = async (req, res, next) => {
    try {
        const token =
            req.cookies?.saAccessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) throw new ApiError(401, "Unauthorized request");

        const decoded = jwt.verify(token, process.env.SUPER_ADMIN_ACCESS_TOKEN_SECRET);

        if (decoded.role !== "superadmin") {
            throw new ApiError(403, "Access denied. Not a super admin token.");
        }

        const superAdmin = await SuperAdmin.findById(decoded.id);
        if (!superAdmin) throw new ApiError(401, "Super admin not found");

        req.superAdmin = superAdmin;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};
module.exports = superAdminAuthMiddleware;
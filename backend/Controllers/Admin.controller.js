const Admin = require("../Models/Admin.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const uploadOnCloudinary = require("../Utils/cloudinary.utils");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateAccessAndRefreshTokens = (adminId) => {
    const accessToken = jwt.sign(
        { id: adminId, role: "admin" },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { id: adminId, role: "admin" },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
};

const getCloudinaryPublicId = (url) => {
    if (!url) return null;
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    let startIndex = uploadIndex + 1;
    if (/^v\d+$/.test(parts[startIndex])) startIndex++;
    return parts.slice(startIndex).join("/").replace(/\.[^/.]+$/, "");
};

const sendEmail = async ({ to, subject, text }) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};

// Strip all sensitive fields before sending to client
// 🔥 FIXED sanitizeAdmin (CORE FIX)
const sanitizeAdmin = (admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    profile_picture: admin.profile_picture,
    organization_name: admin.organization_name,
    phone_number: admin.phone_number,
    instagram: admin.instagram,
    twitter: admin.twitter,
    facebook: admin.facebook,
    linkedin: admin.linkedin,

    // ✅ ALWAYS BOOLEAN
    emailVerified: Boolean(Number(admin.emailVerified)),
    superAdminVerified: Boolean(Number(admin.superAdminVerified)),

    tournaments_organised: admin.tournaments_organised,
    revenue: admin.revenue,
    created_at: admin.created_at,
});

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};

// ─── Controller ───────────────────────────────────────────────────────────────

const adminController = {

    // ── REGISTER ──────────────────────────────────────────────────────────────
    // POST /api/admin/register
    register: async (req, res, next) => {
        try {
            const {
                name, email, password,
                organizationName, phoneNumber,
                instagram, twitter, facebook, linkedin
            } = req.body;

            if ([name, email, password].some((f) => !f?.trim())) {
                throw new ApiError(400, "Name, email and password are required");
            }

            const existingAdmin = await Admin.findByEmail(email);
            if (existingAdmin) {
                throw new ApiError(409, "An admin with this email already exists");
            }

            const profilePictureLocalPath = req.file?.path;
            if (!profilePictureLocalPath) {
                throw new ApiError(400, "Profile picture is required");
            }

            const cloudResponse = await uploadOnCloudinary(profilePictureLocalPath);
            if (!cloudResponse) {
                throw new ApiError(400, "Failed to upload profile picture");
            }

            const verificationToken = crypto.randomBytes(32).toString("hex");
            const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

            const result = await Admin.create({
                name,
                email,
                password,
                profilePicture: cloudResponse.url,
                organizationName,
                phoneNumber,
                instagram,
                twitter,
                facebook,
                linkedin,
                verificationToken,
                verificationExpiry,
            });

            const verifyUrl = `${process.env.CLIENT_URL}/api/admin/verify-email?token=${verificationToken}&id=${result.insertId}`;
            await sendEmail({
                to: email,
                subject: "Verify your admin account",
                text: `Hello ${name},\n\nVerify your admin email by clicking the link below (valid 24 hours):\n\n${verifyUrl}\n\nAfter verification, your account will need to be approved by a super admin before you can perform any actions.\n\nIf you did not sign up, ignore this email.`,
            });

            return res.status(201).json(
                new ApiResponse(
                    201,
                    { adminId: result.insertId },
                    "Admin registered successfully. Check your email to verify your account."
                )
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── VERIFY EMAIL ──────────────────────────────────────────────────────────
    // GET /api/admin/verify-email?token=&id=
    verifyEmail: async (req, res, next) => {
        try {
            const { token, id } = req.query;

            if (!token || !id) {
                throw new ApiError(400, "Verification token and admin ID are required");
            }

            const admin = await Admin.findById(id);
            if (!admin) {
                throw new ApiError(404, "Admin not found");
            }

            if (admin.emailVerified === "YES") {
                return res.status(200).json(new ApiResponse(200, {}, "Email already verified. You can log in."));
            }

            if (
                admin.verificationToken !== token ||
                !admin.verificationExpiry ||
                new Date(admin.verificationExpiry) < new Date()
            ) {
                throw new ApiError(400, "Invalid or expired verification token");
            }

            await Admin.verifyEmail(id);

            return res.status(200).json(
                new ApiResponse(200, {}, "Email verified successfully. You can now log in. Note: You need super admin approval before performing any actions.")
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    // POST /api/admin/login
    // Admin can login regardless of superAdminVerified status
    // The superAdminVerified flag is checked at the middleware level per route
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email?.trim() || !password?.trim()) {
                throw new ApiError(400, "Email and password are required");
            }

            const admin = await Admin.findByEmail(email);
            if (!admin || !(await Admin.comparePassword(password, admin.password))) {
                throw new ApiError(401, "Invalid email or password");
            }

            if (admin.emailVerified !== "1") {
                throw new ApiError(403, "Please verify your email before logging in");
            }
            const { accessToken, refreshToken } = generateAccessAndRefreshTokens(admin.id);
await Admin.update(admin.id, { refreshToken });

const sanitized = sanitizeAdmin(admin);

const message = sanitized.superAdminVerified
    ? "Login successful"
    : "Login successful. Your account is pending super admin approval.";

return res
    .status(200)
    .cookie("adminAccessToken", accessToken, cookieOptions)
    .cookie("adminRefreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, {
        admin: sanitized,
        accessToken,
        isVerifiedBySuperAdmin: sanitized.superAdminVerified,
    }, message));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    // POST /api/admin/logout  (protected)
    logout: async (req, res, next) => {
        try {
            if (req.admin?.id) {
                await Admin.update(req.admin.id, { refreshToken: null });
            }
            return res
                .status(200)
                .clearCookie("adminAccessToken", cookieOptions)
                .clearCookie("adminRefreshToken", cookieOptions)
                .json(new ApiResponse(200, {}, "Logged out successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── REFRESH ACCESS TOKEN ──────────────────────────────────────────────────
    // POST /api/admin/refresh-token
    refreshAccessToken: async (req, res, next) => {
        try {
            const incomingRefreshToken =
                req.cookies?.adminRefreshToken || req.body?.refreshToken;

            if (!incomingRefreshToken) {
                throw new ApiError(401, "Refresh token is missing");
            }

            let decoded;
            try {
                decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
            } catch {
                throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
            }

            if (decoded.role !== "admin") {
                throw new ApiError(403, "Invalid token role");
            }

            const admin = await Admin.findById(decoded.id);
            if (!admin) {
                throw new ApiError(401, "Admin not found");
            }

            if (admin.refreshToken !== incomingRefreshToken) {
                throw new ApiError(401, "Refresh token has been revoked. Please log in again.");
            }

            const { accessToken, refreshToken: newRefreshToken } =
                generateAccessAndRefreshTokens(admin.id);

            await Admin.update(admin.id, { refreshToken: newRefreshToken });

            return res
                .status(200)
                .cookie("adminAccessToken", accessToken, cookieOptions)
                .cookie("adminRefreshToken", newRefreshToken, cookieOptions)
                .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET PROFILE ───────────────────────────────────────────────────────────
    // GET /api/admin/profile  (protected)
    getProfile: async (req, res, next) => {
        try {
            const admin = await Admin.findById(req.admin.id);
            if (!admin) {
                throw new ApiError(404, "Admin not found");
            }
            // console.log("Fetched admin profile:", sanitizeAdmin(admin)); // Debug log
            return res
                .status(200)
                .json(new ApiResponse(200, { admin: sanitizeAdmin(admin) }, "Profile fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── UPDATE PROFILE ────────────────────────────────────────────────────────
    // PATCH /api/admin/profile  (protected + superAdminVerified)
    updateProfile: async (req, res, next) => {
        try {
            const adminId = req.admin.id;
            const updates = {};

            const allowedFields = [
                "name", "organizationName", "phoneNumber",
                "instagram", "twitter", "facebook", "linkedin"
            ];

            // Map camelCase body fields to snake_case DB columns
            const fieldMap = {
                name:             "name",
                organizationName: "organization_name",
                phoneNumber:      "phone_number",
                instagram:        "instagram",
                twitter:          "twitter",
                facebook:         "facebook",
                linkedin:         "linkedin",
            };

            for (const field of allowedFields) {
                if (req.body[field]?.trim()) {
                    updates[fieldMap[field]] = req.body[field].trim();
                }
            }

            // Handle new profile picture
            if (req.file?.path) {
                const existingAdmin = await Admin.findById(adminId);
                if (existingAdmin?.profile_picture) {
                    const oldPublicId = getCloudinaryPublicId(existingAdmin.profile_picture);
                    if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId);
                }

                const cloudResponse = await uploadOnCloudinary(req.file.path);
                if (!cloudResponse) {
                    throw new ApiError(400, "Failed to upload new profile picture");
                }
                updates.profile_picture = cloudResponse.url;
            }

            if (Object.keys(updates).length === 0) {
                throw new ApiError(400, "No valid fields provided to update");
            }

            await Admin.update(adminId, updates);

            const updatedAdmin = await Admin.findById(adminId);
            return res
                .status(200)
                .json(new ApiResponse(200, { admin: sanitizeAdmin(updatedAdmin) }, "Profile updated successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
    // PATCH /api/admin/change-password  (protected + superAdminVerified)
    changePassword: async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword?.trim() || !newPassword?.trim()) {
                throw new ApiError(400, "Current password and new password are required");
            }

            if (currentPassword === newPassword) {
                throw new ApiError(400, "New password must be different from current password");
            }

            const admin = await Admin.findById(req.admin.id);
            if (!admin) throw new ApiError(404, "Admin not found");

            const isMatch = await Admin.comparePassword(currentPassword, admin.password);
            if (!isMatch) throw new ApiError(401, "Current password is incorrect");

            await Admin.updatePassword(req.admin.id, newPassword);

            return res
                .status(200)
                .json(new ApiResponse(200, {}, "Password changed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    // POST /api/admin/forgot-password
    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!email?.trim()) throw new ApiError(400, "Email is required");

            const admin = await Admin.findByEmail(email);
            if (!admin) {
                return res.status(200).json(new ApiResponse(200, {}, "If that email is registered, a reset link has been sent."));
            }

            const resetToken = crypto.randomBytes(32).toString("hex");
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await Admin.update(admin.id, { resetToken, resetExpiry });

            await sendEmail({
                to: email,
                subject: "Admin Password Reset Request",
                text: `You requested a password reset.\n\nUse the details below in Postman:\n\nPOST ${process.env.CLIENT_URL}/api/admin/reset-password\nBody (JSON):\n{\n  "token": "${resetToken}",\n  "id": "${admin.id}",\n  "newPassword": "yourNewPassword"\n}\n\nExpires in 1 hour. If you didn't request this, ignore this email.`,
            });

            return res.status(200).json(new ApiResponse(200, {}, "If that email is registered, a reset link has been sent."));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── RESET PASSWORD ────────────────────────────────────────────────────────
    // POST /api/admin/reset-password
    resetPassword: async (req, res, next) => {
        try {
            const { token, id, newPassword } = req.body;

            if (!token || !id || !newPassword?.trim()) {
                throw new ApiError(400, "Token, admin ID and new password are all required");
            }

            const admin = await Admin.findById(id);
            if (!admin) throw new ApiError(404, "Admin not found");

            if (
                admin.resetToken !== token ||
                !admin.resetExpiry ||
                new Date(admin.resetExpiry) < new Date()
            ) {
                throw new ApiError(400, "Invalid or expired password reset token");
            }

            await Admin.updatePassword(id, newPassword);

            return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully. You can now log in."));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── DELETE ACCOUNT ────────────────────────────────────────────────────────
    // DELETE /api/admin/account  (protected + superAdminVerified)
    deleteAccount: async (req, res, next) => {
        try {
            const adminId = req.admin?.id;
            if (!adminId) throw new ApiError(401, "Unauthorized");

            const admin = await Admin.findById(adminId);
            if (!admin) throw new ApiError(404, "Admin not found");

            if (admin.profile_picture) {
                const publicId = getCloudinaryPublicId(admin.profile_picture);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }

            await Admin.deleteById(adminId);

            return res
                .status(200)
                .clearCookie("adminAccessToken", cookieOptions)
                .clearCookie("adminRefreshToken", cookieOptions)
                .json(new ApiResponse(200, {}, "Admin account deleted successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = adminController;
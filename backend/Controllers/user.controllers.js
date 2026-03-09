const User = require("../Models/user.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const uploadOnCloudinary = require("../Utils/cloudinary.utils");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateAccessAndRefreshTokens = async (userId) => {
    const accessToken = jwt.sign(
        { id: userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { id: userId },
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
    const pathWithExt = parts.slice(startIndex).join("/");
    return pathWithExt.replace(/\.[^/.]+$/, "");
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

// Strip sensitive fields before sending user data to client
const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    age: user.age,
    gmail: user.gmail,
    profile_picture: user.profile_picture,
    emailVerified: user.emailVerified,
    created_at: user.created_at,
});

const cookieOptions = { httpOnly: true, secure: true, sameSite: "None" };

// ─── Controller ───────────────────────────────────────────────────────────────

const userController = {

    // ── REGISTER ──────────────────────────────────────────────────────────────
    register: async (req, res, next) => {
        try {
            const { name, age, gmail, password } = req.body;

            if ([name, gmail, password].some((f) => !f?.trim())) {
                throw new ApiError(400, "All fields (Name, Gmail, Password) are required");
            }

            const existedUser = await User.findByEmail(gmail);
            if (existedUser) {
                throw new ApiError(409, "User with this email already exists");
            }

            const profilePictureLocalPath = req.file?.path;
            if (!profilePictureLocalPath) {
                throw new ApiError(400, "Profile picture is required");
            }

            const cloudResponse = await uploadOnCloudinary(profilePictureLocalPath);
            if (!cloudResponse) {
                throw new ApiError(400, "Failed to upload image to Cloudinary");
            }

            const verificationToken = crypto.randomBytes(32).toString("hex");
            const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

            const result = await User.create(
                name,
                age,
                gmail,
                cloudResponse.url,
                password,
                verificationToken,
                verificationExpiry
            );

            const verifyUrl = `${process.env.CLIENT_URL}/api/users/verify-email?token=${verificationToken}&id=${result.insertId}`;
            await sendEmail({
                to: gmail,
                subject: "Verify your email address",
                text: `Hello ${name},\n\nVerify your email by clicking the link below (valid 24 hours):\n\n${verifyUrl}\n\nIf you did not sign up, ignore this email.`,
            });

            return res.status(201).json(
                new ApiResponse(201, { userId: result.insertId }, "Registered successfully. Check your email to verify your account.")
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── VERIFY EMAIL ──────────────────────────────────────────────────────────
    verifyEmail: async (req, res, next) => {
        try {
            const { token, id } = req.query;

            if (!token || !id) {
                throw new ApiError(400, "Verification token and user ID are required");
            }

            const user = await User.findById(id);
            if (!user) {
                throw new ApiError(404, "User not found");
            }

            if (user.emailVerified === "YES") {
                return res.status(200).json(new ApiResponse(200, {}, "Email already verified. You can log in."));
            }

            if (
                user.verificationToken !== token ||
                !user.verificationExpiry ||
                new Date(user.verificationExpiry) < new Date()
            ) {
                throw new ApiError(400, "Invalid or expired verification token");
            }

            await User.verifyEmail(id);

            return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully. You can now log in."));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    login: async (req, res, next) => {
        try {
            const { gmail, password } = req.body;

            const user = await User.findByEmail(gmail);
            if (!user || !(await User.comparePassword(password, user.password))) {
                throw new ApiError(401, "Invalid email or password");
            }

            if (user.emailVerified !== "YES") {
                throw new ApiError(403, "Please verify your email before logging in");
            }

            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
            await User.update(user.id, { refreshToken });

            return res
                .status(200)
                .cookie("accessToken", accessToken, cookieOptions)
                .cookie("refreshToken", refreshToken, cookieOptions)
                .json(new ApiResponse(200, { user: sanitizeUser(user) }, "Login successful"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    logout: async (req, res, next) => {
        try {
            if (req.user?.id) {
                await User.update(req.user.id, { refreshToken: null });
            }
            return res
                .status(200)
                .clearCookie("accessToken", cookieOptions)
                .clearCookie("refreshToken", cookieOptions)
                .json(new ApiResponse(200, {}, "Logged out successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── REFRESH ACCESS TOKEN ──────────────────────────────────────────────────
    refreshAccessToken: async (req, res, next) => {
        try {
            const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

            if (!incomingRefreshToken) {
                throw new ApiError(401, "Refresh token is missing");
            }

            let decoded;
            try {
                decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
            } catch {
                throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
            }

            const user = await User.findById(decoded.id);
            if (!user) {
                throw new ApiError(401, "User not found");
            }

            if (user.refreshToken !== incomingRefreshToken) {
                throw new ApiError(401, "Refresh token has been revoked. Please log in again.");
            }

            const { accessToken, refreshToken: newRefreshToken } =
                await generateAccessAndRefreshTokens(user.id);

            await User.update(user.id, { refreshToken: newRefreshToken });

            return res
                .status(200)
                .cookie("accessToken", accessToken, cookieOptions)
                .cookie("refreshToken", newRefreshToken, cookieOptions)
                .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET PROFILE ───────────────────────────────────────────────────────────
    // GET /api/users/profile  (protected)
    getProfile: async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                throw new ApiError(404, "User not found");
            }

            return res
                .status(200)
                .json(new ApiResponse(200, { user: sanitizeUser(user) }, "Profile fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── UPDATE PROFILE ────────────────────────────────────────────────────────
    // PATCH /api/users/profile  (protected)
    // Allows updating name, age, and/or profile picture
    updateProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const updates = {};

            if (req.body.name?.trim())  updates.name = req.body.name.trim();
            if (req.body.age)           updates.age  = req.body.age;

            // Handle new profile picture upload
            if (req.file?.path) {
                // Delete old image from Cloudinary first
                const existingUser = await User.findById(userId);
                if (existingUser?.profile_picture) {
                    const oldPublicId = getCloudinaryPublicId(existingUser.profile_picture);
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

            await User.update(userId, updates);

            const updatedUser = await User.findById(userId);
            return res
                .status(200)
                .json(new ApiResponse(200, { user: sanitizeUser(updatedUser) }, "Profile updated successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
    // PATCH /api/users/change-password  (protected)
    changePassword: async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword?.trim() || !newPassword?.trim()) {
                throw new ApiError(400, "Current password and new password are required");
            }

            if (currentPassword === newPassword) {
                throw new ApiError(400, "New password must be different from current password");
            }

            const user = await User.findById(req.user.id);
            if (!user) {
                throw new ApiError(404, "User not found");
            }

            const isMatch = await User.comparePassword(currentPassword, user.password);
            if (!isMatch) {
                throw new ApiError(401, "Current password is incorrect");
            }

            await User.updatePassword(req.user.id, newPassword);

            return res
                .status(200)
                .json(new ApiResponse(200, {}, "Password changed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    forgotPassword: async (req, res, next) => {
        try {
            const { gmail } = req.body;
            if (!gmail?.trim()) {
                throw new ApiError(400, "Email is required");
            }

            const user = await User.findByEmail(gmail);
            if (!user) {
                return res.status(200).json(new ApiResponse(200, {}, "If that email is registered, a reset link has been sent."));
            }

            const resetToken = crypto.randomBytes(32).toString("hex");
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await User.update(user.id, { resetToken, resetExpiry });

            await sendEmail({
                to: gmail,
                subject: "Password Reset Request",
                text: `You requested a password reset.\n\nUse the details below in Postman:\n\nPOST ${process.env.CLIENT_URL}/api/users/reset-password\nBody (JSON):\n{\n  "token": "${resetToken}",\n  "id": "${user.id}",\n  "newPassword": "yourNewPassword"\n}\n\nExpires in 1 hour. If you didn't request this, ignore this email.`,
            });

            return res.status(200).json(new ApiResponse(200, {}, "If that email is registered, a reset link has been sent."));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── RESET PASSWORD ────────────────────────────────────────────────────────
    resetPassword: async (req, res, next) => {
        try {
            const { token, id, newPassword } = req.body;

            if (!token || !id || !newPassword?.trim()) {
                throw new ApiError(400, "Token, user ID, and new password are all required");
            }

            const user = await User.findById(id);
            if (!user) {
                throw new ApiError(404, "User not found");
            }

            if (
                user.resetToken !== token ||
                !user.resetExpiry ||
                new Date(user.resetExpiry) < new Date()
            ) {
                throw new ApiError(400, "Invalid or expired password reset token");
            }

            await User.updatePassword(id, newPassword);

            return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully. You can now log in."));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── DELETE ACCOUNT ────────────────────────────────────────────────────────
    deleteAccount: async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ApiError(401, "Unauthorized");

            const user = await User.findById(userId);
            if (!user) throw new ApiError(404, "User not found");

            if (user.profile_picture) {
                const publicId = getCloudinaryPublicId(user.profile_picture);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }

            await User.deleteById(userId);

            return res
                .status(200)
                .clearCookie("accessToken", cookieOptions)
                .clearCookie("refreshToken", cookieOptions)
                .json(new ApiResponse(200, {}, "Account deleted successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = userController;
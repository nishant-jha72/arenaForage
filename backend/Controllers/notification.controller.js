const Notification = require("../Models/notification.model");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const nodemailer = require("nodemailer");

// ─── Email Helper ─────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, text }) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};
const getRequester = (req) => {
    if (req.admin?.id) return { userId: Number(req.admin.id), userType: "admin" };
    if (req.user?.id)  return { userId: Number(req.user.id),  userType: "user"  };
    return { userId: null, userType: null };
};

// ─── Notification Helper (used by other controllers internally) ───────────────
// Call this from tournament service callbacks or any controller that needs
// to notify users/admins
const createAndEmailNotification = async ({
    userId, userType, email, title, message, type
}) => {
    // Store in DB
    await Notification.create({ userId, userType, title, message, type });

    // Send email
    if (email) {
        try {
            await sendEmail({ to: email, subject: title, text: message });
        } catch (err) {
            console.error("Email notification failed:", err.message);
        }
    }
};

// ─── Controller ───────────────────────────────────────────────────────────────
const notificationController = {

   
    // GET /api/notifications  (user)
    // GET /api/admin/notifications  (admin)
    getMyNotifications: async (req, res, next) => {
        try {
            const { userId, userType } = getRequester(req);
            const { page = 1, limit = 20 } = req.query;

            const data = await Notification.getByUser(userId, userType, {
                page: +page,
                limit: +limit,
            });

            return res.status(200).json(new ApiResponse(200, data, "Notifications fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // GET /api/notifications/unread-count
    getUnreadCount: async (req, res, next) => {
        try {
            const { userId, userType } = getRequester(req);
            const count = await Notification.getUnreadCount(userId, userType);
            return res.status(200).json(new ApiResponse(200, { count }, "Unread count fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/notifications/:id/read
    markAsRead: async (req, res, next) => {
        try {
            const { userId, userType } = getRequester(req);
            await Notification.markAsRead(req.params.id, userId, userType);
            return res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/notifications/read-all
    markAllAsRead: async (req, res, next) => {
        try {
            const { userId, userType } = getRequester(req);
            const count = await Notification.markAllAsRead(userId, userType);
            return res.status(200).json(new ApiResponse(200, { count }, `${count} notifications marked as read`));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // DELETE /api/notifications/:id
    deleteNotification: async (req, res, next) => {
        try {
            const { userId, userType } = getRequester(req);
            await Notification.deleteById(req.params.id, userId);
            return res.status(200).json(new ApiResponse(200, {}, "Notification deleted"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = { notificationController, createAndEmailNotification };
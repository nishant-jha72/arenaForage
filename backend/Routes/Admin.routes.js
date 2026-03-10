const express = require('express');
const router = express.Router();

const adminController = require('../Controllers/Admin.controller');
const analyticsController = require('../Controllers/analytics.controller');
const { notificationController } = require('../Controllers/notification.controller');
const upload = require('../Middleware/multer.middlewares');
const { adminAuthMiddleware, requireSuperAdminVerification } = require('../Middleware/Admin.auth.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register',        upload.single('profilePicture'), adminController.register);
router.get('/verify-email',     adminController.verifyEmail);
router.post('/login',           adminController.login);
router.post('/refresh-token',   adminController.refreshAccessToken);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password',  adminController.resetPassword);

// ── Protected: login only ─────────────────────────────────────────────────────
router.post('/logout',          adminAuthMiddleware, adminController.logout);
router.get('/profile',          adminAuthMiddleware, adminController.getProfile);
router.get('/notifications',                adminAuthMiddleware, notificationController.getMyNotifications);
router.get('/notifications/unread-count',   adminAuthMiddleware, notificationController.getUnreadCount);
router.patch('/notifications/read-all',     adminAuthMiddleware, notificationController.markAllAsRead);
router.patch('/notifications/:id/read',     adminAuthMiddleware, notificationController.markAsRead);
router.delete('/notifications/:id',         adminAuthMiddleware, notificationController.deleteNotification);

// ── Protected: requires super admin approval ──────────────────────────────────
router.patch('/profile',        upload.single('profilePicture'), adminAuthMiddleware, requireSuperAdminVerification, adminController.updateProfile);
router.patch('/change-password',adminAuthMiddleware, requireSuperAdminVerification, adminController.changePassword);
router.delete('/account',       adminAuthMiddleware, requireSuperAdminVerification, adminController.deleteAccount);
router.get('/analytics',        adminAuthMiddleware, requireSuperAdminVerification, analyticsController.getAdminAnalytics);

module.exports = router;
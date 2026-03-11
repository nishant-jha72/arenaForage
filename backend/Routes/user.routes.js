const express = require('express');
const router = express.Router();

const userController = require('../Controllers/user.controllers');
const profileController = require('../Controllers/profile.controller');
const { notificationController } = require('../Controllers/notification.controller');
const upload = require('../Middleware/multer.middlewares');
const authMiddleware = require('../Middleware/auth.middlewares');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register',         upload.single('profilePicture'), userController.register); // Done
router.get('/verify-email',      userController.verifyEmail); // Done
router.post('/login',            userController.login); //Done
router.post('/refresh-token',    userController.refreshAccessToken); 
router.post('/forgot-password',  userController.forgotPassword);
router.post('/reset-password',   userController.resetPassword);

// Public profile (anyone can view)
router.get('/profile/public/:id', profileController.getPublicProfile);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.post('/logout',                                         authMiddleware, userController.logout);
router.get('/profile',                                         authMiddleware, userController.getProfile);
router.get('/profile/full',                                    authMiddleware, profileController.getFullProfile);
router.patch('/update-profile',          upload.single('profilePicture'), authMiddleware, userController.updateProfile);
router.patch('/change-password',                               authMiddleware, userController.changePassword);
router.delete('/delete-account',                                      authMiddleware, userController.deleteAccount);

// Notification routes
router.get('/notifications',                authMiddleware, notificationController.getMyNotifications);
router.get('/notifications/unread-count',   authMiddleware, notificationController.getUnreadCount);
router.patch('/notifications/read-all',     authMiddleware, notificationController.markAllAsRead);
router.patch('/notifications/:id/read',     authMiddleware, notificationController.markAsRead);
router.delete('/notifications/:id',         authMiddleware, notificationController.deleteNotification);

module.exports = router;
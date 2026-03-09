const express = require('express');
const router = express.Router();

const adminController = require('../Controllers/Admin.controller');
const upload = require('../Middleware/multer.middlewares');
const { adminAuthMiddleware, requireSuperAdminVerification } = require('../Middleware/Admin.auth.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register',        upload.single('profilePicture'), adminController.register);
router.get('/verify-email',     adminController.verifyEmail);
router.post('/login',           adminController.login);
router.post('/refresh-token',   adminController.refreshAccessToken);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password',  adminController.resetPassword);

// ── Protected: login only (no super admin check) ──────────────────────────────
// Admin can access these even if not verified by super admin
router.post('/logout',          adminAuthMiddleware, adminController.logout);
router.get('/profile',          adminAuthMiddleware, adminController.getProfile);

// ── Protected: requires super admin approval ──────────────────────────────────
// These routes are blocked until super admin verifies the admin account
router.patch('/profile',        upload.single('profilePicture'), adminAuthMiddleware, requireSuperAdminVerification, adminController.updateProfile);
router.patch('/change-password',adminAuthMiddleware, requireSuperAdminVerification, adminController.changePassword);
router.delete('/account',       adminAuthMiddleware, requireSuperAdminVerification, adminController.deleteAccount);

module.exports = router;
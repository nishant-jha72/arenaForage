const express = require('express');
const router = express.Router();

const userController = require('../Controllers/user.controllers');
const upload = require('../Middleware/multer.middlewares');
const authMiddleware = require('../Middleware/auth.middlewares');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register',         upload.single('profilePicture'), userController.register);
router.get('/verify-email',      userController.verifyEmail);
router.post('/login',            userController.login);
router.post('/refresh-token',    userController.refreshAccessToken);
router.post('/forgot-password',  userController.forgotPassword);
router.post('/reset-password',   userController.resetPassword);

// ── Protected Routes (valid access token required) ────────────────────────────
router.post('/logout',                                        authMiddleware, userController.logout);
router.get('/profile',                                        authMiddleware, userController.getProfile);
router.patch('/profile',         upload.single('profilePicture'), authMiddleware, userController.updateProfile);
router.patch('/change-password',                              authMiddleware, userController.changePassword);
router.delete('/account',                                     authMiddleware, userController.deleteAccount);

module.exports = router;
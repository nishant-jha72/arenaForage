const express = require('express');
const router = express.Router();

const superAdminController = require('../Controllers/SuperAdmin.controller');
const analyticsController = require('../Controllers/analytics.controller');
const superAdminAuthMiddleware = require('../Middleware/SuperAdmin.auth.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/login',         superAdminController.login);
router.post('/refresh-token', superAdminController.refreshAccessToken);
router.post('/create',        superAdminController.create);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.use(superAdminAuthMiddleware);

// Own profile
router.get('/profile',              superAdminController.getProfile);
router.patch('/change-password',    superAdminController.changePassword);
router.post('/logout',              superAdminController.logout);

// Dashboard + Analytics
router.get('/dashboard',            superAdminController.getDashboard);
router.get('/analytics',            analyticsController.getSuperAdminAnalytics);
router.get('/commission',           superAdminController.getCommissionReport);

// Super admin management
router.get('/all',                  superAdminController.getAllSuperAdmins);
router.delete('/:id',               superAdminController.deleteSuperAdmin);

// User management
router.get('/users',                superAdminController.getAllUsers);
router.get('/users/:id',            superAdminController.getUserById);
router.delete('/users/:id',         superAdminController.deleteUser);
router.patch('/users/:id/ban',      superAdminController.banUser);
router.patch('/users/:id/unban',    superAdminController.unbanUser);

// Admin management
router.get('/admins',               superAdminController.getAllAdmins);
router.get('/admins/:id',           superAdminController.getAdminById);
router.patch('/admins/:id/approve', superAdminController.approveAdmin);
router.patch('/admins/:id/revoke',  superAdminController.revokeAdmin);
router.patch('/admins/:id/ban',     superAdminController.banAdmin);
router.patch('/admins/:id/unban',   superAdminController.unbanAdmin);
router.delete('/admins/:id',        superAdminController.deleteAdmin);

// Tournament stats
router.get('/tournaments/stats',    superAdminController.getTournamentStats);
router.get('/tournaments/today',    superAdminController.getTodayTournaments);
router.get('/tournaments/upcoming', superAdminController.getUpcomingTournaments);

module.exports = router;
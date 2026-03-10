// This file belongs to your MAIN backend service (arenaForage/backend)
// Add to Routes/internal.routes.js
// Register in server.js: app.use('/api/internal', internalRoutes);

const express = require('express');
const router = express.Router();
const Admin = require('../Models/admin.model');
const User = require('../Models/user.model');

// ── Internal Auth ─────────────────────────────────────────────────────────────
// Only requests from tournament service with shared secret are allowed
const internalAuth = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_SECRET) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
};

// ── Get User by ID ────────────────────────────────────────────────────────────
// Called by tournament service to verify user exists + check ban status
router.get('/users/:id', internalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            success: true,
            data: {
                id:            user.id,
                name:          user.name,
                gmail:         user.gmail,
                emailVerified: user.emailVerified,
                isBanned:      user.isBanned,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Get Admin by ID ───────────────────────────────────────────────────────────
// Called by tournament service admin auth middleware
router.get('/admins/:id', internalAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

        res.json({
            success: true,
            data: {
                id:                 admin.id,
                name:               admin.name,
                email:              admin.email,
                superAdminVerified: admin.superAdminVerified,
                isBanned:           admin.isBanned,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Update Admin Tournament Record ────────────────────────────────────────────
// Called by tournament service after tournament completes
router.post('/admin/record-tournament', internalAuth, async (req, res) => {
    try {
        const { adminId, revenueEarned } = req.body;
        await Admin.recordTournament(adminId, revenueEarned);
        res.json({ success: true, message: "Admin record updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
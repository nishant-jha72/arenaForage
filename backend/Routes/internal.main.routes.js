// arenaForage/backend/Routes/internal.routes.js

const express = require('express');
const router = express.Router();
const Admin = require('../Models/Admin.model');
const User = require('../Models/user.model');
const Notification = require('../Models/notification.model');

const internalAuth = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_SECRET) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
};

// ── Get User by ID ────────────────────────────────────────────────────────────
router.get('/users/:id', internalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data: { id: user.id, name: user.name, gmail: user.gmail, emailVerified: user.emailVerified, isBanned: user.isBanned } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Get Admin by ID ───────────────────────────────────────────────────────────
router.get('/admins/:id', internalAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        res.json({ success: true, data: { id: admin.id, name: admin.name, email: admin.email, superAdminVerified: admin.superAdminVerified, isBanned: admin.isBanned } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Update Admin Tournament Record ────────────────────────────────────────────
router.post('/admin/record-tournament', internalAuth, async (req, res) => {
    try {
        const { adminId, revenueEarned } = req.body;
        await Admin.recordTournament(adminId, revenueEarned);
        res.json({ success: true, message: "Admin record updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Create Notification (called by tournament service) ────────────────────────
router.post('/notify', internalAuth, async (req, res) => {
    try {
        const { userId, userType, title, message, type, email } = req.body;

        // Store in DB
        await Notification.create({ userId, userType, title, message, type });

        // Send email if provided
        if (email) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: title,
                text: message,
            });
        }

        res.json({ success: true, message: "Notification sent" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
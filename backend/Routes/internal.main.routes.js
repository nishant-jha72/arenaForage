// Add this file to your MAIN MySQL service as Routes/internal.routes.js
// Then register it in server.js: app.use('/api/internal', internalRoutes);

const express = require('express');
const router = express.Router();
const Admin = require('../Models/admin.model');
const User = require('../Models/user.model');

// Internal auth — only tournament service can call these
const internalAuth = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_SECRET) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
};

// Called by tournament service after tournament completes
// Updates admin's tournaments_organised count and revenue
router.post('/admin/record-tournament', internalAuth, async (req, res) => {
    try {
        const { adminId, revenueEarned } = req.body;
        await Admin.recordTournament(adminId, revenueEarned);
        res.json({ success: true, message: "Admin record updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Called by tournament service to verify a user exists before adding to team
router.get('/users/:id', internalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data: { id: user.id, name: user.name, gmail: user.gmail } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
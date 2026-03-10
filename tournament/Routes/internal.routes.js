// Internal routes for tournament service
// These are called by the main backend service only
// File: arenaForage/tournament/Routes/internal.routes.js

const express = require('express');
const router = express.Router();
const Tournament = require('../Model/Tournament.model');
const Team = require('../Model/Team.model');

const internalAuth = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_SECRET) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
};

// ── Tournament Stats (for super admin dashboard) ──────────────────────────────
router.get('/tournament-stats', internalAuth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const [total, live, upcoming, todayCount] = await Promise.all([
            Tournament.countDocuments(),
            Tournament.countDocuments({ status: 'live' }),
            Tournament.countDocuments({ status: 'registration_open' }),
            Tournament.countDocuments({
                'schedule.start_date': {
                    $gte: new Date(today),
                    $lt:  new Date(new Date(today).getTime() + 86400000)
                }
            }),
        ]);
        res.json({ success: true, data: { total, live, upcoming, today: todayCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Player Tournament History ─────────────────────────────────────────────────
router.get('/players/:userId/history', internalAuth, async (req, res) => {
    try {
        const userId = +req.params.userId;
        const teams = await Team.find({ "members.user_id": userId });
        const history = teams.flatMap(t => t.tournament_history || []);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Player Current Team ───────────────────────────────────────────────────────
router.get('/players/:userId/team', internalAuth, async (req, res) => {
    try {
        const userId = +req.params.userId;
        const team = await Team.findOne({ "members.user_id": userId, is_active: true });
        res.json({ success: true, data: team || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Admin Revenue Over Time ───────────────────────────────────────────────────
router.get('/analytics/admin/:adminId/revenue', internalAuth, async (req, res) => {
    try {
        const adminId = +req.params.adminId;
        const revenue = await Tournament.aggregate([
            { $match: { admin_id: adminId, status: "completed" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } },
                    revenue: {
                        $sum: {
                            $multiply: [
                                "$registration.entry_fee",
                                "$registration.max_per_team",
                                { $size: { $filter: { input: "$teams", cond: "$$this.is_confirmed" } } }
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 6 },
        ]);
        res.json({ success: true, data: revenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Admin Tournament Breakdown ────────────────────────────────────────────────
router.get('/analytics/admin/:adminId/breakdown', internalAuth, async (req, res) => {
    try {
        const adminId = +req.params.adminId;
        const breakdown = await Tournament.aggregate([
            { $match: { admin_id: adminId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        res.json({ success: true, data: breakdown });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Admin Upcoming Tournaments ────────────────────────────────────────────────
router.get('/analytics/admin/:adminId/upcoming', internalAuth, async (req, res) => {
    try {
        const adminId = +req.params.adminId;
        const upcoming = await Tournament.find({
            admin_id: adminId,
            status: { $in: ["draft", "registration_open", "registration_closed"] }
        })
        .select("title game status schedule registration.entry_fee total_entries")
        .sort({ "schedule.start_date": 1 })
        .limit(5);
        res.json({ success: true, data: upcoming });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
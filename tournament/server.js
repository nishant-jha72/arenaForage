const express = require('express');
const router = express.Router();

const app = express();
// Internal middleware — only requests from main service with shared secret allowed
const internalAuth = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_SECRET) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
};

// Called by main service or super admin to get tournament stats
router.get('/tournament-stats', internalAuth, async (req, res) => {
    try {
        const Tournament = require('../Models/tournament.model');
        const today = new Date().toISOString().split('T')[0];

        const [total, live, upcoming, today_count] = await Promise.all([
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

        res.json({ success: true, data: { total, live, upcoming, today: today_count } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Tournament service running on port ${process.env.PORT || 3000}`);
});

module.exports = router;
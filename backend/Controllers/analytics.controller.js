const db = require("../DB/index");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const axios = require("axios");

const analyticsController = {

    // ── ADMIN DASHBOARD ───────────────────────────────────────────────────────
    // GET /api/admin/analytics
    getAdminAnalytics: async (req, res, next) => {
        try {
            const adminId = req.admin.id;

            // Revenue over last 6 months from tournament service
            let revenueOverTime = [];
            let tournamentBreakdown = [];
            let upcomingTournaments = [];

            try {
                const [revenueRes, breakdownRes, upcomingRes] = await Promise.allSettled([
                    axios.get(
                        `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/analytics/admin/${adminId}/revenue`,
                        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                    ),
                    axios.get(
                        `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/analytics/admin/${adminId}/breakdown`,
                        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                    ),
                    axios.get(
                        `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/analytics/admin/${adminId}/upcoming`,
                        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                    ),
                ]);

                if (revenueRes.status   === "fulfilled") revenueOverTime      = revenueRes.value.data?.data   || [];
                if (breakdownRes.status === "fulfilled") tournamentBreakdown   = breakdownRes.value.data?.data || [];
                if (upcomingRes.status  === "fulfilled") upcomingTournaments   = upcomingRes.value.data?.data  || [];
            } catch (err) {
                console.error("Tournament service error:", err.message);
            }

            // Get admin's own record from MySQL
            const [[adminRecord]] = await db.execute(
                `SELECT tournaments_organised, revenue FROM admins WHERE id = ?`,
                [adminId]
            );

            return res.status(200).json(new ApiResponse(200, {
                summary: {
                    totalTournaments: adminRecord.tournaments_organised || 0,
                    totalRevenue:     adminRecord.revenue || 0,
                },
                revenueOverTime,
                tournamentBreakdown,
                upcomingTournaments,
            }, "Admin analytics fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── SUPER ADMIN DASHBOARD ─────────────────────────────────────────────────
    // GET /api/superadmin/analytics
    getSuperAdminAnalytics: async (req, res, next) => {
        try {
            // Platform-wide stats from MySQL
            const [[userStats]]    = await db.execute(`SELECT COUNT(*) as total, SUM(isBanned) as banned FROM users`);
            const [[adminStats]]   = await db.execute(`SELECT COUNT(*) as total, SUM(isBanned) as banned, SUM(superAdminVerified = 'YES') as verified, SUM(revenue) as totalRevenue, SUM(tournaments_organised) as totalTournaments FROM admins`);

            // New users per month (last 6 months)
            const [userGrowth] = await db.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY month
                ORDER BY month ASC
            `);

            // New admins per month (last 6 months)
            const [adminGrowth] = await db.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count
                FROM admins
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY month
                ORDER BY month ASC
            `);

            // Top admins by revenue
            const [topAdmins] = await db.execute(`
                SELECT id, name, organization_name, tournaments_organised, revenue
                FROM admins
                WHERE superAdminVerified = 'YES'
                ORDER BY revenue DESC
                LIMIT 10
            `);

            // Commission earned (platform's cut)
            const commissionRate = parseFloat(process.env.COMMISSION_RATE || 0.10);
            const totalRevenue   = parseFloat(adminStats[0].totalRevenue || 0);
            const commission     = totalRevenue * commissionRate;

            // Tournament stats from tournament service
            let tournamentStats = {};
            try {
                const res2 = await axios.get(
                    `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/tournament-stats`,
                    { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                );
                tournamentStats = res2.data?.data || {};
            } catch (err) {
                console.error("Tournament service error:", err.message);
            }

            return res.status(200).json(new ApiResponse(200, {
                users: {
                    total:  userStats.total  || 0,
                    banned: userStats.banned || 0,
                    active: (userStats.total || 0) - (userStats.banned || 0),
                    growth: userGrowth,
                },
                admins: {
                    total:           adminStats[0].total            || 0,
                    banned:          adminStats[0].banned           || 0,
                    verified:        adminStats[0].verified         || 0,
                    pendingApproval: (adminStats[0].total || 0) - (adminStats[0].verified || 0),
                    growth:          adminGrowth,
                    topByRevenue:    topAdmins,
                },
                revenue: {
                    total:          totalRevenue,
                    commission,
                    commissionRate: `${commissionRate * 100}%`,
                },
                tournaments: tournamentStats,
            }, "Super admin analytics fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = analyticsController;
const User = require("../Models/user.model");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const axios = require("axios");

const profileController = {

    // ── GET FULL PLAYER PROFILE ───────────────────────────────────────────────
    // GET /api/users/profile/full
    // Returns user info + tournament history + team info from tournament service
    getFullProfile: async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) throw new ApiError(404, "User not found");

            let tournamentHistory = [];
            let teamInfo = null;
            let stats = {
                totalTournaments: 0,
                wins:             0,
                losses:           0,
                winRate:          "0%",
            };

            // Fetch tournament history and team from tournament service
            try {
                const [historyRes, teamRes] = await Promise.allSettled([
                    axios.get(
                        `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/players/${user.id}/history`,
                        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                    ),
                    axios.get(
                        `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/players/${user.id}/team`,
                        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                    ),
                ]);

                if (historyRes.status === "fulfilled") {
                    tournamentHistory = historyRes.value.data?.data || [];
                    stats.totalTournaments = tournamentHistory.length;
                    stats.wins             = tournamentHistory.filter(t => t.result === "win").length;
                    stats.losses           = tournamentHistory.filter(t => t.result === "loss").length;
                    stats.winRate          = stats.totalTournaments > 0
                        ? `${Math.round((stats.wins / stats.totalTournaments) * 100)}%`
                        : "0%";
                }

                if (teamRes.status === "fulfilled") {
                    teamInfo = teamRes.value.data?.data || null;
                }
            } catch (err) {
                console.error("Tournament service unavailable:", err.message);
            }

            return res.status(200).json(new ApiResponse(200, {
                user: {
                    id:              user.id,
                    name:            user.name,
                    age:             user.age,
                    gmail:           user.gmail,
                    profile_picture: user.profile_picture,
                    emailVerified:   user.emailVerified,
                    created_at:      user.created_at,
                },
                stats,
                team:               teamInfo,
                tournamentHistory,
            }, "Full profile fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET PUBLIC PROFILE ────────────────────────────────────────────────────
    // GET /api/users/profile/public/:id
    // Anyone can view a user's public profile
    getPublicProfile: async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) throw new ApiError(404, "User not found");

            let tournamentHistory = [];
            let stats = { totalTournaments: 0, wins: 0, losses: 0, winRate: "0%" };

            try {
                const historyRes = await axios.get(
                    `${process.env.TOURNAMENT_SERVICE_URL}/api/internal/players/${user.id}/history`,
                    { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                );
                tournamentHistory = historyRes.data?.data || [];
                stats.totalTournaments = tournamentHistory.length;
                stats.wins             = tournamentHistory.filter(t => t.result === "win").length;
                stats.losses           = tournamentHistory.filter(t => t.result === "loss").length;
                stats.winRate          = stats.totalTournaments > 0
                    ? `${Math.round((stats.wins / stats.totalTournaments) * 100)}%`
                    : "0%";
            } catch (err) {
                console.error("Tournament service unavailable:", err.message);
            }

            return res.status(200).json(new ApiResponse(200, {
                user: {
                    id:              user.id,
                    name:            user.name,
                    profile_picture: user.profile_picture,
                    created_at:      user.created_at,
                },
                stats,
                tournamentHistory: tournamentHistory.map(t => ({
                    title:     t.title,
                    result:    t.result,
                    rank:      t.rank,
                    played_at: t.played_at,
                })),
            }, "Public profile fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = profileController;
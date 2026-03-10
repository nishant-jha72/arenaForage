const Tournament = require("../Model/Tournament.model");
const Team = require("../Model/Team.model");
const ApiError = require("../Utils/ApiError.util");
const ApiResponse = require("../Utils/ApiResponse.util");
const axios = require("axios");
const nodemailer = require("nodemailer");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, text }) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};

// Calls main MySQL service to update admin's tournaments_organised and revenue
const updateAdminRecord = async (adminId, revenueEarned) => {
    try {
        await axios.post(
            `${process.env.MAIN_SERVICE_URL}/api/internal/admin/record-tournament`,
            { adminId, revenueEarned },
            {
                headers: {
                    "x-internal-secret": process.env.INTERNAL_SECRET, // shared secret between services
                },
            }
        );
    } catch (error) {
        console.error("Failed to update admin record in main service:", error.message);
    }
};

// ─── Controller ───────────────────────────────────────────────────────────────

const tournamentController = {

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN — TOURNAMENT MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════

    // ── CREATE TOURNAMENT ─────────────────────────────────────────────────────
    // POST /api/tournaments
    create: async (req, res, next) => {
        try {
            const {
                title, game, description,
                registration_start, registration_end,
                start_date, end_date,
                entry_fee,
                prize_pool_total, prize_distribution,
            } = req.body;

            if (!title || !game || !start_date || !end_date || !registration_start || !registration_end) {
                throw new ApiError(400, "Title, game, schedule and registration dates are required");
            }

            if (new Date(registration_end) >= new Date(start_date)) {
                throw new ApiError(400, "Registration must close before tournament starts");
            }

            const is_free = !entry_fee || entry_fee === 0;

            const tournament = await Tournament.create({
                title,
                game,
                description: description || "",
                admin_id:    req.admin.id,
                admin_name:  req.admin.name,
                status:      "draft",
                registration: {
                    start_date:   new Date(registration_start),
                    end_date:     new Date(registration_end),
                    max_teams:    12,
                    max_per_team: 5,
                    max_entries:  60,
                    entry_fee:    entry_fee || 0,
                    is_free,
                },
                schedule: {
                    start_date: new Date(start_date),
                    end_date:   new Date(end_date),
                },
                prize_pool: {
                    total:        prize_pool_total || 0,
                    currency:     "INR",
                    distribution: prize_distribution || [],
                },
            });

            return res.status(201).json(
                new ApiResponse(201, { tournament }, "Tournament created successfully")
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── UPDATE TOURNAMENT (only while in draft) ───────────────────────────────
    // PATCH /api/tournaments/:id
    update: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");

            if (tournament.admin_id !== req.admin.id) {
                throw new ApiError(403, "You can only update your own tournaments");
            }

            if (!["draft"].includes(tournament.status)) {
                throw new ApiError(400, "Tournament can only be updated while in draft status");
            }

            const allowedFields = [
                "title", "game", "description", "banner_url",
                "registration", "schedule", "prize_pool"
            ];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    tournament[field] = req.body[field];
                }
            });

            await tournament.save();
            return res.status(200).json(new ApiResponse(200, { tournament }, "Tournament updated successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── OPEN REGISTRATION ─────────────────────────────────────────────────────
    // PATCH /api/tournaments/:id/open-registration
    openRegistration: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");
            if (tournament.status !== "draft") throw new ApiError(400, "Only draft tournaments can be opened for registration");

            tournament.status = "registration_open";
            await tournament.save();

            return res.status(200).json(new ApiResponse(200, {}, "Registration opened successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── PUBLISH ROOM CREDENTIALS ──────────────────────────────────────────────
    // PATCH /api/tournaments/:id/publish-room
    // Admin publishes room ID and password before tournament starts
    // All team leaders receive it via email automatically
    publishRoom: async (req, res, next) => {
        try {
            const { room_id, password } = req.body;

            if (!room_id || !password) {
                throw new ApiError(400, "Room ID and password are required");
            }

            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");

            if (!["registration_open", "registration_closed"].includes(tournament.status)) {
                throw new ApiError(400, "Cannot publish room for a tournament in current status");
            }

            tournament.room = {
                room_id,
                password,
                published_at: new Date(),
                published_by: req.admin.id,
            };
            tournament.status = "registration_closed";
            await tournament.save();

            // Email all confirmed team leaders
            const confirmedTeams = tournament.teams.filter(t => t.is_confirmed);
            const emailPromises = confirmedTeams.map(async (team) => {
                // Fetch team leader email from main service
                try {
                    const response = await axios.get(
                        `${process.env.MAIN_SERVICE_URL}/api/internal/users/${team.leader_user_id}`,
                        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                    );
                    const leaderEmail = response.data?.data?.gmail;
                    if (leaderEmail) {
                        await sendEmail({
                            to: leaderEmail,
                            subject: `Room Credentials — ${tournament.title}`,
                            text: `Hello ${team.team_name} Captain,\n\nYour room credentials for ${tournament.title} are ready:\n\nRoom ID: ${room_id}\nPassword: ${password}\n\nTournament starts at: ${tournament.schedule.start_date}\n\nOnly verified players from your team are allowed to join.\n\nGood luck!`,
                        });
                    }
                } catch (err) {
                    console.error(`Failed to email team leader ${team.leader_user_id}:`, err.message);
                }
            });

            await Promise.allSettled(emailPromises);

            return res.status(200).json(
                new ApiResponse(200, { room_id, password }, `Room credentials published and emailed to ${confirmedTeams.length} team leaders`)
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── VERIFY PLAYER ─────────────────────────────────────────────────────────
    // PATCH /api/tournaments/:id/teams/:teamId/players/:userId/verify
    // Admin marks a player as verified (only verified players can play)
    verifyPlayer: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");

            const team = tournament.teams.find(t => t.team_id.toString() === req.params.teamId);
            if (!team) throw new ApiError(404, "Team not found in this tournament");

            const player = team.players.find(p => p.user_id === +req.params.userId);
            if (!player) throw new ApiError(404, "Player not found in this team");

            // Count already verified non-extra players in team
            const verifiedCount = team.players.filter(p => p.is_verified && !p.is_extra).length;
            if (!player.is_extra && verifiedCount >= 5) {
                throw new ApiError(400, "This team already has 5 verified players");
            }

            player.is_verified = true;
            await tournament.save();

            return res.status(200).json(new ApiResponse(200, {}, "Player verified successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── CONFIRM TEAM ──────────────────────────────────────────────────────────
    // PATCH /api/tournaments/:id/teams/:teamId/confirm
    confirmTeam: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");

            const team = tournament.teams.find(t => t.team_id.toString() === req.params.teamId);
            if (!team) throw new ApiError(404, "Team not found");

            const confirmedTeams = tournament.teams.filter(t => t.is_confirmed).length;
            if (confirmedTeams >= 12) throw new ApiError(400, "Maximum 12 teams already confirmed");

            team.is_confirmed = true;
            await tournament.save();

            return res.status(200).json(new ApiResponse(200, {}, "Team confirmed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── SUBMIT SCORES ─────────────────────────────────────────────────────────
    // POST /api/tournaments/:id/scores
    // Admin submits score data (from their script) after game ends
    submitScores: async (req, res, next) => {
        try {
            const { scores } = req.body; // array of { team_id, team_name, score, raw_data }

            if (!scores || !Array.isArray(scores)) {
                throw new ApiError(400, "Scores array is required");
            }

            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");
            if (tournament.status !== "live") throw new ApiError(400, "Can only submit scores for live tournaments");

            // Sort by score descending and assign ranks
            const ranked = [...scores].sort((a, b) => b.score - a.score).map((s, i) => ({
                ...s,
                rank: i + 1,
                updated_at: new Date(),
            }));

            tournament.scores = ranked;
            await tournament.save();

            return res.status(200).json(new ApiResponse(200, { scores: ranked }, "Scores submitted successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── COMPLETE TOURNAMENT ───────────────────────────────────────────────────
    // PATCH /api/tournaments/:id/complete
    // Called after x:01pm — updates status, sets winner, calls main service
    completeTournament: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");
            if (tournament.status !== "live") throw new ApiError(400, "Only live tournaments can be completed");

            // Set winner from scores
            if (tournament.scores.length > 0) {
                const winner = tournament.scores.find(s => s.rank === 1);
                if (winner) {
                    tournament.winner = {
                        team_id:   winner.team_id,
                        team_name: winner.team_name,
                    };
                }
            }

            tournament.status = "completed";

            // Calculate total revenue from entry fees
            const revenue = tournament.registration.is_free
                ? 0
                : tournament.teams.filter(t => t.is_confirmed).length *
                  tournament.registration.entry_fee *
                  tournament.registration.max_per_team;

            await tournament.save();

            // Update team tournament history
            await Promise.allSettled(
                tournament.teams.filter(t => t.is_confirmed).map(async (team) => {
                    const score = tournament.scores.find(s => s.team_id.toString() === team.team_id.toString());
                    await Team.findByIdAndUpdate(team.team_id, {
                        $push: {
                            tournament_history: {
                                tournament_id: tournament._id,
                                title:         tournament.title,
                                result:        score?.rank === 1 ? "win" : "loss",
                                rank:          score?.rank || null,
                                played_at:     new Date(),
                            }
                        }
                    });
                })
            );

            // Call main MySQL service to update admin record
            if (!tournament.admin_record_updated) {
                await updateAdminRecord(tournament.admin_id, revenue);
                tournament.admin_record_updated = true;
                await tournament.save();
            }

            return res.status(200).json(
                new ApiResponse(200, {
                    winner: tournament.winner,
                    revenue,
                }, "Tournament completed successfully")
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── CANCEL TOURNAMENT ─────────────────────────────────────────────────────
    // PATCH /api/tournaments/:id/cancel
    cancel: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");
            if (["completed", "cancelled"].includes(tournament.status)) {
                throw new ApiError(400, "Cannot cancel a completed or already cancelled tournament");
            }

            tournament.status = "cancelled";
            await tournament.save();

            return res.status(200).json(new ApiResponse(200, {}, "Tournament cancelled successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── SET LIVE ──────────────────────────────────────────────────────────────
    // PATCH /api/tournaments/:id/live
    // Called at x:00pm when tournament starts
    setLive: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");
            if (tournament.admin_id !== req.admin.id) throw new ApiError(403, "Unauthorized");
            if (tournament.status !== "registration_closed") {
                throw new ApiError(400, "Tournament must have registration closed before going live");
            }

            tournament.status = "live";
            await tournament.save();

            return res.status(200).json(new ApiResponse(200, {}, "Tournament is now live"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // USER — REGISTRATION & VIEWING
    // ══════════════════════════════════════════════════════════════════════════

    // ── GET ALL TOURNAMENTS (public) ──────────────────────────────────────────
    // GET /api/tournaments?status=registration_open&page=1&limit=10
    getAll: async (req, res, next) => {
        try {
            const { status, page = 1, limit = 10, game } = req.query;
            const filter = {};
            if (status) filter.status = status;
            if (game) filter.game = new RegExp(game, "i");

            const tournaments = await Tournament.find(filter)
                .select("-teams -scores -room.password") // hide sensitive fields
                .sort({ "schedule.start_date": 1 })
                .skip((page - 1) * limit)
                .limit(+limit);

            const total = await Tournament.countDocuments(filter);

            return res.status(200).json(new ApiResponse(200, { tournaments, total, page: +page, limit: +limit }, "Tournaments fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET SINGLE TOURNAMENT ─────────────────────────────────────────────────
    // GET /api/tournaments/:id
    getById: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id)
                .select("-room.password -scores.raw_data"); // hide password and raw score data

            if (!tournament) throw new ApiError(404, "Tournament not found");

            return res.status(200).json(new ApiResponse(200, { tournament }, "Tournament fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── REGISTER TEAM IN TOURNAMENT ───────────────────────────────────────────
    // POST /api/tournaments/:id/register
    // Only team leader can register their team
    registerTeam: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");

            if (tournament.status !== "registration_open") {
                throw new ApiError(400, "Registration is not open for this tournament");
            }

            if (tournament.total_entries >= tournament.registration.max_entries) {
                throw new ApiError(400, "Tournament is full. No more registrations allowed.");
            }

            // Find team where this user is leader
            const team = await Team.findOne({ leader_user_id: req.user.id, is_active: true });
            if (!team) throw new ApiError(404, "You must create a team before registering");

            if (team.members.length < 2) {
                throw new ApiError(400, "Your team must have at least 2 members before registering");
            }

            // Check team not already registered
            const alreadyRegistered = tournament.teams.find(
                t => t.team_id.toString() === team._id.toString()
            );
            if (alreadyRegistered) throw new ApiError(409, "Your team is already registered in this tournament");

            // Determine confirmed teams count
            const confirmedTeams = tournament.teams.filter(t => t.is_confirmed).length;

            // Map team members to player entries
            // First 5 members are confirmed players, rest (if any) are extras
            const players = team.members.map((member, index) => ({
                user_id:     member.user_id,
                username:    member.username,
                is_extra:    index >= 5,
                is_verified: false,
                joined_at:   new Date(),
            }));

            tournament.teams.push({
                team_id:        team._id,
                team_name:      team.name,
                leader_user_id: team.leader_user_id,
                players,
                is_confirmed:   false,
                registered_at:  new Date(),
            });

            tournament.total_entries += players.length;
            await tournament.save();

            return res.status(200).json(
                new ApiResponse(200, {}, `Team "${team.name}" registered successfully. Await admin confirmation.`)
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET ROOM CREDENTIALS (for team leaders only) ──────────────────────────
    // GET /api/tournaments/:id/room
    getRoomCredentials: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id);
            if (!tournament) throw new ApiError(404, "Tournament not found");

            if (!tournament.room?.room_id) {
                throw new ApiError(404, "Room credentials have not been published yet");
            }

            // Only confirmed team leaders can view room credentials
            const team = tournament.teams.find(
                t => t.leader_user_id === req.user.id && t.is_confirmed
            );
            if (!team) {
                throw new ApiError(403, "Only confirmed team leaders can view room credentials");
            }

            return res.status(200).json(new ApiResponse(200, {
                room_id:  tournament.room.room_id,
                password: tournament.room.password,
            }, "Room credentials fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET LEADERBOARD ───────────────────────────────────────────────────────
    // GET /api/tournaments/:id/leaderboard
    getLeaderboard: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id).select("scores title status winner");
            if (!tournament) throw new ApiError(404, "Tournament not found");

            return res.status(200).json(new ApiResponse(200, {
                title:   tournament.title,
                status:  tournament.status,
                winner:  tournament.winner,
                scores:  tournament.scores.map(s => ({
                    rank:      s.rank,
                    team_name: s.team_name,
                    score:     s.score,
                })),
            }, "Leaderboard fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = tournamentController;
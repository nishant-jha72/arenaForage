const Tournament = require("../Model/Tournament.model");
const ApiError = require("../Utils/ApiError.util");
const ApiResponse = require("../Utils/ApiResponse.util");

const bracketController = {

    // ── GET FULL RESULTS PAGE ─────────────────────────────────────────────────
    // GET /api/tournaments/:id/results
    // Returns complete tournament results — scores, rankings, prize distribution, winner
    getResults: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id)
                .select("title game status winner scores prize_pool teams schedule admin_name");

            if (!tournament) throw new ApiError(404, "Tournament not found");

            if (!["completed", "live"].includes(tournament.status)) {
                throw new ApiError(400, "Results are only available for live or completed tournaments");
            }

            // Build results with prize money per position
            const results = tournament.scores.map((score) => {
                const prizeEntry = tournament.prize_pool.distribution.find(
                    d => d.position === score.rank
                );
                return {
                    rank:        score.rank,
                    team_name:   score.team_name,
                    score:       score.score,
                    prize_money: prizeEntry ? prizeEntry.amount : 0,
                    currency:    tournament.prize_pool.currency,
                };
            });

            // Build team summary (verified players per team)
            const teamSummary = tournament.teams
                .filter(t => t.is_confirmed)
                .map(t => ({
                    team_name:        t.team_name,
                    verified_players: t.players.filter(p => p.is_verified && !p.is_extra).length,
                    players:          t.players
                        .filter(p => p.is_verified && !p.is_extra)
                        .map(p => ({ username: p.username })),
                }));

            return res.status(200).json(new ApiResponse(200, {
                tournament: {
                    title:      tournament.title,
                    game:       tournament.game,
                    status:     tournament.status,
                    admin_name: tournament.admin_name,
                    played_on:  tournament.schedule.start_date,
                },
                winner:      tournament.winner,
                prize_pool:  tournament.prize_pool,
                results,
                teamSummary,
            }, "Tournament results fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET BRACKET ───────────────────────────────────────────────────────────
    // GET /api/tournaments/:id/bracket
    // Returns bracket view — teams sorted by score with position indicators
    getBracket: async (req, res, next) => {
        try {
            const tournament = await Tournament.findById(req.params.id)
                .select("title game status scores teams registration");

            if (!tournament) throw new ApiError(404, "Tournament not found");

            const confirmedTeams = tournament.teams.filter(t => t.is_confirmed);

            // If tournament not started yet, show registered teams
            if (tournament.status === "registration_open" || tournament.status === "registration_closed") {
                return res.status(200).json(new ApiResponse(200, {
                    status:       tournament.status,
                    total_teams:  confirmedTeams.length,
                    max_teams:    tournament.registration.max_teams,
                    teams:        confirmedTeams.map(t => ({
                        team_name:    t.team_name,
                        is_confirmed: t.is_confirmed,
                        player_count: t.players.filter(p => !p.is_extra).length,
                    })),
                }, "Bracket fetched"));
            }

            // If live or completed, show with scores
            const bracket = confirmedTeams.map(team => {
                const score = tournament.scores.find(
                    s => s.team_name === team.team_name
                );
                return {
                    team_name:   team.team_name,
                    score:       score?.score || 0,
                    rank:        score?.rank  || null,
                    player_count: team.players.filter(p => p.is_verified && !p.is_extra).length,
                };
            }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

            return res.status(200).json(new ApiResponse(200, {
                status:  tournament.status,
                bracket,
            }, "Bracket fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = bracketController;
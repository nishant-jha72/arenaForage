const Tournament = require("../Models/tournament.model");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const {
    calculateLeaderboard,
    applyPrizeDistribution,
    calcMatchScore,
} = require("../Utils/scoreCalculator.utils");

/* ─────────────────────────────────────────────────────────────────
   POST /api/tournaments/:id/scores
   Admin submits results for one or more completed matches.

   Body:
   {
     "matches": [
       {
         "matchNumber": 1,
         "teams": [
           { "teamId": "mongo_object_id", "teamName": "Alpha", "position": 1, "kills": 8 },
           { "teamId": "...",              "teamName": "Beta",  "position": 2, "kills": 5 },
           ...
         ]
       }
     ]
   }

   - Validates each team exists in tournament.teams array.
   - Calculates per-match and cumulative scores.
   - Saves to tournament.scores in MongoDB.
   - Re-derives the full leaderboard and saves tournament.winner.
   ───────────────────────────────────────────────────────────────── */
const submitScores = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { matches } = req.body;

        // ── Validation ──────────────────────────────────────────
        if (!matches || !Array.isArray(matches) || matches.length === 0) {
            throw new ApiError(400, "matches array is required and must not be empty.");
        }

        const tournament = await Tournament.findById(id);
        if (!tournament) throw new ApiError(404, "Tournament not found.");

        if (!["live", "registration_closed"].includes(tournament.status)) {
            throw new ApiError(400, `Cannot submit scores when tournament status is '${tournament.status}'. Must be 'live' or 'registration_closed'.`);
        }

        // Build set of valid teamIds in this tournament
        const validTeamIds = new Set(
            tournament.teams
                .filter((t) => t.isConfirmed)
                .map((t) => t.team_id.toString())
        );

        // ── Process & validate each match ───────────────────────
        const processedMatches = [];

        for (const match of matches) {
            const { matchNumber, teams } = match;

            if (!matchNumber || !Array.isArray(teams) || teams.length === 0) {
                throw new ApiError(400, `Each match must have a matchNumber and a non-empty teams array.`);
            }

            // Prevent duplicate match submissions
            const alreadySubmitted = tournament.scores.some(
                (s) => s.matchNumber === matchNumber
            );
            if (alreadySubmitted) {
                throw new ApiError(409, `Scores for match #${matchNumber} have already been submitted. Delete them first to resubmit.`);
            }

            // Validate positions are unique within the match (1–12)
            const positions = teams.map((t) => t.position);
            const uniquePositions = new Set(positions);
            if (uniquePositions.size !== positions.length) {
                throw new ApiError(400, `Match #${matchNumber}: Duplicate positions found. Each team must have a unique placement.`);
            }

            const processedTeams = teams.map((entry) => {
                const { teamId, teamName, position, kills } = entry;

                if (!validTeamIds.has(teamId.toString())) {
                    throw new ApiError(400, `Match #${matchNumber}: Team '${teamName}' (id: ${teamId}) is not a confirmed participant in this tournament.`);
                }
                if (!position || position < 1 || position > 12) {
                    throw new ApiError(400, `Match #${matchNumber}: Position for team '${teamName}' must be between 1 and 12.`);
                }
                if (kills === undefined || kills < 0) {
                    throw new ApiError(400, `Match #${matchNumber}: Kills for team '${teamName}' must be 0 or more.`);
                }

                const { placementPoints, killPoints, totalPoints } = calcMatchScore(position, kills);

                return { teamId, teamName, position, kills, placementPoints, killPoints, totalPoints };
            });

            processedMatches.push({ matchNumber, teams: processedTeams });
        }

        // ── Persist to MongoDB ───────────────────────────────────
        tournament.scores.push(...processedMatches);

        // ── Recalculate full leaderboard from ALL scores ─────────
        const leaderboard = calculateLeaderboard(tournament.scores);
        const leaderboardWithPrizes = applyPrizeDistribution(
            leaderboard,
            tournament.prize_pool?.distribution ?? []
        );

        // Save winner (rank 1)
        if (leaderboardWithPrizes.length > 0) {
            const winner = leaderboardWithPrizes[0];
            tournament.winner = {
                team_id:    winner.teamId,
                team_name:  winner.teamName,
                totalPoints: winner.totalPoints,
                prizeWon:   winner.prizeWon,
            };
        }

        await tournament.save();

        return res.status(200).json(
            new ApiResponse(200, {
                matchesSubmitted: processedMatches.length,
                totalMatchesOnRecord: tournament.scores.length,
                leaderboard: leaderboardWithPrizes,
            }, `Scores for ${processedMatches.length} match(es) submitted successfully.`)
        );
    } catch (err) {
        next(err);
    }
};

/* ─────────────────────────────────────────────────────────────────
   DELETE /api/tournaments/:id/scores/:matchNumber
   Admin deletes a specific match's scores (to allow resubmission).
   ───────────────────────────────────────────────────────────────── */
const deleteMatchScore = async (req, res, next) => {
    try {
        const { id, matchNumber } = req.params;

        const tournament = await Tournament.findById(id);
        if (!tournament) throw new ApiError(404, "Tournament not found.");

        const matchNum = parseInt(matchNumber, 10);
        const index = tournament.scores.findIndex((s) => s.matchNumber === matchNum);

        if (index === -1) {
            throw new ApiError(404, `No scores found for match #${matchNum}.`);
        }

        tournament.scores.splice(index, 1);

        // Recalculate leaderboard after deletion
        const leaderboard = calculateLeaderboard(tournament.scores);
        const leaderboardWithPrizes = applyPrizeDistribution(
            leaderboard,
            tournament.prize_pool?.distribution ?? []
        );

        tournament.winner = leaderboardWithPrizes.length > 0
            ? {
                team_id:    leaderboardWithPrizes[0].teamId,
                team_name:  leaderboardWithPrizes[0].teamName,
                totalPoints: leaderboardWithPrizes[0].totalPoints,
                prizeWon:   leaderboardWithPrizes[0].prizeWon,
              }
            : null;

        await tournament.save();

        return res.status(200).json(
            new ApiResponse(200, { leaderboard: leaderboardWithPrizes }, `Scores for match #${matchNum} deleted.`)
        );
    } catch (err) {
        next(err);
    }
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/tournaments/:id/leaderboard
   Public — returns current leaderboard with per-match breakdown.
   ───────────────────────────────────────────────────────────────── */
const getLeaderboard = async (req, res, next) => {
    try {
        const { id } = req.params;

        const tournament = await Tournament.findById(id).select(
            "title game status scores teams prize_pool winner"
        );
        if (!tournament) throw new ApiError(404, "Tournament not found.");

        if (!tournament.scores || tournament.scores.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, {
                    tournament: { id: tournament._id, title: tournament.title, game: tournament.game, status: tournament.status },
                    matchesPlayed: 0,
                    leaderboard: [],
                    winner: null,
                }, "No scores submitted yet.")
            );
        }

        const leaderboard = calculateLeaderboard(tournament.scores);
        const leaderboardWithPrizes = applyPrizeDistribution(
            leaderboard,
            tournament.prize_pool?.distribution ?? []
        );

        return res.status(200).json(
            new ApiResponse(200, {
                tournament: {
                    id: tournament._id,
                    title: tournament.title,
                    game: tournament.game,
                    status: tournament.status,
                },
                pointsTable: {
                    placement: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, "11-12": 0 },
                    perKill: 1,
                },
                matchesPlayed: tournament.scores.length,
                winner: tournament.winner ?? null,
                leaderboard: leaderboardWithPrizes,
            }, "Leaderboard fetched successfully.")
        );
    } catch (err) {
        next(err);
    }
};

module.exports = { submitScores, deleteMatchScore, getLeaderboard };
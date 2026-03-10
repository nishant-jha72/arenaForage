// Add these methods to your existing Tournament.controller.js

const { createAndEmailNotification } = require('../Utils/notification.helper');

// ── JOIN WAITLIST ─────────────────────────────────────────────────────────────
// POST /api/tournaments/:id/waitlist
// Called when tournament is full (60 entries reached)
const joinWaitlist = async (req, res, next) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) throw new ApiError(404, "Tournament not found");

        if (tournament.status !== "registration_open") {
            throw new ApiError(400, "Registration is not open");
        }

        if (tournament.total_entries < tournament.registration.max_entries) {
            throw new ApiError(400, "Tournament still has spots. Register normally instead.");
        }

        const team = await Team.findOne({ leader_user_id: req.user.id, is_active: true });
        if (!team) throw new ApiError(404, "You must have a team to join waitlist");

        // Check not already on waitlist or registered
        const alreadyRegistered = tournament.teams.find(
            t => t.team_id.toString() === team._id.toString()
        );
        if (alreadyRegistered) throw new ApiError(409, "Your team is already registered");

        const alreadyWaitlisted = tournament.waitlist?.find(
            w => w.team_id.toString() === team._id.toString()
        );
        if (alreadyWaitlisted) throw new ApiError(409, "Your team is already on the waitlist");

        tournament.waitlist = tournament.waitlist || [];
        tournament.waitlist.push({
            team_id:        team._id,
            team_name:      team.name,
            leader_user_id: team.leader_user_id,
            joined_at:      new Date(),
        });

        await tournament.save();

        return res.status(200).json(
            new ApiResponse(200, {
                position: tournament.waitlist.length
            }, `Added to waitlist at position ${tournament.waitlist.length}`)
        );
    } catch (error) {
        next(new ApiError(error.statusCode || 500, error.message));
    }
};

// ── PROMOTE FROM WAITLIST ─────────────────────────────────────────────────────
// Called internally when a confirmed team drops out
// Also called by admin manually: PATCH /api/tournaments/:id/waitlist/promote
const promoteFromWaitlist = async (tournamentId, adminId) => {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || !tournament.waitlist?.length) return null;

    const nextTeam = tournament.waitlist.shift(); // take first in line

    // Add to registered teams
    const team = await Team.findById(nextTeam.team_id);
    if (!team) return null;

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

    // Notify team leader via main service
    try {
        const axios = require('axios');
        await axios.post(
            `${process.env.MAIN_SERVICE_URL}/api/internal/notify`,
            {
                userId:   nextTeam.leader_user_id,
                userType: "user",
                title:    "You've been promoted from the waitlist!",
                message:  `Your team "${nextTeam.team_name}" has been promoted from the waitlist for "${tournament.title}". Please wait for admin confirmation.`,
                type:     "tournament",
            },
            { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
        );
    } catch (err) {
        console.error("Failed to notify waitlist promotion:", err.message);
    }

    return nextTeam;
};

module.exports = { joinWaitlist, promoteFromWaitlist };
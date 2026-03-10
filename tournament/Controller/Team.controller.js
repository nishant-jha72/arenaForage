const Team = require("../Model/Team.model");
const ApiError = require("../Utils/ApiError.util");
const ApiResponse = require("../Utils/ApiResponse.util");
const axios = require("axios");

const teamController = {

    // ── CREATE TEAM ───────────────────────────────────────────────────────────
    // POST /api/teams
    create: async (req, res, next) => {
        try {
            const { name, tag } = req.body;

            if (!name?.trim() || !tag?.trim()) {
                throw new ApiError(400, "Team name and tag are required");
            }

            if (tag.length > 5) {
                throw new ApiError(400, "Team tag must be 5 characters or less");
            }

            // Check user doesn't already lead a team
            const existingTeam = await Team.findOne({ leader_user_id: req.user.id, is_active: true });
            if (existingTeam) {
                throw new ApiError(409, "You already have an active team. Disband it before creating a new one.");
            }

            const team = await Team.create({
                name:            name.trim(),
                tag:             tag.trim().toUpperCase(),
                leader_user_id:  req.user.id,
                leader_username: req.user.name,
                members: [{
                    user_id:  req.user.id,
                    username: req.user.name,
                    role:     "leader",
                    joined_at: new Date(),
                }],
            });

            return res.status(201).json(new ApiResponse(201, { team }, "Team created successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET MY TEAM ───────────────────────────────────────────────────────────
    // GET /api/teams/my
    getMyTeam: async (req, res, next) => {
        try {
            // User could be leader or member
            const team = await Team.findOne({
                "members.user_id": req.user.id,
                is_active: true,
            });

            if (!team) throw new ApiError(404, "You are not in any active team");

            return res.status(200).json(new ApiResponse(200, { team }, "Team fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET TEAM BY ID (public) ───────────────────────────────────────────────
    // GET /api/teams/:id
    getById: async (req, res, next) => {
        try {
            const team = await Team.findById(req.params.id);
            if (!team) throw new ApiError(404, "Team not found");
            return res.status(200).json(new ApiResponse(200, { team }, "Team fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── INVITE MEMBER ─────────────────────────────────────────────────────────
    // POST /api/teams/invite
    // Leader invites a registered user by their user_id
    inviteMember: async (req, res, next) => {
        try {
            const { user_id } = req.body;
            if (!user_id) throw new ApiError(400, "User ID is required");

            const team = await Team.findOne({ leader_user_id: req.user.id, is_active: true });
            if (!team) throw new ApiError(404, "You don't have an active team");

            if (team.members.length >= 6) {
                throw new ApiError(400, "Team is full. Maximum 6 members (5 + 1 extra)");
            }

            const alreadyMember = team.members.find(m => m.user_id === +user_id);
            if (alreadyMember) throw new ApiError(409, "User is already in your team");

            // Verify user exists in main service
            let invitedUser;
            try {
                const response = await axios.get(
                    `${process.env.MAIN_SERVICE_URL}/api/internal/users/${user_id}`,
                    { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
                );
                invitedUser = response.data?.data;
            } catch {
                throw new ApiError(404, "User not found. They must be registered on the platform.");
            }

            team.members.push({
                user_id:  +user_id,
                username: invitedUser.name,
                role:     "member",
                joined_at: new Date(),
            });

            await team.save();

            return res.status(200).json(
                new ApiResponse(200, {}, `${invitedUser.name} added to your team successfully`)
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── REMOVE MEMBER ─────────────────────────────────────────────────────────
    // DELETE /api/teams/members/:userId
    removeMember: async (req, res, next) => {
        try {
            const team = await Team.findOne({ leader_user_id: req.user.id, is_active: true });
            if (!team) throw new ApiError(404, "You don't have an active team");

            const memberIndex = team.members.findIndex(m => m.user_id === +req.params.userId);
            if (memberIndex === -1) throw new ApiError(404, "Member not found in your team");

            if (+req.params.userId === req.user.id) {
                throw new ApiError(400, "You cannot remove yourself. Disband the team instead.");
            }

            team.members.splice(memberIndex, 1);
            await team.save();

            return res.status(200).json(new ApiResponse(200, {}, "Member removed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LEAVE TEAM ────────────────────────────────────────────────────────────
    // DELETE /api/teams/leave
    leaveTeam: async (req, res, next) => {
        try {
            const team = await Team.findOne({
                "members.user_id": req.user.id,
                leader_user_id: { $ne: req.user.id }, // leader cant leave, must disband
                is_active: true,
            });

            if (!team) throw new ApiError(404, "You are not a member of any team (leaders must disband instead)");

            team.members = team.members.filter(m => m.user_id !== req.user.id);
            await team.save();

            return res.status(200).json(new ApiResponse(200, {}, "Left team successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── DISBAND TEAM ──────────────────────────────────────────────────────────
    // DELETE /api/teams
    disband: async (req, res, next) => {
        try {
            const team = await Team.findOne({ leader_user_id: req.user.id, is_active: true });
            if (!team) throw new ApiError(404, "You don't have an active team");

            team.is_active = false;
            team.members = [];
            await team.save();

            return res.status(200).json(new ApiResponse(200, {}, "Team disbanded successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
};

module.exports = teamController;
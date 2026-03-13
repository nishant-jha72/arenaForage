const crypto = require("crypto");
const axios = require("axios");
const Tournament = require("../Model/Tournament.model");
const Invite = require("../Model/Invite.model");
const ApiError = require("../Utils/ApiError.util");
const ApiResponse = require("../Utils/ApiResponse.util");

const MAIN_SERVICE_URL = process.env.MAIN_SERVICE_URL || "http://localhost:5000";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── Helper: generate a cryptographically secure token ───────────────────────
const generateToken = () => crypto.randomBytes(32).toString("hex");

// ─── Helper: notify a user via main service ──────────────────────────────────
const notifyUser = async (userId, title, message, type = "tournament") => {
    try {
        await axios.post(
            `${MAIN_SERVICE_URL}/api/internal/notify`,
            { userId, userType: "user", title, message, type },
            { headers: { "x-internal-secret": INTERNAL_SECRET } }
        );
    } catch (err) {
        console.error("Failed to send notification:", err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. REGISTER TEAM FOR TOURNAMENT
//    POST /api/tournaments/:id/register
//    Auth: User (team leader)
//
//    Leader auto-fills Slot 1. Generates 4 invite tokens (slots 2-4 primary + slot 5 extra).
//    Returns shareable links for each slot.
// ─────────────────────────────────────────────────────────────────────────────
const registerTeam = async (req, res, next) => {
    try {
        const { id: tournamentId } = req.params;
        const { teamName, teamTag } = req.body;
        const leaderId = req.user.id;
        const leaderUsername = req.user.name;

        if (!teamName?.trim() || !teamTag?.trim()) {
            throw new ApiError(400, "Team name and tag are required.");
        }
        if (teamTag.length > 5) {
            throw new ApiError(400, "Team tag must be 5 characters or less.");
        }

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) throw new ApiError(404, "Tournament not found.");
        if (tournament.status !== "registration_open") {
            throw new ApiError(400, "Tournament registration is not currently open.");
        }
        if (tournament.total_entries >= tournament.registration.max_entries) {
            throw new ApiError(400, "Tournament is full. You can join the waitlist instead.");
        }

        // Check leader isn't already registered in this tournament
        const alreadyRegistered = tournament.teams.some(
            (reg) =>
                reg.leader_user_id === leaderId ||
                (reg.roster && reg.roster.some((slot) => slot.userId === leaderId))
        );
        if (alreadyRegistered) {
            throw new ApiError(409, "You are already registered in this tournament.");
        }

        // Build roster — leader auto-fills slot 1
        const roster = [];

        // Slot 1 — Leader (auto-joined, no token)
        roster.push({
            slotNumber: 1,
            role: "primary",
            inviteToken: null,
            status: "joined",
            userId: leaderId,
            username: leaderUsername,
            email: req.user.email || null,
            isVerified: false,
            joinedAt: new Date(),
        });

        // Slots 2-4 — Primary players
        for (let i = 2; i <= 4; i++) {
            roster.push({
                slotNumber: i,
                role: "primary",
                inviteToken: generateToken(),
                status: "empty",
                userId: null,
                username: null,
                email: null,
                isVerified: false,
                joinedAt: null,
            });
        }

        // Slot 5 — Extra player
        roster.push({
            slotNumber: 5,
            role: "extra",
            inviteToken: generateToken(),
            status: "empty",
            userId: null,
            username: null,
            email: null,
            isVerified: false,
            joinedAt: null,
        });

        // Push registration into tournament
        tournament.teams.push({
            teamName: teamName.trim(),
            teamTag: teamTag.trim().toUpperCase(),
            leader_user_id: leaderId,
            leaderUsername,
            is_confirmed: false,
            roster,
            joinedCount: 1,
            registered_at: new Date(),
        });

        tournament.total_entries += 1;
        await tournament.save();

        const registration = tournament.teams[tournament.teams.length - 1];

        // Token validity = until registration closes
        const registrationClosesAt = tournament.registration?.end_date || null;

        // Create Invite documents for slots 2-5
        const inviteDocs = roster
            .filter((slot) => slot.inviteToken !== null)
            .map((slot) => ({
                token: slot.inviteToken,
                tournamentId: tournament._id,
                tournamentName: tournament.title,
                registrationId: registration._id,
                teamName: teamName.trim(),
                teamTag: teamTag.trim().toUpperCase(),
                leaderUserId: leaderId,
                leaderUsername,
                slotNumber: slot.slotNumber,
                role: slot.role,
                status: "pending",
                registrationClosesAt,
            }));

        await Invite.insertMany(inviteDocs);

        // Build shareable links for response
        const inviteLinks = roster
            .filter((slot) => slot.inviteToken !== null)
            .map((slot) => ({
                slot: slot.slotNumber,
                role: slot.role,
                link: `${CLIENT_URL}/join?token=${slot.inviteToken}`,
                token: slot.inviteToken,
                validUntil: registrationClosesAt || "Until registration closes",
            }));

        // Notify leader
        await notifyUser(
            leaderId,
            "Team Registered!",
            `Your team "${teamName}" has been registered for ${tournament.title}. Share the invite links with your teammates.`,
            "tournament"
        );

        return res.status(201).json(
            new ApiResponse(201, {
                registrationId: registration._id,
                teamName: teamName.trim(),
                teamTag: teamTag.trim().toUpperCase(),
                tournament: { id: tournament._id, title: tournament.title },
                leaderSlot: { slot: 1, role: "primary", status: "joined" },
                inviteLinks,
                validUntil: registrationClosesAt || "Until registration closes",
                note: "Share these links with your teammates on WhatsApp or Discord. Links expire when registration closes.",
            }, "Team registered successfully.")
        );
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. VALIDATE INVITE TOKEN
//    GET /api/invites/:token
//    Auth: Public
// ─────────────────────────────────────────────────────────────────────────────
const validateInvite = async (req, res, next) => {
    try {
        const { token } = req.params;

        const invite = await Invite.findValid(token);

        if (!invite) {
            const raw = await Invite.findOne({ token });
            if (!raw) throw new ApiError(404, "Invalid invite link.");
            if (raw.status === "accepted")
                throw new ApiError(409, "This slot has already been filled by another player.");
            if (raw.status === "expired" || (raw.registrationClosesAt && new Date() > raw.registrationClosesAt))
                throw new ApiError(410, "Tournament registration has closed. This invite link is no longer valid.");
            if (raw.status === "cancelled")
                throw new ApiError(410, "This invite link has been cancelled.");
            throw new ApiError(400, "This invite link is no longer valid.");
        }

        const tournament = await Tournament.findById(invite.tournamentId).select(
            "title game status schedule registration.entry_fee"
        );

        return res.status(200).json(
            new ApiResponse(200, {
                invite: {
                    token: invite.token,
                    slotNumber: invite.slotNumber,
                    role: invite.role,
                    validUntil: invite.registrationClosesAt || "Until registration closes",
                },
                team: {
                    name: invite.teamName,
                    tag: invite.teamTag,
                    leader: invite.leaderUsername,
                },
                tournament: tournament ? {
                    id: tournament._id,
                    title: tournament.title,
                    game: tournament.game,
                    status: tournament.status,
                    startDate: tournament.schedule?.start_date,
                    entryFee: tournament.registration?.entry_fee,
                } : null,
            }, "Valid invite.")
        );
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACCEPT INVITE
//    POST /api/invites/:token/accept
//    Auth: User (must be logged in)
// ─────────────────────────────────────────────────────────────────────────────
const acceptInvite = async (req, res, next) => {
    try {
        const { token } = req.params;
        const userId = req.user.id;
        const username = req.user.name;
        const userEmail = req.user.email;

        const invite = await Invite.findValid(token);
        if (!invite) {
            const raw = await Invite.findOne({ token });
            if (!raw) throw new ApiError(404, "Invalid invite link.");
            if (raw.status === "accepted")
                throw new ApiError(409, "This slot has already been taken.");
            if (raw.status === "expired" || (raw.registrationClosesAt && new Date() > raw.registrationClosesAt))
                throw new ApiError(410, "Tournament registration has closed. This invite link is no longer valid.");
            throw new ApiError(400, "This invite link is no longer valid.");
        }

        const tournament = await Tournament.findById(invite.tournamentId);
        if (!tournament) throw new ApiError(404, "Tournament not found.");
        if (tournament.status !== "registration_open") {
            throw new ApiError(400, "Tournament registration is no longer open.");
        }

        // Leader can't accept their own invite
        if (userId === invite.leaderUserId) {
            throw new ApiError(400, "You are the team leader. You are already registered in Slot 1.");
        }

        // Check user isn't already registered in this tournament
        const alreadyIn = tournament.teams.some(
            (reg) =>
                reg.leader_user_id === userId ||
                (reg.roster && reg.roster.some((slot) => slot.userId === userId))
        );
        if (alreadyIn) {
            throw new ApiError(409, "You are already registered in this tournament with another team.");
        }

        // Find the registration subdocument
        const registration = tournament.teams.id(invite.registrationId);
        if (!registration) throw new ApiError(404, "Team registration not found.");

        const slot = registration.roster.find((s) => s.slotNumber === invite.slotNumber);
        if (!slot) throw new ApiError(404, "Roster slot not found.");
        if (slot.status === "joined") throw new ApiError(409, "This slot has already been filled.");

        // Assign user to the slot
        slot.status = "joined";
        slot.userId = userId;
        slot.username = username;
        slot.email = userEmail || null;
        slot.joinedAt = new Date();

        registration.joinedCount = (registration.joinedCount || 1) + 1;
        tournament.total_entries += 1;

        // Mark invite as accepted
        invite.status = "accepted";
        invite.acceptedBy = {
            userId,
            username,
            email: userEmail || null,
            acceptedAt: new Date(),
        };

        await Promise.all([tournament.save(), invite.save()]);

        // Notify the player
        await notifyUser(
            userId,
            "You've Joined a Team!",
            `You have successfully joined team "${registration.teamName}" as a ${invite.role} player for ${tournament.title}.`,
            "tournament"
        );

        // Notify the leader
        await notifyUser(
            invite.leaderUserId,
            "Teammate Joined!",
            `${username} has joined your team "${registration.teamName}" in slot ${invite.slotNumber} for ${tournament.title}.`,
            "tournament"
        );

        return res.status(200).json(
            new ApiResponse(200, {
                tournament: { id: tournament._id, title: tournament.title },
                team: { name: registration.teamName, tag: registration.teamTag },
                slot: { slotNumber: invite.slotNumber, role: invite.role },
                joinedCount: registration.joinedCount,
                totalSlots: 5,
            }, "You have successfully joined the team!")
        );
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CANCEL INVITE
//    DELETE /api/invites/:token
//    Auth: User (leader only)
// ─────────────────────────────────────────────────────────────────────────────
const cancelInvite = async (req, res, next) => {
    try {
        const { token } = req.params;
        const userId = req.user.id;

        const invite = await Invite.findOne({ token });
        if (!invite) throw new ApiError(404, "Invite not found.");
        if (invite.leaderUserId !== userId) {
            throw new ApiError(403, "Only the team leader can cancel invite links.");
        }
        if (invite.status === "accepted") {
            throw new ApiError(400, "Cannot cancel an invite that has already been accepted.");
        }

        invite.status = "cancelled";
        await invite.save();

        // Clear token from roster slot
        const tournament = await Tournament.findById(invite.tournamentId);
        if (tournament) {
            const registration = tournament.teams.id(invite.registrationId);
            if (registration) {
                const slot = registration.roster.find((s) => s.slotNumber === invite.slotNumber);
                if (slot && slot.status === "empty") {
                    slot.inviteToken = null;
                    await tournament.save();
                }
            }
        }

        return res.status(200).json(new ApiResponse(200, {}, "Invite link cancelled successfully."));
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. REGENERATE INVITE TOKEN
//    POST /api/invites/:token/regenerate
//    Auth: User (leader only)
// ─────────────────────────────────────────────────────────────────────────────
const regenerateInvite = async (req, res, next) => {
    try {
        const { token } = req.params;
        const userId = req.user.id;

        const oldInvite = await Invite.findOne({ token });
        if (!oldInvite) throw new ApiError(404, "Invite not found.");
        if (oldInvite.leaderUserId !== userId) {
            throw new ApiError(403, "Only the team leader can regenerate invite links.");
        }
        if (oldInvite.status === "accepted") {
            throw new ApiError(400, "This slot is already filled. No need to regenerate.");
        }

        const tournament = await Tournament.findById(oldInvite.tournamentId);
        if (!tournament) throw new ApiError(404, "Tournament not found.");
        if (tournament.status !== "registration_open") {
            throw new ApiError(400, "Tournament registration is no longer open.");
        }

        // Cancel old invite
        oldInvite.status = "cancelled";
        await oldInvite.save();

        const newToken = generateToken();
        const registrationClosesAt = tournament.registration?.end_date || null;

        const newInvite = await Invite.create({
            token: newToken,
            tournamentId: oldInvite.tournamentId,
            tournamentName: oldInvite.tournamentName,
            registrationId: oldInvite.registrationId,
            teamName: oldInvite.teamName,
            teamTag: oldInvite.teamTag,
            leaderUserId: oldInvite.leaderUserId,
            leaderUsername: oldInvite.leaderUsername,
            slotNumber: oldInvite.slotNumber,
            role: oldInvite.role,
            status: "pending",
            registrationClosesAt,
        });

        // Update token in roster slot
        const registration = tournament.teams.id(oldInvite.registrationId);
        if (registration) {
            const slot = registration.roster.find((s) => s.slotNumber === oldInvite.slotNumber);
            if (slot) {
                slot.inviteToken = newToken;
                await tournament.save();
            }
        }

        return res.status(200).json(
            new ApiResponse(200, {
                slot: newInvite.slotNumber,
                role: newInvite.role,
                newLink: `${CLIENT_URL}/join?token=${newToken}`,
                token: newToken,
                validUntil: registrationClosesAt || "Until registration closes",
            }, "Invite link regenerated successfully.")
        );
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET MY REGISTRATION STATUS
//    GET /api/tournaments/:id/my-registration
//    Auth: User (leader only)
// ─────────────────────────────────────────────────────────────────────────────
const getMyRegistration = async (req, res, next) => {
    try {
        const { id: tournamentId } = req.params;
        const userId = req.user.id;

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) throw new ApiError(404, "Tournament not found.");

        const registration = tournament.teams.find((reg) => reg.leader_user_id === userId);
        if (!registration) {
            throw new ApiError(404, "You have not registered a team for this tournament.");
        }

        // Fetch current invite statuses for pending slots
        const pendingTokens = (registration.roster || [])
            .filter((s) => s.inviteToken && s.status !== "joined")
            .map((s) => s.inviteToken);

        const invites = await Invite.find({ token: { $in: pendingTokens } }).select(
            "token slotNumber role status registrationClosesAt"
        );

        const inviteMap = {};
        invites.forEach((inv) => { inviteMap[inv.token] = inv; });

        const rosterView = (registration.roster || []).map((slot) => {
            const inv = slot.inviteToken ? inviteMap[slot.inviteToken] : null;
            return {
                slotNumber: slot.slotNumber,
                role: slot.role,
                status: slot.status,
                player: slot.userId
                    ? { userId: slot.userId, username: slot.username, email: slot.email }
                    : null,
                isVerified: slot.isVerified,
                invite: inv
                    ? {
                        token: inv.token,
                        link: `${CLIENT_URL}/join?token=${inv.token}`,
                        status: inv.status,
                        validUntil: inv.registrationClosesAt || "Until registration closes",
                    }
                    : slot.slotNumber === 1
                    ? { status: "leader" }
                    : null,
            };
        });

        return res.status(200).json(
            new ApiResponse(200, {
                registrationId: registration._id,
                teamName: registration.teamName,
                teamTag: registration.teamTag,
                isConfirmed: registration.is_confirmed,
                joinedCount: registration.joinedCount,
                totalSlots: 5,
                roster: rosterView,
                tournament: {
                    id: tournament._id,
                    title: tournament.title,
                    status: tournament.status,
                },
            }, "Registration details fetched.")
        );
    } catch (err) {
        next(err);
    }
};

module.exports = {
    registerTeam,
    validateInvite,
    acceptInvite,
    cancelInvite,
    regenerateInvite,
    getMyRegistration,
};
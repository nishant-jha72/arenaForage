import axios from "axios";
import Team from "../Model/Team.model.js";
import ApiError from "../Utils/ApiError.util.js";
import ApiResponse from "../Utils/ApiResponse.util.js";

const MAIN_SERVICE_URL = process.env.MAIN_SERVICE_URL || "http://localhost:5000";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

// ─── Helper: verify user exists in main service ──────────────────────────────
const verifyUser = async (userId) => {
  try {
    const res = await axios.get(
      `${MAIN_SERVICE_URL}/api/internal/users/${userId}`,
      { headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
    return res.data?.data || null;
  } catch {
    return null;
  }
};

// ─── Helper: notify user via main service ────────────────────────────────────
const notifyUser = async (userId, title, message, type = "team") => {
  try {
    await axios.post(
      `${MAIN_SERVICE_URL}/api/internal/notify`,
      { userId, userType: "user", title, message, type },
      { headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
  } catch (err) {
    console.error("Notification failed:", err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE TEAM
//    POST /api/teams
//    Auth: User ✅
// ─────────────────────────────────────────────────────────────────────────────
export const createTeam = async (req, res, next) => {
  try {
    const leaderId = req.user.id;
    const leaderUsername = req.user.name;
    const { name, tag, logo_url } = req.body;

    if (!name?.trim()) throw new ApiError(400, "Team name is required.");
    if (!tag?.trim()) throw new ApiError(400, "Team tag is required.");
    if (tag.length > 5) throw new ApiError(400, "Team tag must be 5 characters or less.");

    // Check user doesn't already lead a team
    const existingLeader = await Team.findOne({ leader_user_id: leaderId, is_active: true });
    if (existingLeader)
      throw new ApiError(409, "You already have an active team. Disband it first.");

    // Check user isn't a member of another team
    const existingMember = await Team.findOne({
      "members.userId": leaderId,
      is_active: true,
    });
    if (existingMember)
      throw new ApiError(409, "You are already a member of a team. Leave it first.");

    const team = await Team.create({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      logo_url: logo_url || null,
      leader_user_id: leaderId,
      leader_username: leaderUsername,
      members: [
        {
          userId: leaderId,
          username: leaderUsername,
          role: "leader",
          joinedAt: new Date(),
        },
      ],
      is_active: true,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Team created successfully.", { team }));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET MY TEAM
//    GET /api/teams/my
//    Auth: User ✅
// ─────────────────────────────────────────────────────────────────────────────
export const getMyTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const team = await Team.findOne({
      "members.userId": userId,
      is_active: true,
    });

    if (!team) throw new ApiError(404, "You are not part of any active team.");

    return res
      .status(200)
      .json(new ApiResponse(200, "Team fetched.", { team }));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET TEAM BY ID
//    GET /api/teams/:id
//    Auth: Public ❌
// ─────────────────────────────────────────────────────────────────────────────
export const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findOne({ _id: req.params.id, is_active: true });
    if (!team) throw new ApiError(404, "Team not found.");

    return res
      .status(200)
      .json(new ApiResponse(200, "Team fetched.", { team }));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. INVITE A MEMBER
//    POST /api/teams/invite
//    Auth: User ✅ (leader only)
//    Body: { userId }  ← invite by userId (look up from main service)
// ─────────────────────────────────────────────────────────────────────────────
export const inviteMember = async (req, res, next) => {
  try {
    const leaderId = req.user.id;
    const { userId: inviteeId } = req.body;

    if (!inviteeId) throw new ApiError(400, "userId is required.");

    // ── Fetch the leader's team ───────────────────────────────────────────────
    const team = await Team.findOne({ leader_user_id: leaderId, is_active: true });
    if (!team) throw new ApiError(404, "You don't have an active team.");

    if (team.members.length >= 5)
      throw new ApiError(400, "Team is full. Maximum 5 members allowed.");

    // ── Verify invitee exists in main service ─────────────────────────────────
    const invitee = await verifyUser(inviteeId);
    if (!invitee) throw new ApiError(404, "User not found.");
    if (invitee.isBanned)
      throw new ApiError(403, "This user is banned and cannot join teams.");

    // ── Check invitee isn't already in this team ──────────────────────────────
    const alreadyMember = team.members.some((m) => m.userId === Number(inviteeId));
    if (alreadyMember)
      throw new ApiError(409, "This user is already in your team.");

    // ── Check invitee isn't in another team ───────────────────────────────────
    const otherTeam = await Team.findOne({
      "members.userId": Number(inviteeId),
      is_active: true,
    });
    if (otherTeam)
      throw new ApiError(409, "This user is already a member of another team.");

    // ── Add member ────────────────────────────────────────────────────────────
    team.members.push({
      userId: Number(inviteeId),
      username: invitee.name,
      role: "member",
      joinedAt: new Date(),
    });

    await team.save();

    // ── Notify the invitee ────────────────────────────────────────────────────
    await notifyUser(
      Number(inviteeId),
      "You've Been Added to a Team!",
      `${req.user.name} has added you to team "${team.name}" [${team.tag}].`,
      "team"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Member added to team.", { team }));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. REMOVE A MEMBER
//    DELETE /api/teams/members/:userId
//    Auth: User ✅ (leader only)
// ─────────────────────────────────────────────────────────────────────────────
export const removeMember = async (req, res, next) => {
  try {
    const leaderId = req.user.id;
    const { userId: targetId } = req.params;

    const team = await Team.findOne({ leader_user_id: leaderId, is_active: true });
    if (!team) throw new ApiError(404, "You don't have an active team.");

    if (Number(targetId) === leaderId)
      throw new ApiError(400, "You cannot remove yourself. Disband the team instead.");

    const memberIndex = team.members.findIndex(
      (m) => m.userId === Number(targetId)
    );
    if (memberIndex === -1)
      throw new ApiError(404, "This user is not in your team.");

    const removed = team.members[memberIndex];
    team.members.splice(memberIndex, 1);
    await team.save();

    // Notify the removed member
    await notifyUser(
      Number(targetId),
      "Removed From Team",
      `You have been removed from team "${team.name}" [${team.tag}] by the leader.`,
      "team"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, `${removed.username} removed from team.`, { team }));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. LEAVE TEAM
//    DELETE /api/teams/leave
//    Auth: User ✅ (members only — leader must disband)
// ─────────────────────────────────────────────────────────────────────────────
export const leaveTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const team = await Team.findOne({
      "members.userId": userId,
      is_active: true,
    });
    if (!team) throw new ApiError(404, "You are not part of any active team.");

    if (team.leader_user_id === userId)
      throw new ApiError(
        400,
        "You are the team leader. Use 'Disband Team' to delete the team."
      );

    team.members = team.members.filter((m) => m.userId !== userId);
    await team.save();

    // Notify the leader
    await notifyUser(
      team.leader_user_id,
      "Teammate Left",
      `${req.user.name} has left your team "${team.name}".`,
      "team"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "You have left the team.", {}));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. DISBAND TEAM
//    DELETE /api/teams
//    Auth: User ✅ (leader only)
// ─────────────────────────────────────────────────────────────────────────────
export const disbandTeam = async (req, res, next) => {
  try {
    const leaderId = req.user.id;

    const team = await Team.findOne({ leader_user_id: leaderId, is_active: true });
    if (!team) throw new ApiError(404, "You don't have an active team.");

    // Soft delete — preserve history
    team.is_active = false;
    await team.save();

    // Notify all members
    const memberNotifications = team.members
      .filter((m) => m.userId !== leaderId)
      .map((m) => ({
        userId: m.userId,
        userType: "user",
        title: "Team Disbanded",
        message: `Team "${team.name}" [${team.tag}] has been disbanded by the leader.`,
        type: "team",
      }));

    if (memberNotifications.length > 0) {
      try {
        await axios.post(
          `${MAIN_SERVICE_URL}/api/internal/notify/bulk`,
          { notifications: memberNotifications },
          { headers: { "x-internal-secret": INTERNAL_SECRET } }
        );
      } catch (err) {
        console.error("Bulk notification failed:", err.message);
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Team disbanded successfully.", {}));
  } catch (err) {
    next(err);
  }
};
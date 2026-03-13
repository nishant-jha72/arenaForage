const express = require("express");
const router = express.Router();

const tournamentController = require("../Controller/Tournament.controller");
const inviteController     = require("../Controller/Invite.controller");
const waitlistController   = require("../Controller/Waitlist.controller");
const bracketController    = require("../Controller/Bracket.controller");

// Import directly without destructuring — matches your middleware export style
const authMiddleware      = require("../Middleware/user.auth.middleware");
const {adminAuthMiddleware} = require("../Middleware/Admin.auth.middleware");

// ── Debug guard ───────────────────────────────────────────────────────────────
const check = (name, fn) => {
    if (typeof fn !== "function") {
        throw new Error(`[Routes] "${name}" is NOT a function — got: ${typeof fn}. Check exports in its controller.`);
    }
    return fn;
};

const getAll             = check("getAll",             tournamentController.getAll);
const getById            = check("getById",            tournamentController.getById);
const getLeaderboard     = check("getLeaderboard",     tournamentController.getLeaderboard);
const getRoomCredentials = check("getRoomCredentials", tournamentController.getRoomCredentials);
const create             = check("create",             tournamentController.create);
const update             = check("update",             tournamentController.update);
const openRegistration   = check("openRegistration",   tournamentController.openRegistration);
const publishRoom        = check("publishRoom",        tournamentController.publishRoom);
const setLive            = check("setLive",            tournamentController.setLive);
const completeTournament = check("completeTournament", tournamentController.completeTournament);
const cancel             = check("cancel",             tournamentController.cancel);
const confirmTeam        = check("confirmTeam",        tournamentController.confirmTeam);
const verifyPlayer       = check("verifyPlayer",       tournamentController.verifyPlayer);
const submitScores       = check("submitScores",       tournamentController.submitScores);

const registerTeam        = check("registerTeam",        inviteController.registerTeam);
const getMyRegistration   = check("getMyRegistration",   inviteController.getMyRegistration);

const joinWaitlist        = check("joinWaitlist",        waitlistController.joinWaitlist);
const promoteFromWaitlist = check("promoteFromWaitlist", waitlistController.promoteFromWaitlist);

const getResults          = check("getResults",          bracketController.getResults);
const getBracket          = check("getBracket",          bracketController.getBracket);
// ─────────────────────────────────────────────────────────────────────────────

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",                                                        getAll);
router.get("/:id",                                                     getById);
router.get("/:id/leaderboard",                                         getLeaderboard);
router.get("/:id/results",                                             getResults);
router.get("/:id/bracket",                                             getBracket);

// ── User — Protected ──────────────────────────────────────────────────────────
router.post("/:id/register",               authMiddleware,             registerTeam);
router.get("/:id/my-registration",         authMiddleware,             getMyRegistration);
router.get("/:id/room",                    authMiddleware,             getRoomCredentials);
router.post("/:id/waitlist",               authMiddleware,             joinWaitlist);

// ── Admin — Protected ─────────────────────────────────────────────────────────
router.post("/",                           adminAuthMiddleware,         create);
router.patch("/:id",                       adminAuthMiddleware,         update);
router.patch("/:id/open-registration",     adminAuthMiddleware,         openRegistration);
router.patch("/:id/publish-room",          adminAuthMiddleware,         publishRoom);
router.patch("/:id/live",                  adminAuthMiddleware,         setLive);
router.patch("/:id/complete",              adminAuthMiddleware,         completeTournament);
router.patch("/:id/cancel",               adminAuthMiddleware,          cancel);
router.patch("/:id/waitlist/promote",      adminAuthMiddleware,         promoteFromWaitlist);
router.patch("/:id/teams/:teamId/confirm", adminAuthMiddleware,         confirmTeam);
router.patch(
    "/:id/teams/:teamId/players/:userId/verify",
    adminAuthMiddleware,
    verifyPlayer
);
router.post("/:id/scores",                 adminAuthMiddleware,         submitScores);

module.exports = router;
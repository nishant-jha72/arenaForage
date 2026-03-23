const express = require("express");
const router  = express.Router();

// ── Controllers ───────────────────────────────────────────────────────────────
const tournamentController = require("../Controller/Tournament.controller");
const inviteController     = require("../Controller/Invite.controller");
const waitlistController   = require("../Controller/Waitlist.controller");
const bracketController    = require("../Controller/Bracket.controller");

// ── Middleware ────────────────────────────────────────────────────────────────
const authMiddleware          = require("../Middleware/user.auth.middleware");
const { adminAuthMiddleware } = require("../Middleware/Admin.auth.middleware");

// ── Guard: log any undefined handlers immediately on startup ──────────────────
// This gives you a clear "X is undefined" message instead of a cryptic
// "argument handler must be a function" error deep in the stack
const required = {
    "tournamentController.getAll":              tournamentController.getAll,
    "tournamentController.getById":             tournamentController.getById,
    "tournamentController.getLeaderboard":      tournamentController.getLeaderboard,
    "tournamentController.getRoomCredentials":  tournamentController.getRoomCredentials,
    "tournamentController.create":              tournamentController.create,
    "tournamentController.update":              tournamentController.update,
    "tournamentController.openRegistration":    tournamentController.openRegistration,
    "tournamentController.publishRoom":         tournamentController.publishRoom,
    "tournamentController.setLive":             tournamentController.setLive,
    "tournamentController.completeTournament":  tournamentController.completeTournament,
    "tournamentController.cancel":              tournamentController.cancel,
    "tournamentController.confirmTeam":         tournamentController.confirmTeam,
    "tournamentController.verifyPlayer":        tournamentController.verifyPlayer,
    "tournamentController.submitScores":        tournamentController.submitScores,
    "inviteController.registerTeam":            inviteController.registerTeam,
    "inviteController.getMyRegistration":       inviteController.getMyRegistration,
    "waitlistController.joinWaitlist":          waitlistController.joinWaitlist,
    "waitlistController.promoteFromWaitlist":   waitlistController.promoteFromWaitlist,
    "bracketController.getResults":             bracketController.getResults,
    "bracketController.getBracket":             bracketController.getBracket,
    "authMiddleware":                           authMiddleware,
    "adminAuthMiddleware":                      adminAuthMiddleware,
};

Object.entries(required).forEach(([name, fn]) => {
    if (typeof fn !== "function") {
        console.error(`❌ MISSING handler: ${name} — check exports in its file`);
    }
});

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",                     tournamentController.getAll);
router.get("/:id",                  tournamentController.getById);
router.get("/:id/leaderboard",      tournamentController.getLeaderboard);
router.get("/:id/results",          bracketController.getResults);
router.get("/:id/bracket",          bracketController.getBracket);

// ── User protected ────────────────────────────────────────────────────────────
router.get( "/:id/room",            authMiddleware, tournamentController.getRoomCredentials);
router.post("/:id/register",        authMiddleware, inviteController.registerTeam);
router.get( "/:id/my-registration", authMiddleware, inviteController.getMyRegistration);
router.post("/:id/waitlist",        authMiddleware, waitlistController.joinWaitlist);

// ── Admin protected ───────────────────────────────────────────────────────────
router.post("/",                                          adminAuthMiddleware, tournamentController.create);
router.patch("/:id",                                      adminAuthMiddleware, tournamentController.update);
router.patch("/:id/open-registration",                    adminAuthMiddleware, tournamentController.openRegistration);
router.patch("/:id/publish-room",                         adminAuthMiddleware, tournamentController.publishRoom);
router.patch("/:id/live",                                 adminAuthMiddleware, tournamentController.setLive);
router.patch("/:id/complete",                             adminAuthMiddleware, tournamentController.completeTournament);
router.patch("/:id/cancel",                               adminAuthMiddleware, tournamentController.cancel);
router.patch("/:id/waitlist/promote",                     adminAuthMiddleware, waitlistController.promoteFromWaitlist);
router.patch("/:id/teams/:teamId/confirm",                adminAuthMiddleware, tournamentController.confirmTeam);
router.patch("/:id/teams/:teamId/players/:userId/verify", adminAuthMiddleware, tournamentController.verifyPlayer);
router.post( "/:id/scores",                               adminAuthMiddleware, tournamentController.submitScores);

module.exports = router;
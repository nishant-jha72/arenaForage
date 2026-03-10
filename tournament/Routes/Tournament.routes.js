const express = require('express');
const router = express.Router();

const tournamentController = require('../Controller/Tournament.controller');
const teamController = require('../Controller/Team.controller');
const userAuthMiddleware = require('../Middleware/user.auth.middleware');
const { adminAuthMiddleware } = require('../Middleware/Admin.auth.middleware');

// ══════════════════════════════════════════════════════════════════════════════
// TOURNAMENT ROUTES
// ════════════════════════════════════════
// ── Public ────────────────────────────────────────────────────────────────────
router.get('/tournaments',                tournamentController.getAll);
router.get('/tournaments/:id',            tournamentController.getById);
router.get('/tournaments/:id/leaderboard',tournamentController.getLeaderboard);

// ── User Protected ────────────────────────────────────────────────────────────
router.post('/tournaments/:id/register',  userAuthMiddleware, tournamentController.registerTeam);
router.get('/tournaments/:id/room',       userAuthMiddleware, tournamentController.getRoomCredentials);

// ── Admin Protected ───────────────────────────────────────────────────────────
router.post('/tournaments',                                     adminAuthMiddleware, tournamentController.create);
router.patch('/tournaments/:id',                                adminAuthMiddleware, tournamentController.update);
router.patch('/tournaments/:id/open-registration',              adminAuthMiddleware, tournamentController.openRegistration);
router.patch('/tournaments/:id/publish-room',                   adminAuthMiddleware, tournamentController.publishRoom);
router.patch('/tournaments/:id/live',                           adminAuthMiddleware, tournamentController.setLive);
router.patch('/tournaments/:id/complete',                       adminAuthMiddleware, tournamentController.completeTournament);
router.patch('/tournaments/:id/cancel',                         adminAuthMiddleware, tournamentController.cancel);
router.patch('/tournaments/:id/teams/:teamId/confirm',          adminAuthMiddleware, tournamentController.confirmTeam);
router.patch('/tournaments/:id/teams/:teamId/players/:userId/verify', adminAuthMiddleware, tournamentController.verifyPlayer);
router.post('/tournaments/:id/scores',                          adminAuthMiddleware, tournamentController.submitScores);

// ══════════════════════════════════════════════════════════════════════════════
// TEAM ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/teams/:id',                  teamController.getById);

// ── User Protected ────────────────────────────────────────────────────────────
router.post('/teams',                     userAuthMiddleware, teamController.create);
router.get('/teams/my',                   userAuthMiddleware, teamController.getMyTeam);
router.post('/teams/invite',              userAuthMiddleware, teamController.inviteMember);
router.delete('/teams/leave',             userAuthMiddleware, teamController.leaveTeam);
router.delete('/teams',                   userAuthMiddleware, teamController.disband);
router.delete('/teams/members/:userId',   userAuthMiddleware, teamController.removeMember);

module.exports = router;
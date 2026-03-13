import { Router } from "express";
import {
  createTeam,
  getMyTeam,
  getTeamById,
  inviteMember,
  removeMember,
  leaveTeam,
  disbandTeam,
} from "../Controller/Team.controller.js";
import  authMiddleware  from "../Middleware/user.auth.middleware.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/:id", getTeamById);

// ── Protected ─────────────────────────────────────────────────────────────────
// IMPORTANT: specific routes must come before /:id to avoid conflicts
router.get("/my", authMiddleware, getMyTeam);            // GET /api/teams/my
router.post("/", authMiddleware, createTeam);             // POST /api/teams
router.post("/invite", authMiddleware, inviteMember);     // POST /api/teams/invite
router.delete("/leave", authMiddleware, leaveTeam);       // DELETE /api/teams/leave
router.delete("/", authMiddleware, disbandTeam);          // DELETE /api/teams
router.delete("/members/:userId", authMiddleware, removeMember); // DELETE /api/teams/members/:userId

export default router;
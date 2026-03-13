const express = require("express");
const router = express.Router();

const {
    validateInvite,
    acceptInvite,
    cancelInvite,
    regenerateInvite,
} = require("../Controller/Invite.controller");

// Import directly without destructuring — matches how your project exports middleware
const authMiddleware = require("../Middleware/user.auth.middleware");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/:token", validateInvite);

// ── Protected ─────────────────────────────────────────────────────────────────
router.post("/:token/accept",     authMiddleware, acceptInvite);
router.delete("/:token",          authMiddleware, cancelInvite);
router.post("/:token/regenerate", authMiddleware, regenerateInvite);

module.exports = router;
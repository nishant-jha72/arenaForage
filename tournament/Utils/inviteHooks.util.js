// Utils/inviteHooks.js
// Called from Tournament.controller.js on status transitions
// so that Invite documents stay in sync with tournament state.

const Invite = require("../Model/Invite.model");

// Called when admin opens registration — syncs registrationClosesAt
// to all pending invites (in case any were created before open)
const onRegistrationOpened = async (tournamentId, closesAt) => {
    if (!closesAt) return;
    await Invite.updateCloseDateForTournament(tournamentId, closesAt);
};

// Called when admin closes registration, publishes room, or cancels tournament.
// Expires all remaining pending tokens immediately.
const onRegistrationClosed = async (tournamentId) => {
    await Invite.expireAllForTournament(tournamentId);
};

module.exports = { onRegistrationOpened, onRegistrationClosed };
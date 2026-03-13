const mongoose = require("mongoose");

const InviteSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        tournamentName: {
            type: String,
            required: true,
        },
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        teamName:      { type: String, required: true },
        teamTag:       { type: String, required: true },
        leaderUserId:  { type: Number, required: true },
        leaderUsername:{ type: String, required: true },
        slotNumber:    { type: Number, required: true, min: 1, max: 5 },
        role:          { type: String, enum: ["primary", "extra"], required: true },
        status:        { type: String, enum: ["pending", "accepted", "expired", "cancelled"], default: "pending" },

        // Token is valid until tournament registration closes.
        // null = no hard deadline set yet — valid until admin manually closes registration.
        registrationClosesAt: { type: Date, default: null },

        acceptedBy: {
            userId:     { type: Number, default: null },
            username:   { type: String, default: null },
            email:      { type: String, default: null },
            acceptedAt: { type: Date,   default: null },
        },
    },
    { timestamps: true }
);

// Instance: is this invite expired?
InviteSchema.methods.isExpired = function () {
    if (this.status !== "pending") return true;
    if (this.registrationClosesAt && new Date() > this.registrationClosesAt) return true;
    return false;
};

// Static: find a valid (pending + not expired) invite by token
InviteSchema.statics.findValid = async function (token) {
    const invite = await this.findOne({ token });
    if (!invite) return null;
    if (invite.status !== "pending") return null;
    if (invite.registrationClosesAt && new Date() > invite.registrationClosesAt) {
        invite.status = "expired";
        await invite.save();
        return null;
    }
    return invite;
};

// Static: expire all pending invites for a tournament
// Call when admin closes registration, publishes room, or cancels tournament
InviteSchema.statics.expireAllForTournament = async function (tournamentId) {
    await this.updateMany(
        { tournamentId, status: "pending" },
        { $set: { status: "expired" } }
    );
};

// Static: sync registrationClosesAt when admin opens/updates registration
InviteSchema.statics.updateCloseDateForTournament = async function (tournamentId, closesAt) {
    await this.updateMany(
        { tournamentId, status: "pending" },
        { $set: { registrationClosesAt: closesAt } }
    );
};

module.exports = mongoose.model("Invite", InviteSchema);
const mongoose = require("mongoose");

// A team exists independently of tournaments
// Team registers INTO a tournament separately

const TeamMemberSchema = new mongoose.Schema({
    user_id:  { type: Number, required: true },    // references users.id in MySQL
    username: { type: String, required: true },
    role:     { type: String, enum: ["leader", "member"], default: "member" },
    joined_at:{ type: Date, default: Date.now },
}, { _id: false });

const TeamSchema = new mongoose.Schema({

    name:         { type: String, required: true, trim: true },
    tag:          { type: String, required: true, trim: true, maxlength: 5 }, // e.g. "ALPH"
    logo_url:     { type: String, default: null },   // Cloudinary logo

    // Leader references MySQL users.id
    leader_user_id: { type: Number, required: true },
    leader_username:{ type: String, required: true },

    members: [TeamMemberSchema], // includes leader + up to 5 members total

    // Tournaments this team has participated in
    tournament_history: [{
        tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
        title:         { type: String },
        result:        { type: String, enum: ["win", "loss", "pending"], default: "pending" },
        rank:          { type: Number, default: null },
        played_at:     { type: Date },
    }],

    is_active: { type: Boolean, default: true },

}, { timestamps: true });

TeamSchema.index({ leader_user_id: 1 });
TeamSchema.index({ name: 1 });

module.exports = mongoose.model("Team", TeamSchema);
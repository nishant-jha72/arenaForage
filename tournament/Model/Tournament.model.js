const mongoose = require("mongoose");

// ─── Sub Schemas ──────────────────────────────────────────────────────────────

const PrizeDistributionSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    amount:   { type: Number, required: true },
}, { _id: false });

const RegistrationSchema = new mongoose.Schema({
    start_date:   { type: Date, required: true },
    end_date:     { type: Date, required: true },
    max_teams:    { type: Number, default: 12 },       // 12 teams
    max_per_team: { type: Number, default: 5 },        // 5 players per team
    max_entries:  { type: Number, default: 60 },       // 60 total entries (48 + 12 extras)
    entry_fee:    { type: Number, default: 0 },        // 0 = free
    is_free:      { type: Boolean, default: true },
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
    user_id:     { type: Number, required: true },     // references users.id in MySQL
    username:    { type: String, required: true },
    is_extra:    { type: Boolean, default: false },    // true = held as extra player
    is_verified: { type: Boolean, default: false },    // admin verifies before game
    joined_at:   { type: Date, default: Date.now },
}, { _id: false });

const TeamSchema = new mongoose.Schema({
    team_id:       { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    team_name:     { type: String, required: true },
    leader_user_id:{ type: Number, required: true },   // references users.id in MySQL
    players:       [PlayerSchema],                     // max 5 confirmed + 1 extra
    is_confirmed:  { type: Boolean, default: false },  // admin confirms team
    registered_at: { type: Date, default: Date.now },
}, { _id: false });

const RoomSchema = new mongoose.Schema({
    room_id:      { type: String, default: null },
    password:     { type: String, default: null },
    published_at: { type: Date, default: null },
    published_by: { type: Number, default: null },     // admin id
}, { _id: false });

const ScoreSchema = new mongoose.Schema({
    team_id:    { type: mongoose.Schema.Types.ObjectId, required: true },
    team_name:  { type: String, required: true },
    score:      { type: Number, default: 0 },
    rank:       { type: Number, default: null },
    raw_data:   { type: mongoose.Schema.Types.Mixed }, // script result goes here
    updated_at: { type: Date, default: Date.now },
}, { _id: false });

// ─── Main Tournament Schema ───────────────────────────────────────────────────

const TournamentSchema = new mongoose.Schema({

    // Basic Info — set by admin at creation
    title:       { type: String, required: true, trim: true },
    game:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    banner_url:  { type: String, default: null },       // Cloudinary banner image

    // Who created it
    admin_id:    { type: Number, required: true },      // references admins.id in MySQL
    admin_name:  { type: String, required: true },

    // Status lifecycle:
    // draft → registration_open → registration_closed → live → completed → cancelled
    status: {
        type: String,
        enum: ["draft", "registration_open", "registration_closed", "live", "completed", "cancelled"],
        default: "draft",
    },

    // Registration details
    registration: { type: RegistrationSchema, required: true },

    // Schedule
    schedule: {
        start_date: { type: Date, required: true },
        end_date:   { type: Date, required: true },
    },

    // Prize pool
    prize_pool: {
        total:        { type: Number, default: 0 },
        currency:     { type: String, default: "INR" },
        distribution: [PrizeDistributionSchema],
    },

    // Room credentials — published by admin before game starts
    room: { type: RoomSchema, default: () => ({}) },

    // Registered teams (max 12 confirmed + extras held separately)
    teams: [TeamSchema],

    // Total registration count (confirmed + extras)
    total_entries: { type: Number, default: 0 },

    // Scores — populated after game via score script
    scores: [ScoreSchema],

    // Winner
    winner: {
        team_id:   { type: mongoose.Schema.Types.ObjectId, default: null },
        team_name: { type: String, default: null },
    },

    // Tracks if admin MySQL record has been updated after tournament ends
    admin_record_updated: { type: Boolean, default: false },

}, { timestamps: true }); // adds createdAt and updatedAt automatically

// ─── Indexes ──────────────────────────────────────────────────────────────────
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ admin_id: 1 });
TournamentSchema.index({ "schedule.start_date": 1 });
TournamentSchema.index({ "registration.end_date": 1 });

module.exports = mongoose.model("Tournament", TournamentSchema);
const mongoose = require("mongoose");

// ─── Sub Schemas ──────────────────────────────────────────────────────────────

const PrizeDistributionSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    amount:   { type: Number, required: true },
}, { _id: false });

const RegistrationSchema = new mongoose.Schema({
    start_date:   { type: Date, required: true },
    end_date:     { type: Date, required: true },
    max_teams:    { type: Number, default: 12 },
    max_per_team: { type: Number, default: 5 },
    max_entries:  { type: Number, default: 60 },
    entry_fee:    { type: Number, default: 0 },
    is_free:      { type: Boolean, default: true },
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
    user_id:     { type: Number, required: true },
    username:    { type: String, required: true },
    is_extra:    { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
    joined_at:   { type: Date, default: Date.now },
}, { _id: false });

const TeamSchema = new mongoose.Schema({
    team_id:        { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    team_name:      { type: String, required: true },
    leader_user_id: { type: Number, required: true },
    players:        [PlayerSchema],
    is_confirmed:   { type: Boolean, default: false },
    registered_at:  { type: Date, default: Date.now },
}, { _id: false });

const RoomSchema = new mongoose.Schema({
    room_id:      { type: String, default: null },
    password:     { type: String, default: null },
    published_at: { type: Date, default: null },
    published_by: { type: Number, default: null },
}, { _id: false });

// ─── Score Sub Schemas (Free Fire scoring system) ─────────────────────────────

const MatchTeamResultSchema = new mongoose.Schema({
    teamId:          { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    teamName:        { type: String, required: true },
    position:        { type: Number, required: true, min: 1, max: 12 },
    kills:           { type: Number, required: true, min: 0 },
    placementPoints: { type: Number, required: true },
    killPoints:      { type: Number, required: true },
    totalPoints:     { type: Number, required: true },
}, { _id: false });

const MatchScoreSchema = new mongoose.Schema({
    matchNumber: { type: Number, required: true },
    teams:       { type: [MatchTeamResultSchema], required: true },
}, { _id: false });

const WinnerSchema = new mongoose.Schema({
    team_id:     { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    team_name:   { type: String, default: null },
    totalPoints: { type: Number, default: null },
    prizeWon:    { type: Number, default: null },
}, { _id: false });

const WaitlistSchema = new mongoose.Schema({
    team_id:        { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    team_name:      { type: String },
    leader_user_id: { type: Number },
    joined_at:      { type: Date, default: Date.now },
}, { _id: false });

// ─── Main Tournament Schema ───────────────────────────────────────────────────

const TournamentSchema = new mongoose.Schema({

    title:       { type: String, required: true, trim: true },
    game:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    banner_url:  { type: String, default: null },

    admin_id:   { type: Number, required: true },
    admin_name: { type: String, required: true },

    status: {
        type: String,
        enum: ["draft", "registration_open", "registration_closed", "live", "completed", "cancelled"],
        default: "draft",
    },

    registration: { type: RegistrationSchema, required: true },

    schedule: {
        start_date: { type: Date, required: true },
        end_date:   { type: Date, required: true },
    },

    prize_pool: {
        total:        { type: Number, default: 0 },
        currency:     { type: String, default: "INR" },
        distribution: [PrizeDistributionSchema],
    },

    room: { type: RoomSchema, default: () => ({}) },

    teams:         [TeamSchema],
    total_entries: { type: Number, default: 0 },
    waitlist:      [WaitlistSchema],

    // ✅ Updated: now uses MatchScoreSchema (position + kills + calculated points per match)
    scores: { type: [MatchScoreSchema], default: [] },

    // ✅ Updated: now stores totalPoints and prizeWon
    winner: { type: WinnerSchema, default: () => ({}) },

    admin_record_updated: { type: Boolean, default: false },

}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────

TournamentSchema.index({ status: 1 });
TournamentSchema.index({ admin_id: 1 });
TournamentSchema.index({ "schedule.start_date": 1 });
TournamentSchema.index({ "registration.end_date": 1 });

module.exports = mongoose.model("Tournament", TournamentSchema);
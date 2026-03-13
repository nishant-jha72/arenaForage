import mongoose from "mongoose";

// ─── Prize Pool Entry ────────────────────────────────────────────────────────
const PrizeEntrySchema = new mongoose.Schema(
  {
    position: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

// ─── Roster Slot ─────────────────────────────────────────────────────────────
// Each slot maps directly to one invite token
const RosterSlotSchema = new mongoose.Schema(
  {
    slotNumber: { type: Number, required: true },       // 1-4 = primary, 5 = extra
    role: { type: String, enum: ["primary", "extra"], required: true },
    inviteToken: { type: String, default: null },       // uuid — the shareable token
    status: {
      type: String,
      enum: ["empty", "pending", "joined"],
      default: "empty",
    },
    userId: { type: Number, default: null },            // MySQL users.id
    username: { type: String, default: null },
    email: { type: String, default: null },
    isVerified: { type: Boolean, default: false },      // admin verifies before game
    joinedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ─── Tournament Registration (one per team) ──────────────────────────────────
const RegistrationSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },
    teamTag: { type: String, required: true, maxlength: 5 },
    logo_url: { type: String, default: null },

    // Leader info (auto-fills slot 1)
    leaderUserId: { type: Number, required: true },
    leaderUsername: { type: String, required: true },

    // Confirmation by admin
    isConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },

    // 5 slots: primary (1-4) + extra (5)
    roster: [RosterSlotSchema],

    // Running count of joined players (excludes leader)
    joinedCount: { type: Number, default: 1 }, // starts at 1 because leader is auto-joined

    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// ─── Score Entry ─────────────────────────────────────────────────────────────
const ScoreSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId },
    teamName: { type: String },
    kills: { type: Number, default: 0 },
    placement: { type: Number },
    placementPoints: { type: Number, default: 0 },
    killPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    prizeWon: { type: Number, default: 0 },
    rank: { type: Number },
  },
  { _id: false }
);

// ─── Waitlist Entry ──────────────────────────────────────────────────────────
const WaitlistSchema = new mongoose.Schema(
  {
    teamName: { type: String },
    leaderUserId: { type: Number },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main Tournament Schema ──────────────────────────────────────────────────
const TournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    game: { type: String, required: true },
    description: { type: String, default: "" },
    banner_url: { type: String, default: null },

    // Admin who created it (MySQL admins.id)
    admin_id: { type: Number, required: true },
    admin_name: { type: String, required: true },

    status: {
      type: String,
      enum: [
        "draft",
        "registration_open",
        "registration_closed",
        "live",
        "completed",
        "cancelled",
      ],
      default: "draft",
    },

    registration: {
      opens_at: { type: Date, default: null },
      closes_at: { type: Date, default: null },
      entry_fee: { type: Number, default: 0 },
      max_teams: { type: Number, default: 12 },
      max_players_per_team: { type: Number, default: 5 },
      max_total_entries: { type: Number, default: 60 },
    },

    schedule: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, default: null },
    },

    prize_pool: {
      total: { type: Number, default: 0 },
      distribution: [PrizeEntrySchema],
    },

    room: {
      room_id: { type: String, default: null },
      password: { type: String, default: null },
      published_at: { type: Date, default: null },
    },

    // All team registrations
    teams: [RegistrationSchema],

    total_entries: { type: Number, default: 0 },

    scores: [ScoreSchema],

    winner: {
      registrationId: { type: mongoose.Schema.Types.ObjectId, default: null },
      teamName: { type: String, default: null },
    },

    waitlist: [WaitlistSchema],

    admin_record_updated: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model("Tournament", TournamentSchema);

export default Tournament;
# 📋 Dev Log — March 10, 2026

## ArenaForage — Tournament Microservice

---

## 🏗️ Architecture Overview

```
arenaForage/
├── frontend/        ← React/Next.js (coming later)
├── backend/         ← Main MySQL service (Port 5000)
└── tournaments/     ← MongoDB microservice (Port 5001)
```

Both services run independently. They communicate via HTTP using a shared `INTERNAL_SECRET` header for service-to-service calls.

---

## 📦 Packages Installed

```bash
npm install express mongoose axios nodemailer helmet cors cookie-parser express-rate-limit dotenv
```

---

## 🗂️ Folder Structure

```
tournaments/
├── Controllers/
│   ├── tournament.controller.js
│   └── team.controller.js
├── Models/
│   ├── tournament.model.js
│   └── team.model.js
├── Routes/
│   ├── tournament.routes.js
│   └── internal.routes.js
├── Middleware/
│   ├── user.auth.middleware.js    ← copied from backend
│   └── admin.auth.middleware.js   ← copied from backend
├── Utils/
│   ├── ApiError.utils.js          ← copied from backend
│   └── ApiResponse.utils.js       ← copied from backend
├── .env
└── server.js
```

---

## 🔑 Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arenaForage?retryWrites=true&w=majority
MAIN_SERVICE_URL=http://localhost:5000
INTERNAL_SECRET=some_shared_secret_between_services
ACCESS_TOKEN_SECRET=same_as_backend
REFRESH_TOKEN_SECRET=same_as_backend
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5001
```

> `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must match the backend `.env` exactly — both services share the same JWT secrets to verify user and admin tokens.

---

## 🍃 MongoDB Schemas

### Tournament Schema — `tournament.model.js`

| Field | Type | Purpose |
|-------|------|---------|
| `title` | String | Tournament name |
| `game` | String | Game being played |
| `description` | String | Tournament details |
| `banner_url` | String | Cloudinary banner image |
| `admin_id` | Number | References `admins.id` in MySQL |
| `admin_name` | String | Admin display name |
| `status` | Enum | Tournament lifecycle status |
| `registration` | Object | Dates, fees, limits |
| `schedule` | Object | Start and end dates |
| `prize_pool` | Object | Total + distribution per position |
| `room` | Object | Room ID + password + published info |
| `teams` | Array | Registered teams with players |
| `total_entries` | Number | Running count of all entries |
| `scores` | Array | Score data submitted by admin |
| `winner` | Object | Winning team after completion |
| `admin_record_updated` | Boolean | Tracks if MySQL admin record was updated |

**Status Lifecycle:**
```
draft → registration_open → registration_closed → live → completed
                                                       ↘ cancelled
```

**Registration Rules:**
- Max 12 confirmed teams
- Max 5 verified players per team
- 6th slot per team = extra player (held in reserve)
- Max 60 total entries across all teams

---

### Team Schema — `team.model.js`

| Field | Type | Purpose |
|-------|------|---------|
| `name` | String | Team display name |
| `tag` | String | Short tag max 5 chars e.g. "ALPH" |
| `logo_url` | String | Cloudinary team logo |
| `leader_user_id` | Number | References `users.id` in MySQL |
| `leader_username` | String | Leader display name |
| `members` | Array | All team members including leader |
| `tournament_history` | Array | Past tournaments with result and rank |
| `is_active` | Boolean | False when team is disbanded |

---

## 🎮 Tournament Lifecycle Flow

```
1. Admin creates tournament          → status: draft
2. Admin opens registration          → status: registration_open
3. Teams register (max 60 entries)
4. Admin confirms teams (max 12)
5. Admin verifies players (max 5 per team)
6. Admin publishes Room ID + Password → status: registration_closed
   → Emails all confirmed team leaders automatically
7. Admin sets live at x:00pm         → status: live
8. Game is played
9. Admin submits scores (via script)
10. Admin completes at x:01pm        → status: completed
    → Updates admin tournaments_organised + revenue in MySQL
    → Updates team tournament_history in MongoDB
```

---

## 🛣️ All Routes

### Tournament Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/tournaments` | ❌ | Get all tournaments (filterable) |
| `GET` | `/api/tournaments/:id` | ❌ | Get single tournament |
| `GET` | `/api/tournaments/:id/leaderboard` | ❌ | Get scores and winner |
| `POST` | `/api/tournaments/:id/register` | User ✅ | Team leader registers team |
| `GET` | `/api/tournaments/:id/room` | User ✅ | Team leader gets room credentials |
| `POST` | `/api/tournaments` | Admin ✅ | Create tournament |
| `PATCH` | `/api/tournaments/:id` | Admin ✅ | Update tournament (draft only) |
| `PATCH` | `/api/tournaments/:id/open-registration` | Admin ✅ | Open registration |
| `PATCH` | `/api/tournaments/:id/publish-room` | Admin ✅ | Publish room credentials |
| `PATCH` | `/api/tournaments/:id/live` | Admin ✅ | Set tournament live |
| `PATCH` | `/api/tournaments/:id/complete` | Admin ✅ | Complete tournament |
| `PATCH` | `/api/tournaments/:id/cancel` | Admin ✅ | Cancel tournament |
| `PATCH` | `/api/tournaments/:id/teams/:teamId/confirm` | Admin ✅ | Confirm a team |
| `PATCH` | `/api/tournaments/:id/teams/:teamId/players/:userId/verify` | Admin ✅ | Verify a player |
| `POST` | `/api/tournaments/:id/scores` | Admin ✅ | Submit score data |

### Team Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/teams/:id` | ❌ | Get team by ID |
| `POST` | `/api/teams` | User ✅ | Create a team |
| `GET` | `/api/teams/my` | User ✅ | Get my current team |
| `POST` | `/api/teams/invite` | User ✅ | Invite a member (leader only) |
| `DELETE` | `/api/teams/members/:userId` | User ✅ | Remove a member (leader only) |
| `DELETE` | `/api/teams/leave` | User ✅ | Leave a team (members only) |
| `DELETE` | `/api/teams` | User ✅ | Disband team (leader only) |

### Internal Routes (service-to-service only)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/internal/tournament-stats` | Super admin fetches tournament counts |

---

## 🔁 Service to Service Communication

### Tournament Service → Main Service

**After tournament completes** — updates admin record:
```
POST http://localhost:5000/api/internal/admin/record-tournament
Headers: x-internal-secret: INTERNAL_SECRET
Body: { adminId, revenueEarned }
```

**When inviting a team member** — verifies user exists:
```
GET http://localhost:5000/api/internal/users/:id
Headers: x-internal-secret: INTERNAL_SECRET
```

**When publishing room** — fetches team leader email:
```
GET http://localhost:5000/api/internal/users/:id
Headers: x-internal-secret: INTERNAL_SECRET
```

### Main Service → Tournament Service

**Super admin dashboard** — fetches tournament stats:
```
GET http://localhost:5001/api/internal/tournament-stats
Headers: x-internal-secret: INTERNAL_SECRET
```

---

## 📬 Email Triggers

| Trigger | Recipients | Content |
|---------|-----------|---------|
| Room published | All confirmed team leaders | Room ID + Password + start time |

---

## 🧪 How to Test

**Run both services simultaneously:**
```bash
# Terminal 1
cd arenaForage/backend && npm run dev    # Port 5000

# Terminal 2
cd arenaForage/tournaments && npm run dev  # Port 5001
```

**Testing order in Postman:**
```
1. POST  localhost:5000/api/users/login       → get user token
2. POST  localhost:5000/api/admin/login       → get admin token
3. POST  localhost:5001/api/teams             → create team (user token)
4. POST  localhost:5001/api/teams/invite      → invite members
5. POST  localhost:5001/api/tournaments       → create tournament (admin token)
6. PATCH localhost:5001/api/tournaments/:id/open-registration
7. POST  localhost:5001/api/tournaments/:id/register  → team registers
8. PATCH localhost:5001/api/tournaments/:id/teams/:id/confirm
9. PATCH localhost:5001/api/tournaments/:id/teams/:id/players/:id/verify
10. PATCH localhost:5001/api/tournaments/:id/publish-room
11. PATCH localhost:5001/api/tournaments/:id/live
12. POST  localhost:5001/api/tournaments/:id/scores
13. PATCH localhost:5001/api/tournaments/:id/complete
```

---

## 🔜 Remaining Tasks

- [ ] Connect MongoDB Atlas (get connection string from atlas.mongodb.com)
- [ ] Score calculation script (to be provided later)
- [ ] Frontend development
- [ ] Deploy both services
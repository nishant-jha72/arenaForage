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


# 📋 Dev Log — March 11, 2026

## ArenaForage — New Features & Improvements

---

## 🏗️ Project Structure

```
arenaForage/
├── frontend/          ← Coming soon
├── backend/           ← Main MySQL service (Port 5000)
└── tournament/        ← MongoDB microservice (Port 5001)
```

---

## ✅ Features Built Today

### 1. 🔔 Notification System (Backend)

**Model — `notification.model.js`**

| Method | Purpose |
|--------|---------|
| `create({ userId, userType, title, message, type })` | Create single notification |
| `createBulk(notifications)` | Create notifications for multiple users at once |
| `getByUser(userId, userType, { page, limit })` | Get paginated notifications with unread count |
| `markAsRead(id, userId, userType)` | Mark single notification as read |
| `markAllAsRead(userId, userType)` | Mark all as read |
| `deleteById(id, userId)` | Delete a notification |
| `getUnreadCount(userId, userType)` | Get unread count badge number |

**Controller — `notification.controller.js`**
- Works for both users and admins via same controller
- Detects `req.user` vs `req.admin` automatically
- Exports `createAndEmailNotification` helper for other controllers to use

**Routes added to user and admin:**

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/notifications` | Get all notifications |
| `GET` | `/notifications/unread-count` | Get unread badge count |
| `PATCH` | `/notifications/read-all` | Mark all as read |
| `PATCH` | `/notifications/:id/read` | Mark one as read |
| `DELETE` | `/notifications/:id` | Delete notification |

**DB Migration:**
```sql
CREATE TABLE IF NOT EXISTS notifications (
    id         INT           AUTO_INCREMENT PRIMARY KEY,
    user_id    INT           NOT NULL,
    user_type  VARCHAR(10)   NOT NULL DEFAULT 'user',
    title      VARCHAR(255)  NOT NULL,
    message    TEXT          NOT NULL,
    type       VARCHAR(50)   NOT NULL DEFAULT 'general',
    is_read    TINYINT(1)    NOT NULL DEFAULT 0,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id, user_type),
    INDEX idx_unread (user_id, user_type, is_read)
);
```

---

### 2. 👤 Player Profile System (Backend)

**Controller — `profile.controller.js`**

| Controller | Route | Auth | Purpose |
|------------|-------|------|---------|
| `getFullProfile` | `GET /api/users/profile/full` | ✅ User | Own profile + tournament history + team + stats |
| `getPublicProfile` | `GET /api/users/profile/public/:id` | ❌ | Anyone can view a player's public profile |

**Stats returned:**
- Total tournaments played
- Wins / Losses
- Win rate percentage
- Current team info
- Full tournament history

Data is fetched from both MySQL (user info) and tournament service (history + team) via internal HTTP calls.

---

### 3. 📊 Analytics System (Backend)

**Controller — `analytics.controller.js`**

**Admin Analytics** — `GET /api/admin/analytics`
- Total tournaments hosted
- Total revenue earned
- Revenue over last 6 months (graph data)
- Tournament status breakdown (draft/live/completed)
- Upcoming tournaments list

**Super Admin Analytics** — `GET /api/superadmin/analytics`
- Platform-wide user stats (total, banned, active)
- Platform-wide admin stats (total, verified, pending)
- User growth per month (last 6 months)
- Admin growth per month (last 6 months)
- Top 10 admins by revenue
- Total platform revenue + commission earned
- Tournament stats from tournament service

---

### 4. 💰 Commission System (Backend)

**Added to `superAdmin.controller.js`:**

`GET /api/superadmin/commission`

Returns:
- Commission rate (from `COMMISSION_RATE` env var)
- Total platform revenue
- Total commission owed
- Per-admin breakdown showing individual commission

**New env var:**
```env
COMMISSION_RATE=0.10   # 10% commission
```

**Added to `superAdmin.model.js`:**
- `getCommissionStats()` method

---

### 5. 🏆 Tournament Bracket & Results Page (Tournament Service)

**Controller — `Bracket.controller.js`**

| Controller | Route | Auth | Purpose |
|------------|-------|------|---------|
| `getResults` | `GET /api/tournaments/:id/results` | ❌ | Full results with scores, ranks, prize money |
| `getBracket` | `GET /api/tournaments/:id/bracket` | ❌ | Team bracket view (pre-game or live/completed) |

**Results page returns:**
- Tournament info (title, game, admin, date)
- Winner
- Full prize pool distribution
- Ranked scores with prize money per position
- Team summary with verified player list

**Bracket returns:**
- Before game: registered teams + confirmation status
- During/after game: teams sorted by rank with scores

---

### 6. ⏳ Waitlist System (Tournament Service)

**Controller — `Waitlist.controller.js`**

| Controller | Route | Auth | Purpose |
|------------|-------|------|---------|
| `joinWaitlist` | `POST /api/tournaments/:id/waitlist` | ✅ User | Join waitlist when tournament is full |
| `promoteFromWaitlist` | `PATCH /api/tournaments/:id/waitlist/promote` | ✅ Admin | Promote next team from waitlist |

**How it works:**
- Tournament fills up at 60 entries
- Teams can join waitlist after that
- When a spot opens, admin promotes next team in line
- Promoted team leader gets notified automatically via main service

**Added to `Tournament.model.js`:**
```javascript
waitlist: [{
    team_id:        { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    team_name:      { type: String },
    leader_user_id: { type: Number },
    joined_at:      { type: Date, default: Date.now },
}],
```

---

### 7. 🔁 Internal Routes Updated

**Main Backend — `internal.routes.js`**

| Method | Route | Called By | Purpose |
|--------|-------|-----------|---------|
| `GET` | `/api/internal/users/:id` | Tournament service | Verify user exists + ban status |
| `GET` | `/api/internal/admins/:id` | Tournament service | Verify admin exists + ban status |
| `POST` | `/api/internal/admin/record-tournament` | Tournament service | Update admin revenue + count |
| `POST` | `/api/internal/notify` | Tournament service | Create notification + send email |

**Tournament Service — `internal.routes.js`**

| Method | Route | Called By | Purpose |
|--------|-------|-----------|---------|
| `GET` | `/api/internal/tournament-stats` | Main service | Platform tournament counts |
| `GET` | `/api/internal/players/:userId/history` | Main service | Player tournament history |
| `GET` | `/api/internal/players/:userId/team` | Main service | Player current team |
| `GET` | `/api/internal/analytics/admin/:adminId/revenue` | Main service | Admin revenue over time |
| `GET` | `/api/internal/analytics/admin/:adminId/breakdown` | Main service | Admin tournament breakdown |
| `GET` | `/api/internal/analytics/admin/:adminId/upcoming` | Main service | Admin upcoming tournaments |

---

## 📁 Files Created / Modified Today

### Backend (`arenaForage/backend/`)
```
├── Models/
│   └── notification.model.js        ← new
├── Controllers/
│   ├── notification.controller.js   ← new
│   ├── profile.controller.js        ← new
│   └── analytics.controller.js      ← new
└── Routes/
    ├── user.routes.js               ← updated
    ├── admin.routes.js              ← updated
    ├── superAdmin.routes.js         ← updated
    └── internal.routes.js           ← updated
```

### Tournament Service (`arenaForage/tournament/`)
```
├── Controller/
│   ├── Bracket.controller.js        ← new
│   └── Waitlist.controller.js       ← new
└── Routes/
    ├── Tournament.routes.js         ← updated
    └── internal.routes.js           ← updated
```

---

## 🔑 New Environment Variables

### Backend
```env
TOURNAMENT_SERVICE_URL=http://localhost:5001
COMMISSION_RATE=0.10
```

### Tournament Service
```env
MAIN_SERVICE_URL=http://localhost:5000
INTERNAL_SECRET=your_shared_secret
```

---

## 🛣️ Complete Route Summary (All Services)

### User Routes (`/api/users`)
| Method | Route | Auth |
|--------|-------|------|
| `POST` | `/register` | ❌ |
| `GET` | `/verify-email` | ❌ |
| `POST` | `/login` | ❌ |
| `POST` | `/refresh-token` | ❌ |
| `POST` | `/forgot-password` | ❌ |
| `POST` | `/reset-password` | ❌ |
| `GET` | `/profile/public/:id` | ❌ |
| `POST` | `/logout` | ✅ |
| `GET` | `/profile` | ✅ |
| `GET` | `/profile/full` | ✅ |
| `PATCH` | `/profile` | ✅ |
| `PATCH` | `/change-password` | ✅ |
| `DELETE` | `/account` | ✅ |
| `GET` | `/notifications` | ✅ |
| `GET` | `/notifications/unread-count` | ✅ |
| `PATCH` | `/notifications/read-all` | ✅ |
| `PATCH` | `/notifications/:id/read` | ✅ |
| `DELETE` | `/notifications/:id` | ✅ |

### Admin Routes (`/api/admin`)
| Method | Route | Auth | SA Verified |
|--------|-------|------|-------------|
| `POST` | `/register` | ❌ | ❌ |
| `GET` | `/verify-email` | ❌ | ❌ |
| `POST` | `/login` | ❌ | ❌ |
| `POST` | `/refresh-token` | ❌ | ❌ |
| `POST` | `/forgot-password` | ❌ | ❌ |
| `POST` | `/reset-password` | ❌ | ❌ |
| `POST` | `/logout` | ✅ | ❌ |
| `GET` | `/profile` | ✅ | ❌ |
| `GET` | `/notifications` | ✅ | ❌ |
| `GET` | `/notifications/unread-count` | ✅ | ❌ |
| `PATCH` | `/notifications/read-all` | ✅ | ❌ |
| `PATCH` | `/notifications/:id/read` | ✅ | ❌ |
| `DELETE` | `/notifications/:id` | ✅ | ❌ |
| `PATCH` | `/profile` | ✅ | ✅ |
| `PATCH` | `/change-password` | ✅ | ✅ |
| `DELETE` | `/account` | ✅ | ✅ |
| `GET` | `/analytics` | ✅ | ✅ |

### Super Admin Routes (`/api/superadmin`)
| Method | Route | Auth |
|--------|-------|------|
| `POST` | `/create` | seedSecret or SA token |
| `POST` | `/login` | ❌ |
| `POST` | `/refresh-token` | ❌ |
| `POST` | `/logout` | ✅ |
| `GET` | `/profile` | ✅ |
| `PATCH` | `/change-password` | ✅ |
| `GET` | `/dashboard` | ✅ |
| `GET` | `/analytics` | ✅ |
| `GET` | `/commission` | ✅ |
| `GET` | `/all` | ✅ |
| `DELETE` | `/:id` | ✅ |
| `GET` | `/users` | ✅ |
| `GET` | `/users/:id` | ✅ |
| `DELETE` | `/users/:id` | ✅ |
| `PATCH` | `/users/:id/ban` | ✅ |
| `PATCH` | `/users/:id/unban` | ✅ |
| `GET` | `/admins` | ✅ |
| `GET` | `/admins/:id` | ✅ |
| `PATCH` | `/admins/:id/approve` | ✅ |
| `PATCH` | `/admins/:id/revoke` | ✅ |
| `PATCH` | `/admins/:id/ban` | ✅ |
| `PATCH` | `/admins/:id/unban` | ✅ |
| `DELETE` | `/admins/:id` | ✅ |
| `GET` | `/tournaments/stats` | ✅ |
| `GET` | `/tournaments/today` | ✅ |
| `GET` | `/tournaments/upcoming` | ✅ |

### Tournament Routes (`/api`)
| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/tournaments` | ❌ |
| `GET` | `/tournaments/:id` | ❌ |
| `GET` | `/tournaments/:id/leaderboard` | ❌ |
| `GET` | `/tournaments/:id/results` | ❌ |
| `GET` | `/tournaments/:id/bracket` | ❌ |
| `POST` | `/tournaments/:id/register` | ✅ User |
| `POST` | `/tournaments/:id/waitlist` | ✅ User |
| `GET` | `/tournaments/:id/room` | ✅ User |
| `POST` | `/tournaments` | ✅ Admin |
| `PATCH` | `/tournaments/:id` | ✅ Admin |
| `PATCH` | `/tournaments/:id/open-registration` | ✅ Admin |
| `PATCH` | `/tournaments/:id/publish-room` | ✅ Admin |
| `PATCH` | `/tournaments/:id/live` | ✅ Admin |
| `PATCH` | `/tournaments/:id/complete` | ✅ Admin |
| `PATCH` | `/tournaments/:id/cancel` | ✅ Admin |
| `PATCH` | `/tournaments/:id/waitlist/promote` | ✅ Admin |
| `PATCH` | `/tournaments/:id/teams/:teamId/confirm` | ✅ Admin |
| `PATCH` | `/tournaments/:id/teams/:teamId/players/:userId/verify` | ✅ Admin |
| `POST` | `/tournaments/:id/scores` | ✅ Admin |
| `GET` | `/teams/:id` | ❌ |
| `POST` | `/teams` | ✅ User |
| `GET` | `/teams/my` | ✅ User |
| `POST` | `/teams/invite` | ✅ User |
| `DELETE` | `/teams/leave` | ✅ User |
| `DELETE` | `/teams` | ✅ User |
| `DELETE` | `/teams/members/:userId` | ✅ User |

---

## 🔜 Remaining Tasks
- [ ] Score calculation script (to be provided by client)
- [ ] Payment gateway (Razorpay/Stripe for paid tournaments)
- [ ] Frontend development
- [ ] Jest + Supertest automated tests
- [ ] Deploy both services
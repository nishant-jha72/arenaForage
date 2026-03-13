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





# 📋 ArenaForage — Backend Documentation

## Tech Stack — `Node.js + Express + MySQL`

---

## 🏗️ Architecture Overview

```
arenaForage/
├── frontend/          ← React/Vite (Port 5173)
├── backend/           ← Main MySQL service (Port 5000)
└── tournament/        ← MongoDB microservice (Port 5001)
```

Both backend services run independently and communicate via HTTP using a shared `INTERNAL_SECRET` header for service-to-service calls.

---

## 📦 Packages Installed

```bash
npm install express mysql2 bcrypt jsonwebtoken nodemailer cloudinary multer
npm install helmet express-rate-limit cookie-parser cors dotenv
```

---

## 🗂️ Folder Structure

```
backend/
├── Controllers/
│   ├── user.controller.js
│   ├── admin.controller.js
│   ├── superAdmin.controller.js
│   ├── notification.controller.js
│   ├── profile.controller.js
│   └── analytics.controller.js
├── Models/
│   ├── user.model.js
│   ├── admin.model.js
│   ├── superAdmin.model.js
│   └── notification.model.js
├── Middleware/
│   ├── user.auth.middleware.js
│   ├── admin.auth.middleware.js
│   └── superAdmin.auth.middleware.js
├── Routes/
│   ├── user.routes.js
│   ├── admin.routes.js
│   ├── superAdmin.routes.js
│   └── internal.routes.js
├── Utils/
│   ├── ApiError.utils.js
│   └── ApiResponse.utils.js
├── .env
└── server.js
```

---

## ✅ User MVC

### Model — `user.model.js`

| Method | Purpose |
|--------|---------|
| `create({...})` | Register new user |
| `findByEmail(email)` | Lookup by email |
| `findById(id)` | Fetch user by primary key |
| `update(id, fields)` | Generic update — accepts any column map |
| `updatePassword(id, newPassword)` | Hashes new password internally before saving |
| `deleteById(id)` | Hard delete user row |
| `comparePassword(input, hash)` | bcrypt comparison |
| `verifyEmail(id)` | Sets emailVerified = YES, clears token |

---

### Controller — `user.controller.js`

| Controller | Route | Access |
|------------|-------|--------|
| `register` | `POST /api/users/register` | Public |
| `verifyEmail` | `GET /api/users/verify-email` | Public |
| `login` | `POST /api/users/login` | Public |
| `logout` | `POST /api/users/logout` | Protected |
| `refreshAccessToken` | `POST /api/users/refresh-token` | Public |
| `getProfile` | `GET /api/users/profile` | Protected |
| `getFullProfile` | `GET /api/users/profile/full` | Protected |
| `getPublicProfile` | `GET /api/users/profile/public/:id` | Public |
| `updateProfile` | `PATCH /api/users/profile` | Protected |
| `changePassword` | `PATCH /api/users/change-password` | Protected |
| `forgotPassword` | `POST /api/users/forgot-password` | Public |
| `resetPassword` | `POST /api/users/reset-password` | Public |
| `deleteAccount` | `DELETE /api/users/account` | Protected |

---

### Database — `users` table

```sql
CREATE TABLE IF NOT EXISTS users (
    id                  INT           AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100)  NOT NULL,
    email               VARCHAR(255)  NOT NULL UNIQUE,
    password            VARCHAR(255)  NOT NULL,
    profile_picture     VARCHAR(512)  DEFAULT NULL,
    emailVerified       VARCHAR(3)    NOT NULL DEFAULT 'NO',
    isBanned            TINYINT(1)    NOT NULL DEFAULT 0,
    refreshToken        TEXT          DEFAULT NULL,
    verificationToken   VARCHAR(255)  DEFAULT NULL,
    verificationExpiry  DATETIME      DEFAULT NULL,
    resetToken          VARCHAR(255)  DEFAULT NULL,
    resetExpiry         DATETIME      DEFAULT NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Admin MVC

### Model — `admin.model.js`

| Method | Purpose |
|--------|---------|
| `create({...})` | Register new admin with all fields |
| `findByEmail(email)` | Lookup by email |
| `findById(id)` | Lookup by ID |
| `update(id, fields)` | Generic column update |
| `updatePassword(id, newPassword)` | Hashes + saves new password |
| `verifyEmail(id)` | Sets emailVerified = YES, clears token |
| `deleteById(id)` | Hard delete admin row |
| `verifybySuperAdmin(id)` | Sets superAdminVerified = YES |
| `recordTournament(id, revenue)` | Increments tournament count + adds revenue |

---

### Controller — `admin.controller.js`

| Controller | Route | Access | SA Verified |
|------------|-------|--------|-------------|
| `register` | `POST /api/admin/register` | Public | ❌ |
| `verifyEmail` | `GET /api/admin/verify-email` | Public | ❌ |
| `login` | `POST /api/admin/login` | Public | ❌ |
| `logout` | `POST /api/admin/logout` | Protected | ❌ |
| `refreshAccessToken` | `POST /api/admin/refresh-token` | Public | ❌ |
| `getProfile` | `GET /api/admin/profile` | Protected | ❌ |
| `updateProfile` | `PATCH /api/admin/profile` | Protected | ✅ |
| `changePassword` | `PATCH /api/admin/change-password` | Protected | ✅ |
| `forgotPassword` | `POST /api/admin/forgot-password` | Public | ❌ |
| `resetPassword` | `POST /api/admin/reset-password` | Public | ❌ |
| `deleteAccount` | `DELETE /api/admin/account` | Protected | ✅ |
| `getAnalytics` | `GET /api/admin/analytics` | Protected | ✅ |

---

### Middleware — `admin.auth.middleware.js`

**`adminAuthMiddleware`**
- Reads `adminAccessToken` from cookies or `Authorization` header
- Verifies JWT and checks `role === "admin"`
- Sets `req.admin` for downstream controllers

**`requireSuperAdminVerification`**
- Sits on top of `adminAuthMiddleware` on action routes
- Blocks request with `403` if `superAdminVerified !== 'YES'`
- Unverified admins can login and view profile but cannot perform any actions

---

### Database — `admins` table

```sql
CREATE TABLE IF NOT EXISTS admins (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    name                  VARCHAR(100)      NOT NULL,
    email                 VARCHAR(255)      NOT NULL UNIQUE,
    password              VARCHAR(255)      NOT NULL,
    profile_picture       VARCHAR(512)      DEFAULT NULL,
    organization_name     VARCHAR(255)      DEFAULT NULL,
    phone_number          VARCHAR(20)       DEFAULT NULL,
    instagram             VARCHAR(255)      DEFAULT NULL,
    twitter               VARCHAR(255)      DEFAULT NULL,
    facebook              VARCHAR(255)      DEFAULT NULL,
    linkedin              VARCHAR(255)      DEFAULT NULL,
    emailVerified         VARCHAR(3)        NOT NULL DEFAULT 'NO',
    superAdminVerified    VARCHAR(3)        NOT NULL DEFAULT 'NO',
    isBanned              TINYINT(1)        NOT NULL DEFAULT 0,
    tournaments_organised INT               NOT NULL DEFAULT 0,
    revenue               DECIMAL(12, 2)    NOT NULL DEFAULT 0.00,
    refreshToken          TEXT              DEFAULT NULL,
    verificationToken     VARCHAR(255)      DEFAULT NULL,
    verificationExpiry    DATETIME          DEFAULT NULL,
    resetToken            VARCHAR(255)      DEFAULT NULL,
    resetExpiry           DATETIME          DEFAULT NULL,
    created_at            TIMESTAMP         DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Super Admin MVC

### Model — `superAdmin.model.js`

| Method | Purpose |
|--------|---------|
| `create({ name, email, password, createdBy })` | Create a new super admin |
| `findByEmail(email)` | Lookup by email |
| `findById(id)` | Lookup by ID |
| `findAll()` | Get all super admins (safe fields only) |
| `update(id, fields)` | Generic column update |
| `updatePassword(id, newPassword)` | Hash + save new password |
| `comparePassword(input, hash)` | bcrypt comparison |
| `deleteById(id)` | Hard delete super admin row |
| `getAllUsers({ page, limit, search })` | Paginated user list with search |
| `getUserById(id)` | Single user lookup |
| `banUser(id)` | Set isBanned = 1 |
| `unbanUser(id)` | Set isBanned = 0 |
| `deleteUser(id)` | Hard delete user |
| `getAllAdmins({ page, limit, search })` | Paginated admin list with search |
| `getAdminById(id)` | Single admin lookup |
| `approveAdmin(id)` | Set superAdminVerified = YES |
| `revokeAdmin(id)` | Set superAdminVerified = NO |
| `banAdmin(id)` | Ban + revoke admin approval |
| `unbanAdmin(id)` | Unban admin |
| `deleteAdmin(id)` | Hard delete admin + Cloudinary image |
| `getDashboardStats()` | Aggregate counts for users, admins, revenue, tournaments |
| `getTournamentStats()` | Today / upcoming / live / total tournament counts |
| `getUpcomingTournaments({ limit })` | Next N upcoming tournaments with organizer info |
| `getTodayTournaments()` | All tournaments starting today |
| `getCommissionStats()` | Per-admin commission breakdown |

---

### Controller — `superAdmin.controller.js`

| Controller | Route | Auth |
|------------|-------|------|
| `create` | `POST /api/superadmin/create` | seedSecret or SA token |
| `login` | `POST /api/superadmin/login` | ❌ |
| `logout` | `POST /api/superadmin/logout` | ✅ |
| `refreshAccessToken` | `POST /api/superadmin/refresh-token` | ❌ |
| `getProfile` | `GET /api/superadmin/profile` | ✅ |
| `changePassword` | `PATCH /api/superadmin/change-password` | ✅ |
| `getDashboard` | `GET /api/superadmin/dashboard` | ✅ |
| `getAnalytics` | `GET /api/superadmin/analytics` | ✅ |
| `getCommission` | `GET /api/superadmin/commission` | ✅ |
| `getAllSuperAdmins` | `GET /api/superadmin/all` | ✅ |
| `deleteSuperAdmin` | `DELETE /api/superadmin/:id` | ✅ |
| `getAllUsers` | `GET /api/superadmin/users` | ✅ |
| `getUserById` | `GET /api/superadmin/users/:id` | ✅ |
| `deleteUser` | `DELETE /api/superadmin/users/:id` | ✅ |
| `banUser` | `PATCH /api/superadmin/users/:id/ban` | ✅ |
| `unbanUser` | `PATCH /api/superadmin/users/:id/unban` | ✅ |
| `getAllAdmins` | `GET /api/superadmin/admins` | ✅ |
| `getAdminById` | `GET /api/superadmin/admins/:id` | ✅ |
| `approveAdmin` | `PATCH /api/superadmin/admins/:id/approve` | ✅ |
| `revokeAdmin` | `PATCH /api/superadmin/admins/:id/revoke` | ✅ |
| `banAdmin` | `PATCH /api/superadmin/admins/:id/ban` | ✅ |
| `unbanAdmin` | `PATCH /api/superadmin/admins/:id/unban` | ✅ |
| `deleteAdmin` | `DELETE /api/superadmin/admins/:id` | ✅ |
| `getTournamentStats` | `GET /api/superadmin/tournaments/stats` | ✅ |
| `getTodayTournaments` | `GET /api/superadmin/tournaments/today` | ✅ |
| `getUpcomingTournaments` | `GET /api/superadmin/tournaments/upcoming` | ✅ |

---

### How First Super Admin Is Created

Since there is no public register route, the first super admin is seeded directly into the DB:

**Step 1 — Generate bcrypt hash:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(h => console.log(h))"
```

**Step 2 — Insert into DB:**
```sql
INSERT INTO super_admins (name, email, password, created_by)
VALUES ('Super Admin', 'superadmin@gmail.com', '<hashed_password>', NULL);
```

After that, subsequent super admins are created via `POST /api/superadmin/create` using an existing super admin's JWT.

---

### Database — `super_admins` table

```sql
CREATE TABLE IF NOT EXISTS super_admins (
    id           INT           AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    email        VARCHAR(255)  NOT NULL UNIQUE,
    password     VARCHAR(255)  NOT NULL,
    created_by   INT           DEFAULT NULL,
    refreshToken TEXT          DEFAULT NULL,
    resetToken   VARCHAR(255)  DEFAULT NULL,
    resetExpiry  DATETIME      DEFAULT NULL,
    last_login   DATETIME      DEFAULT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL
);
```

---

## ✅ Notification System

### Model — `notification.model.js`

| Method | Purpose |
|--------|---------|
| `create({ userId, userType, title, message, type })` | Create single notification |
| `createBulk(notifications)` | Create notifications for multiple users at once |
| `getByUser(userId, userType, { page, limit })` | Get paginated notifications with unread count |
| `markAsRead(id, userId, userType)` | Mark single notification as read |
| `markAllAsRead(userId, userType)` | Mark all as read |
| `deleteById(id, userId)` | Delete a notification |
| `getUnreadCount(userId, userType)` | Get unread count badge number |

### Routes — added to both `/api/users` and `/api/admin`

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/notifications` | Get all notifications |
| `GET` | `/notifications/unread-count` | Get unread badge count |
| `PATCH` | `/notifications/read-all` | Mark all as read |
| `PATCH` | `/notifications/:id/read` | Mark one as read |
| `DELETE` | `/notifications/:id` | Delete notification |

### Database — `notifications` table

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

## ✅ Analytics System

### Controller — `analytics.controller.js`

**Admin Analytics** — `GET /api/admin/analytics`
- Total tournaments hosted
- Total revenue earned
- Revenue over last 6 months (graph data)
- Tournament status breakdown (draft / live / completed)
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

## ✅ Commission System

`GET /api/superadmin/commission`

Returns:
- Commission rate (from `COMMISSION_RATE` env var)
- Total platform revenue
- Total commission owed
- Per-admin breakdown with individual commission

---

## ✅ Player Profile System

### Controller — `profile.controller.js`

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

## ✅ Security Setup — `server.js`

| Package | Purpose |
|---------|---------|
| `helmet` | Sets secure HTTP headers, protects against XSS, clickjacking etc. |
| `express-rate-limit` | Limits login attempts to prevent brute force attacks |
| `cookie-parser` | Allows `req.cookies` to work so auth middleware can read tokens |
| `cors` | Allows frontend to send requests with cookies cross-origin |

### Rate Limits

| Route | Max Attempts | Window |
|-------|-------------|--------|
| `/api/users/login` | 10 | 15 minutes |
| `/api/admin/login` | 10 | 15 minutes |
| `/api/superadmin/login` | 5 | 15 minutes |

### Global Error Handler

```javascript
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(status).json({ success: false, message });
});
```

---

## ✅ Internal Routes (Service-to-Service)

### Main Backend — `internal.routes.js`

| Method | Route | Called By | Purpose |
|--------|-------|-----------|---------|
| `GET` | `/api/internal/users/:id` | Tournament service | Verify user exists + ban status |
| `GET` | `/api/internal/admins/:id` | Tournament service | Verify admin exists + ban status |
| `POST` | `/api/internal/admin/record-tournament` | Tournament service | Update admin revenue + count |
| `POST` | `/api/internal/notify` | Tournament service | Create notification + send email |

---

## 🍪 Cookie Reference

| Cookie Name | Belongs To | Purpose |
|-------------|-----------|---------|
| `accessToken` | User | Authenticates user requests |
| `refreshToken` | User | Refreshes user access token |
| `adminAccessToken` | Admin | Authenticates admin requests |
| `adminRefreshToken` | Admin | Refreshes admin access token |
| `saAccessToken` | Super Admin | Authenticates super admin requests |
| `saRefreshToken` | Super Admin | Refreshes super admin access token |

---

## 🔑 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=arenaforage

# JWT — User
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret

# JWT — Admin (same secrets as user)
# JWT — Super Admin
SUPER_ADMIN_ACCESS_TOKEN_SECRET=your_sa_access_secret
SUPER_ADMIN_REFRESH_TOKEN_SECRET=your_sa_refresh_secret
SUPER_ADMIN_SEED_SECRET=your_one_time_seed_secret

# Email
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
CLIENT_URL=http://localhost:5173
TOURNAMENT_SERVICE_URL=http://localhost:5001

# Commission
COMMISSION_RATE=0.10

# Internal
INTERNAL_SECRET=your_shared_secret
```

---

## 🛣️ Complete Route Summary

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

---

## 🐛 Bugs Fixed

| Bug | Cause | Fix |
|-----|-------|-----|
| `User.findById is not a function` | Method didn't exist in model | Added `findById` to user model |
| `Unknown column 'verificationToken'` | Wrong database selected in MySQL terminal | Ran migration on correct DB |
| `emailVerified returning 'NO' despite DB showing 'YES'` | Two separate rows — verified row was id=1, login fetching id=2 | Updated correct row in DB |
| Admin `getProfile` returning 401 | Token in cookie not sent by Postman | Added `accessToken` to login JSON response + use Authorization header in Postman |
| `Unauthorized request` on `/create` | `router.use(middleware)` was catching the public route | Moved `/create` above the `router.use()` line |
| `Invalid Signature` on super admin login | Leftover cookies from user/admin login being sent | Cleared cookies in Postman before testing |
| Cookies not being read by auth middleware | `cookie-parser` was missing | Added `app.use(cookieParser())` to `server.js` |

---

## 🗂️ Files Created / Modified

```
backend/
├── Controllers/
│   ├── user.controller.js
│   ├── admin.controller.js
│   ├── superAdmin.controller.js
│   ├── notification.controller.js
│   ├── profile.controller.js
│   └── analytics.controller.js
├── Models/
│   ├── user.model.js
│   ├── admin.model.js
│   ├── superAdmin.model.js
│   └── notification.model.js
├── Middleware/
│   ├── user.auth.middleware.js
│   ├── admin.auth.middleware.js
│   └── superAdmin.auth.middleware.js
├── Routes/
│   ├── user.routes.js
│   ├── admin.routes.js
│   ├── superAdmin.routes.js
│   └── internal.routes.js
├── Utils/
│   ├── ApiError.utils.js
│   └── ApiResponse.utils.js
└── server.js
```

---

# 📋 ArenaForage — Dev Log — March 13, 2026

## Tournament Service — Invite-Based Team Registration System

---

## 🏗️ What Was Built Today

A complete **invite token system** for tournament team registration. Instead of a team leader directly adding players, the leader registers the team and receives 4 shareable links. Players join by clicking their link — but must have an ArenaForage account first.

---

## 🔀 The Complete User Flow

```
LEADER FLOW
──────────────────────────────────────────────────────
1. Leader visits /tournaments/:id
2. Clicks "Register Team"
3. Submits Team Name + Tag
4. POST /api/tournaments/:id/register
5. Backend creates team entry + 4 invite tokens
6. Leader receives 4 shareable links:
     arenaforage.com/join?token=abc123  ← Primary Slot 2
     arenaforage.com/join?token=def456  ← Primary Slot 3
     arenaforage.com/join?token=ghi789  ← Primary Slot 4
     arenaforage.com/join?token=jkl012  ← Extra Slot 5
   Leader auto-fills Slot 1 (no invite needed)

PLAYER FLOW
──────────────────────────────────────────────────────
1. Player receives link on WhatsApp / Discord
2. Visits arenaforage.com/join?token=abc123
3. Frontend calls GET /api/invites/:token (public)

   IF token invalid/expired → Show error page
   IF token valid → Show "Join Team GODLIKE" card

4a. Player is already logged in
    → One-click "Accept & Join"
    → POST /api/invites/:token/accept → done ✅

4b. Player is NOT logged in
    → Token saved, redirected to /register or /login
    → After auth, redirected back to /join?token=abc123
    → POST /api/invites/:token/accept → done ✅
```

---

## ✅ Files Created / Modified Today

### Tournament Service (`arenaForage/tournament/`)

```
tournament/
├── Model/
│   └── Invite.model.js              ← NEW
├── Controller/
│   ├── Tournament.controller.js     ← UPDATED (3 invite hooks added)
│   └── Invite.controller.js         ← NEW
├── Routes/
│   ├── Tournament.routes.js         ← UPDATED
│   └── Invite.routes.js             ← NEW
└── Utils/
    └── inviteHooks.js               ← NEW
```

### Main Backend (`arenaForage/backend/`)

```
backend/
└── Routes/
    └── internal.routes.js           ← UPDATED (bulk notify + email support)
```

---

## 📦 New Model — `Invite.model.js`

Stores one document per invite slot per team registration.

```
invites collection:
{
  token,               // crypto random hex — goes in the shareable link
  tournamentId,        // which tournament
  tournamentName,      // denormalized for convenience
  registrationId,      // _id of subdocument inside tournament.teams array
  teamName,
  teamTag,
  leaderUserId,        // MySQL users.id
  leaderUsername,
  slotNumber,          // 1-5 (1 = leader auto-filled, 2-4 = primary, 5 = extra)
  role,                // "primary" | "extra"
  status,              // "pending" | "accepted" | "expired" | "cancelled"
  registrationClosesAt,// null = valid until admin manually closes registration
  acceptedBy: {        // filled when player accepts
    userId,
    username,
    email,
    acceptedAt
  }
}
```

### Key Design Decision — Token Expiry
Tokens do **not** use a fixed 48hr timer. They are valid **until tournament registration closes**. This is cleaner because:
- Leader doesn't need to worry about tokens expiring while registration is still open
- All tokens are invalidated automatically the moment admin publishes room credentials or cancels the tournament

### Static Methods Added
| Method | When Called |
|--------|-------------|
| `Invite.findValid(token)` | On every validate/accept request |
| `Invite.expireAllForTournament(id)` | When registration closes |
| `Invite.updateCloseDateForTournament(id, date)` | When admin opens registration |

---

## 📡 New API Endpoints

### Tournament Service (Port 5001)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/tournaments/:id/register` | ✅ User | Leader registers team → returns 4 invite links |
| `GET` | `/api/tournaments/:id/my-registration` | ✅ User | Leader views roster + invite statuses |
| `GET` | `/api/invites/:token` | ❌ Public | Validate a token before showing join page |
| `POST` | `/api/invites/:token/accept` | ✅ User | Player accepts invite and joins slot |
| `DELETE` | `/api/invites/:token` | ✅ User | Leader cancels an invite link |
| `POST` | `/api/invites/:token/regenerate` | ✅ User | Leader regenerates a cancelled/expired link |

### Main Backend (Port 5000)

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/internal/notify/bulk` | NEW — notify multiple users at once |

---

## 🔧 Tournament Controller Changes

Only 3 lines added to your existing `Tournament.controller.js`. Everything else untouched.

| Method | Change |
|--------|--------|
| `openRegistration` | `await onRegistrationOpened(tournament._id, closesAt)` added |
| `publishRoom` | `await onRegistrationClosed(tournament._id)` added |
| `cancel` | `await onRegistrationClosed(tournament._id)` added |

### What Each Hook Does
```
onRegistrationOpened(id, closesAt)
  → Syncs registrationClosesAt to all pending invites for this tournament

onRegistrationClosed(id)
  → Sets status = "expired" on all pending invites immediately
  → Called when: room published, tournament cancelled
```

---

## ⚠️ Edge Cases Handled

| Scenario | Response |
|----------|----------|
| Player already in another team for this tournament | `409 — You are already registered with another team` |
| Token already accepted | `409 — This slot has already been filled` |
| Token expired (registration closed) | `410 — Tournament registration has closed` |
| Token cancelled | `410 — This invite link has been cancelled` |
| Leader tries to accept their own invite | `400 — You are the team leader, already in Slot 1` |
| Tournament full when leader tries to register | `400 — Tournament is full, join waitlist instead` |
| Regenerate on an accepted slot | `400 — Slot is already filled, no need to regenerate` |

---

## 🐛 Bugs Fixed Today

| Bug | Cause | Fix |
|-----|-------|-----|
| `argument handler must be a function` on routes load | `authMiddleware` imported with `{}` destructuring but is a default export | Changed to `const authMiddleware = require(...)` without destructuring |
| `adminAuthMiddleware` undefined | Opposite problem — exported as named export but imported without `{}` | Changed to `const { adminAuthMiddleware } = require(...)` |
| `cancelTournament` undefined in routes | Route file used wrong method name | Corrected to `tournamentController.cancel` to match controller export |
| All previous ESM `import/export` errors | Files generated with ESM syntax but project uses CommonJS | Rewrote all new files using `require` / `module.exports` |

### Root Cause Summary
> Always check **how a file does its `module.exports`** before importing it.
> - `module.exports = fn` → import without `{}`
> - `module.exports = { fn }` → import with `{}`

---

## 🧪 Postman Test Order

```
1. POST  localhost:5000/api/users/login
         → get user token (this user will be team leader)

2. POST  localhost:5001/api/tournaments/:id/register
         Body: { teamName: "GODLIKE", teamTag: "GDL" }
         → returns 4 invite links

3. GET   localhost:5001/api/invites/:token
         → validate link (no auth needed)
         → confirms team name, slot, role

4. POST  localhost:5000/api/users/login (different account)
         → get user token (this user is the invited player)

5. POST  localhost:5001/api/invites/:token/accept
         → player joins the slot
         → both leader and player get notifications

6. GET   localhost:5001/api/tournaments/:id/my-registration
         → leader sees full roster with slot statuses

7. POST  localhost:5001/api/invites/:token/regenerate
         → leader gets a fresh link for an empty slot

8. PATCH localhost:5001/api/tournaments/:id/publish-room
         Body: { room_id: "ARENA123", password: "secret" }
         → all pending tokens expire immediately
         → confirmed leaders get room credentials by email
```

---

## 🔜 Next Steps

- [ ] Frontend — `JoinPage.jsx` (`/join?token=...`)
- [ ] Frontend — Rebuild `TournamentRegistrationPage.jsx` (show generated invite links)
- [ ] Frontend — Wire `POST /api/tournaments/:id/register` to registration page
- [ ] Frontend — Token preservation through auth flow (`?next=/join?token=...`)
- [ ] Add `ProtectedRoute` wrapper on `/dashboard` in `App.jsx`
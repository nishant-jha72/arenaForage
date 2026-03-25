# 📋 ArenaForage — Complete Project Documentation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| Main Backend | Node.js + Express + MySQL (mysql2) |
| Tournament Service | Node.js + Express + MongoDB (Mongoose) |
| Auth | JWT (httpOnly cookies) |
| File Storage | Cloudinary + Multer |
| Email | Nodemailer (Gmail) |
| Security | Helmet + express-rate-limit + CORS + cookie-parser |

---

## 🏗️ Architecture

```
arenaForage/
├── frontend/          ← React/Vite (Port 5173)
├── backend/           ← Main MySQL service (Port 5000)
└── tournament/        ← MongoDB microservice (Port 5001)
```

Both backend services run independently and communicate via HTTP using a shared `INTERNAL_SECRET` header.

---

## 🗂️ Complete Folder Structure

### Backend (`/backend`)

```
backend/
├── Controllers/
│   ├── user.controllers.js
│   ├── Admin.controller.js
│   ├── superAdmin.controller.js
│   ├── notification.controller.js
│   ├── profile.controller.js
│   └── analytics.controller.js
├── Models/
│   ├── user.model.js
│   ├── Admin.model.js
│   ├── superAdmin.model.js
│   └── notification.model.js
├── Middleware/
│   ├── auth.middlewares.js          ← User auth (sets req.user)
│   ├── Admin.auth.middleware.js     ← Admin auth (sets req.admin)
│   └── superAdmin.auth.middleware.js
├── Routes/
│   ├── user.routes.js
│   ├── admin.routes.js
│   ├── superAdmin.routes.js
│   └── internal.routes.js
├── Utils/
│   ├── ApiError.utils.js
│   └── ApiResponse.utils.js
├── DB/
│   └── index.js
├── Middleware/
│   └── multer.middlewares.js
├── .env
└── server.js
```

### Tournament Service (`/tournament`)

```
tournament/
├── Controllers/
│   ├── Tournament.controller.js
│   ├── Invite.controller.js
│   ├── Waitlist.controller.js
│   └── Bracket.controller.js
├── Model/
│   ├── Tournament.model.js         ← CommonJS (NOT ESM)
│   ├── Team.model.js               ← CommonJS (NOT ESM)
│   └── Invite.model.js             ← CommonJS (NOT ESM)
├── Middleware/
│   ├── user.auth.middleware.js
│   └── admin.auth.middleware.js
├── Routes/
│   ├── Tournament.routes.js
│   ├── Invite.routes.js
│   └── internal.routes.js
├── Utils/
│   ├── ApiError.util.js
│   ├── ApiResponse.util.js
│   └── inviteHooks.util.js
├── .env
└── server.js
```

### Frontend (`/frontend`)

```
frontend/src/
├── pages/
│   ├── HomePage.jsx
│   ├── UserLoginPage.jsx
│   ├── UserRegisterPage.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── ResetPasswordPage.jsx
│   ├── UserDashboard.jsx
│   ├── TournamentsPage.jsx
│   ├── TournamentDetailPage.jsx
│   ├── LeaderboardPage.jsx
│   └── admin/
│       ├── AdminLoginPage.jsx
│       ├── AdminRegisterPage.jsx
│       └── AdminDashboard.jsx
├── components/
│   ├── Navbar.jsx
│   └── admin/
│       ├── shared.jsx
│       ├── AdminSidebar.jsx
│       ├── OverviewPanel.jsx
│       ├── TournamentsPanel.jsx
│       ├── AnalyticsPanel.jsx
│       ├── NotificationsPanel.jsx
│       ├── ProfilePanel.jsx
│       └── ChangePasswordPanel.jsx
├── context/
│   ├── ThemeContext.jsx
│   └── AuthContext.jsx
├── utils/
│   └── Apifetch.utils.js
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=arenaforage

# JWT — User & Admin (same secrets)
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret

# JWT — Super Admin (separate secrets)
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

# Internal
INTERNAL_SECRET=your_shared_secret

# Commission
COMMISSION_RATE=0.10
```

### Tournament Service (`tournament/.env`)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arenaForage
MAIN_SERVICE_URL=http://localhost:5000
INTERNAL_SECRET=same_as_backend
ACCESS_TOKEN_SECRET=same_as_backend
REFRESH_TOKEN_SECRET=same_as_backend
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5001
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_TOURNAMENT_URL=http://localhost:5001
```

---

## 🗄️ Database Schema (MySQL)

### `users` table
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

### `admins` table
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

### `super_admins` table
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

### `notifications` table
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

## 🍃 MongoDB Schema (Tournament Service)

### Tournament
Key fields: `title`, `game`, `description`, `banner_url`, `admin_id` (MySQL ref), `admin_name`, `status` (draft → registration_open → registration_closed → live → completed/cancelled), `registration` (dates, fees, limits), `schedule`, `prize_pool`, `room` (credentials), `teams` (registrations with roster slots), `scores`, `winner`, `waitlist`

### Team
Key fields: `name`, `tag`, `logo_url`, `leader_user_id` (MySQL ref), `members`, `tournament_history`, `is_active`

### Invite
Key fields: `token`, `tournamentId`, `teamName`, `teamTag`, `leaderUserId`, `slotNumber` (1-5), `role` (primary/extra), `status` (pending/accepted/expired/cancelled), `registrationClosesAt`, `acceptedBy`

---

## 🛣️ Complete Route Reference

### User Routes (`/api/users`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/register` | ❌ | Register with optional profile picture (multipart) |
| `GET` | `/verify-email` | ❌ | Verify email from link |
| `POST` | `/login` | ❌ | Login → sets accessToken + refreshToken cookies |
| `POST` | `/refresh-token` | ❌ | Refresh access token |
| `POST` | `/forgot-password` | ❌ | Send reset email |
| `POST` | `/reset-password` | ❌ | Reset with token from email |
| `GET` | `/profile/public/:id` | ❌ | Public player profile |
| `POST` | `/logout` | ✅ | Logout |
| `GET` | `/profile` | ✅ | Get own profile |
| `GET` | `/profile/full` | ✅ | Profile + tournament history + team |
| `PATCH` | `/update-profile` | ✅ | Update name/avatar (multipart) |
| `PATCH` | `/change-password` | ✅ | Change password |
| `DELETE` | `/delete-account` | ✅ | Delete account + Cloudinary cleanup |
| `GET` | `/notifications` | ✅ | Get notifications |
| `GET` | `/notifications/unread-count` | ✅ | Unread badge count |
| `PATCH` | `/notifications/read-all` | ✅ | Mark all read |
| `PATCH` | `/notifications/:id/read` | ✅ | Mark one read |
| `DELETE` | `/notifications/:id` | ✅ | Delete notification |

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

### Tournament Routes (`/api/tournaments` — Port 5001)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/` | ❌ | All tournaments (filter: `?admin_id=` `?status=` `?game=`) |
| `GET` | `/:id` | ❌ | Single tournament |
| `GET` | `/:id/leaderboard` | ❌ | Scores + winner |
| `GET` | `/:id/results` | ❌ | Full results with prizes |
| `GET` | `/:id/bracket` | ❌ | Team bracket |
| `GET` | `/:id/room` | ✅ User | Room credentials (confirmed leaders only) |
| `POST` | `/:id/register` | ✅ User | Register team → returns invite links |
| `GET` | `/:id/my-registration` | ✅ User | Leader views roster + invite statuses |
| `POST` | `/:id/waitlist` | ✅ User | Join waitlist |
| `POST` | `/` | ✅ Admin | Create tournament |
| `PATCH` | `/:id` | ✅ Admin | Update (draft only) |
| `PATCH` | `/:id/open-registration` | ✅ Admin | Open registration |
| `PATCH` | `/:id/publish-room` | ✅ Admin | Publish room → emails leaders |
| `PATCH` | `/:id/live` | ✅ Admin | Set live |
| `PATCH` | `/:id/complete` | ✅ Admin | Complete → updates admin revenue |
| `PATCH` | `/:id/cancel` | ✅ Admin | Cancel → expires invite tokens |
| `PATCH` | `/:id/waitlist/promote` | ✅ Admin | Promote from waitlist |
| `PATCH` | `/:id/teams/:teamId/confirm` | ✅ Admin | Confirm team |
| `PATCH` | `/:id/teams/:teamId/players/:userId/verify` | ✅ Admin | Verify player |
| `POST` | `/:id/scores` | ✅ Admin | Submit scores |

### Invite Routes (`/api/invites` — Port 5001)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/:token` | ❌ | Validate invite token |
| `POST` | `/:token/accept` | ✅ User | Accept invite → join slot |
| `DELETE` | `/:token` | ✅ User | Cancel invite link (leader only) |
| `POST` | `/:token/regenerate` | ✅ User | Regenerate expired/cancelled link |

### Internal Routes (service-to-service only)

**Main Backend**

| Method | Route | Called By |
|--------|-------|-----------|
| `GET` | `/api/internal/users/:id` | Tournament service |
| `GET` | `/api/internal/admins/:id` | Tournament service |
| `POST` | `/api/internal/admin/record-tournament` | Tournament service |
| `POST` | `/api/internal/notify` | Tournament service |
| `POST` | `/api/internal/notify/bulk` | Tournament service |

**Tournament Service**

| Method | Route | Called By |
|--------|-------|-----------|
| `GET` | `/api/internal/tournament-stats` | Main backend |
| `GET` | `/api/internal/players/:userId/history` | Main backend |
| `GET` | `/api/internal/players/:userId/team` | Main backend |
| `GET` | `/api/internal/analytics/admin/:adminId/revenue` | Main backend |
| `GET` | `/api/internal/analytics/admin/:adminId/breakdown` | Main backend |
| `GET` | `/api/internal/analytics/admin/:adminId/upcoming` | Main backend |

---

## 🍪 Cookie Reference

| Cookie Name | Belongs To | Expires |
|-------------|-----------|---------|
| `accessToken` | User | 15 minutes |
| `refreshToken` | User | 7 days |
| `adminAccessToken` | Admin | 15 minutes |
| `adminRefreshToken` | Admin | 7 days |
| `saAccessToken` | Super Admin | 15 minutes |
| `saRefreshToken` | Super Admin | 7 days |

---

## 🔐 Auth System

### JWT Refresh Flow
All API calls go through `src/utils/Apifetch.utils.js` which:
1. Makes the request with `credentials: "include"`
2. On 401 — calls the correct refresh endpoint based on role stored in `sessionStorage`
3. Retries the original request once with the new token
4. On refresh failure — redirects to the correct login page

### Role stored in sessionStorage
```js
sessionStorage.getItem("af_role") // "user" | "admin" | null
```
Set by `AuthContext.jsx` on boot and after `hydrate()`.

### Auth Context Boot Sequence
```
1. GET /api/users/profile  → 200 = user logged in
2. GET /api/admin/profile  → 200 = admin logged in
3. Both 401 = not logged in
```

---

## 🏆 Tournament Lifecycle

```
draft → registration_open → registration_closed → live → completed
                                                      ↘ cancelled
```

### Invite Token Flow
```
1. Leader registers team → POST /api/tournaments/:id/register
2. Gets 4 shareable links (slots 2-4 = primary, slot 5 = extra)
3. Players click link → GET /api/invites/:token (validate)
4. Players accept → POST /api/invites/:token/accept
5. Admin opens registration → tokens get registrationClosesAt synced
6. Admin publishes room → all pending tokens expire → leaders emailed
```

### Score Calculation
- Placement points + Kill points = Total points
- Sorted descending → ranks assigned
- Admin submits via `POST /api/tournaments/:id/scores`

---

## 🎨 Frontend Design System

### Typography
| Font | Usage |
|------|-------|
| `Barlow Condensed` (700/800/900) | All headings, labels, stats, logo |
| `Barlow` (400/500/600) | Body text, inputs, nav links |

### Color Tokens
| Token | Light | Dark |
|-------|-------|------|
| Page background | `#f9fafb` | `#09090b` |
| Surface | `#ffffff` | `#18181b` |
| Border | `#e4e4e7` | `#27272a` |
| Primary text | `#18181b` | `#f4f4f5` |
| Accent (always) | `#dc2626` | `#dc2626` |

### Dark Mode
- Toggled via `ThemeContext`
- Saved to `localStorage` under key `af-theme`
- Applied via `tokens(dark)` function

### Rate Limits
| Route | Max | Window |
|-------|-----|--------|
| `/api/users/login` | 10 | 15 min |
| `/api/admin/login` | 10 | 15 min |
| `/api/superadmin/login` | 5 | 15 min |

---

## 🐛 Critical Bugs Fixed (Session Log)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `Tournament.find is not a function` | `Tournament.model.js` used ESM (`export default`) in a CommonJS project | Changed to `module.exports = Tournament` |
| `Incorrect arguments to mysqld_stmt_execute` | `LIMIT` and `OFFSET` passed as strings from `req.query` | `parseInt()` LIMIT/OFFSET; inline them in SQL string |
| `filtered.map is not a function` | API response shape `{ data: { tournaments: [] } }` — `.data` is an object not array | Multi-branch shape detection: `data.data?.tournaments` |
| `useState inside .map()` in ChangePasswordPanel | Illegal hook call — hooks can't be in loops | Extracted each field into its own `PasswordField` component |
| `useAuth()` outside component | Hooks called at module level | Moved inside component function |
| `useNavigate()` inside event handler | Hook called conditionally | Moved to top of component |
| Notifications 500 error | `LIMIT/OFFSET` type mismatch in MySQL2 prepared statements | Used `parseInt` + inline LIMIT/OFFSET in SQL |
| Admin middleware setting both `req.user` and `req.admin` | User middleware had `req.admin = {...}` line | Removed; each middleware only sets its own request key |
| `userType` always `"user"` on admin notification routes | `req.user ? "user" : "admin"` was truthy if `req.user` accidentally set | `getRequester()` checks `req.admin?.id` first |
| Tournament service 500 | Duplicate `getAll`/`getAllTournaments` functions — routes pointed to wrong one | Merged into single `getAll` with `admin_id` query support |
| `superAdminVerified === "YES"` broken | Backend now returns booleans (`true`/`false`) not strings | Changed all checks to `!!admin?.superAdminVerified` |
| Profile response wrong extraction | `profileRes.data` returns `{ admin: {...} }` not the admin directly | Changed to `profileRes.data?.admin` |

---

## 🚀 How to Run

```bash
# Terminal 1 — Main Backend
cd backend
npm install
npm run dev    # Port 5000

# Terminal 2 — Tournament Service
cd tournament
npm install
npm run dev    # Port 5001

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev    # Port 5173
```

### First Super Admin Setup
```bash
# Step 1: Hash password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(h => console.log(h))"

# Step 2: Insert into DB
INSERT INTO super_admins (name, email, password, created_by)
VALUES ('Super Admin', 'superadmin@gmail.com', '<hashed_password>', NULL);
```

---

## 📦 Key Packages

### Backend
```bash
npm install express mysql2 bcrypt jsonwebtoken nodemailer cloudinary multer
npm install helmet express-rate-limit cookie-parser cors dotenv
```

### Tournament Service
```bash
npm install express mongoose axios nodemailer helmet cors cookie-parser express-rate-limit dotenv
```

### Frontend
```bash
npm install react-router-dom framer-motion
npm install tailwindcss @tailwindcss/vite
```

---

## 🔜 Remaining Tasks

- [ ] Score calculation script (to be provided by client)
- [ ] Payment gateway (Razorpay/Stripe for paid tournaments)
- [ ] `JoinPage.jsx` — `/join?token=...` for invite acceptance
- [ ] `ProtectedRoute` wrapper for dashboard routes
- [ ] Input validation with `joi` or `express-validator`
- [ ] Winston logging for production
- [ ] Environment variable validation on startup
- [ ] Jest + Supertest automated tests
- [ ] Deploy both services + frontend
- [ ] MongoDB Atlas connection (get string from atlas.mongodb.com)
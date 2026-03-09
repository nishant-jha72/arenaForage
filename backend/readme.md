1 - database connection succes -- 
2 - jwt verification succes --
3 -- user controller and user routes have setupd
   Work For 9/03/2026 --->
--> Access Token Refresh Logic (Crucial)
Right now, if your accessToken expires in 15 minutes, the user is suddenly logged out even if they are in the middle of using the app. You need a route that uses the Refresh Token to give them a new Access Token automatically.
--> Password Reset Flow
Users forget passwords. You need a way to securely reset them without the user being logged in.
--> Account Deletion & Image Cleanup
When a user deletes their account, you shouldn't just delete the row in MySQL. You must also delete their image from Cloudinary.
--> Email Verification
To prevent spam accounts, don't let users access certain features until they click a link in their email.

---------------------------------------------DONE-----------------------------------------------------------------------------
# 📋 Dev Log — March 09, 2026

## ArenaForage Backend — Daily Summary

---

## ✅ User MVC

### Model — `user.model.js`
Added missing methods to the existing model:

| Method | Purpose |
|--------|---------|
| `findById(id)` | Fetch user by primary key |
| `update(id, fields)` | Generic update — accepts any column map |
| `updatePassword(id, newPassword)` | Hashes new password internally before saving |
| `deleteById(id)` | Hard delete user row |

Existing methods retained: `create`, `findByEmail`, `comparePassword`, `verifyEmail`.

---

### Controller — `user.controller.js`
10 complete controllers built:

| Controller | Route | Access |
|------------|-------|--------|
| `register` | `POST /api/users/register` | Public |
| `verifyEmail` | `GET /api/users/verify-email` | Public |
| `login` | `POST /api/users/login` | Public |
| `logout` | `POST /api/users/logout` | Protected |
| `refreshAccessToken` | `POST /api/users/refresh-token` | Public |
| `getProfile` | `GET /api/users/profile` | Protected |
| `updateProfile` | `PATCH /api/users/profile` | Protected |
| `changePassword` | `PATCH /api/users/change-password` | Protected |
| `forgotPassword` | `POST /api/users/forgot-password` | Public |
| `resetPassword` | `POST /api/users/reset-password` | Public |

---

### Routes — `user.routes.js`
11 routes split into public and protected using `authMiddleware`.

---

### Database — `users` table
New columns added via migration:

```sql
ALTER TABLE users
    ADD COLUMN refreshToken TEXT,
    ADD COLUMN verificationToken VARCHAR(255),
    ADD COLUMN verificationExpiry DATETIME,
    ADD COLUMN resetToken VARCHAR(255),
    ADD COLUMN resetExpiry DATETIME;
```

Also fixed:
- Dropped duplicate `isEmailVerified` (tinyint) column
- Changed `emailVerified` from `ENUM` to `VARCHAR(3)` to fix MySQL Linux case-sensitivity bug that was returning wrong values at runtime

---

## ✅ Admin MVC

### Model — `admin.model.js`
Fresh model built from scratch with all methods:

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
11 complete controllers built:

| Controller | Route | Access | Super Admin Required |
|------------|-------|--------|----------------------|
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

---

### Middleware — `admin.auth.middleware.js`
Two middleware functions built:

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
New table created:

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

## 🐛 Bugs Fixed Today

| Bug | Cause | Fix |
|-----|-------|-----|
| `User.findById is not a function` | Method didn't exist in model | Added `findById` to user model |
| `Unknown column 'verificationToken'` | Wrong database selected in MySQL terminal | Ran migration on correct DB |
| `emailVerified returning 'NO' despite DB showing 'YES'` | Two separate rows — verified row was id=1, login fetching id=2 | Updated correct row in DB |
| Admin `getProfile` returning 401 | Token in cookie not sent by Postman | Added `accessToken` to login JSON response + use Authorization header in Postman |

---

## 📦 Packages Installed Today

```bash
npm install nodemailer cloudinary
```

---

## 🔑 Environment Variables Required

```env
NODE_ENV=development
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:8000
```

---

## 🗂️ Files Created / Modified Today

```
backend/
├── Controllers/
│   ├── user.controller.js      ← updated
│   └── admin.controller.js     ← new
├── Models/
│   ├── user.model.js           ← updated
│   └── admin.model.js          ← new
├── Middleware/
│   └── admin.auth.middleware.js ← new
├── Routes/
│   ├── user.routes.js          ← updated
│   └── admin.routes.js         ← new
```

---

## 🔜 Next Steps
- [ ] Super Admin MVC
- [ ] Tournament microservice
- [ ] Frontend development



# 📋 Dev Log — March 10, 2026

## ArenaForage Backend — Daily Summary

---

## ✅ Super Admin MVC

### Model — `superAdmin.model.js`
Fresh model built from scratch with all methods:

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

---

### Controller — `superAdmin.controller.js`
Full controller with all actions:

| Controller | Route | Auth |
|------------|-------|------|
| `create` | `POST /api/superadmin/create` | seedSecret or SA token |
| `login` | `POST /api/superadmin/login` | ❌ |
| `logout` | `POST /api/superadmin/logout` | ✅ |
| `refreshAccessToken` | `POST /api/superadmin/refresh-token` | ❌ |
| `getProfile` | `GET /api/superadmin/profile` | ✅ |
| `changePassword` | `PATCH /api/superadmin/change-password` | ✅ |
| `getDashboard` | `GET /api/superadmin/dashboard` | ✅ |
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

### Middleware — `superAdmin.auth.middleware.js`
- Reads `saAccessToken` from cookies or `Authorization` header
- Verifies JWT and checks `role === "superadmin"`
- Uses separate `SUPER_ADMIN_ACCESS_TOKEN_SECRET`
- Sets `req.superAdmin` for downstream controllers

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

-- Added to users and admins tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS isBanned TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS isBanned TINYINT(1) NOT NULL DEFAULT 0;
```

---

### How First Super Admin is Created
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

## ✅ Security Setup — `server.js`

### Packages Installed
```bash
npm install helmet express-rate-limit cookie-parser cors
```

### What Was Added

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
Added as last middleware in `server.js` — catches all `next(error)` calls and returns clean JSON instead of raw stack traces:
```javascript
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(status).json({ success: false, message });
});
```

---

## ✅ Ban Enforcement Added

Added ban check in both `user.controller.js` and `admin.controller.js` login flow:

```javascript
// Order of checks in login:
// 1. Validate credentials
// 2. Check if banned       ← added today
// 3. Check email verified
// 4. Generate tokens
if (user.isBanned) {
    throw new ApiError(403, "Your account has been banned. Contact support.");
}
```

---

## 🔑 New Environment Variables Added

```env
SUPER_ADMIN_ACCESS_TOKEN_SECRET=your_sa_access_secret
SUPER_ADMIN_REFRESH_TOKEN_SECRET=your_sa_refresh_secret
SUPER_ADMIN_SEED_SECRET=your_one_time_seed_secret
CLIENT_URL=http://localhost:5000
```

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

## 🗂️ Files Created / Modified Today

```
backend/
├── Controllers/
│   └── superAdmin.controller.js     ← new
├── Models/
│   └── superAdmin.model.js          ← new
├── Middleware/
│   └── superAdmin.auth.middleware.js ← new
├── Routes/
│   └── superAdmin.routes.js         ← new
└── server.js                        ← updated
```

---

## 🐛 Issues Fixed Today

| Issue | Cause | Fix |
|-------|-------|-----|
| `Unauthorized request` on `/create` | `router.use(middleware)` was catching the public route | Moved `/create` above the `router.use()` line |
| `Invalid Signature` on super admin login | Leftover cookies from user/admin login being sent | Cleared cookies in Postman before testing |
| Cookies not being read by auth middleware | `cookie-parser` was missing | Added `app.use(cookieParser())` to `server.js` |

---

## 🔜 Next Steps
- [ ] Add ban check to user and admin login (quick one-liner)
- [ ] Input validation with `joi` or `express-validator`
- [ ] Password strength enforcement (min 8 characters)
- [ ] Winston logging for production
- [ ] Environment variable validation on startup
- [ ] Tournament microservice
- [ ] Frontend development
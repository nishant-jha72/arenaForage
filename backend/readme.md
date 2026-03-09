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
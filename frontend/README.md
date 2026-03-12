# 📋 ArenaForage — Frontend Documentation

## Tech Stack — `React + Vite + Tailwind CSS v4`

---

## 🏗️ Architecture Overview

```
arenaForage/
├── frontend/          ← React/Vite (Port 5173)
├── backend/           ← Main MySQL service (Port 5000)
└── tournament/        ← MongoDB microservice (Port 5001)
```

The frontend communicates with both backend services directly via HTTP. Auth tokens are stored in cookies (httpOnly) and sent with every request.

---

## 📦 Packages Installed

```bash
npm create vite@latest frontend -- --template react
npm install react-router-dom
npm install tailwindcss @tailwindcss/vite
```

---

## ⚙️ Tailwind CSS v4 Setup

> Tailwind v4 uses a Vite plugin instead of PostCSS. No `tailwind.config.js` or `postcss.config.js` required.

**`vite.config.js`**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**`src/index.css`** — one line only:
```css
@import "tailwindcss";
```

**`src/main.jsx`** — must import the CSS:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## 🗂️ Folder Structure

```
frontend/
├── public/
├── src/
│   ├── pages/
│   │   └── HomePage.jsx         ← built
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── vite.config.js
├── package.json
└── index.html
```

---

## 🛣️ Routing — `App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Add pages here as they are built */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## ✅ Pages Built

### `HomePage.jsx` — Public Landing Page

**Sections:**

| Section | Description |
|---------|-------------|
| Navbar | Fixed, transparent on top — white/red/dark on scroll. Color cycles every 3s. Mobile hamburger included. |
| Live Ticker | Red bar with auto-scrolling tournament announcements |
| Hero | Full-width with grid texture, tagline, two CTA buttons with glow pulse animation |
| Stats Bar | Animated counters (players, tournaments, prize money, teams) triggered on scroll |
| Tournaments Grid | 4-column card layout — lift + red shadow on hover, slot progress bar, LIVE badge pulses |
| How It Works | 4 vertical steps sliding in from right with emoji bubble, staggered animation |
| CTA Banner | Red section with diagonal stripe texture, two action buttons |
| Footer | 4-column with Players / Organizers / Platform links. Super Admin link tucked at bottom. |

---

## 🎨 Design System

### Typography

| Font | Usage |
|------|-------|
| `Barlow Condensed` | All headings, labels, logo, stat numbers |
| `Barlow` | Body text, paragraphs, nav links |

Loaded via Google Fonts CDN inside the component `<style>` block.

### Color Tokens

| Token | Light | Dark |
|-------|-------|------|
| Page background | `#f9fafb` | `#09090b` |
| Hero background | `#ffffff` | `#0c0c0f` |
| Section background | `#f4f4f5` | `#111113` |
| Card background | `#ffffff` | `#18181b` |
| Border | `#e4e4e7` | `#27272a` |
| Primary text | `#18181b` | `#f4f4f5` |
| Secondary text | `#6b7280` | `#71717a` |
| Accent (always) | `#dc2626` | `#dc2626` |
| Stats bar (always) | `#18181b` | `#18181b` |
| Footer (always) | `#09090b` | `#09090b` |

### Status Badge Colors

| Status | Color |
|--------|-------|
| `registration_open` | Emerald green |
| `live` | Red (with pulsing dot) |
| `registration_closed` | Zinc grey |
| `draft` | Amber |
| `completed` | Light zinc |

---

## 🌙 Dark Mode

- Toggle button is a pill-shaped switch in the navbar (☀️ / 🌙)
- Preference is saved to `localStorage` under key `af-theme`
- Restored on page load via `useState` initializer
- All section backgrounds, text, borders, and card colors respond to the `dark` state
- Theme transitions use `0.4s ease` for smooth switching
- Navbar color cycle has separate `light` and `dark` palettes

---

## ✨ Animations

| Animation | How |
|-----------|-----|
| Hero text stagger | CSS `@keyframes fadeUp` with `animation-delay` per element |
| Stats counter | JS interval counting up, gated by `IntersectionObserver` — starts only when scrolled into view |
| Navbar color cycle | `setInterval` every 3s with a 350ms fade-out/in transition |
| Tournament cards scroll reveal | `IntersectionObserver` triggers `opacity + translateY` with 110ms stagger per card |
| Tournament card hover | `translateY(-8px) scale(1.018)` + red shadow, 0.22s ease |
| Card title hover | Color shifts to `#dc2626` |
| Card button hover | Background shifts to `#dc2626` |
| Card banner shine | Gradient sweep opacity 0→1 on hover |
| How It Works reveal | `translateX(72px → 0)` with `cubic-bezier(0.22,1,0.36,1)` spring, 160ms stagger |
| Emoji bubble hover | `scale(1.1) rotate(-4deg)` + red border glow |
| Live ticker | CSS `@keyframes ticker` infinite scroll |
| Hero CTA button | `@keyframes glowPulse` — red glow pulse every 2.5s |
| Navbar underline | CSS `::after` pseudo-element slides in from left on hover |

---

## 🔧 Reusable Components (inside `HomePage.jsx`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `AnimatedCounter` | `target, suffix, go, duration` | Counts up from 0 to target when `go` is true |
| `TournamentCard` | `t, index, visible, dark` | Full tournament card with hover effects and theme support |
| `HowStep` | `item, index, visible, dark` | Single step in How It Works section |
| `ThemeToggle` | `dark, onToggle` | Pill toggle switch for dark/light mode |
| `useInView` | `threshold` | Custom hook — returns `[ref, isVisible]` using IntersectionObserver |

---

## 📡 API Integration (Pending)

All data is currently hardcoded as mock constants. Replace with these API calls when ready:

| Data | API Endpoint | Service |
|------|-------------|---------|
| Tournament cards | `GET /api/tournaments` | Tournament service (Port 5001) |
| Stats bar numbers | `GET /api/superadmin/dashboard` | Backend (Port 5000) |
| Live ticker text | `GET /api/tournaments?status=live,registration_open` | Tournament service (Port 5001) |

---

## 🐛 Bugs Fixed

| Bug | Cause | Fix |
|-----|-------|-----|
| Tailwind styles not applying | `vite.config.js` had a syntax error — missing closing `}` causing file to be malformed | Fixed `vite.config.js` structure |
| Dark background from Vite defaults | `src/index.css` still had all default Vite styles including `background-color: #242424` and `body { display: flex }` | Replaced entire `index.css` with `@import "tailwindcss"` |
| Layout broken on mobile | `body { place-items: center }` from Vite default CSS was centering all content | Same fix as above |

---

## 🗂️ Files Created / Modified

```
frontend/
├── src/
│   ├── pages/
│   │   └── HomePage.jsx     ← new
│   ├── App.jsx              ← updated
│   ├── main.jsx             ← updated (added CSS import)
│   └── index.css            ← updated (replaced with @import "tailwindcss")
└── vite.config.js           ← updated (added tailwindcss plugin)
```

---



# 📋 ArenaForage — Frontend Pages Documentation (Mar 12, 2026)

## Overview

Today's session built all user-facing pages for the ArenaForage frontend — Auth, Dashboard, Tournaments, Tournament Detail, and Leaderboard — plus a shared component system (ThemeContext, Navbar) used across all pages.

---

## 🗂️ Files Created / Modified

```
frontend/src/
├── App.jsx                              ← updated (routes wired)
├── context/
│   └── ThemeContext.jsx                 ← new
├── components/
│   └── Navbar.jsx                       ← new
└── pages/
    ├── AuthPage.jsx                     ← new
    ├── DashboardPage.jsx                ← new
    ├── TournamentsPage.jsx              ← new
    ├── TournamentDetailPage.jsx         ← new
    └── LeaderboardPage.jsx              ← new
```

---

## ✅ ThemeContext — `context/ThemeContext.jsx`

Shared dark/light mode state used by every page and component.

### Exports

| Export | Type | Purpose |
|--------|------|---------|
| `ThemeProvider` | Component | Wraps entire app in `App.jsx`. Persists theme to `localStorage` under key `af-theme`. |
| `useTheme()` | Hook | Returns `{ dark, toggle }` — use in any component |
| `tokens(dark)` | Function | Returns color token object based on current theme |

### Token Reference

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `bg` | `#f9fafb` | `#09090b` | Page background |
| `surface` | `#ffffff` | `#18181b` | Cards, panels |
| `surface2` | `#f4f4f5` | `#27272a` | Input backgrounds, secondary areas |
| `border` | `#e4e4e7` | `#3f3f46` | Card/section borders |
| `borderSub` | `#f4f4f5` | `#27272a` | Subtle dividers |
| `textPrim` | `#18181b` | `#f4f4f5` | Headings, primary text |
| `textSub` | `#71717a` | `#a1a1aa` | Secondary text, labels |
| `textMuted` | `#a1a1aa` | `#71717a` | Placeholder, metadata |
| `accent` | `#dc2626` | `#dc2626` | Always red |
| `inputBg` | `#ffffff` | `#27272a` | Form inputs |
| `inputBorder` | `#e4e4e7` | `#3f3f46` | Input borders |
| `shadow` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.4)` | Box shadows |
| `shadowAccent` | `rgba(220,38,38,0.18)` | same | Red glow shadow |

### Usage Pattern

```jsx
import { useTheme, tokens } from "../context/ThemeContext";

function MyComponent() {
  const { dark, toggle } = useTheme();
  const t = tokens(dark);

  return (
    <div style={{ background: t.bg, color: t.textPrim }}>
      <button onClick={toggle}>Toggle Theme</button>
    </div>
  );
}
```

---

## ✅ Navbar — `components/Navbar.jsx`

Shared fixed navbar used on all pages. Accepts `alwaysVisible` prop.

### Props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `alwaysVisible` | boolean | `false` | Forces colored/solid navbar without needing scroll. Use on all pages except HomePage. |

### Features

- Transparent on top of page → colored on scroll (controlled by `alwaysVisible` for inner pages)
- Color cycles every 3s between 3 palettes (white → red → dark zinc in light mode)
- Dark mode toggle pill (☀️/🌙) — updates `localStorage` and `ThemeContext`
- Shows **Log In** + **Join Now** buttons when `MOCK_USER = null`
- Shows **Dashboard** link + avatar initial when `MOCK_USER` is set
- Mobile hamburger menu with all links

### Links (all wired)

| Label | Route |
|-------|-------|
| Tournaments | `/tournaments` |
| Leaderboard | `/leaderboard` |
| How It Works | `/#how-it-works` |
| Log In | `/login` |
| Join Now | `/register` |
| Admin ↗ | `/admin/auth` (pending) |
| Dashboard | `/dashboard` |

### Wiring Auth State

`MOCK_USER` is hardcoded at the top of `Navbar.jsx`. Replace with real auth context when ready:

```jsx
// Replace this:
const MOCK_USER = null;

// With something like:
const { user } = useAuth(); // your auth context
const MOCK_USER = user;
```

---

## ✅ Routes — `App.jsx`

```jsx
<ThemeProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/"                element={<HomePage />}                       />
      <Route path="/login"           element={<AuthPage defaultTab="login" />}    />
      <Route path="/register"        element={<AuthPage defaultTab="register" />} />
      <Route path="/tournaments"     element={<TournamentsPage />}                />
      <Route path="/tournaments/:id" element={<TournamentDetailPage />}           />
      <Route path="/leaderboard"     element={<LeaderboardPage />}                />
      <Route path="/dashboard"       element={<DashboardPage />}                  />
    </Routes>
  </BrowserRouter>
</ThemeProvider>
```

> ⚠️ `/dashboard` has no auth guard yet. Add a `ProtectedRoute` wrapper before going to production.

---

## ✅ AuthPage — `pages/AuthPage.jsx`

**Routes:** `/login` and `/register` — both use the same component with a `defaultTab` prop.

### Props

| Prop | Default | Purpose |
|------|---------|---------|
| `defaultTab` | `"login"` | Sets which tab is active on load. Pass `"register"` for `/register` route. |

### Features

- Single card with Login / Register tab switcher
- Switching tabs changes the URL (`/login` ↔ `/register`) via `<a>` tags — not just state
- Password show/hide toggle (👁️ / 🙈)
- Client-side validation with inline field errors
- Register success screen — shows email verification sent message with the user's email

### Login Form

| Field | Validation |
|-------|-----------|
| Email | Required |
| Password | Required |

On success → redirects to `/dashboard`

On failure → shows red server error banner below fields

API call to wire: `POST /api/users/login`

### Register Form

| Field | Validation |
|-------|-----------|
| Full Name | Required |
| Email | Required |
| Password | Min 8 characters |
| Confirm Password | Must match Password |

On success → shows verification email sent screen

On failure → shows `"This email is already registered."` under email field

API call to wire: `POST /api/users/register`

---

## ✅ DashboardPage — `pages/DashboardPage.jsx`

**Route:** `/dashboard`

Sticky sidebar layout with 5 panels.

### Sidebar

- Avatar with user initial + name + team name
- 5 navigation items with active state highlight
- Unread notification count badge on Notifications item
- Log Out button at bottom (TODO: wire to `POST /api/users/logout`)

### Panel: Profile

- Shows avatar, name, email, email verified badge, member since date, team name
- Edit button reveals inline editable fields for name and email
- Save / Cancel buttons
- API to wire: `PATCH /api/users/profile`

### Panel: My Team

- Shows team name, tag, member count
- Member list with username, role, and Remove button for non-self members
- Invite box (shows only if team has fewer than 5 members) — enter username → sends invite
- If no team: empty state with Create Team button
- APIs to wire: `POST /api/teams`, `POST /api/teams/invite`, `DELETE /api/teams/members/:userId`

### Panel: Notifications

- Lists all notifications with icon by type (🏆 tournament, 🤝 team, 📢 general)
- Unread notifications have red border + red dot
- Mark All Read button (header)
- Per-notification Read and Delete (✕) buttons
- Unread count syncs back to sidebar badge
- APIs to wire: `GET /api/users/notifications`, `PATCH /api/users/notifications/read-all`, `PATCH /api/users/notifications/:id/read`, `DELETE /api/users/notifications/:id`

### Panel: Tournament History

- Stats row: Played / Wins / Prize Earned
- Match history list — rank badge (gold for #1, silver for top 3), tournament name, date, total points, prize won
- APIs to wire: `GET /api/users/profile/full` (returns tournament history from tournament service)

### Panel: Change Password

- Three fields: Current Password, New Password, Confirm New Password
- Validation: new password min 8 chars, confirm must match
- Shows success message on save
- API to wire: `PATCH /api/users/change-password`

### Mock Data (replace with API calls)

```js
// Top of DashboardPage.jsx — replace all MOCK_ constants:
const MOCK_USER        // → GET /api/users/profile
const MOCK_TEAM        // → GET /api/teams/my  (tournament service)
const MOCK_NOTIFICATIONS // → GET /api/users/notifications
const MOCK_HISTORY     // → GET /api/users/profile/full (tournament history field)
```

---

## ✅ TournamentsPage — `pages/TournamentsPage.jsx`

**Route:** `/tournaments`

### Features

- Search bar — filters by tournament title (case-insensitive)
- Status filter chips — All / Open / Live / Completed / Coming Soon
- Sort dropdown — Date (ascending) / Prize Pool (descending) / Slots Available (ascending)
- Results count shown above grid
- Responsive card grid (`auto-fill, minmax(260px, 1fr)`)
- Empty state when no results match filters

### Tournament Card

- Gradient banner with grid texture overlay (6 rotating gradients)
- Status badge (top-right) — color coded
- Prize pool badge (bottom-left of banner)
- Info rows: date, time, entry fee, slots left
- Slot fill bar — green < 70%, amber 70–99%, red = full
- Hover: card lifts, border turns red, title turns red, button fills red
- Clicking card navigates to `/tournaments/:id`

### Status Colors

| Status | Label | Color |
|--------|-------|-------|
| `registration_open` | OPEN | Emerald |
| `live` | LIVE | Red |
| `registration_closed` | CLOSED | Zinc |
| `completed` | DONE | Dark zinc |
| `draft` | SOON | Amber |

### Mock Data

```js
const ALL_TOURNAMENTS // → GET /api/tournaments (tournament service Port 5001)
```

---

## ✅ TournamentDetailPage — `pages/TournamentDetailPage.jsx`

**Route:** `/tournaments/:id`

### Features

- Red gradient hero banner with tournament title, prize pool, entry fee, slots left
- Register Team button (shows only when `status === "registration_open"` and slots available)
- Sticky tab bar with 3 tabs

### Tab: Overview

- Status badge
- About section (description + organizer name)
- Info grid: start date, start time, entry fee, confirmed teams, max players per team, total entries
- Prize pool breakdown with progress bars (gold/silver/bronze colors)

### Tab: Teams & Bracket

- All teams listed — confirmed teams first, unconfirmed (pending) below with reduced opacity
- Each team card shows: rank number, team name, player count, confirmed/pending badge, player list with verified status
- Verified players shown in green, unverified in grey

### Tab: Leaderboard

- When no scores yet — shows empty state + Free Fire points table reference (positions 1-10 with point values)
- When scores exist — renders leaderboard (handled by `LeaderboardPage` component logic)

### TODO

```js
// Get tournament ID from URL params — currently uses MOCK_TOURNAMENT
const { id } = useParams(); // from react-router-dom
// Then: GET /api/tournaments/:id (tournament service)
```

---

## ✅ LeaderboardPage — `pages/LeaderboardPage.jsx`

**Route:** `/leaderboard`

### Features

- Tournament selector dropdown — lists completed and live tournaments
- Switching tournament resets expanded rows

### Podium

- Top 3 teams shown in gold/silver/bronze podium layout
- Order: 2nd (left), 1st (center, tallest), 3rd (right)
- Shows team name, total points, prize won

### Full Rankings Table

| Column | Content |
|--------|---------|
| Rank | Medal icon for top 3, number badge for rest |
| Team | Team name |
| Kills | Total kills across all matches |
| Placement | Total placement points |
| Total | Combined points (placement + kills) |
| Prize | Green badge if prize > 0, dash if none |
| ▾ | Expand button (shows only if match data exists) |

### Expandable Match Breakdown

Clicking a row with match data expands it to show per-match stats:

- Match number
- Placement position
- Kills
- Total points for that match

### Points Table Reference

Footer of the page shows the Free Fire scoring reference:
`#1→12pts, #2→9pts, #3→8pts ... #10→1pts` + `Kill→1pt`

### Mock Data

```js
const COMPLETED_TOURNAMENTS // → GET /api/tournaments?status=completed,live
const MOCK_LEADERBOARDS     // → GET /api/tournaments/:id/leaderboard (tournament service)
```

---

## 🐛 Bugs Fixed

| Bug | File | Cause | Fix |
|-----|------|-------|-----|
| `No routes matched location "/register"` | `App.jsx` | Only `/auth` route existed, HomePage linked to `/register` | Added `/login` and `/register` as separate routes using `defaultTab` prop |
| `No routes matched location "/login"` | `App.jsx` | Same as above | Same fix |
| `Duplicate key "borderBottom"` warning | `TournamentDetailPage.jsx` | Tab button style had both `border:"none"` and `borderBottom` set twice | Removed duplicate, kept only `borderBottom` |
| Navbar links pointing to `/auth` | `Navbar.jsx` | Old `/auth` route used before split | Updated all 4 occurrences (desktop + mobile, login + register) to `/login` and `/register` |
| Tab switch changed UI but not URL | `AuthPage.jsx` | Used `onClick` + `setTab()` to switch between login/register | Replaced buttons with `<a href="/login">` and `<a href="/register">` so URL updates correctly |
| Auth page read URL query param on load | `AuthPage.jsx` | Used `window.location.search` to detect `?tab=register` | Replaced with `defaultTab` prop passed from route definition in `App.jsx` |
| Navbar links all pointing to `#` | `Navbar.jsx` | Placeholder links from initial build | Wired Tournaments → `/tournaments`, Leaderboard → `/leaderboard`, How It Works → `/#how-it-works` |

---



# 🎮 ArenaForage — Frontend (React + Vite)

This is the official frontend repository for **ArenaForage**, a high-performance esports management platform. Built with a focus on speed, aesthetics, and a "competitive-first" user experience.

---

## 🎨 Design System & Aesthetics

The UI is built using **Tailwind CSS v4** with a custom theme engine to provide a premium gaming feel.

* **Color Palette:** * `Primary Accent`: Light Red (#EF4444)
    * `Background`: Deep Grey / Charcoal (#121212)
* **Typography:** Using `Barlow Condensed` for a sharp, industrial esports look.
* **Animations:** Powered by `Framer Motion` for smooth step-transitions and staggered input reveals.
* **Visual Effects:** Glassmorphism, backdrop blurs, and radial gradients for depth.

---

## 🏗️ Architecture: The Multi-Service Bridge

This frontend communicates with two distinct backend services to ensure scalability.

| Service | Port | Primary Responsibility |
| :--- | :--- | :--- |
| **Main Backend** | `5000` | User Auth (MySQL), Global Notifications, Admin Panels |
| **Tournament Service** | `5001` | Teams (MongoDB), Registration, Brackets, Live Scores |

---

## 🚀 Key Features Built

### 1. Verified Tournament Entry Flow
We implemented a secure, invite-only team registration process:
1.  **Step 1: Team Identity:** Create the team profile (Name, Tag) in the Tournament Service.
2.  **Step 2: Roster Mobilization:** The leader invites **4 Primary** and **1 Extra** player.
3.  **Step 3: System-Generated Links:** The backend generates unique registration tokens. Players join the team automatically upon clicking the link in their notification.

### 2. Animated Registration UI
The registration page is not a simple form but an **onboarding experience**:
* Staggered entry animations for roster slots.
* Real-time validation for "Primary vs Extra" roles.
* Success state with "Deployment" feedback.

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── Navbar.jsx          # Glassmorphism & scroll-detection
│   └── ProtectedRoute.jsx  # Auth guards for Leaders/Admins
├── context/
│   └── ThemeContext.jsx    # Red/Grey token management
├── pages/
│   ├── TournamentPage.jsx  # Grid of active/upcoming events
│   └── RegistrationPage.jsx # Multi-step animated roster builder
└── App.jsx                 # Route management
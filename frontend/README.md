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

## 🔜 Next Steps
- [ ] User Login page (`/login`)
- [ ] User Register page (`/register`)
- [ ] Tournaments listing page (`/tournaments`)
- [ ] Tournament detail page (`/tournaments/:id`)
- [ ] User dashboard (profile, team, notifications)
- [ ] Admin dashboard (create tournaments, manage teams/players, analytics)
- [ ] Super Admin dashboard (users, admins, analytics, commission)
- [ ] Connect all mock data to live API endpoints
- [ ] Protected route wrapper (redirect to login if no token)
- [ ] Axios instance with interceptors for token refresh
// src/utils/apiFetch.js
//
// Drop-in replacement for raw fetch() across the entire app.
// Handles token refresh automatically:
//
//   1. Makes the request with credentials (cookies sent automatically)
//   2. If 401 → calls the correct refresh endpoint based on which
//      service was called (main backend vs tournament service)
//   3. Retries the original request once with the new token
//   4. If refresh also fails → redirects to the correct login page
//
// Usage:
//   import apiFetch from "../utils/apiFetch";
//   const data = await apiFetch("http://localhost:5000/api/admin/profile");
//   const data = await apiFetch(`${TOUR_API}/api/tournaments`, { method: "POST", body: JSON.stringify(payload) });

const API      = import.meta.env.VITE_API_URL        || "http://localhost:5000";
const TOUR_API = import.meta.env.VITE_TOURNAMENT_URL || "http://localhost:5001";

/* ─────────────────────────────────────────────
   Detect which role is logged in
   Used to pick the right refresh endpoint
───────────────────────────────────────────── */
function detectRole() {
  // We store the role in sessionStorage when hydrate() is called
  // so we don't need another network call here
  return sessionStorage.getItem("af_role") || null; // "user" | "admin" | null
}

/* ─────────────────────────────────────────────
   Pick the right refresh endpoint per role
───────────────────────────────────────────── */
function getRefreshEndpoint(role) {
  if (role === "admin") return `${API}/api/admin/refresh-token`;
  if (role === "user")  return `${API}/api/users/refresh-token`;
  return null;
}

/* ─────────────────────────────────────────────
   Redirect to correct login page per role
───────────────────────────────────────────── */
function redirectToLogin(role) {
  sessionStorage.removeItem("af_role");
  if (role === "admin") {
    window.location.href = "/admin/login";
  } else {
    window.location.href = "/login";
  }
}

/* ─────────────────────────────────────────────
   Try to refresh the access token
   Returns true if refresh succeeded, false if it failed
───────────────────────────────────────────── */
let isRefreshing = false;           // prevent multiple simultaneous refresh calls
let refreshPromise = null;          // share the same refresh promise across callers

async function tryRefresh(role) {
  // If a refresh is already in progress, wait for it
  if (isRefreshing) return refreshPromise;

  const endpoint = getRefreshEndpoint(role);
  if (!endpoint) return false;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(endpoint, {
        method:      "POST",
        credentials: "include",         // sends refreshToken cookie
        headers:     { "Content-Type": "application/json" },
      });
      return res.ok; // true = new accessToken cookie set by backend
    } catch {
      return false;
    } finally {
      isRefreshing    = false;
      refreshPromise  = null;
    }
  })();

  return refreshPromise;
}

/* ─────────────────────────────────────────────
   MAIN apiFetch
───────────────────────────────────────────── */
const apiFetch = async (url, opts = {}) => {
  const doFetch = () =>
    fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      ...opts,
    });

  // ── First attempt ──
  let res = await doFetch();

  // ── If 401, try refresh then retry once ──
  if (res.status === 401) {
    const role = detectRole();
    const refreshed = await tryRefresh(role);

    if (refreshed) {
      // Retry the original request — new accessToken cookie is now set
      res = await doFetch();
    } else {
      // Refresh failed (refreshToken also expired or invalid)
      // → kick user back to login
      redirectToLogin(role);
      // Throw so the calling code stops executing
      throw new Error("Session expired. Please log in again.");
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export default apiFetch;
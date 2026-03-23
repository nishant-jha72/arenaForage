import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API      = import.meta.env.VITE_API_URL        || "http://localhost:5000";
const TOUR_API = import.meta.env.VITE_TOURNAMENT_URL || "http://localhost:5001";

/* ─────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─────────────────────────────────────────────
   HELPER — silent fetch (no throw on 401)
───────────────────────────────────────────── */
const silentFetch = async (url) => {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    // 401/403 = no cookie / not logged in — return null silently.
    // The browser network tab will still show these — that is NORMAL
    // and expected. It is not a bug. React StrictMode double-invokes
    // effects in dev so you'll see each request twice — also normal.
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || data?.admin || data?.user || data || null;
  } catch {
    return null;
  }
};

/* ─────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────── */
export function AuthProvider({ children }) {
  // "user" | "admin" | null
  const [authType, setAuthType]   = useState(null);
  const [profile,  setProfile]    = useState(null);   // full profile object from backend
  const [team,     setTeam]       = useState(null);   // current team (users only)
  const [loading,  setLoading]    = useState(true);   // true while booting

  /* ── Boot: try user cookie first, then admin cookie ── */
  useEffect(() => {
    const boot = async () => {
      setLoading(true);

      // 1. Try user profile
      const userProfile = await silentFetch(`${API}/api/users/profile`);
      if (userProfile?.id) {
        setProfile(userProfile);
        setAuthType("user");
        sessionStorage.setItem("af_role", "user");   // apiFetch refresh needs this

        // Fetch current team from tournament service
        const teamData = await silentFetch(`${TOUR_API}/api/teams/my`);
        setTeam(teamData?.data || teamData || null);

        setLoading(false);
        return;
      }

      // 2. Try admin profile
      const adminProfile = await silentFetch(`${API}/api/admin/profile`);
      if (adminProfile?.id) {
        setProfile(adminProfile);
        setAuthType("admin");
        sessionStorage.setItem("af_role", "admin");  // apiFetch refresh needs this
        setLoading(false);
        return;
      }

      // 3. Not logged in
      sessionStorage.removeItem("af_role");
      setAuthType(null);
      setProfile(null);
      setLoading(false);
    };

    boot();
  }, []);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    try {
      if (authType === "user") {
        await fetch(`${API}/api/users/logout`, {
          method: "POST", credentials: "include",
        });
        window.location.href = "/login";
      } else if (authType === "admin") {
        await fetch(`${API}/api/admin/logout`, {
          method: "POST", credentials: "include",
        });
        window.location.href = "/admin/login";
      }
    } catch {
      window.location.href = "/";
    }
    sessionStorage.removeItem("af_role");
    setProfile(null);
    setAuthType(null);
    setTeam(null);
  }, [authType]);

  /* ── After login: call this to hydrate context without page reload ── */
  const hydrate = useCallback(async (type) => {
    if (type === "user") {
      const p = await silentFetch(`${API}/api/users/profile`);
      if (p) {
        setProfile(p);
        setAuthType("user");
        sessionStorage.setItem("af_role", "user");   // apiFetch refresh needs this
        const t = await silentFetch(`${TOUR_API}/api/teams/my`);
        setTeam(t?.data || t || null);
      }
    } else if (type === "admin") {
      const p = await silentFetch(`${API}/api/admin/profile`);
      if (p) {
        setProfile(p);
        setAuthType("admin");
        sessionStorage.setItem("af_role", "admin");  // apiFetch refresh needs this
      }
    }
  }, []);

  /* ── Update profile locally after PATCH ── */
  const updateProfile = useCallback((updated) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  }, []);

  /* ── Derived display values (used by Navbar) ── */
  const displayName = profile?.name || null;

  const displaySub  =
    authType === "user"
      ? team?.name   || null          // team name for players
      : authType === "admin"
      ? profile?.organization_name || null   // org name for admins
      : null;

  const avatarInitial =
    profile?.name?.[0]?.toUpperCase() || (authType === "user" ? "U" : "A");

  const isVerified =
    authType === "admin"
      ? profile?.superAdminVerified === "YES"
      : profile?.emailVerified === "YES";

  return (
    <AuthContext.Provider value={{
      /* state */
      authType,       // "user" | "admin" | null
      profile,        // raw profile object
      team,           // current team object (users only)
      loading,        // booting flag

      /* derived (Navbar ready) */
      displayName,    // "Rahul Sharma"
      displaySub,     // team name or org name
      avatarInitial,  // "R"
      isVerified,     // email verified (user) or SA verified (admin)

      /* actions */
      logout,
      hydrate,        // call after login: hydrate("user") or hydrate("admin")
      updateProfile,  // call after PATCH profile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   HOOK
───────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
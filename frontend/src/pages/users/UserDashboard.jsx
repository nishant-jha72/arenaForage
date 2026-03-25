// src/pages/UserDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";

const API      = import.meta.env.VITE_API_URL        || "http://localhost:5000";
const TOUR_API = import.meta.env.VITE_TOURNAMENT_URL || "http://localhost:5001";

// ── Shared primitives ──────────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
    style={{ display: "inline-block", width: size, height: size, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%" }} />
);

const Toast = ({ msg, type, onClose }) => (
  <motion.div initial={{ opacity: 0, y: 40, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }}
    onClick={onClose} style={{ position: "fixed", bottom: 28, left: "50%", zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 12, cursor: "pointer", background: type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", border: `1px solid ${type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`, color: type === "error" ? "#f87171" : "#4ade80", fontSize: 13, backdropFilter: "blur(8px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
    <span>{type === "error" ? "⚠" : "✓"}</span> {msg}
  </motion.div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, color: "#f4f4f5", letterSpacing: "0.02em", lineHeight: 1 }}>{title}</h2>
    {sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</p>}
  </div>
);

const InputRow = ({ label, type = "text", value, onChange, placeholder, disabled }) => {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: "100%", background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${f ? "rgba(220,38,38,0.6)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: disabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)", outline: "none", fontFamily: "'Barlow',sans-serif", boxSizing: "border-box", cursor: disabled ? "not-allowed" : "text", transition: "border-color 0.2s" }} />
    </div>
  );
};

const RedBtn = ({ children, onClick, loading, disabled, style = {} }) => (
  <motion.button onClick={onClick} disabled={loading || disabled}
    whileHover={!loading && !disabled ? { scale: 1.02 } : {}} whileTap={!loading && !disabled ? { scale: 0.97 } : {}}
    style={{ background: loading || disabled ? "rgba(220,38,38,0.35)" : "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, cursor: loading || disabled ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: loading || disabled ? "none" : "0 4px 16px rgba(220,38,38,0.3)", ...style }}>
    {loading && <Spinner size={13} />} {children}
  </motion.button>
);

const fmt = {
  currency: n => `₹${Number(n || 0).toLocaleString("en-IN")}`,
  date: d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  time: d => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
};

// ── NAV ────────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",       label: "Overview",       icon: "▦"  },
  { id: "tournaments",    label: "Tournaments",    icon: "🏆" },
  { id: "profile",        label: "Profile",        icon: "👤" },
  { id: "notifications",  label: "Notifications",  icon: "🔔" },
  { id: "password",       label: "Change Password",icon: "🔒" },
];

// ── OVERVIEW ───────────────────────────────────────────────────────────────────
function OverviewPanel({ user, fullProfile }) {
  const emailOk = !!user?.emailVerified;
  const stats = [
    { label: "Tournaments Played", value: fullProfile?.stats?.total_played   ?? 0, color: "#dc2626" },
    { label: "Wins",               value: fullProfile?.stats?.wins           ?? 0, color: "#22c55e" },
    { label: "Win Rate",           value: fullProfile?.stats?.win_rate != null ? `${fullProfile.stats.win_rate}%` : "0%", color: "#f59e0b" },
    { label: "Email",              value: emailOk ? "✓ Verified" : "✗ Unverified", color: emailOk ? "#22c55e" : "#ef4444" },
  ];
  return (
    <div>
      <SectionHeader title="OVERVIEW" sub={`Welcome back, ${user?.name?.split(" ")[0] || "Player"}`} />
      {!emailOk && (
        <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 10 }}>
          <span>✉️</span>
          <span>Please verify your email address to access all features. Check your inbox for the verification link.</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6 }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", color: "#f4f4f5", lineHeight: 1 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>
      {/* Current team */}
      {fullProfile?.team && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 12 }}>Current Team</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#dc2626,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚔️</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", fontFamily: "'Barlow Condensed',sans-serif" }}>{fullProfile.team.name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{fullProfile.team.tag} · {fullProfile.team.members?.length || 0} members</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TOURNAMENTS ────────────────────────────────────────────────────────────────
const T_STATUS_COLORS = { draft: "#f59e0b", registration_open: "#22c55e", registration_closed: "#71717a", live: "#dc2626", completed: "#3b82f6", cancelled: "#6b7280" };
const T_STATUS_LABELS = { draft: "Soon", registration_open: "Open", registration_closed: "Closed", live: "LIVE", completed: "Done", cancelled: "Cancelled" };

function TournamentsPanel({ toast, userId }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [joining, setJoining]         = useState(null);
  const [joinForm, setJoinForm]       = useState({ teamName: "", teamTag: "" });
  const [joinErr, setJoinErr]         = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    apiFetch(`${TOUR_API}/api/tournaments`)
      .then(res => {
        let all;
        if      (Array.isArray(res))                      all = res;
        else if (Array.isArray(res.data))                 all = res.data;
        else if (Array.isArray(res.data?.tournaments))    all = res.data.tournaments;
        else if (Array.isArray(res.tournaments))          all = res.tournaments;
        else                                              all = [];
        setTournaments(all);
      })
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (tournamentId) => {
    if (!joinForm.teamName.trim() || !joinForm.teamTag.trim()) { setJoinErr("Team name and tag are required."); return; }
    if (joinForm.teamTag.length > 5) { setJoinErr("Tag must be max 5 characters."); return; }
    setJoinLoading(true); setJoinErr("");
    try {
      await apiFetch(`${TOUR_API}/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        body: JSON.stringify({ teamName: joinForm.teamName.trim(), teamTag: joinForm.teamTag.trim().toUpperCase() }),
      });
      toast("Team registered! Share invite links with your squad.", "success");
      setJoining(null);
      setJoinForm({ teamName: "", teamTag: "" });
    } catch (e) { setJoinErr(e.message); }
    finally { setJoinLoading(false); }
  };

  const safe     = Array.isArray(tournaments) ? tournaments : [];
  const filtered = filter === "all" ? safe : safe.filter(t => t?.status === filter);

  return (
    <div>
      <SectionHeader title="TOURNAMENTS" sub="Browse and join esports events" />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all","registration_open","live","completed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", borderColor: filter === s ? "#dc2626" : "rgba(255,255,255,0.1)", background: filter === s ? "rgba(220,38,38,0.12)" : "transparent", color: filter === s ? "#dc2626" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {s === "all" ? "All" : T_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>No tournaments found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {filtered.map((t, i) => {
            const canJoin = t.status === "registration_open";
            const color   = T_STATUS_COLORS[t.status] || "#71717a";
            return (
              <motion.div key={t._id || i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, color: "#f4f4f5", fontWeight: 700 }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{t.game}</p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${color}22`, color, border: `1px solid ${color}44`, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{T_STATUS_LABELS[t.status]}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", marginBottom: 14 }}>
                  {[
                    ["Prize",   t.prize_pool?.total ? fmt.currency(t.prize_pool.total) : "TBA"],
                    ["Entry",   t.registration?.entry_fee ? fmt.currency(t.registration.entry_fee) : "Free"],
                    ["Teams",   `${t.teams?.length || 0}/${t.registration?.max_teams || 12}`],
                    ["Starts",  t.schedule?.start_date ? fmt.date(t.schedule.start_date) : "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{v}</p>
                    </div>
                  ))}
                </div>
                {canJoin && (
                  <button onClick={() => { setJoining(t._id); setJoinErr(""); setJoinForm({ teamName: "", teamTag: "" }); }}
                    style={{ width: "100%", padding: "8px 0", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", cursor: "pointer", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
                    Register Team →
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Join modal */}
      <AnimatePresence>
        {joining && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setJoining(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
              <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#f4f4f5", marginBottom: 6 }}>REGISTER YOUR TEAM</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>You'll receive 4 invite links to share with your squad after registering.</p>
              <InputRow label="Team Name" value={joinForm.teamName} onChange={e => { setJoinForm(p => ({ ...p, teamName: e.target.value })); setJoinErr(""); }} placeholder="GODLIKE" />
              <InputRow label="Team Tag (max 5 chars)" value={joinForm.teamTag} onChange={e => { setJoinForm(p => ({ ...p, teamTag: e.target.value })); setJoinErr(""); }} placeholder="GDL" />
              {joinErr && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><span>⚠</span>{joinErr}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setJoining(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Cancel</button>
                <RedBtn onClick={() => handleJoin(joining)} loading={joinLoading} style={{ flex: 2, justifyContent: "center" }}>Register & Get Invite Links</RedBtn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PROFILE ────────────────────────────────────────────────────────────────────
function ProfilePanel({ user, onUserUpdate, toast }) {
  const [form, setForm]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileRef = useState(null);

  useEffect(() => {
    if (user) setForm({ name: user.name || "" });
  }, [user]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (avatarFile) fd.append("profilePicture", avatarFile);
      const res  = await fetch(`${API}/api/users/update-profile`, {
        method: "PATCH", credentials: "include", body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      onUserUpdate(data.data?.user || data.user || { ...user, name: form.name });
      setEditing(false);
      setAvatarFile(null);
      toast("Profile updated!", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`${API}/api/users/delete-account`, { method: "DELETE" });
      window.location.href = "/";
    } catch (e) { toast(e.message, "error"); setDeleteConfirm(false); }
    finally { setDeleteLoading(false); }
  };

  if (!form) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>;

  return (
    <div>
      <SectionHeader title="PROFILE" sub="Manage your player account" />

      {/* Avatar + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24, padding: "20px 24px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "linear-gradient(135deg,#1d4ed8,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif" }}>
            {avatarPreview || user?.profile_picture
              ? <img src={avatarPreview || user.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : user?.name?.[0]?.toUpperCase() || "P"}
          </div>
          {editing && (
            <label style={{ position: "absolute", bottom: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, border: "2px solid #09090b" }}>
              📷
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
          )}
        </div>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, color: "#f4f4f5", fontWeight: 700 }}>{user?.name}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{user?.email}</p>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: user?.emailVerified ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: user?.emailVerified ? "#4ade80" : "#f87171", border: `1px solid ${user?.emailVerified ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, display: "inline-block", marginTop: 6 }}>
            {user?.emailVerified ? "✓ Email Verified" : "✗ Email Not Verified"}
          </span>
        </div>
      </div>

      {/* Editable fields */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif" }}>Account Details</p>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: "#dc2626", background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "'Barlow',sans-serif" }}>Edit</button>
          )}
        </div>
        <InputRow label="Display Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!editing} placeholder="Your gamer name" />
        <InputRow label="Email (read-only)" value={user?.email || ""} onChange={() => {}} disabled />
        {editing && (
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => { setEditing(false); setForm({ name: user?.name || "" }); setAvatarFile(null); setAvatarPreview(null); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Discard</button>
            <RedBtn onClick={handleSave} loading={loading} style={{ flex: 2, justifyContent: "center" }}>Save Changes</RedBtn>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: 20 }}>
        <p style={{ fontSize: 12, color: "rgba(239,68,68,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 10 }}>Danger Zone</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 13, color: "#f4f4f5" }}>Delete Account</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Permanently deletes your account and all data.</p>
          </div>
          <button onClick={() => setDeleteConfirm(true)} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontSize: 12, fontFamily: "'Barlow',sans-serif", flexShrink: 0, marginLeft: 16 }}>Delete Account</button>
        </div>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }} onClick={e => e.stopPropagation()}
              style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
              <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#f4f4f5", marginBottom: 8 }}>Delete Account</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 24 }}>This permanently deletes your account, team memberships, and all tournament history. This cannot be undone.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff", cursor: deleteLoading ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'Barlow Condensed',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {deleteLoading ? <Spinner size={13} /> : null} Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
const NOTIF_ICONS = { tournament: "🏆", team: "🤝", general: "📢", invite: "📨", payment: "💰" };

function NotificationsPanel({ toast, setUnreadCount }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}/api/users/notifications`);
      const list = data.data?.notifications || data.notifications || [];
      setNotifs(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    setMarking(true);
    try {
      await apiFetch(`${API}/api/users/notifications/read-all`, { method: "PATCH" });
      setNotifs(p => p.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast("All marked as read", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setMarking(false); }
  };

  const markOne = async (id) => {
    try {
      await apiFetch(`${API}/api/users/notifications/${id}/read`, { method: "PATCH" });
      setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch (e) { toast(e.message, "error"); }
  };

  const deleteOne = async (id) => {
    try {
      await apiFetch(`${API}/api/users/notifications/${id}`, { method: "DELETE" });
      setNotifs(p => p.filter(n => n.id !== id));
    } catch (e) { toast(e.message, "error"); }
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeader title="NOTIFICATIONS" sub={unread > 0 ? `${unread} unread` : "All caught up"} />
        {unread > 0 && (
          <button onClick={markAll} disabled={marking} style={{ fontSize: 12, color: "#dc2626", background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "'Barlow',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            {marking ? <Spinner size={11} /> : null} Mark all read
          </button>
        )}
      </div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>🔔</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AnimatePresence>
            {notifs.map(n => (
              <motion.div key={n.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12, height: 0 }}
                style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", borderRadius: 12, position: "relative", background: n.is_read ? "rgba(255,255,255,0.02)" : "rgba(220,38,38,0.05)", border: `1px solid ${n.is_read ? "rgba(255,255,255,0.06)" : "rgba(220,38,38,0.2)"}` }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{NOTIF_ICONS[n.type] || "📢"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#f4f4f5", fontWeight: n.is_read ? 400 : 600 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>{fmt.date(n.created_at)} · {fmt.time(n.created_at)}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!n.is_read && <button onClick={() => markOne(n.id)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>✓</button>}
                  <button onClick={() => deleteOne(n.id)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
                {!n.is_read && <span style={{ position: "absolute", top: 16, right: 70, width: 7, height: 7, borderRadius: "50%", background: "#dc2626" }} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────────
function PwdField({ label, value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", borderRadius: 10, border: `1px solid ${error ? "rgba(239,68,68,0.6)" : focused ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.1)"}`, background: "rgba(255,255,255,0.04)" }}>
        <input type={show ? "text" : "password"} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "'Barlow',sans-serif" }} />
        <button type="button" onClick={() => setShow(p => !p)} style={{ padding: "0 14px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{show ? "🙈" : "👁️"}</button>
      </div>
      {error && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>⚠ {error}</p>}
    </div>
  );
}

function ChangePasswordPanel({ toast }) {
  const [form, setForm]     = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current)               e.current = "Required";
    if (!form.next)                  e.next    = "Required";
    else if (form.next.length < 8)   e.next    = "Min 8 characters";
    if (form.next !== form.confirm)  e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await apiFetch(`${API}/api/users/change-password`, { method: "PATCH", body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }) });
      setForm({ current: "", next: "", confirm: "" });
      setErrors({});
      toast("Password changed successfully!", "success");
    } catch (err) {
      if (err.message.toLowerCase().includes("current") || err.message.toLowerCase().includes("incorrect"))
        setErrors({ current: "Current password is incorrect" });
      else toast(err.message, "error");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 440 }}>
      <SectionHeader title="CHANGE PASSWORD" sub="Keep your account secure" />
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
        <PwdField label="Current Password"     value={form.current} onChange={e => { setForm(p => ({ ...p, current: e.target.value })); setErrors(p => ({ ...p, current: "" })); }} error={errors.current} />
        <PwdField label="New Password"         value={form.next}    onChange={e => { setForm(p => ({ ...p, next: e.target.value }));    setErrors(p => ({ ...p, next: "" }));    }} error={errors.next} />
        <PwdField label="Confirm New Password" value={form.confirm} onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: "" })); }} error={errors.confirm} />
        <RedBtn onClick={handleSubmit} loading={loading} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>Update Password</RedBtn>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const [user,         setUser]         = useState(null);
  const [fullProfile,  setFullProfile]  = useState(null);
  const [activePanel,  setActivePanel]  = useState("overview");
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [toast,        setToastState]   = useState(null);
  const [logoutLoading,setLogoutLoading]= useState(false);
  const [booting,      setBooting]      = useState(true);

  const showToast = useCallback((msg, type = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3500);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Basic profile
        const pRes = await apiFetch(`${API}/api/users/profile`);
        const u = pRes.data?.user || pRes.data || pRes.user;
        setUser(u);

        // Unread notifications
        const uRes = await apiFetch(`${API}/api/users/notifications/unread-count`);
        setUnreadCount(uRes.data?.count || uRes.count || 0);

        // Full profile (tournament history + team) from tournament service
        try {
          const fRes = await apiFetch(`${API}/api/users/profile/full`);
          setFullProfile(fRes.data || fRes);
        } catch (_) {}
      } catch (e) {
        if (e.message.includes("401") || e.message.toLowerCase().includes("unauthorized"))
          window.location.href = "/login";
      } finally { setBooting(false); }
    };
    init();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try { await apiFetch(`${API}/api/users/logout`, { method: "POST" }); }
    finally { window.location.href = "/"; }
  };

  if (booting) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size={32} />
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 16, fontFamily: "'Barlow',sans-serif" }}>Loading dashboard...</p>
      </div>
    </div>
  );

  const panels = {
    overview:      <OverviewPanel user={user} fullProfile={fullProfile} />,
    tournaments:   <TournamentsPanel toast={showToast} userId={user?.id} />,
    profile:       <ProfilePanel user={user} onUserUpdate={setUser} toast={showToast} />,
    notifications: <NotificationsPanel toast={showToast} setUnreadCount={setUnreadCount} />,
    password:      <ChangePasswordPanel toast={showToast} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", fontFamily: "'Barlow',sans-serif", color: "#f4f4f5" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Sidebar */}
      <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        style={{ width: 232, flexShrink: 0, position: "sticky", top: 0, height: "100vh", borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 30 }}>

        {/* Logo + user pill */}
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎮</div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: "#f4f4f5", letterSpacing: "0.06em" }}>ARENAFORAGE</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>PLAYER PANEL</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#1d4ed8,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0, overflow: "hidden" }}>
              {user?.profile_picture
                ? <img src={user.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : user?.name?.[0]?.toUpperCase() || "P"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "#f4f4f5", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "Player"}</p>
              <p style={{ fontSize: 10, color: user?.emailVerified ? "#4ade80" : "#f59e0b" }}>{user?.emailVerified ? "✓ Verified" : "✗ Unverified"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px" }}>
          {NAV.map(item => {
            const active = activePanel === item.id;
            return (
              <motion.button key={item.id} onClick={() => setActivePanel(item.id)} whileHover={{ x: 3 }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: active ? "rgba(220,38,38,0.12)" : "transparent", color: active ? "#f4f4f5" : "rgba(255,255,255,0.4)", cursor: "pointer", textAlign: "left", marginBottom: 2, position: "relative", transition: "background 0.2s, color 0.2s" }}>
                {active && <motion.div layoutId="user-nav-ind" style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 2, background: "#dc2626" }} />}
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontFamily: "'Barlow',sans-serif", fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {item.id === "notifications" && unreadCount > 0 && (
                  <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: "#dc2626", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", fontWeight: 700 }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={handleLogout} disabled={logoutLoading} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: logoutLoading ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>
            {logoutLoading ? <Spinner size={14} /> : <span>🚪</span>}
            <span>Log Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxWidth: "100%", minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activePanel} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}>
            {panels[activePanel]}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToastState(null)} />}
      </AnimatePresence>
    </div>
  );
}
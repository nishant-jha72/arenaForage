import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";  // handles JWT refresh automatically

const API      = import.meta.env.VITE_API_URL        || "http://localhost:5000";
const TOUR_API = import.meta.env.VITE_TOURNAMENT_URL || "http://localhost:5001";

const fmt = {
  currency: (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`,
  date: (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  time: (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
};

/* ─────────────────────────────────────────────
   SMALL SHARED COMPONENTS
───────────────────────────────────────────── */
const Spinner = ({ size = 16 }) => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
    style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(255,255,255,0.2)",
      borderTopColor: "#fff", borderRadius: "50%",
    }}
  />
);

const Toast = ({ msg, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, x: "-50%" }}
    animate={{ opacity: 1, y: 0, x: "-50%" }}
    exit={{ opacity: 0, y: 20, x: "-50%" }}
    style={{
      position: "fixed", bottom: 28, left: "50%",
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px", borderRadius: 12,
      background: type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
      border: `1px solid ${type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
      color: type === "error" ? "#f87171" : "#4ade80",
      fontSize: 13, fontFamily: "'Barlow', sans-serif",
      backdropFilter: "blur(8px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      cursor: "pointer",
    }}
    onClick={onClose}
  >
    <span>{type === "error" ? "⚠" : "✓"}</span> {msg}
  </motion.div>
);

const ConfirmModal = ({ title, message, onConfirm, onCancel, danger = true, loading }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.88, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#18181b", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: 28, maxWidth: 400, width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}
    >
      <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#f4f4f5", marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          background: "transparent", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 13,
          fontFamily: "'Barlow',sans-serif",
        }}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={{
          flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
          background: danger ? "linear-gradient(135deg,#dc2626,#991b1b)" : "linear-gradient(135deg,#16a34a,#15803d)",
          color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13,
          fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.06em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {loading ? <Spinner size={14} /> : null} {title}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const StatCard = ({ label, value, sub, color = "#dc2626", index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", color: "#f4f4f5", lineHeight: 1 }}>{value ?? "—"}</p>
    {sub && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{sub}</p>}
  </motion.div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, color: "#f4f4f5", letterSpacing: "0.02em", lineHeight: 1 }}>{title}</h2>
    {sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</p>}
  </div>
);

const InputRow = ({ label, id, type = "text", value, onChange, placeholder, disabled }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(220,38,38,0.6)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10, padding: "10px 14px", fontSize: 13,
          color: disabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
          outline: "none", fontFamily: "'Barlow',sans-serif",
          boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
          transition: "all 0.2s", boxSizing: "border-box", cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
};

const RedBtn = ({ children, onClick, loading, disabled, style = {} }) => (
  <motion.button
    onClick={onClick} disabled={loading || disabled}
    whileHover={!loading && !disabled ? { scale: 1.02 } : {}}
    whileTap={!loading && !disabled ? { scale: 0.97 } : {}}
    style={{
      background: loading || disabled ? "rgba(220,38,38,0.35)" : "linear-gradient(135deg,#dc2626,#991b1b)",
      color: "#fff", border: "none", borderRadius: 10,
      padding: "10px 22px", fontSize: 13, cursor: loading || disabled ? "not-allowed" : "pointer",
      fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em",
      display: "inline-flex", alignItems: "center", gap: 8,
      boxShadow: loading || disabled ? "none" : "0 4px 16px rgba(220,38,38,0.3)",
      ...style,
    }}
  >
    {loading && <Spinner size={13} />} {children}
  </motion.button>
);

/* ─────────────────────────────────────────────
   NAV ITEMS
───────────────────────────────────────────── */
const NAV = [
  { id: "overview",      label: "Overview",       icon: "▦" },
  { id: "tournaments",   label: "Tournaments",    icon: "🏆" },
  { id: "analytics",     label: "Analytics",      icon: "📊" },
  { id: "notifications", label: "Notifications",  icon: "🔔" },
  { id: "profile",       label: "Profile",        icon: "👤" },
  { id: "password",      label: "Change Password",icon: "🔒" },
];

/* ─────────────────────────────────────────────
   OVERVIEW PANEL
───────────────────────────────────────────── */
function OverviewPanel({ admin, analytics, onRefresh }) {
  const stats = [
    { label: "Tournaments Organised", value: admin?.tournaments_organised ?? 0, color: "#dc2626" },
    { label: "Total Revenue",         value: fmt.currency(admin?.revenue),       color: "#f59e0b" },
    { label: "Email Verified", value: admin?.emailVerified ? "✓ Yes" : "✗ No" },
    { label: "Account Status", value: admin?.superAdminVerified ? "✓ Approved" : "⏳ Pending" },
    ];

  return (
    <div>
      <SectionHeader title="OVERVIEW" sub={`Welcome back, ${admin?.name?.split(" ")[0] || "Admin"}`} />
`{console.log(admin.superAdminVerified)}`
      {!admin?.superAdminVerified && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <p style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>Awaiting Super Admin Approval</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              You can view your profile and notifications. Tournament management unlocks after approval.
            </p>
          </div>
        </motion.div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
      </div>

      {analytics && (
        <>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 14 }}>Tournament Breakdown</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {Object.entries(analytics.tournament_breakdown || {}).map(([status, count], i) => (
              <StatCard key={status} label={status.replace("_", " ")} value={count} index={i} color="rgba(255,255,255,0.2)" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOURNAMENTS PANEL
───────────────────────────────────────────── */
const STATUS_COLORS = {
  draft: "#f59e0b", registration_open: "#22c55e",
  registration_closed: "#71717a", live: "#dc2626",
  completed: "#3b82f6", cancelled: "#6b7280",
};

const STATUS_LABELS = {
  draft: "Draft", registration_open: "Open",
  registration_closed: "Closed", live: "LIVE",
  completed: "Done", cancelled: "Cancelled",
};

function TournamentCard({ t, onAction, saVerified }) {
  const [actLoading, setActLoading] = useState(null);

  const doAction = async (action, payload = {}) => {
    setActLoading(action);
    try { await onAction(t._id, action, payload); }
    finally { setActLoading(null); }
  };

  const actions = [];
  if (saVerified) {
    if (t.status === "draft")              actions.push({ key: "open-registration", label: "Open Registration", color: "#22c55e" });
    if (t.status === "registration_open")  actions.push({ key: "publish-room", label: "Publish Room", color: "#3b82f6" });
    if (t.status === "registration_closed") actions.push({ key: "live", label: "Go Live", color: "#dc2626" });
    if (t.status === "live")               actions.push({ key: "complete", label: "Complete", color: "#22c55e" });
    if (!["completed","cancelled"].includes(t.status)) actions.push({ key: "cancel", label: "Cancel", color: "#6b7280" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: 20, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: STATUS_COLORS[t.status] || "#71717a",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, color: "#f4f4f5", fontWeight: 700 }}>{t.title}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{t.game}</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
          background: `${STATUS_COLORS[t.status]}22`,
          color: STATUS_COLORS[t.status],
          border: `1px solid ${STATUS_COLORS[t.status]}44`,
          fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em",
        }}>{STATUS_LABELS[t.status]}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 14 }}>
        {[
          ["Prize Pool",   fmt.currency(t.prize_pool?.total)],
          ["Entry Fee",    t.registration?.fee ? fmt.currency(t.registration.fee) : "Free"],
          ["Teams",        `${t.teams?.length || 0} / ${t.registration?.max_teams || 12}`],
          ["Starts",       t.schedule?.start_date ? fmt.date(t.schedule.start_date) : "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{v}</p>
          </div>
        ))}
      </div>

      {actions.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {actions.map((a) => (
            <button key={a.key} onClick={() => doAction(a.key)} disabled={!!actLoading}
              style={{
                padding: "6px 14px", borderRadius: 8, border: `1px solid ${a.color}44`,
                background: `${a.color}11`, color: a.color, fontSize: 11,
                cursor: actLoading ? "not-allowed" : "pointer",
                fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.06em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {actLoading === a.key ? <Spinner size={11} /> : null} {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CreateTournamentModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "", game: "", description: "",
    entry_fee: "", max_teams: "12",
    prize_total: "", start_date: "", end_date: "",
    room_id: "", room_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.game.trim()) { setErr("Title and game are required."); return; }
    setLoading(true); setErr("");
    try {
      await onCreate({
        title: form.title.trim(),
        game: form.game.trim(),
        description: form.description.trim(),
        registration: {
          fee: Number(form.entry_fee) || 0,
          max_teams: Number(form.max_teams) || 12,
        },
        prize_pool: { total: Number(form.prize_total) || 0 },
        schedule: {
          ...(form.start_date && { start_date: form.start_date }),
          ...(form.end_date   && { end_date:   form.end_date }),
        },
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#18181b", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18, padding: 28, width: "100%", maxWidth: 520,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, color: "#f4f4f5", marginBottom: 20 }}>CREATE TOURNAMENT</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1" }}><InputRow label="Tournament Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="BGMI Winter Championship" /></div>
          <InputRow label="Game *"       value={form.game}       onChange={e => set("game", e.target.value)}       placeholder="BGMI" />
          <InputRow label="Max Teams"    value={form.max_teams}  onChange={e => set("max_teams", e.target.value)}  placeholder="12" type="number" />
          <InputRow label="Entry Fee (₹)"  value={form.entry_fee}  onChange={e => set("entry_fee", e.target.value)}  placeholder="0" type="number" />
          <InputRow label="Prize Pool (₹)" value={form.prize_total} onChange={e => set("prize_total", e.target.value)} placeholder="50000" type="number" />
          <InputRow label="Start Date"   value={form.start_date} onChange={e => set("start_date", e.target.value)} type="datetime-local" />
          <InputRow label="End Date"     value={form.end_date}   onChange={e => set("end_date", e.target.value)}   type="datetime-local" />
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Tournament details..." rows={3}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)",
                outline: "none", fontFamily: "'Barlow',sans-serif", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {err && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><span>⚠</span>{err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13,
            fontFamily: "'Barlow',sans-serif",
          }}>Cancel</button>
          <RedBtn onClick={submit} loading={loading} style={{ flex: 2, justifyContent: "center" }}>
            Create Tournament
          </RedBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PublishRoomModal({ tournamentId, onClose, onPublish }) {
  const [form, setForm] = useState({ room_id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!form.room_id.trim() || !form.password.trim()) { setErr("Room ID and password are required."); return; }
    setLoading(true); setErr("");
    try { await onPublish(tournamentId, form.room_id.trim(), form.password.trim()); onClose(); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
      >
        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#f4f4f5", marginBottom: 6 }}>PUBLISH ROOM CREDENTIALS</h3>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>Credentials will be emailed to all confirmed team leaders automatically.</p>
        <InputRow label="Room ID"       value={form.room_id}   onChange={e => setForm(p => ({ ...p, room_id: e.target.value }))}   placeholder="ARENA123" />
        <InputRow label="Room Password" value={form.password}  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}  placeholder="••••••••" />
        {err && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}><span>⚠ </span>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Cancel</button>
          <RedBtn onClick={submit} loading={loading} style={{ flex: 2, justifyContent: "center" }}>Publish & Email Leaders</RedBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TournamentsPanel({ saVerified, toast, adminId }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [publishFor, setPublishFor]   = useState(null);
  const [filter, setFilter]           = useState("all");
  const [confirm, setConfirm]         = useState(null);

  const load = useCallback(async (adminId) => {
    setLoading(true);
    try {
      // Try with admin_id filter first — if tournament service doesn't
      // support the query param yet it may 500, so we fall back to
      // fetching all and filtering client-side by admin_id
      const url = adminId
        ? `${TOUR_API}/api/tournaments?admin_id=${adminId}`
        : `${TOUR_API}/api/tournaments`;

      let data;
      try {
        data = await apiFetch(url);
      } catch {
        data = await apiFetch(`${TOUR_API}/api/tournaments`);
      }


      let all;
      if (Array.isArray(data))                          all = data;
      else if (Array.isArray(data.data))                all = data.data;
      else if (Array.isArray(data.data?.tournaments))   all = data.data.tournaments;
      else if (Array.isArray(data.tournaments))         all = data.tournaments;
      else                                              all = [];

      if (!Array.isArray(all)) all = [];

      console.log("🔍 final all:", all, "isArray:", Array.isArray(all));

      const byAdmin = adminId
        ? all.filter(t => String(t.admin_id) === String(adminId))
        : all;

      setTournaments(byAdmin);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(adminId); }, [load, adminId]);

  const handleCreate = async (payload) => {
    const data = await apiFetch(`${TOUR_API}/api/tournaments`, {
      method: "POST", body: JSON.stringify(payload),
    });
    toast("Tournament created!", "success");
    await load(adminId);
    return data;
  };

  const handleAction = async (id, action, payload = {}) => {
    if (action === "publish-room") { setPublishFor(id); return; }
    if (action === "cancel") {
      setConfirm({ id, action, title: "Cancel Tournament", message: "This cannot be undone. All pending invite tokens will expire immediately." });
      return;
    }
    try {
      await apiFetch(`${TOUR_API}/api/tournaments/${id}/${action}`, {
        method: "PATCH", body: JSON.stringify(payload),
      });
      toast(`Tournament ${action.replace("-", " ")} successful!`, "success");
      await load(adminId);
    } catch (e) { toast(e.message, "error"); }
  };

  const handlePublish = async (id, room_id, password) => {
    await apiFetch(`${TOUR_API}/api/tournaments/${id}/publish-room`, {
      method: "PATCH", body: JSON.stringify({ room_id, password }),
    });
    toast("Room credentials published! Leaders emailed.", "success");
    await load(adminId);
  };

  const handleConfirm = async () => {
    const { id, action } = confirm;
    setConfirm((p) => ({ ...p, loading: true }));
    try {
      await apiFetch(`${TOUR_API}/api/tournaments/${id}/${action}`, { method: "PATCH" });
      toast("Tournament cancelled.", "success");
      await load(adminId);
    } catch (e) { toast(e.message, "error"); }
    finally { setConfirm(null); }
  };

  // Triple-guard: tournaments state, safeTournaments, and filtered
  // are ALL guaranteed arrays — .map() will never crash
  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];
  const filtered = Array.isArray(
    filter === "all"
      ? safeTournaments
      : safeTournaments.filter(t => t?.status === filter)
  )
    ? (filter === "all" ? safeTournaments : safeTournaments.filter(t => t?.status === filter))
    : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeader title="TOURNAMENTS" sub="Manage your esports events" />
        {saVerified && (
          <RedBtn onClick={() => setShowCreate(true)}>+ Create Tournament</RedBtn>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "draft", "registration_open", "live", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 14px", borderRadius: 20, border: "1px solid",
            borderColor: filter === s ? "#dc2626" : "rgba(255,255,255,0.1)",
            background: filter === s ? "rgba(220,38,38,0.12)" : "transparent",
            color: filter === s ? "#dc2626" : "rgba(255,255,255,0.4)",
            fontSize: 11, cursor: "pointer",
            fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          No tournaments found.{saVerified ? " Create one to get started." : ""}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {filtered.map((t, i) => (
            // Use _id if available, fallback to index — prevents crash if _id is undefined
            <TournamentCard key={t._id || t.id || i} t={t} onAction={handleAction} saVerified={saVerified} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate   && <CreateTournamentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
        {publishFor   && <PublishRoomModal tournamentId={publishFor} onClose={() => setPublishFor(null)} onPublish={handlePublish} />}
        {confirm      && <ConfirmModal title={confirm.title} message={confirm.message} loading={confirm.loading} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANALYTICS PANEL
───────────────────────────────────────────── */
function AnalyticsPanel({ toast }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API}/api/admin/analytics`)
      .then(res => setData(res.data || res))
      .catch(e => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>;
  if (!data)   return <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No analytics data available yet.</div>;

  const topStats = [
    { label: "Total Tournaments", value: data.total_tournaments,        color: "#dc2626" },
    { label: "Total Revenue",     value: fmt.currency(data.total_revenue), color: "#f59e0b" },
    { label: "Live Tournaments",  value: data.tournament_breakdown?.live  || 0, color: "#22c55e" },
    { label: "Completed",         value: data.tournament_breakdown?.completed || 0, color: "#3b82f6" },
  ];

  return (
    <div>
      <SectionHeader title="ANALYTICS" sub="Your organizer performance" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {topStats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
      </div>

      {/* Revenue over 6 months */}
      {data.revenue_chart && data.revenue_chart.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 16 }}>Revenue — Last 6 Months</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
            {data.revenue_chart.map((m) => {
              const max = Math.max(...data.revenue_chart.map(x => x.revenue), 1);
              const h = Math.max((m.revenue / max) * 100, 4);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
                    style={{ width: "100%", background: "linear-gradient(180deg,#dc2626,#991b1b)", borderRadius: "4px 4px 0 0", minHeight: 4 }}
                  />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming tournaments */}
      {data.upcoming_tournaments && data.upcoming_tournaments.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 14 }}>Upcoming Tournaments</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.upcoming_tournaments.map((t) => (
              <div key={t._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p style={{ fontSize: 13, color: "#f4f4f5" }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{t.game}</p>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{fmt.date(t.schedule?.start_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   NOTIFICATIONS PANEL
───────────────────────────────────────────── */
const NOTIF_ICONS = { tournament: "🏆", team: "🤝", general: "📢", invite: "📨", payment: "💰" };

function NotificationsPanel({ toast, setUnreadCount }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}/api/admin/notifications`);
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
      await apiFetch(`${API}/api/admin/notifications/read-all`, { method: "PATCH" });
      setNotifs(p => p.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast("All notifications marked as read", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setMarking(false); }
  };

  const markOne = async (id) => {
    try {
      await apiFetch(`${API}/api/admin/notifications/${id}/read`, { method: "PATCH" });
      setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch (e) { toast(e.message, "error"); }
  };

  const deleteOne = async (id) => {
    try {
      await apiFetch(`${API}/api/admin/notifications/${id}`, { method: "DELETE" });
      setNotifs(p => p.filter(n => n.id !== id));
    } catch (e) { toast(e.message, "error"); }
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeader title="NOTIFICATIONS" sub={unread > 0 ? `${unread} unread` : "All caught up"} />
        {unread > 0 && (
          <button onClick={markAll} disabled={marking} style={{
            fontSize: 12, color: "#dc2626", background: "transparent", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "'Barlow',sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}>
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
            {notifs.map((n) => (
              <motion.div key={n.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12, height: 0 }}
                style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "14px 16px", borderRadius: 12,
                  background: n.is_read ? "rgba(255,255,255,0.02)" : "rgba(220,38,38,0.05)",
                  border: `1px solid ${n.is_read ? "rgba(255,255,255,0.06)" : "rgba(220,38,38,0.2)"}`,
                  position: "relative",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{NOTIF_ICONS[n.type] || "📢"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#f4f4f5", fontWeight: n.is_read ? 400 : 600 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>{fmt.date(n.created_at)} · {fmt.time(n.created_at)}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!n.is_read && (
                    <button onClick={() => markOne(n.id)} title="Mark as read" style={{
                      width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12,
                    }}>✓</button>
                  )}
                  <button onClick={() => deleteOne(n.id)} title="Delete" style={{
                    width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12,
                  }}>✕</button>
                </div>
                {!n.is_read && (
                  <span style={{ position: "absolute", top: 16, right: 70, width: 7, height: 7, borderRadius: "50%", background: "#dc2626" }} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFILE PANEL
───────────────────────────────────────────── */
function ProfilePanel({ admin, onAdminUpdate, saVerified, toast }) {
  const [form, setForm]         = useState(null);
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (admin) setForm({
      name:              admin.name              || "",
      organization_name: admin.organization_name || "",
      phone_number:      admin.phone_number      || "",
      instagram:         admin.instagram         || "",
      twitter:           admin.twitter           || "",
      facebook:          admin.facebook          || "",
      linkedin:          admin.linkedin          || "",
    });
  }, [admin]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}/api/admin/profile`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      onAdminUpdate(data.data || data.admin || form);
      setEditing(false);
      toast("Profile updated successfully!", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`${API}/api/admin/account`, { method: "DELETE" });
      window.location.href = "/admin/login";
    } catch (e) { toast(e.message, "error"); setDeleteConfirm(false); }
    finally { setDeleteLoading(false); }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  if (!form) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>;

  return (
    <div>
      <SectionHeader title="PROFILE" sub="Manage your admin account" />

      {/* Avatar + meta */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28, padding: "20px 24px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{
          width: 60, height: 60, borderRadius: 14, background: "linear-gradient(135deg,#dc2626,#7f1d1d)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif",
          flexShrink: 0,
        }}>
          {admin?.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#f4f4f5", fontWeight: 700 }}>{admin?.name}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{admin?.email}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <span>
  {admin?.emailVerified ? "✓ Email Verified" : "✗ Email Not Verified"}
</span>

<span>
  {admin?.superAdminVerified ? "✓ SA Approved" : "⏳ Pending SA Approval"}
</span>
          </div>
        </div>
      </div>

      {!saVerified && (
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: "#fbbf24" }}>
          ⚠ Profile editing requires Super Admin approval.
        </div>
      )}

      {/* Editable fields */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif" }}>Account Details</p>
          {saVerified && !editing && (
            <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: "#dc2626", background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "'Barlow',sans-serif" }}>Edit</button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <InputRow label="Full Name"         value={form.name}              onChange={e => set("name", e.target.value)}              disabled={!editing} />
          <InputRow label="Organization"      value={form.organization_name} onChange={e => set("organization_name", e.target.value)} disabled={!editing} />
          <InputRow label="Phone"             value={form.phone_number}      onChange={e => set("phone_number", e.target.value)}      disabled={!editing} placeholder="+91 98765 43210" />
          <InputRow label="Email (read-only)" value={admin?.email || ""}    onChange={() => {}}                                       disabled />
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", margin: "16px 0 12px" }}>Social Links</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <InputRow label="Instagram" value={form.instagram} onChange={e => set("instagram", e.target.value)} disabled={!editing} placeholder="instagram.com/page" />
          <InputRow label="Twitter"   value={form.twitter}   onChange={e => set("twitter",   e.target.value)} disabled={!editing} placeholder="twitter.com/handle" />
          <InputRow label="Facebook"  value={form.facebook}  onChange={e => set("facebook",  e.target.value)} disabled={!editing} placeholder="facebook.com/page" />
          <InputRow label="LinkedIn"  value={form.linkedin}  onChange={e => set("linkedin",  e.target.value)} disabled={!editing} placeholder="linkedin.com/in/name" />
        </div>

        {editing && (
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => { setEditing(false); setForm({ name: admin?.name || "", organization_name: admin?.organization_name || "", phone_number: admin?.phone_number || "", instagram: admin?.instagram || "", twitter: admin?.twitter || "", facebook: admin?.facebook || "", linkedin: admin?.linkedin || "" }); }} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif",
            }}>Discard</button>
            <RedBtn onClick={handleSave} loading={loading} style={{ flex: 2, justifyContent: "center" }}>Save Changes</RedBtn>
          </div>
        )}
      </div>

      {/* Danger zone */}
      {saVerified && (
        <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(239,68,68,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 10 }}>Danger Zone</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, color: "#f4f4f5" }}>Delete Account</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Permanently deletes your account and all associated data including Cloudinary images.</p>
            </div>
            <button onClick={() => setDeleteConfirm(true)} style={{
              padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer",
              fontSize: 12, fontFamily: "'Barlow',sans-serif", flexShrink: 0, marginLeft: 16,
            }}>Delete Account</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Delete Account"
            message="This will permanently delete your admin account, all your data, and your profile picture from Cloudinary. This action cannot be undone."
            loading={deleteLoading}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHANGE PASSWORD PANEL
───────────────────────────────────────────── */
function ChangePasswordPanel({ saVerified, toast }) {
  const [form, setForm]     = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  const validate = () => {
    const e = {};
    if (!form.current)          e.current = "Current password is required";
    if (!form.next)             e.next    = "New password is required";
    else if (form.next.length < 8) e.next = "Password must be at least 8 characters";
    if (form.next !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await apiFetch(`${API}/api/admin/change-password`, {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      setForm({ current: "", next: "", confirm: "" });
      setErrors({});
      toast("Password changed successfully!", "success");
    } catch (e) {
      if (e.message.toLowerCase().includes("current") || e.message.toLowerCase().includes("incorrect")) {
        setErrors({ current: "Current password is incorrect" });
      } else {
        toast(e.message, "error");
      }
    } finally { setLoading(false); }
  };

  const fields = [
    { id: "current", label: "Current Password", placeholder: "Enter current password" },
    { id: "next",    label: "New Password",      placeholder: "Min. 8 characters" },
    { id: "confirm", label: "Confirm New Password", placeholder: "Re-enter new password" },
  ];

  return (
    <div style={{ maxWidth: 440 }}>
      <SectionHeader title="CHANGE PASSWORD" sub="Keep your account secure" />

      {!saVerified && (
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: "#fbbf24" }}>
          ⚠ Password change requires Super Admin approval.
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
        {fields.map((f) => {
          const [focused, setFocused] = useState(false);
          return (
            <div key={f.id} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{f.label}</label>
              <div style={{
                display: "flex", alignItems: "center", borderRadius: 10,
                border: `1px solid ${errors[f.id] ? "rgba(239,68,68,0.6)" : focused ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.04)",
                boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
              }}>
                <input
                  type={showPwd[f.id] ? "text" : "password"}
                  value={form[f.id]}
                  onChange={e => { setForm(p => ({ ...p, [f.id]: e.target.value })); setErrors(p => ({ ...p, [f.id]: "" })); }}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  placeholder={f.placeholder}
                  disabled={!saVerified}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "'Barlow',sans-serif" }}
                />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, [f.id]: !p[f.id] }))}
                  style={{ padding: "0 14px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  {showPwd[f.id] ? "🙈" : "👁️"}
                </button>
              </div>
              {errors[f.id] && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span>{errors[f.id]}</p>}
            </div>
          );
        })}

        <RedBtn onClick={handleSubmit} loading={loading} disabled={!saVerified} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
          Update Password
        </RedBtn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function AdminDashboard() {
  const [admin, setAdmin]           = useState(null);
  const [analytics, setAnalytics]   = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToastState]      = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [booting, setBooting]       = useState(true);

  const showToast = useCallback((msg, type = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3500);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await apiFetch(`${API}/api/admin/profile`);
        const a = profileRes.data || profileRes.admin;
        setAdmin(a);

        const unreadRes = await apiFetch(`${API}/api/admin/notifications/unread-count`);
        setUnreadCount(unreadRes.data?.count || unreadRes.count || 0);

        if (a?.superAdminVerified) {
          try {
            const analyticsRes = await apiFetch(`${API}/api/admin/analytics`);
            setAnalytics(analyticsRes.data || analyticsRes);
          } catch (_) {}
        }
      } catch (e) {
        if (e.message.includes("401") || e.message.toLowerCase().includes("unauthorized")) {
          window.location.href = "/admin/login";
        }
      } finally { setBooting(false); }
    };
    init();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await apiFetch(`${API}/api/admin/logout`, { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  };

 const saVerified = admin?.superAdminVerified;

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Spinner size={32} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 16, fontFamily: "'Barlow',sans-serif" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const panels = {
    overview:      <OverviewPanel admin={admin} analytics={analytics} />,
    tournaments:   <TournamentsPanel saVerified={saVerified} toast={showToast} adminId={admin?.id} />,
    analytics:     <AnalyticsPanel toast={showToast} />,
    notifications: <NotificationsPanel toast={showToast} setUnreadCount={setUnreadCount} />,
    profile:       <ProfilePanel admin={admin} onAdminUpdate={setAdmin} saVerified={saVerified} toast={showToast} />,
    password:      <ChangePasswordPanel saVerified={saVerified} toast={showToast} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", fontFamily: "'Barlow', sans-serif", color: "#f4f4f5" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Grid bg */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, display: "none" }}
            className="mobile-overlay"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 240, flexShrink: 0, position: "sticky", top: 0, height: "100vh",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", zIndex: 30,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎮</div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: "#f4f4f5", letterSpacing: "0.06em" }}>ARENAFORAGE</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>ADMIN PANEL</p>
            </div>
          </div>

          {/* Admin pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#dc2626,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0 }}>
              {admin?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "#f4f4f5", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin?.name || "Admin"}</p>
              <p style={{ fontSize: 10, color: saVerified ? "#4ade80" : "#fbbf24" }}>{saVerified ? "✓ Approved" : "⏳ Pending"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map((item) => {
            const active = activePanel === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                whileHover={{ x: 3 }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, border: "none",
                  background: active ? "rgba(220,38,38,0.12)" : "transparent",
                  color: active ? "#f4f4f5" : "rgba(255,255,255,0.4)",
                  cursor: "pointer", textAlign: "left", marginBottom: 2,
                  position: "relative", transition: "background 0.2s, color 0.2s",
                }}
              >
                {active && <motion.div layoutId="nav-indicator" style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 2, background: "#dc2626" }} />}
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
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={handleLogout} disabled={logoutLoading}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: "rgba(255,255,255,0.35)",
              cursor: logoutLoading ? "not-allowed" : "pointer", fontSize: 13,
              fontFamily: "'Barlow',sans-serif",
            }}
          >
            {logoutLoading ? <Spinner size={14} /> : <span>🚪</span>}
            <span>Log Out</span>
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxWidth: "100%", minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {panels[activePanel]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToastState(null)} />}
      </AnimatePresence>
    </div>
  );
}
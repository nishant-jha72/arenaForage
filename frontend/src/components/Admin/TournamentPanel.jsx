// src/components/admin/TournamentsPanel.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";
import { API, TOUR_API, fmt, Spinner, SectionHeader, InputRow, RedBtn, ConfirmModal } from "./Shared";

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

// ── Tournament Card ────────────────────────────────────────────────────────────
function TournamentCard({ t, onAction, saVerified }) {
  const [actLoading, setActLoading] = useState(null);

  const doAction = async (action) => {
    setActLoading(action);
    try { await onAction(t._id, action); }
    finally { setActLoading(null); }
  };

  const actions = [];
  if (saVerified) {
    if (t.status === "draft")               actions.push({ key: "open-registration", label: "Open Registration", color: "#22c55e" });
    if (t.status === "registration_open")   actions.push({ key: "publish-room",      label: "Publish Room",      color: "#3b82f6" });
    if (t.status === "registration_closed") actions.push({ key: "live",              label: "Go Live",           color: "#dc2626" });
    if (t.status === "live")                actions.push({ key: "complete",          label: "Complete",          color: "#22c55e" });
    if (!["completed","cancelled"].includes(t.status))
                                            actions.push({ key: "cancel",            label: "Cancel",            color: "#6b7280" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: 20, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: STATUS_COLORS[t.status] || "#71717a" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, color: "#f4f4f5", fontWeight: 700 }}>{t.title}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{t.game}</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
          background: `${STATUS_COLORS[t.status]}22`, color: STATUS_COLORS[t.status],
          border: `1px solid ${STATUS_COLORS[t.status]}44`,
          fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em",
        }}>{STATUS_LABELS[t.status]}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 14 }}>
        {[
          ["Prize Pool", fmt.currency(t.prize_pool?.total)],
          ["Entry Fee",  t.registration?.entry_fee ? fmt.currency(t.registration.entry_fee) : "Free"],
          ["Teams",      `${t.teams?.length || 0} / ${t.registration?.max_teams || 12}`],
          ["Starts",     t.schedule?.start_date ? fmt.date(t.schedule.start_date) : "—"],
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
            <button key={a.key} onClick={() => doAction(a.key)} disabled={!!actLoading} style={{
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

// ── Create Tournament Modal ────────────────────────────────────────────────────
function CreateTournamentModal({ onClose, onCreate }) {
  const [form, setForm]     = useState({ title: "", game: "", description: "", entry_fee: "", max_teams: "12", prize_total: "", registration_start: "", registration_end: "", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.game.trim()) { setErr("Title and game are required."); return; }
    if (!form.start_date || !form.end_date || !form.registration_start || !form.registration_end) {
      setErr("All date fields are required."); return;
    }
    setLoading(true); setErr("");
    try {
      await onCreate({
        title:              form.title.trim(),
        game:               form.game.trim(),
        description:        form.description.trim(),
        registration_start: form.registration_start,
        registration_end:   form.registration_end,
        start_date:         form.start_date,
        end_date:           form.end_date,
        entry_fee:          Number(form.entry_fee) || 0,
        prize_pool_total:   Number(form.prize_total) || 0,
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
      >
        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, color: "#f4f4f5", marginBottom: 20 }}>CREATE TOURNAMENT</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1" }}><InputRow label="Tournament Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="BGMI Winter Championship" /></div>
          <InputRow label="Game *"             value={form.game}               onChange={e => set("game", e.target.value)}               placeholder="BGMI" />
          <InputRow label="Max Teams"          value={form.max_teams}          onChange={e => set("max_teams", e.target.value)}          placeholder="12" type="number" />
          <InputRow label="Entry Fee (₹)"      value={form.entry_fee}          onChange={e => set("entry_fee", e.target.value)}          placeholder="0" type="number" />
          <InputRow label="Prize Pool (₹)"     value={form.prize_total}        onChange={e => set("prize_total", e.target.value)}        placeholder="50000" type="number" />
          <InputRow label="Registration Start" value={form.registration_start} onChange={e => set("registration_start", e.target.value)} type="datetime-local" />
          <InputRow label="Registration End"   value={form.registration_end}   onChange={e => set("registration_end", e.target.value)}   type="datetime-local" />
          <InputRow label="Start Date"         value={form.start_date}         onChange={e => set("start_date", e.target.value)}         type="datetime-local" />
          <InputRow label="End Date"           value={form.end_date}           onChange={e => set("end_date", e.target.value)}           type="datetime-local" />
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Tournament details..." rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", outline: "none", fontFamily: "'Barlow',sans-serif", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        </div>
        {err && <p style={{ fontSize: 12, color: "#f87171", margin: "8px 0", display: "flex", alignItems: "center", gap: 6 }}><span>⚠</span>{err}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Cancel</button>
          <RedBtn onClick={submit} loading={loading} style={{ flex: 2, justifyContent: "center" }}>Create Tournament</RedBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Publish Room Modal ─────────────────────────────────────────────────────────
function PublishRoomModal({ tournamentId, onClose, onPublish }) {
  const [form, setForm]     = useState({ room_id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");

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
        <InputRow label="Room ID"       value={form.room_id}  onChange={e => setForm(p => ({ ...p, room_id: e.target.value }))}  placeholder="ARENA123" />
        <InputRow label="Room Password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
        {err && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}><span>⚠ </span>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Cancel</button>
          <RedBtn onClick={submit} loading={loading} style={{ flex: 2, justifyContent: "center" }}>Publish & Email Leaders</RedBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function TournamentsPanel({ saVerified, toast, adminId }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [publishFor, setPublishFor]   = useState(null);
  const [filter, setFilter]           = useState("all");
  const [confirm, setConfirm]         = useState(null);

  const load = useCallback(async (id) => {
    setLoading(true);
    try {
      const url = id ? `${TOUR_API}/api/tournaments?admin_id=${id}` : `${TOUR_API}/api/tournaments`;
      let data;
      try { data = await apiFetch(url); }
      catch { data = await apiFetch(`${TOUR_API}/api/tournaments`); }

      let all;
      if      (Array.isArray(data))                        all = data;
      else if (Array.isArray(data.data))                   all = data.data;
      else if (Array.isArray(data.data?.tournaments))      all = data.data.tournaments;
      else if (Array.isArray(data.tournaments))            all = data.tournaments;
      else                                                 all = [];

      const byAdmin = id ? all.filter(t => String(t.admin_id) === String(id)) : all;
      setTournaments(byAdmin);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(adminId); }, [load, adminId]);

  const handleCreate = async (payload) => {
    await apiFetch(`${TOUR_API}/api/tournaments`, { method: "POST", body: JSON.stringify(payload) });
    toast("Tournament created!", "success");
    await load(adminId);
  };

  const handleAction = async (id, action) => {
    if (action === "publish-room") { setPublishFor(id); return; }
    if (action === "cancel") {
      setConfirm({ id, action, title: "Cancel Tournament", message: "This cannot be undone. All pending invite tokens will expire immediately." });
      return;
    }
    try {
      await apiFetch(`${TOUR_API}/api/tournaments/${id}/${action}`, { method: "PATCH" });
      toast(`Tournament ${action.replace(/-/g, " ")} successful!`, "success");
      await load(adminId);
    } catch (e) { toast(e.message, "error"); }
  };

  const handlePublish = async (id, room_id, password) => {
    await apiFetch(`${TOUR_API}/api/tournaments/${id}/publish-room`, { method: "PATCH", body: JSON.stringify({ room_id, password }) });
    toast("Room credentials published! Leaders emailed.", "success");
    await load(adminId);
  };

  const handleConfirm = async () => {
    const { id, action } = confirm;
    setConfirm(p => ({ ...p, loading: true }));
    try {
      await apiFetch(`${TOUR_API}/api/tournaments/${id}/${action}`, { method: "PATCH" });
      toast("Tournament cancelled.", "success");
      await load(adminId);
    } catch (e) { toast(e.message, "error"); }
    finally { setConfirm(null); }
  };

  const safe     = Array.isArray(tournaments) ? tournaments : [];
  const filtered = filter === "all" ? safe : safe.filter(t => t?.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SectionHeader title="TOURNAMENTS" sub="Manage your esports events" />
        {saVerified && <RedBtn onClick={() => setShowCreate(true)}>+ Create Tournament</RedBtn>}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all","draft","registration_open","live","completed","cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 14px", borderRadius: 20, border: "1px solid",
            borderColor: filter === s ? "#dc2626" : "rgba(255,255,255,0.1)",
            background:  filter === s ? "rgba(220,38,38,0.12)" : "transparent",
            color:       filter === s ? "#dc2626" : "rgba(255,255,255,0.4)",
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
            <TournamentCard key={t._id || t.id || i} t={t} onAction={handleAction} saVerified={saVerified} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
        {publishFor && <PublishRoomModal tournamentId={publishFor} onClose={() => setPublishFor(null)} onPublish={handlePublish} />}
        {confirm    && <ConfirmModal title={confirm.title} message={confirm.message} loading={confirm.loading} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}
      </AnimatePresence>
    </div>
  );
}
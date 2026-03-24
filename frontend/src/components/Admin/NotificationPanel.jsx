// src/components/admin/NotificationsPanel.jsx
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";
import { API, fmt, Spinner, SectionHeader } from "./Shared";

const ICONS = { tournament: "🏆", team: "🤝", general: "📢", invite: "📨", payment: "💰" };

export default function NotificationsPanel({ toast, setUnreadCount }) {
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
                  padding: "14px 16px", borderRadius: 12, position: "relative",
                  background: n.is_read ? "rgba(255,255,255,0.02)" : "rgba(220,38,38,0.05)",
                  border: `1px solid ${n.is_read ? "rgba(255,255,255,0.06)" : "rgba(220,38,38,0.2)"}`,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{ICONS[n.type] || "📢"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#f4f4f5", fontWeight: n.is_read ? 400 : 600 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>{fmt.date(n.created_at)} · {fmt.time(n.created_at)}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!n.is_read && (
                    <button onClick={() => markOne(n.id)} title="Mark as read" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>✓</button>
                  )}
                  <button onClick={() => deleteOne(n.id)} title="Delete" style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12 }}>✕</button>
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
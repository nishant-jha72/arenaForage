// src/components/admin/AdminSidebar.jsx
import { motion } from "framer-motion";
import { Spinner } from "./Shared";

const NAV = [
  { id: "overview",      label: "Overview",        icon: "▦"  },
  { id: "tournaments",   label: "Tournaments",     icon: "🏆" },
  { id: "analytics",     label: "Analytics",       icon: "📊" },
  { id: "notifications", label: "Notifications",   icon: "🔔" },
  { id: "profile",       label: "Profile",         icon: "👤" },
  { id: "password",      label: "Change Password", icon: "🔒" },
];

export default function AdminSidebar({ admin, saVerified, activePanel, setActivePanel, unreadCount, onLogout, logoutLoading }) {
  return (
    <motion.aside
      initial={{ x: -280 }} animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 240, flexShrink: 0, position: "sticky", top: 0, height: "100vh",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        display: "flex", flexDirection: "column",
        overflowY: "auto", zIndex: 30,
      }}
    >
      {/* Logo + admin pill */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎮</div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: "#f4f4f5", letterSpacing: "0.06em" }}>ARENAFORAGE</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>ADMIN PANEL</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#dc2626,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0 }}>
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: "#f4f4f5", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin?.name || "Admin"}</p>
            <p style={{ fontSize: 10, color: saVerified ? "#4ade80" : "#fbbf24" }}>
              {saVerified ? "✓ Approved" : "⏳ Pending"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
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
              {active && (
                <motion.div layoutId="nav-indicator" style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: 2, background: "#dc2626" }} />
              )}
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
        <button onClick={onLogout} disabled={logoutLoading} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent", color: "rgba(255,255,255,0.35)",
          cursor: logoutLoading ? "not-allowed" : "pointer", fontSize: 13,
          fontFamily: "'Barlow',sans-serif",
        }}>
          {logoutLoading ? <Spinner size={14} /> : <span>🚪</span>}
          <span>Log Out</span>
        </button>
      </div>
    </motion.aside>
  );
}
// src/components/admin/shared.jsx
import { useState } from "react";
import { motion } from "framer-motion";

export const API      = import.meta.env.VITE_API_URL        || "http://localhost:5000";
export const TOUR_API = import.meta.env.VITE_TOURNAMENT_URL || "http://localhost:5001";

export const fmt = {
  currency: (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`,
  date: (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  time: (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
};

export const Spinner = ({ size = 16 }) => (
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

export const Toast = ({ msg, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, x: "-50%" }}
    animate={{ opacity: 1, y: 0,  x: "-50%" }}
    exit={{   opacity: 0, y: 20,  x: "-50%" }}
    onClick={onClose}
    style={{
      position: "fixed", bottom: 28, left: "50%",
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px", borderRadius: 12, cursor: "pointer",
      background: type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
      border: `1px solid ${type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
      color: type === "error" ? "#f87171" : "#4ade80",
      fontSize: 13, fontFamily: "'Barlow', sans-serif",
      backdropFilter: "blur(8px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}
  >
    <span>{type === "error" ? "⚠" : "✓"}</span> {msg}
  </motion.div>
);

export const ConfirmModal = ({ title, message, onConfirm, onCancel, danger = true, loading }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onCancel}
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
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

export const StatCard = ({ label, value, sub, color = "#dc2626", index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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

export const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, color: "#f4f4f5", letterSpacing: "0.02em", lineHeight: 1 }}>{title}</h2>
    {sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</p>}
  </div>
);

export const InputRow = ({ label, id, type = "text", value, onChange, placeholder, disabled }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(220,38,38,0.6)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10, padding: "10px 14px", fontSize: 13,
          color: disabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
          outline: "none", fontFamily: "'Barlow',sans-serif",
          boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
          transition: "all 0.2s", boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
};

export const RedBtn = ({ children, onClick, loading, disabled, style = {} }) => (
  <motion.button
    onClick={onClick} disabled={loading || disabled}
    whileHover={!loading && !disabled ? { scale: 1.02 } : {}}
    whileTap={!loading  && !disabled ? { scale: 0.97 } : {}}
    style={{
      background: loading || disabled ? "rgba(220,38,38,0.35)" : "linear-gradient(135deg,#dc2626,#991b1b)",
      color: "#fff", border: "none", borderRadius: 10,
      padding: "10px 22px", fontSize: 13,
      cursor: loading || disabled ? "not-allowed" : "pointer",
      fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em",
      display: "inline-flex", alignItems: "center", gap: 8,
      boxShadow: loading || disabled ? "none" : "0 4px 16px rgba(220,38,38,0.3)",
      ...style,
    }}
  >
    {loading && <Spinner size={13} />} {children}
  </motion.button>
);
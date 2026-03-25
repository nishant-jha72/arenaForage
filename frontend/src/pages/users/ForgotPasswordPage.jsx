// src/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [focused,  setFocused]  = useState(false);

  const handleSubmit = async () => {
    if (!email.trim())                     { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email))       { setError("Enter a valid email"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/users/forgot-password`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed.");
      setSent(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Barlow',sans-serif" }}
      onKeyDown={e => e.key === "Enter" && !sent && handleSubmit()}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
        style={{ width: "100%", maxWidth: 400, position: "relative" }}>

        <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: 28, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
          ← Back to login
        </a>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 8 }}>Account Recovery</p>
                <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: "#f4f4f5", lineHeight: 1, marginBottom: 10 }}>FORGOT PASSWORD?</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.6 }}>Enter your registered email address and we'll send you a password reset link.</p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 24 }}>
                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 8 }}>Email Address</label>
                <div style={{ display: "flex", alignItems: "center", borderRadius: 12, border: `1px solid ${error ? "rgba(239,68,68,0.7)" : focused ? "rgba(220,38,38,0.55)" : "rgba(255,255,255,0.09)"}`, background: focused ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)", boxShadow: focused && !error ? "0 0 0 3px rgba(220,38,38,0.09)" : error ? "0 0 0 3px rgba(239,68,68,0.09)" : "none", transition: "all 0.2s", marginBottom: 8 }}>
                  <span style={{ paddingLeft: 14, fontSize: 15 }}>✉️</span>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder="player@gmail.com" autoComplete="email"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 12px", fontSize: 13, color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow',sans-serif" }} />
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ fontSize: 11, color: "#f87171", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>⚠</span> {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button onClick={handleSubmit} disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: loading ? "rgba(220,38,38,0.4)" : "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(220,38,38,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                  {loading ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%" }} /> Sending...</>
                  ) : "Send Reset Link →"}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ textAlign: "center" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280 }} style={{ fontSize: 56, marginBottom: 20 }}>📬</motion.div>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: "#f4f4f5", marginBottom: 10 }}>CHECK YOUR INBOX</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Reset link sent to</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 20 }}>{email}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", lineHeight: 1.7, marginBottom: 28 }}>
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              <button onClick={() => { setSent(false); setEmail(""); }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontFamily: "'Barlow',sans-serif" }}>
                Try a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
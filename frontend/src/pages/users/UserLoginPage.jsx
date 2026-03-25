// src/pages/UserLoginPage.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TAGS = [
  { text: "BGMI",      x: "6%",  y: "15%", delay: 0    },
  { text: "FREE FIRE", x: "68%", y: "10%", delay: 0.35 },
  { text: "VALORANT",  x: "75%", y: "60%", delay: 0.7  },
  { text: "COD",       x: "4%",  y: "70%", delay: 0.5  },
  { text: "ESPORTS",   x: "60%", y: "85%", delay: 0.9  },
  { text: "TOURNEY",   x: "8%",  y: "88%", delay: 0.2  },
];

export default function UserLoginPage() {
  const navigate        = useNavigate();
  const { hydrate }     = useAuth();

  const [form, setForm]           = useState({ email: "", password: "" });
  const [errors, setErrors]       = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [shake, setShake]         = useState(false);
  const [focused, setFocused]     = useState({ email: false, password: false });

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
    setServerErr("");
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())                     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
    if (!form.password)                         e.password = "Password is required";
    return e;
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); triggerShake(); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmail: form.email.trim().toLowerCase(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || "";
        if (res.status === 403 && msg.toLowerCase().includes("banned"))  throw new Error("Your account has been banned. Contact support.");
        if (res.status === 403 && msg.toLowerCase().includes("email"))   throw new Error("Please verify your email before logging in.");
        if (res.status === 401)                                          throw new Error("Invalid email or password.");
        if (res.status === 429)                                          throw new Error("Too many attempts. Wait 15 minutes.");
        throw new Error(msg || "Login failed.");
      }
      await hydrate("user");
      navigate("/user/dashboard");
    } catch (err) { setServerErr(err.message); triggerShake(); }
    finally { setLoading(false); }
  };

  const fields = [
    { id: "email",    label: "Email Address", type: "email",    placeholder: "player@gmail.com",     icon: "✉️" },
    { id: "password", label: "Password",      type: "password", placeholder: "Enter your password",  icon: "🔒" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#09090b", fontFamily: "'Barlow',sans-serif" }}
      onKeyDown={e => e.key === "Enter" && handleSubmit()}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── LEFT PANEL ── */}
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ width: "50%", position: "relative", overflow: "hidden", display: "none" }}
        className="lg:block"
      >
        {/* bg */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#0f0507 0%,#0c0c10 55%,#080d12 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, background: "radial-gradient(ellipse at top right,rgba(220,38,38,0.14) 0%,transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 260, height: 260, background: "radial-gradient(ellipse at bottom left,rgba(220,38,38,0.08) 0%,transparent 65%)" }} />

        {/* floating tags */}
        {TAGS.map(tag => (
          <motion.div key={tag.text} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: tag.delay + 0.5, duration: 0.45, ease: "backOut" }}
            style={{ position: "absolute", left: tag.x, top: tag.y, padding: "3px 12px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.18)", fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: "0.12em", userSelect: "none" }}>
            {tag.text}
          </motion.div>
        ))}

        {/* content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "40px 48px" }}>
          {/* logo */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎮</div>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>ARENAFORAGE</span>
          </motion.div>

          {/* hero */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#dc2626", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed',sans-serif" }}>
              <span style={{ display: "inline-block", width: 28, height: 1, background: "#dc2626" }} /> Player Portal
            </p>
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(44px,4.5vw,68px)", color: "#f4f4f5", letterSpacing: "-0.01em", lineHeight: 1, marginBottom: 20 }}>
              COMPETE.<br /><span style={{ color: "#dc2626", fontStyle: "italic" }}>WIN.</span><br />DOMINATE.
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", maxWidth: 300, lineHeight: 1.7 }}>
              Join thousands of players competing in BGMI, Free Fire, Valorant and more. Register your team, earn prizes.
            </p>
          </motion.div>

          {/* stats */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[["12K+","Players"],["340+","Tournaments"],["₹8L+","Prizes"]].map(([val, lbl]) => (
              <div key={lbl} style={{ padding: "18px 16px", background: "rgba(255,255,255,0.03)", textAlign: "center" }}>
                <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: "#f4f4f5", lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{lbl}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, background: "radial-gradient(ellipse,rgba(220,38,38,0.05) 0%,transparent 70%)", pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22,1,0.36,1], delay: 0.15 }}
          style={{ width: "100%", maxWidth: 420, position: "relative" }}>

          {/* mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }} className="lg:hidden">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎮</div>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.45)" }}>ARENAFORAGE</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Barlow Condensed',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 14, height: 1, background: "#dc2626" }} /> Welcome back
            </p>
            <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(32px,5vw,48px)", color: "#f4f4f5", letterSpacing: "-0.01em", lineHeight: 1 }}>PLAYER LOGIN</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>Sign in to join tournaments and manage your team</p>
          </motion.div>

          {/* form card */}
          <motion.div animate={shake ? { x: [0,-10,10,-8,8,-4,4,0] } : {}} transition={{ duration: 0.45 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

              {fields.map((field, i) => (
                <motion.div key={field.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>{field.label}</label>
                    {field.id === "password" && (
                      <a href="/forgot-password" style={{ fontSize: 11, color: "#dc2626", textDecoration: "none" }}>Forgot password?</a>
                    )}
                  </div>
                  <motion.div style={{ display: "flex", alignItems: "center", borderRadius: 12, border: `1px solid ${errors[field.id] ? "rgba(239,68,68,0.7)" : focused[field.id] ? "rgba(220,38,38,0.55)" : "rgba(255,255,255,0.09)"}`, background: focused[field.id] ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)", boxShadow: focused[field.id] && !errors[field.id] ? "0 0 0 3px rgba(220,38,38,0.09)" : errors[field.id] ? "0 0 0 3px rgba(239,68,68,0.09)" : "none", transition: "all 0.2s" }}>
                    <span style={{ paddingLeft: 14, fontSize: 15, userSelect: "none" }}>{field.icon}</span>
                    <input
                      type={field.id === "password" ? (showPwd ? "text" : "password") : field.type}
                      value={form[field.id]} placeholder={field.placeholder}
                      onChange={e => set(field.id, e.target.value)}
                      onFocus={() => setFocused(p => ({ ...p, [field.id]: true }))}
                      onBlur={()  => setFocused(p => ({ ...p, [field.id]: false }))}
                      autoComplete={field.id === "password" ? "current-password" : "email"}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 12px", fontSize: 13, color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow',sans-serif" }}
                    />
                    {field.id === "password" && (
                      <button type="button" onClick={() => setShowPwd(p => !p)} style={{ paddingRight: 14, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                        {showPwd ? "🙈" : "👁️"}
                      </button>
                    )}
                  </motion.div>
                  <AnimatePresence>
                    {errors[field.id] && (
                      <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ fontSize: 11, color: "#f87171", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>⚠</span> {errors[field.id]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              <AnimatePresence>
                {serverErr && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚠</span> {serverErr}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                onClick={handleSubmit} disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
                style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: loading ? "rgba(220,38,38,0.4)" : "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(220,38,38,0.38)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%" }} /> Signing in...</>
                ) : "Sign In →"}
              </motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            style={{ marginTop: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              New to ArenaForage?{" "}
              <a href="/register" style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none" }}>Create Account →</a>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>or</span>
              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Are you an organizer?{" "}
              <a href="/admin/login" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Admin login ↗</a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
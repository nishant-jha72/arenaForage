// src/pages/ResetPasswordPage.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const validatePassword = (pwd) => ({
  length:    pwd.length >= 8,
  uppercase: /[A-Z]/.test(pwd),
  lowercase: /[a-z]/.test(pwd),
  number:    /[0-9]/.test(pwd),
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  // Token comes from URL ?token=xxx
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const [form, setForm]         = useState({ password: "", confirm: "" });
  const [errors, setErrors]     = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState({ password: false, confirm: false });
  const [focused, setFocused]   = useState({});
  const [done, setDone]         = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); setServerErr(""); };

  const validate = () => {
    const e = {};
    const c = validatePassword(form.password);
    if (!form.password)      e.password = "Password is required";
    else if (!c.length)      e.password = "Minimum 8 characters";
    else if (!c.uppercase)   e.password = "Needs at least one uppercase letter";
    else if (!c.number)      e.password = "Needs at least one number";
    if (!form.confirm)       e.confirm  = "Please confirm your password";
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    if (!token) { setServerErr("Invalid or missing reset token. Request a new one."); return; }
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users/reset-password`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.message?.toLowerCase().includes("expired"))
          throw new Error("This reset link has expired. Request a new one.");
        throw new Error(data.message || "Reset failed.");
      }
      setDone(true);
    } catch (err) { setServerErr(err.message); }
    finally { setLoading(false); }
  };

  const checks = validatePassword(form.password);
  const passed = Object.values(checks).filter(Boolean).length;
  const strengthColors = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"];

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Barlow',sans-serif" }}
      onKeyDown={e => e.key === "Enter" && !done && handleSubmit()}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 400 }}>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 8 }}>Set New Password</p>
                <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: "#f4f4f5", lineHeight: 1, marginBottom: 10 }}>RESET PASSWORD</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)" }}>Choose a strong password for your account.</p>
              </div>

              {!token && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#f87171" }}>
                  ⚠ No reset token found. <a href="/forgot-password" style={{ color: "#dc2626", fontWeight: 700 }}>Request a new link →</a>
                </div>
              )}

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 24 }}>
                {[
                  { id: "password", label: "New Password",     placeholder: "Min. 8 characters" },
                  { id: "confirm",  label: "Confirm Password", placeholder: "Re-enter password" },
                ].map((field, i) => (
                  <div key={field.id} style={{ marginBottom: field.id === "password" ? 4 : 18 }}>
                    <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 7 }}>{field.label}</label>
                    <div style={{ display: "flex", alignItems: "center", borderRadius: 12, border: `1px solid ${errors[field.id] ? "rgba(239,68,68,0.7)" : focused[field.id] ? "rgba(220,38,38,0.55)" : "rgba(255,255,255,0.09)"}`, background: "rgba(255,255,255,0.025)", transition: "all 0.2s" }}>
                      <span style={{ paddingLeft: 14, fontSize: 15 }}>{field.id === "password" ? "🔒" : "🔐"}</span>
                      <input
                        type={showPwd[field.id] ? "text" : "password"}
                        value={form[field.id]} placeholder={field.placeholder}
                        onChange={e => set(field.id, e.target.value)}
                        onFocus={() => setFocused(p => ({ ...p, [field.id]: true }))}
                        onBlur={()  => setFocused(p => ({ ...p, [field.id]: false }))}
                        autoComplete="new-password"
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 12px", fontSize: 13, color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow',sans-serif" }}
                      />
                      <button type="button" onClick={() => setShowPwd(p => ({ ...p, [field.id]: !p[field.id] }))}
                        style={{ paddingRight: 14, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                        {showPwd[field.id] ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors[field.id] && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          style={{ fontSize: 11, color: "#f87171", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                          <span>⚠</span> {errors[field.id]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {/* Strength bar under password */}
                    {field.id === "password" && form.password && (
                      <div style={{ marginTop: 8, marginBottom: 14 }}>
                        <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passed ? strengthColors[passed] : "rgba(255,255,255,0.1)" }} />
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          {[["length","8+"],["uppercase","A-Z"],["lowercase","a-z"],["number","0-9"]].map(([k, lbl]) => (
                            <span key={k} style={{ fontSize: 10, color: checks[k] ? "#22c55e" : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 3 }}>
                              <span>{checks[k] ? "✓" : "○"}</span>{lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <AnimatePresence>
                  {serverErr && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠</span> {serverErr} {serverErr.includes("expired") && <a href="/forgot-password" style={{ color: "#dc2626", fontWeight: 700 }}>Get new link →</a>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button onClick={handleSubmit} disabled={loading || !token}
                  whileHover={!loading && token ? { scale: 1.02 } : {}} whileTap={!loading && token ? { scale: 0.97 } : {}}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: loading || !token ? "rgba(220,38,38,0.4)" : "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.1em", cursor: loading || !token ? "not-allowed" : "pointer", boxShadow: loading || !token ? "none" : "0 8px 24px rgba(220,38,38,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%" }} /> Resetting...</>
                  ) : "Reset Password →"}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ textAlign: "center" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280 }} style={{ fontSize: 56, marginBottom: 20 }}>🔓</motion.div>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: "#f4f4f5", marginBottom: 10 }}>PASSWORD RESET!</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 1.7 }}>Your password has been successfully updated. You can now sign in with your new password.</p>
              <motion.button onClick={() => navigate("/login")}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.1em", cursor: "pointer", boxShadow: "0 8px 24px rgba(220,38,38,0.35)" }}>
                Sign In →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
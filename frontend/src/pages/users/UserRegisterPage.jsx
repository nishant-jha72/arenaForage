// src/pages/UserRegisterPage.jsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const validatePassword = (pwd) => ({
  length:    pwd.length >= 8,
  uppercase: /[A-Z]/.test(pwd),
  lowercase: /[a-z]/.test(pwd),
  number:    /[0-9]/.test(pwd),
});

function StrengthBar({ password }) {
  if (!password) return null;
  const checks  = validatePassword(password);
  const passed  = Object.values(checks).filter(Boolean).length;
  const colors  = ["","#ef4444","#f59e0b","#3b82f6","#22c55e"];
  const labels  = ["","Weak","Fair","Good","Strong"];
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <motion.div key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.04 }}
            style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passed ? colors[passed] : "rgba(255,255,255,0.1)", transformOrigin: "left" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {[["length","8+"],["uppercase","A-Z"],["lowercase","a-z"],["number","0-9"]].map(([k, lbl]) => (
            <motion.span key={k} animate={{ color: checks[k] ? "#22c55e" : "rgba(255,255,255,0.3)" }} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
              <span>{checks[k] ? "✓" : "○"}</span>{lbl}
            </motion.span>
          ))}
        </div>
        {passed > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: colors[passed] }}>{labels[passed]}</span>}
      </div>
    </motion.div>
  );
}

export default function UserRegisterPage() {
  const [form, setForm]         = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors]     = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState({ password: false, confirmPassword: false });
  const [focused, setFocused]   = useState({});
  const [avatar, setAvatar]     = useState(null);     // File object
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [success, setSuccess]   = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); setServerErr(""); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, avatar: "Max file size is 5MB" })); return; }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrors(p => ({ ...p, avatar: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                      e.name    = "Full name is required";
    if (!form.email.trim())                     e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = "Enter a valid email";
    const pwdChecks = validatePassword(form.password);
    if (!form.password)                         e.password = "Password is required";
    else if (!pwdChecks.length)                 e.password = "Minimum 8 characters";
    else if (!pwdChecks.uppercase)              e.password = "Needs at least one uppercase letter";
    else if (!pwdChecks.lowercase)              e.password = "Needs at least one lowercase letter";
    else if (!pwdChecks.number)                 e.password = "Needs at least one number";
    if (!form.confirmPassword)                  e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      // multipart/form-data because of optional profile picture
      const fd = new FormData();
      fd.append("name",     form.name.trim());
      fd.append("email",    form.email.trim().toLowerCase());
      fd.append("password", form.password);
      if (avatar) fd.append("profilePicture", avatar);

      const res  = await fetch(`${API}/api/users/register`, {
        method: "POST", credentials: "include", body: fd,
        // No Content-Type header — browser sets multipart boundary automatically
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || "";
        if (res.status === 409 || msg.toLowerCase().includes("already")) {
          setErrors({ email: "This email is already registered." }); return;
        }
        throw new Error(msg || "Registration failed.");
      }
      setSuccess(true);
    } catch (err) { setServerErr(err.message); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Barlow',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}
        style={{ textAlign: "center", maxWidth: 420 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300 }} style={{ fontSize: 64, marginBottom: 20 }}>✉️</motion.div>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: "#f4f4f5", letterSpacing: "0.02em", marginBottom: 10 }}>CHECK YOUR EMAIL</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>We've sent a verification link to</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 20 }}>{form.email}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 28 }}>
          Click the link in the email to verify your account. Check spam if you don't see it.
        </p>
        <a href="/login" style={{ display: "inline-block", padding: "11px 32px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 13, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em" }}>
          Back to Login
        </a>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", fontFamily: "'Barlow',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* bg grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse at top,rgba(220,38,38,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        style={{ width: "100%", maxWidth: 520, position: "relative" }}>

        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🎮</div>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>ARENAFORAGE</span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Barlow Condensed',sans-serif" }}>Join the arena</p>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(30px,5vw,44px)", color: "#f4f4f5", letterSpacing: "-0.01em", lineHeight: 1 }}>CREATE YOUR ACCOUNT</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>Start competing in tournaments today</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

          {/* Avatar upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ width: 68, height: 68, borderRadius: 16, background: avatarPreview ? "transparent" : "rgba(220,38,38,0.08)", border: `2px dashed ${avatarPreview ? "#dc2626" : "rgba(255,255,255,0.1)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, transition: "border-color 0.2s" }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 24 }}>📷</span>}
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#f4f4f5", fontWeight: 600, marginBottom: 4 }}>Profile Picture</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Optional · Max 5MB</p>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ fontSize: 11, color: "#dc2626", background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 7, padding: "4px 12px", cursor: "pointer", fontFamily: "'Barlow',sans-serif" }}>
                {avatarPreview ? "Change" : "Upload"}
              </button>
              {errors.avatar && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>⚠ {errors.avatar}</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </div>

          {/* Fields */}
          {[
            { id: "name",            label: "Full Name",         type: "text",     placeholder: "Your gamer name", icon: "👤" },
            { id: "email",           label: "Email Address",     type: "email",    placeholder: "player@gmail.com", icon: "✉️" },
            { id: "password",        label: "Password",          type: "password", placeholder: "Min. 8 characters", icon: "🔒" },
            { id: "confirmPassword", label: "Confirm Password",  type: "password", placeholder: "Re-enter password", icon: "🔐" },
          ].map((field, i) => {
            const isPass = field.type === "password";
            return (
              <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }} style={{ marginBottom: field.id === "password" ? 4 : 18 }}>
                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 7 }}>{field.label}</label>
                <div style={{ display: "flex", alignItems: "center", borderRadius: 12, border: `1px solid ${errors[field.id] ? "rgba(239,68,68,0.7)" : focused[field.id] ? "rgba(220,38,38,0.55)" : "rgba(255,255,255,0.09)"}`, background: focused[field.id] ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)", boxShadow: focused[field.id] && !errors[field.id] ? "0 0 0 3px rgba(220,38,38,0.09)" : errors[field.id] ? "0 0 0 3px rgba(239,68,68,0.09)" : "none", transition: "all 0.2s" }}>
                  <span style={{ paddingLeft: 14, fontSize: 15, userSelect: "none" }}>{field.icon}</span>
                  <input
                    type={isPass ? (showPwd[field.id] ? "text" : "password") : field.type}
                    value={form[field.id]} placeholder={field.placeholder}
                    onChange={e => set(field.id, e.target.value)}
                    onFocus={() => setFocused(p => ({ ...p, [field.id]: true }))}
                    onBlur={()  => setFocused(p => ({ ...p, [field.id]: false }))}
                    autoComplete={isPass ? "new-password" : "off"}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 12px", fontSize: 13, color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow',sans-serif" }}
                  />
                  {isPass && (
                    <button type="button" onClick={() => setShowPwd(p => ({ ...p, [field.id]: !p[field.id] }))}
                      style={{ paddingRight: 14, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                      {showPwd[field.id] ? "🙈" : "👁️"}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {errors[field.id] && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ fontSize: 11, color: "#f87171", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>⚠</span> {errors[field.id]}
                    </motion.p>
                  )}
                </AnimatePresence>
                {field.id === "password" && <StrengthBar password={form.password} />}
                {field.id === "password" && <div style={{ marginBottom: 14 }} />}
              </motion.div>
            );
          })}

          <AnimatePresence>
            {serverErr && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠</span> {serverErr}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button onClick={handleSubmit} disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: loading ? "rgba(220,38,38,0.4)" : "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(220,38,38,0.38)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%" }} /> Creating account...</>
            ) : "Create Account →"}
          </motion.button>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none" }}>Sign in →</a>
        </p>
      </motion.div>
    </div>
  );
}
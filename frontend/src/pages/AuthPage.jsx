// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useTheme, tokens } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

// ── Input Field ───────────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, error, icon }) {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const isPassword = type === "password";

  return (
    <div style={{marginBottom:20}}>
      <label style={{display:"block", fontSize:12, fontWeight:700, color:t.textSub, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6}}>
        {label}
      </label>
      <div style={{position:"relative"}}>
        {icon && (
          <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none", opacity:0.5}}>
            {icon}
          </span>
        )}
        <input
          type={isPassword && showPw ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", padding:`12px ${isPassword ? 44 : 14}px 12px ${icon ? 42 : 14}px`,
            background:t.inputBg, border:`1.5px solid ${focused ? "#dc2626" : error ? "#ef4444" : t.inputBorder}`,
            borderRadius:12, color:t.textPrim, fontSize:15, fontFamily:"'Barlow',sans-serif",
            outline:"none", transition:"border-color 0.2s ease, box-shadow 0.2s ease",
            boxSizing:"border-box",
            boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.12)" : "none",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(s => !s)}
            style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, opacity:0.5, color:t.textPrim}}>
            {showPw ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p style={{color:"#ef4444", fontSize:12, marginTop:4, fontWeight:500}}>{error}</p>}
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [form, setForm] = useState({ email:"", password:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k) => (e) => setForm(f => ({...f, [k]:e.target.value}));
  const login = async (email, password) => {
  try {
    const gmail = email;
    const res = await API.post(
      "/users/login",
      { gmail , password },
      { withCredentials: true }
    );

    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = "Email is required";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setServerError("");
    try {
      await login(email, password);
      await new Promise(r => setTimeout(r, 1200)); // mock delay
      window.location.href = "/user/dashboard";
    } catch (err) {
      setServerError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Field label="Email" type="email" icon="📧" value={form.email} onChange={set("email")} placeholder="you@example.com" error={errors.email} />
      <Field label="Password" type="password" icon="🔒" value={form.password} onChange={set("password")} placeholder="Enter your password" error={errors.password} />

      <div style={{display:"flex", justifyContent:"flex-end", marginBottom:20, marginTop:-12}}>
        <a href="/forgot-password" style={{fontSize:13, color:"#dc2626", fontWeight:600, textDecoration:"none"}}>Forgot password?</a>
      </div>

      {serverError && (
        <div style={{background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#ef4444", fontSize:13, fontWeight:500}}>
          {serverError}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        style={{width:"100%", padding:"14px", background: loading ? "#9ca3af" : "#dc2626", color:"#fff", border:"none", borderRadius:14, fontSize:14, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase", cursor: loading ? "not-allowed" : "pointer", transition:"all 0.2s ease", fontFamily:"'Barlow',sans-serif"}}
        onMouseEnter={e => { if(!loading) e.currentTarget.style.background="#b91c1c"; }}
        onMouseLeave={e => { if(!loading) e.currentTarget.style.background="#dc2626"; }}
      >
        {loading ? "Logging in…" : "Log In →"}
      </button>

      <p style={{textAlign:"center", marginTop:20, fontSize:14, color:t.textSub}}>
        Don't have an account?{" "}
        <a href="/register" style={{color:"#dc2626", fontWeight:700, textDecoration:"none", fontSize:14}}>Register here</a>
      </p>
    </div>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm(f => ({...f, [k]:e.target.value}));

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name    = "Name is required";
    if (!form.email)                 e.email   = "Email is required";
    if (form.password.length < 8)    e.password= "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };
  const register = async (name, email, password) => {
  try {
    const res = await API.post(
      "/users/register",
      { name, email, password },
      { withCredentials: true }
    );

    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      await new Promise(r => setTimeout(r, 1200));
      setSuccess(true);
    } catch (err) {
      setErrors({ email: "This email is already registered." });
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{textAlign:"center", padding:"32px 0"}}>
      <div style={{fontSize:56, marginBottom:16}}>📬</div>
      <h3 style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:t.textPrim, marginBottom:8}}>CHECK YOUR EMAIL</h3>
      <p style={{color:t.textSub, fontSize:15, lineHeight:1.6, marginBottom:24}}>
        We've sent a verification link to <strong style={{color:t.textPrim}}>{form.email}</strong>.<br />
        Click the link to activate your account.
      </p>
      <a href="/login" style={{color:"#dc2626", fontWeight:700, textDecoration:"none", fontSize:14}}>
        Back to Login
      </a>
    </div>
  );

  return (
    <div>
      <Field label="Full Name"       type="text"     icon="👤" value={form.name}     onChange={set("name")}     placeholder="Your name"          error={errors.name}     />
      <Field label="Email"           type="email"    icon="📧" value={form.email}    onChange={set("email")}    placeholder="you@example.com"    error={errors.email}    />
      <Field label="Password"        type="password" icon="🔒" value={form.password} onChange={set("password")} placeholder="Min. 8 characters"  error={errors.password} />
      <Field label="Confirm Password" type="password" icon="🔒" value={form.confirm}  onChange={set("confirm")}  placeholder="Repeat your password" error={errors.confirm} />

      <button onClick={handleSubmit} disabled={loading}
        style={{width:"100%", padding:"14px", background: loading ? "#9ca3af" : "#dc2626", color:"#fff", border:"none", borderRadius:14, fontSize:14, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase", cursor: loading ? "not-allowed" : "pointer", transition:"all 0.2s ease", fontFamily:"'Barlow',sans-serif", marginTop:4}}
        onMouseEnter={e => { if(!loading) e.currentTarget.style.background="#b91c1c"; }}
        onMouseLeave={e => { if(!loading) e.currentTarget.style.background="#dc2626"; }}
      >
        {loading ? "Creating account…" : "Create Account →"}
      </button>

      <p style={{textAlign:"center", marginTop:20, fontSize:14, color:t.textSub}}>
        Already have an account?{" "}
        <a href="/login" style={{color:"#dc2626", fontWeight:700, textDecoration:"none", fontSize:14}}>Log in</a>
      </p>
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage({ defaultTab = "login" }) {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [tab, setTab] = useState(defaultTab);

  return (
    <div style={{minHeight:"100vh", background:t.bg, fontFamily:"'Barlow',sans-serif", transition:"background 0.4s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .auth-card { animation: fadeUp 0.5s ease both; }
        * { box-sizing:border-box; }
        input::placeholder { opacity:0.45; }
      `}</style>

      <Navbar alwaysVisible />

      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"96px 24px 48px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr", gap:0, maxWidth:480, width:"100%"}}>

          {/* Card */}
          <div className="auth-card" style={{background:t.surface, borderRadius:24, border:`1px solid ${t.border}`, overflow:"hidden", boxShadow:`0 24px 64px ${t.shadow}`}}>

            {/* Top accent */}
            <div style={{height:4, background:"linear-gradient(90deg,#dc2626,#f97316,#dc2626)", backgroundSize:"200% 100%"}} />

            <div style={{padding:"36px 36px 32px"}}>
              {/* Logo */}
              <div style={{textAlign:"center", marginBottom:32}}>
                <div style={{width:48, height:48, borderRadius:14, background:"#dc2626", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12}}>
                  <span style={{color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20}}>AF</span>
                </div>
                <h1 style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:t.textPrim, letterSpacing:"-0.02em", margin:0}}>
                  ARENA<span style={{color:"#dc2626"}}>FORAGE</span>
                </h1>
                <p style={{color:t.textSub, fontSize:13, marginTop:4}}>India's Free Fire Tournament Platform</p>
              </div>

              {/* Tab switcher */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", background:t.surface2, borderRadius:12, padding:4, marginBottom:28}}>
                {["login","register"].map(tabName => (
                  <button key={tabName} onClick={() => setTab(tabName)}
                    style={{
                      padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Barlow',sans-serif",
                      fontWeight:700, fontSize:13, letterSpacing:"0.06em", textTransform:"uppercase",
                      background: tab===tabName ? "#dc2626" : "transparent",
                      color: tab===tabName ? "#fff" : t.textSub,
                      transition:"all 0.25s ease",
                    }}>
                    {tabName === "login" ? "Log In" : "Register"}
                  </button>
                ))}
              </div>

              {/* Form */}
              {tab === "login"
                ? <LoginForm    onSwitch={() => setTab("register")} />
                : <RegisterForm onSwitch={() => setTab("login")}    />
              }
            </div>
          </div>

          {/* Bottom note */}
          <p style={{textAlign:"center", marginTop:20, fontSize:12, color:t.textMuted}}>
            By continuing you agree to our{" "}
            <a href="#" style={{color:t.textSub, textDecoration:"underline"}}>Terms of Service</a> &amp;{" "}
            <a href="#" style={{color:t.textSub, textDecoration:"underline"}}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
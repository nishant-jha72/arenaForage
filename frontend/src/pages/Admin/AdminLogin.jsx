import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
const {hyderate} = useAuth(); 
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STAT_ITEMS = [
  { value: "12K+",  label: "Players" },
  { value: "340+",  label: "Tournaments" },
  { value: "₹8L+",  label: "Prize Pool" },
  { value: "98",    label: "Admins" },
];

const FLOATING_TAGS = [
  { text: "BGMI",        x: "8%",  y: "18%", delay: 0 },
  { text: "FREE FIRE",   x: "62%", y: "12%", delay: 0.4 },
  { text: "VALORANT",    x: "72%", y: "55%", delay: 0.8 },
  { text: "COD",         x: "5%",  y: "65%", delay: 0.6 },
  { text: "ESPORTS",     x: "55%", y: "82%", delay: 1.0 },
  { text: "TOURNAMENTS", x: "10%", y: "85%", delay: 0.2 },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const num = parseInt(target.replace(/\D/g, ""));
    let start = 0;
    const step = Math.ceil(num / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  const raw = target.replace(/[0-9]/g, "");
  return <>{raw.startsWith("₹") ? `₹${count}` : count}{raw.replace("₹", "")}{suffix}</>;
}

export default function AdminLoginPage() {
  const [formData, setFormData]     = useState({ email: "", password: "" });
  const [errors, setErrors]         = useState({});
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [serverError, setServerError] = useState("");
  const [shake, setShake]           = useState(false);
  const [focused, setFocused]       = useState({ email: false, password: false });

  const handleChange = (id, val) => {
    setFormData((p) => ({ ...p, [id]: val }));
    setErrors((p) => ({ ...p, [id]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e = {};
    if (!formData.email.trim())   e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.password)       e.password = "Password is required";
    return e;
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async () => {
    const navigate = useNavigate();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); triggerShake(); return; }

    setLoading(true);
    setServerError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",                          // sends & stores httpOnly cookies
        body: JSON.stringify({
          email:    formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Map every backend error your controller can return to a readable message
        const msg = data.message || "";

        if (res.status === 403 && msg.toLowerCase().includes("banned")) {
          throw new Error("Your account has been banned. Contact support.");
        }
        if (res.status === 403 && msg.toLowerCase().includes("email")) {
          throw new Error("Please verify your email address before logging in.");
        }
        if (res.status === 403 && msg.toLowerCase().includes("super")) {
          throw new Error("Your account is pending Super Admin approval.");
        }
        if (res.status === 401) {
          throw new Error("Invalid email or password.");
        }
        if (res.status === 429) {
          throw new Error("Too many login attempts. Please wait 15 minutes.");
        }
        throw new Error(msg || "Login failed. Please try again.");
      }

      // Success — backend sets adminAccessToken + adminRefreshToken cookies automatically
     await hyderate("admin");  // or hydrate("user")
    navigate("/admin/dashboard");

    } catch (err) {
      setServerError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#09090b", fontFamily: "'Barlow', sans-serif" }}
      onKeyDown={handleKeyDown}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Barlow:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          width: "52%",
          background: "linear-gradient(160deg, #18080a 0%, #0e0e10 50%, #0a0f12 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Diagonal red stripe */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(220,38,38,0.07) 0%, transparent 45%)",
          }}
        />

        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Red corner glow */}
        <div
          className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(220,38,38,0.18) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, rgba(220,38,38,0.1) 0%, transparent 65%)",
          }}
        />

        {/* Floating game tags */}
        {FLOATING_TAGS.map((tag) => (
          <motion.div
            key={tag.text}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: tag.delay + 0.6, duration: 0.5, ease: "backOut" }}
            className="absolute px-3 py-1 rounded-full text-xs font-bold tracking-widest select-none"
            style={{
              left: tag.x,
              top: tag.y,
              fontFamily: "'Barlow Condensed', sans-serif",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.12em",
            }}
          >
            {tag.text}
          </motion.div>
        ))}

        {/* Logo */}
        <div className="relative z-10 p-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#dc2626", fontSize: "20px" }}
            >
              🎮
            </div>
            <span
              className="text-sm font-bold tracking-widest uppercase"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              ArenaForage
            </span>
          </motion.div>
        </div>

        {/* Center hero text */}
        <div className="relative z-10 px-10 pb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div
              className="text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2"
              style={{
                color: "#dc2626",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              <span
                className="inline-block w-6 h-px"
                style={{ background: "#dc2626" }}
              />
              Admin Portal
            </div>

            <h2
              className="font-black leading-none mb-6"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(48px, 5vw, 72px)",
                color: "#f4f4f5",
                letterSpacing: "-0.01em",
              }}
            >
              COMMAND
              <br />
              <span style={{ color: "#dc2626", fontStyle: "italic" }}>YOUR</span>
              <br />
              ARENA.
            </h2>

            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Manage tournaments, verify players, track revenue, and oversee every match from one powerful dashboard.
            </p>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="relative z-10 mx-8 mb-10 grid grid-cols-4 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {STAT_ITEMS.map((s, i) => (
            <div
              key={s.label}
              className="py-5 px-3 text-center"
              style={{
                borderRight:
                  i < STAT_ITEMS.length - 1
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "none",
              }}
            >
              <div
                className="text-xl font-black"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "#f4f4f5",
                  lineHeight: 1,
                }}
              >
                <AnimatedCounter target={s.value} />
              </div>
              <div
                className="text-xs mt-1 tracking-wider uppercase"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "10px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Subtle right bg glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(220,38,38,0.06) 0%, transparent 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#dc2626", fontSize: "18px" }}
            >
              🎮
            </div>
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              ArenaForage
            </span>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            className="mb-8"
          >
            <p
              className="text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2"
              style={{ color: "#dc2626", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <span className="inline-block w-4 h-px" style={{ background: "#dc2626" }} />
              Welcome back
            </p>
            <h1
              className="font-black leading-none"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(36px, 6vw, 52px)",
                color: "#f4f4f5",
                letterSpacing: "-0.01em",
              }}
            >
              ADMIN LOGIN
            </h1>
            <p
              className="text-sm mt-2"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Sign in to access your tournament dashboard
            </p>
          </motion.div>

          {/* Form card */}
          <motion.div
            animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.45 }}
          >
            <div
              className="rounded-2xl p-8 space-y-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              {/* Email field */}
              {[
                {
                  id: "email",
                  label: "Email Address",
                  type: "email",
                  placeholder: "admin@organization.com",
                  icon: "✉️",
                },
                {
                  id: "password",
                  label: "Password",
                  type: "password",
                  placeholder: "Enter your password",
                  icon: "🔒",
                },
              ].map((field, i) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <label
                      className="text-xs font-semibold tracking-widest uppercase"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {field.label}
                    </label>
                    {field.id === "password" && (
                      <a
                        href="/admin/forgot-password"
                        className="text-xs transition-colors hover:opacity-80"
                        style={{ color: "#dc2626" }}
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>

                  <motion.div
                    className="relative flex items-center rounded-xl border transition-all duration-200"
                    animate={{
                      borderColor: errors[field.id]
                        ? "rgba(239,68,68,0.75)"
                        : focused[field.id]
                        ? "rgba(220,38,38,0.6)"
                        : "rgba(255,255,255,0.1)",
                      backgroundColor: focused[field.id]
                        ? "rgba(255,255,255,0.055)"
                        : "rgba(255,255,255,0.03)",
                      boxShadow: focused[field.id] && !errors[field.id]
                        ? "0 0 0 3px rgba(220,38,38,0.1)"
                        : errors[field.id]
                        ? "0 0 0 3px rgba(239,68,68,0.1)"
                        : "none",
                    }}
                  >
                    <span className="pl-4 select-none" style={{ fontSize: "16px" }}>
                      {field.icon}
                    </span>
                    <input
                      type={
                        field.id === "password"
                          ? showPwd
                            ? "text"
                            : "password"
                          : field.type
                      }
                      value={formData[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      onFocus={() => setFocused((p) => ({ ...p, [field.id]: true }))}
                      onBlur={() => setFocused((p) => ({ ...p, [field.id]: false }))}
                      placeholder={field.placeholder}
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-white/20"
                      style={{ color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow', sans-serif" }}
                      autoComplete={field.id === "password" ? "current-password" : "email"}
                    />
                    {field.id === "password" && (
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => !p)}
                        className="pr-4 transition-opacity hover:opacity-80"
                        style={{ color: "rgba(255,255,255,0.3)", fontSize: "15px" }}
                      >
                        {showPwd ? "🙈" : "👁️"}
                      </button>
                    )}
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {errors[field.id] && (
                      <motion.p
                        key="err"
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs flex items-center gap-1.5"
                        style={{ color: "#f87171" }}
                      >
                        <span>⚠</span> {errors[field.id]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* Server error */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>⚠</span>
                    <span>{serverError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
              >
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  className="w-full py-4 rounded-xl font-black tracking-widest uppercase relative overflow-hidden"
                  style={{
                    background: loading
                      ? "rgba(220,38,38,0.45)"
                      : "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "#fff",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "16px",
                    letterSpacing: "0.12em",
                    boxShadow: loading ? "none" : "0 8px 28px rgba(220,38,38,0.4)",
                    cursor: loading ? "not-allowed" : "pointer",
                    border: "none",
                  }}
                >
                  {/* Shimmer sweep on hover */}
                  {!loading && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ x: "-100%", opacity: 0 }}
                      whileHover={{ x: "100%", opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                      }}
                    />
                  )}

                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                        className="inline-block w-4 h-4 rounded-full border-2"
                        style={{
                          borderColor: "rgba(255,255,255,0.25)",
                          borderTopColor: "#fff",
                        }}
                      />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            className="mt-6 space-y-3 text-center"
          >
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Don't have an account?{" "}
              <a
                href="/admin/register"
                className="font-semibold transition-opacity hover:opacity-80"
                style={{ color: "#dc2626" }}
              >
                Register as Admin
              </a>
            </p>

            <div
              className="flex items-center gap-3 justify-center"
              style={{ color: "rgba(255,255,255,0.15)" }}
            >
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs">or</span>
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              Are you a player?{" "}
              <a
                href="/login"
                className="transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Player Login →
              </a>
            </p>

            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.13)" }}>
              Admin accounts require Super Admin verification before full access is granted.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
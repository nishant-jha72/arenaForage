import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FIELDS = [
  { id: "name",              label: "Full Name",          type: "text",     placeholder: "John Doe",                   icon: "👤" },
  { id: "email",             label: "Email Address",      type: "email",    placeholder: "admin@organization.com",     icon: "✉️" },
  { id: "organization_name", label: "Organization Name",  type: "text",     placeholder: "Esports Org Inc.",           icon: "🏢" },
  { id: "phone_number",      label: "Phone Number",       type: "tel",      placeholder: "+91 98765 43210",            icon: "📞" },
  { id: "password",          label: "Password",           type: "password", placeholder: "Min. 8 characters",          icon: "🔒" },
  { id: "confirmPassword",   label: "Confirm Password",   type: "password", placeholder: "Re-enter password",          icon: "🔐" },
];

const SOCIAL_FIELDS = [
  { id: "instagram", label: "Instagram",  placeholder: "instagram.com/yourpage",  icon: "📸" },
  { id: "twitter",   label: "Twitter/X",  placeholder: "twitter.com/yourhandle",  icon: "🐦" },
  { id: "facebook",  label: "Facebook",   placeholder: "facebook.com/yourpage",   icon: "👍" },
  { id: "linkedin",  label: "LinkedIn",   placeholder: "linkedin.com/in/yourname",icon: "💼" },
];

const validatePassword = (pwd) => {
  const checks = {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number:    /[0-9]/.test(pwd),
  };
  return checks;
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = validatePassword(password);
  const passed = Object.values(checks).filter(Boolean).length;
  const levels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2"
    >
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i <= passed ? colors[passed] : "rgba(255,255,255,0.1)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {[
            { key: "length",    label: "8+ chars" },
            { key: "uppercase", label: "A-Z" },
            { key: "lowercase", label: "a-z" },
            { key: "number",    label: "0-9" },
          ].map(({ key, label }) => (
            <motion.span
              key={key}
              className="text-xs flex items-center gap-1"
              animate={{ color: checks[key] ? "#22c55e" : "rgba(255,255,255,0.35)" }}
              transition={{ duration: 0.2 }}
            >
              <span>{checks[key] ? "✓" : "○"}</span>
              {label}
            </motion.span>
          ))}
        </div>
        {passed > 0 && (
          <span className="text-xs font-semibold" style={{ color: colors[passed] }}>
            {levels[passed]}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const InputField = ({ field, value, onChange, error, showPassword, onTogglePassword }) => {
  const [focused, setFocused] = useState(false);
  const isPassword = field.type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : field.type;

  return (
    <motion.div
      layout
      className="space-y-1.5"
    >
      <label className="block text-xs font-semibold tracking-widest uppercase"
        style={{ color: "rgba(255,255,255,0.45)" }}>
        {field.label}
      </label>

      <motion.div
        className="relative flex items-center rounded-xl border transition-all duration-200"
        animate={{
          borderColor: error
            ? "rgba(239,68,68,0.8)"
            : focused
            ? "rgba(220,38,38,0.7)"
            : "rgba(255,255,255,0.1)",
          backgroundColor: focused
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.03)",
          boxShadow: focused && !error
            ? "0 0 0 3px rgba(220,38,38,0.1)"
            : error
            ? "0 0 0 3px rgba(239,68,68,0.1)"
            : "none",
        }}
      >
        <span className="pl-4 text-base select-none" style={{ fontSize: "16px" }}>
          {field.icon}
        </span>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={field.placeholder}
          className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-white/20"
          style={{ color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow', sans-serif" }}
          autoComplete={isPassword ? "new-password" : "off"}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => onTogglePassword(field.id)}
            className="pr-4 text-sm transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.35)", fontSize: "15px" }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs flex items-center gap-1.5"
            style={{ color: "#f87171" }}
          >
            <span>⚠</span> {error}
          </motion.p>
        )}
      </AnimatePresence>

      {field.id === "password" && <PasswordStrength password={value} />}
    </motion.div>
  );
};

export default function AdminRegisterPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", organization_name: "", phone_number: "",
    password: "", confirmPassword: "",
    instagram: "", twitter: "", facebook: "", linkedin: "",
  });
  const [errors, setErrors]         = useState({});
  const [showPwd, setShowPwd]       = useState({ password: false, confirmPassword: false });
  const [step, setStep]             = useState(1); // 1 = main info, 2 = socials
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (id, val) => {
    setFormData((p) => ({ ...p, [id]: val }));
    setErrors((p) => ({ ...p, [id]: "" }));
    setServerError("");
  };

  const togglePwd = (id) => setShowPwd((p) => ({ ...p, [id]: !p[id] }));

  const validateStep1 = () => {
    const e = {};
    if (!formData.name.trim())              e.name = "Full name is required";
    if (!formData.email.trim())             e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.organization_name.trim()) e.organization_name = "Organization name is required";

    const pwdChecks = validatePassword(formData.password);
    if (!formData.password)                 e.password = "Password is required";
    else if (!pwdChecks.length)             e.password = "Password must be at least 8 characters";
    else if (!pwdChecks.uppercase)          e.password = "Must contain at least one uppercase letter";
    else if (!pwdChecks.lowercase)          e.password = "Must contain at least one lowercase letter";
    else if (!pwdChecks.number)             e.password = "Must contain at least one number";

    if (!formData.confirmPassword)          e.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
                                            e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleStep1 = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setServerError("");

    try {
      // Strip confirmPassword — backend doesn't want it
      const payload = {
        name:              formData.name.trim(),
        email:             formData.email.trim().toLowerCase(),
        password:          formData.password,
        organization_name: formData.organization_name.trim(),
        // Optional fields — only include if filled
        ...(formData.phone_number.trim() && { phone_number: formData.phone_number.trim() }),
        ...(formData.instagram.trim()    && { instagram:    formData.instagram.trim()    }),
        ...(formData.twitter.trim()      && { twitter:      formData.twitter.trim()      }),
        ...(formData.facebook.trim()     && { facebook:     formData.facebook.trim()     }),
        ...(formData.linkedin.trim()     && { linkedin:     formData.linkedin.trim()     }),
      };

      const res = await fetch(`${API_BASE}/api/admin/register`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "";

        // Map specific backend errors to field-level errors where possible
        if (res.status === 409 || msg.toLowerCase().includes("already")) {
          setStep(1);                                  // snap back to step 1
          setErrors({ email: "This email is already registered." });
          return;
        }
        if (res.status === 400 && msg.toLowerCase().includes("name")) {
          setStep(1);
          setErrors({ name: msg });
          return;
        }
        if (res.status === 400 && msg.toLowerCase().includes("password")) {
          setStep(1);
          setErrors({ password: msg });
          return;
        }
        if (res.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error(msg || "Registration failed. Please try again.");
      }

      // Success — show verification email screen
      setSuccess(true);

    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#09090b", fontFamily: "'Barlow', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="text-7xl mb-6"
          >
            ✉️
          </motion.div>
          <h2 className="text-3xl font-bold mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#f4f4f5", letterSpacing: "0.04em" }}>
            CHECK YOUR EMAIL
          </h2>
          <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            We've sent a verification link to
          </p>
          <p className="text-base font-semibold mb-6" style={{ color: "#dc2626" }}>
            {formData.email}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            After email verification, a Super Admin will review and approve your account before you can access the admin panel.
          </p>
          <motion.a
            href="/login"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block mt-8 px-8 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Back to Login
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "#09090b", fontFamily: "'Barlow', sans-serif" }}>

      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Background grid texture */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Red glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center top, rgba(220,38,38,0.15) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg"
      >
        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: "#dc2626", fontSize: "16px" }}>
                🎮
              </div>
              <span className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                ArenaForage
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#f4f4f5", lineHeight: 1 }}>
              ADMIN REGISTRATION
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Create your organizer account — pending Super Admin approval
            </p>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mt-5">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <motion.div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    animate={{
                      background: step >= s ? "#dc2626" : "rgba(255,255,255,0.08)",
                      color: step >= s ? "#fff" : "rgba(255,255,255,0.3)",
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {s}
                  </motion.div>
                  <span className="text-xs hidden sm:block"
                    style={{ color: step >= s ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)" }}>
                    {s === 1 ? "Account Info" : "Social Links"}
                  </span>
                  {s < 2 && (
                    <div className="w-8 h-px mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  {FIELDS.map((field, i) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <InputField
                        field={field}
                        value={formData[field.id]}
                        onChange={handleChange}
                        error={errors[field.id]}
                        showPassword={showPwd[field.id]}
                        onTogglePassword={togglePwd}
                      />
                    </motion.div>
                  ))}

                  <motion.button
                    onClick={handleStep1}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-xl font-bold tracking-widest uppercase text-sm mt-2"
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #991b1b)",
                      color: "#fff",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "15px",
                      letterSpacing: "0.1em",
                      boxShadow: "0 8px 24px rgba(220,38,38,0.35)",
                    }}
                  >
                    Continue →
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Optional — helps teams and players find your organization
                  </p>

                  {SOCIAL_FIELDS.map((field, i) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold tracking-widest uppercase"
                          style={{ color: "rgba(255,255,255,0.45)" }}>
                          {field.label}
                        </label>
                        <div className="flex items-center rounded-xl border transition-all duration-200"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            backgroundColor: "rgba(255,255,255,0.03)",
                          }}>
                          <span className="pl-4 text-base select-none" style={{ fontSize: "16px" }}>
                            {field.icon}
                          </span>
                          <input
                            type="text"
                            value={formData[field.id]}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-white/20"
                            style={{ color: "rgba(255,255,255,0.88)", fontFamily: "'Barlow', sans-serif" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                      >
                        <span>⚠</span> {serverError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 mt-2">
                    <motion.button
                      onClick={() => setStep(1)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 py-4 rounded-xl font-bold tracking-widest uppercase text-sm"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "14px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      ← Back
                    </motion.button>

                    <motion.button
                      onClick={handleSubmit}
                      disabled={loading}
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.97 } : {}}
                      className="flex-2 flex-1 py-4 rounded-xl font-bold tracking-widest uppercase text-sm relative overflow-hidden"
                      style={{
                        background: loading ? "rgba(220,38,38,0.5)" : "linear-gradient(135deg, #dc2626, #991b1b)",
                        color: "#fff",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "15px",
                        letterSpacing: "0.1em",
                        boxShadow: loading ? "none" : "0 8px 24px rgba(220,38,38,0.35)",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                            className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Registering...
                        </span>
                      ) : (
                        "Register Account"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-7"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              Already have an account?{" "}
              <a href="/admin/login"
                className="font-semibold transition-colors hover:text-red-400"
                style={{ color: "#dc2626" }}>
                Sign in
              </a>
            </p>
            <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.18)" }}>
              Your account requires Super Admin verification before access is granted
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
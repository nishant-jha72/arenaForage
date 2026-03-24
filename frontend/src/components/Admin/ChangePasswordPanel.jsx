// src/components/admin/ChangePasswordPanel.jsx
// Fixed: removed useState() calls inside .map() — that's an illegal hook call
import { useState } from "react";
import apiFetch from "../../utils/Apifetch.utils";
import { API, SectionHeader, RedBtn } from "./Shared";

// Single password field — own component so each has its own useState
function PasswordField({ label, id, value, onChange, error, disabled }) {
  const [focused,  setFocused]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 6 }}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center", borderRadius: 10,
        border: `1px solid ${error ? "rgba(239,68,68,0.6)" : focused ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.1)"}`,
        background: "rgba(255,255,255,0.04)",
        boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
      }}>
        <input
          type={showPwd ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          disabled={disabled}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "'Barlow',sans-serif" }}
        />
        <button type="button" onClick={() => setShowPwd(p => !p)}
          style={{ padding: "0 14px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
          {showPwd ? "🙈" : "👁️"}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span>{error}</p>}
    </div>
  );
}

export default function ChangePasswordPanel({ saVerified, toast }) {
  const [form,    setForm]    = useState({ current: "", next: "", confirm: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current)             e.current = "Current password is required";
    if (!form.next)                e.next    = "New password is required";
    else if (form.next.length < 8) e.next    = "Password must be at least 8 characters";
    if (form.next !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await apiFetch(`${API}/api/admin/change-password`, {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      setForm({ current: "", next: "", confirm: "" });
      setErrors({});
      toast("Password changed successfully!", "success");
    } catch (err) {
      if (err.message.toLowerCase().includes("current") || err.message.toLowerCase().includes("incorrect")) {
        setErrors({ current: "Current password is incorrect" });
      } else {
        toast(err.message, "error");
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 440 }}>
      <SectionHeader title="CHANGE PASSWORD" sub="Keep your account secure" />

      {!saVerified && (
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: "#fbbf24" }}>
          ⚠ Password change requires Super Admin approval.
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
        <PasswordField
          label="Current Password" id="current" value={form.current}
          onChange={e => { setForm(p => ({ ...p, current: e.target.value })); setErrors(p => ({ ...p, current: "" })); }}
          error={errors.current} disabled={!saVerified}
        />
        <PasswordField
          label="New Password" id="next" value={form.next}
          onChange={e => { setForm(p => ({ ...p, next: e.target.value })); setErrors(p => ({ ...p, next: "" })); }}
          error={errors.next} disabled={!saVerified}
        />
        <PasswordField
          label="Confirm New Password" id="confirm" value={form.confirm}
          onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: "" })); }}
          error={errors.confirm} disabled={!saVerified}
        />

        <RedBtn onClick={handleSubmit} loading={loading} disabled={!saVerified} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
          Update Password
        </RedBtn>
      </div>
    </div>
  );
}
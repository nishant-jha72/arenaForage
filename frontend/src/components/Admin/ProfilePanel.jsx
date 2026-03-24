// src/components/admin/ProfilePanel.jsx
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";
import { API, Spinner, SectionHeader, InputRow, RedBtn, ConfirmModal } from "./Shared";

export default function ProfilePanel({ admin, onAdminUpdate, saVerified, toast }) {
  const [form, setForm]               = useState(null);
  const [editing, setEditing]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (admin) setForm({
      name:              admin.name              || "",
      organization_name: admin.organization_name || "",
      phone_number:      admin.phone_number      || "",
      instagram:         admin.instagram         || "",
      twitter:           admin.twitter           || "",
      facebook:          admin.facebook          || "",
      linkedin:          admin.linkedin          || "",
    });
  }, [admin]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}/api/admin/profile`, { method: "PATCH", body: JSON.stringify(form) });
      onAdminUpdate(data.data?.admin || data.data || data.admin || form);
      setEditing(false);
      toast("Profile updated successfully!", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`${API}/api/admin/account`, { method: "DELETE" });
      window.location.href = "/admin/login";
    } catch (e) { toast(e.message, "error"); setDeleteConfirm(false); }
    finally { setDeleteLoading(false); }
  };

  const discard = () => {
    setEditing(false);
    setForm({
      name: admin?.name || "", organization_name: admin?.organization_name || "",
      phone_number: admin?.phone_number || "", instagram: admin?.instagram || "",
      twitter: admin?.twitter || "", facebook: admin?.facebook || "", linkedin: admin?.linkedin || "",
    });
  };

  // Backend returns booleans
  const emailOk = !!admin?.emailVerified;
  const saOk    = !!admin?.superAdminVerified;

  if (!form) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>;

  return (
    <div>
      <SectionHeader title="PROFILE" sub="Manage your admin account" />

      {/* Avatar + meta */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28, padding: "20px 24px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: "linear-gradient(135deg,#dc2626,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", flexShrink: 0 }}>
          {admin?.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: "#f4f4f5", fontWeight: 700 }}>{admin?.name}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{admin?.email}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: emailOk ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: emailOk ? "#4ade80" : "#f87171", border: `1px solid ${emailOk ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              {emailOk ? "✓ Email Verified" : "✗ Email Not Verified"}
            </span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: saOk ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", color: saOk ? "#4ade80" : "#fbbf24", border: `1px solid ${saOk ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}` }}>
              {saOk ? "✓ SA Approved" : "⏳ Pending SA Approval"}
            </span>
          </div>
        </div>
      </div>

      {!saVerified && (
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: "#fbbf24" }}>
          ⚠ Profile editing requires Super Admin approval.
        </div>
      )}

      {/* Editable fields */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif" }}>Account Details</p>
          {saVerified && !editing && (
            <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: "#dc2626", background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "'Barlow',sans-serif" }}>Edit</button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <InputRow label="Full Name"         value={form.name}              onChange={e => set("name", e.target.value)}              disabled={!editing} />
          <InputRow label="Organization"      value={form.organization_name} onChange={e => set("organization_name", e.target.value)} disabled={!editing} />
          <InputRow label="Phone"             value={form.phone_number}      onChange={e => set("phone_number", e.target.value)}      disabled={!editing} placeholder="+91 98765 43210" />
          <InputRow label="Email (read-only)" value={admin?.email || ""}    onChange={() => {}}                                       disabled />
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", margin: "16px 0 12px" }}>Social Links</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <InputRow label="Instagram" value={form.instagram} onChange={e => set("instagram", e.target.value)} disabled={!editing} placeholder="instagram.com/page" />
          <InputRow label="Twitter"   value={form.twitter}   onChange={e => set("twitter",   e.target.value)} disabled={!editing} placeholder="twitter.com/handle" />
          <InputRow label="Facebook"  value={form.facebook}  onChange={e => set("facebook",  e.target.value)} disabled={!editing} placeholder="facebook.com/page" />
          <InputRow label="LinkedIn"  value={form.linkedin}  onChange={e => set("linkedin",  e.target.value)} disabled={!editing} placeholder="linkedin.com/in/name" />
        </div>

        {editing && (
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={discard} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>Discard</button>
            <RedBtn onClick={handleSave} loading={loading} style={{ flex: 2, justifyContent: "center" }}>Save Changes</RedBtn>
          </div>
        )}
      </div>

      {/* Danger zone */}
      {saVerified && (
        <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(239,68,68,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 10 }}>Danger Zone</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, color: "#f4f4f5" }}>Delete Account</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Permanently deletes your account and Cloudinary images.</p>
            </div>
            <button onClick={() => setDeleteConfirm(true)} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontSize: 12, fontFamily: "'Barlow',sans-serif", flexShrink: 0, marginLeft: 16 }}>
              Delete Account
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Delete Account"
            message="This will permanently delete your admin account, all your data, and your profile picture from Cloudinary. This action cannot be undone."
            loading={deleteLoading}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
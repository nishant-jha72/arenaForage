import { motion } from "framer-motion";
import { fmt, StatCard, SectionHeader } from "./Shared";

export default function OverviewPanel({ admin, analytics }) {
  // 1. DATA UNWRAPPING 
  // If the parent passed the whole 'data' object instead of just the admin profile, 
  // we extract it here to prevent the "Not Rendering" issue.
  const profile = admin?.admin ? admin.admin : admin;

  const emailOk = !!profile?.emailVerified;
  const saOk    = !!profile?.superAdminVerified;

  const stats = [
    { label: "Tournaments Organised", value: profile?.tournaments_organised ?? 0, color: "#dc2626" },
    { label: "Total Revenue",         value: fmt.currency(profile?.revenue),      color: "#f59e0b" },
    { label: "Email Verified",        value: emailOk ? "✓ Yes" : "✗ No",         color: emailOk ? "#22c55e" : "#ef4444" },
    { label: "Account Status",        value: saOk    ? "✓ Approved" : "⏳ Pending", color: saOk ? "#22c55e" : "#f59e0b" },
  ];

  return (
    <div style={{ width: "100%" }}>
      <SectionHeader title="OVERVIEW" sub={`Welcome back, ${profile?.name?.split(" ")[0] || "Admin"}`} />

      {/* 2. PROFILE & STATS LAYOUT */}
      <div style={{ display: "flex", gap: 24, alignItems: "stretch", marginBottom: 28, flexWrap: "wrap" }}>
        
        {/* Profile Picture Panel on the Left */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ 
            width: 160, background: "rgba(255,255,255,0.02)", 
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, 
            padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12
          }}
        >
          <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid #dc2626" }}>
            <img 
              src={profile?.profile_picture || "https://via.placeholder.com/100"} 
              alt="Admin" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: "#f4f4f5", fontWeight: 700, lineHeight: 1.2 }}>{profile?.name}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{profile?.organization_name}</p>
          </div>
        </motion.div>

        {/* Stats Grid on the Right */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
          {stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
        </div>
      </div>

      {!saOk && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <p style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>Awaiting Super Admin Approval</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              Tournament management unlocks after approval.
            </p>
          </div>
        </motion.div>
      )}

      {analytics && (
        <>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 14 }}>
            Tournament Breakdown
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {Object.entries(analytics.tournament_breakdown || {}).map(([status, count], i) => (
              <StatCard key={status} label={status.replace(/_/g, " ")} value={count} index={i} color="rgba(255,255,255,0.2)" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
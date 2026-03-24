// src/components/admin/AnalyticsPanel.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";
import { API, fmt, Spinner, StatCard, SectionHeader } from "./Shared";

export default function AnalyticsPanel({ toast }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API}/api/admin/analytics`)
      .then(res => setData(res.data || res))
      .catch(e  => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={28} /></div>;
  if (!data)   return <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No analytics data available yet.</div>;

  const topStats = [
    { label: "Total Tournaments", value: data.total_tournaments,                  color: "#dc2626" },
    { label: "Total Revenue",     value: fmt.currency(data.total_revenue),        color: "#f59e0b" },
    { label: "Live",              value: data.tournament_breakdown?.live      || 0, color: "#22c55e" },
    { label: "Completed",         value: data.tournament_breakdown?.completed || 0, color: "#3b82f6" },
  ];

  return (
    <div>
      <SectionHeader title="ANALYTICS" sub="Your organizer performance" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {topStats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
      </div>

      {/* Revenue bar chart */}
      {data.revenue_chart?.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 16 }}>Revenue — Last 6 Months</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
            {data.revenue_chart.map((m) => {
              const max = Math.max(...data.revenue_chart.map(x => x.revenue), 1);
              const h   = Math.max((m.revenue / max) * 100, 4);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: "100%", background: "linear-gradient(180deg,#dc2626,#991b1b)", borderRadius: "4px 4px 0 0", minHeight: 4 }}
                  />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming tournaments */}
      {data.upcoming_tournaments?.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 14 }}>Upcoming Tournaments</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.upcoming_tournaments.map((t) => (
              <div key={t._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p style={{ fontSize: 13, color: "#f4f4f5" }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{t.game}</p>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{fmt.date(t.schedule?.start_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
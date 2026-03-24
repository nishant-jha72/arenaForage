// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import apiFetch from "../../utils/Apifetch.utils";

// Shared
import { API, Toast, Spinner } from "../../components/Admin/Shared";

// Panels
import AdminSidebar        from "../../components/Admin/AdminSidebar";
import OverviewPanel       from "../../components/Admin/OverviewPanel";
import TournamentsPanel    from "../../components/Admin/TournamentPanel";
import AnalyticsPanel      from "../../components/Admin/AnalyticsPanel";
import NotificationsPanel  from "../../components/Admin/NotificationPanel";
import ProfilePanel        from "../../components/Admin/ProfilePanel";
import ChangePasswordPanel from "../../components/Admin/ChangePasswordPanel";

export default function AdminDashboard() {
  const [admin,         setAdmin]         = useState(null);
  const [analytics,     setAnalytics]     = useState(null);
  const [activePanel,   setActivePanel]   = useState("overview");
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [toast,         setToastState]    = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [booting,       setBooting]       = useState(true);

  const showToast = useCallback((msg, type = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3500);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Backend returns: { statusCode, data: { admin: {...} }, message, success }
        const profileRes = await apiFetch(`${API}/api/admin/profile`);
        const a = profileRes.data?.admin || profileRes.data || profileRes.admin;
        setAdmin(a);

        const unreadRes = await apiFetch(`${API}/api/admin/notifications/unread-count`);
        setUnreadCount(unreadRes.data?.count || unreadRes.count || 0);

        // superAdminVerified is now a boolean from the backend
        if (a?.superAdminVerified) {
          try {
            const analyticsRes = await apiFetch(`${API}/api/admin/analytics`);
            setAnalytics(analyticsRes.data || analyticsRes);
          } catch (_) { /* analytics optional */ }
        }
      } catch (e) {
        if (e.message.includes("401") || e.message.toLowerCase().includes("unauthorized")) {
          window.location.href = "/admin/login";
        }
      } finally { setBooting(false); }
    };
    init();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try { await apiFetch(`${API}/api/admin/logout`, { method: "POST" }); }
    finally { window.location.href = "/admin/login"; }
  };

  // superAdminVerified is boolean — no need for === "YES"
  const saVerified = !!admin?.superAdminVerified;

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Spinner size={32} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 16, fontFamily: "'Barlow',sans-serif" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const panels = {
    overview:      <OverviewPanel      admin={admin} analytics={analytics} />,
    tournaments:   <TournamentsPanel   saVerified={saVerified} toast={showToast} adminId={admin?.id} />,
    analytics:     <AnalyticsPanel     toast={showToast} />,
    notifications: <NotificationsPanel toast={showToast} setUnreadCount={setUnreadCount} />,
    profile:       <ProfilePanel       admin={admin} onAdminUpdate={setAdmin} saVerified={saVerified} toast={showToast} />,
    password:      <ChangePasswordPanel saVerified={saVerified} toast={showToast} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", fontFamily: "'Barlow', sans-serif", color: "#f4f4f5" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Grid background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Sidebar */}
      <AdminSidebar
        admin={admin}
        saVerified={saVerified}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        unreadCount={unreadCount}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxWidth: "100%", minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {panels[activePanel]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToastState(null)} />}
      </AnimatePresence>
    </div>
  );
}
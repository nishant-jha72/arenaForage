// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useTheme, tokens } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const NAV_COLORS = {
  light: [
    { bg:"rgba(255,255,255,0.97)", border:"rgb(10, 10, 16)",  logoAccent:"#dc2626",              text:"#18181b", sub:"#71717a"               },
    { bg:"rgba(220,38,38,0.97)",   border:"rgba(185,28,28,0.5)",  logoAccent:"rgba(255,255,255,0.2)", text:"#fff",    sub:"rgba(255,255,255,0.75)" },
    { bg:"rgba(24,24,27,0.97)",    border:"rgba(63,63,70,1)",     logoAccent:"#dc2626",              text:"#fff",    sub:"#a1a1aa"                },
  ],
  dark: [
    { bg:"rgba(9,9,11,0.97)",      border:"rgba(39,39,42,1)",     logoAccent:"#dc2626",              text:"#fff",    sub:"#a1a1aa"                },
    { bg:"rgba(220,38,38,0.97)",   border:"rgba(185,28,28,0.5)",  logoAccent:"rgba(255,255,255,0.2)", text:"#fff",    sub:"rgba(255,255,255,0.75)" },
    { bg:"rgba(30,30,35,0.97)",    border:"rgba(63,63,70,1)",     logoAccent:"#dc2626",              text:"#f4f4f5", sub:"#71717a"                },
  ],
};

export default function Navbar({ alwaysVisible = false }) {
  const { dark, toggle } = useTheme();
  const t = tokens(dark);

  // ── Real auth state from context ──
  const {
    authType,
    displayName,
    displaySub,
    avatarInitial,
    isVerified,
    loading: authLoading,
    logout,
  } = useAuth();

  const [scrolled,     setScrolled]     = useState(false);
  const [colorIdx,     setColorIdx]     = useState(0);
  const [fading,       setFading]       = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut,   setLoggingOut]   = useState(false);

  const dropdownRef = useRef(null);

  // scroll detection
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    if (alwaysVisible) setScrolled(true);
    return () => window.removeEventListener("scroll", fn);
  }, [alwaysVisible]);

  // color cycle
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => { setColorIdx(i => (i + 1) % 3); setFading(false); }, 350);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const nc      = NAV_COLORS[dark ? "dark" : "light"][colorIdx];
  const navBg   = (scrolled || alwaysVisible) ? nc.bg     : "transparent";
  const navBdr  = (scrolled || alwaysVisible) ? nc.border : "transparent";

  const isLoggedIn = !authLoading && !!authType;

  // ── Logout handler ──
  const handleLogout = async () => {
    setLoggingOut(true);
    setDropdownOpen(false);
    await logout(); // redirects internally
  };

  // ── Dashboard link per role ──
  const dashboardHref = authType === "admin" ? "/admin/dashboard" : "/dashboard";

  // ── Avatar gradient per role ──
  const avatarBg = authType === "admin"
    ? "linear-gradient(135deg,#dc2626,#7f1d1d)"
    : "linear-gradient(135deg,#1d4ed8,#1e3a5f)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        .nav-ul { position:relative; }
        .nav-ul::after { content:''; position:absolute; bottom:-3px; left:0; width:100%; height:2px; background:currentColor; transform:scaleX(0); transform-origin:left; transition:transform 0.25s ease; border-radius:2px; }
        .nav-ul:hover::after { transform:scaleX(1); }
        .af-dropdown-item:hover { background: rgba(220,38,38,0.08) !important; color: #dc2626 !important; }
        @keyframes af-spin { to { transform: rotate(360deg); } }
      `}</style>

      <header style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        backgroundColor: navBg,
        borderBottom: `1px solid ${navBdr}`,
        backdropFilter: (scrolled || alwaysVisible) ? "blur(14px)" : "none",
        opacity: fading ? 0.5 : 1,
        transition: "background-color 0.65s ease, border-color 0.65s ease, opacity 0.35s ease",
        fontFamily: "'Barlow', sans-serif",
      }}>
        <div style={{maxWidth:1280, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between"}}>

          {/* ── Logo ── */}
          <a href="/" style={{display:"flex", alignItems:"center", gap:10, textDecoration:"none"}}>
            <div style={{width:32, height:32, borderRadius:8, background:nc.logoAccent, display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.65s ease"}}>
              <span style={{color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14}}>AF</span>
            </div>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:nc.text, transition:"color 0.65s ease", letterSpacing:"-0.02em"}}>
              ARENA<span style={{color: colorIdx===1 ? "rgba(255,255,255,0.65)" : "#dc2626", transition:"color 0.65s ease"}}>FORAGE</span>
            </span>
          </a>

          {/* ── Desktop Nav Links ── */}
          <nav style={{display:"flex", alignItems:"center", gap:32}} className="hidden md:flex">
            {[["Tournaments","/tournaments"],["Leaderboard","/leaderboard"],["How It Works","/#how-it-works"]].map(([item, href]) => (
              <a key={item} href={href} className="nav-ul"
                style={{position:"relative", color:nc.sub, fontSize:14, fontWeight:600, letterSpacing:"0.04em", textDecoration:"none", transition:"color 0.3s ease"}}
                onMouseEnter={e => e.currentTarget.style.color = nc.text}
                onMouseLeave={e => e.currentTarget.style.color = nc.sub}
              >{item}</a>
            ))}
          </nav>

          {/* ── Right Side ── */}
          <div style={{display:"flex", alignItems:"center", gap:10}}>

            {/* Theme toggle — unchanged from original */}
            <button onClick={toggle} aria-label="Toggle theme"
              style={{width:44, height:24, borderRadius:12, padding:2, border:"none", cursor:"pointer", background: dark ? "#dc2626" : "#e4e4e7", position:"relative", transition:"background 0.35s ease", flexShrink:0}}>
              <div style={{width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left: dark ? "calc(100% - 22px)" : 2, transition:"left 0.3s cubic-bezier(0.34,1.56,0.64,1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
                {dark ? "🌙" : "☀️"}
              </div>
            </button>

            {/* ── Auth loading skeleton ── */}
            {authLoading && (
              <div style={{width:110, height:34, borderRadius:20, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", animation:"af-pulse 1.5s ease-in-out infinite"}} />
            )}

            {/* ── NOT LOGGED IN ── */}
            {!authLoading && !isLoggedIn && (
              <div className="hidden md:flex" style={{gap:8, marginLeft:4}}>
                <a href="/user/login"
                  style={{fontSize:14, fontWeight:700, color:nc.text, padding:"8px 16px", borderRadius:12, textDecoration:"none", transition:"background 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(128,128,128,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >Log In</a>

                <a href="/user/register"
                  style={{fontSize:14, fontWeight:900, color:"#fff", background:"#dc2626", padding:"8px 20px", borderRadius:12, textDecoration:"none", transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#b91c1c"; e.currentTarget.style.transform="scale(1.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#dc2626"; e.currentTarget.style.transform="scale(1)";}}
                >Join Now</a>

                <a href="/admin/login"
                  style={{fontSize:12, fontWeight:600, color:nc.sub, padding:"8px 12px", borderRadius:12, textDecoration:"none", transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(128,128,128,0.12)"; e.currentTarget.style.color=nc.text;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.color=nc.sub;}}
                >Admin ↗</a>
              </div>
            )}

            {/* ── LOGGED IN — Avatar Pill + Dropdown ── */}
            {!authLoading && isLoggedIn && (
              <div ref={dropdownRef} style={{position:"relative"}} className="hidden md:block">

                {/* Pill button */}
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    display:"flex", alignItems:"center", gap:9,
                    padding:"4px 12px 4px 4px",
                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    border:`1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    borderRadius:24, cursor:"pointer",
                    transition:"background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}
                >
                  {/* Avatar circle */}
                  <div style={{
                    width:32, height:32, borderRadius:"50%",
                    background: avatarBg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:900, color:"#fff",
                    fontFamily:"'Barlow Condensed',sans-serif",
                    flexShrink:0,
                    boxShadow: authType === "admin" ? "0 0 0 2px rgba(220,38,38,0.4)" : "0 0 0 2px rgba(29,78,216,0.4)",
                  }}>
                    {avatarInitial}
                  </div>

                  {/* Name + sub label */}
                  <div style={{textAlign:"left", maxWidth:130}}>
                    <p style={{
                      fontSize:13, fontWeight:700, lineHeight:1.2,
                      color:nc.text,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      margin:0,
                    }}>
                      {displayName}
                    </p>
                    <p style={{
                      fontSize:10, lineHeight:1.3, marginTop:1,
                      color:nc.sub,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      margin:0,
                    }}>
                      {/* team name for users, org name for admins */}
                      {authType === "user"
                        ? displaySub
                          ? `⚔️ ${displaySub}`
                          : "No team yet"
                        : displaySub
                          ? `🏢 ${displaySub}`
                          : "Admin"
                      }
                    </p>
                  </div>

                  {/* Caret */}
                  <span style={{
                    fontSize:9, color:nc.sub, marginLeft:2,
                    display:"inline-block",
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition:"transform 0.2s ease",
                  }}>▾</span>
                </button>

                {/* ── Dropdown ── */}
                {dropdownOpen && (
                  <div style={{
                    position:"absolute", top:"calc(100% + 8px)", right:0,
                    minWidth:230,
                    background: dark ? "#18181b" : "#ffffff",
                    border:`1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    borderRadius:14,
                    boxShadow:"0 16px 48px rgba(0,0,0,0.22)",
                    overflow:"hidden",
                    zIndex:200,
                    animation:"af-fadedown 0.18s ease",
                  }}>

                    {/* Profile header */}
                    <div style={{
                      padding:"14px 16px",
                      borderBottom:`1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                      background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                    }}>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        {/* Big avatar */}
                        <div style={{
                          width:40, height:40, borderRadius:10,
                          background: avatarBg,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:16, fontWeight:900, color:"#fff",
                          fontFamily:"'Barlow Condensed',sans-serif",
                          flexShrink:0,
                        }}>
                          {avatarInitial}
                        </div>
                        <div style={{minWidth:0}}>
                          <p style={{fontSize:14, fontWeight:700, color: dark ? "#f4f4f5" : "#18181b", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{displayName}</p>
                          {/* sub — team name or org */}
                          {displaySub && (
                            <p style={{fontSize:11, color:"#dc2626", margin:"2px 0 0", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                              {authType === "user" ? `⚔️ ${displaySub}` : `🏢 ${displaySub}`}
                            </p>
                          )}
                          {/* verified badge */}
                          <p style={{fontSize:10, margin:"3px 0 0", color: isVerified ? "#22c55e" : "#f59e0b"}}>
                            {authType === "admin"
                              ? isVerified ? "✓ SA Approved" : "⏳ Pending Approval"
                              : isVerified ? "✓ Email Verified" : "✗ Email Not Verified"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{padding:"6px 0"}}>
                      <a href={dashboardHref}
                        className="af-dropdown-item"
                        style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"10px 16px",
                          textDecoration:"none",
                          fontSize:13, fontWeight:600,
                          color: dark ? "#f4f4f5" : "#18181b",
                          transition:"background 0.15s, color 0.15s",
                          cursor:"pointer",
                        }}
                      >
                        <span style={{fontSize:15}}>▦</span>
                        Dashboard
                      </a>

                      {authType === "user" && (
                        <a href="/dashboard?panel=profile"
                          className="af-dropdown-item"
                          style={{
                            display:"flex", alignItems:"center", gap:10,
                            padding:"10px 16px",
                            textDecoration:"none",
                            fontSize:13, fontWeight:600,
                            color: dark ? "#f4f4f5" : "#18181b",
                            transition:"background 0.15s, color 0.15s",
                            cursor:"pointer",
                          }}
                        >
                          <span style={{fontSize:15}}>👤</span>
                          My Profile
                        </a>
                      )}

                      {authType === "user" && (
                        <a href="/dashboard?panel=team"
                          className="af-dropdown-item"
                          style={{
                            display:"flex", alignItems:"center", gap:10,
                            padding:"10px 16px",
                            textDecoration:"none",
                            fontSize:13, fontWeight:600,
                            color: dark ? "#f4f4f5" : "#18181b",
                            transition:"background 0.15s, color 0.15s",
                            cursor:"pointer",
                          }}
                        >
                          <span style={{fontSize:15}}>⚔️</span>
                          My Team
                        </a>
                      )}

                      <a href="/tournaments"
                        className="af-dropdown-item"
                        style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"10px 16px",
                          textDecoration:"none",
                          fontSize:13, fontWeight:600,
                          color: dark ? "#f4f4f5" : "#18181b",
                          transition:"background 0.15s, color 0.15s",
                          cursor:"pointer",
                        }}
                      >
                        <span style={{fontSize:15}}>🏆</span>
                        Tournaments
                      </a>

                      {/* Divider */}
                      <div style={{height:1, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", margin:"6px 0"}} />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"10px 16px", width:"100%",
                          background:"transparent", border:"none",
                          fontSize:13, fontWeight:600,
                          color:"#ef4444",
                          cursor: loggingOut ? "not-allowed" : "pointer",
                          textAlign:"left",
                          transition:"background 0.15s",
                          opacity: loggingOut ? 0.6 : 1,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {loggingOut
                          ? <span style={{width:15, height:15, border:"2px solid rgba(239,68,68,0.3)", borderTopColor:"#ef4444", borderRadius:"50%", display:"inline-block", animation:"af-spin 0.7s linear infinite"}} />
                          : <span style={{fontSize:15}}>🚪</span>
                        }
                        {loggingOut ? "Logging out..." : "Log Out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Mobile hamburger — unchanged ── */}
            <button className="md:hidden" style={{padding:8, background:"none", border:"none", cursor:"pointer"}} onClick={() => setMenuOpen(o => !o)}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:20, height:2, background:nc.text, borderRadius:2, margin:"4px 0", transition:"all 0.2s",
                  transform: menuOpen ? (i===0?"rotate(45deg) translate(4px,6px)":i===2?"rotate(-45deg) translate(4px,-6px)":""):"",
                  opacity: menuOpen && i===1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div style={{background:t.surface, borderTop:`1px solid ${t.border}`, padding:"16px 24px"}}>
            {[["Tournaments","/tournaments"],["Leaderboard","/leaderboard"],["How It Works","/#how-it-works"]].map(([item, href]) => (
              <a key={item} href={href} style={{display:"block", color:t.textPrim, fontWeight:600, padding:"10px 0", borderBottom:`1px solid ${t.borderSub}`, textDecoration:"none", fontSize:15}}>{item}</a>
            ))}

            {isLoggedIn ? (
              /* Mobile logged-in state */
              <div style={{marginTop:12}}>
                {/* User card */}
                <div style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"12px 14px",
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  borderRadius:12, marginBottom:10,
                  border:`1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}>
                  <div style={{
                    width:38, height:38, borderRadius:9,
                    background: avatarBg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:15, fontWeight:900, color:"#fff",
                    fontFamily:"'Barlow Condensed',sans-serif",
                    flexShrink:0,
                  }}>
                    {avatarInitial}
                  </div>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:14, fontWeight:700, color:t.textPrim, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{displayName}</p>
                    <p style={{fontSize:11, color:"#dc2626", margin:"2px 0 0", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                      {authType === "user"
                        ? displaySub ? `⚔️ ${displaySub}` : "No team yet"
                        : displaySub ? `🏢 ${displaySub}` : "Admin"
                      }
                    </p>
                  </div>
                </div>

                <div style={{display:"flex", gap:10}}>
                  <a href={dashboardHref}
                    style={{flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:"#fff", background:"#dc2626", padding:"10px", borderRadius:12, textDecoration:"none"}}
                  >Dashboard</a>
                  <button onClick={handleLogout} disabled={loggingOut}
                    style={{flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:t.textPrim, border:`1px solid ${t.border}`, padding:"10px", borderRadius:12, background:"transparent", cursor:"pointer"}}
                  >{loggingOut ? "..." : "Log Out"}</button>
                </div>
              </div>
            ) : (
              /* Mobile logged-out state */
              <div style={{display:"flex", gap:12, marginTop:12}}>
                <a href="/login"    style={{flex:1, textAlign:"center", fontSize:14, fontWeight:700, color:t.textPrim, border:`1px solid ${t.border}`, padding:"10px", borderRadius:12, textDecoration:"none"}}>Log In</a>
                <a href="/register" style={{flex:1, textAlign:"center", fontSize:14, fontWeight:900, color:"#fff", background:"#dc2626", padding:"10px", borderRadius:12, textDecoration:"none"}}>Join Now</a>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Dropdown animation keyframe */}
      <style>{`
        @keyframes af-fadedown {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes af-pulse {
          0%,100% { opacity:0.4; }
          50%      { opacity:0.8; }
        }
      `}</style>
    </>
  );
}
// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { useTheme, tokens } from "../context/ThemeContext";

const NAV_COLORS = {
  light: [
    { bg:"rgba(255,255,255,0.97)", border:"rgba(228,228,231,1)",  logoAccent:"#dc2626",              text:"#18181b", sub:"#71717a"               },
    { bg:"rgba(220,38,38,0.97)",   border:"rgba(185,28,28,0.5)",  logoAccent:"rgba(255,255,255,0.2)", text:"#fff",    sub:"rgba(255,255,255,0.75)" },
    { bg:"rgba(24,24,27,0.97)",    border:"rgba(63,63,70,1)",     logoAccent:"#dc2626",              text:"#fff",    sub:"#a1a1aa"                },
  ],
  dark: [
    { bg:"rgba(9,9,11,0.97)",      border:"rgba(39,39,42,1)",     logoAccent:"#dc2626",              text:"#fff",    sub:"#a1a1aa"                },
    { bg:"rgba(220,38,38,0.97)",   border:"rgba(185,28,28,0.5)",  logoAccent:"rgba(255,255,255,0.2)", text:"#fff",    sub:"rgba(255,255,255,0.75)" },
    { bg:"rgba(30,30,35,0.97)",    border:"rgba(63,63,70,1)",     logoAccent:"#dc2626",              text:"#f4f4f5", sub:"#71717a"                },
  ],
};

// Mock auth state — replace with real auth context later
const MOCK_USER = null; // set to { name: "Nishant", avatar: null } when logged in

export default function Navbar({ alwaysVisible = false }) {
  const { dark, toggle } = useTheme();
  const t = tokens(dark);
  const [scrolled,  setScrolled]  = useState(false);
  const [colorIdx,  setColorIdx]  = useState(0);
  const [fading,    setFading]    = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    if (alwaysVisible) setScrolled(true);
    return () => window.removeEventListener("scroll", fn);
  }, [alwaysVisible]);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => { setColorIdx(i => (i + 1) % 3); setFading(false); }, 350);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const nc = NAV_COLORS[dark ? "dark" : "light"][colorIdx];
  const navBg     = (scrolled || alwaysVisible) ? nc.bg : "transparent";
  const navBorder = (scrolled || alwaysVisible) ? nc.border : "transparent";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        .nav-ul { position:relative; }
        .nav-ul::after { content:''; position:absolute; bottom:-3px; left:0; width:100%; height:2px; background:currentColor; transform:scaleX(0); transform-origin:left; transition:transform 0.25s ease; border-radius:2px; }
        .nav-ul:hover::after { transform:scaleX(1); }
      `}</style>

      <header style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        backgroundColor: navBg,
        borderBottom: `1px solid ${navBorder}`,
        backdropFilter: (scrolled || alwaysVisible) ? "blur(14px)" : "none",
        opacity: fading ? 0.5 : 1,
        transition: "background-color 0.65s ease, border-color 0.65s ease, opacity 0.35s ease",
        fontFamily: "'Barlow', sans-serif",
      }}>
        <div style={{maxWidth:1280, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between"}}>

          {/* Logo */}
          <a href="/" style={{display:"flex", alignItems:"center", gap:10, textDecoration:"none"}}>
            <div style={{width:32, height:32, borderRadius:8, background:nc.logoAccent, display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.65s ease"}}>
              <span style={{color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14}}>AF</span>
            </div>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:nc.text, transition:"color 0.65s ease", letterSpacing:"-0.02em"}}>
              ARENA<span style={{color: colorIdx===1 ? "rgba(255,255,255,0.65)" : "#dc2626", transition:"color 0.65s ease"}}>FORAGE</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav style={{display:"flex", alignItems:"center", gap:32}} className="hidden md:flex">
            {[["Tournaments","/tournaments"],["Leaderboard","/leaderboard"],["How It Works","/#how-it-works"]].map(([item, href]) => (
              <a key={item} href={href} className="nav-ul"
                style={{position:"relative", color:nc.sub, fontSize:14, fontWeight:600, letterSpacing:"0.04em", textDecoration:"none", transition:"color 0.3s ease"}}
                onMouseEnter={e => e.currentTarget.style.color = nc.text}
                onMouseLeave={e => e.currentTarget.style.color = nc.sub}
              >{item}</a>
            ))}
          </nav>

          {/* Right */}
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            {/* Theme toggle */}
            <button onClick={toggle} aria-label="Toggle theme"
              style={{width:44, height:24, borderRadius:12, padding:2, border:"none", cursor:"pointer", background: dark ? "#dc2626" : "#e4e4e7", position:"relative", transition:"background 0.35s ease", flexShrink:0}}>
              <div style={{width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left: dark ? "calc(100% - 22px)" : 2, transition:"left 0.3s cubic-bezier(0.34,1.56,0.64,1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
                {dark ? "🌙" : "☀️"}
              </div>
            </button>

            {MOCK_USER ? (
              // Logged in state
              <div className="hidden md:flex items-center" style={{gap:8, marginLeft:4}}>
                <a href="/dashboard" style={{fontSize:13, fontWeight:700, color:nc.text, padding:"8px 16px", borderRadius:12, textDecoration:"none", transition:"background 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(128,128,128,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >Dashboard</a>
                <div style={{width:32, height:32, borderRadius:"50%", background:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:13, cursor:"pointer"}}>
                  {MOCK_USER.name[0].toUpperCase()}
                </div>
              </div>
            ) : (
              // Logged out state
              <div className="hidden md:flex" style={{gap:8, marginLeft:4}}>
                <a href="/login" style={{fontSize:14, fontWeight:700, color:nc.text, padding:"8px 16px", borderRadius:12, textDecoration:"none", transition:"background 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(128,128,128,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >Log In</a>
                <a href="/register" style={{fontSize:14, fontWeight:900, color:"#fff", background:"#dc2626", padding:"8px 20px", borderRadius:12, textDecoration:"none", transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#b91c1c"; e.currentTarget.style.transform="scale(1.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#dc2626"; e.currentTarget.style.transform="scale(1)";}}
                >Join Now</a>
                <a href="/admin/auth" style={{fontSize:12, fontWeight:600, color:nc.sub, padding:"8px 12px", borderRadius:12, textDecoration:"none", transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(128,128,128,0.12)"; e.currentTarget.style.color=nc.text;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.color=nc.sub;}}
                >Admin ↗</a>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden" style={{padding:8, background:"none", border:"none", cursor:"pointer"}} onClick={() => setMenuOpen(o => !o)}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:20, height:2, background:nc.text, borderRadius:2, margin:"4px 0", transition:"all 0.2s",
                  transform: menuOpen ? (i===0?"rotate(45deg) translate(4px,6px)":i===2?"rotate(-45deg) translate(4px,-6px)":""):"",
                  opacity: menuOpen && i===1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{background:t.surface, borderTop:`1px solid ${t.border}`, padding:"16px 24px"}}>
            {[["Tournaments","/tournaments"],["Leaderboard","/leaderboard"],["How It Works","/#how-it-works"]].map(([item, href]) => (
              <a key={item} href={href} style={{display:"block", color:t.textPrim, fontWeight:600, padding:"10px 0", borderBottom:`1px solid ${t.borderSub}`, textDecoration:"none", fontSize:15}}>{item}</a>
            ))}
            <div style={{display:"flex", gap:12, marginTop:12}}>
              <a href="/login"    style={{flex:1, textAlign:"center", fontSize:14, fontWeight:700, color:t.textPrim, border:`1px solid ${t.border}`, padding:"10px", borderRadius:12, textDecoration:"none"}}>Log In</a>
              <a href="/register" style={{flex:1, textAlign:"center", fontSize:14, fontWeight:900, color:"#fff", background:"#dc2626", padding:"10px", borderRadius:12, textDecoration:"none"}}>Join Now</a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
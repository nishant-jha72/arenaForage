import { useState, useEffect, useRef } from "react";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_TOURNAMENTS = [
  { id:1, title:"INFERNO CUP S3",  game:"Free Fire", status:"registration_open", prize_pool:{total:50000},  schedule:{start_date:"2026-03-20T18:00:00Z"}, registration:{entry_fee:200, max_teams:12}, teams_registered:7  },
  { id:2, title:"BLOODZONE ELITE", game:"Free Fire", status:"registration_open", prize_pool:{total:100000}, schedule:{start_date:"2026-03-25T16:00:00Z"}, registration:{entry_fee:500, max_teams:12}, teams_registered:12 },
  { id:3, title:"PHANTOM LEAGUE",  game:"Free Fire", status:"live",              prize_pool:{total:25000},  schedule:{start_date:"2026-03-11T14:00:00Z"}, registration:{entry_fee:100, max_teams:12}, teams_registered:12 },
  { id:4, title:"PREDATOR OPEN",   game:"Free Fire", status:"registration_open", prize_pool:{total:75000},  schedule:{start_date:"2026-04-01T17:00:00Z"}, registration:{entry_fee:300, max_teams:12}, teams_registered:4  },
];

const STATS = [
  { label:"Registered Players",      value:12840, suffix:"+" },
  { label:"Tournaments Hosted",      value:348,   suffix:""  },
  { label:"Prize Money Distributed", value:28,    suffix:"L+"},
  { label:"Active Teams",            value:1920,  suffix:"+" },
];

const HOW_IT_WORKS = [
  { step:"01", emoji:"📝", title:"Register",         desc:"Create your account and verify your email to get started on the platform." },
  { step:"02", emoji:"🤝", title:"Form a Team",      desc:"Create or join a team. Invite up to 5 players directly from the platform." },
  { step:"03", emoji:"🎯", title:"Enter Tournament", desc:"Browse open tournaments, pay the entry fee, and register your squad." },
  { step:"04", emoji:"🏆", title:"Compete & Win",    desc:"Get room credentials, drop in, play hard, and claim your share of the prize pool." },
];

// Navbar color cycles — light & dark variants
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

const STATUS = {
  registration_open:   { label:"OPEN",   cls:"bg-emerald-500 text-white", dot:"bg-emerald-300", pulse:false },
  registration_closed: { label:"CLOSED", cls:"bg-zinc-400 text-white",    dot:"bg-zinc-200",    pulse:false },
  live:                { label:"LIVE",   cls:"bg-red-500 text-white",     dot:"bg-red-300",     pulse:true  },
  completed:           { label:"DONE",   cls:"bg-zinc-200 text-zinc-600", dot:"bg-zinc-300",    pulse:false },
  draft:               { label:"SOON",   cls:"bg-amber-400 text-white",   dot:"bg-amber-200",   pulse:false },
};

const GRADIENTS = [
  "from-red-700 via-rose-800 to-zinc-900",
  "from-zinc-800 via-zinc-900 to-black",
  "from-orange-600 via-red-700 to-rose-900",
  "from-slate-700 via-slate-800 to-zinc-900",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (iso) => new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
const fmtINR  = (n)   => n>=100000 ? `₹${(n/100000).toFixed(n%100000===0?0:1)}L` : `₹${n.toLocaleString("en-IN")}`;

// ── useInView ─────────────────────────────────────────────────────────────────
function useInView(thresh=0.15) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting){setV(true);obs.disconnect();} },{threshold:thresh});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[thresh]);
  return [ref,v];
}

// ── AnimatedCounter ───────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix, go, duration=1800 }) {
  const [n,setN] = useState(0);
  const done = useRef(false);
  useEffect(()=>{
    if(!go||done.current) return;
    done.current=true;
    const steps=60, inc=target/steps; let cur=0;
    const id=setInterval(()=>{ cur+=inc; if(cur>=target){setN(target);clearInterval(id);}else setN(Math.floor(cur)); },duration/steps);
    return ()=>clearInterval(id);
  },[go,target,duration]);
  return <span>{n.toLocaleString("en-IN")}{suffix}</span>;
}

// ── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle dark mode"
      style={{
        width:44, height:24, borderRadius:12, padding:2, cursor:"pointer", border:"none",
        background: dark ? "#dc2626" : "#e4e4e7",
        position:"relative", transition:"background 0.35s ease", flexShrink:0,
      }}
    >
      <div style={{
        width:20, height:20, borderRadius:"50%", background:"#fff",
        position:"absolute", top:2,
        left: dark ? "calc(100% - 22px)" : 2,
        transition:"left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
      }}>
        {dark ? "🌙" : "☀️"}
      </div>
    </button>
  );
}

// ── Tournament Card ───────────────────────────────────────────────────────────
function TournamentCard({ t, index, visible, dark }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS[t.status] || STATUS.draft;
  const spotsLeft = t.registration.max_teams - t.teams_registered;
  const fill = (t.teams_registered / t.registration.max_teams) * 100;

  const cardBg     = dark ? "#18181b" : "#fff";
  const cardBorder = dark ? "#3f3f46" : "#f4f4f5";
  const titleColor = hovered ? "#dc2626" : dark ? "#f4f4f5" : "#18181b";
  const metaKey    = dark ? "#71717a" : "#a1a1aa";
  const metaVal    = dark ? "#e4e4e7" : "#18181b";

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        opacity: visible?1:0,
        transform: visible ? (hovered?"translateY(-8px) scale(1.018)":"translateY(0)") : "translateY(36px)",
        transition:`opacity 0.55s ease ${index*110}ms, transform ${hovered?"0.22s":"0.55s"} ease ${hovered?"0ms":index*110+"ms"}, box-shadow 0.22s ease`,
        boxShadow: hovered ? "0 24px 52px rgba(220,38,38,0.18),0 4px 16px rgba(0,0,0,0.18)" : dark?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",
        borderRadius:16, overflow:"hidden", background:cardBg,
        border:`1px solid ${cardBorder}`, cursor:"pointer",
      }}
    >
      {/* Banner */}
      <div className={`relative h-36 bg-gradient-to-br ${GRADIENTS[index%4]} overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(255,255,255,0.4) 18px,rgba(255,255,255,0.4) 19px),repeating-linear-gradient(90deg,transparent,transparent 18px,rgba(255,255,255,0.4) 18px,rgba(255,255,255,0.4) 19px)"}} />
        <span className="absolute inset-0 flex items-center justify-center text-white/10 font-black text-8xl tracking-tighter select-none">FF</span>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.09) 50%,transparent 70%)",opacity:hovered?1:0,transition:"opacity 0.4s ease"}} />
        <div className={`absolute top-3 right-3 ${cfg.cls} text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse?"animate-ping":""}`} />
          {cfg.label}
        </div>
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-sm font-black px-3 py-1 rounded-lg tracking-tight">
          {fmtINR(t.prize_pool.total)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-black text-lg tracking-tight leading-tight mb-0.5 transition-colors duration-200"
          style={{color:titleColor, fontFamily:"'Barlow Condensed',sans-serif"}}>
          {t.title}
        </h3>
        <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{color:metaKey}}>{t.game}</p>

        <div className="space-y-1.5 mb-3">
          {[["Date",fmt(t.schedule.start_date)],["Time",fmtTime(t.schedule.start_date)],["Entry",t.registration.entry_fee===0?"FREE":`₹${t.registration.entry_fee}`]].map(([k,v])=>(
            <div key={k} className="flex justify-between text-xs">
              <span style={{color:metaKey}}>{k}</span>
              <span className="font-bold" style={{color:metaVal}}>{v}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs">
            <span style={{color:metaKey}}>Slots</span>
            <span className={`font-black ${spotsLeft<=0?"text-red-500":spotsLeft<=3?"text-amber-500":"text-emerald-500"}`}>
              {spotsLeft<=0?"FULL":`${spotsLeft} left`}
            </span>
          </div>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{background:dark?"#3f3f46":"#f4f4f5"}}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{width:`${fill}%`,background:fill>=100?"#ef4444":fill>=70?"#f59e0b":"#10b981"}} />
        </div>

        <button
          className="w-full text-[11px] font-black tracking-widest py-2.5 rounded-xl uppercase transition-all duration-200 text-white"
          style={{background:hovered?"#dc2626":"#18181b"}}
          onClick={()=>alert("Coming soon — tournament detail page!")}
        >View Details →</button>
      </div>
    </div>
  );
}

// ── How It Works Step ─────────────────────────────────────────────────────────
function HowStep({ item, index, visible, dark }) {
  const [hovered,setHovered] = useState(false);
  return (
    <div
      className="flex items-start gap-6"
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        opacity:visible?1:0,
        transform:visible?"translateX(0)":"translateX(72px)",
        transition:`opacity 0.65s ease ${index*160}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${index*160}ms`,
      }}
    >
      <div style={{
        flexShrink:0, width:64, height:64, borderRadius:16,
        background:dark?"#27272a":"#fff",
        border:hovered?"2px solid #dc2626":dark?"2px solid #3f3f46":"2px solid #f4f4f5",
        boxShadow:hovered?"0 8px 24px rgba(220,38,38,0.18)":dark?"0 4px 12px rgba(0,0,0,0.3)":"0 4px 12px rgba(0,0,0,0.06)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:28, transition:"all 0.25s ease",
        transform:hovered?"scale(1.1) rotate(-4deg)":"scale(1) rotate(0deg)",
      }}>{item.emoji}</div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-red-500 font-black text-xs tracking-widest">{item.step}</span>
          <div className="h-px flex-1" style={{background:dark?"#3f3f46":"#f4f4f5"}} />
        </div>
        <h3 className="font-black text-2xl tracking-tight mb-1 transition-colors duration-200"
          style={{fontFamily:"'Barlow Condensed',sans-serif", color:hovered?"#dc2626":dark?"#f4f4f5":"#18181b"}}>
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed font-medium" style={{color:dark?"#71717a":"#6b7280"}}>{item.desc}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [dark,       setDark]       = useState(()=> localStorage.getItem("af-theme")==="dark");
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [colorIdx,   setColorIdx]   = useState(0);
  const [fading,     setFading]     = useState(false);

  const [statsRef, statsV] = useInView(0.3);
  const [tourRef,  tourV]  = useInView(0.1);
  const [howRef,   howV]   = useInView(0.1);

  // Persist theme
  useEffect(()=>{
    localStorage.setItem("af-theme", dark?"dark":"light");
    document.documentElement.style.colorScheme = dark?"dark":"light";
  },[dark]);

  // Scroll detection
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",fn);
    return ()=>window.removeEventListener("scroll",fn);
  },[]);

  // Navbar color cycle
  useEffect(()=>{
    const id=setInterval(()=>{
      setFading(true);
      setTimeout(()=>{ setColorIdx(i=>(i+1)%3); setFading(false); },350);
    },3000);
    return ()=>clearInterval(id);
  },[]);

  const nc = NAV_COLORS[dark?"dark":"light"][colorIdx];

  // Theme-aware tokens
  const bg         = dark ? "#09090b" : "#f9fafb";
  const heroBg     = dark ? "#0c0c0f" : "#ffffff";
  const sectionBg  = dark ? "#111113" : "#f4f4f5";
  const cardSec    = dark ? "#0c0c0f" : "#ffffff";
  const borderCol  = dark ? "#27272a" : "#e4e4e7";
  const textPrim   = dark ? "#f4f4f5" : "#18181b";
  const textSub    = dark ? "#71717a" : "#6b7280";
  const statsBg    = dark ? "#18181b" : "#18181b"; // always dark
  const footerBg   = "#09090b";

  return (
    <div style={{minHeight:"100vh", background:bg, transition:"background 0.4s ease", fontFamily:"'Barlow',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes glowPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 10px rgba(220,38,38,0)} }
        .anim-fade-up { animation:fadeUp 0.65s ease both; }
        .ticker-track { display:flex; animation:ticker 28s linear infinite; width:max-content; }
        .nav-ul::after { content:''; position:absolute; bottom:-3px; left:0; width:100%; height:2px; background:currentColor; transform:scaleX(0); transform-origin:left; transition:transform 0.25s ease; border-radius:2px; }
        .nav-ul:hover::after { transform:scaleX(1); }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header style={{
        position:"fixed",top:0,left:0,right:0,zIndex:50,
        backgroundColor:scrolled?nc.bg:"transparent",
        borderBottom:scrolled?`1px solid ${nc.border}`:"1px solid transparent",
        backdropFilter:scrolled?"blur(14px)":"none",
        opacity:fading?0.5:1,
        transition:"background-color 0.65s ease,border-color 0.65s ease,opacity 0.35s ease",
      }}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>

          {/* Logo */}
          <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <div style={{width:32,height:32,borderRadius:8,background:nc.logoAccent,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.65s ease"}}>
              <span style={{color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14}}>AF</span>
            </div>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:nc.text,transition:"color 0.65s ease",letterSpacing:"-0.02em"}}>
              ARENA<span style={{color:colorIdx===1?"rgba(255,255,255,0.65)":"#dc2626",transition:"color 0.65s ease"}}>FORAGE</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav style={{display:"flex",alignItems:"center",gap:32}} className="hidden md:flex">
            {["Tournaments","Leaderboard","How It Works"].map(item=>(
              <a key={item} href="#"
                className="nav-ul"
                style={{position:"relative",color:nc.sub,fontSize:14,fontWeight:600,letterSpacing:"0.04em",textDecoration:"none",transition:"color 0.3s ease"}}
                onMouseEnter={e=>e.currentTarget.style.color=nc.text}
                onMouseLeave={e=>e.currentTarget.style.color=nc.sub}
              >{item}</a>
            ))}
          </nav>

          {/* Right side */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Theme toggle */}
            <ThemeToggle dark={dark} onToggle={()=>setDark(d=>!d)} />

            <div className="hidden md:flex items-center" style={{gap:8,marginLeft:8}}>
              <a href="/login" style={{fontSize:14,fontWeight:700,color:nc.text,padding:"8px 16px",borderRadius:12,textDecoration:"none",transition:"background 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(128,128,128,0.12)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >Log In</a>
              <a href="/register" style={{fontSize:14,fontWeight:900,color:"#fff",background:"#dc2626",padding:"8px 20px",borderRadius:12,textDecoration:"none",transition:"all 0.2s ease",letterSpacing:"0.04em"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#b91c1c";e.currentTarget.style.transform="scale(1.05)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.transform="scale(1)";}}
              >Join Now</a>
              <a href="/admin/login" style={{fontSize:12,fontWeight:600,color:nc.sub,padding:"8px 12px",borderRadius:12,textDecoration:"none",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(128,128,128,0.12)";e.currentTarget.style.color=nc.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=nc.sub;}}
              >Admin ↗</a>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden" style={{padding:8,background:"none",border:"none",cursor:"pointer"}} onClick={()=>setMenuOpen(o=>!o)}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:20,height:2,background:nc.text,borderRadius:2,margin:"4px 0",transition:"all 0.2s",
                  transform:menuOpen?(i===0?"rotate(45deg) translate(4px,6px)":i===2?"rotate(-45deg) translate(4px,-6px)":""):"",
                  opacity:menuOpen&&i===1?0:1,
                }} />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{background:heroBg,borderTop:`1px solid ${borderCol}`,padding:"16px 24px"}}>
            {["Tournaments","Leaderboard","How It Works"].map(item=>(
              <a key={item} href="#" style={{display:"block",color:textPrim,fontWeight:600,padding:"10px 0",borderBottom:`1px solid ${borderCol}`,textDecoration:"none",fontSize:15}}>{item}</a>
            ))}
            <div style={{display:"flex",gap:12,marginTop:12}}>
              <a href="/login"    style={{flex:1,textAlign:"center",fontSize:14,fontWeight:700,color:textPrim,border:`1px solid ${borderCol}`,padding:"10px",borderRadius:12,textDecoration:"none"}}>Log In</a>
              <a href="/register" style={{flex:1,textAlign:"center",fontSize:14,fontWeight:900,color:"#fff",background:"#dc2626",padding:"10px",borderRadius:12,textDecoration:"none"}}>Join Now</a>
            </div>
          </div>
        )}
      </header>

      {/* ── Ticker ──────────────────────────────────────────────────────── */}
      <div style={{paddingTop:64,background:"#dc2626",overflow:"hidden"}}>
        <div style={{padding:"6px 0",display:"flex",alignItems:"center"}}>
          <span style={{flexShrink:0,background:"#18181b",color:"#fff",fontSize:10,fontWeight:900,letterSpacing:"0.15em",padding:"6px 16px"}}>LIVE</span>
          <div style={{overflow:"hidden",flex:1}}>
            <div className="ticker-track">
              {[...Array(2)].flatMap(()=>["🏆 INFERNO CUP S3 — Registration Open — ₹50,000","🔥 BLOODZONE ELITE — 12 Teams Full — March 25","⚡ PHANTOM LEAGUE — Currently LIVE","🎯 PREDATOR OPEN — April 1 — ₹75,000"]).map((m,i)=>(
                <span key={i} style={{color:"#fff",fontSize:12,fontWeight:600,letterSpacing:"0.04em",padding:"0 32px",whiteSpace:"nowrap"}}>{m} &nbsp;•</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{position:"relative",background:heroBg,overflow:"hidden",transition:"background 0.4s ease"}}>
        <div style={{position:"absolute",inset:0,opacity:0.025,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,#888 40px,#888 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#888 40px,#888 41px)"}} />
        <div style={{position:"absolute",top:0,right:0,width:"40%",height:"100%",background:`linear-gradient(to left, ${dark?"rgba(220,38,38,0.06)":"rgba(220,38,38,0.04)"}, transparent)`,pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:0,left:0,width:128,height:4,background:"#dc2626"}} />

        <div style={{maxWidth:1280,margin:"0 auto",padding:"96px 24px 112px"}}>
          <div style={{maxWidth:700}}>
            <div className="anim-fade-up" style={{animationDelay:"0ms"}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#dc2626",fontSize:11,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:24}}>
                <span style={{width:24,height:1,background:"#dc2626",display:"inline-block"}} />
                India's Free Fire Tournament Platform
              </span>
            </div>
            <h1 className="anim-fade-up" style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(56px,8vw,96px)",color:textPrim,lineHeight:1,letterSpacing:"-0.02em",marginBottom:24,animationDelay:"100ms",transition:"color 0.4s ease"}}>
              COMPETE.<br /><span style={{color:"#dc2626"}}>CONQUER.</span><br />COLLECT.
            </h1>
            <p className="anim-fade-up" style={{color:textSub,fontSize:18,fontWeight:500,lineHeight:1.6,marginBottom:40,maxWidth:480,animationDelay:"200ms",transition:"color 0.4s ease"}}>
              Register your team, compete in official Free Fire tournaments, and claim your share of lakhs in prize money.
            </p>
            <div className="anim-fade-up" style={{display:"flex",flexWrap:"wrap",gap:16,animationDelay:"300ms"}}>
              <a href="/register" style={{display:"inline-flex",alignItems:"center",gap:8,color:"#fff",background:"#dc2626",fontWeight:900,fontSize:13,letterSpacing:"0.12em",padding:"16px 32px",borderRadius:16,textDecoration:"none",textTransform:"uppercase",animation:"glowPulse 2.5s infinite",transition:"all 0.2s ease"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#b91c1c";e.currentTarget.style.transform="scale(1.04)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.transform="scale(1)";}}
              >Register Your Team →</a>
              <a href="#tournaments" style={{display:"inline-flex",alignItems:"center",color:"#fff",background:"#18181b",fontWeight:900,fontSize:13,letterSpacing:"0.12em",padding:"16px 32px",borderRadius:16,textDecoration:"none",textTransform:"uppercase",transition:"all 0.2s ease"}}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              >Browse Tournaments</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section style={{background:statsBg,padding:"48px 0"}} ref={statsRef}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:32}}>
            {STATS.map((s,i)=>(
              <div key={i} style={{textAlign:"center",opacity:statsV?1:0,transform:statsV?"translateY(0)":"translateY(20px)",transition:`opacity 0.6s ease ${i*120}ms,transform 0.6s ease ${i*120}ms`}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,color:"#fff",lineHeight:1,marginBottom:4}}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} go={statsV} />
                </div>
                <div style={{color:"#71717a",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tournaments ─────────────────────────────────────────────────── */}
      <section id="tournaments" style={{padding:"80px 0",background:sectionBg,transition:"background 0.4s ease"}} ref={tourRef}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px"}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:40,opacity:tourV?1:0,transform:tourV?"translateY(0)":"translateY(20px)",transition:"opacity 0.5s ease,transform 0.5s ease"}}>
            <div>
              <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#dc2626",fontSize:11,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:12}}>
                <span style={{width:16,height:1,background:"#dc2626",display:"inline-block"}} />Active &amp; Upcoming
              </span>
              <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(40px,5vw,64px)",color:textPrim,lineHeight:1,letterSpacing:"-0.02em",transition:"color 0.4s ease"}}>TOURNAMENTS</h2>
            </div>
            <a href="/tournaments" style={{fontSize:13,fontWeight:900,color:textSub,textDecoration:"none",letterSpacing:"0.08em",textTransform:"uppercase",transition:"color 0.2s"}}>View All →</a>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:20}}>
            {MOCK_TOURNAMENTS.map((t,i)=><TournamentCard key={t.id} t={t} index={i} visible={tourV} dark={dark} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section style={{padding:"80px 0",background:cardSec,borderTop:`1px solid ${borderCol}`,transition:"background 0.4s ease,border-color 0.4s ease"}} ref={howRef}>
        <div style={{maxWidth:760,margin:"0 auto",padding:"0 24px"}}>
          <div style={{marginBottom:56,opacity:howV?1:0,transform:howV?"translateY(0)":"translateY(20px)",transition:"opacity 0.5s ease,transform 0.5s ease"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#dc2626",fontSize:11,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:12}}>
              <span style={{width:16,height:1,background:"#dc2626",display:"inline-block"}} />Simple Process
            </span>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(40px,5vw,64px)",color:textPrim,lineHeight:1,transition:"color 0.4s ease"}}>HOW IT WORKS</h2>
          </div>
          <div style={{position:"relative",display:"flex",flexDirection:"column",gap:40}}>
            <div style={{position:"absolute",left:32,top:0,bottom:0,width:1,background:borderCol,opacity:howV?1:0,transition:"opacity 0.8s ease 0.6s"}} />
            {HOW_IT_WORKS.map((item,i)=><HowStep key={i} item={item} index={i} visible={howV} dark={dark} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{background:"#dc2626",padding:"64px 0",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.1,backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,0.5) 20px,rgba(255,255,255,0.5) 21px)"}} />
        <div style={{position:"relative",maxWidth:1280,margin:"0 auto",padding:"0 24px",textAlign:"center"}}>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(40px,6vw,80px)",color:"#fff",letterSpacing:"-0.02em",marginBottom:16}}>READY TO DROP IN?</h2>
          <p style={{color:"rgba(255,255,255,0.8)",fontSize:18,fontWeight:500,marginBottom:32,maxWidth:480,margin:"0 auto 32px"}}>
            Join thousands of players competing for real prize money every week.
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:16,justifyContent:"center"}}>
            <a href="/register" style={{background:"#fff",color:"#dc2626",fontWeight:900,fontSize:13,letterSpacing:"0.12em",padding:"16px 32px",borderRadius:16,textDecoration:"none",textTransform:"uppercase",transition:"all 0.2s ease"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.background="#f4f4f5";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background="#fff";}}
            >Create Free Account →</a>
            <a href="/admin/register" style={{background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.4)",fontWeight:900,fontSize:13,letterSpacing:"0.12em",padding:"16px 32px",borderRadius:16,textDecoration:"none",textTransform:"uppercase",transition:"all 0.2s ease"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="white";e.currentTarget.style.background="rgba(255,255,255,0.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.4)";e.currentTarget.style.background="transparent";}}
            >Host a Tournament</a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{background:footerBg,padding:"64px 0 32px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:40,marginBottom:48}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:32,height:32,background:"#dc2626",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14}}>AF</span>
                </div>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#fff",letterSpacing:"-0.02em"}}>
                  ARENA<span style={{color:"#ef4444"}}>FORAGE</span>
                </span>
              </div>
              <p style={{color:"#52525b",fontSize:14,lineHeight:1.6}}>India's premier Free Fire tournament hosting platform. Fair play. Real prizes.</p>
            </div>
            {[
              {h:"Players",    l:["Register","Login","Browse Tournaments","My Team","Leaderboard"]},
              {h:"Organizers", l:["Host a Tournament","Admin Login","Admin Register","Pricing"]},
              {h:"Platform",   l:["About Us","Rules & Guidelines","Support","Privacy Policy","Terms of Service"]},
            ].map(col=>(
              <div key={col.h}>
                <h4 style={{color:"#fff",fontWeight:900,fontSize:11,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16}}>{col.h}</h4>
                <ul style={{listStyle:"none"}}>
                  {col.l.map(l=>(
                    <li key={l} style={{marginBottom:10}}>
                      <a href="#" style={{color:"#52525b",fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}
                        onMouseEnter={e=>e.currentTarget.style.color="#fff"}
                        onMouseLeave={e=>e.currentTarget.style.color="#52525b"}
                      >{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid #27272a",paddingTop:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <p style={{color:"#3f3f46",fontSize:12}}>© 2026 ArenaForage. Not affiliated with Garena Free Fire.</p>
            <a href="/superadmin/login" style={{color:"#3f3f46",fontSize:12,textDecoration:"none",transition:"color 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#71717a"}
              onMouseLeave={e=>e.currentTarget.style.color="#3f3f46"}
            >Super Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
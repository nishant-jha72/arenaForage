// src/pages/TournamentsPage.jsx
import { useState, useMemo } from "react";
import { useTheme, tokens } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

// TODO: Replace with GET /api/tournaments from tournament service
const ALL_TOURNAMENTS = [
  { id:"t1", title:"INFERNO CUP S3",   game:"Free Fire", status:"registration_open", prize_pool:{total:50000},  schedule:{start_date:"2026-03-20T18:00:00Z"}, registration:{entry_fee:200, max_teams:12}, teams_registered:7  },
  { id:"t2", title:"BLOODZONE ELITE",  game:"Free Fire", status:"registration_open", prize_pool:{total:100000}, schedule:{start_date:"2026-03-25T16:00:00Z"}, registration:{entry_fee:500, max_teams:12}, teams_registered:12 },
  { id:"t3", title:"PHANTOM LEAGUE",   game:"Free Fire", status:"live",              prize_pool:{total:25000},  schedule:{start_date:"2026-03-11T14:00:00Z"}, registration:{entry_fee:100, max_teams:12}, teams_registered:12 },
  { id:"t4", title:"PREDATOR OPEN",    game:"Free Fire", status:"registration_open", prize_pool:{total:75000},  schedule:{start_date:"2026-04-01T17:00:00Z"}, registration:{entry_fee:300, max_teams:12}, teams_registered:4  },
  { id:"t5", title:"SHADOW STRIKE",    game:"Free Fire", status:"completed",         prize_pool:{total:30000},  schedule:{start_date:"2026-02-28T16:00:00Z"}, registration:{entry_fee:150, max_teams:12}, teams_registered:12 },
  { id:"t6", title:"APEX CLASH S1",    game:"Free Fire", status:"draft",             prize_pool:{total:120000}, schedule:{start_date:"2026-04-15T18:00:00Z"}, registration:{entry_fee:600, max_teams:12}, teams_registered:0  },
  { id:"t7", title:"REAPER CUP",       game:"Free Fire", status:"registration_open", prize_pool:{total:40000},  schedule:{start_date:"2026-03-28T17:00:00Z"}, registration:{entry_fee:200, max_teams:12}, teams_registered:9  },
  { id:"t8", title:"FINAL ZONE OPEN",  game:"Free Fire", status:"completed",         prize_pool:{total:20000},  schedule:{start_date:"2026-02-10T14:00:00Z"}, registration:{entry_fee:0,   max_teams:12}, teams_registered:12 },
];

const STATUS_CFG = {
  registration_open:   { label:"OPEN",   bg:"#10b981", dot:true  },
  registration_closed: { label:"CLOSED", bg:"#71717a", dot:false },
  live:                { label:"LIVE",   bg:"#dc2626", dot:true  },
  completed:           { label:"DONE",   bg:"#52525b", dot:false },
  draft:               { label:"SOON",   bg:"#f59e0b", dot:false },
};

const GRADIENTS = [
  "from-red-700 via-rose-800 to-zinc-900",
  "from-zinc-700 via-zinc-800 to-black",
  "from-orange-600 via-red-700 to-rose-900",
  "from-slate-600 via-slate-800 to-zinc-900",
  "from-rose-700 via-red-800 to-zinc-900",
  "from-zinc-600 via-zinc-900 to-black",
];

const fmt     = iso => new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const fmtTime = iso => new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
const fmtINR  = n   => n>=100000 ? `₹${(n/100000).toFixed(n%100000===0?0:1)}L` : `₹${n.toLocaleString("en-IN")}`;

// ── Filter Chip ───────────────────────────────────────────────────────────────
function Chip({ label, active, onClick, dark }) {
  const t = tokens(dark);
  return (
    <button onClick={onClick}
      style={{padding:"6px 16px", borderRadius:20, border:`1.5px solid ${active?"#dc2626":t.border}`, background: active?"rgba(220,38,38,0.1)":"transparent", color: active?"#dc2626":t.textSub, fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap"}}>
      {label}
    </button>
  );
}

// ── Tournament Card ───────────────────────────────────────────────────────────
function TournamentCard({ t: tournament, idx, dark }) {
  const t = tokens(dark);
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CFG[tournament.status] || STATUS_CFG.draft;
  const spotsLeft = tournament.registration.max_teams - tournament.teams_registered;
  const fill = (tournament.teams_registered / tournament.registration.max_teams) * 100;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.location.href = `/tournaments/${tournament.id}`}
      style={{
        background:t.surface, border:`1px solid ${hovered?"#dc2626":t.border}`,
        borderRadius:20, overflow:"hidden", cursor:"pointer",
        boxShadow: hovered ? `0 20px 48px rgba(220,38,38,0.15), 0 4px 16px ${t.shadow}` : `0 2px 10px ${t.shadow}`,
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition:"all 0.25s ease",
      }}
    >
      {/* Banner */}
      <div className={`relative h-32 bg-gradient-to-br ${GRADIENTS[idx%6]} overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(255,255,255,0.3) 18px,rgba(255,255,255,0.3) 19px),repeating-linear-gradient(90deg,transparent,transparent 18px,rgba(255,255,255,0.3) 18px,rgba(255,255,255,0.3) 19px)"}} />
        <span className="absolute inset-0 flex items-center justify-center text-white/10 font-black text-7xl tracking-tighter select-none">FF</span>
        <div style={{position:"absolute",top:10,right:10,background:cfg.bg,color:"#fff",fontSize:10,fontWeight:900,letterSpacing:"0.12em",padding:"3px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:5}}>
          {cfg.dot && <span style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.7)",animation: tournament.status==="live"?"ping 1s infinite":""}} />}
          {cfg.label}
        </div>
        <div style={{position:"absolute",bottom:10,left:10,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",color:"#fff",fontSize:14,fontWeight:900,padding:"4px 12px",borderRadius:8}}>
          {fmtINR(tournament.prize_pool.total)}
        </div>
      </div>

      {/* Body */}
      <div style={{padding:18}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color: hovered?"#dc2626":t.textPrim,margin:"0 0 2px",transition:"color 0.2s"}}>{tournament.title}</h3>
        <p style={{color:t.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 14px"}}>{tournament.game}</p>

        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {[["📅",fmt(tournament.schedule.start_date)],["🕐",fmtTime(tournament.schedule.start_date)],["💰",tournament.registration.entry_fee===0?"FREE":`₹${tournament.registration.entry_fee}`]].map(([icon,val])=>(
            <div key={icon} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
              <span style={{color:t.textMuted}}>{icon}</span>
              <span style={{color:t.textPrim,fontWeight:600}}>{val}</span>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:t.textMuted}}>🪑 Slots</span>
            <span style={{fontWeight:700,color:spotsLeft<=0?"#ef4444":spotsLeft<=3?"#f59e0b":"#10b981"}}>{spotsLeft<=0?"FULL":`${spotsLeft} left`}</span>
          </div>
        </div>

        {/* Slot bar */}
        <div style={{height:4,background:t.surface2,borderRadius:4,overflow:"hidden",marginBottom:16}}>
          <div style={{height:"100%",background:fill>=100?"#ef4444":fill>=70?"#f59e0b":"#10b981",width:`${fill}%`,borderRadius:4,transition:"width 0.5s ease"}} />
        </div>

        <button style={{width:"100%",padding:"10px",background:hovered?"#dc2626":"transparent",color:hovered?"#fff":t.textPrim,border:`1.5px solid ${hovered?"#dc2626":t.border}`,borderRadius:12,fontFamily:"'Barlow',sans-serif",fontWeight:900,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.22s ease"}}>
          View Details →
        </button>
      </div>
    </div>
  );
}

// ── Main Tournaments Page ─────────────────────────────────────────────────────
export default function TournamentsPage() {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState("date");

  const filtered = useMemo(() => {
    let list = [...ALL_TOURNAMENTS];
    if (statusFilter !== "all") list = list.filter(x => x.status === statusFilter);
    if (search.trim()) list = list.filter(x => x.title.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "prize") list.sort((a,b) => b.prize_pool.total - a.prize_pool.total);
    else if (sortBy === "date") list.sort((a,b) => new Date(a.schedule.start_date) - new Date(b.schedule.start_date));
    else if (sortBy === "slots") list.sort((a,b) => (a.registration.max_teams - a.teams_registered) - (b.registration.max_teams - b.teams_registered));
    return list;
  }, [statusFilter, search, sortBy]);

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'Barlow',sans-serif",transition:"background 0.4s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      <Navbar alwaysVisible />

      <div style={{maxWidth:1280,margin:"0 auto",padding:"88px 24px 48px"}}>

        {/* Page header */}
        <div style={{marginBottom:32}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#dc2626",fontSize:11,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>
            <span style={{width:16,height:1,background:"#dc2626",display:"inline-block"}} />Free Fire Tournaments
          </span>
          <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(40px,5vw,64px)",color:t.textPrim,letterSpacing:"-0.02em",lineHeight:1}}>ALL TOURNAMENTS</h1>
        </div>

        {/* Filters */}
        <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",marginBottom:28,paddingBottom:24,borderBottom:`1px solid ${t.border}`}}>
          {/* Search */}
          <div style={{position:"relative",flex:"1 1 220px",minWidth:220}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.4}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tournaments…"
              style={{width:"100%",padding:"9px 14px 9px 36px",background:t.inputBg,border:`1.5px solid ${t.inputBorder}`,borderRadius:12,color:t.textPrim,fontSize:14,fontFamily:"'Barlow',sans-serif",outline:"none",boxSizing:"border-box"}} />
          </div>

          {/* Status chips */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["all","All"],["registration_open","Open"],["live","Live"],["completed","Completed"],["draft","Coming Soon"]].map(([val,label])=>(
              <Chip key={val} label={label} active={statusFilter===val} onClick={()=>setStatusFilter(val)} dark={dark} />
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{padding:"9px 14px",background:t.inputBg,border:`1.5px solid ${t.inputBorder}`,borderRadius:12,color:t.textPrim,fontSize:13,fontFamily:"'Barlow',sans-serif",outline:"none",cursor:"pointer"}}>
            <option value="date">Sort: Date</option>
            <option value="prize">Sort: Prize Pool</option>
            <option value="slots">Sort: Slots Available</option>
          </select>
        </div>

        {/* Results count */}
        <p style={{color:t.textMuted,fontSize:13,fontWeight:600,marginBottom:20}}>{filtered.length} tournament{filtered.length!==1?"s":""} found</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"80px 24px"}}>
            <p style={{fontSize:48,marginBottom:12}}>🔍</p>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:t.textPrim,marginBottom:8}}>NO TOURNAMENTS FOUND</h3>
            <p style={{color:t.textSub,fontSize:15}}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:20}}>
            {filtered.map((tournament, i) => (
              <TournamentCard key={tournament.id} t={tournament} idx={i} dark={dark} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
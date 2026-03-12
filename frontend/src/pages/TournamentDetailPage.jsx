// src/pages/TournamentDetailPage.jsx
import { useState } from "react";
import { useTheme, tokens } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// TODO: Fetch from GET /api/tournaments/:id (tournament service)
const MOCK_TOURNAMENT = {
  _id:"t1", title:"INFERNO CUP S3", game:"Free Fire",
  description:"The third season of the Inferno Cup. 12 teams battle across 6 matches for the top prize.",
  status:"registration_open",
  admin_name:"ArenaForage Official",
  prize_pool:{ total:50000, currency:"INR", distribution:[{position:1,amount:25000},{position:2,amount:15000},{position:3,amount:10000}] },
  schedule:{ start_date:"2026-03-20T18:00:00Z", end_date:"2026-03-20T22:00:00Z" },
  registration:{ start_date:"2026-03-10T00:00:00Z", end_date:"2026-03-19T23:59:00Z", entry_fee:200, max_teams:12, max_per_team:5, max_entries:60, is_free:false },
  teams:[
    {team_id:"tm1",team_name:"ALPHA SQUAD",   leader_user_id:1, is_confirmed:true,  players:[{username:"NishantJha",is_verified:true},{username:"RahulKing",is_verified:true},{username:"DevPlayer",is_verified:false},{username:"SniperX99",is_verified:false},{username:"FireStorm",is_verified:false}]},
    {team_id:"tm2",team_name:"GHOST UNIT",    leader_user_id:2, is_confirmed:true,  players:[{username:"GhostLead",is_verified:true},{username:"Phantom99",is_verified:true},{username:"ShadowX",is_verified:true},{username:"DarkFire",is_verified:false},{username:"StealthOp",is_verified:false}]},
    {team_id:"tm3",team_name:"PREDATOR 5",    leader_user_id:3, is_confirmed:true,  players:[{username:"PredX",is_verified:true},{username:"Apex01",is_verified:true},{username:"Rage99",is_verified:true},{username:"BlastOp",is_verified:true},{username:"StrikE",is_verified:true}]},
    {team_id:"tm4",team_name:"REAPER SQUAD",  leader_user_id:4, is_confirmed:false, players:[{username:"ReapLead",is_verified:false},{username:"Scythe1",is_verified:false}]},
    {team_id:"tm5",team_name:"SHADOW WOLVES", leader_user_id:5, is_confirmed:false, players:[{username:"WolfPack",is_verified:false},{username:"Howler9",is_verified:false},{username:"MoonFang",is_verified:false}]},
    {team_id:"tm6",team_name:"BLAZE FORCE",   leader_user_id:6, is_confirmed:true,  players:[{username:"BlazeOG",is_verified:true},{username:"Inferno7",is_verified:true},{username:"Flamez",is_verified:true},{username:"HotShot",is_verified:false},{username:"Cinder",is_verified:false}]},
    {team_id:"tm7",team_name:"FROST UNIT",    leader_user_id:7, is_confirmed:false, players:[{username:"IceLead",is_verified:false}]},
  ],
  total_entries:37,
  scores:[],
  winner:null,
};

const STATUS_CFG = {
  registration_open:   {label:"REGISTRATION OPEN",   bg:"rgba(16,185,129,0.1)",   color:"#10b981", border:"rgba(16,185,129,0.3)"},
  registration_closed: {label:"REGISTRATION CLOSED", bg:"rgba(113,113,122,0.1)",  color:"#71717a", border:"rgba(113,113,122,0.3)"},
  live:                {label:"🔴 LIVE NOW",          bg:"rgba(220,38,38,0.1)",    color:"#dc2626", border:"rgba(220,38,38,0.3)"},
  completed:           {label:"COMPLETED",            bg:"rgba(82,82,91,0.1)",     color:"#71717a", border:"rgba(82,82,91,0.3)"},
  draft:               {label:"COMING SOON",          bg:"rgba(245,158,11,0.1)",   color:"#f59e0b", border:"rgba(245,158,11,0.3)"},
};

const fmt     = iso => new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
const fmtTime = iso => new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
const fmtINR  = n   => `₹${n.toLocaleString("en-IN")}`;

// ── Info Card ─────────────────────────────────────────────────────────────────
function InfoCard({ icon, label, value, sub, dark }) {
  const t = tokens(dark);
  return (
    <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:"18px 20px"}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <p style={{color:t.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 4px"}}>{label}</p>
      <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:t.textPrim,margin:0}}>{value}</p>
      {sub && <p style={{color:t.textSub,fontSize:12,margin:"2px 0 0"}}>{sub}</p>}
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, dark }) {
  const t = tokens(dark);
  return (
    <button onClick={onClick}
      style={{padding:"10px 20px",border:"none",borderBottom:`2px solid ${active?"#dc2626":"transparent"}`,background:"transparent",color:active?"#dc2626":t.textSub,fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>
      {label}
    </button>
  );
}


// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ tournament, dark }) {
  const t = tokens(dark);
  const status = STATUS_CFG[tournament.status] || STATUS_CFG.draft;
  const confirmedTeams = tournament.teams.filter(x=>x.is_confirmed).length;

  return (
    <div>
      {/* Status banner */}
      <div style={{background:status.bg,border:`1px solid ${status.border}`,borderRadius:14,padding:"12px 18px",marginBottom:24,display:"inline-flex",alignItems:"center",gap:8}}>
        <span style={{fontWeight:900,fontSize:13,letterSpacing:"0.1em",color:status.color,textTransform:"uppercase"}}>{status.label}</span>
      </div>

      {/* Description */}
      <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,padding:24,marginBottom:20}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:t.textPrim,margin:"0 0 10px"}}>ABOUT THIS TOURNAMENT</h3>
        <p style={{color:t.textSub,fontSize:15,lineHeight:1.7,margin:0}}>{tournament.description}</p>
        <p style={{color:t.textMuted,fontSize:13,marginTop:10,fontWeight:500}}>Organized by <strong style={{color:t.textPrim}}>{tournament.admin_name}</strong></p>
      </div>

      {/* Info grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:20}}>
        <InfoCard icon="📅" label="Start Date"  value={fmt(tournament.schedule.start_date)}     dark={dark} />
        <InfoCard icon="🕐" label="Start Time"  value={fmtTime(tournament.schedule.start_date)} dark={dark} />
        <InfoCard icon="💰" label="Entry Fee"   value={tournament.registration.is_free?"FREE":fmtINR(tournament.registration.entry_fee)} dark={dark} />
        <InfoCard icon="👥" label="Max Teams"   value={`${confirmedTeams} / ${tournament.registration.max_teams}`} sub="confirmed teams" dark={dark} />
        <InfoCard icon="🎮" label="Max Players" value={`${tournament.registration.max_per_team} per team`} dark={dark} />
        <InfoCard icon="📊" label="Total Entries" value={`${tournament.total_entries} / ${tournament.registration.max_entries}`} dark={dark} />
      </div>

      {/* Prize pool */}
      <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,padding:24}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:t.textPrim,margin:"0 0 16px"}}>🏆 PRIZE POOL — {fmtINR(tournament.prize_pool.total)}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {tournament.prize_pool.distribution.map((p,i) => {
            const icons = ["🥇","🥈","🥉"];
            const pct   = (p.amount/tournament.prize_pool.total)*100;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:22,flexShrink:0}}>{icons[i]||`#${p.position}`}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:t.textSub,fontSize:13,fontWeight:600}}>Position {p.position}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:t.textPrim}}>{fmtINR(p.amount)}</span>
                  </div>
                  <div style={{height:6,background:t.surface2,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",background:i===0?"#f59e0b":i===1?"#9ca3af":"#cd7f32",width:`${pct}%`,borderRadius:4}} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Teams/Bracket Tab ─────────────────────────────────────────────────────────
function BracketTab({ tournament, dark }) {
  const t = tokens(dark);
  const confirmed   = tournament.teams.filter(x=>x.is_confirmed);
  const unconfirmed = tournament.teams.filter(x=>!x.is_confirmed);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {[...confirmed,...unconfirmed].map((team,i) => {
          const verifiedCount = team.players.filter(p=>p.is_verified).length;
          return (
            <div key={team.team_id} style={{background:t.surface,border:`1px solid ${team.is_confirmed?t.border:"rgba(245,158,11,0.3)"}`,borderRadius:16,padding:18,opacity:team.is_confirmed?1:0.6}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:`hsl(${i*43},60%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12}}>
                    #{i+1}
                  </div>
                  <div>
                    <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:t.textPrim,margin:0}}>{team.team_name}</p>
                    <p style={{color:t.textMuted,fontSize:11,margin:0}}>{team.players.length} player{team.players.length!==1?"s":""}</p>
                  </div>
                </div>
                <span style={{fontSize:10,fontWeight:900,letterSpacing:"0.1em",padding:"3px 10px",borderRadius:20,background:team.is_confirmed?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",color:team.is_confirmed?"#10b981":"#f59e0b"}}>
                  {team.is_confirmed?"CONFIRMED":"PENDING"}
                </span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {team.players.map((p,pi)=>(
                  <span key={pi} style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:p.is_verified?"rgba(16,185,129,0.1)":"rgba(113,113,122,0.1)",color:p.is_verified?"#10b981":t.textMuted,fontWeight:600}}>
                    {p.is_verified?"✓":""} {p.username}
                  </span>
                ))}
              </div>
              {team.is_confirmed && (
                <p style={{color:t.textMuted,fontSize:11,marginTop:10,fontWeight:500}}>{verifiedCount}/{team.players.length} players verified</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────────
function LeaderboardTab({ tournament, dark }) {
  const t = tokens(dark);
  const hasScores = tournament.scores && tournament.scores.length > 0;

  if (!hasScores) return (
    <div style={{textAlign:"center",padding:"64px 24px"}}>
      <p style={{fontSize:48,marginBottom:12}}>⏳</p>
      <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:t.textPrim,marginBottom:8}}>SCORES NOT YET SUBMITTED</h3>
      <p style={{color:t.textSub,fontSize:15}}>Check back once the tournament goes live and matches are played.</p>
      <div style={{marginTop:24,padding:"16px 20px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,display:"inline-block",textAlign:"left"}}>
        <p style={{color:t.textMuted,fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Free Fire Points Table</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {[[1,12],[2,9],[3,8],[4,7],[5,6],[6,5],[7,4],[8,3],[9,2],[10,1]].map(([pos,pts])=>(
            <div key={pos} style={{textAlign:"center",padding:"6px",background:t.surface2,borderRadius:8}}>
              <p style={{color:t.textMuted,fontSize:10,margin:"0 0 2px"}}>#{pos}</p>
              <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:t.textPrim,margin:0}}>{pts}</p>
            </div>
          ))}
        </div>
        <p style={{color:t.textMuted,fontSize:12,marginTop:8,fontWeight:500}}>+ 1 point per kill</p>
      </div>
    </div>
  );

  return <p style={{color:t.textSub}}>Leaderboard data will appear here once matches are played.</p>;
}

// ── Main Tournament Detail Page ───────────────────────────────────────────────
export default function TournamentDetailPage() {
  const navigate = useNavigate();

  const handleRegister = () => {
  navigate(`/tournaments/${tournament._id}/register`);
  };
  const { dark } = useTheme();
  const t = tokens(dark);
  const [activeTab, setActiveTab] = useState("overview");

  // TODO: Get tournament ID from URL params
  const tournament = MOCK_TOURNAMENT;
  const spotsLeft = tournament.registration.max_teams - tournament.teams.filter(x=>x.is_confirmed).length;
  const canRegister = tournament.status === "registration_open" && spotsLeft > 0;

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'Barlow',sans-serif",transition:"background 0.4s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      <Navbar alwaysVisible />

      {/* Hero banner */}
      <div style={{background:"linear-gradient(135deg,#7f1d1d,#dc2626,#991b1b)",paddingTop:64}}>
        <div style={{position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,opacity:0.08,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,0.5) 30px,rgba(255,255,255,0.5) 31px),repeating-linear-gradient(90deg,transparent,transparent 30px,rgba(255,255,255,0.5) 30px,rgba(255,255,255,0.5) 31px)"}} />
          <div style={{maxWidth:1280,margin:"0 auto",padding:"48px 24px 40px",position:"relative"}}>
            <a href="/tournaments" style={{display:"inline-flex",alignItems:"center",gap:6,color:"rgba(255,255,255,0.65)",fontSize:13,fontWeight:600,textDecoration:"none",marginBottom:16}}>← Back to Tournaments</a>
            <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(36px,5vw,72px)",color:"#fff",letterSpacing:"-0.02em",lineHeight:1,marginBottom:8}}>{tournament.title}</h1>
            <p style={{color:"rgba(255,255,255,0.7)",fontSize:15,marginBottom:24}}>{tournament.game} • Organized by {tournament.admin_name}</p>

            <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center"}}>
              <div style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(8px)",borderRadius:12,padding:"10px 18px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>Prize Pool</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#fff"}}>{fmtINR(tournament.prize_pool.total)}</span>
              </div>
              <div style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(8px)",borderRadius:12,padding:"10px 18px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>Entry</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#fff"}}>{tournament.registration.is_free?"FREE":fmtINR(tournament.registration.entry_fee)}</span>
              </div>
              <div style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(8px)",borderRadius:12,padding:"10px 18px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>Slots Left</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color: spotsLeft<=0?"#ef4444":spotsLeft<=3?"#f59e0b":"#fff"}}>{spotsLeft<=0?"FULL":spotsLeft}</span>
              </div>

              {canRegister && (
                <button style={{marginLeft:"auto",padding:"12px 32px",background:"#fff",color:"#dc2626",border:"none",borderRadius:14,fontFamily:"'Barlow',sans-serif",fontWeight:900,fontSize:14,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}
                  onClick={()=>{ handleRegister()}}
                >Register Team →</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{borderBottom:`1px solid ${t.border}`,background:t.surface,position:"sticky",top:64,zIndex:40}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px",display:"flex",gap:4,overflowX:"auto"}}>
          {[["overview","Overview"],["teams","Teams & Bracket"],["leaderboard","Leaderboard"]].map(([id,label])=>(
            <Tab key={id} label={label} active={activeTab===id} onClick={()=>setActiveTab(id)} dark={dark} />
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{maxWidth:1280,margin:"0 auto",padding:"32px 24px 64px"}}>
        {activeTab==="overview"    && <OverviewTab    tournament={tournament} dark={dark} />}
        {activeTab==="teams"       && <BracketTab     tournament={tournament} dark={dark} />}
        {activeTab==="leaderboard" && <LeaderboardTab tournament={tournament} dark={dark} />}
      </div>
    </div>
  );
}
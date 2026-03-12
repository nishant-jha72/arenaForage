// src/pages/LeaderboardPage.jsx
import { useState, useMemo } from "react";
import { useTheme, tokens } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

// TODO: Replace with GET /api/tournaments?status=completed,live (tournament service)
const COMPLETED_TOURNAMENTS = [
  { id:"t3", title:"PHANTOM LEAGUE",  date:"2026-03-11", status:"live"      },
  { id:"t5", title:"SHADOW STRIKE",   date:"2026-02-28", status:"completed" },
  { id:"t8", title:"FINAL ZONE OPEN", date:"2026-02-10", status:"completed" },
];

// TODO: Replace with GET /api/tournaments/:id/leaderboard (tournament service)
const MOCK_LEADERBOARDS = {
  t3:[
    {rank:1, teamName:"PREDATOR 5",    totalKills:42, totalPlacementPoints:38, totalPoints:80, prizeWon:25000, matches:[{matchNumber:1,position:1,kills:8,totalPoints:20},{matchNumber:2,position:2,kills:7,totalPoints:16},{matchNumber:3,position:1,kills:11,totalPoints:23},{matchNumber:4,position:2,kills:9,totalPoints:18},{matchNumber:5,position:3,kills:7,totalPoints:15}]},
    {rank:2, teamName:"ALPHA SQUAD",   totalKills:36, totalPlacementPoints:32, totalPoints:68, prizeWon:15000, matches:[{matchNumber:1,position:2,kills:6,totalPoints:15},{matchNumber:2,position:1,kills:10,totalPoints:22},{matchNumber:3,position:3,kills:5,totalPoints:13},{matchNumber:4,position:4,kills:7,totalPoints:14},{matchNumber:5,position:2,kills:8,totalPoints:17}]},
    {rank:3, teamName:"GHOST UNIT",    totalKills:31, totalPlacementPoints:27, totalPoints:58, prizeWon:10000, matches:[{matchNumber:1,position:3,kills:7,totalPoints:15},{matchNumber:2,position:4,kills:6,totalPoints:13},{matchNumber:3,position:2,kills:8,totalPoints:17},{matchNumber:4,position:3,kills:5,totalPoints:13},{matchNumber:5,position:4,kills:5,totalPoints:11}]},
    {rank:4, teamName:"BLAZE FORCE",   totalKills:25, totalPlacementPoints:22, totalPoints:47, prizeWon:0,     matches:[{matchNumber:1,position:4,kills:5,totalPoints:12},{matchNumber:2,position:5,kills:4,totalPoints:10},{matchNumber:3,position:4,kills:6,totalPoints:13},{matchNumber:4,position:5,kills:5,totalPoints:11},{matchNumber:5,position:5,kills:5,totalPoints:11}]},
    {rank:5, teamName:"REAPER SQUAD",  totalKills:20, totalPlacementPoints:18, totalPoints:38, prizeWon:0,     matches:[]},
    {rank:6, teamName:"SHADOW WOLVES", totalKills:15, totalPlacementPoints:12, totalPoints:27, prizeWon:0,     matches:[]},
  ],
  t5:[
    {rank:1,teamName:"FIRE STORM",  totalKills:50, totalPlacementPoints:44, totalPoints:94, prizeWon:15000,matches:[]},
    {rank:2,teamName:"DEATH SQUAD", totalKills:38, totalPlacementPoints:36, totalPoints:74, prizeWon:10000,matches:[]},
    {rank:3,teamName:"APEX FORCE",  totalKills:29, totalPlacementPoints:25, totalPoints:54, prizeWon:5000, matches:[]},
  ],
  t8:[
    {rank:1,teamName:"ZONE KINGS",   totalKills:44, totalPlacementPoints:40, totalPoints:84, prizeWon:10000,matches:[]},
    {rank:2,teamName:"FINAL STAND",  totalKills:32, totalPlacementPoints:30, totalPoints:62, prizeWon:6000, matches:[]},
    {rank:3,teamName:"OPEN FIRE",    totalKills:25, totalPlacementPoints:22, totalPoints:47, prizeWon:4000, matches:[]},
  ],
};

const RANK_STYLE = {
  1:{ bg:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff", shadow:"0 4px 16px rgba(245,158,11,0.35)" },
  2:{ bg:"linear-gradient(135deg,#9ca3af,#6b7280)", color:"#fff", shadow:"0 4px 16px rgba(156,163,175,0.25)" },
  3:{ bg:"linear-gradient(135deg,#cd7f32,#a0522d)", color:"#fff", shadow:"0 4px 16px rgba(205,127,50,0.25)" },
};
const RANK_ICON = {1:"🥇",2:"🥈",3:"🥉"};

const fmtINR = n => `₹${n.toLocaleString("en-IN")}`;

export default function LeaderboardPage() {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [selectedTournament, setSelectedTournament] = useState(COMPLETED_TOURNAMENTS[0].id);
  const [expandedTeam, setExpandedTeam] = useState(null);

  const leaderboard = useMemo(() => MOCK_LEADERBOARDS[selectedTournament] || [], [selectedTournament]);
  const tournament  = COMPLETED_TOURNAMENTS.find(x=>x.id===selectedTournament);
  const winner      = leaderboard[0];

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'Barlow',sans-serif",transition:"background 0.4s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      <Navbar alwaysVisible />

      <div style={{maxWidth:1280,margin:"0 auto",padding:"88px 24px 64px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:32}}>
          <div>
            <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#dc2626",fontSize:11,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>
              <span style={{width:16,height:1,background:"#dc2626",display:"inline-block"}} />Tournament Results
            </span>
            <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"clamp(40px,5vw,64px)",color:t.textPrim,letterSpacing:"-0.02em",lineHeight:1}}>LEADERBOARD</h1>
          </div>

          {/* Tournament selector */}
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Select Tournament</label>
            <select value={selectedTournament} onChange={e=>{ setSelectedTournament(e.target.value); setExpandedTeam(null); }}
              style={{padding:"10px 16px",background:t.inputBg,border:`1.5px solid ${t.inputBorder}`,borderRadius:12,color:t.textPrim,fontSize:14,fontFamily:"'Barlow',sans-serif",fontWeight:600,outline:"none",cursor:"pointer",minWidth:220}}>
              {COMPLETED_TOURNAMENTS.map(x=>(
                <option key={x.id} value={x.id}>{x.title} — {x.status==="live"?"🔴 LIVE":x.date}</option>
              ))}
            </select>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div style={{textAlign:"center",padding:"80px 24px"}}>
            <p style={{fontSize:48,marginBottom:12}}>📊</p>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:t.textPrim,marginBottom:8}}>NO DATA YET</h3>
            <p style={{color:t.textSub,fontSize:15}}>Scores will appear here once matches are played.</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {leaderboard.length >= 3 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:32,maxWidth:680,margin:"0 auto 32px"}}>
                {[leaderboard[1],leaderboard[0],leaderboard[2]].map((team,i) => {
                  const displayRank = [2,1,3][i];
                  const rs = RANK_STYLE[displayRank];
                  const heights = ["160px","192px","148px"];
                  return (
                    <div key={team.teamName} style={{display:"flex",flexDirection:"column",alignItems:"center",animation:`fadeUp 0.5s ease ${i*100}ms both`}}>
                      <div style={{fontSize:32,marginBottom:8}}>{RANK_ICON[displayRank]}</div>
                      <div style={{width:"100%",background:rs.bg,borderRadius:16,padding:"20px 16px",textAlign:"center",boxShadow:rs.shadow,minHeight:heights[i],display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                        <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,color:"rgba(255,255,255,0.7)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>#{displayRank}</p>
                        <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#fff",margin:"0 0 4px",letterSpacing:"-0.01em",lineHeight:1.1}}>{team.teamName}</p>
                        <p style={{color:"rgba(255,255,255,0.85)",fontWeight:700,fontSize:20,margin:"6px 0 2px"}}>{team.totalPoints} pts</p>
                        {team.prizeWon > 0 && <p style={{color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:600}}>{fmtINR(team.prizeWon)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full leaderboard table */}
            <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,overflow:"hidden"}}>
              {/* Table header */}
              <div style={{display:"grid",gridTemplateColumns:"56px 1fr 80px 80px 80px 100px 40px",gap:0,padding:"12px 20px",background:t.surface2,borderBottom:`1px solid ${t.border}`}}>
                {["Rank","Team","Kills","Placement","Total","Prize",""].map((h,i)=>(
                  <div key={i} style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:i>1?"center":"left"}}>{h}</div>
                ))}
              </div>

              {leaderboard.map((team,i) => {
                const rs = RANK_STYLE[team.rank];
                const isExpanded = expandedTeam===team.teamName;
                return (
                  <div key={team.teamName} style={{borderBottom:`1px solid ${t.borderSub}`,animation:`fadeUp 0.45s ease ${i*60}ms both`}}>
                    {/* Row */}
                    <div
                      onClick={()=>team.matches.length>0 && setExpandedTeam(isExpanded?null:team.teamName)}
                      style={{display:"grid",gridTemplateColumns:"56px 1fr 80px 80px 80px 100px 40px",gap:0,padding:"16px 20px",alignItems:"center",cursor:team.matches.length>0?"pointer":"default",transition:"background 0.15s"}}
                      onMouseEnter={e=>{if(team.matches.length>0)e.currentTarget.style.background=dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)";}}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      {/* Rank */}
                      <div style={{display:"flex",alignItems:"center"}}>
                        {rs ? (
                          <div style={{width:36,height:36,borderRadius:10,background:rs.bg,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:rs.shadow}}>
                            <span style={{fontSize:18}}>{RANK_ICON[team.rank]}</span>
                          </div>
                        ) : (
                          <div style={{width:36,height:36,borderRadius:10,background:t.surface2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:t.textSub}}>#{team.rank}</span>
                          </div>
                        )}
                      </div>

                      {/* Team name */}
                      <div>
                        <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:t.textPrim,margin:0}}>{team.teamName}</p>
                      </div>

                      {/* Stats */}
                      <div style={{textAlign:"center"}}>
                        <p style={{fontWeight:700,fontSize:15,color:t.textPrim,margin:0}}>{team.totalKills}</p>
                        <p style={{color:t.textMuted,fontSize:11,margin:0}}>kills</p>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <p style={{fontWeight:700,fontSize:15,color:t.textPrim,margin:0}}>{team.totalPlacementPoints}</p>
                        <p style={{color:t.textMuted,fontSize:11,margin:0}}>pts</p>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:t.textPrim,margin:0}}>{team.totalPoints}</p>
                        <p style={{color:t.textMuted,fontSize:11,margin:0}}>total</p>
                      </div>

                      {/* Prize */}
                      <div style={{textAlign:"center"}}>
                        {team.prizeWon > 0
                          ? <span style={{background:"rgba(16,185,129,0.1)",color:"#10b981",fontSize:13,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{fmtINR(team.prizeWon)}</span>
                          : <span style={{color:t.textMuted,fontSize:13}}>—</span>
                        }
                      </div>

                      {/* Expand */}
                      <div style={{textAlign:"center",color:t.textMuted,fontSize:16,transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>
                        {team.matches.length>0 && "▾"}
                      </div>
                    </div>

                    {/* Expanded match breakdown */}
                    {isExpanded && team.matches.length > 0 && (
                      <div style={{background:t.surface2,borderTop:`1px solid ${t.borderSub}`,padding:"16px 20px 20px"}}>
                        <p style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Match Breakdown</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                          {team.matches.map(m=>(
                            <div key={m.matchNumber} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 16px",minWidth:120}}>
                              <p style={{color:t.textMuted,fontSize:11,fontWeight:700,margin:"0 0 6px"}}>MATCH {m.matchNumber}</p>
                              <div style={{display:"flex",gap:16}}>
                                <div style={{textAlign:"center"}}>
                                  <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:t.textPrim,margin:0}}>#{m.position}</p>
                                  <p style={{color:t.textMuted,fontSize:10,margin:0}}>place</p>
                                </div>
                                <div style={{textAlign:"center"}}>
                                  <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:t.textPrim,margin:0}}>{m.kills}</p>
                                  <p style={{color:t.textMuted,fontSize:10,margin:0}}>kills</p>
                                </div>
                                <div style={{textAlign:"center"}}>
                                  <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#dc2626",margin:0}}>{m.totalPoints}</p>
                                  <p style={{color:t.textMuted,fontSize:10,margin:0}}>pts</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Points table footnote */}
            <div style={{marginTop:24,padding:"16px 20px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <p style={{color:t.textMuted,fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",flexShrink:0}}>Scoring:</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[[1,12],[2,9],[3,8],[4,7],[5,6],[6,5],[7,4],[8,3],[9,2],[10,1]].map(([pos,pts])=>(
                  <span key={pos} style={{fontSize:12,padding:"3px 10px",background:t.surface2,borderRadius:20,color:t.textSub,fontWeight:600}}>#{pos}→{pts}pts</span>
                ))}
                <span style={{fontSize:12,padding:"3px 10px",background:"rgba(220,38,38,0.1)",borderRadius:20,color:"#dc2626",fontWeight:700}}>Kill→1pt</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
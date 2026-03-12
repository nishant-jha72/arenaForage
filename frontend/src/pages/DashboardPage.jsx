// src/pages/DashboardPage.jsx
import { useState } from "react";
import { useTheme, tokens } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

// ── Mock Data — replace with API calls ───────────────────────────────────────
const MOCK_USER = {
  id:1, name:"Nishant Jha", email:"nishant@example.com",
  profile_picture:null, emailVerified:"YES",
  created_at:"2026-01-15T00:00:00Z",
};
const MOCK_TEAM = {
  _id:"t001", name:"ALPHA SQUAD", tag:"ALPH",
  logo_url:null, leader_user_id:1,
  members:[
    {user_id:1,  username:"NishantJha",  role:"Leader"},
    {user_id:2,  username:"RahulKing",   role:"Member"},
    {user_id:3,  username:"DevPlayer",   role:"Member"},
    {user_id:4,  username:"SniperX99",   role:"Member"},
    {user_id:5,  username:"FireStorm",   role:"Member"},
  ],
};
const MOCK_NOTIFICATIONS = [
  {id:1, title:"Room Published",   message:"INFERNO CUP S3 room credentials are live. Check your email.",  type:"tournament", is_read:false, created_at:"2026-03-11T14:00:00Z"},
  {id:2, title:"Team Invite",      message:"DevPlayer has joined your team ALPHA SQUAD.",                   type:"team",       is_read:false, created_at:"2026-03-10T09:30:00Z"},
  {id:3, title:"Registration Open",message:"BLOODZONE ELITE is now open for registration.",                 type:"tournament", is_read:true,  created_at:"2026-03-09T12:00:00Z"},
  {id:4, title:"Match Complete",   message:"PHANTOM LEAGUE has ended. Check the results!",                  type:"general",    is_read:true,  created_at:"2026-03-08T20:00:00Z"},
];
const MOCK_HISTORY = [
  {id:"t001", title:"BLOODZONE S2", game:"Free Fire", status:"completed", rank:2, kills:18, totalPoints:38, prizeWon:2000, date:"2026-02-15"},
  {id:"t002", title:"PREDATOR CUP", game:"Free Fire", status:"completed", rank:1, kills:24, totalPoints:52, prizeWon:5000, date:"2026-01-28"},
  {id:"t003", title:"INFERNO OPEN", game:"Free Fire", status:"completed", rank:5, kills:10, totalPoints:21, prizeWon:0,    date:"2026-01-10"},
];

const SIDEBAR_ITEMS = [
  {id:"profile",       icon:"👤", label:"Profile"},
  {id:"team",          icon:"🤝", label:"My Team"},
  {id:"notifications", icon:"🔔", label:"Notifications"},
  {id:"history",       icon:"🏆", label:"Tournament History"},
  {id:"password",      icon:"🔒", label:"Change Password"},
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, unread, dark }) {
  const t = tokens(dark);
  return (
    <aside style={{width:240, flexShrink:0, background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:12, height:"fit-content", position:"sticky", top:88}}>
      {/* User avatar */}
      <div style={{textAlign:"center", padding:"20px 16px 16px", borderBottom:`1px solid ${t.borderSub}`, marginBottom:8}}>
        <div style={{width:64, height:64, borderRadius:"50%", background:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontSize:26, fontWeight:900, color:"#fff", fontFamily:"'Barlow Condensed',sans-serif"}}>
          {MOCK_USER.name[0]}
        </div>
        <p style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:t.textPrim, margin:0}}>{MOCK_USER.name}</p>
        <p style={{fontSize:12, color:t.textMuted, margin:"2px 0 0"}}>{MOCK_TEAM?.name ?? "No team"}</p>
      </div>

      {SIDEBAR_ITEMS.map(item => {
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => setActive(item.id)}
            style={{
              width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
              borderRadius:12, border:"none", cursor:"pointer", textAlign:"left",
              background: isActive ? "rgba(220,38,38,0.1)" : "transparent",
              color: isActive ? "#dc2626" : t.textSub,
              fontFamily:"'Barlow',sans-serif", fontWeight: isActive ? 700 : 500, fontSize:14,
              transition:"all 0.18s ease", position:"relative",
            }}
            onMouseEnter={e => { if(!isActive) e.currentTarget.style.background=dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { if(!isActive) e.currentTarget.style.background="transparent"; }}
          >
            <span style={{fontSize:17}}>{item.icon}</span>
            {item.label}
            {item.id==="notifications" && unread > 0 && (
              <span style={{marginLeft:"auto", background:"#dc2626", color:"#fff", fontSize:10, fontWeight:900, borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center"}}>
                {unread}
              </span>
            )}
          </button>
        );
      })}

      <div style={{borderTop:`1px solid ${t.borderSub}`, marginTop:8, paddingTop:8}}>
        <button
          style={{width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:12, border:"none", cursor:"pointer", background:"transparent", color:"#ef4444", fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:14, transition:"background 0.18s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.08)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          onClick={() => { /* TODO: POST /api/users/logout */ window.location.href="/"; }}
        >
          <span>🚪</span> Log Out
        </button>
      </div>
    </aside>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ dark }) {
  const t = tokens(dark);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: MOCK_USER.name, email: MOCK_USER.email });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // TODO: PATCH /api/users/profile
    await new Promise(r => setTimeout(r, 800));
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <SectionHeader icon="👤" title="Profile" sub="Manage your personal information" dark={dark} />
      <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:28}}>
        {/* Avatar */}
        <div style={{display:"flex", alignItems:"center", gap:20, marginBottom:28, paddingBottom:24, borderBottom:`1px solid ${t.borderSub}`}}>
          <div style={{width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#991b1b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, color:"#fff", fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0}}>
            {MOCK_USER.name[0]}
          </div>
          <div>
            <p style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:t.textPrim, margin:"0 0 4px"}}>{MOCK_USER.name}</p>
            <p style={{color:t.textSub, fontSize:13, margin:"0 0 8px"}}>{MOCK_USER.email}</p>
            <span style={{display:"inline-flex", alignItems:"center", gap:5, background:"rgba(16,185,129,0.1)", color:"#10b981", fontSize:11, fontWeight:700, letterSpacing:"0.08em", padding:"3px 10px", borderRadius:20}}>
              <span style={{width:6, height:6, borderRadius:"50%", background:"#10b981"}} />
              VERIFIED
            </span>
          </div>
          <button onClick={() => setEditing(e => !e)} style={{marginLeft:"auto", padding:"8px 18px", borderRadius:12, border:`1.5px solid ${t.border}`, background:"transparent", color:t.textPrim, fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#dc2626";e.currentTarget.style.color="#dc2626";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textPrim;}}
          >
            {editing ? "Cancel" : "✏️ Edit"}
          </button>
        </div>

        {/* Fields */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          {[["Full Name","name","text"],["Email","email","email"]].map(([label,key,type]) => (
            <div key={key}>
              <label style={{display:"block", fontSize:11, fontWeight:700, color:t.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6}}>{label}</label>
              {editing ? (
                <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  style={{width:"100%", padding:"10px 14px", background:t.inputBg, border:`1.5px solid #dc2626`, borderRadius:10, color:t.textPrim, fontSize:14, fontFamily:"'Barlow',sans-serif", outline:"none", boxSizing:"border-box"}} />
              ) : (
                <p style={{color:t.textPrim, fontSize:15, fontWeight:500, margin:0, padding:"10px 0"}}>{form[key]}</p>
              )}
            </div>
          ))}
          <div>
            <label style={{display:"block", fontSize:11, fontWeight:700, color:t.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6}}>Member Since</label>
            <p style={{color:t.textPrim, fontSize:15, fontWeight:500, margin:0, padding:"10px 0"}}>
              {new Date(MOCK_USER.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}
            </p>
          </div>
          <div>
            <label style={{display:"block", fontSize:11, fontWeight:700, color:t.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6}}>Team</label>
            <p style={{color:t.textPrim, fontSize:15, fontWeight:500, margin:0, padding:"10px 0"}}>{MOCK_TEAM?.name ?? "—"}</p>
          </div>
        </div>

        {editing && (
          <div style={{marginTop:20, paddingTop:20, borderTop:`1px solid ${t.borderSub}`, display:"flex", gap:12}}>
            <button onClick={handleSave} style={{padding:"10px 28px", background:"#dc2626", color:"#fff", border:"none", borderRadius:12, fontFamily:"'Barlow',sans-serif", fontWeight:900, fontSize:13, letterSpacing:"0.08em", cursor:"pointer", transition:"background 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"}
              onMouseLeave={e=>e.currentTarget.style.background="#dc2626"}
            >Save Changes</button>
          </div>
        )}
        {saved && <p style={{color:"#10b981", fontWeight:600, fontSize:13, marginTop:12}}>✅ Profile updated successfully.</p>}
      </div>
    </div>
  );
}

// ── Team Panel ────────────────────────────────────────────────────────────────
function TeamPanel({ dark }) {
  const t = tokens(dark);
  const [invite, setInvite] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  const handleInvite = async () => {
    if (!invite.trim()) return;
    // TODO: POST /api/teams/invite { username: invite }
    await new Promise(r => setTimeout(r, 600));
    setInviteMsg(`Invite sent to ${invite}`);
    setInvite("");
    setTimeout(() => setInviteMsg(""), 3000);
  };

  return (
    <div>
      <SectionHeader icon="🤝" title="My Team" sub="Manage your squad" dark={dark} />

      {MOCK_TEAM ? (
        <>
          {/* Team card */}
          <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:24, marginBottom:20}}>
            <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${t.borderSub}`}}>
              <div style={{width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#dc2626,#7f1d1d)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18}}>
                {MOCK_TEAM.tag}
              </div>
              <div>
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:t.textPrim, margin:"0 0 2px"}}>{MOCK_TEAM.name}</h3>
                <p style={{color:t.textSub, fontSize:13, margin:0}}>{MOCK_TEAM.members.length} / 5 members</p>
              </div>
            </div>

            {/* Members */}
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {MOCK_TEAM.members.map((m, i) => (
                <div key={m.user_id} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:t.surface2, borderRadius:12}}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <div style={{width:36, height:36, borderRadius:"50%", background: i===0?"#dc2626":"#3f3f46", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14}}>
                      {m.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{color:t.textPrim, fontWeight:600, fontSize:14, margin:0}}>{m.username}</p>
                      <p style={{color:t.textMuted, fontSize:11, margin:0}}>{m.role}</p>
                    </div>
                  </div>
                  {m.user_id !== MOCK_USER.id && (
                    <button style={{padding:"4px 12px", borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:"#ef4444", fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:12, cursor:"pointer"}}
                      onClick={() => { /* TODO: DELETE /api/teams/members/:userId */ }}
                    >Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite box */}
          {MOCK_TEAM.members.length < 5 && (
            <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:24}}>
              <h4 style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:t.textPrim, margin:"0 0 14px"}}>INVITE A PLAYER</h4>
              <div style={{display:"flex", gap:10}}>
                <input value={invite} onChange={e=>setInvite(e.target.value)} placeholder="Enter username"
                  style={{flex:1, padding:"11px 14px", background:t.inputBg, border:`1.5px solid ${t.inputBorder}`, borderRadius:12, color:t.textPrim, fontSize:14, fontFamily:"'Barlow',sans-serif", outline:"none"}} />
                <button onClick={handleInvite} style={{padding:"11px 24px", background:"#dc2626", color:"#fff", border:"none", borderRadius:12, fontFamily:"'Barlow',sans-serif", fontWeight:900, fontSize:13, cursor:"pointer"}}>Invite</button>
              </div>
              {inviteMsg && <p style={{color:"#10b981", fontSize:13, marginTop:8, fontWeight:500}}>✅ {inviteMsg}</p>}
            </div>
          )}
        </>
      ) : (
        <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:48, textAlign:"center"}}>
          <div style={{fontSize:48, marginBottom:12}}>🤝</div>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:t.textPrim, marginBottom:8}}>NO TEAM YET</h3>
          <p style={{color:t.textSub, fontSize:14, marginBottom:24}}>Create a team to start competing in tournaments.</p>
          <button style={{padding:"12px 32px", background:"#dc2626", color:"#fff", border:"none", borderRadius:14, fontFamily:"'Barlow',sans-serif", fontWeight:900, fontSize:14, cursor:"pointer"}}
            onClick={() => { /* TODO: POST /api/teams */ }}
          >Create Team</button>
        </div>
      )}
    </div>
  );
}

// ── Notifications Panel ───────────────────────────────────────────────────────
function NotificationsPanel({ dark, setUnread }) {
  const t = tokens(dark);
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);

  const typeIcon = { tournament:"🏆", team:"🤝", general:"📢" };

  const markAll = () => {
    // TODO: PATCH /api/users/notifications/read-all
    setNotifs(n => n.map(x => ({...x, is_read:true})));
    setUnread(0);
  };

  const markOne = (id) => {
    // TODO: PATCH /api/users/notifications/:id/read
    setNotifs(n => n.map(x => x.id===id ? {...x, is_read:true} : x));
    setUnread(u => Math.max(0, u-1));
  };

  const deleteOne = (id) => {
    // TODO: DELETE /api/users/notifications/:id
    setNotifs(n => n.filter(x => x.id!==id));
  };

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20}}>
        <SectionHeader icon="🔔" title="Notifications" sub="Your recent activity" dark={dark} noMargin />
        <button onClick={markAll} style={{fontSize:13, color:"#dc2626", fontWeight:600, background:"none", border:"none", cursor:"pointer"}}>Mark all read</button>
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {notifs.length === 0 && (
          <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:48, textAlign:"center"}}>
            <p style={{fontSize:40, marginBottom:8}}>🔕</p>
            <p style={{color:t.textSub, fontSize:15}}>No notifications yet.</p>
          </div>
        )}
        {notifs.map(n => (
          <div key={n.id} style={{background:t.surface, border:`1px solid ${n.is_read ? t.border : "#dc2626"}`, borderRadius:16, padding:"16px 18px", display:"flex", gap:14, alignItems:"flex-start", opacity: n.is_read ? 0.7 : 1, transition:"all 0.2s"}}>
            <span style={{fontSize:22, flexShrink:0, marginTop:2}}>{typeIcon[n.type]||"📢"}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:3}}>
                <p style={{fontWeight:700, fontSize:14, color:t.textPrim, margin:0}}>{n.title}</p>
                {!n.is_read && <span style={{width:7, height:7, borderRadius:"50%", background:"#dc2626", flexShrink:0}} />}
              </div>
              <p style={{color:t.textSub, fontSize:13, margin:"0 0 4px", lineHeight:1.5}}>{n.message}</p>
              <p style={{color:t.textMuted, fontSize:11, margin:0}}>{new Date(n.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
            </div>
            <div style={{display:"flex", gap:6, flexShrink:0}}>
              {!n.is_read && (
                <button onClick={() => markOne(n.id)} style={{padding:"4px 10px", borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:t.textSub, fontSize:11, fontWeight:600, cursor:"pointer"}}>Read</button>
              )}
              <button onClick={() => deleteOne(n.id)} style={{padding:"4px 10px", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"transparent", color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer"}}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tournament History ────────────────────────────────────────────────────────
function HistoryPanel({ dark }) {
  const t = tokens(dark);
  const wins   = MOCK_HISTORY.filter(h => h.rank === 1).length;
  const total  = MOCK_HISTORY.length;
  const prizes = MOCK_HISTORY.reduce((s, h) => s + h.prizeWon, 0);

  return (
    <div>
      <SectionHeader icon="🏆" title="Tournament History" sub="Your competitive record" dark={dark} />

      {/* Stats row */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20}}>
        {[
          ["Played", total, ""],
          ["Wins", wins, "🥇"],
          ["Prize Earned", `\u20B9${prizes.toLocaleString("en-IN")}`, "💰"]
        ].map(([label, val, icon]) => (
          <div
            key={label}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "18px 20px",
              textAlign: "center"
            }}
          >
            <p
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 900,
                fontSize: 28,
                color: t.textPrim,
                margin: "0 0 4px"
              }}
            >
              {icon} {val}
            </p>

            <p
              style={{
                color: t.textSub,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: 0
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* History list */}
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {MOCK_HISTORY.map(h => (
          <div
            key={h.id}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background:
                  h.rank === 1
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : h.rank <= 3
                    ? "linear-gradient(135deg,#6b7280,#4b5563)"
                    : "linear-gradient(135deg,#3f3f46,#27272a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 900,
                fontSize: 16,
                flexShrink: 0
              }}
            >
              #{h.rank}
            </div>

            <div style={{flex:1}}>
              <p
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 900,
                  fontSize: 18,
                  color: t.textPrim,
                  margin: "0 0 2px"
                }}
              >
                {h.title}
              </p>

              <p style={{color: t.textSub, fontSize: 12, margin: 0}}>
                {h.game} •{" "}
                {new Date(h.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </p>
            </div>

            <div style={{textAlign:"right"}}>
              <p style={{fontWeight:700, fontSize:14, color:t.textPrim, margin:"0 0 2px"}}>
                {h.totalPoints} pts
              </p>

              <p
                style={{
                  fontSize:12,
                  color: h.prizeWon > 0 ? "#10b981" : t.textMuted,
                  fontWeight:600,
                  margin:0
                }}
              >
                {h.prizeWon > 0
                  ? `\u20B9${h.prizeWon.toLocaleString("en-IN")}`
                  : "No prize"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Change Password Panel ─────────────────────────────────────────────────────
function PasswordPanel({ dark }) {
  const t = tokens(dark);
  const [form, setForm] = useState({ current:"", newPw:"", confirm:"" });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({...f,[k]:e.target.value}));

  const handleSubmit = async () => {
    const e = {};
    if (!form.current)              e.current = "Required";
    if (form.newPw.length < 8)      e.newPw   = "Min. 8 characters";
    if (form.newPw !== form.confirm) e.confirm  = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    // TODO: PATCH /api/users/change-password
    await new Promise(r => setTimeout(r, 800));
    setSuccess(true); setLoading(false);
    setForm({ current:"", newPw:"", confirm:"" });
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div>
      <SectionHeader icon="🔒" title="Change Password" sub="Keep your account secure" dark={dark} />
      <div style={{background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:28, maxWidth:480}}>
        {[["Current Password","current"],["New Password","newPw"],["Confirm New Password","confirm"]].map(([label,key])=>(
          <div key={key} style={{marginBottom:18}}>
            <label style={{display:"block", fontSize:11, fontWeight:700, color:t.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6}}>{label}</label>
            <input type="password" value={form[key]} onChange={set(key)}
              style={{width:"100%", padding:"11px 14px", background:t.inputBg, border:`1.5px solid ${errors[key]?"#ef4444":t.inputBorder}`, borderRadius:12, color:t.textPrim, fontSize:14, fontFamily:"'Barlow',sans-serif", outline:"none", boxSizing:"border-box"}} />
            {errors[key] && <p style={{color:"#ef4444", fontSize:12, marginTop:4}}>{errors[key]}</p>}
          </div>
        ))}
        <button onClick={handleSubmit} disabled={loading}
          style={{padding:"12px 28px", background: loading?"#9ca3af":"#dc2626", color:"#fff", border:"none", borderRadius:12, fontFamily:"'Barlow',sans-serif", fontWeight:900, fontSize:13, cursor: loading?"not-allowed":"pointer", transition:"background 0.2s"}}
          onMouseEnter={e=>{if(!loading)e.currentTarget.style.background="#b91c1c";}}
          onMouseLeave={e=>{if(!loading)e.currentTarget.style.background="#dc2626";}}
        >{loading?"Updating…":"Update Password"}</button>
        {success && <p style={{color:"#10b981", fontWeight:600, fontSize:13, marginTop:12}}>✅ Password updated successfully.</p>}
      </div>
    </div>
  );
}

// ── Section Header helper ─────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub, dark, noMargin }) {
  const t = tokens(dark);
  return (
    <div style={{marginBottom: noMargin ? 0 : 20}}>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <span style={{fontSize:22}}>{icon}</span>
        <div>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:t.textPrim, margin:0, letterSpacing:"-0.01em"}}>{title}</h2>
          {sub && <p style={{color:t.textSub, fontSize:13, margin:0}}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { dark } = useTheme();
  const t = tokens(dark);
  const [active,  setActive]  = useState("profile");
  const [unread,  setUnread]  = useState(MOCK_NOTIFICATIONS.filter(n=>!n.is_read).length);

  const panels = {
    profile:       <ProfilePanel       dark={dark} />,
    team:          <TeamPanel          dark={dark} />,
    notifications: <NotificationsPanel dark={dark} setUnread={setUnread} />,
    history:       <HistoryPanel       dark={dark} />,
    password:      <PasswordPanel      dark={dark} />,
  };

  return (
    <div style={{minHeight:"100vh", background:t.bg, fontFamily:"'Barlow',sans-serif", transition:"background 0.4s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      <Navbar alwaysVisible />

      <div style={{maxWidth:1280, margin:"0 auto", padding:"88px 24px 48px", display:"flex", gap:24, alignItems:"flex-start"}}>
        {/* Sidebar */}
        <Sidebar active={active} setActive={setActive} unread={unread} dark={dark} />

        {/* Main content */}
        <main style={{flex:1, minWidth:0}}>
          {panels[active]}
        </main>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── DESIGN TOKENS ──────────────────────────────────────────────
const C = {
  bg:       "#0d0b08",
  bg2:      "#111009",
  surface:  "#161310",
  surface2: "#1e1b17",
  border:   "rgba(240,236,224,0.07)",
  border2:  "rgba(240,236,224,0.12)",
  text:     "#f0ece0",
  text2:    "rgba(240,236,224,0.5)",
  text3:    "rgba(240,236,224,0.25)",
  green:    "#25D366",
  red:      "#c20000",
  amber:    "#ca9a04",
  accent:   "#f0ece0",
};

// ── DILO LOGO ──────────────────────────────────────────────────
function DiloLogo({ height = 20 }) {
  return (
    <svg height={height} width={height * 2.5} viewBox="80 270 640 290" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M163.5 346C209.063 346 246 386.966 246 437.5C246 488.034 209.063 529 163.5 529C117.937 529 81 488.034 81 437.5C81 386.966 117.937 346 163.5 346ZM173.5 386C162.813 386 153.349 388.087 146 395C136.068 404.343 130 420.812 130 437C130 453.188 134.568 469.157 144.5 478.5C152.5 486.025 162.813 488 173.5 488C208 483.5 219 465.167 219 437C220 406.5 199.5 388.5 173.5 386Z" fill={C.text}/>
      <path d="M254 524V272L207 276V475L218.5 509L229 524H254Z" fill={C.text}/>
      <path d="M343 351H296V524H343V351Z" fill={C.text}/>
      <path d="M346 300.5C346 315.136 334.136 327 319.5 327C304.864 327 293 315.136 293 300.5C293 285.864 304.864 274 319.5 274C334.136 274 346 285.864 346 300.5Z" fill={C.text}/>
      <path d="M385 523.5V276L431 272V523.5H385Z" fill={C.text}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M554.5 346C613.5 346 646 386.966 646 437.5C646 488.034 613.5 527.5 554.5 527.5C491 527.5 463 488.034 463 437.5C463 386.966 494 346 554.5 346ZM555.5 386C526.738 386 512 407.376 512 437.446C512 467.516 525.311 488 555.5 488C578 488 599 467.516 599 437.446C599 407.376 580.5 386 555.5 386Z" fill={C.text}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M692 471C706.359 471 718 482.641 718 497C718 511.359 706.359 523 692 523C677.641 523 666 511.359 666 497C666 482.641 677.641 471 692 471ZM692 479C682.059 479 674 487.283 674 497.5C674 507.717 682.059 516 692 516C701.941 516 710 507.717 710 497.5C710 487.283 701.941 479 692 479Z" fill={C.text}/>
    </svg>
  );
}

// ── ICONS ──────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = C.text2 }) => {
  const icons = {
    home:      <><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l9-6 9 6"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    practice:  <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    agent:     <><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l8-8"/><path d="M16 4h4v4"/></>,
    payment:   <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    coach:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    metrics:   <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    schedule:  <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    sidebar:   <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></>,
    sidein:    <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="13 8 16 12 13 16"/></>,
    chevron:   <><polyline points="9 18 15 12 9 6"/></>,
    menu:      <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    bell:      <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    check:     <><polyline points="20 6 9 17 4 12"/></>,
    play:      <><polygon points="5 3 19 12 5 21 5 3"/></>,
    book:      <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    star:      <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    send:      <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    invite:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ── SHARED COMPONENTS ──────────────────────────────────────────
const Badge = ({ children, color = C.text3, bg = "rgba(240,236,224,0.06)" }) => (
  <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, border: `1px solid ${color}33` }}>
    {children}
  </span>
);

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.text3 }}>{label}</p>
    <p style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: accent || C.text, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: C.text2 }}>{sub}</p>}
  </div>
);

const ProgressBar = ({ value, max = 100, color = C.green }) => (
  <div style={{ height: 3, background: C.border2, borderRadius: 2, overflow: "hidden" }}>
    <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
  </div>
);

const SectionHeader = ({ eyebrow, title, action }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.25rem" }}>
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>{eyebrow}</p>
      <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{title}</h2>
    </div>
    {action}
  </div>
);

const AlertDot = ({ color = C.amber }) => (
  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
);

// ── NAV CONFIG PER ROLE ─────────────────────────────────────────
const NAV = {
  student: [
    { id: "dashboard",    label: "Dashboard",     icon: "home" },
    { id: "calendario",   label: "Calendar",      icon: "calendar" },
    { id: "feedbacks",    label: "Feedbacks",     icon: "book" },
    { id: "tps",          label: "TPS",           icon: "practice" },
    { id: "dilo-student", label: "Dilo Student",  icon: "agent" },
  ],
  coach: [
    { id: "dashboard",    label: "Dashboard",     icon: "home" },
    { id: "calendario",   label: "Calendar",      icon: "calendar" },
    { id: "feedbacks",    label: "Feedbacks",     icon: "book" },
    { id: "tps",          label: "TPS",           icon: "practice" },
    { id: "dilo-coach",   label: "Dilo Coach",    icon: "agent" },
  ],
  admin: [
    { id: "dashboard",    label: "Dashboard",     icon: "home" },
    { id: "calendario",   label: "Calendar",      icon: "calendar" },
    { id: "estudiantes",  label: "Students",      icon: "users" },
    { id: "feedbacks",    label: "Feedbacks",     icon: "book" },
    { id: "tps",          label: "TPS",           icon: "practice" },
    { id: "invites",      label: "Invitations",   icon: "invite" },
    { id: "metricas",     label: "Metrics",       icon: "metrics" },
    { id: "dilo-coach",   label: "Dilo Coach",    icon: "agent" },
    { id: "dilo-student", label: "Dilo Student",  icon: "agent" },
  ],
};

// ── VIEWS ──────────────────────────────────────────────────────

// STUDENT DASHBOARD
function StudentDashboard() {
  const practicas = [
    { title: "Present Perfect — Ejercicio A", type: "text", done: true },
    { title: "Phrasal Verbs in Context", type: "video", done: true },
    { title: "Business Email Writing", type: "animated", done: false, due: "Hoy" },
    { title: "Conditional Sentences Practice", type: "text", done: false, due: "Vie 23" },
  ];
  const done = practicas.filter(p => p.done).length;

  return (
    <div style={{ maxWidth: 860, width: "100%" }}>
      {/* Next class banner */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(37,211,102,0.1)", border: `1px solid rgba(37,211,102,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="calendar" size={18} color={C.green} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green, marginBottom: 2 }}>Próxima clase</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Jueves 22 de mayo · 7:00 PM</p>
        </div>
        <Badge color={C.green} bg="rgba(37,211,102,0.08)">Grupal</Badge>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="Nivel" value="B1" sub="Intermediate" />
        <StatCard label="Prácticas" value={`${done}/${practicas.length}`} sub="Completed" accent={C.green} />
        <StatCard label="Próxima" value="Jue" sub="22 de mayo" />
      </div>

      {/* Progress */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Progreso del mes</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>{Math.round((done / practicas.length) * 100)}%</p>
        </div>
        <ProgressBar value={done} max={practicas.length} />
      </div>

      {/* Pending practices */}
      <SectionHeader eyebrow="Prácticas" title="Pending" />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {practicas.filter(p => !p.done).map((p, i) => (
          <div key={i} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.9rem", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: C.surface, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={p.type === "video" ? "play" : p.type === "animated" ? "practice" : "book"} size={15} color={C.text2} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{p.title}</p>
              <p style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.type}</p>
            </div>
            {p.due && <Badge color={p.due === "Hoy" ? C.red : C.text3} bg={p.due === "Hoy" ? "rgba(194,0,0,0.1)" : "transparent"}>{p.due}</Badge>}
            <Icon name="chevron" size={14} color={C.text3} />
          </div>
        ))}
      </div>
    </div>
  );
}

// COACH DASHBOARD
function CoachDashboard({ user }) {
  const [teamsEvents, setTeamsEvents] = useState([]);
  const [monthEvents, setMonthEvents] = useState([]);
  const [classFeedbacks, setClassFeedbacks] = useState([]);
  const [allSurveys, setAllSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState(user?.nombre || "");

  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now); monday.setDate(now.getDate() - (day===0?6:day-1)); monday.setHours(0,0,0,0);
  const saturday = new Date(monday); saturday.setDate(monday.getDate()+5); saturday.setHours(23,59,59,999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59);

  const COACHES = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
  const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  useEffect(() => {
    supabase.from("profiles").select("nombre").eq("id", user.id).single()
      .then(({ data }) => { if (data?.nombre) setCoachName(data.nombre); });

    // Week events
    const p1 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: monday.toISOString(), endDateTime: saturday.toISOString() })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []).catch(()=>[]);

    // Month events (for month total)
    const p1m = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: monthStart.toISOString(), endDateTime: monthEnd.toISOString() })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []).catch(()=>[]);

    const p2 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_CLASS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    const p3 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_SURVEYS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    Promise.all([p1,p1m,p2,p3]).then(([ev,evm,cf,sv]) => {
      setTeamsEvents(ev);
      setMonthEvents(evm);
      setClassFeedbacks(cf);
      setAllSurveys(sv);
      setLoading(false);
    });
  }, []);

  const myClasses = teamsEvents.filter(ev => ev.coach === coachName);
  const myMonthClasses = monthEvents.filter(ev => ev.coach === coachName);

  // Feedback due = classes without a feedback entry
  const getMissingFbs = (classList) => classList.filter(ev => {
    const evHour = ev.date.getHours();
    const ampm = evHour >= 12 ? "PM" : "AM";
    const h12 = evHour % 12 || 12;
    const timeStr = `${h12}:${ev.date.getMinutes().toString().padStart(2,"0")} ${ampm}`;
    return !classFeedbacks.some(fb => {
      if (fb.coach !== coachName) return false;
      if (!fb.fecha) return false;
      const raw = fb.fecha.split(",")[0].trim();
      const parts = raw.split("/");
      if (parts.length < 3) return false;
      const [d,m,y] = parts;
      if (`${+d}/${+m}/${+y}` !== `${ev.date.getDate()}/${ev.date.getMonth()+1}/${ev.date.getFullYear()}`) return false;
      return (fb.hora_clase||"").trim().toUpperCase() === timeStr.toUpperCase();
    });
  });

  const missingFbs = getMissingFbs(myClasses);
  const missingMonthFbs = getMissingFbs(myMonthClasses);

  // Ranking
  const getRating = (coach) => {
    const surveys = allSurveys.filter(s => s.coach === coach);
    if (!surveys.length) return 0;
    const fields = ["practica","sentimiento","gramatica","practicar_mas"];
    let sum = 0, count = 0;
    surveys.forEach(s => fields.forEach(f => { const v = +s[f]; if (v > 0) { sum += v; count++; } }));
    return count > 0 ? sum/count : 0;
  };
  const rankings = COACHES.map(c => ({ coach: c, rating: getRating(c) })).sort((a,b) => b.rating - a.rating);
  const myRank = rankings.findIndex(r => r.coach === coachName) + 1;
  const myRating = getRating(coachName);

  const today = new Date().toDateString();
  const todayClasses = myClasses.filter(ev => ev.date.toDateString() === today).sort((a,b) => a.date - b.date);

  return (
    <div style={{ maxWidth: 700, width:"100%" }}>
      <div style={{ marginBottom:"1.5rem" }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Dilo Club</p>
        <h2 style={{ fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text }}>Dashboard</h2>
      </div>

      {/* Ranking card */}
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:"1.5rem" }}>
        <div style={{ textAlign:"center", minWidth:80, flexShrink:0 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Rank</p>
          <p style={{ fontSize:"clamp(4rem,12vw,5.5rem)", fontWeight:900, letterSpacing:"-0.04em", color:C.text, lineHeight:1 }}>
            #{loading ? "—" : myRank || "—"}
          </p>
          <p style={{ fontSize:11, color:C.text3, marginTop:2 }}>of {COACHES.length} coaches</p>
        </div>
        <div style={{ width:1, height:70, background:C.border, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:8 }}>Student rating avg</p>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1, height:6, borderRadius:3, background:"rgba(240,236,224,0.06)" }}>
              <div style={{ height:"100%", width:`${(myRating/5)*100}%`, borderRadius:3, background: myRating >= 4 ? C.green : myRating >= 3 ? C.amber : C.text3, transition:"width 0.5s" }} />
            </div>
            <span style={{ fontSize:18, fontWeight:700, color:C.text, minWidth:32 }}>{myRating ? myRating.toFixed(1) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem", marginBottom:"1.25rem" }}>
        {[
          { label:"Classes this week",     value: loading?"—":myClasses.length },
          { label:"Classes this month",    value: loading?"—":myMonthClasses.length },
          { label:"Feedback due this week", value: loading?"—":missingFbs.length, accent: !loading && missingFbs.length > 0 ? C.amber : undefined },
          { label:"Feedback due this month",value: loading?"—":missingMonthFbs.length, accent: !loading && missingMonthFbs.length > 0 ? C.amber : undefined },
        ].map((s,i) => (
          <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:"1rem 1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:6 }}>{s.label}</p>
            <p style={{ fontSize:"clamp(1.8rem,6vw,2.4rem)", fontWeight:900, letterSpacing:"-0.04em", color:s.accent||C.text, lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Missing feedbacks detail */}
      {!loading && missingFbs.length > 0 && (
        <div style={{ background:"rgba(202,154,4,0.06)", border:`1px solid ${C.amber}44`, borderRadius:14, padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.amber, marginBottom:"0.6rem" }}>⚠ {missingFbs.length} feedback{missingFbs.length>1?"s":""} pending this week</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
            {missingFbs.map((ev,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:50, background:"transparent", color:C.text2, border:`1px solid ${C.border2}` }}>
                {ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} {ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today's classes */}
      {!loading && todayClasses.length > 0 && (
        <>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>Today</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {todayClasses.map((ev,i) => (
              <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${COACH_COLORS[coachName]||C.text3}`, borderRadius:12, padding:"0.75rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.text, minWidth:60 }}>
                  {ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
                </p>
                <p style={{ fontSize:12, color:C.text3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.estudiantes || ev.summary}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}



// ADMIN DASHBOARD
function AdminDashboard() {
  const [teamsEvents, setTeamsEvents] = useState([]);
  const [classFeedbacks, setClassFeedbacks] = useState([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filter — default: this month
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(() => getWeekRange().from);
  const [dateTo,   setDateTo]   = useState(() => getWeekRange().to);

  const COACHES = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
  const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  useEffect(() => {
    const from = new Date(dateFrom); from.setHours(0,0,0,0);
    const to = new Date(dateTo); to.setHours(23,59,59,999);

    setLoading(true);

    // Fetch Teams events
    const p1 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: from.toISOString(), endDateTime: to.toISOString() })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []).catch(()=>[]);

    // Fetch Class Feedbacks
    const p2 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_CLASS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    // Fetch Student Feedbacks
    const p3 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_STUDENT })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    // Fetch Surveys
    const p4 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_SURVEYS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    Promise.all([p1,p2,p3,p4]).then(([ev,cf,sf,sv]) => {
      setTeamsEvents(ev);
      // Filter sheets by date range
      const inRange = (r) => {
        if (!r.fecha) return true;
        const raw = r.fecha.split(",")[0].trim(); // "22/5/2026"
        const [d,m,y] = raw.split("/");
        const dt = new Date(+y, +m-1, +d);
        return dt >= from && dt <= to;
      };
      setClassFeedbacks(cf.filter(inRange));
      setStudentFeedbacks(sf.filter(inRange));
      setSurveys(sv.filter(inRange));
      setLoading(false);
    });
  }, [dateFrom, dateTo]);

  // Compute stats per coach
  const coachStats = COACHES.map(coach => {
    const coachSurveys = surveys.filter(r => r.coach === coach);
    const ratingFields = ["practica","sentimiento","gramatica","practicar_mas"];
    let ratingSum = 0, ratingCount = 0;
    coachSurveys.forEach(s => {
      ratingFields.forEach(f => {
        const v = +s[f];
        if (v > 0) { ratingSum += v; ratingCount++; }
      });
    });
    const rating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null;
    return {
      coach,
      classes:   teamsEvents.filter(ev => ev.coach === coach).length,
      classFb:   classFeedbacks.filter(r => r.coach === coach).length,
      studentFb: studentFeedbacks.filter(r => r.coach === coach).length,
      surveys:   coachSurveys.length,
      rating,
    };
  });

  const totals = {
    classes:   teamsEvents.length,
    classFb:   classFeedbacks.length,
    studentFb: studentFeedbacks.length,
    surveys:   surveys.length,
  };

  const maxClasses = Math.max(...coachStats.map(c => c.classes), 1);

  return (
    <div style={{ maxWidth: 900, width: "100%" }}>
      {/* Header + date filter */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", marginBottom:"1.5rem" }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Dilo Club</p>
          <h2 style={{ fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text }}>Dashboard</h2>
        </div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.45rem 0.75rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
          <span style={{ fontSize:11, color:C.text3 }}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.45rem 0.75rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
        </div>
      </div>

      {/* Top totals */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Classes", value: loading?"—":totals.classes, sub:"Teams calendar" },
          { label:"Class Feedbacks", value: loading?"—":totals.classFb, sub:"Sent by coaches" },
          { label:"Student Feedbacks", value: loading?"—":totals.studentFb, sub:"Individual notes" },
          { label:"Student Surveys", value: loading?"—":totals.surveys, sub:"Received from students" },
        ].map((s,i) => (
          <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>{s.label}</p>
            <p style={{ fontSize:"clamp(1.8rem,6vw,2.6rem)", fontWeight:900, letterSpacing:"-0.04em", color:C.text, lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11, color:C.text3, marginTop:4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-coach breakdown */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>By coach</p>
      <div style={{ overflowX:"auto", marginBottom:"1.5rem", WebkitOverflowScrolling:"touch" }}>
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", minWidth:520 }}>
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 72px 72px 72px 90px", gap:"0.5rem", padding:"0.6rem 1.25rem", borderBottom:`1px solid ${C.border}` }}>
          {["Coach","Classes","Class FB","Stud. FB","Surveys","Status"].map((h,i) => (
            <p key={i} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, textAlign:i>1?"center":"left" }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ display:"flex", gap:6, padding:"1.5rem" }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
        ) : coachStats.map((cs, i) => {
          // Find missing class feedbacks — cross Teams events vs Sheet entries
          const coachEvents = teamsEvents.filter(ev => ev.coach === cs.coach);
          const missingFbs = coachEvents.filter(ev => {
            const evDate = ev.date;
            const evHour = evDate.getHours();
            const evMin  = evDate.getMinutes();
            const ampm = evHour >= 12 ? "PM" : "AM";
            const h12  = evHour % 12 || 12;
            const timeStr = `${h12}:${evMin.toString().padStart(2,"0")} ${ampm}`;
            const dateStr = `${evDate.getDate()}/${evDate.getMonth()+1}/${evDate.getFullYear()}`;
            // A feedback exists if there's ANY entry for this coach+date+hour
            // No show (all scores = 1) is still a valid feedback
            const hasFb = classFeedbacks.some(fb => {
              if (fb.coach !== cs.coach) return false;
              if (!fb.fecha) return false;
              const raw = fb.fecha.split(",")[0].trim();
              const parts = raw.split("/");
              if (parts.length < 3) return false;
              const [d,m,y] = parts;
              const fbDate = `${+d}/${+m}/${+y}`;
              if (fbDate !== `${evDate.getDate()}/${evDate.getMonth()+1}/${evDate.getFullYear()}`) return false;
              const fbHour = (fb.hora_clase||"").trim().replace(/\s+/g," ").toUpperCase();
              const evHourStr = timeStr.toUpperCase();
              return fbHour === evHourStr;
            });
            return !hasFb;
          });
          const covered = cs.classes > 0 && missingFbs.length === 0;
          return (
            <div key={cs.coach} style={{ borderBottom: i<coachStats.length-1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 72px 72px 72px 90px", gap:"0.5rem", padding:"0.8rem 1.25rem", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:(COACH_COLORS[cs.coach]||C.text3)+"22", border:`1px solid ${(COACH_COLORS[cs.coach]||C.text3)}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:9, fontWeight:700, color:COACH_COLORS[cs.coach]||C.text3 }}>{cs.coach[0]}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{cs.coach}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(240,236,224,0.06)" }}>
                    <div style={{ height:"100%", width:`${(cs.classes/maxClasses)*100}%`, borderRadius:2, background:COACH_COLORS[cs.coach]||C.text3, transition:"width 0.4s" }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:COACH_COLORS[cs.coach]||C.text2, minWidth:20, textAlign:"right" }}>{cs.classes}</span>
                </div>
                {[cs.classFb, cs.studentFb, cs.surveys].map((v,j) => (
                  <div key={j} style={{ textAlign:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: v===0 ? C.text3 : C.text }}>{v}</span>
                  </div>
                ))}
                <div style={{ textAlign:"center" }}>
                  {cs.classes > 0 && (
                    <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:50,
                      background: "transparent",
                      color: C.text2,
                      border:`1px solid ${covered ? C.green : C.amber}`,
                      letterSpacing:"0.08em", textTransform:"uppercase"
                    }}>
                      {covered ? "complete" : `${missingFbs.length} missing`}
                    </span>
                  )}
                </div>
              </div>
              {/* Missing feedbacks detail */}
              {!covered && missingFbs.length > 0 && (
                <div style={{ padding:"0 1.25rem 0.75rem", display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
                  {missingFbs.map((ev,mi) => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const evDay = new Date(ev.date); evDay.setHours(0,0,0,0);
                    const isToday = evDay.getTime() === today.getTime();
                    const isPast  = evDay < today;
                    const label = `${ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} ${ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})} · ${ev.estudiantes?.split(",")[0] || ev.summary}`;
                    return (
                      <span key={mi} style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:50,
                        background: "rgba(240,236,224,0.04)",
                        color: C.text2,
                        border:`1px solid ${C.border2}`,
                        display:"inline-flex", alignItems:"center", gap:5
                      }}>
                        {label}
                        <span style={{fontSize:10, color:C.amber}}>⚠</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      <p style={{ fontSize:10, color:C.text3 }}>Coverage = class feedbacks submitted vs classes assigned this period</p>
    </div>
  );
}


// FEEDBACKS HUB
function FeedbacksHub({ setActive, role }) {
  const allCards = [
    { id: "send-feedback",    title: "Class Feedback",    desc: "Submit your class feedback form.", send: true },
    { id: "class-feedback",   title: "My Feedbacks",      desc: "Review your submitted class feedback.", coachOnly: true },
    { id: "class-feedback",   title: "Class Feedback",    desc: "Coach notes on each class performance.", adminOnly: true },
    { id: "student-feedback", title: "Student Feedback",  desc: "Individual student notes and next steps." },
    { id: "student-surveys",  title: "Student Surveys",   desc: "Satisfaction surveys completed by students.", adminOnly: true },
  ];
  const cards = allCards.filter(c => {
    if (c.adminOnly && role !== "admin") return false;
    if (c.coachOnly && role !== "coach") return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>Dilo Club</p>
        <h2 style={{ fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>Feedbacks</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {cards.map((card, idx) => (
          <button key={idx} onClick={() => setActive(card.id)}
            style={{
              width: "100%",
              background: card.send ? "rgba(240,236,224,0.07)" : "transparent",
              backdropFilter: card.send ? "blur(20px)" : "none",
              WebkitBackdropFilter: card.send ? "blur(20px)" : "none",
              border: `1px solid ${card.send ? "rgba(240,236,224,0.2)" : C.border}`,
              borderRadius: 16,
              padding: "0.9rem 1.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              textAlign: "left",
              WebkitTapHighlightColor: "transparent",
              boxShadow: card.send ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = card.send ? "rgba(240,236,224,0.12)" : C.surface2; }}
            onMouseLeave={e => { e.currentTarget.style.background = card.send ? "rgba(240,236,224,0.07)" : "transparent"; }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{card.title}</p>
              <p style={{ fontSize: 11, color: C.text3 }}>{card.desc}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text2, flexShrink: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {card.send ? "Send →" : "View →"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}



// Week helpers
const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0,0,0,0);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23,59,59,999);
  return {
    from: monday.toISOString().slice(0,10),
    to:   saturday.toISOString().slice(0,10),
  };
};
// ── FEEDBACK VIEWS ────────────────────────────────────────────
const COACH_RATES = {
  Ricardo:  { rate: 5100,  currency: "₡", iva: true },
  Ana:      { rate: 6018,  currency: "₡", iva: true },
  Mafer:    { rate: 3570,  currency: "₡", iva: true },
  Gabriela: { rate: 2550,  currency: "₡", iva: true },
  Jesse:    { rate: 15,    currency: "$", iva: false },
};

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk";
const EDGE_URL = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/rapid-endpoint";
const SHEET_CLASS    = "1TmxAa-dbaTgPYCZyXl91fJDIZ997-8twnbQEmVluZ6A";
const SHEET_STUDENT  = "1jwDyhxVAnj0LY5k0fs_n3eYzLorCkAMBxapFA-7SgYw";
const SHEET_SURVEYS  = "1R1n_ucN9mnky1vVYXyEFnYghaJjemzqRHQ7URv6LTUE";

const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };
const COACHES = ["All","Ana","Ricardo","Jesse","Gabriela","Mafer"];

function useSheet(sheetId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(EDGE_URL, {
      method: "POST",
      headers: { "Authorization": "Bearer "+ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "sheets", sheetId })
    })
    .then(r => r.json())
    .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
    .catch(() => setLoading(false));
  }, [sheetId]);
  return { data, loading };
}

function ScoreBar({ value, max=5, color }) {
  const pct = Math.max(0, Math.min(100, (value/max)*100));
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(240,236,224,0.08)" }}>
        <div style={{ height:"100%", width: pct+"%", borderRadius:2, background: color || C.green, transition:"width 0.4s" }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color: color || C.text2, minWidth:12, textAlign:"right" }}>{value}</span>
    </div>
  );
}

function CoachFilter({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
      {COACHES.map(c => (
        <button key={c} onClick={() => onChange(c)}
          style={{ padding:"0.35rem 0.85rem", borderRadius:50, border:`1px solid ${value===c ? (COACH_COLORS[c]||C.text2) : C.border}`,
            background: value===c ? (COACH_COLORS[c]||C.text2)+"18" : "transparent",
            color: value===c ? (COACH_COLORS[c]||C.text) : C.text3,
            fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            WebkitTapHighlightColor:"transparent" }}>
          {c}
        </button>
      ))}
    </div>
  );
}

// SEND FEEDBACK VIEW — loads class-feedback.html in iframe with coach preselected
function SendFeedbackView({ user, setActive }) {
  const coachName = user?.nombre || "";
  const [key, setKey] = useState(0); // remount iframe on "Got more?"
  const src = `https://dilo.club/class-feedback.html?coach=${encodeURIComponent(coachName)}`;

  // Listen for "Got more?" postMessage from the form
  useEffect(() => {
    const handler = (e) => {
      if (e.data === "dilo-got-more") setKey(k => k + 1);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div style={{ width:"100%", height:"calc(100dvh - 120px)", display:"flex", flexDirection:"column" }}>
      <div style={{ marginBottom:"1rem", flexShrink:0 }}>
        <BackBtn onClick={() => setActive("feedbacks")} />
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Feedbacks</p>
        <h2 style={{ fontSize:"clamp(1.1rem,2.5vw,1.5rem)", fontWeight:900, letterSpacing:"-0.02em", color:C.text }}>Class Feedback</h2>
      </div>
      <iframe
        key={key}
        src={src}
        style={{ flex:1, border:"none", borderRadius:14, background:C.surface2 }}
        title="Class Feedback Form"
      />
    </div>
  );
}

// CLASS FEEDBACK VIEW
function ClassFeedbackView({ user, role, setActive }) {
  const { data, loading } = useSheet(SHEET_CLASS);
  const [coachFilter, setCoachFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState(() => getWeekRange().from);
  const [dateTo,   setDateTo]   = useState(() => getWeekRange().to);

  // For coaches, always fetch their real nombre from profile
  useEffect(() => {
    if (role === "coach" && user?.id) {
      supabase.from("profiles").select("nombre").eq("id", user.id).single()
        .then(({ data }) => { if (data?.nombre) setCoachFilter(data.nombre); });
    }
  }, [role, user?.id]);
  const metrics = [
    { key:"proactivity", label:"Proactivity" },
    { key:"grammar",     label:"Grammar" },
    { key:"complexity",  label:"Complexity" },
    { key:"fluency",     label:"Fluency" },
  ];
  const coach = coachFilter;
  const filtered = data.filter(r => {
    if (coach !== "All" && r.coach !== coach) return false;
    if (r.fecha) {
      const raw = r.fecha.split(",")[0].trim();
      const [d,m,y] = raw.split("/");
      const dt = new Date(+y,+m-1,+d);
      const from = new Date(dateFrom); from.setHours(0,0,0,0);
      const to = new Date(dateTo); to.setHours(23,59,59,999);
      if (dt < from || dt > to) return false;
    }
    return true;
  }).slice().reverse();
  const isNoShow = r => metrics.every(m => r[m.key] === "1");

  return (
    <div style={{ maxWidth:800, width:"100%" }}>
      <div style={{ marginBottom:"1.25rem" }}>
        <BackBtn onClick={() => setActive("feedbacks")} />
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Feedbacks</p>
        <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:900, letterSpacing:"-0.02em", color:C.text, marginBottom:"1rem" }}>Class Feedback</h2>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.75rem" }}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.65rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
          <span style={{ fontSize:11, color:C.text3 }}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.65rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
        </div>
        {role !== "coach" && <CoachFilter value={coach} onChange={setCoachFilter} />}
      </div>
      {/* Showing counter — updates when coach is selected */}
      {!loading && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:50, padding:"0.3rem 0.75rem" }}>
            <span style={{ fontSize:11, color:C.text3 }}>Showing</span>
            <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{filtered.length}</span>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ display:"flex", gap:6, padding:"2rem" }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No records yet.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {filtered.map((r,i) => (
            <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${COACH_COLORS[r.coach]||C.text3}`, borderRadius:14, padding:"1rem 1.25rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                <p style={{ fontSize:12, fontWeight:700, color:COACH_COLORS[r.coach]||C.text2 }}>{r.coach}</p>
                <p style={{ fontSize:11, color:C.text3 }}>{r.hora_clase}</p>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:50, background:"rgba(240,236,224,0.06)", border:`1px solid ${C.border2}`, color:C.text3, textTransform:"uppercase", letterSpacing:"0.08em" }}>{r.tipo_clase}</span>
                <p style={{ fontSize:11, color:C.text3, marginLeft:"auto" }}>{r.fecha?.split(",")[0]}</p>
              </div>
              {r.proactivity === "1" && r.grammar === "1" && r.complexity === "1" && r.fluency === "1"
                ? <p style={{ fontSize:12, color:"#e8d07a", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>No show <span style={{fontSize:10}}>⚠</span></p>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:"0.5rem" }}>
                    {metrics.filter(m => r[m.key] !== undefined && r[m.key] !== "").map(m => (
                      <div key={m.key}>
                        <p style={{ fontSize:10, color:C.text3, marginBottom:3, letterSpacing:"0.06em", textTransform:"uppercase" }}>{m.label}</p>
                        <ScoreBar value={+r[m.key]||0} color={COACH_COLORS[r.coach] || "rgba(240,236,224,0.6)"} />
                      </div>
                    ))}
                  </div>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// STUDENT FEEDBACK VIEW
function StudentFeedbackView({ user, role, setActive }) {
  const { data, loading } = useSheet(SHEET_STUDENT);
  const [coachFilter, setCoachFilter] = useState("All");

  useEffect(() => {
    if (role === "coach" && user?.id) {
      supabase.from("profiles").select("nombre").eq("id", user.id).single()
        .then(({ data }) => { if (data?.nombre) setCoachFilter(data.nombre); });
    }
  }, [role, user?.id]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => getWeekRange().from);
  const [dateTo,   setDateTo]   = useState(() => getWeekRange().to);

  const filtered = data.filter(r => {
    if (coachFilter !== "All" && r.coach !== coachFilter) return false;
    if (search && !r.estudiante_nombre?.toLowerCase().includes(search.toLowerCase())) return false;
    if (r.fecha) {
      const raw = r.fecha.split(",")[0].trim();
      const [d,m,y] = raw.split("/");
      const dt = new Date(+y,+m-1,+d);
      const from = new Date(dateFrom); from.setHours(0,0,0,0);
      const to = new Date(dateTo); to.setHours(23,59,59,999);
      if (dt < from || dt > to) return false;
    }
    return true;
  }).slice().reverse();

  const isNoShow = r => r.nota?.toLowerCase().includes("no show") || r.nota?.toLowerCase().includes("absent");

  return (
    <div style={{ maxWidth:800, width:"100%" }}>
      <div style={{ marginBottom:"1.25rem" }}>
        <BackBtn onClick={() => setActive("feedbacks")} />
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Feedbacks</p>
        <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:900, letterSpacing:"-0.02em", color:C.text, marginBottom:"1rem" }}>Student Feedback</h2>
        <div style={{ display:"flex", gap:"0.75rem", flexDirection:"column" }}>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.65rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
            <span style={{ fontSize:11, color:C.text3 }}>→</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.65rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
          </div>
          {role !== "coach" && <CoachFilter value={coachFilter} onChange={setCoachFilter} />}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
            style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:9, padding:"0.6rem 0.9rem", fontSize:14, color:C.text, fontFamily:"inherit", outline:"none", width:"100%", maxWidth:300 }} />
        </div>
      </div>
      {loading ? (
        <div style={{ display:"flex", gap:6, padding:"2rem" }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No records.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {filtered.map((r,i) => (
            <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${isNoShow(r) ? C.amber : COACH_COLORS[r.coach]||C.text3}`, borderRadius:14, overflow:"hidden" }}>
              <button onClick={() => setExpanded(expanded===i ? null : i)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.9rem 1.1rem", background:"transparent", border:"none", cursor:"pointer", WebkitTapHighlightColor:"transparent", textAlign:"left" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                    <p style={{ fontSize:13, fontWeight:700, color: C.text }}>{r.estudiante_nombre}</p>
                    {isNoShow(r) && <span style={{ fontSize:11, fontWeight:600, color:C.amber, display:"inline-flex", alignItems:"center", gap:4 }}>No show <span style={{fontSize:10}}>⚠</span></span>}
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", marginTop:2 }}>
                    <p style={{ fontSize:11, color:COACH_COLORS[r.coach]||C.text3, fontWeight:600 }}>{r.coach}</p>
                    <p style={{ fontSize:11, color:C.text3 }}>{r.hora_clase} · {r.fecha?.split(",")[0]}</p>
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0, transform: expanded===i ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s"}}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {expanded===i && (
                <div style={{ padding:"0 1.1rem 1rem", borderTop:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:4, marginTop:"0.75rem" }}>Note</p>
                  <p style={{ fontSize:13, color:C.text2, lineHeight:1.6 }}>{r.nota || "—"}</p>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.green, marginBottom:4, marginTop:"0.75rem" }}>Next Step</p>
                  <p style={{ fontSize:13, color:C.text, lineHeight:1.6, fontWeight:500 }}>{r.next_step || "—"}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// STUDENT SURVEYS VIEW
function StudentSurveysView({ user, role, setActive }) {
  const { data, loading } = useSheet(SHEET_SURVEYS);
  const [coach, setCoach] = useState("All");
  const [dateFrom, setDateFrom] = useState(() => getWeekRange().from);
  const [dateTo, setDateTo] = useState(() => getWeekRange().to);
  const metrics = [
    { key:"practica",     label:"Practice" },
    { key:"sentimiento",  label:"Feeling" },
    { key:"gramatica",    label:"Grammar" },
    { key:"practicar_mas",label:"Practice more" },
  ];
  const filtered = data.filter(r => {
    if (coach !== "All" && r.coach !== coach) return false;
    if (r.fecha) {
      const raw = r.fecha.split(",")[0].trim();
      const [d,m,y] = raw.split("/");
      const dt = new Date(+y,+m-1,+d);
      const from = new Date(dateFrom); from.setHours(0,0,0,0);
      const to = new Date(dateTo); to.setHours(23,59,59,999);
      if (dt < from || dt > to) return false;
    }
    return true;
  }).slice().reverse();

  return (
    <div style={{ maxWidth:800, width:"100%" }}>
      <div style={{ marginBottom:"1.25rem" }}>
        <BackBtn onClick={() => setActive("feedbacks")} />
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Feedbacks</p>
        <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:900, letterSpacing:"-0.02em", color:C.text, marginBottom:"1rem" }}>Student Surveys</h2>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.75rem" }}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.65rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
          <span style={{ fontSize:11, color:C.text3 }}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.65rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
        </div>
        <CoachFilter value={coach} onChange={setCoach} />
      </div>
      {!loading && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:50, padding:"0.3rem 0.75rem" }}>
            <span style={{ fontSize:11, color:C.text3 }}>Showing</span>
            <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{filtered.length}</span>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ display:"flex", gap:6, padding:"2rem" }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No surveys yet.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {filtered.map((r,i) => (
            <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${COACH_COLORS[r.coach]||C.text3}`, borderRadius:14, padding:"1rem 1.25rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{r.nombre}</p>
                <p style={{ fontSize:11, color:COACH_COLORS[r.coach]||C.text3, fontWeight:600 }}>{r.coach}</p>
                <p style={{ fontSize:11, color:C.text3 }}>{r.hora_clase}</p>
                <p style={{ fontSize:11, color:C.text3, marginLeft:"auto" }}>{r.fecha?.split(",")[0]}</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:"0.5rem", marginBottom: r.comentario ? "0.75rem" : 0 }}>
                {metrics.map(m => (
                  <div key={m.key}>
                    <p style={{ fontSize:10, color:C.text3, marginBottom:3, letterSpacing:"0.06em", textTransform:"uppercase" }}>{m.label}</p>
                    <ScoreBar value={+r[m.key]||0} color={COACH_COLORS[r.coach] || "rgba(240,236,224,0.6)"} />
                  </div>
                ))}
              </div>
              {r.comentario && (
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"0.75rem" }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Comment</p>
                  <p style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>{r.comentario}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:C.text3, fontSize:12, fontWeight:600, padding:"0 0 1rem 0", WebkitTapHighlightColor:"transparent" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      Feedbacks
    </button>
  );
}

// ── MINI CALENDAR PICKER ──────────────────────────────────────
function MiniCalendar({ weekOffset, setWeekOffset, onClose }) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [showMonths, setShowMonths] = useState(false);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["M","T","W","T","F","S","S"];

  // Get current week's Monday
  const getCurrentWeekMonday = (offset) => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    d.setHours(0,0,0,0);
    return d;
  };

  const selectedMonday = getCurrentWeekMonday(weekOffset);

  // Build calendar days for viewMonth
  const getDays = () => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (first.getDay() + 6) % 7; // Mon=0
    const days = [];
    for (let i = 0; i < startDow; i++) {
      const d = new Date(viewYear, viewMonth, 1 - startDow + i);
      days.push({ date: d, current: false });
    }
    for (let i = 1; i <= last.getDate(); i++) {
      days.push({ date: new Date(viewYear, viewMonth, i), current: true });
    }
    while (days.length % 7 !== 0) {
      const d = new Date(viewYear, viewMonth + 1, days.length - last.getDate() - startDow + 1);
      days.push({ date: d, current: false });
    }
    return days;
  };

  const getWeekOffset = (date) => {
    const now = new Date();
    const nowMonday = new Date(now);
    const day = nowMonday.getDay();
    nowMonday.setDate(nowMonday.getDate() - (day === 0 ? 6 : day - 1));
    nowMonday.setHours(0,0,0,0);
    const clickMonday = new Date(date);
    const cday = clickMonday.getDay();
    clickMonday.setDate(clickMonday.getDate() - (cday === 0 ? 6 : cday - 1));
    clickMonday.setHours(0,0,0,0);
    return Math.round((clickMonday - nowMonday) / (7 * 24 * 60 * 60 * 1000));
  };

  const isInSelectedWeek = (date) => {
    const mon = new Date(selectedMonday);
    const sun = new Date(selectedMonday); sun.setDate(sun.getDate() + 6);
    return date >= mon && date <= sun;
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const days = getDays();

  return (
    <div style={{ display: "flex", gap: 0, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      {/* Month view */}
      <div style={{ padding: "1rem", minWidth: 240 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, cursor: "pointer" }} onClick={() => setShowMonths(true)}>
            {MONTHS[viewMonth]} {viewYear}
          </p>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }} style={{ background: "none", border: "none", color: C.text2, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>↑</button>
            <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }} style={{ background: "none", border: "none", color: C.text2, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>↓</button>
          </div>
        </div>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAYS.map((d, i) => <p key={i} style={{ fontSize: 10, fontWeight: 600, color: C.text3, textAlign: "center", padding: "2px 0" }}>{d}</p>)}
        </div>
        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {days.map((d, i) => {
            const inWeek = isInSelectedWeek(d.date);
            const isToday = d.date.toDateString() === today.toDateString();
            const offset = getWeekOffset(d.date);
            const inRange = offset >= Math.ceil((new Date(2026,0,1) - new Date()) / (7*24*60*60*1000)) &&
                           offset <= Math.floor((new Date(2026,11,31) - new Date()) / (7*24*60*60*1000));
            return (
              <div key={i} onClick={() => { if (inRange) { setWeekOffset(offset); onClose && onClose(); } }}
                style={{ padding: "3px 0", textAlign: "center", borderRadius: 4, cursor: inRange ? "pointer" : "default",
                  background: inWeek ? "rgba(240,236,224,0.12)" : "transparent",
                  borderTop: inWeek ? `1px solid ${C.border2}` : "1px solid transparent",
                  borderBottom: inWeek ? `1px solid ${C.border2}` : "1px solid transparent",
                }}>
                <span style={{ fontSize: 11, fontWeight: isToday ? 900 : 400,
                  color: isToday ? C.green : !d.current ? C.text3 : inWeek ? C.text : C.text2,
                  display: "inline-block", width: 22, height: 22, lineHeight: "22px",
                  borderRadius: "50%",
                  background: isToday ? "rgba(37,211,102,0.15)" : "transparent",
                }}>
                  {d.date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: C.border }} />

      {/* Year/Month quick nav */}
      <div style={{ padding: "1rem", minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>2026</p>
          <div style={{ display: "flex", gap: 4 }}>
            <button style={{ background: "none", border: "none", color: C.text3, cursor: "default", fontSize: 14, padding: "2px 6px" }}>↑</button>
            <button style={{ background: "none", border: "none", color: C.text3, cursor: "default", fontSize: 14, padding: "2px 6px" }}>↓</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.4rem" }}>
          {MONTHS.map((m, i) => (
            <button key={i} onClick={() => { setViewMonth(i); setViewYear(2026); }}
              style={{ padding: "0.4rem", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: viewMonth === i && viewYear === 2026 ? 700 : 400,
                background: viewMonth === i && viewYear === 2026 ? "rgba(240,236,224,0.15)" : "transparent",
                color: viewMonth === i && viewYear === 2026 ? C.text : C.text2,
              }}>{m}</button>
          ))}
        </div>
        <button onClick={() => { setWeekOffset(0); setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); onClose && onClose(); }}
          style={{ width: "100%", marginTop: "0.75rem", padding: "0.5rem", borderRadius: 8, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Today
        </button>
      </div>
    </div>
  );
}

// MASTER SCHEDULE — Microsoft Teams/Outlook Calendar
function MasterSchedule({ role, user }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [cache, setCache] = useState({}); // keyed by weekOffset
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthEvents, setMonthEvents] = useState([]);

  const events = cache[weekOffset] || [];

  const coachColors = {
    Ana:      "#f4a7b9",
    Ricardo:  "#4fc3f7",
    Jesse:    "#b7e4a0",
    Gabriela: "#ce93d8",
    Gaby:     "#ce93d8",
    Mafer:    "#1a73e8",
  };
  const URGENTE_COLOR = "#c20000";

  const coachEmails = {
    "ana@dilo.club":      "Ana",
    "ricardo@dilo.club":  "Ricardo",
    "jesse@dilo.club":    "Jesse",
    "gabriela@dilo.club": "Gabriela",
    "mafer@dilo.club":    "Mafer",
  };

  // Get week dates for current offset
  const getWeekDates = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0,0,0,0);
    return Array.from({length: 6}, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(weekOffset);
  const weekStart = new Date(weekDates[0]); weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekDates[5]); weekEnd.setHours(23,59,59,999);

  // Limit to 2026
  const MIN_OFFSET = Math.ceil((new Date(2026,0,1) - new Date()) / (7*24*60*60*1000));
  const MAX_OFFSET = Math.floor((new Date(2026,11,31) - new Date()) / (7*24*60*60*1000));

  // Fetch full month events once on mount (for coach monthly total)
  useEffect(() => {
    if (role !== "coach") return;
    const now2 = new Date();
    const mStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
    const mEnd   = new Date(now2.getFullYear(), now2.getMonth()+1, 0, 23,59,59);
    fetch(EDGE_URL, {
      method: "POST",
      headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "teams", startDateTime: mStart.toISOString(), endDateTime: mEnd.toISOString() })
    }).then(r=>r.json()).then(d => {
      if (Array.isArray(d)) {
        const coachN = user?.nombre || "";
        setMonthEvents(d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)}))
          .filter(ev => !isNaN(ev.date) && ev.coach === coachN));
      }
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    // Use cache if available
    if (cache[weekOffset] !== undefined) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const COACH_RATES = {
  Ricardo:  { rate: 5100,  currency: "₡", iva: true },
  Ana:      { rate: 6018,  currency: "₡", iva: true },
  Mafer:    { rate: 3570,  currency: "₡", iva: true },
  Gabriela: { rate: 2550,  currency: "₡", iva: true },
  Jesse:    { rate: 15,    currency: "$", iva: false },
};

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk";
    const EDGE_URL = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/rapid-endpoint";
    const fetchViaEdge = async () => {
      try {
        const startStr = weekStart.toISOString();
        const endStr = weekEnd.toISOString();
        const emails = Object.keys(coachEmails);
        const res = await fetch(EDGE_URL, {
          method: "POST",
          headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ source: "teams", startDateTime: startStr, endDateTime: endStr, coaches: emails })
        });
        const text = await res.text();
        if (!res.ok || text.includes("VCALENDAR")) return null;
        try { return JSON.parse(text); } catch(e) { return null; }
      } catch(e) { return null; }
    };

    fetchViaEdge().then(data => {
      if (data && Array.isArray(data)) {
        const evs = data.map(ev => {
          // Teams returns UTC time — convert to Costa Rica (GMT-6)
          const utcDate = new Date(ev.start);
          const crDate = new Date(utcDate.getTime() - (6 * 60 * 60 * 1000));
          return {
            uid: ev.uid || ev.summary + ev.start,
            summary: ev.summary || "Sin título",
            date: crDate,
            coach: ev.coach || "Unassigned",
            nivel: "",
            estudiantes: ev.estudiantes || "",
            urgente: false,
          };
        }).filter(ev => ev.date && !isNaN(ev.date.getTime()));
        // For coaches, filter to only their classes
        const filtered = role === "coach" && user?.nombre
          ? evs.filter(ev => ev.coach === user.nombre)
          : evs;
        setCache(c => ({ ...c, [weekOffset]: filtered }));
        setLoading(false);
      } else {
        // Fallback to Google Calendar iCal
fetch(EDGE_URL, { headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY } })
        .then(r => r.text())
        .then(text => {
          if (!text || !text.includes("VCALENDAR")) { setError("No se pudo cargar el calendario."); setLoading(false); return; }
          setCache(c => ({ ...c, [weekOffset]: parseICal(text) }));
          setLoading(false);
        })
        .catch(() => { setError("No se pudo cargar el calendario."); setLoading(false); });
      }
    });
  }, [weekOffset]);

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const hours = ["6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM"];

  const getSlot = (date, hour) => {
    const slotH = parseInt(hour);
    const isPM = hour.includes("PM") && slotH !== 12;
    const realH = isPM ? slotH + 12 : (slotH === 12 && hour.includes("PM")) ? 12 : (slotH === 12 && hour.includes("AM")) ? 0 : slotH;
    const slotMin = hour.includes(":30") ? 30 : 0;
    const weekDateStrings = new Set(weekDates.map(d => d.toDateString()));
    const matches = events.filter(ev => {
      if (!weekDateStrings.has(ev.date.toDateString())) return false;
      return ev.date.toDateString() === date.toDateString() &&
             ev.date.getHours() === realH &&
             ev.date.getMinutes() === slotMin;
    });
    const seen = new Set();
    return matches.filter(ev => {
      const key = `${ev.coach}-${ev.summary}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  };

  const activeHours = hours.filter(h => weekDates.some(d => { try { return getSlot(d, h).length > 0; } catch(e) { return false; } }));
  const today = new Date().toDateString();

  const fmt = (date) => {
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const [showCal, setShowCal] = useState(false);
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekLabel = weekDates[0].getMonth() === weekDates[5].getMonth()
    ? `${weekDates[0].getDate()}–${weekDates[5].getDate()} ${mo[weekDates[0].getMonth()]}, ${weekDates[0].getFullYear()}`
    : `${weekDates[0].getDate()} ${mo[weekDates[0].getMonth()]} – ${weekDates[5].getDate()} ${mo[weekDates[5].getMonth()]}, ${weekDates[0].getFullYear()}`;

  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", position: "relative" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>Microsoft Teams</p>
          <button onClick={() => setShowCal(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{weekLabel}</h2>
            <span style={{ fontSize: 12, color: C.text3 }}>▾</span>
          </button>
          {showCal && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50 }}>
              <MiniCalendar weekOffset={weekOffset} setWeekOffset={setWeekOffset} onClose={() => setShowCal(false)} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setWeekOffset(w => Math.max(MIN_OFFSET, w - 1))} style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>←</button>
          <button onClick={() => setWeekOffset(w => Math.min(MAX_OFFSET, w + 1))} style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>→</button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", gap: 8 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      )}

      {error && <div style={{ background: "rgba(194,0,0,0.08)", border: `1px solid rgba(194,0,0,0.2)`, borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
              <thead>
                <tr>
                  <th style={{ padding: "0.75rem 1rem", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, textAlign: "left", borderBottom: `1px solid ${C.border}`, minWidth: 72, position: "sticky", left: 0, background: C.surface2 }}>Hora</th>
                  {weekDates.map((date, i) => (
                    <th key={i} style={{ padding: "0.6rem 0.4rem", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: date.toDateString() === today ? C.green : C.text3, textAlign: "center", borderBottom: `1px solid ${C.border}`, minWidth: 90 }}>
                      <span style={{ display: "block" }}>{dayNames[i]}</span>
                      <span style={{ fontSize: 11, fontWeight: date.toDateString() === today ? 900 : 500, color: date.toDateString() === today ? C.green : C.text2 }}>{fmt(date)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeHours.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: C.text3, fontSize: 13 }}>No classes this week.</td></tr>
                ) : activeHours.map((hour, ri) => (
                  <tr key={hour} style={{ borderBottom: ri < activeHours.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "0.5rem 1rem", fontSize: 11, fontWeight: 700, color: C.text2, whiteSpace: "nowrap", position: "sticky", left: 0, background: C.surface2 }}>{hour}</td>
                    {weekDates.map((date, di) => {
                      const slots = getSlot(date, hour);
                      return (
                        <td key={di} style={{ padding: "0.3rem", textAlign: "center", verticalAlign: "middle" }}>
                          {slots.map((ev, si) => (
                            <div key={si} title={ev.summary} style={{ background: ev.urgente ? "rgba(194,0,0,0.08)" : C.surface, border: `1px solid ${(ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text3) + "55"}`, borderLeft: `3px solid ${ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text3}`, borderRadius: 8, padding: "0.35rem 0.5rem", marginBottom: si < slots.length - 1 ? 3 : 0, textAlign: "left" }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{ev.coach !== "Unassigned" ? ev.coach : ev.summary}</p>
                              {ev.nivel && <p style={{ fontSize: 9, fontWeight: 600, color: C.text2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{ev.nivel}</p>}
                              {ev.estudiantes && <p style={{ fontSize: 9, color: C.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{ev.estudiantes}</p>}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Stats below calendar */}
      {!loading && !error && events.length > 0 && (() => {
        const coachColors = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };
        const coaches = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
        const weekEvents = events;
        const isCoachView = role === "coach";
        const coachN = user?.nombre || "";
        const rateInfo = COACH_RATES[coachN];

        // Month total for coach
        const now2 = new Date();

        const fmtMoney = (count) => {
          if (!rateInfo) return "—";
          const total = count * rateInfo.rate;
          return rateInfo.currency === "$"
            ? `$${total.toLocaleString()}`
            : `₡${total.toLocaleString("es-CR")}`;
        };

        if (isCoachView) {
          const myWeekEvents = weekEvents.filter(ev => ev.coach === coachN);
          return (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <StatCard label="Week" value={`${weekDates[0].getDate()}/${weekDates[0].getMonth()+1}`} sub={weekDates[0].getFullYear()} />
                <StatCard label="Number of classes" value={myWeekEvents.length} sub="This week" />
                <StatCard label="Week total" value={fmtMoney(myWeekEvents.length)} sub={rateInfo?.iva ? "IVA included" : "+ IVA"} />
                <StatCard label="Month total" value={fmtMoney(monthEvents.length)} sub={now2.toLocaleString("en",{month:"long"})} />
              </div>
            </div>
          );
        }

        // Admin view
        const unassigned = weekEvents.filter(ev => !ev.coach || ev.coach === "Unassigned" || ev.coach === "Sin asignar");
        const byCoach = {};
        coaches.forEach(c => { byCoach[c] = weekEvents.filter(ev => ev.coach === c).length; });
        const maxVal = Math.max(...Object.values(byCoach), 1);

        return (
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <StatCard label="Total classes" value={weekEvents.length} sub="This week" />
              <StatCard label="Unassigned" value={unassigned.length} sub="This week" accent={unassigned.length > 0 ? C.red : C.green} />
              <StatCard label="Active coaches" value={coaches.filter(c => byCoach[c] > 0).length} sub="This week" />
              <StatCard label="Week" value={`${weekDates[0].getDate()}/${weekDates[0].getMonth()+1}`} sub={weekDates[0].getFullYear()} />
            </div>
            <SectionHeader eyebrow="This week" title="Classes by coach" />
            <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              {coaches.filter(c => byCoach[c] > 0).map((coach, i, arr) => (
                <div key={coach} style={{ padding: "0.8rem 1.25rem", display: "flex", alignItems: "center", gap: "0.9rem", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: coachColors[coach]+"22", border: `1px solid ${coachColors[coach]}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: coachColors[coach] }}>{coach[0]}</p>
                  </div>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{coach}</p>
                  <div style={{ flex: 2, margin: "0 0.75rem" }}>
                    <ProgressBar value={byCoach[coach]} max={maxVal} color={coachColors[coach]} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: coachColors[coach], minWidth: 20, textAlign: "right" }}>{byCoach[coach]}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// PLACEHOLDER VIEW
function PlaceholderView({ title, desc, icon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} color={C.text3} />
      </div>
      <div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: C.text, marginBottom: 6 }}>{title}</h2>
        <p style={{ fontSize: 13, color: C.text3, maxWidth: 300 }}>{desc}</p>
      </div>
      <Badge color={C.text3}>Próximamente</Badge>
    </div>
  );
}

// INVITATIONS VIEW
function InvitesView({ user }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ rol: "student", plan: "Group" });
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  const loadCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCodes(); }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = () => Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
    return `DILO-${seg()}-${seg()}`;
  };

  const createCode = async () => {
    setCreating(true);
    setError(null);
    const code = generateCode();
    const { error: err } = await supabase.from("invite_codes").insert({
      code,
      rol: form.rol,
      plan: form.rol === "student" ? form.plan : null,
      creado_por: user?.id || null,
    });
    if (err) { setError("Error creating code. Please try again."); }
    else { await loadCodes(); }
    setCreating(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyWhatsApp = (code, rol, plan) => {
    const planText = plan ? ` — Plan: ${plan}` : "";
    const msg = `Hola! Te comparto tu código de acceso a la plataforma de Dilo Club 🎓\n\nCódigo: *${code}*\nRol: ${rol === "student" ? "Student" : "Coach"}${planText}\n\nIngresá a: dilo.club/app → "Crear cuenta con código"`;
    navigator.clipboard.writeText(msg);
    setCopied(code + "_wa");
    setTimeout(() => setCopied(null), 2000);
  };

  const WA_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  const COPY_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  const BTN = { padding: "0.35rem 0.85rem", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "transparent" };

  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      {/* Create new code */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: "1rem" }}>New code</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {["student","coach"].map(r => (
            <button key={r} onClick={() => setForm(f => ({ ...f, rol: r }))}
              style={{ ...BTN, border: `1px solid ${form.rol === r ? C.text : C.border2}`, color: form.rol === r ? C.text : C.text3 }}>
              {r === "student" ? "Student" : "Coach"}
            </button>
          ))}
          {form.rol === "student" && ["Group","Private"].map(p => (
            <button key={p} onClick={() => setForm(f => ({ ...f, plan: p }))}
              style={{ ...BTN, border: `1px solid ${form.plan === p ? C.text : C.border2}`, color: form.plan === p ? C.text : C.text3 }}>
              {p}
            </button>
          ))}
          <button onClick={createCode} disabled={creating}
            style={{ ...BTN, border: "none", background: creating ? C.surface2 : "#f0ece0", color: creating ? C.text3 : "#0d0b08", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: creating ? "default" : "pointer" }}>
            {creating ? "Generating..." : "Generate code"}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: C.red, marginTop: "0.75rem" }}>{error}</p>}
      </div>

      {/* Codes list */}
      <SectionHeader eyebrow="Invitations" title="Generated codes" />

      {loading ? (
        <div style={{ display: "flex", gap: 6, padding: "1rem" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      ) : codes.length === 0 ? (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.text3 }}>No codes generated yet.</p>
        </div>
      ) : (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {codes.map((c, i) => (
            <div key={c.id} style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: i < codes.length-1 ? `1px solid ${C.border}` : "none", opacity: c.usado ? 0.5 : 1 }}>
              {/* Code + copy inline */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 170 }}>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, fontWeight: 700, color: c.usado ? C.text3 : C.text, letterSpacing: "0.1em" }}>{c.code}</p>
                {!c.usado && (
                  <button onClick={() => copyCode(c.code)} title="Copy"
                    style={{ width: 24, height: 24, borderRadius: "50%", border: `1px solid ${C.border2}`, background: "transparent", color: copied===c.code ? C.green : C.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {copied===c.code ? <span style={{fontSize:10}}>✓</span> : COPY_ICON}
                  </button>
                )}
              </div>
              {/* Badges — white border only */}
              <div style={{ display: "flex", gap: "0.35rem", flex: 1, flexWrap: "wrap" }}>
                {[c.rol === "student" ? "Student" : c.rol === "coach" ? "Coach" : "Admin", c.plan, c.usado ? "Used" : "Available"].filter(Boolean).map((label, li) => (
                  <span key={li} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 50, background: "transparent", color: C.text2, border: `1px solid ${C.border2}` }}>
                    {label}
                  </span>
                ))}
              </div>
              {/* WhatsApp */}
              {!c.usado && (
                <button onClick={() => copyWhatsApp(c.code, c.rol, c.plan)}
                  style={{ height: 26, padding: "0 0.6rem", borderRadius: 50, border: `1px solid ${C.green}55`, background: "transparent", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {WA_ICON}
                  <span>{copied===c.code+"_wa" ? "✓" : "WhatsApp"}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// PROFILE VIEW
function ProfileView({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", teams_email: "" });

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            teams_email: data.teams_email || data.email || ""
          });
        }
        setLoading(false);
      });
  }, [user.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        teams_email: form.teams_email.trim()
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      console.error("Profile save error:", error);
      alert("Error al guardar: " + error.message);
    } else {
      setProfile(p => ({ ...p, nombre: form.nombre, apellido: form.apellido, teams_email: form.teams_email }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const planColors = { Group: "#4fc3f7", Private: "#ce93d8", Grupal: "#4fc3f7", Privada: "#ce93d8" };
  const rolLabels = { student: "Student", coach: "Coach", admin: "Admin" };
  const rolColors = { student: C.green, coach: C.amber, admin: C.red };

  if (loading) return (
    <div style={{ display: "flex", gap: 6, padding: "2rem" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, width: "100%", overflowX: "hidden" }}>
      {/* Avatar + info */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{(form.nombre || user.email)[0].toUpperCase()}</p>
        </div>
        <div>
          <p style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{form.nombre} {form.apellido}</p>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, background: `${rolColors[profile?.rol]||C.text3}18`, color: rolColors[profile?.rol]||C.text3, border: `1px solid ${rolColors[profile?.rol]||C.text3}44` }}>
              {rolLabels[profile?.rol] || profile?.rol}
            </span>
            {profile?.plan && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, background: `${planColors[profile.plan]||C.text3}18`, color: planColors[profile.plan]||C.text3, border: `1px solid ${planColors[profile.plan]||C.text3}44` }}>
                {profile.plan}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "0.75rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: "1.25rem" }}>Personal information</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "First name", key: "nombre", placeholder: "Tu nombre" },
            { label: "Last name", key: "apellido", placeholder: "Tu apellido" },
          ].map(f => (
            <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Email de login</label>
          <input value={user.email} disabled
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text3, fontFamily: "inherit", outline: "none", cursor: "not-allowed" }} />
          <p style={{ fontSize: 11, color: C.text3 }}>Este correo no se puede cambiar — es el que usás para entrar a la app.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Email de Teams</label>
          <input value={form.teams_email} onChange={e => setForm(v => ({ ...v, teams_email: e.target.value }))}
            placeholder="The email where Teams invitations are sent"
            style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
          <p style={{ fontSize: 11, color: C.text3 }}>We use this email to show your classes in the calendar.</p>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ width: "100%", padding: "0.85rem", borderRadius: 50, border: "none", background: saved ? C.green : saving ? C.surface2 : C.accent, color: saved ? "#fff" : saving ? C.text3 : C.bg, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: saving ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
        {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

// ── USER MENU ─────────────────────────────────────────────────
function UserMenu({ user, collapsed, isMobile, onLogout, setActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (user?.nombre || user?.email || "U")[0].toUpperCase();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, []);

  return (
    <div ref={ref} style={{ padding: "0.5rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
      {/* Popup menu */}
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "0.5rem", right: "0.5rem", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100 }}>
          {[
            { label: "My Profile", icon: "coach", action: () => { setActive("perfil"); setOpen(false); } },
            { label: "Notifications", icon: "bell", action: () => setOpen(false) },
            { label: "Sign out", icon: "logout", action: () => { setOpen(false); onLogout(); }, danger: false },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "none", background: "transparent", cursor: "pointer", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon name={item.icon} size={15} color={item.danger ? C.red : C.text2} />
              <span style={{ fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text2 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: collapsed && !isMobile ? "0.5rem" : "0.6rem 0.75rem", borderRadius: 10, border: "none", background: open ? C.surface2 : "transparent", cursor: "pointer", justifyContent: collapsed && !isMobile ? "center" : "flex-start", WebkitTapHighlightColor: "transparent", transition: "background 0.15s" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>{initial}</span>
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p style={{ fontSize: 10, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || ""}
            </p>
          </div>
        )}
        {(!collapsed || isMobile) && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────
function Sidebar({ role, user, active, setActive, collapsed, setCollapsed, isMobile, onLogout }) {
  const navItems = NAV[role] || NAV.student;
  const roleLabels = { student: "Student", coach: "Coach", admin: "Admin" };
  const roleColors = { student: C.text2, coach: C.green, admin: C.amber };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div onClick={() => setCollapsed(true)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
      )}

      <aside style={{
        position: isMobile ? "fixed" : "relative",
        left: isMobile ? (collapsed ? "-280px" : "0") : "0",
        top: 0, bottom: 0,
        width: isMobile ? 260 : (collapsed ? 56 : 240),
        minWidth: isMobile ? 260 : (collapsed ? 56 : 240),
        background: C.bg2,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        zIndex: 50,
        flexShrink: 0,
        WebkitOverflowScrolling: "touch",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {/* Logo area */}
        <div style={{ padding: "0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: `1px solid ${C.border}`, minHeight: 57, flexShrink: 0, justifyContent: collapsed && !isMobile ? "center" : "flex-start" }}>
          {(!collapsed || isMobile) && <div style={{ flexShrink: 0, paddingLeft: "0.25rem" }}><DiloLogo height={22} /></div>}
          {(!collapsed || isMobile) && <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, padding: "2px 7px", borderRadius: 50, border: `1px solid ${C.border2}` }}>{roleLabels[role]}</span>
          </div>}
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>
            <Icon name={collapsed && !isMobile ? "sidein" : "sidebar"} size={16} color={C.text2} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.5rem", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
          {navItems.map(item => {
            const isActive = active === item.id || item.children?.some(c => c.id === active);
            const isChildActive = item.children?.some(c => c.id === active);
            const [expanded, setExpanded] = React.useState(isChildActive);
            return (
              <div key={item.id}>
                <button onClick={() => {
                    if (item.children) { setExpanded(e => !e); }
                    else { setActive(item.id); if (isMobile) setCollapsed(true); }
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: isMobile ? "0.85rem 0.75rem" : "0.65rem 0.75rem",
                    minHeight: isMobile ? 48 : 38,
                    borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2,
                    background: isActive && !item.children ? C.surface2 : "transparent",
                    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                    transition: "background 0.15s",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surface; }}
                  onMouseLeave={e => { if (!(isActive && !item.children)) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ flexShrink: 0 }}>
                    <Icon name={item.icon} size={16} color={isActive ? C.text : C.text2} />
                  </span>
                  {(!collapsed || isMobile) && (
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.text : C.text2, whiteSpace: "nowrap", overflow: "hidden", flex: 1 }}>
                      {item.label}
                    </span>
                  )}
                  {(!collapsed || isMobile) && item.children && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  )}
                  {(!collapsed || isMobile) && !item.children && isActive && (
                    <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                  )}
                </button>
                {/* Children */}
                {item.children && expanded && (!collapsed || isMobile) && (
                  <div style={{ paddingLeft: "2rem", marginBottom: 4 }}>
                    {item.children.map(child => {
                      const isChildAct = active === child.id;
                      return (
                        <button key={child.id} onClick={() => { setActive(child.id); if (isMobile) setCollapsed(true); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem 0.75rem", minHeight: 36,
                            borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 1,
                            background: isChildAct ? C.surface2 : "transparent",
                            WebkitTapHighlightColor: "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (!isChildAct) e.currentTarget.style.background = C.surface; }}
                          onMouseLeave={e => { if (!isChildAct) e.currentTarget.style.background = "transparent"; }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: isChildAct ? C.green : C.text3, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: isChildAct ? 600 : 400, color: isChildAct ? C.text : C.text2 }}>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User menu bottom */}
        <UserMenu user={user} collapsed={collapsed} isMobile={isMobile} onLogout={onLogout} setActive={setActive} />
      </aside>
    </>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
export default function DiloApp({ user, onLogout = () => {} }) {
  const role = user?.role || "student";
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);


  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const renderView = () => {
    if (active === "dashboard") {
      if (role === "admin") return <AdminDashboard />;
      if (role === "coach") return <CoachDashboard user={user} />;
      return <StudentDashboard />;
    }
    if (active === "feedbacks")          return <FeedbacksHub setActive={setActive} role={role} />;
    if (active === "dilo-coach")         return <AgentView mode="coach" />;
    if (active === "send-feedback")      return <SendFeedbackView user={user} setActive={setActive} />;
    if (active === "class-feedback")    return <ClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-feedback")  return <StudentFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-surveys")   return <StudentSurveysView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-student") return <AgentView mode="student" />;
    if (active === "calendario")   return <MasterSchedule role={role} user={user} />;
    if (active === "invites")      return <InvitesView user={user} />;
    if (active === "perfil")       return <ProfileView user={user} />;
    const placeholders = {
      tps:          { title: "TPS", desc: "Training & Practices — content assigned by your coach.", icon: "practice" },
      feedbacks:    { title: "Feedbacks", desc: "Class feedback history.", icon: "book" },
      estudiantes:  { title: "Students", desc: "Student management, profiles and assignments.", icon: "users" },
      metricas:     { title: "Metrics", desc: "Detailed academy analytics.", icon: "metrics" },
    };
    const p = placeholders[active];
    return p ? <PlaceholderView {...p} /> : <PlaceholderView title="Coming soon" desc="This section is under development." icon="home" />;
  };

  return (
    <div style={{ display: "flex", height: "100dvh", background: C.bg, color: C.text, fontFamily: "'Archivo', sans-serif", overflow: "hidden" }}>
<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0b08; }
        ::-webkit-scrollbar { display: none; }
        input { background: transparent; color: #f0ece0; font-family: 'Archivo', sans-serif; }
        input::placeholder { color: rgba(240,236,224,0.25); }
        input:focus { outline: none; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>

      <Sidebar role={role} user={user} active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} onLogout={onLogout} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ minHeight: 57, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 1rem", paddingTop: "env(safe-area-inset-top)", gap: "0.75rem", flexShrink: 0, background: C.bg }}>
          {isMobile && (
            <button onClick={() => setCollapsed(c => !c)}
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 6, flexShrink: 0, WebkitTapHighlightColor: "transparent", touchAction: "manipulation", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <Icon name="sidebar" size={18} color={C.text2} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              {NAV[role]?.flatMap(n => n.children ? [n, ...n.children] : [n]).find(n => n.id === active)?.label || "Dashboard"}
            </p>
          </div>

        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.25rem", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}

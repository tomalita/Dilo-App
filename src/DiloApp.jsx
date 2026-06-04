import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import kFoundation from "./knowledge/diloclub_foundation_v5.1.md?raw";
import kA1        from "./knowledge/diloclub_a1_v5.1.md?raw";
import kA2        from "./knowledge/diloclub_a2_v5.1.md?raw";
import kB1        from "./knowledge/diloclub_b1_v5.1.md?raw";
import kB2        from "./knowledge/diloclub_b2_v5.1.md?raw";
import kC1        from "./knowledge/diloclub_c1_v5.1.md?raw";
import kC2        from "./knowledge/diloclub_c2_v5.1.md?raw";

const DILO_KNOWLEDGE = [kFoundation, kA1, kA2, kB1, kB2, kC1, kC2].join("\n\n---\n\n");

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
  green:    "#6DB58A",
  red:      "#c20000",
  amber:    "#ca9a04",
  accent:   "#f0ece0",
};

// ── GLASS CARD STYLE ───────────────────────────────────────────
const CARD = {
  background: "rgba(240,236,224,0.06)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(240,236,224,0.12)",
  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
};
const SEL = (extra = {}) => ({
  background: "#1e1b17", border: "1px solid rgba(240,236,224,0.12)",
  borderRadius: 8, padding: "0.4rem 0.65rem", color: "rgba(240,236,224,0.5)",
  fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", ...extra,
});
const ROL_LABELS = { student: "Student", coach: "Coach", admin: "Admin" };
const ROL_COLORS = { student: C.green, coach: C.text2, admin: C.text2 };

// ── DILO LOGO ──────────────────────────────────────────────────
// The ring/circle at the end of the Dilo wordmark, used as a styled period
function DiloDot({ size = "0.28em" }) {
  return (
    <svg width={size} height={size} viewBox="663 468 58 58" fill="none"
      style={{ display:"inline-block", verticalAlign:"baseline", marginLeft:"0.1em", overflow:"visible" }}>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M692 471C706.359 471 718 482.641 718 497C718 511.359 706.359 523 692 523C677.641 523 666 511.359 666 497C666 482.641 677.641 471 692 471ZM692 479C682.059 479 674 487.283 674 497.5C674 507.717 682.059 516 692 516C701.941 516 710 507.717 710 497.5C710 487.283 701.941 479 692 479Z"
        fill="currentColor" />
    </svg>
  );
}

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
  <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
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
    { id: "feedbacks",    label: "FeedbackHub",   icon: "book" },
    { id: "tps",          label: "TPS",           icon: "practice" },
    { id: "dilo-student", label: "Dilo Student",  icon: "agent" },
  ],
  coach: [
    { id: "dashboard",    label: "Dashboard",     icon: "home" },
    { id: "calendario",   label: "Calendar",      icon: "calendar" },
    { id: "my-hours",     label: "My Hours",      icon: "metrics" },
    { id: "feedbacks",    label: "FeedbackHub",   icon: "book" },
    { id: "tps",          label: "TPS",           icon: "practice" },
    { id: "dilo-coach",   label: "Dilo Coach",    icon: "agent" },
  ],
  admin: [
    { id: "dashboard",    label: "Dashboard",     icon: "home" },
    { id: "calendario",   label: "Calendar",      icon: "calendar" },
    { id: "estudiantes",  label: "Attendance",    icon: "users" },
    { id: "coaches",      label: "Coaches",       icon: "coach" },
    { id: "students",     label: "Students",      icon: "payment" },
    { id: "feedbacks",    label: "FeedbackHub",   icon: "book" },
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
      <div style={{ ...CARD, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(109,181,138,0.1)", border: `1px solid rgba(109,181,138,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="calendar" size={18} color={C.green} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green, marginBottom: 2 }}>Next Class</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Jueves 22 de mayo · 7:00 PM</p>
        </div>
        <Badge color={C.green} bg="rgba(109,181,138,0.08)">Grupal</Badge>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="Nivel" value="B1" sub="Intermediate" />
        <StatCard label="Prácticas" value={`${done}/${practicas.length}`} sub="Completed" accent={C.green} />
        <StatCard label="Próxima" value="Jue" sub="22 de mayo" />
      </div>

      {/* Progress */}
      <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
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
          <div key={i} style={{ ...CARD, borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.9rem", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(240,236,224,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(240,236,224,0.06)"}>
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
  const [weekOffset,     setWeekOffset]     = useState(0);
  const [weekCache,      setWeekCache]      = useState({});  // offset → events[]
  const [weekLoading,    setWeekLoading]    = useState(true);
  const [monthEvents,    setMonthEvents]    = useState([]);
  const [classFeedbacks, setClassFeedbacks] = useState([]);
  const [allSurveys,     setAllSurveys]     = useState([]);
  const [studentNotes,   setStudentNotes]   = useState([]);
  const [loading,        setLoading]        = useState(true); // month + sheets initial load
  const [coachName,      setCoachName]      = useState(user?.nombre || "");

  const now = new Date();

  // Compute monday/saturday for any week offset
  const getWeekBounds = (offset) => {
    const d = new Date(now);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day===0?6:day-1) + offset*7);
    monday.setHours(0,0,0,0);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate()+5);
    saturday.setHours(23,59,59,999);
    return { monday, saturday };
  };

  const { monday, saturday } = getWeekBounds(weekOffset);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59);

  const COACHES      = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
  const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  const fetchTeams = (start, end) => fetch(EDGE_URL, {
    method:"POST",
    headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
    body: JSON.stringify({ source:"teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() })
  }).then(r=>r.json()).then(d =>
    Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []
  ).catch(()=>[]);

  // Mount: coach name + month events + sheets (once only)
  useEffect(() => {
    delete _schedCache[0];
    _monthCache = null;
    _dashboardFetch = null;

    const coachNamePromise = supabase.from("profiles").select("nombre").eq("id", user.id).single()
      .then(({ data }) => data?.nombre || user?.nombre || "");

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

    const p4 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_STUDENT })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    Promise.all([p2, p3, p4, coachNamePromise]).then(([cf, sv, sn, resolvedName]) => {
      if (resolvedName) setCoachName(resolvedName);
      setClassFeedbacks(cf);
      setAllSurveys(sv);
      setStudentNotes(sn);
      setLoading(false);
    });

    // Week 0 (current) → then month → then week -1 (previous, for student notes cross-check)
    const { monday: m0, saturday: s0 }     = getWeekBounds(0);
    const { monday: mPrev, saturday: sPrev } = getWeekBounds(-1);
    const p1week = fetchTeams(m0, s0);
    _dashboardFetch = p1week;
    p1week.then(evs => {
      if (evs.length > 0) {
        _schedCache[0] = evs.map(ev => ({ uid: ev.uid||(ev.summary||"")+(ev.start||""), summary: ev.summary||"Sin título", date: ev.date, coach: ev.coach||"Unassigned", nivel:"", estudiantes:ev.estudiantes||"", joinUrl:ev.joinUrl||null, urgente:false }));
        setWeekCache(c => ({ ...c, 0: evs }));
        setWeekLoading(false);
        // Month events (sequential to avoid throttling)
        return fetchTeams(monthStart, monthEnd).then(evm => {
          if (evm.length > 0) { _monthCache = evm; setMonthEvents(evm); }
          // Previous week — needed for student notes cross-check with Teams calendar
          return fetchTeams(mPrev, sPrev).then(prevEvs => {
            if (prevEvs.length > 0) setWeekCache(c => ({ ...c, [-1]: prevEvs }));
          });
        });
      } else {
        setWeekLoading(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Week navigation: fetch new week when offset changes (skip 0, already fetched above)
  useEffect(() => {
    if (weekOffset === 0) return; // handled in mount effect
    if (weekCache[weekOffset] !== undefined) { setWeekLoading(false); return; }
    setWeekLoading(true);
    const { monday: wMon, saturday: wSat } = getWeekBounds(weekOffset);
    fetchTeams(wMon, wSat).then(evs => {
      setWeekCache(c => ({ ...c, [weekOffset]: evs }));
      setWeekLoading(false);
    });
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const teamsEvents = weekCache[weekOffset] || [];

  // Filtro explícito por rango de fechas + coach
  const myClasses      = teamsEvents.filter(ev => ev.coach === coachName && ev.date >= monday && ev.date <= saturday);
  const myMonthClasses = monthEvents.filter(ev => ev.coach === coachName && ev.date >= monthStart && ev.date <= monthEnd);

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
    const fields = ["practica","sentimiento","gramatica"];
    let sum = 0, count = 0;
    surveys.forEach(s => fields.forEach(f => { const v = +s[f]; if (v > 0) { sum += v; count++; } }));
    return count > 0 ? sum/count : 0;
  };
  const rankings = COACHES.map(c => ({ coach: c, rating: getRating(c) })).sort((a,b) => b.rating - a.rating);
  const myRank = rankings.findIndex(r => r.coach === coachName) + 1;
  const myRating = getRating(coachName);

  const nowTs = new Date();
  const nextClass = myClasses.filter(ev => ev.date >= nowTs).sort((a,b) => a.date - b.date)[0] || null;

  // Pre-class briefing — algorithm:
  //   1. Pool current week's PAST events + all of previous week.
  //   2. Find the most recent past occurrence of this same class
  //      (same coach + same hour:minute + same summary).
  //   3. Cross-check that event's date against student notes sheet
  //      (col A fecha + col C hora_clase).
  //   4. Show those notes to the coach.
  //   This way a Wednesday class correctly shows Monday's notes (same week)
  //   instead of last Wednesday's notes.

  // All student notes — NO coach filter here.
  // We match by the PAST EVENT's coach (col B), not the current coach.
  // This handles coach rotation: Ricardo sees Ana's notes for Adriana's last session.
  const allStudentNotes = studentNotes
    .filter(r => r.fecha && r.estudiante_nombre && r.coach && r.hora_clase)
    .map(r => {
      const raw = r.fecha.split(",")[0].trim();
      const [d, m, y] = raw.split("/");
      return { ...r, _date: new Date(+y, +m - 1, +d) };
    })
    .filter(r => !isNaN(r._date) && r._date < nowTs);

  let prevFeedback = [];
  if (nextClass) {
    const nextHour    = nextClass.date.getHours();
    const nextMin     = nextClass.date.getMinutes();
    const nextSummary = (nextClass.summary || "").toLowerCase().trim();

    // Pool: current week (past only) + previous week — deduplicated by uid
    const seen = new Set();
    const pool = [
      ...(weekCache[0]  || []).filter(ev => ev.date < nowTs),
      ...(weekCache[-1] || []),
    ].filter(ev => {
      const key = ev.uid || (ev.summary + ev.date.toISOString());
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const nextSeriesId = nextClass.seriesId || null;

    const bySeriesId = nextSeriesId
      ? pool.filter(ev => ev.seriesId && ev.seriesId === nextSeriesId)
           .sort((a, b) => b.date - a.date)
      : [];

    const matchesTime = ev =>
      ev.coach === coachName &&
      ev.date.getHours()   === nextHour &&
      ev.date.getMinutes() === nextMin;

    const matchesSummary = ev => {
      const evSum = (ev.summary || "").toLowerCase().trim();
      return !nextSummary || !evSum || evSum === nextSummary;
    };

    const candidates =
      bySeriesId.length > 0 ? bySeriesId :
      (() => {
        const ts = pool.filter(ev => matchesTime(ev) && matchesSummary(ev)).sort((a,b) => b.date - a.date);
        return ts.length > 0 ? ts : pool.filter(matchesTime).sort((a,b) => b.date - a.date);
      })();

    // Walk most-recent → oldest; stop at the first event that has notes.
    //
    // Zero-error cross-check:
    //   col B (coach)      = past Teams event's coach         — not the current coach
    //   col C (hora_clase) = past Teams event's hour:minute   — disambiguates same-day classes
    //   col A (fecha date) = within [ev.date, ev.date + 2d]  — col A is SUBMISSION timestamp,
    //                        coaches may submit same day or up to 2 days after the class
    for (const ev of candidates) {
      const evDay    = new Date(ev.date); evDay.setHours(0, 0, 0, 0);
      const evDayEnd = new Date(evDay);   evDayEnd.setDate(evDay.getDate() + 2);

      const evH  = ev.date.getHours();
      const evM  = ev.date.getMinutes();
      const ampm = evH >= 12 ? "PM" : "AM";
      const h12  = evH % 12 || 12;
      const tStr = `${h12}:${evM.toString().padStart(2,"0")} ${ampm}`;

      const notes = allStudentNotes.filter(r =>
        r._date >= evDay &&
        r._date <= evDayEnd &&
        r.coach.split(" ")[0] === ev.coach &&
        (r.hora_clase||"").trim().replace(/\s+/g," ").toUpperCase() === tStr.toUpperCase()
      );
      if (notes.length > 0) { prevFeedback = notes; break; }
    }
  }

  return (
    <div style={{ maxWidth: 700, width:"100%" }}>
      {/* Next Class banner */}
      {loading ? null : nextClass ? (
        <div style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem" }}>
          {/* Top row */}
          <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="calendar" size={18} color={C.green} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:C.green, marginBottom:2 }}>Next Class</p>
              <p style={{ fontSize:15, fontWeight:700, color:C.text }}>
                {nextClass.date.toLocaleDateString("en",{weekday:"short",month:"long",day:"numeric"})} · {nextClass.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
              </p>
              {nextClass.estudiantes && <p style={{ fontSize:11, color:C.text3, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nextClass.estudiantes}</p>}
            </div>
          </div>
          {/* Last session feedback reference */}
          {prevFeedback.length > 0 && (
            <div style={{ borderTop:`1px solid ${C.border}`, marginTop:"1rem", paddingTop:"1rem" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:"0.65rem" }}>
                Last session · Student notes
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {prevFeedback.map((r, i) => (
                  <div key={i} style={{ borderLeft:`2px solid ${C.border2}`, paddingLeft:"0.75rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.35rem", flexWrap:"wrap" }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.text }}>{r.estudiante_nombre}</p>
                      <p style={{ fontSize:10, color:C.text3 }}>{r.fecha?.split(",")[0]}</p>
                    </div>
                    {r.nota && (
                      <p style={{ fontSize:11, color:C.text2, lineHeight:1.5, marginBottom: r.next_step ? "0.3rem" : 0 }}>
                        <span style={{ color:C.text3, fontWeight:600 }}>Note: </span>{r.nota}
                      </p>
                    )}
                    {r.next_step && (
                      <p style={{ fontSize:11, color:C.green, lineHeight:1.5, fontWeight:500 }}>
                        <span style={{ color:C.text3, fontWeight:600 }}>Next step: </span>
                        <span style={{ color:C.text }}>{r.next_step}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !loading && (
        <div style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"rgba(240,236,224,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="calendar" size={18} color={C.text3} />
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:2 }}>Next Class</p>
            <p style={{ fontSize:13, color:C.text3 }}>No upcoming classes this week.</p>
          </div>
        </div>
      )}

      {/* Ranking card */}
      <div style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:"1.5rem" }}>
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

      {/* Week navigator + stats grid */}
      <div style={{ marginBottom:"1.25rem" }}>
        {/* Week nav header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.6rem" }}>
          <button onClick={() => setWeekOffset(o => o-1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1 }}>‹</button>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
              color: weekOffset===0 ? C.green : C.text3, margin:0 }}>
              {weekOffset===0 ? "This week" : weekOffset===1 ? "Next week" : weekOffset===-1 ? "Last week" : weekOffset > 0 ? `+${weekOffset} weeks` : `${weekOffset} weeks`}
            </p>
            <p style={{ fontSize:11, color:C.text3, margin:0 }}>
              {monday.toLocaleDateString("en",{month:"short",day:"numeric"})} – {saturday.toLocaleDateString("en",{month:"short",day:"numeric"})}
            </p>
          </div>
          <button onClick={() => setWeekOffset(o => o+1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1 }}>›</button>
        </div>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"0.75rem" }}>
          {[
            { label:"Classes this week",      value: weekLoading?"—":myClasses.length },
            { label:"Classes this month",     value: loading?"—":myMonthClasses.length },
            { label:"Feedback due this week", value: weekLoading?"—":missingFbs.length, accent: !weekLoading && missingFbs.length > 0 ? C.amber : undefined },
            { label:"Feedback due this month",value: loading?"—":missingMonthFbs.length, accent: !loading && missingMonthFbs.length > 0 ? C.amber : undefined },
          ].map((s,i) => (
            <div key={i} style={{ ...CARD, borderRadius:14, padding:"1rem 1.25rem" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:6 }}>{s.label}</p>
              <p style={{ fontSize:"clamp(1.8rem,6vw,2.4rem)", fontWeight:900, letterSpacing:"-0.04em", color:s.accent||C.text, lineHeight:1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing feedbacks detail */}
      {!weekLoading && missingFbs.length > 0 && (
        <div style={{ background:"rgba(202,154,4,0.06)", border:`1px solid ${C.amber}44`, borderRadius:14, padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.amber, marginBottom:"0.6rem" }}>⚠ {missingFbs.length} feedback{missingFbs.length>1?"s":""} pending</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
            {missingFbs.map((ev,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:50, background:"transparent", color:C.text2, border:`1px solid ${C.border2}` }}>
                {ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} {ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
              </span>
            ))}
          </div>
        </div>
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
  const [weekOffset, setWeekOffset] = useState(0);

  // Derive the date range from the week offset
  const getOffsetWeek = (offset) => {
    const d = new Date();
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    mon.setHours(0,0,0,0);
    const sat = new Date(mon); sat.setDate(mon.getDate() + 5);
    return { mon, sat,
      from: mon.toISOString().slice(0,10),
      to:   sat.toISOString().slice(0,10) };
  };
  const { mon: weekMon, sat: weekSat, from: dateFrom, to: dateTo } = getOffsetWeek(weekOffset);
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekLabel = weekMon.getMonth() === weekSat.getMonth()
    ? `${weekMon.getDate()} – ${weekSat.getDate()} ${mo[weekMon.getMonth()]} ${weekMon.getFullYear()}`
    : `${weekMon.getDate()} ${mo[weekMon.getMonth()]} – ${weekSat.getDate()} ${mo[weekSat.getMonth()]} ${weekSat.getFullYear()}`;

  const COACHES = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
  const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  useEffect(() => {
    const from = new Date(dateFrom); from.setHours(0,0,0,0);
    const to = new Date(dateTo); to.setHours(23,59,59,999);

    setLoading(true);

    // Fetch Teams events — also seeds _schedCache[0] when range matches current week
    const _nowA = new Date(); const _dayA = _nowA.getDay();
    const _monA = new Date(_nowA); _monA.setDate(_nowA.getDate()-(_dayA===0?6:_dayA-1)); _monA.setHours(0,0,0,0);
    const p1 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: from.toISOString(), endDateTime: to.toISOString() })
    }).then(r=>r.json()).then(d => {
      const evs = Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : [];
      if (from.getTime() === _monA.getTime()) {
        _schedCache[0] = evs.map(ev => ({ uid: ev.uid||(ev.summary||"")+(ev.start||""), summary: ev.summary||"Sin título", date: ev.date, coach: ev.coach||"Unassigned", nivel:"", estudiantes:ev.estudiantes||"", joinUrl:ev.joinUrl||null, urgente:false }));
      }
      return evs;
    }).catch(()=>[]);

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
    const ratingFields = ["practica","sentimiento","gramatica"];
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

  const adminNow = new Date();
  const nextAdminClass = teamsEvents.filter(ev => ev.date >= adminNow).sort((a,b) => a.date - b.date)[0] || null;
  const ADMIN_COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  return (
    <div style={{ maxWidth: 900, width: "100%" }}>
      {/* Week navigator */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.5rem" }}>
        <button onClick={() => setWeekOffset(w => w - 1)}
          style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.75rem", color:C.text2, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>←</button>
        <span style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:C.text }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)}
          style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.4rem 0.75rem", color:C.text2, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>→</button>
      </div>

      {/* Next Class banner */}
      {loading ? null : nextAdminClass ? (
        <div style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="calendar" size={18} color={C.green} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:C.green, marginBottom:2 }}>Next Class</p>
            <p style={{ fontSize:15, fontWeight:700, color:C.text }}>
              {nextAdminClass.date.toLocaleDateString("en",{weekday:"short",month:"long",day:"numeric"})} · {nextAdminClass.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
            </p>
            {nextAdminClass.coach && (
              <p style={{ fontSize:11, marginTop:2, color: ADMIN_COACH_COLORS[nextAdminClass.coach] || C.text3 }}>{nextAdminClass.coach}{nextAdminClass.estudiantes ? ` · ${nextAdminClass.estudiantes}` : ""}</p>
            )}
          </div>
        </div>
      ) : !loading && (
        <div style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"rgba(240,236,224,0.06)", border:`1px solid ${C.border2}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="calendar" size={18} color={C.text2} />
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:2 }}>Next Class</p>
            <p style={{ fontSize:13, color:C.text3 }}>No upcoming classes in this date range.</p>
          </div>
        </div>
      )}

      {/* Top totals */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"0.75rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Classes", value: loading?"—":totals.classes, sub:"Teams calendar" },
          { label:"Class Feedbacks", value: loading?"—":totals.classFb, sub:"Sent by coaches" },
          { label:"Student Feedbacks", value: loading?"—":totals.studentFb, sub:"Individual notes" },
          { label:"Student Surveys", value: loading?"—":totals.surveys, sub:"Received from students" },
        ].map((s,i) => (
          <div key={i} style={{ ...CARD, borderRadius:16, padding:"1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>{s.label}</p>
            <p style={{ fontSize:"clamp(1.8rem,6vw,2.6rem)", fontWeight:900, letterSpacing:"-0.04em", color:C.text, lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11, color:C.text3, marginTop:4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-coach breakdown */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>By coach</p>
      <div style={{ ...CARD, borderRadius:14, overflowX:"auto", WebkitOverflowScrolling:"touch", marginBottom:"1.5rem" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:520 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Coach","Classes","Class FB","Stud. FB","Surveys","Rating","Status"].map((h,i) => (
                <th key={i} style={{ padding:"0.6rem 1rem", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, textAlign:i===0?"left":"center", background:C.surface2, whiteSpace:"nowrap", position: i===0 ? "sticky" : "static", left: i===0 ? 0 : "auto" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:"1.5rem" }}>
                <div style={{ display:"flex", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
              </td></tr>
            ) : coachStats.map((cs, i) => {
              const coachEvents = teamsEvents.filter(ev => ev.coach === cs.coach);
              const missingFbs = coachEvents.filter(ev => {
                const evDate = ev.date;
                const evHour = evDate.getHours();
                const evMin  = evDate.getMinutes();
                const ampm = evHour >= 12 ? "PM" : "AM";
                const h12  = evHour % 12 || 12;
                const timeStr = `${h12}:${evMin.toString().padStart(2,"0")} ${ampm}`;
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
                  return fbHour === timeStr.toUpperCase();
                });
                return !hasFb;
              });
              const covered = cs.classes > 0 && missingFbs.length === 0;
              return (
                <React.Fragment key={cs.coach}>
                  <tr style={{ borderBottom: (!covered && missingFbs.length > 0) ? "none" : (i<coachStats.length-1 ? `1px solid ${C.border}` : "none") }}>
                    <td style={{ padding:"0.8rem 1rem", position:"sticky", left:0, background:C.surface2, whiteSpace:"nowrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", background:(COACH_COLORS[cs.coach]||C.text3)+"22", border:`1px solid ${(COACH_COLORS[cs.coach]||C.text3)}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:COACH_COLORS[cs.coach]||C.text3 }}>{cs.coach[0]}</span>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{cs.coach}</span>
                      </div>
                    </td>
                    <td style={{ padding:"0.8rem 1rem", minWidth:120 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(240,236,224,0.06)" }}>
                          <div style={{ height:"100%", width:`${(cs.classes/maxClasses)*100}%`, borderRadius:2, background:COACH_COLORS[cs.coach]||C.text3, transition:"width 0.4s" }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:COACH_COLORS[cs.coach]||C.text2, minWidth:18, textAlign:"right" }}>{cs.classes}</span>
                      </div>
                    </td>
                    {[cs.classFb, cs.studentFb, cs.surveys].map((v,j) => (
                      <td key={j} style={{ padding:"0.8rem 1rem", textAlign:"center" }}>
                        <span style={{ fontSize:13, fontWeight:700, color: v===0 ? C.text3 : C.text }}>{v}</span>
                      </td>
                    ))}
                    <td style={{ padding:"0.8rem 1rem", textAlign:"center" }}>
                      {cs.rating ? (
                        <span style={{ fontSize:13, fontWeight:800, color: +cs.rating >= 4 ? C.green : +cs.rating >= 3 ? C.amber : C.red }}>{cs.rating}</span>
                      ) : (
                        <span style={{ fontSize:12, color:C.text3 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding:"0.8rem 1rem", textAlign:"center" }}>
                      {cs.classes > 0 && (
                        <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:50, background:"transparent", color:C.text2, border:`1px solid ${covered ? C.green : C.amber}`, letterSpacing:"0.08em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                          {covered ? "complete" : `${missingFbs.length} missing`}
                        </span>
                      )}
                    </td>
                  </tr>
                  {!covered && missingFbs.length > 0 && (
                    <tr style={{ borderBottom: i<coachStats.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <td colSpan={7} style={{ padding:"0 1rem 0.75rem" }}>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
                          {missingFbs.map((ev,mi) => {
                            const label = `${ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} ${ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})} · ${ev.estudiantes?.split(",")[0] || ev.summary}`;
                            return (
                              <span key={mi} style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:50, background:"rgba(240,236,224,0.04)", color:C.text2, border:`1px solid ${C.border2}`, display:"inline-flex", alignItems:"center", gap:5 }}>
                                {label}<span style={{fontSize:10, color:C.amber}}>⚠</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:10, color:C.text3 }}>Coverage = class feedbacks submitted vs classes assigned this period</p>
    </div>
  );
}


// FEEDBACKS HUB
function FeedbacksHub({ setActive, role }) {
  const allCards = [
    { id: "send-feedback",    title: "Class Feedback",    desc: "Submit your class feedback form.", send: true },
    { id: "class-feedback",   title: "Class Feedbacks Sent", desc: "Review your submitted class feedback.", coachOnly: true },
    { id: "class-feedback",   title: "Class Feedback",    desc: "Coach notes on each class performance.", adminOnly: true },
    { id: "student-feedback", title: "Student Feedback Sent", desc: "Individual student notes and next steps." },
    { id: "student-surveys",  title: "Student Surveys",   desc: "Satisfaction surveys completed by students.", adminOnly: true },
  ];
  const cards = allCards.filter(c => {
    if (c.adminOnly && role !== "admin") return false;
    if (c.coachOnly && role !== "coach") return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
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
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, flexShrink: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
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
  Ricardo:  { rate: 8000,  currency: "₡", iva: true },
  Ana:      { rate: 6018,  currency: "₡", iva: true },
  Mafer:    { rate: 3570,  currency: "₡", iva: true },
  Gabriela: { rate: 2550,  currency: "₡", iva: true },
  Jesse:    { rate: 15,    currency: "$", iva: false },
};

const ANON_KEY       = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk";
const EDGE_URL       = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/rapid-endpoint";
const ATTENDANCE_URL = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/attendance-endpoint";
// Module-level caches — survive component unmount/remount (navigation between tabs)
const _schedCache = {};     // weekOffset → events[]  (shared: Dashboard seeds, Schedule reads)
let   _monthCache = null;   // coach month events      (shared: Dashboard seeds, Schedule reads)
let   _dashboardFetch = null; // in-flight p1combined promise — Calendar awaits this instead of a parallel Graph call
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
    .then(d => {
      const rows = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.rows) ? d.rows : [];
      setData(rows);
      setLoading(false);
    })
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

// SEND FEEDBACK VIEW — native React form
const FB_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyLBlGEBHi8MOLI0w3tWtwE3qWsW9CpmgMiUnWuphUSo5HPyNsii5pZACmsClCP9a45/exec';
const FB_COACHES = ["Ana","Gabriela","Jesse","Mafer","Ricardo"];
const FB_HOURS   = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const FB_MINS    = ['00','30'];
const FB_AMPM    = ['AM','PM'];

const fbSection = { background:"rgba(240,236,224,0.06)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"1px solid rgba(240,236,224,0.12)", borderRadius:14, padding:"1.25rem", marginBottom:"0.75rem" };
const fbLabel   = { display:"block", fontSize:12, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", color:"rgba(240,236,224,0.5)", marginBottom:"0.4rem" };
const fbInput   = { width:"100%", background:"rgba(240,236,224,0.05)", border:"1px solid rgba(240,236,224,0.07)", borderRadius:9, color:"#f0ece0", fontFamily:"inherit", fontSize:16, fontWeight:500, padding:"0.75rem 0.9rem", outline:"none", appearance:"none", WebkitAppearance:"none", display:"block" };
const fbErr     = { fontSize:11, color:"#c20000", marginTop:"0.3rem" };
const fbLine    = { height:1, background:"rgba(240,236,224,0.07)", margin:"1.25rem 0" };

function FbScaleInput({ name, label, hint, value, onSelect, error }) {
  return (
    <div style={{ marginBottom:"1.25rem" }}>
      <label style={fbLabel}>{label} <span style={{ color:"#c20000" }}>*</span></label>
      {hint && <p style={{ fontSize:11, color:"rgba(240,236,224,0.25)", marginBottom:"0.5rem", lineHeight:1.5 }}>{hint}</p>}
      <div style={{ display:"flex", gap:"0.35rem" }}>
        {[1,2,3,4,5].map(v => {
          const active = value !== null && v <= value;
          const bc = active ? (value <= 2 ? "#c20000" : value <= 4 ? "#ca9a04" : "#6DB58A") : "rgba(240,236,224,0.1)";
          return (
            <button key={v} type="button" onClick={() => onSelect(name, v)}
              style={{ flex:1, aspectRatio:"1", background:"rgba(240,236,224,0.04)", border:`1px solid ${bc}`, borderRadius:8, fontSize:14, fontWeight:active?600:400, color:active?"#f0ece0":"rgba(240,236,224,0.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", minHeight:44, fontFamily:"inherit", transition:"all 0.15s" }}>
              {v}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.3rem" }}>
        <span style={{ fontSize:10, color:"rgba(240,236,224,0.25)" }}>Needs work</span>
        <span style={{ fontSize:10, color:"rgba(240,236,224,0.25)" }}>Excellent</span>
      </div>
      {error && <p style={fbErr}>Select a value.</p>}
    </div>
  );
}

function FbStudentCard({ idx, isWorkshop, isPrivate, data, onChange, onRemove, errors }) {
  const lbl = isWorkshop ? `Attendee ${idx+1}` : isPrivate ? "Student" : `Student ${idx+1}`;
  return (
    <div style={{ background:"rgba(240,236,224,0.06)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"1px solid rgba(240,236,224,0.12)", borderRadius:14, padding:"1.25rem", marginBottom:"0.75rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"#6DB58A" }}>{lbl}</span>
        {!isPrivate && (
          <button type="button" onClick={onRemove}
            style={{ background:"transparent", border:"1px solid rgba(240,236,224,0.07)", color:"rgba(240,236,224,0.3)", borderRadius:50, fontSize:11, fontWeight:600, padding:"0.35rem 0.75rem", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#c20000";e.currentTarget.style.color="#c20000";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(240,236,224,0.07)";e.currentTarget.style.color="rgba(240,236,224,0.3)";}}>
            Remove
          </button>
        )}
      </div>
      <div style={{ marginBottom:"1rem" }}>
        <label style={fbLabel}>{isWorkshop?"Attendee":"Student"} name <span style={{color:"#c20000"}}>*</span></label>
        <input type="text" value={data.name} onChange={e => onChange(idx,"name",e.target.value)} placeholder="Full name..."
          style={{ ...fbInput, borderColor: errors[`${idx}_name`] ? "#c20000" : "rgba(240,236,224,0.07)" }} />
        {errors[`${idx}_name`] && <p style={fbErr}>Enter the name.</p>}
      </div>
      <div style={{ marginBottom: isWorkshop ? 0 : "1rem" }}>
        <label style={fbLabel}>{isWorkshop?"Observation":"Performance note"} <span style={{color:"#c20000"}}>*</span></label>
        <textarea value={data.nota} onChange={e => onChange(idx,"nota",e.target.value)}
          placeholder={isWorkshop?"Quick observation for this attendee...":"Describe their performance — what stood out, what struggled..."}
          style={{ ...fbInput, resize:"none", minHeight:80, lineHeight:1.5, borderColor: errors[`${idx}_nota`] ? "#c20000" : "rgba(240,236,224,0.07)" }} />
        {errors[`${idx}_nota`] && <p style={fbErr}>Add a note.</p>}
      </div>
      {!isWorkshop && (
        <div>
          <label style={fbLabel}>Next Step <span style={{color:"#c20000"}}>*</span></label>
          <textarea value={data.nextstep} onChange={e => onChange(idx,"nextstep",e.target.value)}
            placeholder="One specific, actionable thing to work on next session..."
            style={{ ...fbInput, resize:"none", minHeight:80, lineHeight:1.5, borderColor: errors[`${idx}_nextstep`] ? "#c20000" : "rgba(240,236,224,0.07)" }} />
          {errors[`${idx}_nextstep`] && <p style={fbErr}>Add a next step.</p>}
        </div>
      )}
    </div>
  );
}

function SendFeedbackView({ user, setActive }) {
  const coachName = user?.nombre || "";

  const [coach,       setCoach]      = useState(coachName);
  const [hora,        setHora]       = useState("");
  const [tipo,        setTipo]       = useState("");
  const [tipoTaller,  setTipoTaller] = useState("");
  const [scores,      setScores]     = useState({ proactividad:null, gramatica:null, complejidad:null, fluidez:null, participacion:null, comprension:null });
  const [notaTaller,  setNotaTaller] = useState("");
  const [students,    setStudents]   = useState([]);
  const [attendees,   setAttendees]  = useState([]);
  const [errors,      setErrors]     = useState({});
  const [submitting,  setSubmitting] = useState(false);
  const [submitted,   setSubmitted]  = useState(false);

  const [tpOpen, setTpOpen] = useState(false);
  const [tpH,    setTpH]    = useState(5);
  const [tpM,    setTpM]    = useState(0);
  const [tpAP,   setTpAP]   = useState(0);
  const drumH  = useRef(null);
  const drumM  = useRef(null);
  const drumAP = useRef(null);
  const timers = useRef({});

  // Inject webkit scrollbar-hide style
  useEffect(() => {
    if (!document.getElementById("dilo-drum-css")) {
      const s = document.createElement("style");
      s.id = "dilo-drum-css";
      s.textContent = ".fb-drum::-webkit-scrollbar{display:none}";
      document.head.appendChild(s);
    }
  }, []);

  // Scroll drums to selected position when picker opens
  useEffect(() => {
    if (!tpOpen) return;
    const t = setTimeout(() => {
      if (drumH.current)  drumH.current.scrollTop  = tpH  * 44;
      if (drumM.current)  drumM.current.scrollTop  = tpM  * 44;
      if (drumAP.current) drumAP.current.scrollTop = tpAP * 44;
    }, 50);
    return () => clearTimeout(t);
  }, [tpOpen]);

  function changeTipo(t) {
    setTipo(t);
    setErrors(e => ({ ...e, tipo:false }));
    setStudents(t === "Group" || t === "Private" ? [{ name:"", nota:"", nextstep:"" }] : []);
    setAttendees(t === "Workshop" ? [{ name:"", nota:"" }] : []);
  }

  function handleDrumScroll(col) {
    const ref = col==="h" ? drumH : col==="m" ? drumM : drumAP;
    const items = col==="h" ? FB_HOURS : col==="m" ? FB_MINS : FB_AMPM;
    const set   = col==="h" ? setTpH   : col==="m" ? setTpM  : setTpAP;
    clearTimeout(timers.current[col]);
    timers.current[col] = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.max(0, Math.min(items.length-1, Math.round(ref.current.scrollTop / 44)));
      ref.current.scrollTo({ top: idx*44, behavior:"smooth" });
      set(idx);
    }, 80);
  }

  function snapDrum(col, idx) {
    const ref = col==="h" ? drumH : col==="m" ? drumM : drumAP;
    const set  = col==="h" ? setTpH : col==="m" ? setTpM : setTpAP;
    if (ref.current) ref.current.scrollTo({ top: idx*44, behavior:"smooth" });
    set(idx);
  }

  function confirmTime() {
    setHora(FB_HOURS[tpH] + ":" + FB_MINS[tpM] + " " + FB_AMPM[tpAP]);
    setErrors(e => ({ ...e, hora:false }));
    setTpOpen(false);
  }

  function setScore(name, val) {
    setScores(s => ({ ...s, [name]:val }));
    setErrors(e => ({ ...e, [name]:false }));
  }

  function updateList(setter, idx, field, val) {
    setter(a => a.map((x,i) => i===idx ? { ...x, [field]:val } : x));
    setErrors(e => ({ ...e, [`${idx}_${field}`]:false }));
  }

  function validate() {
    const errs = {};
    if (!coach) errs.coach = true;
    if (!hora)  errs.hora  = true;
    if (!tipo)  errs.tipo  = true;
    if (tipo === "Workshop" && !tipoTaller.trim()) errs.tipoTaller = true;
    if (tipo === "Group" || tipo === "Private")
      ["proactividad","gramatica","complejidad","fluidez"].forEach(n => { if (!scores[n]) errs[n] = true; });
    if (tipo === "Workshop") {
      ["participacion","comprension"].forEach(n => { if (!scores[n]) errs[n] = true; });
      if (!notaTaller.trim()) errs.notaTaller = true;
    }
    (tipo === "Workshop" ? attendees : students).forEach((s,i) => {
      if (!s.name.trim())    errs[`${i}_name`]     = true;
      if (!s.nota.trim())    errs[`${i}_nota`]     = true;
      if (tipo !== "Workshop" && !s.nextstep.trim()) errs[`${i}_nextstep`] = true;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const isTaller = tipo === "Workshop";
    const stu = isTaller ? attendees : students;
    const payload = {
      fecha: new Date().toLocaleString("es-CR", { timeZone:"America/Costa_Rica" }),
      coach, hora_clase:hora, tipo_clase:tipo,
      tipo_taller: isTaller ? tipoTaller : "",
      proactividad:  scores.proactividad  || "",
      gramatica:     scores.gramatica     || "",
      complejidad:   scores.complejidad   || "",
      fluidez:       scores.fluidez       || "",
      participacion: scores.participacion || "",
      comprension:   scores.comprension   || "",
      nota_taller:   isTaller ? notaTaller : "",
      total_estudiantes: stu.length,
    };
    const max = isTaller ? 12 : 3;
    for (let i = 0; i < max; i++) {
      const s = stu[i] || {};
      payload[`estudiante_${i+1}_nombre`] = s.name  || "";
      payload[`estudiante_${i+1}_nota`]   = s.nota  || "";
      if (!isTaller) payload[`estudiante_${i+1}_nextstep`] = s.nextstep || "";
    }
    try { await fetch(FB_WEBHOOK, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) }); }
    catch(e) { console.warn(e); }
    setSubmitting(false);
    setSubmitted(true);
  }

  function resetForm() {
    setCoach(coachName); setHora(""); setTipo(""); setTipoTaller("");
    setScores({ proactividad:null, gramatica:null, complejidad:null, fluidez:null, participacion:null, comprension:null });
    setNotaTaller(""); setStudents([]); setAttendees([]); setErrors({}); setSubmitted(false);
  }

  const addBtn = { width:"100%", background:"transparent", border:"1px dashed rgba(240,236,224,0.1)", borderRadius:14, color:"rgba(240,236,224,0.3)", fontFamily:"inherit", fontSize:13, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", padding:"1rem", cursor:"pointer", transition:"all 0.2s", marginBottom:"0.75rem", minHeight:44 };
  const drumCol = { flex:1, overflowY:"scroll", scrollSnapType:"y mandatory", WebkitOverflowScrolling:"touch", scrollbarWidth:"none", padding:"88px 0", textAlign:"center" };

  if (submitted) {
    return (
      <div style={{ maxWidth:560, width:"100%" }}>
        <div style={{ marginBottom:"1.5rem" }}>
          <BackBtn onClick={() => setActive("feedbacks")} />
          <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text, marginBottom:"0.4rem" }}>Class Feedback</h2>
          <p style={{ fontSize:13, color:C.text2, lineHeight:1.6 }}>Start with class info, then fill in performance and individual notes. Be specific, this drives the next session.</p>
        </div>
        <div style={{ ...CARD, borderRadius:16, padding:"3rem 1.5rem", textAlign:"center" }}>
          <div style={{ width:52, height:52, background:"rgba(109,181,138,0.12)", border:"1px solid rgba(109,181,138,0.3)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.25rem", fontSize:22 }}>✓</div>
          <h2 style={{ fontSize:"1.5rem", fontWeight:900, letterSpacing:"-0.02em", color:C.text, marginBottom:"0.5rem" }}>Feedback submitted!</h2>
          <p style={{ fontSize:13, color:C.text2, lineHeight:1.6, marginBottom:"1.5rem" }}>Your notes are in.</p>
          <button onClick={resetForm} style={{ background:C.text, color:C.bg, border:"none", borderRadius:50, fontFamily:"inherit", fontSize:13, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"0.9rem 2rem", cursor:"pointer", minHeight:44 }}>Got more?</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:560, width:"100%", paddingBottom:"6rem" }}>
      {/* Header */}
      <div style={{ marginBottom:"1.5rem" }}>
        <BackBtn onClick={() => setActive("feedbacks")} />
        <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text, marginBottom:"0.4rem" }}>Feedback.</h2>
        <p style={{ fontSize:13, color:C.text2, lineHeight:1.6 }}>Start with class info, then fill in performance and individual notes. Be specific, this drives the next session.</p>
      </div>

      {/* ── CLASS INFO ─────────────────────────────── */}
      <div style={fbSection}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.text3, marginBottom:"1.25rem" }}>Class info</p>

        {/* Coach */}
        <div style={{ marginBottom:"1.25rem" }}>
          <label style={fbLabel}>Coach <span style={{ color:C.red }}>*</span></label>
          <select value={coach} onChange={e => { setCoach(e.target.value); setErrors(er => ({...er, coach:false})); }}
            style={{ ...fbInput, backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 0.9rem center", paddingRight:"2.2rem", cursor:"pointer", borderColor: errors.coach ? C.red : "rgba(240,236,224,0.07)" }}>
            <option value="">Select...</option>
            {FB_COACHES.map(c => <option key={c} value={c} style={{ background:"#1e1b17", color:"#f0ece0" }}>{c}</option>)}
          </select>
          {errors.coach && <p style={fbErr}>Select your name.</p>}
        </div>

        {/* Time */}
        <div style={{ marginBottom:"1.25rem" }}>
          <label style={fbLabel}>Class start time <span style={{ color:C.red }}>*</span></label>
          <button type="button" onClick={() => setTpOpen(true)}
            style={{ ...fbInput, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", background: hora ? "rgba(240,236,224,0.1)" : "rgba(240,236,224,0.05)", borderColor: errors.hora ? C.red : "rgba(240,236,224,0.07)" }}>
            <span style={{ color: hora ? C.text : C.text3, fontWeight: hora ? 600 : 500 }}>{hora || "Select time..."}</span>
            <span style={{ fontSize:11, color:C.text3 }}>▾</span>
          </button>
          {errors.hora && <p style={fbErr}>Select class start time.</p>}
        </div>

        {/* Class type */}
        <div style={{ marginBottom: tipo === "Workshop" ? "1.25rem" : 0 }}>
          <label style={fbLabel}>Class type <span style={{ color:C.red }}>*</span></label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.45rem" }}>
            {["Group","Private","Workshop"].map(t => (
              <button key={t} type="button" onClick={() => changeTipo(t)}
                style={{ display:"inline-flex", alignItems:"center", background: tipo===t ? "rgba(240,236,224,0.1)" : "rgba(240,236,224,0.04)", border:`1px solid ${tipo===t ? C.accent : C.border}`, borderRadius:50, padding:"0.55rem 0.9rem", fontSize:14, fontWeight: tipo===t ? 600 : 500, color: tipo===t ? C.text : C.text2, cursor:"pointer", transition:"all 0.15s", minHeight:44, fontFamily:"inherit" }}>
                {t}
              </button>
            ))}
          </div>
          {errors.tipo && <p style={fbErr}>Select a class type.</p>}
        </div>

        {/* Workshop type */}
        {tipo === "Workshop" && (
          <div>
            <label style={fbLabel}>Workshop type <span style={{ color:C.red }}>*</span></label>
            <input type="text" value={tipoTaller} onChange={e => { setTipoTaller(e.target.value); setErrors(er => ({...er, tipoTaller:false})); }}
              placeholder="e.g. Pronunciation, Phrasal Verbs, Business Writing..."
              style={{ ...fbInput, borderColor: errors.tipoTaller ? C.red : "rgba(240,236,224,0.07)" }} />
            {errors.tipoTaller && <p style={fbErr}>Enter the workshop type.</p>}
          </div>
        )}
      </div>

      {/* ── PERFORMANCE — Group / Private ──────────── */}
      {(tipo === "Group" || tipo === "Private") && (
        <div style={fbSection}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.text3, marginBottom:"1.25rem" }}>Performance</p>
          <FbScaleInput name="proactividad" label="Student Proactivity" hint="How much did students drive the conversation without being prompted?" value={scores.proactividad} onSelect={setScore} error={errors.proactividad} />
          <div style={fbLine} />
          <FbScaleInput name="gramatica" label="Grammar Spontaneity" hint="How naturally did they use today's target structures without overthinking?" value={scores.gramatica} onSelect={setScore} error={errors.gramatica} />
          <div style={fbLine} />
          <FbScaleInput name="complejidad" label="Sentence Complexity" hint="How well did students develop their ideas with detail and depth?" value={scores.complejidad} onSelect={setScore} error={errors.complejidad} />
          <div style={fbLine} />
          <FbScaleInput name="fluidez" label="Conversational Flow" hint="How natural and fluid was the discussion overall?" value={scores.fluidez} onSelect={setScore} error={errors.fluidez} />
        </div>
      )}

      {/* ── PERFORMANCE — Workshop ─────────────────── */}
      {tipo === "Workshop" && (
        <div style={fbSection}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.text3, marginBottom:"1.25rem" }}>Workshop performance</p>
          <FbScaleInput name="participacion" label="Group Participation" hint="How actively did participants engage throughout the workshop?" value={scores.participacion} onSelect={setScore} error={errors.participacion} />
          <div style={fbLine} />
          <FbScaleInput name="comprension" label="Content Comprehension" hint="How well did participants understand and apply the workshop content?" value={scores.comprension} onSelect={setScore} error={errors.comprension} />
          <div style={fbLine} />
          <div>
            <label style={fbLabel}>General observations <span style={{ color:C.red }}>*</span></label>
            <textarea value={notaTaller} onChange={e => { setNotaTaller(e.target.value); setErrors(er => ({...er, notaTaller:false})); }}
              placeholder="Overall group dynamics, highlights, and anything useful to know..."
              style={{ ...fbInput, resize:"none", minHeight:80, lineHeight:1.5, borderColor: errors.notaTaller ? C.red : "rgba(240,236,224,0.07)" }} />
            {errors.notaTaller && <p style={fbErr}>Add your observations.</p>}
          </div>
        </div>
      )}

      {/* ── STUDENTS — Group / Private ─────────────── */}
      {(tipo === "Group" || tipo === "Private") && (
        <div>
          <div style={{ ...fbSection, paddingBottom:"1rem", marginBottom:"0.75rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.text3, marginBottom:"0.5rem" }}>Individual notes</p>
            <p style={{ fontSize:12, color:C.text2 }}>
              {tipo === "Private" ? "Add performance notes and a specific Next Step for this session." : "Add one card per student (max 3) with a performance note and a specific Next Step."}
            </p>
          </div>
          {students.map((s,i) => (
            <FbStudentCard key={i} idx={i} isWorkshop={false} isPrivate={tipo==="Private"} data={s}
              onChange={(idx,field,val) => updateList(setStudents,idx,field,val)}
              onRemove={() => setStudents(a => a.filter((_,j) => j!==i))}
              errors={errors} />
          ))}
          {tipo === "Group" && students.length < 3 && (
            <button type="button" onClick={() => setStudents(a => [...a, { name:"", nota:"", nextstep:"" }])} style={addBtn}>+ Add student</button>
          )}
        </div>
      )}

      {/* ── ATTENDEES — Workshop ───────────────────── */}
      {tipo === "Workshop" && (
        <div>
          <div style={{ ...fbSection, paddingBottom:"1rem", marginBottom:"0.75rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.text3, marginBottom:"0.5rem" }}>Attendees (max 12)</p>
            <p style={{ fontSize:12, color:C.text2 }}>Add a quick observation per attendee.</p>
          </div>
          {attendees.map((s,i) => (
            <FbStudentCard key={i} idx={i} isWorkshop={true} isPrivate={false} data={s}
              onChange={(idx,field,val) => updateList(setAttendees,idx,field,val)}
              onRemove={() => setAttendees(a => a.filter((_,j) => j!==i))}
              errors={errors} />
          ))}
          {attendees.length < 12 && (
            <button type="button" onClick={() => setAttendees(a => [...a, { name:"", nota:"" }])} style={addBtn}>+ Add attendee</button>
          )}
        </div>
      )}

      {/* Submit */}
      {tipo && (
        <button type="button" onClick={handleSubmit} disabled={submitting}
          style={{ width:"100%", background:C.text, color:C.bg, border:"none", borderRadius:50, fontFamily:"inherit", fontSize:14, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"1rem 2rem", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.4 : 1, marginTop:"0.75rem", minHeight:52, transition:"opacity 0.2s" }}>
          {submitting ? "Submitting..." : "Submit feedback"}
        </button>
      )}

      {/* ── DRUM TIME PICKER ──────────────────────── */}
      {tpOpen && (
        <>
          <div onClick={() => setTpOpen(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:999, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)" }} />
          <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:1000, background:C.surface, borderTop:`1px solid ${C.border}`, borderRadius:"20px 20px 0 0", maxWidth:520, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", borderBottom:`1px solid ${C.border}` }}>
              <button type="button" onClick={() => setTpOpen(false)} style={{ background:"none", border:"none", fontFamily:"inherit", fontSize:13, fontWeight:600, color:C.text3, cursor:"pointer", padding:0, minHeight:44 }}>Cancel</button>
              <span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3 }}>Start Time</span>
              <button type="button" onClick={confirmTime} style={{ background:"none", border:"none", fontFamily:"inherit", fontSize:13, fontWeight:700, color:C.text, cursor:"pointer", padding:0, minHeight:44 }}>Done</button>
            </div>
            <div style={{ position:"relative", height:220, display:"flex", alignItems:"stretch" }}>
              {/* Selection highlight bar */}
              <div style={{ position:"absolute", top:"50%", left:0, right:0, transform:"translateY(-50%)", height:44, background:"rgba(240,236,224,0.06)", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, pointerEvents:"none", zIndex:1 }} />
              {/* Fade top */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:80, background:`linear-gradient(to bottom, ${C.surface} 30%, transparent)`, zIndex:2, pointerEvents:"none" }} />
              {/* Fade bottom */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:`linear-gradient(to top, ${C.surface} 30%, transparent)`, zIndex:2, pointerEvents:"none" }} />
              {/* Hour */}
              <div ref={drumH} className="fb-drum" style={drumCol} onScroll={() => handleDrumScroll("h")}>
                {FB_HOURS.map((v,i) => (
                  <div key={v} onClick={() => snapDrum("h",i)} style={{ height:44, display:"flex", alignItems:"center", justifyContent:"center", scrollSnapAlign:"center", fontSize:22, fontWeight: i===tpH?600:400, color: i===tpH?C.text:C.text3, cursor:"pointer", userSelect:"none", letterSpacing:"-0.01em" }}>{v}</div>
                ))}
              </div>
              {/* Minutes */}
              <div ref={drumM} className="fb-drum" style={drumCol} onScroll={() => handleDrumScroll("m")}>
                {FB_MINS.map((v,i) => (
                  <div key={v} onClick={() => snapDrum("m",i)} style={{ height:44, display:"flex", alignItems:"center", justifyContent:"center", scrollSnapAlign:"center", fontSize:22, fontWeight: i===tpM?600:400, color: i===tpM?C.text:C.text3, cursor:"pointer", userSelect:"none" }}>{v}</div>
                ))}
              </div>
              {/* AM/PM */}
              <div ref={drumAP} className="fb-drum" style={drumCol} onScroll={() => handleDrumScroll("ap")}>
                {FB_AMPM.map((v,i) => (
                  <div key={v} onClick={() => snapDrum("ap",i)} style={{ height:44, display:"flex", alignItems:"center", justifyContent:"center", scrollSnapAlign:"center", fontSize:22, fontWeight: i===tpAP?600:400, color: i===tpAP?C.text:C.text3, cursor:"pointer", userSelect:"none" }}>{v}</div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
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
        .then(({ data }) => { if (data?.nombre) setCoachFilter(data.nombre.split(" ")[0]); });
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
        <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:900, letterSpacing:"-0.02em", color:C.text, marginBottom:"1rem" }}>Class Feedback Sent</h2>
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
      {!loading && filtered.length === 0 ? (
        <div style={{ ...CARD, borderRadius:14, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No records yet.</p>
        </div>
      ) : !loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {filtered.map((r,i) => (
            <div key={i} style={{ ...CARD, borderLeft:`3px solid ${COACH_COLORS[r.coach]||C.text3}`, borderRadius:14, padding:"1rem 1.25rem" }}>
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
        .then(({ data }) => { if (data?.nombre) setCoachFilter(data.nombre.split(" ")[0]); });
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
        <h2 style={{ fontSize:"clamp(1.2rem,3vw,1.6rem)", fontWeight:900, letterSpacing:"-0.02em", color:C.text, marginBottom:"1rem" }}>Student Feedback Sent</h2>
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
      {!loading && filtered.length === 0 ? (
        <div style={{ ...CARD, borderRadius:14, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No records.</p>
        </div>
      ) : !loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {filtered.map((r,i) => (
            <div key={i} style={{ ...CARD, borderLeft:`3px solid ${isNoShow(r) ? C.amber : COACH_COLORS[r.coach]||C.text3}`, borderRadius:14, overflow:"hidden" }}>
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
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>FeedbackHub</p>
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
        <div style={{ ...CARD, borderRadius:14, padding:"2rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No surveys yet.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {filtered.map((r,i) => (
            <div key={i} style={{ ...CARD, borderLeft:`3px solid ${COACH_COLORS[r.coach]||C.text3}`, borderRadius:14, padding:"1rem 1.25rem" }}>
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
                    {m.key === "practicar_mas"
                      ? <p style={{ fontSize:12, fontWeight:600, color:C.text, lineHeight:1.4 }}>{r[m.key] || "—"}</p>
                      : <ScoreBar value={+r[m.key]||0} color={COACH_COLORS[r.coach] || "rgba(240,236,224,0.6)"} />
                    }
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
      FeedbackHub
    </button>
  );
}

// ── MINI CALENDAR PICKER ──────────────────────────────────────
const getWeekMonday = (offset) => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  d.setHours(0,0,0,0);
  return d;
};

function MiniCalendar({ weekOffset, setWeekOffset, onClose }) {
  const now = new Date();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["M","T","W","T","F","S","S"];

  const [viewMonth, setViewMonth] = useState(() => getWeekMonday(weekOffset).getMonth());
  const [viewYear,  setViewYear]  = useState(() => getWeekMonday(weekOffset).getFullYear());
  const [showMonths, setShowMonths] = useState(false);

  // Sync the month view whenever the selected week changes
  React.useEffect(() => {
    const mon = getWeekMonday(weekOffset);
    setViewMonth(mon.getMonth());
    setViewYear(mon.getFullYear());
  }, [weekOffset]);

  // Keep old alias for references below
  const getCurrentWeekMonday = getWeekMonday;

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
        {/* Week navigation */}
        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:"0.5rem" }}>
          <button onClick={() => setWeekOffset(p => p - 1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:6, color:C.text2, cursor:"pointer", fontSize:12, padding:"2px 8px", fontFamily:"inherit" }}>←</button>
          <span style={{ flex:1, textAlign:"center", fontSize:11, color:C.text3, fontWeight:600 }}>
            {(() => { const m = getCurrentWeekMonday(weekOffset); const s = new Date(m); s.setDate(s.getDate()+5); return `${m.getDate()} – ${s.getDate()} ${MONTHS[m.getMonth()]}`; })()}
          </span>
          <button onClick={() => setWeekOffset(p => p + 1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:6, color:C.text2, cursor:"pointer", fontSize:12, padding:"2px 8px", fontFamily:"inherit" }}>→</button>
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
                  background: isToday ? "rgba(109,181,138,0.15)" : "transparent",
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
  // Init from module cache so re-navigation is instant (Dashboard seeds _schedCache on first load)
  const [cache, setCache] = useState(() => ({..._schedCache}));
  const [loading, setLoading] = useState(() => _schedCache[0] === undefined);
  const [error, setError] = useState(null);
  const [monthEvents, setMonthEvents] = useState(() => _monthCache || []);
  const [retryKey, setRetryKey] = useState(0);

  const rawEvents = cache[weekOffset] || [];
  // user.nombre may be full name ("Ricardo Baltodano") but events store short name ("Ricardo").
  // Use first word only so the filter always matches regardless of how auth loaded the profile.
  const coachFilterName = (user?.nombre || "").split(" ")[0];
  const events = role === "coach" && coachFilterName
    ? rawEvents.filter(ev => ev.coach === coachFilterName)
    : rawEvents;

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

  // Fetch full month events once on mount (for coach monthly total).
  // Polls _monthCache every 300ms — CoachDashboard's sequential month request populates it.
  // Falls back to own month request if Dashboard didn't seed within ~15s (direct navigation).
  useEffect(() => {
    if (role !== "coach") return;
    if (_monthCache) { setMonthEvents(_monthCache); return; } // already seeded — instant

    let cancelled = false;
    let pollTimer = null;
    let pollCount = 0;

    const poll = () => {
      if (cancelled) return;
      if (_monthCache) { setMonthEvents(_monthCache); return; }
      if (++pollCount < 50) { // up to ~15s (50 × 300ms)
        pollTimer = setTimeout(poll, 300);
      } else {
        // Dashboard didn't populate in 15s — fire own month request (direct-to-Calendar navigation)
        const now2 = new Date();
        const mStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
        const mEnd   = new Date(now2.getFullYear(), now2.getMonth()+1, 0, 23,59,59);
        fetch(EDGE_URL, {
          method: "POST",
          headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ source: "teams", startDateTime: mStart.toISOString(), endDateTime: mEnd.toISOString() })
        }).then(r=>r.json()).then(d => {
          if (!cancelled && Array.isArray(d) && d.length > 0) {
            const evs = d.map(ev => ({ ...ev, date: new Date(new Date(ev.start).getTime() - 6*60*60*1000) })).filter(ev => !isNaN(ev.date));
            _monthCache = evs;
            setMonthEvents(evs);
          }
        }).catch(()=>{});
      }
    };
    poll();

    return () => { cancelled = true; if (pollTimer) clearTimeout(pollTimer); };
  }, []);

  // Pre-fetch all other weeks of the viewed month so the month total is always
  // complete — same reliable week-fetch mechanism, sequential (one at a time).
  useEffect(() => {
    if (role !== "coach") return;
    if (cache[weekOffset] === undefined) return; // current week not ready yet
    const yr = weekDates[0].getFullYear();
    const mo = weekDates[0].getMonth();
    // Collect all week offsets whose Monday falls in the viewed month
    const offsets = new Set();
    for (let d = new Date(yr, mo, 1); d.getMonth() === mo; d.setDate(d.getDate() + 7)) {
      const now2 = new Date();
      const nd = now2.getDay();
      const todayMon = new Date(now2); todayMon.setDate(now2.getDate() - (nd===0?6:nd-1)); todayMon.setHours(0,0,0,0);
      const wDay = d.getDay();
      const wMon = new Date(d); wMon.setDate(d.getDate() - (wDay===0?6:wDay-1)); wMon.setHours(0,0,0,0);
      const off = Math.round((wMon - todayMon) / (7*24*60*60*1000));
      offsets.add(off);
    }
    // Fetch missing weeks one after another
    const missing = [...offsets].filter(o => o !== weekOffset && cache[o] === undefined && _schedCache[o] === undefined);
    missing.forEach((off, i) => {
      const dates = getWeekDates(off);
      const wS = new Date(dates[0]); wS.setHours(0,0,0,0);
      const wE = new Date(dates[5]); wE.setHours(23,59,59,999);
      setTimeout(() => {
        fetch(EDGE_URL, {
          method:"POST",
          headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
          body: JSON.stringify({ source:"teams", startDateTime: wS.toISOString(), endDateTime: wE.toISOString() })
        }).then(r=>r.text()).then(text => {
          if (!text?.trim().startsWith("[")) return;
          const data = JSON.parse(text);
          const evs = data.map(ev => ({
            uid: ev.uid||(ev.summary||"")+(ev.start||""),
            summary: ev.summary||"Sin título", date: new Date(new Date(ev.start).getTime()-6*60*60*1000),
            coach: ev.coach||"Unassigned", nivel:"", estudiantes: ev.estudiantes||"",
            joinUrl: ev.joinUrl||null, urgente: false
          })).filter(ev => !isNaN(ev.date.getTime()));
          if (evs.length > 0) _schedCache[off] = evs;
          setCache(c => ({ ...c, [off]: evs }));
        }).catch(()=>{});
      }, i * 600); // stagger 600ms apart to avoid throttling
    });
  }, [weekOffset, role, cache[weekOffset]]);

  useEffect(() => {
    // Use cache if available
    if (cache[weekOffset] !== undefined) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    let cancelled = false;

    // Parse and store events from a raw API array
    const applyData = (data) => {
      if (data && Array.isArray(data)) {
        const evs = data.map(ev => {
          const crDate = new Date(new Date(ev.start).getTime() - 6 * 60 * 60 * 1000);
          return { uid: ev.uid || ev.summary + ev.start, summary: ev.summary || "Sin título", date: crDate, coach: ev.coach || "Unassigned", nivel: "", estudiantes: ev.estudiantes || "", joinUrl: ev.joinUrl || null, urgente: false };
        }).filter(ev => ev.date && !isNaN(ev.date.getTime()));
        if (evs.length > 0) _schedCache[weekOffset] = evs; // never cache empty — empty means error/throttle
        if (!cancelled) { setCache(c => ({ ...c, [weekOffset]: evs })); setLoading(false); }
      } else {
        if (!cancelled) { setError("No se pudo cargar el calendario."); setLoading(false); }
      }
    };

    const doFetch = () => {
      // Coach: no coaches param (1 Graph call). Admin: pass all coaches for labeling.
      const reqBody = { source: "teams", startDateTime: weekStart.toISOString(), endDateTime: weekEnd.toISOString() };
      if (role !== "coach") reqBody.coaches = Object.keys(coachEmails);
      fetch(EDGE_URL, {
        method: "POST",
        headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      }).then(r => r.text()).then(text => {
        if (cancelled) return;
        if (!text || !text.trim().startsWith("[")) { applyData(null); return; }
        try { applyData(JSON.parse(text)); } catch(e) { applyData(null); }
      }).catch(() => { if (!cancelled) { setError("No se pudo cargar el calendario."); setLoading(false); } });
    };

    // For coach offset=0: poll _schedCache[0] every 300ms (seeded by Dashboard's p1week).
    // No concurrent Graph call fired until cache is confirmed missing after ~10s.
    if (role === "coach" && weekOffset === 0) {
      const dashSnap = _dashboardFetch;
      if (dashSnap && retryKey === 0) {
        // Wait for Dashboard's p1week — no timeout, handles Edge Function cold starts
        dashSnap.then(() => {
          if (cancelled) return;
          if (_schedCache[0] !== undefined) {
            setCache(c => ({ ...c, 0: _schedCache[0] }));
            setLoading(false);
          } else {
            // p1week returned empty — fire own fetch (throttle may have cleared)
            doFetch();
          }
        }).catch(() => { if (!cancelled) doFetch(); });
      } else {
        // retryKey > 0 (user clicked retry) or no Dashboard ran → fetch directly
        doFetch();
      }
      return () => { cancelled = true; };
    } else {
      doFetch();
      return () => { cancelled = true; };
    }
  }, [weekOffset, retryKey]);

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
    ? `${weekDates[0].getDate()} – ${weekDates[5].getDate()} ${mo[weekDates[0].getMonth()]}, ${weekDates[0].getFullYear()}`
    : `${weekDates[0].getDate()} ${mo[weekDates[0].getMonth()]} – ${weekDates[5].getDate()} ${mo[weekDates[5].getMonth()]}, ${weekDates[0].getFullYear()}`;

  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", position: "relative" }}>
        <div>
          <button onClick={() => setShowCal(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="calendar" size={16} color={C.text} />
            <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{weekLabel}</h2>
            <span style={{ fontSize: 12, color: C.text }}>▾</span>
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

      {error && (
        <div style={{ background: "rgba(194,0,0,0.08)", border: `1px solid rgba(194,0,0,0.2)`, borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => { setError(null); setLoading(true); setRetryKey(k => k + 1); }}
            style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "0.35rem 0.75rem", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
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
                            <div key={si} title={ev.summary}
                              style={{ background: ev.urgente ? "rgba(194,0,0,0.08)" : C.surface, border: `1px solid ${(ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text3) + "55"}`, borderLeft: `3px solid ${ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text3}`, borderRadius: 8, padding: "0.35rem 0.5rem", marginBottom: si < slots.length - 1 ? 3 : 0, textAlign: "left" }}>
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

      {/* Stats below calendar — admin only */}
      {!loading && !error && events.length > 0 && role !== "coach" && (() => {
        const coachColors = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };
        const coaches = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
        const weekEvents = events;

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
            <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
                <tbody>
                  {coaches.filter(c => byCoach[c] > 0).map((coach, i, arr) => (
                    <tr key={coach} style={{ borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding: "0.8rem 1rem", position: "sticky", left: 0, background: C.surface2, whiteSpace: "nowrap", width: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: coachColors[coach]+"22", border: `1px solid ${coachColors[coach]}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: coachColors[coach] }}>{coach[0]}</p>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{coach}</p>
                        </div>
                      </td>
                      <td style={{ padding: "0.8rem 0.75rem" }}>
                        <ProgressBar value={byCoach[coach]} max={maxVal} color={coachColors[coach]} />
                      </td>
                      <td style={{ padding: "0.8rem 1rem", textAlign: "right", width: 36, whiteSpace: "nowrap" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: coachColors[coach] }}>{byCoach[coach]}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all");

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
    setCreating(true); setError(null);
    const code = generateCode();
    const { error: err } = await supabase.from("invite_codes").insert({
      code, rol: form.rol, plan: form.rol === "student" ? form.plan : null, creado_por: user?.id || null,
    });
    if (err) setError("Error creating code. Please try again.");
    else await loadCodes();
    setCreating(false);
  };

  const deleteCode = async (id) => {
    if (!window.confirm("Delete this code?")) return;
    setDeleting(id);
    await supabase.from("invite_codes").delete().eq("id", id);
    await loadCodes();
    setDeleting(null);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code); setTimeout(() => setCopied(null), 2000);
  };

  const copyWhatsApp = (code, rol, plan) => {
    const planText = plan ? ` — Plan: ${plan}` : "";
    const msg = `Hola! Te comparto tu código de acceso a la plataforma de Dilo Club 🎓\n\nCódigo: *${code}*\nRol: ${rol === "student" ? "Student" : "Coach"}${planText}\n\nIngresá a: dilo.club/app → "Crear cuenta con código"`;
    navigator.clipboard.writeText(msg);
    setCopied(code + "_wa"); setTimeout(() => setCopied(null), 2000);
  };

  const WA_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  const COPY_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  const TRASH_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
  const BTN = { padding: "0.35rem 0.85rem", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "transparent" };

  const available = codes.filter(c => !c.usado);
  const used      = codes.filter(c =>  c.usado);
  const displayed = filter === "available" ? available : filter === "used" ? used : codes;

  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      {/* Create new code */}
      <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
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

      {/* Filter tabs + counts */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { key: "all",       label: "All",       count: codes.length },
          { key: "available", label: "Available",  count: available.length },
          { key: "used",      label: "Used",        count: used.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.3rem 0.75rem", borderRadius: 50, border: `1px solid ${filter === tab.key ? C.text : C.border2}`, background: "transparent", color: filter === tab.key ? C.text : C.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {tab.label}
            <span style={{ fontSize: 10, fontWeight: 700, background: filter === tab.key ? C.surface2 : "transparent", borderRadius: 50, padding: "0 4px", minWidth: 16, textAlign: "center" }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: 6, padding: "1rem" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ ...CARD, borderRadius: 14, padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.text3 }}>{codes.length === 0 ? "No codes generated yet." : "No codes in this filter."}</p>
        </div>
      ) : (
        <div style={{ ...CARD, borderRadius: 14, overflow: "hidden" }}>
          {displayed.map((c, i) => (
            <div key={c.id} style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: i < displayed.length-1 ? `1px solid ${C.border}` : "none" }}>

              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: c.usado ? C.text3 : C.green, opacity: c.usado ? 0.4 : 1 }} />

              {/* Code + copy */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 180 }}>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, fontWeight: 700, color: c.usado ? C.text3 : C.text, letterSpacing: "0.1em" }}>{c.code}</p>
                <button onClick={() => copyCode(c.code)} title="Copy"
                  style={{ width: 24, height: 24, borderRadius: "50%", border: `1px solid ${C.border2}`, background: "transparent", color: copied===c.code ? C.green : C.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {copied===c.code ? <span style={{fontSize:10}}>✓</span> : COPY_ICON}
                </button>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: "0.35rem", flex: 1, flexWrap: "wrap" }}>
                {[c.rol === "student" ? "Student" : c.rol === "coach" ? "Coach" : "Admin", c.plan].filter(Boolean).map((label, li) => (
                  <span key={li} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 50, background: "transparent", color: C.text2, border: `1px solid ${C.border2}` }}>
                    {label}
                  </span>
                ))}
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 50, background: "transparent",
                  color: c.usado ? C.text3 : C.green,
                  border: `1px solid ${c.usado ? C.border2 : C.green+"55"}` }}>
                  {c.usado ? "Used" : "Available"}
                </span>
              </div>

              {/* WhatsApp — available only */}
              {!c.usado && (
                <button onClick={() => copyWhatsApp(c.code, c.rol, c.plan)}
                  style={{ height: 26, padding: "0 0.6rem", borderRadius: 50, border: `1px solid ${C.green}55`, background: "transparent", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {WA_ICON}
                  <span>{copied===c.code+"_wa" ? "✓" : "WhatsApp"}</span>
                </button>
              )}

              {/* Delete */}
              <button onClick={() => deleteCode(c.id)} disabled={deleting === c.id}
                title="Delete code"
                style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${C.border2}`, background: "transparent", color: deleting === c.id ? C.text3 : C.red, cursor: deleting === c.id ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: deleting === c.id ? 0.5 : 1, transition: "opacity 0.15s" }}>
                {deleting === c.id ? <span style={{fontSize:9}}>...</span> : TRASH_ICON}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// KYS (Know Your Student) form
const KYS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwhfLVUpEJshkruvTA55XBva0qJWGZg6wk1raHgfT-V722rP_5rv9XsN750QqDOASjF/exec';
const KYS_BLOCKS = 7;
const KYS_AREAS = ["Tecnología / IT","Finanzas / Contabilidad","Marketing / Publicidad","Ventas / Comercial","Recursos Humanos","Legal / Jurídico","Salud / Medicina","Educación","Ingeniería","Logística / Operaciones","Administración / Gestión","Comunicación / Medios","Otro"];
const KYS_SELECT_ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")";

function KysPill({ label, checked, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:"0.4rem 0.85rem", borderRadius:50, border:`1px solid ${checked ? C.accent+"99" : "rgba(240,236,224,0.14)"}`,
        background: checked ? `${C.accent}22` : "transparent",
        color: checked ? C.accent : "rgba(240,236,224,0.55)",
        fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
        transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

function KysScaleInput({ label, hint, value, onSelect, error }) {
  return (
    <div style={{ marginBottom:"0.2rem" }}>
      <label style={fbLabel}>{label} <span style={{color:"#c20000"}}>*</span></label>
      {hint && <p style={{ fontSize:11, color:"rgba(240,236,224,0.38)", marginBottom:"0.5rem", lineHeight:1.4 }}>{hint}</p>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const sel = value === n;
          const col = n<=3 ? "#e57373" : n<=6 ? "#ffa726" : n<=8 ? "#a3d977" : "#66bb6a";
          return (
            <button key={n} type="button" onClick={() => onSelect(n)}
              style={{ width:34, height:34, borderRadius:"50%", border:`2px solid ${sel ? col : "rgba(240,236,224,0.14)"}`,
                background: sel ? col+"33" : "transparent", color: sel ? col : "rgba(240,236,224,0.5)",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s" }}>
              {n}
            </button>
          );
        })}
      </div>
      {error && <p style={fbErr}>{error}</p>}
    </div>
  );
}

function KYSForm({ user, profile, compact = false }) {
  const ci = compact ? { ...fbInput, fontSize: 14, padding: "0.6rem 0.85rem" } : fbInput;
  const cl = compact ? { ...fbLabel, fontSize: 11 } : fbLabel;
  const mb = compact ? "0.65rem" : "0.9rem";
  const [block, setBlock] = useState(0);
  const [fields, setFields] = useState({
    nombre: profile?.nombre || user?.email?.split("@")[0] || "",
    email: profile?.email || user?.email || "",
    area: "", cargo: "", contextos: [], meta: "",
    anios: "", metodos: [], por_que_no: "",
    emocion_error: [], emocion_extra: "", correccion: "", bloqueo: "", miedo_tipo: "",
    estilo: "", idioma_clase: "", no_entiende: "", debilidades: [],
    tiempo_extra: "", urgencia: null, abandono: "",
    consumo: [], temas_opinion: [], debate: "", tema_evitar: "", temas_pasion: "",
    coach_saber: "", extra: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => { setFields(f => ({ ...f, [k]: v })); setErrors(e => { const n={...e}; delete n[k]; return n; }); };
  const toggle = (k, v) => setFields(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x=>x!==v) : [...f[k], v] }));

  const validates = [
    () => { const e={}; if(!fields.nombre.trim())e.nombre="Campo requerido"; if(!fields.email.trim())e.email="Campo requerido"; if(!fields.area)e.area="Seleccioná una opción"; if(!fields.contextos.length)e.contextos="Seleccioná al menos una"; if(!fields.meta.trim())e.meta="Campo requerido"; return e; },
    () => { const e={}; if(!fields.anios)e.anios="Seleccioná una opción"; if(!fields.metodos.length)e.metodos="Seleccioná al menos uno"; return e; },
    () => { const e={}; if(!fields.emocion_error.length)e.emocion_error="Seleccioná al menos una"; if(!fields.correccion)e.correccion="Seleccioná una opción"; if(!fields.miedo_tipo)e.miedo_tipo="Seleccioná una opción"; return e; },
    () => { const e={}; if(!fields.estilo)e.estilo="Seleccioná una opción"; if(!fields.idioma_clase)e.idioma_clase="Seleccioná una opción"; if(!fields.no_entiende)e.no_entiende="Seleccioná una opción"; if(!fields.debilidades.length)e.debilidades="Seleccioná al menos una"; return e; },
    () => { const e={}; if(!fields.tiempo_extra)e.tiempo_extra="Seleccioná una opción"; if(!fields.urgencia)e.urgencia="Indicá tu nivel de urgencia"; return e; },
    () => { const e={}; if(!fields.consumo.length)e.consumo="Seleccioná al menos uno"; if(!fields.temas_opinion.length)e.temas_opinion="Seleccioná al menos uno"; if(!fields.debate)e.debate="Seleccioná una opción"; return e; },
    () => ({})
  ];

  const next = () => { const e=validates[block](); if(Object.keys(e).length){setErrors(e);return;} setErrors({}); setBlock(b=>b+1); };
  const back = () => { setErrors({}); setBlock(b=>b-1); };

  const submit = async () => {
    const e=validates[block](); if(Object.keys(e).length){setErrors(e);return;}
    setSubmitting(true);
    const payload = {
      nombre:fields.nombre, email:fields.email, area_profesional:fields.area, cargo:fields.cargo,
      contextos_uso:fields.contextos.join(", "), meta_ingles:fields.meta,
      anios_estudiando:fields.anios, metodos_intentados:fields.metodos.join(", "), por_que_no_funciono:fields.por_que_no,
      emocion_al_errar:fields.emocion_error.join(", "), emocion_extra:fields.emocion_extra,
      preferencia_correccion:fields.correccion, ultimo_bloqueo:fields.bloqueo, presion_al_hablar:fields.miedo_tipo,
      estilo_aprendizaje:fields.estilo, idioma_en_clase:fields.idioma_clase, cuando_no_entiende:fields.no_entiende,
      areas_debiles:fields.debilidades.join(", "), tiempo_fuera_clase:fields.tiempo_extra,
      urgencia:fields.urgencia, causa_abandono:fields.abandono,
      consumo_libre:fields.consumo.join(", "), temas_opinion:fields.temas_opinion.join(", "),
      estilo_debate:fields.debate, tema_a_evitar:fields.tema_evitar, temas_pasion:fields.temas_pasion,
      coach_debe_saber:fields.coach_saber, comentario_extra:fields.extra,
      fecha: new Date().toISOString()
    };
    try { await fetch(KYS_WEBHOOK, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) }); } catch(_) {}
    setSubmitting(false); setSubmitted(true);
  };

  const blockTitles = ["","Tu historial con el inglés","Cómo te sentís al hablar","Tu estilo de aprendizaje","Tu compromiso","Tus intereses","Para tu coach"];
  const kysSel = { ...ci, backgroundImage:KYS_SELECT_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 0.9rem center", paddingRight:"2.2rem", cursor:"pointer" };

  if (submitted) return (
    <div style={{ textAlign:"center", padding:"1.5rem 0.5rem" }}>
      <div style={{ fontSize:36, marginBottom:"0.75rem", color:C.green }}>✓</div>
      <p style={{ fontSize:"1rem", fontWeight:800, color:C.text, marginBottom:"0.5rem" }}>¡Gracias!</p>
      <p style={{ fontSize:13, color:C.text3, lineHeight:1.6 }}>Tu perfil fue enviado a tus coaches. Lo usaremos para personalizar cada clase.</p>
    </div>
  );

  return (
    <div>
      {/* Progress */}
      <div style={{ display:"flex", gap:3, marginBottom:"1.25rem" }}>
        {Array.from({length:KYS_BLOCKS}).map((_,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=block ? C.accent : "rgba(240,236,224,0.1)", transition:"background 0.3s" }} />
        ))}
      </div>
      {blockTitles[block] && <>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:"0.2rem" }}>{block+1} / {KYS_BLOCKS}</p>
        <p style={{ fontSize:"1rem", fontWeight:800, color:C.text, marginBottom:"1.25rem", letterSpacing:"-0.02em" }}>{blockTitles[block]}</p>
      </>}

      {/* Block 0 — Sobre vos */}
      {block===0 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Nombre <span style={{color:"#c20000"}}>*</span></label>
          <input value={fields.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Tu nombre completo"
            style={{...ci, borderColor:errors.nombre?"#c20000":"rgba(240,236,224,0.07)"}} />
          {errors.nombre&&<p style={fbErr}>{errors.nombre}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Email <span style={{color:"#c20000"}}>*</span></label>
          <input value={fields.email} onChange={e=>set("email",e.target.value)} placeholder="tu@email.com"
            style={{...ci, borderColor:errors.email?"#c20000":"rgba(240,236,224,0.07)"}} />
          {errors.email&&<p style={fbErr}>{errors.email}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Área profesional <span style={{color:"#c20000"}}>*</span></label>
          <select value={fields.area} onChange={e=>set("area",e.target.value)}
            style={{...kysSel, borderColor:errors.area?"#c20000":"rgba(240,236,224,0.07)"}}>
            <option value="">Seleccioná...</option>
            {KYS_AREAS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          {errors.area&&<p style={fbErr}>{errors.area}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Cargo / Puesto <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <input value={fields.cargo} onChange={e=>set("cargo",e.target.value)} placeholder="Ej: Gerente de ventas" style={ci} />
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿En qué contextos usás el inglés? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Reuniones","Emails","Presentaciones","Llamadas","Clientes externos","Reportes","No lo uso aún"].map(v=>(
              <KysPill key={v} label={v} checked={fields.contextos.includes(v)} onClick={()=>toggle("contextos",v)} />
            ))}
          </div>
          {errors.contextos&&<p style={fbErr}>{errors.contextos}</p>}
        </div>
        <div>
          <label style={cl}>¿Cuál es tu meta con el inglés? <span style={{color:"#c20000"}}>*</span></label>
          <textarea value={fields.meta} onChange={e=>set("meta",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5, borderColor:errors.meta?"#c20000":"rgba(240,236,224,0.07)"}}
            placeholder="Contanos qué querés lograr..." />
          {errors.meta&&<p style={fbErr}>{errors.meta}</p>}
        </div>
      </div>}

      {/* Block 1 — Historial */}
      {block===1 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Hace cuánto estudiás inglés? <span style={{color:"#c20000"}}>*</span></label>
          <select value={fields.anios} onChange={e=>set("anios",e.target.value)}
            style={{...kysSel, borderColor:errors.anios?"#c20000":"rgba(240,236,224,0.07)"}}>
            <option value="">Seleccioná...</option>
            {["Menos de 1 año","1–2 años","3–5 años","6–10 años","Más de 10 años"].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          {errors.anios&&<p style={fbErr}>{errors.anios}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué métodos probaste antes? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Academia tradicional","Apps","Tutor particular","Autodidacta","Plataforma online","Inmersión","Ninguno"].map(v=>(
              <KysPill key={v} label={v} checked={fields.metodos.includes(v)} onClick={()=>toggle("metodos",v)} />
            ))}
          </div>
          {errors.metodos&&<p style={fbErr}>{errors.metodos}</p>}
        </div>
        <div>
          <label style={cl}>¿Por qué no funcionó? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.por_que_no} onChange={e=>set("por_que_no",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}}
            placeholder="Si ninguno funcionó del todo, contanos por qué..." />
        </div>
      </div>}

      {/* Block 2 — Emociones */}
      {block===2 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué sentís cuando cometés un error? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Vergüenza","Frustración","Bloqueo mental","Ansiedad","No me afecta","Me motiva"].map(v=>(
              <KysPill key={v} label={v} checked={fields.emocion_error.includes(v)} onClick={()=>toggle("emocion_error",v)} />
            ))}
          </div>
          {errors.emocion_error&&<p style={fbErr}>{errors.emocion_error}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Algo más <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <input value={fields.emocion_extra} onChange={e=>set("emocion_extra",e.target.value)} style={ci} placeholder="Otra emoción..." />
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cuándo preferís que te corrijan? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["En el momento","Al final de la clase","Lo menos posible","No sé todavía"].map(v=>(
              <KysPill key={v} label={v} checked={fields.correccion===v} onClick={()=>set("correccion",v)} />
            ))}
          </div>
          {errors.correccion&&<p style={fbErr}>{errors.correccion}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cuál fue tu último bloqueo al hablar? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.bloqueo} onChange={e=>set("bloqueo",e.target.value)} rows={2}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Contanos una situación concreta..." />
        </div>
        <div>
          <label style={cl}>¿Cuándo sentís más presión al hablar? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Con nativos","Con colegas que me conocen","Con ambos por igual","Con ninguno"].map(v=>(
              <KysPill key={v} label={v} checked={fields.miedo_tipo===v} onClick={()=>set("miedo_tipo",v)} />
            ))}
          </div>
          {errors.miedo_tipo&&<p style={fbErr}>{errors.miedo_tipo}</p>}
        </div>
      </div>}

      {/* Block 3 — Estilo */}
      {block===3 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cómo aprendés mejor? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Teoría primero","Directo a la práctica","Combinación"].map(v=>(
              <KysPill key={v} label={v} checked={fields.estilo===v} onClick={()=>set("estilo",v)} />
            ))}
          </div>
          {errors.estilo&&<p style={fbErr}>{errors.estilo}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué idioma preferís en clase? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Mayoría inglés","Mezcla inglés / español","Español para lo complejo"].map(v=>(
              <KysPill key={v} label={v} checked={fields.idioma_clase===v} onClick={()=>set("idioma_clase",v)} />
            ))}
          </div>
          {errors.idioma_clase&&<p style={fbErr}>{errors.idioma_clase}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Cuando no entendés algo, ¿qué hacés? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Pregunto","Finjo que entendí","Lo busco después","Depende"].map(v=>(
              <KysPill key={v} label={v} checked={fields.no_entiende===v} onClick={()=>set("no_entiende",v)} />
            ))}
          </div>
          {errors.no_entiende&&<p style={fbErr}>{errors.no_entiende}</p>}
        </div>
        <div>
          <label style={cl}>¿Cuáles son tus áreas más débiles? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Speaking","Listening","Writing","Grammar","Vocabulario","Pronunciación","Confianza"].map(v=>(
              <KysPill key={v} label={v} checked={fields.debilidades.includes(v)} onClick={()=>toggle("debilidades",v)} />
            ))}
          </div>
          {errors.debilidades&&<p style={fbErr}>{errors.debilidades}</p>}
        </div>
      </div>}

      {/* Block 4 — Compromiso */}
      {block===4 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cuánto tiempo podés estudiar fuera de clase? <span style={{color:"#c20000"}}>*</span></label>
          <select value={fields.tiempo_extra} onChange={e=>set("tiempo_extra",e.target.value)}
            style={{...kysSel, borderColor:errors.tiempo_extra?"#c20000":"rgba(240,236,224,0.07)"}}>
            <option value="">Seleccioná...</option>
            {["Menos de 15 min","15–30 min","30–60 min","Más de 1 hora","No estudio fuera de clase"].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          {errors.tiempo_extra&&<p style={fbErr}>{errors.tiempo_extra}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <KysScaleInput label="¿Qué tan urgente es mejorar tu inglés?" hint="1 = sin prisa, 10 = necesito mejorar ya"
            value={fields.urgencia} onSelect={v=>set("urgencia",v)} error={errors.urgencia} />
        </div>
        <div>
          <label style={cl}>¿Qué te hizo abandonar antes? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.abandono} onChange={e=>set("abandono",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Si empezaste y paraste, ¿qué pasó?" />
        </div>
      </div>}

      {/* Block 5 — Intereses */}
      {block===5 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué consumís en inglés en tu tiempo libre? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Series y películas","Música","Podcasts","Libros y artículos","YouTube","Redes sociales","Videojuegos","Noticias","Ninguno"].map(v=>(
              <KysPill key={v} label={v} checked={fields.consumo.includes(v)} onClick={()=>toggle("consumo",v)} />
            ))}
          </div>
          {errors.consumo&&<p style={fbErr}>{errors.consumo}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Sobre qué temas te animás a opinar? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Política","Tecnología","Deportes","Arte y cultura","Economía","Ciencia","Entretenimiento","Medioambiente","Redes sociales"].map(v=>(
              <KysPill key={v} label={v} checked={fields.temas_opinion.includes(v)} onClick={()=>toggle("temas_opinion",v)} />
            ))}
          </div>
          {errors.temas_opinion&&<p style={fbErr}>{errors.temas_opinion}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>En un debate, preferís… <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Debatir activamente","Escuchar","Depende del tema"].map(v=>(
              <KysPill key={v} label={v} checked={fields.debate===v} onClick={()=>set("debate",v)} />
            ))}
          </div>
          {errors.debate&&<p style={fbErr}>{errors.debate}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Hay algún tema que preferís evitar? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <input value={fields.tema_evitar} onChange={e=>set("tema_evitar",e.target.value)} style={ci} placeholder="Ej: política, religión..." />
        </div>
        <div>
          <label style={cl}>¿De qué podés hablar horas? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.temas_pasion} onChange={e=>set("temas_pasion",e.target.value)} rows={2}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Tus temas de pasión..." />
        </div>
      </div>}

      {/* Block 6 — Para tu coach */}
      {block===6 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué más debería saber tu coach? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.coach_saber} onChange={e=>set("coach_saber",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Cualquier info que te parezca útil..." />
        </div>
        <div>
          <label style={cl}>Comentario adicional <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.extra} onChange={e=>set("extra",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Algo que quieras agregar..." />
        </div>
      </div>}

      {/* Nav */}
      <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.5rem" }}>
        {block>0 && (
          <button type="button" onClick={back}
            style={{ flex:1, padding:"0.8rem", borderRadius:50, border:`1px solid ${C.border2}`, background:"transparent", color:C.text3, fontSize:13, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>
            ← Atrás
          </button>
        )}
        {block<KYS_BLOCKS-1 ? (
          <button type="button" onClick={next}
            style={{ flex:block>0?2:1, padding:"0.8rem", borderRadius:50, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>
            Siguiente →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting}
            style={{ flex:2, padding:"0.8rem", borderRadius:50, border:"none", background:submitting?C.surface2:C.accent, color:submitting?C.text3:C.bg, fontSize:13, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:submitting?"default":"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
            {submitting ? "Enviando..." : "Enviar →"}
          </button>
        )}
      </div>
    </div>
  );
}

// PROFILE VIEW
function ProfileView({ user, defaultSection = "bio", setActive }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", teams_email: "" });
  const isBio = defaultSection !== "me";

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
  const rolLabels = ROL_LABELS;
  const rolColors = ROL_COLORS;

  if (loading) return (
    <div style={{ display: "flex", gap: 6, padding: "2rem" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, width: "100%", overflowX: "hidden" }}>
      {/* ← Settings back button */}
      <button onClick={() => setActive?.("settings")}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "0 0 1.25rem 0", WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.color = C.text2}
        onMouseLeave={e => e.currentTarget.style.color = C.text3}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Settings
      </button>
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

      {/* ── Personal Info (direct, no dropdown) ── */}
      {isBio && (
        <>
          <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                { label: "First name", key: "nombre",   placeholder: "Tu nombre" },
                { label: "Last name",  key: "apellido", placeholder: "Tu apellido" },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Login email</label>
              <input value={user.email} disabled
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text3, fontFamily: "inherit", outline: "none", cursor: "not-allowed" }} />
              <p style={{ fontSize: 11, color: C.text3 }}>Este correo no se puede cambiar — es el que usás para entrar a la app.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Teams email</label>
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
        </>
      )}

      {/* ── About me — KYS form only, no BIO ── */}
      {!isBio && (
        <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", width: "100%" }}>
          <p style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1, marginBottom: "0.4rem" }}>Sobre mí</p>
          <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Respondé con honestidad, no hay respuestas incorrectas. Esta información es exclusiva para nuestros coaches y nos permite personalizar cada una de tus clases.
          </p>
          <KYSForm user={user} profile={profile} compact />
        </div>
      )}
    </div>
  );
}

// ── KYC COACH VIEW ────────────────────────────────────────────
function KYCCoachView({ user, setActive }) {
  const [pg, setPg]       = useState(0);
  const [scales, setScales] = useState({});
  const [chips,  setChips]  = useState({});
  const [vals, setVals] = useState({
    nombre: [user?.nombre, user?.apellido].filter(Boolean).join(" "),
    pais: "", tiempo: "",
    porq: "", estudiante: "",
    parte: "", recomienda: "",
    llegaste: "", reto: "",
    salida: "", final_msg: "",
  });

  const setS = (k, v) => setScales(s => ({ ...s, [k]: v }));
  const togC = (k, v) => setChips(c => {
    const a = c[k] || [];
    return { ...c, [k]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] };
  });
  const sv  = (k, v) => setVals(f => ({ ...f, [k]: v }));
  const isC = (k, v) => (chips[k] || []).includes(v);

  const kIn = { ...fbInput };
  const kLb = { ...fbLabel };
  const kTa = { ...kIn, resize: "vertical", minHeight: 100, lineHeight: 1.6 };
  const kQ  = { fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: "0.55rem", fontFamily: "inherit" };
  const kHn = { fontSize: 12, color: C.text3, lineHeight: 1.5, marginBottom: "0.5rem", fontFamily: "inherit" };
  const kFd = { marginBottom: "1.15rem" };
  const kDv = { borderTop: `1px solid ${C.border}`, margin: "1.25rem 0" };
  const kSel = { ...kIn, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(240,236,224,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2rem", cursor: "pointer" };

  const chips_ = (gk, items) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(([v, l]) => {
        const on = isC(gk, v);
        return (
          <button key={v} onClick={() => togC(gk, v)}
            style={{ border: `1px solid ${on ? C.text : C.border2}`, borderRadius: 20, padding: "5px 13px", fontSize: 11, cursor: "pointer", color: on ? C.text : C.text2, background: on ? "rgba(240,236,224,0.11)" : "transparent", transition: "all 0.13s", fontFamily: "inherit", WebkitTapHighlightColor: "transparent" }}>
            {l}
          </button>
        );
      })}
    </div>
  );

  const scale_ = (sk, lL, rL) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: C.text3 }}>{lL}</span>
        <span style={{ fontSize: 10, color: C.text3 }}>{rL}</span>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        {[1, 2, 3, 4, 5].map(v => {
          const on = scales[sk] === v;
          return (
            <button key={v} onClick={() => setS(sk, v)}
              style={{ flex: 1, height: 38, border: `1px solid ${on ? C.text : C.border2}`, borderRadius: 7, background: on ? "rgba(240,236,224,0.14)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: on ? C.text : C.text2, transition: "all 0.13s", WebkitTapHighlightColor: "transparent" }}>
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );

  const nav_ = (back, onNext, nextLbl = "Siguiente →") => (
    <div style={{ display: "flex", gap: 8, marginTop: "1.5rem" }}>
      {back !== null && (
        <button onClick={() => setPg(back)}
          style={{ flex: 1, padding: "0.85rem", borderRadius: 50, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
          ← Atrás
        </button>
      )}
      <button onClick={onNext}
        style={{ flex: back !== null ? 2 : undefined, width: back !== null ? undefined : "100%", padding: "0.85rem", borderRadius: 50, border: "none", background: C.text, color: C.bg, fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
        {nextLbl}
      </button>
    </div>
  );

  const hdr_ = (tag, desc) => (
    <div style={{ marginBottom: "1.25rem", fontFamily: "inherit" }}>
      <p style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1, marginBottom: desc ? "0.4rem" : 0, fontFamily: "inherit" }}>{tag}</p>
      {desc && <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.6, fontFamily: "inherit", marginBottom: pg > 0 && pg < 5 ? "0.85rem" : 0 }}>{desc}</p>}
      {pg > 0 && pg < 5 && (
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= pg ? C.text2 : C.border }} />
          ))}
        </div>
      )}
    </div>
  );

  const scaleBar = (k, label) => {
    const v = scales[k] || 0;
    const col = v >= 4 ? C.green : v >= 3 ? C.amber : v ? C.red : C.text3;
    return (
      <div key={k} style={{ marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.text2 }}>{label}</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: C.text3 }}>{v ? `${v}/5` : "–"}</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: 4, width: v ? `${(v / 5) * 100}%` : "0%", background: col, borderRadius: 2, transition: "width 0.6s ease" }} />
        </div>
      </div>
    );
  };

  const IC = { alerta: C.red, positivo: C.green, oportunidad: C.green, accion: C.amber };
  const II = { alerta: "⚠", positivo: "✓", oportunidad: "◈", accion: "→" };

  const buildInsights = () => {
    const ins = [];
    const { temperatura, impacto, conexion, pasion_ingles, crecer_economico } = scales;
    const ch = chips;
    if (temperatura) {
      if (temperatura <= 2) ins.push({ tipo: "alerta",   txt: `Temperatura crítica (${temperatura}/5). Riesgo de desvinculación.` });
      else if (temperatura === 3) ins.push({ tipo: "accion",   txt: `Temperatura media (${temperatura}/5). Explorar qué falta para mayor compromiso.` });
      else ins.push({ tipo: "positivo", txt: `Temperatura alta (${temperatura}/5). Momento ideal para nuevas responsabilidades.` });
    }
    if (conexion && conexion <= 2) ins.push({ tipo: "alerta", txt: `Poca conexión con el equipo (${conexion}/5). Considerar espacios comunitarios.` });
    if ((ch.roles || []).includes("mentor"))    ins.push({ tipo: "oportunidad", txt: "Interesado/a en mentoría. Candidato/a para coach senior." });
    if ((ch.roles || []).includes("lider"))     ins.push({ tipo: "oportunidad", txt: "Abierto/a a coordinación. Evaluar para roles de liderazgo." });
    if ((ch.roles || []).includes("contenido")) ins.push({ tipo: "oportunidad", txt: "Quiere crear material pedagógico. Potencial para currículo." });
    if (crecer_economico && crecer_economico >= 4) ins.push({ tipo: "accion", txt: `Alta motivación económica (${crecer_economico}/5). Mostrar ruta clara de crecimiento.` });
    if ((ch.aprende || []).includes("mucho")) ins.push({ tipo: "positivo", txt: "Aprende activamente por cuenta propia. Alta inversión de capacitación." });
    if ((ch.aprende || []).includes("no"))    ins.push({ tipo: "accion",   txt: "No prioriza aprendizaje autónomo. Beneficiaría de estructura interna." });
    if ((ch.actividad || []).includes("transicion")) ins.push({ tipo: "oportunidad", txt: "En transición a Dilo como fuente principal. Alta retención potencial." });
    return ins;
  };

  // ── Page renderers ───────────────────────────────────────────

  const renderIntro = () => (
    <>
      {hdr_("Know your coach", "Este formulario no es un examen. Es una conversación: queremos entender qué te mueve y cómo crecer juntos.")}
      <div style={kFd}>
        <label style={kLb}>Nombre completo</label>
        <input value={vals.nombre} onChange={e => sv("nombre", e.target.value)} placeholder="Tu nombre completo" style={kIn} />
      </div>
      <div style={kFd}>
        <label style={kLb}>Tiempo en Dilo</label>
        <select value={vals.tiempo} onChange={e => sv("tiempo", e.target.value)} style={kSel}>
          <option value="">Seleccioná...</option>
          {["Menos de 3 meses","3–6 meses","6–12 meses","Más de 1 año"].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={kFd}>
        <label style={kLb}>Niveles que enseñás</label>
        {chips_("niveles", [["Foundation","Foundation"],["A1","A1"],["A2","A2"],["B1","B1"],["B2","B2"],["C1","C1"],["C2","C2"]])}
      </div>
      {nav_(null, () => setPg(1), "Comenzar →")}
    </>
  );

  const renderProposito = () => (
    <>
      {hdr_("Propósito", "Queremos entender el motivo real, no el oficial. Sin filtros.")}
      <div style={kFd}>
        <p style={kQ}>¿Por qué enseñás inglés? El motivo de verdad.</p>
        <p style={kHn}>No el que ponés en el CV. Lo que realmente te movió a estar acá.</p>
        <textarea value={vals.porq} onChange={e => sv("porq", e.target.value)} placeholder="Escribí con libertad..." style={kTa} />
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué momento de una clase te da más satisfacción?</p>
        {chips_("momento", [["breakthrough","Cuando alguien entiende algo que no podía"],["fluency","Primera vez que habla con fluidez"],["confianza","Cuando ganan confianza visible"],["feedback","Cuando me dan feedback positivo"],["conexion","La conexión real en la conversación"],["otro","Otro"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Cuánto sentís que tu trabajo impacta la vida de tus estudiantes?</p>
        {scale_("impacto", "Poco impacto", "Impacto enorme")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué tipo de estudiante hace que tu trabajo valga la pena?</p>
        <textarea value={vals.estudiante} onChange={e => sv("estudiante", e.target.value)} placeholder="Descríbelo..." style={kTa} />
      </div>
      {nav_(0, () => setPg(2))}
    </>
  );

  const renderPertenencia = () => (
    <>
      {hdr_("Pertenencia", "Queremos saber si te sentís parte de algo más grande que una clase.")}
      <div style={kFd}>
        <p style={kQ}>¿Qué tan conectado/a te sentís con el equipo de coaches de Dilo?</p>
        {scale_("conexion", "Muy desconectado/a", "Muy conectado/a")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué es lo que más valorás de trabajar con Dilo?</p>
        {chips_("valor", [["autonomia","Autonomía y flexibilidad"],["respaldo","Respaldo y soporte"],["metodologia","Metodología clara"],["ambiente","Ambiente entre coaches"],["mision","La misión"],["otro","Otro"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué te haría sentir más parte de Dilo?</p>
        <p style={kHn}>Sé honesto/a. Esto nos ayuda a mejorar.</p>
        <textarea value={vals.parte} onChange={e => sv("parte", e.target.value)} placeholder="Espacio tuyo..." style={kTa} />
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Recomendarías a alguien que enseñe con Dilo? ¿Por qué?</p>
        <textarea value={vals.recomienda} onChange={e => sv("recomienda", e.target.value)} placeholder="¿Qué le dirías?" style={kTa} />
      </div>
      {nav_(1, () => setPg(3))}
    </>
  );

  const renderPasion = () => (
    <>
      {hdr_("Pasión", "Queremos entender qué hay detrás de tu relación con el idioma.")}
      <div style={kFd}>
        <p style={kQ}>¿Cómo llegaste al inglés? ¿Cuándo se convirtió en parte de tu vida?</p>
        <textarea value={vals.llegaste} onChange={e => sv("llegaste", e.target.value)} placeholder="Contá tu historia con el idioma..." style={kTa} />
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué tan apasionado/a estás por enseñar inglés específicamente?</p>
        {scale_("pasion_ingles", "Me gusta enseñar en general", "El inglés es especial para mí")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Seguís aprendiendo sobre inglés o metodología por tu cuenta?</p>
        {chips_("aprende", [["mucho","Sí, constantemente"],["aveces","A veces"],["poco","Poco, lo que ya sé me alcanza"],["no","No lo he priorizado"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Cuál es el mayor reto pedagógico que enfrentás hoy?</p>
        <textarea value={vals.reto} onChange={e => sv("reto", e.target.value)} placeholder="El desafío real, no el políticamente correcto..." style={kTa} />
      </div>
      {nav_(2, () => setPg(4))}
    </>
  );

  const renderCrecimiento = () => (
    <>
      {hdr_("Crecimiento", "Motivación económica y ambición dentro de Dilo.")}
      <div style={kFd}>
        <p style={kQ}>¿Las clases en Dilo son tu actividad principal o complementaria?</p>
        {chips_("actividad", [["principal","Fuente principal de ingresos"],["complementaria","Ingreso complementario"],["transicion","En transición a principal"],["otro","Otra situación"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué tan importante es aumentar tus horas o ingresos dentro de Dilo?</p>
        {scale_("crecer_economico", "No es prioridad", "Es muy importante")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Te interesaría asumir roles más allá de dar clases?</p>
        {chips_("roles", [["mentor","Ser mentor de otros coaches"],["contenido","Crear material pedagógico"],["lider","Coordinación o liderazgo"],["nada","Prefiero solo dar clases"],["abierto","Abierto a lo que venga"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué necesitaría pasar para que dejaras de dar clases en Dilo?</p>
        <p style={kHn}>Esta pregunta nos ayuda a entender tus prioridades reales.</p>
        <textarea value={vals.salida} onChange={e => sv("salida", e.target.value)} placeholder="Honestidad total acá..." style={kTa} />
      </div>
      <div style={kDv} />
      <div style={kFd}>
        <p style={kQ}>¿Cómo te sentís hoy con tu trabajo en Dilo? Temperatura general.</p>
        {scale_("temperatura", "Pensando en salir", "Muy comprometido/a")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Hay algo que quisieras que Ricardo supiera sobre vos?</p>
        <textarea value={vals.final_msg} onChange={e => sv("final_msg", e.target.value)} placeholder="Espacio libre para lo que quieras decir..." style={kTa} />
      </div>
      {nav_(3, () => setPg(5), "Ver perfil motivacional →")}
    </>
  );

  const renderDash = () => {
    const insights = buildInsights();
    const allChips = [...(chips.momento || []), ...(chips.roles || []), ...(chips.actividad || []), ...(chips.aprende || []), ...(chips.valor || [])];
    const openQs = [
      { q: "¿Por qué enseñás inglés?",           v: vals.porq },
      { q: "Tipo de estudiante ideal",            v: vals.estudiante },
      { q: "Para sentirme más parte de Dilo",     v: vals.parte },
      { q: "¿Recomendarías enseñar en Dilo?",     v: vals.recomienda },
      { q: "Historia con el inglés",              v: vals.llegaste },
      { q: "Mayor reto pedagógico",               v: vals.reto },
      { q: "Motivo para salir",                   v: vals.salida },
      { q: "Mensaje para Ricardo",                v: vals.final_msg },
    ].filter(x => x.v && x.v.trim());
    const name = vals.nombre || [user?.nombre, user?.apellido].filter(Boolean).join(" ") || "Coach";
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <>
        <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(240,236,224,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: C.text, flexShrink: 0, fontFamily: "monospace" }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 300, color: C.text }}>{name}</p>
            <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{[vals.pais, vals.tiempo].filter(Boolean).join(" · ") || "Dilo Club"}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "0.85rem" }}>
          {[["temperatura","Temperatura"],["impacto","Impacto percibido"],["conexion","Conexión equipo"],["pasion_ingles","Pasión por inglés"]].map(([k, l]) => {
            const v = scales[k];
            const col = v >= 4 ? C.green : v >= 3 ? C.amber : v ? C.red : C.text3;
            return (
              <div key={k} style={{ ...CARD, borderRadius: 10, padding: "0.85rem", textAlign: "center" }}>
                <p style={{ fontSize: 22, fontWeight: 300, color: col, fontFamily: "monospace" }}>{v ? `${v}/5` : "–"}</p>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: C.text3, marginTop: 3 }}>{l}</p>
              </div>
            );
          })}
        </div>
        <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "1rem" }}>Dimensiones motivacionales</p>
          {[["temperatura","Temperatura (compromiso)"],["impacto","Propósito e impacto"],["conexion","Pertenencia al equipo"],["pasion_ingles","Pasión por enseñar inglés"],["crecer_economico","Motivación económica"]].map(([k, l]) => scaleBar(k, l))}
        </div>
        {allChips.length > 0 && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>Motivadores declarados</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {allChips.map(t => (
                <span key={t} style={{ background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {insights.length > 0 && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>Notas para Ricardo</p>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 9, padding: "0.65rem 0.85rem", borderRadius: 8, marginBottom: i < insights.length - 1 ? "0.5rem" : 0, background: `${IC[ins.tipo]}18`, alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, color: IC[ins.tipo], flexShrink: 0, marginTop: 1 }}>{II[ins.tipo]}</span>
                <span style={{ fontSize: 12, color: IC[ins.tipo], lineHeight: 1.6 }}>{ins.txt}</span>
              </div>
            ))}
          </div>
        )}
        {vals.porq && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>En sus propias palabras</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: C.text2, lineHeight: 1.8, borderLeft: `3px solid ${C.border2}`, paddingLeft: "1rem" }}>
              {vals.porq.slice(0, 280)}{vals.porq.length > 280 ? "…" : ""}
            </p>
          </div>
        )}
        {openQs.length > 0 && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>Respuestas abiertas</p>
            {openQs.map((q, i) => (
              <div key={i}>
                {i > 0 && <div style={{ borderTop: `1px solid ${C.border}`, margin: "0.85rem 0" }} />}
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>{q.q}</p>
                <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>{q.v}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => {
          setScales({}); setChips({});
          setVals({ nombre: [user?.nombre, user?.apellido].filter(Boolean).join(" "), pais: "", tiempo: "", porq: "", estudiante: "", parte: "", recomienda: "", llegaste: "", reto: "", salida: "", final_msg: "" });
          setPg(0);
        }} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: "0.25rem" }}>
          ← Nuevo formulario
        </button>
      </>
    );
  };

  const role     = user?.role || "coach";
  const rolColor = ROL_COLORS[role] || C.text2;
  const rolLabel = ROL_LABELS[role] || role;
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(" ") || user?.email || "Coach";
  const initials = fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
      {/* ← Settings back button */}
      <button onClick={() => setActive?.("settings")}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "0 0 1.25rem 0", fontFamily: "inherit", WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.color = C.text2}
        onMouseLeave={e => e.currentTarget.style.color = C.text3}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Settings
      </button>

      {/* Avatar + name + role */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{initials[0]}</p>
        </div>
        <div>
          <p style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{fullName}</p>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, background: `${rolColor}18`, color: rolColor, border: `1px solid ${rolColor}44` }}>
              {rolLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", width: "100%" }}>
        {pg === 0 && renderIntro()}
        {pg === 1 && renderProposito()}
        {pg === 2 && renderPertenencia()}
        {pg === 3 && renderPasion()}
        {pg === 4 && renderCrecimiento()}
        {pg === 5 && renderDash()}
      </div>
    </div>
  );
}

// ── SETTINGS VIEW ─────────────────────────────────────────────
function SettingsView({ user, setActive }) {
  const role  = user?.role || "student";
  const cards = [
    { label: "Personal Info", desc: "Edit your name, email and account details.", target: "perfil" },
    { label: "About me",      desc: "Fill out your learning profile for your coach.", target: "perfil-me" },
    ...(role !== "student" ? [{ label: "Know Your Coach", desc: "Cuestionario motivacional para el equipo de coaches.", target: "kyc-coach" }] : []),
  ];
  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {cards.map(card => (
          <button key={card.label} onClick={() => setActive(card.target)}
            style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 16, padding: "0.9rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", textAlign: "left", WebkitTapHighlightColor: "transparent", transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.borderColor = C.border2; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{card.label}</p>
              <p style={{ fontSize: 11, color: C.text3 }}>{card.desc}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, flexShrink: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>Open →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── USER MENU ─────────────────────────────────────────────────
function UserMenu({ user, role, collapsed, isMobile, onLogout, setActive, setCollapsed }) {
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
          {/* User info header */}
          <div style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.nombre ? `${user.nombre}${user.apellido ? " " + user.apellido : ""}` : user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p style={{ fontSize: 11, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>
              {user?.email || ""}
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: C.text3, opacity: 0.5 }}>Version 1.1</p>
          </div>
          {/* Menu items */}
          {[
            { label: "Settings",      icon: "settings", action: () => { setActive("settings"); setOpen(false); if (isMobile) setCollapsed(true); } },
            { label: "Notifications", icon: "bell",    action: () => setOpen(false) },
            { label: "Sign out",      icon: "logout",  action: () => { setOpen(false); onLogout(); } },
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
              {role && <span style={{ fontWeight: 400, color: C.text3 }}> · {role}</span>}
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
        left: isMobile ? (collapsed ? "-260px" : "0") : "0",
        top: 0, bottom: 0,
        width: isMobile ? 240 : (collapsed ? 56 : 240),
        minWidth: isMobile ? 240 : (collapsed ? 56 : 240),
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0, justifyContent: collapsed && !isMobile ? "center" : "flex-start", minHeight: 57, padding: "0 0.75rem" }}>
          {(!collapsed || isMobile) && <div style={{ flexShrink: 0, paddingLeft: "0.25rem", display: "flex", alignItems: "center" }}><DiloLogo height={26} /></div>}
          {(!collapsed || isMobile) && <div style={{ flex: 1 }} />}
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
                    padding: isMobile ? "0.65rem 0.75rem" : "0.55rem 0.75rem",
                    minHeight: isMobile ? 44 : 36,
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
                    <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#25D366", flexShrink: 0 }} />
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
        <UserMenu user={user} role={role} collapsed={collapsed} isMobile={isMobile} onLogout={onLogout} setActive={setActive} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}

// ── VIEW TITLES (shown in top bar) ────────────────────────────
const VIEW_TITLES = {
  dashboard:          "Dashboard",
  calendario:         "Calendar",
  feedbacks:          "FeedbackHub",
  "send-feedback":    "FeedbackHub",
  "class-feedback":   "FeedbackHub",
  "student-feedback": "FeedbackHub",
  "student-surveys":  "FeedbackHub",
  tps:                "Training & Practice",
  "dilo-coach":       "Prep Class",
  "dilo-student":     "Prep Class",
  estudiantes:        "Attendance",
  coaches:            "Coaches",
  "my-hours":         "My Hours",
  students:           "Students",
  metricas:           "Metrics",
  invites:            "Invitations",
  perfil:             "Profile",
  "perfil-me":        "Profile",
  "kyc-coach":        "Settings",
  settings:           "Settings",
};

// ── STUDENTS VIEW ──────────────────────────────────────────────
// CR 2026 holidays that fall on weekdays (Mon–Fri)
const CR_HOLIDAYS = new Set([
  "2026-01-01","2026-04-02","2026-04-03","2026-05-01",
  "2026-08-31","2026-09-15","2026-12-01",
]);
const CLASS_END  = new Date(2026, 11, 18); // Dec 18, 2026 inclusive
const USD_RATE   = 450; // ₡ per $

function stuCountDays(year, month, dayNums) {
  if (!dayNums?.length) return 0;
  const last = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month - 1, d);
    if (date > CLASS_END) break;
    if (dayNums.includes(date.getDay())) {
      const iso = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if (!CR_HOLIDAYS.has(iso)) n++;
    }
  }
  return n;
}

function stuCalc(s, year, month) {
  const rate = parseFloat(s.price_per_hour) || 0;
  const disc = parseFloat(s.discount) || 0;
  const days = s.days ? s.days.split(",").map(Number).filter(Boolean) : [];
  const rateC = s.currency === "USD" ? rate * USD_RATE : rate;
  // Numeric groups always use flat monthly rate (no per-hour counter)
  const isNumericGroup = /^\d+$/.test(String(s.group_number || "").trim());
  if (s.billing_type === "monthly" || (isNumericGroup && s.billing_type !== "package")) {
    const net = rateC * (1 - disc / 100);
    const iva = net * 0.02;
    return { hrs: null, net, iva, total: Math.round(net + iva) };
  }
  if (s.billing_type === "package") {
    return { hrs: null, net: 0, iva: 0, total: 0 };
  }
  const hrs = stuCountDays(year, month, days);
  const net = hrs * rateC * (1 - disc / 100);
  const iva = net * 0.02;
  return { hrs, net, iva, total: Math.round(net + iva) };
}

const STU_LEVELS    = ["A1","A2","B1","B2","C1","C2"];
const STU_WEEKDAYS  = [{v:1,l:"Mon"},{v:2,l:"Tue"},{v:3,l:"Wed"},{v:4,l:"Thu"},{v:5,l:"Fri"}];
const STU_SCHEDULES = ["Morning","Afternoon","Evening"];
const STU_MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STU_BLANK = {
  name:"", email:"", group_number:"", level:"A2",
  billing_type:"weekly", days:[], schedule:"Morning", class_time:"09:00",
  company:"Dilo", package_hours:"", package_remaining:"", price_per_hour:"", currency:"CRC",
  discount:"0", pay_day:"30", comments:"",
};

function StudentsView() {
  const [students,   setStudents]   = useState(null);
  const [billing,    setBilling]    = useState({});
  const [payFilter,  setPayFilter]  = useState("all");
  const [mOffset,    setMOffset]    = useState(() => {
    const n = new Date();
    return Math.max(0, (2026 - n.getFullYear()) * 12 + (5 - n.getMonth()));
  });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({ ...STU_BLANK, days: [] });
  const [formSaving, setFormSaving] = useState(false);
  const [delId,      setDelId]      = useState(null);
  const [collapsed,  setCollapsed]  = useState(new Set());
  const [toggling,   setToggling]   = useState({});

  const now   = new Date();
  const base  = new Date(now.getFullYear(), now.getMonth() + mOffset, 1);
  const year  = base.getFullYear();
  const month = base.getMonth() + 1;
  const ym    = `${year}-${String(month).padStart(2,"0")}`;
  const atMin = year * 12 + month <= 2026 * 12 + 6;

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { if (students) loadBilling(); }, [ym, students]);

  const loadStudents = async () => {
    setLoading(true); setError(null);
    const { data, error: e } = await supabase
      .from("students").select("*")
      .eq("active", true)
      .order("group_number").order("created_at");
    if (e) setError(e.message); else setStudents(data || []);
    setLoading(false);
  };

  const loadBilling = async () => {
    if (!students?.length) return;
    const { data } = await supabase
      .from("student_billing").select("*")
      .in("student_id", students.map(s => s.id))
      .eq("year_month", ym);
    const map = {};
    (data || []).forEach(b => { map[b.student_id] = b; });
    setBilling(map);
  };

  const togglePaid = async (studentId) => {
    const cur = billing[studentId]?.paid || false;
    const nxt = !cur;
    const today = new Date().toISOString().split("T")[0];
    setToggling(p => ({ ...p, [studentId]: true }));
    setBilling(p => ({ ...p, [studentId]: { ...(p[studentId] || {}), paid: nxt, paid_date: nxt ? today : null } }));
    await supabase.from("student_billing").upsert(
      { student_id: studentId, year_month: ym, paid: nxt, paid_date: nxt ? today : null },
      { onConflict: "student_id,year_month" }
    );
    setToggling(p => ({ ...p, [studentId]: false }));
  };

  const saveStudent = async () => {
    if (!form.name.trim()) return;
    setFormSaving(true);
    const days = Array.isArray(form.days) ? form.days.join(",") : (form.days || "");
    const payload = {
      name: form.name.trim(), email: form.email.trim(), group_number: form.group_number.trim(),
      level: form.level, billing_type: form.billing_type, days,
      schedule: form.schedule, class_time: form.class_time, company: form.company,
      package_hours: form.billing_type === "package" ? (parseInt(form.package_hours) || 0) : null,
      package_remaining: form.billing_type === "package" ? (parseInt(form.package_remaining) ?? parseInt(form.package_hours) ?? null) : null,
      price_per_hour: parseFloat(form.price_per_hour) || 0,
      currency: form.currency, discount: parseFloat(form.discount) || 0,
      pay_day: parseInt(form.pay_day) || 30, comments: form.comments, active: true,
    };
    if (modal.mode === "edit") {
      await supabase.from("students").update(payload).eq("id", modal.data.id);
    } else {
      await supabase.from("students").insert(payload);
    }
    setFormSaving(false); setModal(null); loadStudents();
  };

  const deleteStudent = async (id) => {
    await supabase.from("students").update({ active: false }).eq("id", id);
    setDelId(null); loadStudents();
  };

  const groups = React.useMemo(() => {
    if (!students) return [];
    const map = {};
    students.forEach(s => {
      if (payFilter !== "all" && String(s.pay_day) !== payFilter) return;
      const g = s.group_number?.trim() || "Private";
      if (!map[g]) map[g] = [];
      map[g].push(s);
    });
    return Object.entries(map).sort(([a],[b]) => {
      if (a === "Private" && b !== "Private") return 1;
      if (b === "Private" && a !== "Private") return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [students, payFilter]);

  const summary = React.useMemo(() => {
    if (!students) return { count: 0, d15:{rev:0,col:0,pen:0}, d30:{rev:0,col:0,pen:0} };
    let d15 = { rev:0, col:0 }, d30 = { rev:0, col:0 };
    students.forEach(s => {
      const { total } = stuCalc(s, year, month);
      const bucket = parseInt(s.pay_day) === 15 ? d15 : d30;
      bucket.rev += total;
      if (billing[s.id]?.paid) bucket.col += total;
    });
    return {
      count: students.length,
      d15: { rev: d15.rev, col: d15.col, pen: d15.rev - d15.col },
      d30: { rev: d30.rev, col: d30.col, pen: d30.rev - d30.col },
    };
  }, [students, billing, year, month]);

  const groupOptions = React.useMemo(() => {
    if (!students) return [];
    const seen = new Set();
    const opts = [];
    students.forEach(s => {
      const g = s.group_number?.trim();
      if (g && /^\d+$/.test(g) && !seen.has(g)) { seen.add(g); opts.push(g); }
    });
    return opts.sort((a,b) => a.localeCompare(b, undefined, { numeric:true }));
  }, [students]);

  const fmtC = n => `₡${Math.round(n).toLocaleString("es-CR")}`;
  const fmtDays = str => {
    if (!str) return "—";
    return str.split(",").map(Number).filter(Boolean)
      .map(n => ["","Mo","Tu","We","Th","Fr"][n] || "").join(" ");
  };

  const openAdd  = () => { setForm({ ...STU_BLANK, days: [] }); setModal({ mode: "add", data: null }); };
  const openEdit = s => {
    setForm({
      ...s,
      days: s.days ? s.days.split(",").map(Number).filter(Boolean) : [],
      discount: String(s.discount ?? 0),
      pay_day: String(s.pay_day ?? 30),
      price_per_hour: String(s.price_per_hour ?? ""),
      package_hours: String(s.package_hours ?? ""),
      package_remaining: String(s.package_remaining ?? s.package_hours ?? ""),
    });
    setModal({ mode: "edit", data: s });
  };
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleDay = d => setForm(p => {
    const cur = Array.isArray(p.days) ? p.days : [];
    return { ...p, days: cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort((a,b) => a-b) };
  });

  const applyGroup = (g) => {
    const ref = students?.find(s => s.group_number?.trim() === g);
    if (!ref) { setF("group_number", g); return; }
    setForm(p => ({
      ...p,
      group_number:  g,
      billing_type:  ref.billing_type  || p.billing_type,
      days:          ref.days ? ref.days.split(",").map(Number).filter(Boolean) : p.days,
      level:         ref.level         || p.level,
      schedule:      ref.schedule      || p.schedule,
      class_time:    ref.class_time    || p.class_time,
      company:       ref.company       || p.company,
      price_per_hour: ref.price_per_hour != null ? String(ref.price_per_hour) : p.price_per_hour,
      currency:      ref.currency      || p.currency,
      pay_day:       ref.pay_day != null ? String(ref.pay_day) : p.pay_day,
    }));
  };

  const inputSty = { width:"100%", background:C.surface2, border:`1px solid ${C.border2}`,
    borderRadius:8, padding:"0.45rem 0.65rem", color:C.text, fontSize:13,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const labelSty = { fontSize:11, fontWeight:700, color:C.text3, marginBottom:4,
    textTransform:"uppercase", letterSpacing:"0.06em", display:"block" };
  const chipSty = (active) => ({
    ...SEL(), padding:"0.28rem 0.6rem", fontSize:12, textAlign:"center",
    color: active ? C.text : C.text3,
    border: `1px solid ${active ? C.accent : C.border}`,
  });

  const TCOLS = "180px 110px 45px 90px 60px 95px 50px 80px 1fr 60px";

  const SummCard = ({ label, value, color = C.text }) => (
    <div style={{ ...CARD, borderRadius:12, padding:"0.85rem 1.1rem", flex:1, minWidth:130 }}>
      <p style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:"0.07em",
        textTransform:"uppercase", marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:17, fontWeight:900, color }}>{value}</p>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"clip", padding:"1.25rem",
      paddingLeft:"max(1.25rem,env(safe-area-inset-left))",
      paddingRight:"max(1.25rem,env(safe-area-inset-right))",
      paddingBottom:"max(1.5rem,env(safe-area-inset-bottom))",
      scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>

      {/* Month nav + filters + Add */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flex:1, minWidth:200 }}>
          <button onClick={() => !atMin && setMOffset(p => p-1)}
            style={SEL({ padding:"0.4rem 0.7rem", flexShrink:0, opacity: atMin ? 0.25 : 1, cursor: atMin ? "default" : "pointer" })}>←</button>
          <span style={{ fontSize:13, fontWeight:700, color:C.text, flex:1, textAlign:"center" }}>
            {STU_MONTH_NAMES[month-1]} {year}
          </span>
          <button onClick={() => setMOffset(p => p+1)} style={SEL({ padding:"0.4rem 0.7rem", flexShrink:0 })}>→</button>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {[["all","All"],["15","Day 15"],["30","Day 30"]].map(([v,l]) => (
            <button key={v} onClick={() => setPayFilter(v)}
              style={{ ...SEL(), padding:"0.4rem 0.65rem", fontSize:12,
                color: payFilter===v ? C.text : C.text3,
                border: `1px solid ${payFilter===v ? C.accent : C.border}`,
                fontWeight: payFilter===v ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        <button onClick={openAdd} style={{ ...SEL(), padding:"0.4rem 1rem", color:C.text,
          border:`1px solid ${C.border2}`, flexShrink:0 }}>
          + Add student
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display:"flex", gap:"0.65rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <SummCard label="Students" value={summary.count} />
        {[{label:"Day 15", d:summary.d15},{label:"Day 30", d:summary.d30}].map(({label,d}) => (
          <div key={label} style={{ ...CARD, borderRadius:12, padding:"0.85rem 1.1rem", flex:1, minWidth:180 }}>
            <p style={{ fontSize:10, fontWeight:800, color:C.text3, letterSpacing:"0.07em",
              textTransform:"uppercase", marginBottom:8 }}>{label}</p>
            <div style={{ display:"flex", gap:"1.1rem", flexWrap:"wrap" }}>
              {[["Expected", fmtC(d.rev), C.text], ["Collected", fmtC(d.col), C.green],
                ["Pending", fmtC(d.pen), d.pen > 0 ? "#d95f5f" : C.text3]].map(([lbl,val,col]) => (
                <div key={lbl}>
                  <p style={{ fontSize:10, color:C.text3, marginBottom:2 }}>{lbl}</p>
                  <p style={{ fontSize:14, fontWeight:800, color:col }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color:"#d95f5f", fontSize:13, marginBottom:"1rem" }}>{error}</p>}

      {loading && !students && (
        <div style={{ ...CARD, borderRadius:14, padding:"3rem", textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:8 }}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.map(([groupNum, gStudents]) => {
        const isCol = collapsed.has(groupNum);
        const gTotal = gStudents.reduce((s, st) => s + stuCalc(st, year, month).total, 0);
        const gPaid  = gStudents.reduce((s, st) => s + (billing[st.id]?.paid ? stuCalc(st, year, month).total : 0), 0);
        return (
          <div key={groupNum} style={{ marginBottom:"1.25rem" }}>
            {/* Group header */}
            <div onClick={() => setCollapsed(p => { const s = new Set(p); s.has(groupNum) ? s.delete(groupNum) : s.add(groupNum); return s; })}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"0.65rem 1rem", background:C.surface2, cursor:"pointer",
                borderRadius: isCol ? 12 : "12px 12px 0 0",
                border:`1px solid ${C.border}`, userSelect:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <span style={{ fontSize:13, fontWeight:800, color:C.text }}>
                  {/^\d+$/.test(groupNum) ? `Group ${groupNum}` : groupNum}
                </span>
                <span style={{ fontSize:11, color:C.text3 }}>{gStudents.length} student{gStudents.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <span style={{ fontSize:12, fontWeight:700, color: gPaid >= gTotal && gTotal > 0 ? C.green : gTotal > 0 ? "#d95f5f" : C.text3 }}>
                  {fmtC(gTotal)}
                </span>
                <span style={{ fontSize:14, color:C.text3, transition:"transform 0.2s",
                  display:"inline-block", transform: isCol ? "rotate(0deg)" : "rotate(90deg)" }}>›</span>
              </div>
            </div>

            {/* Table */}
            {!isCol && (
              <div style={{ ...CARD, borderRadius:"0 0 12px 12px", overflowX:"auto",
                WebkitOverflowScrolling:"touch", borderTop:"none" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:780 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                      {["Student","Days / Pkg","Hrs","Rate","Disc","Total","Pay day","Paid","Comments",""].map((h,i) => (
                        <th key={i} style={{ padding:"0.6rem 1rem", fontSize:10, fontWeight:800, color:C.text3,
                          letterSpacing:"0.07em", textTransform:"uppercase", textAlign:"left", background:C.surface2,
                          whiteSpace:"nowrap", position: i===0 ? "sticky" : "static", left: i===0 ? 0 : "auto" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gStudents.map((s, i) => {
                      const { hrs, total } = stuCalc(s, year, month);
                      const isPaid = billing[s.id]?.paid || false;
                      const rateLabel = s.currency === "USD"
                        ? `$${parseFloat(s.price_per_hour||0).toLocaleString("en-US")}`
                        : `₡${Math.round(parseFloat(s.price_per_hour||0)).toLocaleString("es-CR")}`;
                      return (
                        <tr key={s.id} style={{ borderBottom: i < gStudents.length-1 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding:"0.7rem 1rem", position:"sticky", left:0, background:C.surface2, whiteSpace:"nowrap" }}>
                            <p style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{s.name}</p>
                            {s.level && <p style={{ fontSize:10, color:C.text3 }}>{s.level}</p>}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:11, fontWeight:600, color:C.text2, whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? `${s.package_hours}h pkg` : s.billing_type === "monthly" ? `${fmtDays(s.days)} fixed` : fmtDays(s.days)}
                          </td>
                          <td style={{ padding:"0.7rem 1rem" }}>
                            {s.billing_type === "package" ? (() => {
                              const rem  = parseInt(s.package_remaining ?? s.package_hours) || 0;
                              const tot  = parseInt(s.package_hours) || 1;
                              const pct  = Math.min(100, Math.round(rem / tot * 100));
                              const col  = pct > 40 ? C.green : pct > 15 ? C.amber : "#d95f5f";
                              return (
                                <div>
                                  <p style={{ fontSize:12, fontWeight:800, color:col, lineHeight:1 }}>{rem}h</p>
                                  <p style={{ fontSize:9, color:C.text3, marginBottom:2 }}>/{tot}h</p>
                                  <div style={{ height:3, borderRadius:2, background:C.border, overflow:"hidden" }}>
                                    <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:2 }} />
                                  </div>
                                </div>
                              );
                            })() : (
                              <p style={{ fontSize:13, fontWeight:700, color: hrs > 0 ? C.text : C.text3 }}>{hrs || "—"}</p>
                            )}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:12, fontWeight:600, color:C.text2, whiteSpace:"nowrap" }}>{rateLabel}</td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:12, color: parseFloat(s.discount)>0 ? C.amber : C.text3, whiteSpace:"nowrap" }}>
                            {parseFloat(s.discount)>0 ? `-${s.discount}%` : "—"}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:13, fontWeight:800, color: total>0 ? C.green : C.text3, whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? <span style={{ fontSize:11, color:C.text3 }}>Prepaid</span> : total>0 ? fmtC(total) : "—"}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:11, color:C.text3, whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? "—" : `Day ${s.pay_day||30}`}
                          </td>
                          <td style={{ padding:"0.7rem 1rem" }}>
                            {s.billing_type === "package" ? (
                              <span style={{ fontSize:10, fontWeight:700, color:C.text3 }}>—</span>
                            ) : (
                              <div onClick={() => !toggling[s.id] && togglePaid(s.id)}
                                style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                                <div style={{ width:34, height:19, borderRadius:10,
                                  background: isPaid ? C.green : C.surface2,
                                  border:`1px solid ${isPaid ? C.green : C.border2}`,
                                  position:"relative", flexShrink:0, transition:"background 0.18s" }}>
                                  <div style={{ position:"absolute", top:2,
                                    left: isPaid ? 16 : 2, width:13, height:13,
                                    borderRadius:"50%", transition:"left 0.18s",
                                    background: isPaid ? "#fff" : C.text3 }} />
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, color: isPaid ? C.green : C.text3 }}>
                                  {isPaid ? "Paid" : "Pend."}
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:11, color:C.text3, fontStyle:"italic",
                            maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {s.comments || ""}
                          </td>
                          <td style={{ padding:"0.7rem 1rem" }}>
                            <div style={{ display:"flex", gap:4 }}>
                              <button onClick={() => openEdit(s)}
                                style={{ ...SEL(), padding:"0.2rem 0.45rem", fontSize:11,
                                  color:C.amber, border:`1px solid ${C.amber}44` }}>✏</button>
                              <button onClick={() => setDelId(s.id)}
                                style={{ ...SEL(), padding:"0.2rem 0.45rem", fontSize:11,
                                  color:"#d95f5f", border:`1px solid #d95f5f44` }}>✕</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:C.surface2, borderTop:`1px solid ${C.border2}` }}>
                      <td style={{ padding:"0.65rem 1rem", fontSize:11, fontWeight:800, color:C.text2,
                        letterSpacing:"0.08em", textTransform:"uppercase", position:"sticky", left:0, background:C.surface2 }}>Total</td>
                      <td /><td /><td /><td />
                      <td style={{ padding:"0.65rem 1rem", fontSize:13, fontWeight:900, color:C.text, whiteSpace:"nowrap" }}>{fmtC(gTotal)}</td>
                      <td />
                      <td style={{ padding:"0.65rem 1rem" }}>
                        <p style={{ fontSize:10, fontWeight:700, color:C.green }}>{fmtC(gPaid)} paid</p>
                        {gTotal - gPaid > 0 && <p style={{ fontSize:10, fontWeight:700, color:"#d95f5f" }}>{fmtC(gTotal-gPaid)} due</p>}
                      </td>
                      <td /><td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {students?.length === 0 && (
        <div style={{ ...CARD, borderRadius:14, padding:"3rem", textAlign:"center" }}>
          <p style={{ color:C.text3, fontSize:13, marginBottom:"1rem" }}>No students yet.</p>
          <button onClick={openAdd} style={{ ...SEL(), padding:"0.5rem 1.25rem", color:C.text }}>+ Add first student</button>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" }}>
          <div style={{ ...CARD, borderRadius:16, padding:"1.5rem", maxWidth:300, width:"100%" }}>
            <p style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:"0.5rem" }}>Remove student?</p>
            <p style={{ fontSize:13, color:C.text3, marginBottom:"1.5rem" }}>They'll be hidden from all views. You can re-add them later.</p>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={() => setDelId(null)} style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center" }}>Cancel</button>
              <button onClick={() => deleteStudent(delId)}
                style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center",
                  color:"#d95f5f", border:`1px solid #d95f5f44` }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)",
          display:"flex", alignItems:"flex-start", justifyContent:"center",
          zIndex:1000, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"1rem" }}>
          <div style={{ ...CARD, borderRadius:18, padding:"1.5rem", width:"100%",
            maxWidth:460, marginTop:"2rem", marginBottom:"2rem" }}>
            <p style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:"1.25rem" }}>
              {modal.mode === "add" ? "New student" : "Edit student"}
            </p>

            {/* Name + Email */}
            {[["Name *","name","text","Full name"],["Email","email","email","email@example.com"]].map(([lbl,key,type,ph]) => (
              <div key={key} style={{ marginBottom:"0.8rem" }}>
                <label style={labelSty}>{lbl}</label>
                <input type={type} value={form[key]} placeholder={ph}
                  onChange={e => setF(key, e.target.value)} style={inputSty} />
              </div>
            ))}

            {/* Billing type – shown early so group section adapts */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Billing type</label>
              <div style={{ display:"flex", gap:6 }}>
                {[["monthly","Monthly (fixed)"],["weekly","Weekly (per hr × days)"],["package","Package (fixed hrs)"]].map(([v,l]) => (
                  <button key={v} onClick={() => setF("billing_type",v)}
                    style={{ ...chipSty(form.billing_type===v), flex:1, fontSize:11 }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Group – with autofill chips when billing type is weekly */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Group</label>
              <input value={form.group_number} placeholder="03, Private, Hyatt…"
                onChange={e => setF("group_number", e.target.value)} style={inputSty} />
              {form.billing_type !== "package" && groupOptions.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginTop:6 }}>
                  <span style={{ fontSize:10, color:C.text3, flexShrink:0 }}>Autofill →</span>
                  {groupOptions.map(g => (
                    <button key={g} onClick={() => applyGroup(g)}
                      style={{ ...chipSty(form.group_number?.trim() === g),
                        fontSize:11, padding:"0.2rem 0.55rem" }}>
                      Gr. {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Level */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Level</label>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {STU_LEVELS.map(l => <button key={l} onClick={() => setF("level",l)} style={chipSty(form.level===l)}>{l}</button>)}
              </div>
            </div>

            {/* Weekly / Monthly fields */}
            {(form.billing_type === "weekly" || form.billing_type === "monthly") && <>
              <div style={{ marginBottom:"0.8rem" }}>
                <label style={labelSty}>Class days</label>
                <div style={{ display:"flex", gap:5 }}>
                  {STU_WEEKDAYS.map(({v,l}) => {
                    const sel = (Array.isArray(form.days)?form.days:[]).includes(v);
                    return <button key={v} onClick={() => toggleDay(v)} style={{ ...chipSty(sel), flex:1 }}>{l}</button>;
                  })}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
                <div>
                  <label style={labelSty}>Schedule</label>
                  <select value={form.schedule} onChange={e => setF("schedule",e.target.value)}
                    style={{ ...inputSty }}>
                    {STU_SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSty}>Time</label>
                  <input type="time" value={form.class_time} onChange={e => setF("class_time",e.target.value)}
                    style={{ ...inputSty, colorScheme:"dark" }} />
                </div>
              </div>
            </>}

            {/* Package hours */}
            {form.billing_type === "package" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
                <div>
                  <label style={labelSty}>Total hrs (pkg)</label>
                  <input type="number" min="1" value={form.package_hours} placeholder="48"
                    onChange={e => setF("package_hours",e.target.value)} style={inputSty} />
                </div>
                <div>
                  <label style={labelSty}>Remaining hrs</label>
                  <input type="number" min="0" value={form.package_remaining} placeholder="e.g. 36"
                    onChange={e => setF("package_remaining",e.target.value)} style={inputSty} />
                </div>
              </div>
            )}

            {/* Company */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Company</label>
              <input value={form.company} placeholder="Dilo, Hyatt…"
                onChange={e => setF("company",e.target.value)} style={inputSty} />
            </div>

            {/* Rate + Currency */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
              <div>
                <label style={labelSty}>{form.billing_type === "monthly" ? "Rate" : "Rate / hr"}</label>
                <input type="number" min="0" value={form.price_per_hour} placeholder="0"
                  onChange={e => setF("price_per_hour",e.target.value)} style={inputSty} />
              </div>
              <div>
                <label style={labelSty}>Currency</label>
                <div style={{ display:"flex", gap:6, marginTop:4 }}>
                  {[["CRC","₡ CRC"],["USD","$ USD"]].map(([v,l]) => (
                    <button key={v} onClick={() => setF("currency",v)}
                      style={{ ...chipSty(form.currency===v), flex:1 }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Discount + Pay day */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
              <div>
                <label style={labelSty}>Discount %</label>
                <input type="number" min="0" max="100" value={form.discount} placeholder="0"
                  onChange={e => setF("discount",e.target.value)} style={inputSty} />
              </div>
              <div>
                <label style={labelSty}>Pay day</label>
                <div style={{ display:"flex", gap:6, marginTop:4 }}>
                  {["15","30"].map(v => (
                    <button key={v} onClick={() => setF("pay_day",v)}
                      style={{ ...chipSty(String(form.pay_day)===v), flex:1 }}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={labelSty}>Comments</label>
              <textarea value={form.comments} rows={2} placeholder="Notes…"
                onChange={e => setF("comments",e.target.value)}
                style={{ ...inputSty, resize:"vertical", lineHeight:1.5 }} />
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={() => setModal(null)}
                style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center" }}>Cancel</button>
              <button onClick={saveStudent} disabled={formSaving || !form.name.trim()}
                style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center",
                  color: formSaving ? C.amber : C.text,
                  border:`1px solid ${formSaving ? C.amber : C.border2}`,
                  opacity: !form.name.trim() ? 0.5 : 1 }}>
                {formSaving ? "Saving…" : modal.mode === "add" ? "Add student" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MY HOURS VIEW ─────────────────────────────────────────────
// Coach-only: monthly class counter with weekly breakdown + earnings.
function MyHoursView({ user }) {
  const [coachName,   setCoachName]   = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [events,      setEvents]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    supabase.from("profiles").select("nombre").eq("id", user?.id).single()
      .then(({ data }) => { if (data?.nombre) setCoachName(data.nombre.split(" ")[0]); });
  }, [user?.id]);

  const getMonthBounds = (off) => {
    const n = new Date();
    const d = new Date(n.getFullYear(), n.getMonth() + off, 1);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59),
             year: d.getFullYear(), month: d.getMonth() };
  };
  const { start, end, year, month } = getMonthBounds(monthOffset);
  const MO_NAMES = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];

  useEffect(() => {
    if (!coachName) return;
    setLoading(true); setError(null); setEvents(null);
    fetch(EDGE_URL, {
      method:"POST",
      headers:{ Authorization:"Bearer "+ANON_KEY, apikey:ANON_KEY, "Content-Type":"application/json" },
      body: JSON.stringify({ source:"teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() })
    }).then(r=>r.json()).then(d => {
      if (!Array.isArray(d)) throw new Error();
      setEvents(d.map(ev=>({ ...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000) }))
        .filter(ev => !isNaN(ev.date.getTime()) && ev.coach?.trim() === coachName));
    }).catch(()=>setError("No se pudo cargar el calendario."))
    .finally(()=>setLoading(false));
  }, [coachName, monthOffset]);

  const weeks = React.useMemo(() => {
    if (!events) return [];
    const map = new Map();
    events.forEach(ev => {
      const d = new Date(ev.date), day = d.getDay();
      d.setDate(d.getDate() - (day===0?6:day-1)); d.setHours(0,0,0,0);
      const key = d.toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, { mon: new Date(d), count: 0 });
      map.get(key).count++;
    });
    return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,{mon,count}])=>{
      const sat = new Date(mon); sat.setDate(mon.getDate()+5);
      return { mon, sat, count };
    });
  }, [events]);

  const rateInfo  = COACH_RATES[coachName];
  const rateInCRC = rateInfo ? (rateInfo.currency==="$" ? rateInfo.rate*450 : rateInfo.rate) : null;
  const calc = (n) => {
    if (!rateInCRC) return { net:0, iva:0, total:0 };
    const net = n * rateInCRC, iva = rateInfo.iva ? net*0.02 : 0;
    return { net, iva, total: net+iva };
  };
  const fmtC = n => `₡${Math.round(n).toLocaleString("es-CR")}`;
  const fmtWk = (mon,sat) => {
    const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return mon.getMonth()===sat.getMonth()
      ? `${mon.getDate()}–${sat.getDate()} ${mo[mon.getMonth()]}`
      : `${mon.getDate()} ${mo[mon.getMonth()]}–${sat.getDate()} ${mo[sat.getMonth()]}`;
  };

  const totalClasses = weeks.reduce((s,w)=>s+w.count, 0);
  const { net:tNet, iva:tIva, total:tTotal } = calc(totalClasses);
  const thSty = (align="right") => ({
    padding:"0.6rem 1rem", fontSize:10, fontWeight:800, color:C.text3,
    letterSpacing:"0.07em", textTransform:"uppercase",
    textAlign:align, borderBottom:`1px solid ${C.border}`,
    background:C.surface2, whiteSpace:"nowrap",
  });
  const tdSty = (align="right") => ({
    padding:"0.75rem 1rem", textAlign:align, verticalAlign:"middle",
  });

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"clip", padding:"1.25rem",
      paddingLeft:"max(1.25rem,env(safe-area-inset-left))",
      paddingRight:"max(1.25rem,env(safe-area-inset-right))",
      paddingBottom:"max(1.5rem,env(safe-area-inset-bottom))",
      scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>

      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.5rem", maxWidth:600 }}>
        <button onClick={()=>setMonthOffset(p=>p-1)} style={SEL({ padding:"0.4rem 0.7rem" })}>←</button>
        <span style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:C.text }}>
          {MO_NAMES[month]} {year}
        </span>
        <button onClick={()=>setMonthOffset(p=>p+1)} style={SEL({ padding:"0.4rem 0.7rem" })}>→</button>
      </div>

      {loading && (
        <div style={{ display:"flex", justifyContent:"center", width:"100%", padding:"2rem 0", gap:8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.text3,
              animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      )}
      {error && <p style={{ color:"#d95f5f", fontSize:13, marginBottom:"1rem" }}>{error}</p>}

      {!loading && events && (
        <div style={{ ...CARD, borderRadius:14, overflowX:"auto", WebkitOverflowScrolling:"touch", maxWidth:600 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:380 }}>
            <thead>
              <tr>
                <th style={{ ...thSty("left"), position:"sticky", left:0 }}>Week</th>
                <th style={thSty()}>Classes</th>
                <th style={thSty()}>Net</th>
                <th style={thSty()}>IVA 2%</th>
                <th style={thSty()}>Total</th>
              </tr>
            </thead>
            <tbody>
              {weeks.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:"2.5rem", textAlign:"center", color:C.text3, fontSize:13 }}>No classes recorded this month.</td></tr>
              ) : weeks.map((w, i) => {
                const { net, iva, total } = calc(w.count);
                return (
                  <tr key={i} style={{ borderBottom: i < weeks.length-1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ ...tdSty("left"), position:"sticky", left:0, background:C.surface2, fontWeight:600, fontSize:13, color:C.text, whiteSpace:"nowrap" }}>{fmtWk(w.mon,w.sat)}</td>
                    <td style={{ ...tdSty(), fontSize:13, fontWeight:700, color:C.text }}>{w.count}</td>
                    <td style={{ ...tdSty(), fontSize:12, fontWeight:600, color:C.text2 }}>{fmtC(net)}</td>
                    <td style={{ ...tdSty(), fontSize:12, color:C.text3 }}>{fmtC(iva)}</td>
                    <td style={{ ...tdSty(), fontSize:14, fontWeight:800, color:C.green }}>{fmtC(total)}</td>
                  </tr>
                );
              })}
              {weeks.length > 0 && (
                <tr style={{ borderTop:`1px solid ${C.border2}`, background:C.surface2 }}>
                  <td style={{ ...tdSty("left"), position:"sticky", left:0, background:C.surface2, fontSize:11, fontWeight:800, color:C.text2, letterSpacing:"0.08em", textTransform:"uppercase" }}>Total</td>
                  <td style={{ ...tdSty(), fontSize:14, fontWeight:900, color:C.text }}>{totalClasses}</td>
                  <td style={{ ...tdSty(), fontSize:13, fontWeight:700, color:C.text2 }}>{fmtC(tNet)}</td>
                  <td style={{ ...tdSty(), fontSize:12, color:C.text3 }}>{fmtC(tIva)}</td>
                  <td style={{ ...tdSty(), fontSize:16, fontWeight:900, color:C.green }}>{fmtC(tTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CLASS HISTORY VIEW ─────────────────────────────────────────
// ── COACHES VIEW ───────────────────────────────────────────────
// Admin-only: weekly coach hours + payroll with / without IVA.
// Rates ($/hr) are editable inline and persisted in localStorage.
function CoachesView() {
  const [tab,         setTab]         = useState("week");   // "week" | "month"
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);        // months from current
  const [weekEvents,  setWeekEvents]  = useState(null);
  const [monthEvents, setMonthEvents] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [rates,         setRates]         = useState({});
  const [rateInputs,    setRateInputs]    = useState({});  // raw string while typing
  const [ratesSaving,   setRatesSaving]   = useState({});
  const [monthSaving,   setMonthSaving]   = useState(false);
  const [monthSaved,    setMonthSaved]    = useState(false);
  const [savedMonthly,  setSavedMonthly]  = useState({});  // { coachName: hours } from DB
  const [partialInputs, setPartialInputs] = useState({});  // { coachName: { amount, date } }
  const [finalInputs,   setFinalInputs]   = useState({});  // { coachName: { amount, date } }
  const [paymentSaving, setPaymentSaving] = useState({});  // { coachName: bool }

  const IVA      = 0.02;
  const sym      = "₡";
  const fmtMoney = n => `₡${Math.round(n).toLocaleString("es-CR")}`;

  // ── Load rates from Supabase ──────────────────────────────────────
  useEffect(() => {
    supabase.from("coach_rates").select("coach_name, rate")
      .then(({ data, error: e }) => {
        if (!e && data) {
          const map = {};
          data.forEach(r => { map[r.coach_name] = r.rate; });
          setRates(map);
          setRateInputs(map);
        }
      });
  }, []);

  // ── Week helpers ──────────────────────────────────────────────────
  const getWeekBounds = (offset) => {
    const today = new Date();
    const dow = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { start: mon, end: sun };
  };

  const isoWeek = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
    const w1 = new Date(dt.getFullYear(), 0, 4);
    return 1 + Math.round(((dt - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  };

  // ── Month helpers ─────────────────────────────────────────────────
  const getMonthBounds = (offset) => {
    const now = new Date();
    const d   = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { start, end, year: d.getFullYear(), month: d.getMonth() };
  };

  const MONTH_NAMES = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];

  const yearMonthKey = (offset) => {
    const { year, month } = getMonthBounds(offset);
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  // ── Fetch helpers ─────────────────────────────────────────────────
  const fetchEvents = async (start, end) => {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() }),
    });
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Could not load schedule.");
    return data.filter(ev => ev.coach?.trim() && ev.coach.trim() !== "Unassigned");
  };

  // Request-id guards prevent stale async responses from overwriting newer results
  const weekReqRef  = React.useRef(0);
  const monthReqRef = React.useRef(0);

  const loadWeek = async (offset) => {
    const reqId = ++weekReqRef.current;
    setLoading(true); setError(null); setWeekEvents(null);
    const { start, end } = getWeekBounds(offset);
    try {
      const evs = await fetchEvents(start, end);
      if (reqId !== weekReqRef.current) return;
      setWeekEvents(evs);
    } catch (e) {
      if (reqId !== weekReqRef.current) return;
      setError(e.message);
    }
    setLoading(false);
  };

  const loadMonth = async (offset) => {
    const reqId = ++monthReqRef.current;
    setLoading(true); setError(null); setMonthEvents(null); setMonthSaved(false);
    setPartialInputs({}); setFinalInputs({});
    const { start, end } = getMonthBounds(offset);
    const ym = yearMonthKey(offset);
    try {
      const [evs, { data: saved }] = await Promise.all([
        fetchEvents(start, end),
        supabase.from("coach_monthly_hours")
          .select("coach_name, hours, partial_payment, partial_payment_date, final_payment, final_payment_date")
          .eq("year_month", ym),
      ]);
      if (reqId !== monthReqRef.current) return;
      setMonthEvents(evs);
      if (saved?.length) {
        const hoursMap = {}, partMap = {}, finalMap = {};
        saved.forEach(r => {
          hoursMap[r.coach_name] = r.hours;
          partMap[r.coach_name]  = { amount: r.partial_payment ?? "", date: r.partial_payment_date ?? "" };
          finalMap[r.coach_name] = { amount: r.final_payment   ?? "", date: r.final_payment_date   ?? "" };
        });
        setSavedMonthly(hoursMap);
        setPartialInputs(partMap);
        setFinalInputs(finalMap);
        setMonthSaved(true);
      } else {
        setSavedMonthly({});
      }
    } catch (e) {
      if (reqId !== monthReqRef.current) return;
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadWeek(0); }, []);

  // Switch tabs
  const switchTab = (t) => {
    setTab(t); setError(null);
    if (t === "week"  && weekEvents  === null) loadWeek(0);
    if (t === "month" && monthEvents === null) loadMonth(0);
  };

  // ── Rate editing ──────────────────────────────────────────────────
  // While typing: only update the raw input string (no Supabase call)
  const handleRateChange = (coach, val) => {
    setRateInputs(prev => ({ ...prev, [coach]: val }));
  };

  // On blur: parse + save to Supabase
  const handleRateBlur = async (coach) => {
    const rate = parseFloat(rateInputs[coach]) || 0;
    setRates(prev => ({ ...prev, [coach]: rate }));
    setRatesSaving(prev => ({ ...prev, [coach]: true }));
    await supabase.from("coach_rates").upsert(
      { coach_name: coach, rate, updated_at: new Date().toISOString() },
      { onConflict: "coach_name" }
    );
    setRatesSaving(prev => ({ ...prev, [coach]: false }));
  };

  // ── Save monthly hours to Supabase ────────────────────────────────
  const saveMonthlyHours = async (rows) => {
    setMonthSaving(true);
    const ym = yearMonthKey(monthOffset);
    const upserts = rows.map(r => ({
      coach_name: r.coach, year_month: ym, hours: r.classes,
      partial_payment:      partialInputs[r.coach]?.amount ? parseFloat(partialInputs[r.coach].amount) : null,
      partial_payment_date: partialInputs[r.coach]?.date   || null,
      final_payment:        finalInputs[r.coach]?.amount   ? parseFloat(finalInputs[r.coach].amount)   : null,
      final_payment_date:   finalInputs[r.coach]?.date     || null,
    }));
    await supabase.from("coach_monthly_hours").upsert(upserts, { onConflict: "coach_name,year_month" });
    const map = {};
    rows.forEach(r => { map[r.coach] = r.classes; });
    setSavedMonthly(map);
    setMonthSaving(false);
    setMonthSaved(true);
  };

  // ── Save partial + final payments for one coach (shared OK button) ──
  const savePayments = async (coach, currentRows) => {
    setPaymentSaving(prev => ({ ...prev, [coach]: true }));
    const ym  = yearMonthKey(monthOffset);
    const hrs = currentRows.find(r => r.coach === coach)?.classes || 0;
    const p   = partialInputs[coach] || {};
    const f   = finalInputs[coach]   || {};
    await supabase.from("coach_monthly_hours").upsert(
      {
        coach_name: coach, year_month: ym, hours: hrs,
        partial_payment:      p.amount ? parseFloat(p.amount) : null,
        partial_payment_date: p.date   || null,
        final_payment:        f.amount ? parseFloat(f.amount) : null,
        final_payment_date:   f.date   || null,
      },
      { onConflict: "coach_name,year_month" }
    );
    setPaymentSaving(prev => ({ ...prev, [coach]: false }));
  };

  // ── Aggregate events → rows ───────────────────────────────────────
  const buildRows = (evs) => {
    const byCoach = {};
    (evs || []).forEach(ev => {
      const c = ev.coach.trim();
      byCoach[c] = (byCoach[c] || 0) + 1;
    });
    return Object.entries(byCoach)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([coach, classes]) => {
        const rate  = rates[coach] || 0;
        const net   = classes * rate;
        const iva   = net * IVA;
        const total = net + iva;
        return { coach, classes, rate, net, iva, total };
      });
  };

  // ── Derived ───────────────────────────────────────────────────────
  const { start: wStart, end: wEnd } = getWeekBounds(weekOffset);
  const { start: mStart, year: mYear, month: mMonth } = getMonthBounds(monthOffset);
  const weekNum  = isoWeek(wStart);
  const fmtDate  = d => d.toLocaleDateString("en", { month: "short", day: "numeric" });

  const weekRows  = buildRows(weekEvents);
  const monthRows = buildRows(monthEvents);
  const totalWeekHrs  = weekRows.reduce((s, r) => s + r.classes, 0);
  const totalMonthHrs = monthRows.reduce((s, r) => s + r.classes, 0);

  // ── Sub-components ────────────────────────────────────────────────
  const inputStyle = { minWidth: 0, background: "rgba(240,236,224,0.05)",
    border: `1px solid ${C.border2}`, borderRadius: 6,
    padding: "0.28rem 0.45rem", color: C.text, fontSize: 12,
    fontWeight: 600, fontFamily: "inherit", lineHeight: "1.4", boxSizing: "border-box" };

  const okBtnStyle = (saving) => ({
    flexShrink: 0, padding: "0.22rem 0.45rem", borderRadius: 6,
    fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "default" : "pointer",
    background: C.surface2, border: `1px solid ${saving ? C.amber : C.border2}`,
    color: saving ? C.amber : C.text3, transition: "all 0.15s",
  });

  const Dots = () => (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.text3,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );

  const PayrollTable = ({ rows, totalHrs, emptyMsg, footer, monthMode = false }) => {
    const headers = monthMode
      ? ["Coach","Hrs","Rate / hr","Net","VAT 2%","Total","Partial Pay","Date","Final Pay","Date","Pending"]
      : ["Coach","Hrs","Rate / hr","Net","VAT 2%","Total"];
    const colWidths = monthMode
      ? [null, 44, 130, 90, 70, 110, 120, 110, 120, 110, 100]
      : [null, 50, 130, 100, 80, 110];
    return(
    rows.length === 0
      ? <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 13 }}>{emptyMsg}</p>
        </div>
      : <>
          <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: monthMode ? 1060 : 580 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: "0.6rem 0.9rem", fontSize: 10, fontWeight: 800, color: C.text3,
                      letterSpacing: "0.07em", textTransform: "uppercase", background: C.surface2,
                      textAlign: i === 0 ? "left" : "left", whiteSpace: "nowrap",
                      width: colWidths[i] || undefined,
                      position: i === 0 ? "sticky" : "static", left: i === 0 ? 0 : "auto" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const partial  = parseFloat(partialInputs[r.coach]?.amount) || 0;
                  const final_   = parseFloat(finalInputs[r.coach]?.amount)   || 0;
                  const pending  = Math.max(0, r.total - partial - final_);
                  const isPaid   = r.total > 0 && pending === 0;
                  return (
                  <tr key={r.coach} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 700, color: C.text,
                      position: "sticky", left: 0, background: C.surface2, whiteSpace: "nowrap" }}>
                      {r.coach.split(" ")[0]}
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.classes}</td>
                    <td style={{ padding: "0.75rem 0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                        <input type="number" min="0" step="0.01"
                          value={rateInputs[r.coach] ?? ""} placeholder="0.00"
                          onChange={e => handleRateChange(r.coach, e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleRateBlur(r.coach)}
                          style={{ ...inputStyle, flex: 1, minWidth: 60 }} />
                        <button onClick={() => handleRateBlur(r.coach)} disabled={ratesSaving[r.coach]}
                          style={okBtnStyle(ratesSaving[r.coach])}>
                          {ratesSaving[r.coach] ? "…" : "OK"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: r.net > 0 ? C.text : C.text3, whiteSpace: "nowrap" }}>
                      {r.net > 0 ? fmtMoney(r.net) : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: r.iva > 0 ? C.text2 : C.text3, whiteSpace: "nowrap" }}>
                      {r.iva > 0 ? fmtMoney(r.iva) : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, color: r.total > 0 ? C.green : C.text3, whiteSpace: "nowrap" }}>
                      {r.total > 0 ? fmtMoney(r.total) : "—"}
                    </td>
                    {monthMode && <>
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                          <input type="number" min="0" step="0.01"
                            value={partialInputs[r.coach]?.amount ?? ""} placeholder="0"
                            onChange={e => setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: e.target.value } }))}
                            style={{ ...inputStyle, flex: 1, minWidth: 50 }} />
                          <button onClick={() => savePayments(r.coach, rows)} disabled={paymentSaving[r.coach]}
                            style={okBtnStyle(paymentSaving[r.coach])}>
                            {paymentSaving[r.coach] ? "…" : "OK"}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <input type="date"
                          value={partialInputs[r.coach]?.date ?? ""}
                          onChange={e => setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), date: e.target.value } }))}
                          style={{ ...inputStyle, width: "100%", minWidth: 0, boxSizing: "border-box", colorScheme: "dark", WebkitAppearance: "none", appearance: "none" }} />
                      </td>
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                          <input type="number" min="0" step="0.01"
                            value={finalInputs[r.coach]?.amount ?? ""} placeholder="0"
                            onChange={e => setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: e.target.value } }))}
                            style={{ ...inputStyle, flex: 1, minWidth: 50 }} />
                          <button onClick={() => savePayments(r.coach, rows)} disabled={paymentSaving[r.coach]}
                            style={okBtnStyle(paymentSaving[r.coach])}>
                            {paymentSaving[r.coach] ? "…" : "OK"}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <input type="date"
                          value={finalInputs[r.coach]?.date ?? ""}
                          onChange={e => setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), date: e.target.value } }))}
                          style={{ ...inputStyle, width: "100%", minWidth: 0, boxSizing: "border-box", colorScheme: "dark", WebkitAppearance: "none", appearance: "none" }} />
                      </td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap",
                        color: isPaid ? C.green : pending > 0 ? "#d95f5f" : C.text3 }}>
                        {r.total > 0 ? (isPaid ? "✓ 0" : fmtMoney(pending)) : "—"}
                      </td>
                    </>}
                  </tr>
                );})}
              </tbody>
              <tfoot>
                {(() => {
                  const tNet     = rows.reduce((s, r) => s + r.net,   0);
                  const tIva     = rows.reduce((s, r) => s + r.iva,   0);
                  const tTotal   = rows.reduce((s, r) => s + r.total, 0);
                  const tPending = rows.reduce((s, r) => {
                    const p = parseFloat(partialInputs[r.coach]?.amount) || 0;
                    const f = parseFloat(finalInputs[r.coach]?.amount)   || 0;
                    return s + Math.max(0, r.total - p - f);
                  }, 0);
                  const allPaid = tTotal > 0 && tPending === 0;
                  return (
                  <tr style={{ borderTop: `1px solid ${C.border2}`, background: C.surface2 }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 11, fontWeight: 800, color: C.text2, letterSpacing: "0.08em", textTransform: "uppercase", position: "sticky", left: 0, background: C.surface2 }}>Total</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{totalHrs} hrs</td>
                    <td />
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tNet > 0 ? fmtMoney(tNet) : "—"}</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text2, whiteSpace: "nowrap" }}>{tIva > 0 ? fmtMoney(tIva) : "—"}</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 15, fontWeight: 900, color: C.green, whiteSpace: "nowrap" }}>{tTotal > 0 ? fmtMoney(tTotal) : "—"}</td>
                    {monthMode && <>
                      <td /><td /><td /><td />
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, whiteSpace: "nowrap",
                        color: allPaid ? C.green : tPending > 0 ? "#d95f5f" : C.text3 }}>
                        {tTotal > 0 ? (allPaid ? "✓ 0" : fmtMoney(tPending)) : "—"}
                      </td>
                    </>}
                  </tr>
                );})()}
              </tfoot>
            </table>
          </div>
          {footer}
        </>
  );};

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 800 }}>

      {/* ── Tab toggle ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[["week","Week"],["month","Month"]].map(([id, label]) => (
          <button key={id} onClick={() => switchTab(id)}
            style={{ padding: "0.45rem 1.1rem", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              background: C.surface2,
              color:      tab === id ? C.text : C.text3,
              border: `1px solid ${tab === id ? C.accent : C.border}`,
              transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ SEMANA ══ */}
      {tab === "week" && <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button onClick={() => { const o = weekOffset - 1; setWeekOffset(o); loadWeek(o); }}
            style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>←</button>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 700, flex: 1, textAlign: "center" }}>
            Week {weekNum} · {fmtDate(wStart)} – {fmtDate(wEnd)}, {wEnd.getFullYear()}
          </span>
          <button onClick={() => { const o = weekOffset + 1; setWeekOffset(o); loadWeek(o); }}
            style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>→</button>
        </div>

        {loading && <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}><Dots /><p style={{ fontSize: 12, color: C.text3 }}>Loading…</p></div>}
        {!loading && error && <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && weekEvents !== null &&
          PayrollTable({ rows: weekRows, totalHrs: totalWeekHrs, emptyMsg: "No classes this week." })}
      </>}

      {/* ══ MES ══ */}
      {tab === "month" && <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 200 }}>
            <button onClick={() => { const o = monthOffset - 1; setMonthOffset(o); loadMonth(o); }}
              style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>←</button>
            <span style={{ fontSize: 13, color: C.text2, fontWeight: 700, flex: 1, textAlign: "center" }}>
              {MONTH_NAMES[mMonth]} {mYear}
            </span>
            <button onClick={() => { const o = monthOffset + 1; setMonthOffset(o); loadMonth(o); }}
              style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>→</button>
          </div>

          {/* Save button */}
          {!loading && !error && monthEvents !== null && monthRows.length > 0 && (
            <button
              onClick={() => saveMonthlyHours(monthRows)}
              disabled={monthSaving}
              style={{ padding: "0.45rem 1rem", borderRadius: 8, flexShrink: 0,
                fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                cursor: monthSaving ? "default" : "pointer",
                background: C.surface2,
                color: monthSaved ? C.green : monthSaving ? C.amber : C.text2,
                border: `1px solid ${monthSaved ? C.green : monthSaving ? C.amber : C.border}`,
                transition: "all 0.2s" }}>
              {monthSaving ? "Saving…" : monthSaved ? "✓ Saved" : "Save summary"}
            </button>
          )}
        </div>

        {/* Saved hours banner */}
        {monthSaved && Object.keys(savedMonthly).length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {Object.entries(savedMonthly).map(([coach, hrs]) => (
              <div key={coach} style={{ background: "rgba(74,196,128,0.08)", border: "1px solid rgba(74,196,128,0.2)",
                borderRadius: 8, padding: "0.35rem 0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 12, color: C.text2 }}>{coach}</span>
                <span style={{ fontSize: 12, color: C.green, fontWeight: 800 }}>{hrs} hrs</span>
              </div>
            ))}
          </div>
        )}

        {loading && <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}><Dots /><p style={{ fontSize: 12, color: C.text3 }}>Loading…</p></div>}
        {!loading && error && <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && monthEvents !== null &&
          PayrollTable({ rows: monthRows, totalHrs: totalMonthHrs, emptyMsg: "No classes this month.", monthMode: true })}
      </>}
    </div>
  );
}

// ── ATTENDANCE VIEW ────────────────────────────────────────────
// Monthly dashboard: per-student stats with 50 effective min/class baseline.
// Filterable by class subject. Coaches excluded. External students flagged.
function AttendanceView() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [subject, setSubject] = useState(""); // "" = all classes

  // Two separate loading flows: subject list + student data
  const [subjects,     setSubjects]     = useState([]);
  const [students,     setStudents]     = useState(null);
  const [totalSessions, setTotalSessions] = useState(0); // only when filtered by subject
  const [loading,      setLoading]      = useState(false);
  const [loadingSubj,  setLoadingSubj]  = useState(false);
  const [error,        setError]        = useState(null);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Load unique class subjects for the selected month ─────────
  const loadSubjects = async (y, m) => {
    setLoadingSubj(true);
    const start = new Date(y, m - 1, 1).toISOString();
    const end   = new Date(y, m,     0, 23, 59, 59).toISOString();
    try {
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "teams", startDateTime: start, endDateTime: end }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const unique = [...new Set(data.map(ev => ev.summary).filter(Boolean))].sort();
        setSubjects(unique);
      }
    } catch (e) { console.warn("[loadSubjects]", e.message); }
    setLoadingSubj(false);
  };

  // ── Load all-class student summary ────────────────────────────
  const loadAllStudents = async (y, m) => {
    setLoading(true); setError(null); setStudents(null); setTotalSessions(0);
    try {
      const res = await fetch(ATTENDANCE_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "student-attendance", year: y, month: m }),
      });
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
      else setError(data.error || "Error loading attendance.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // ── Load class-history + aggregate per student ────────────────
  const loadClassStudents = async (y, m, subj) => {
    setLoading(true); setError(null); setStudents(null);
    try {
      const res = await fetch(ATTENDANCE_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "class-history", subject: subj, year: y, month: m }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const total = data.length; // sessions in the period
        setTotalSessions(total);
        const map = {};
        for (const session of data) {
          for (const rec of session.records || []) {
            const key = rec.email || rec.name;
            if (!map[key]) map[key] = { name: rec.name, email: rec.email, isExternal: rec.isExternal, sessions: 0, mins: 0 };
            map[key].sessions++;
            map[key].mins += Math.round(rec.duration / 60);
          }
        }
        const agg = Object.values(map)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(s => ({
            name:            s.name,
            email:           s.email,
            isExternal:      s.isExternal,
            classCount:      total,
            sessionsAttended: s.sessions,
            actualMinutes:   s.mins,
            expectedMinutes: total * 50,
            completion:      total > 0 ? Math.round((s.mins / (total * 50)) * 100) : 0,
          }));
        setStudents(agg);
      } else setError(data.error || "Error loading class history.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects(year, month);
    loadAllStudents(year, month);
  }, []);

  const changePeriod = (y, m) => {
    setYear(y); setMonth(m); setSubject(""); setTotalSessions(0);
    loadSubjects(y, m);
    loadAllStudents(y, m);
  };

  const changeSubject = (subj) => {
    setSubject(subj);
    if (!subj) loadAllStudents(year, month);
    else loadClassStudents(year, month, subj);
  };

  const compColor = p => p >= 80 ? C.green : p >= 50 ? C.amber : C.red;

  // ── Summary stats ─────────────────────────────────────────────
  const avgCompletion = students?.length
    ? Math.round(students.reduce((a, s) => a + s.completion, 0) / students.length)
    : 0;
  const displaySessions = subject
    ? totalSessions
    : students?.length ? students.reduce((max, s) => Math.max(max, s.classCount), 0) : 0;

  // ── Dots loader helper ────────────────────────────────────────
  const Dots = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.text3,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>

      {/* ── Controls ── */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center",
        marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select value={month} onChange={e => changePeriod(year, +e.target.value)} style={SEL()}>
          {MONTHS.map((lbl, i) => <option key={i} value={i + 1}>{lbl}</option>)}
        </select>
        <select value={subject} onChange={e => changeSubject(e.target.value)}
          style={SEL({ flex: 1, minWidth: 160 })}>
          <option value="">All Classes</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {loadingSubj && <span style={{ fontSize: 11, color: C.text3 }}>…</span>}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
          <Dots />
          <p style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>
            {subject ? "Fetching class sessions…" : "Loading student attendance…"}
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)",
          borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>
      )}

      {/* ── Data ── */}
      {!loading && !error && students !== null && (
        students.length === 0
          ? <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
              <p style={{ color: C.text3, fontSize: 13 }}>No attendance data for this period.</p>
            </div>
          : <>
              {/* Summary chips */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.1rem", flexWrap: "wrap" }}>
                {[
                  { label: "Students",  value: students.length },
                  { label: "Sessions",  value: displaySessions },
                  { label: "Avg",       value: `${avgCompletion}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ ...CARD, borderRadius: 10, padding: "0.55rem 1rem",
                    flex: 1, minWidth: 100, textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: C.text3, fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: C.text,
                      letterSpacing: "-0.02em" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Student cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {students.map((s) => {
                  const col  = compColor(s.completion);
                  const barW = Math.min(s.completion, 100); // visual bar capped at 100%
                  return (
                    <div key={s.email || s.name} style={{ ...CARD, borderRadius: 12, padding: "0.85rem 1.1rem" }}>
                      {/* Row 1: name + badges + % */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%",
                          background: col, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.name}
                        </p>
                        {s.isExternal && (
                          <span style={{ fontSize: 9, fontWeight: 800, color: C.text3,
                            background: "rgba(240,236,224,0.07)", border: `1px solid ${C.border}`,
                            borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em",
                            flexShrink: 0 }}>
                            EXT
                          </span>
                        )}
                        <p style={{ fontSize: 16, fontWeight: 900, color: col, flexShrink: 0,
                          letterSpacing: "-0.01em" }}>
                          {s.completion}%
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 3, background: "rgba(240,236,224,0.07)",
                        borderRadius: 2, overflow: "hidden", marginBottom: "0.45rem" }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: col,
                          borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
                      </div>

                      {/* Row 2: stats */}
                      <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                        {subject ? (
                          // Filtered by class: show sessions attended / total
                          <span style={{ fontSize: 11, color: C.text3 }}>
                            <span style={{ color: C.text2, fontWeight: 600 }}>
                              {s.sessionsAttended}
                            </span>/{s.classCount} sessions
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: C.text3 }}>
                            <span style={{ color: C.text2, fontWeight: 600 }}>{s.classCount}</span> classes
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: C.text3 }}>
                          <span style={{ color: C.text2, fontWeight: 600 }}>{s.actualMinutes}</span>
                          /{s.expectedMinutes} min
                        </span>
                        {s.completion > 100 && (
                          <span style={{ fontSize: 10, color: C.green, fontWeight: 700,
                            letterSpacing: "0.04em" }}>+{s.completion - 100}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem",
                padding: "0.6rem 0", borderTop: `1px solid ${C.border}` }}>
                {[[C.green, "≥ 80%"], [C.amber, "50–79%"], [C.red, "< 50%"]].map(([col, lbl]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: col }} />
                    <span style={{ fontSize: 11, color: C.text3 }}>{lbl}</span>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: C.text3, marginLeft: "auto" }}>
                  50 effective min/class
                </span>
              </div>
            </>
      )}
    </div>
  );
}

// ── CLASS PREP VIEW (Dilo Coach GEM) ──────────────────────────
const CLASS_PREP_SYSTEM = `You are a class design assistant for DILO Club coaches. Your job is to:
- Design conversation-based English classes
- Explain grammar clearly and simply (the why, not just the how)
- Guide the coach step by step — never dump everything at once
- Always check your knowledge base before generating any material to ensure grammar and content align with the student's level

METHODOLOGICAL APPROACH
Always work under these principles:
- Speaking over perfection — fluency first
- Simple, clear grammar explanations
- Natural American English style
- Dynamic classes that feel like real conversations, not textbook exercises

MANDATORY CLASS OUTPUT FORMAT
To start with the design of the class, you will need a chapter or level, unless the coach asks for the index first.
Every class follows this exact structure, in order, with a coach checkpoint between sections.

Section 1 — Grammar Explanation (for the coach)
Clear, simple explanation of the target grammar point.
Include the most common errors made by Spanish speakers for that structure.

Section 2 — Topic and Narrative Suggestion
Suggest an engaging conversation topic appropriate for the level and grammar point.
Recommend the narrative type best suited for the topic and level (e.g. personal anecdote, hypothetical scenario, news-based discussion, debate, storytelling).
If the coach provides a topic, build from it — if not, suggest one proactively.
Checkpoint: Wait for coach confirmation before continuing.

Section 3 — Class Text
Generate a text connected to the grammar point and topic. Word count by level:
Foundation: 50 words | A1: 100–150 | A2: 150–200 | B1: 200–300 | B2/C1/C2: 300–400

Section 4 — List and translate the phrasal verbs in the text with an example each.

Section 5 — Questions and Discussion Material
Foundation/A1/A2: 15 questions, ordered easy to complex, targeting the chapter's grammar. Some may relate to the text topic — none are reading comprehension questions.
B1: 10 questions using the same format, plus 5 debate statements. Each statement includes 3 coach counters to challenge the student when they give their opinion.
B2/C1/C2: 5 debate statements only, each with 3 counters.

CRITICAL RESTRICTIONS
- Never use grammar structures beyond the student's current level
- Never use past tenses at Foundation or A1 level
- Never reference CEFR or external frameworks — use DILO levels only
- All content is designed for adult professionals ages 20 to 45
- The majority of students are Latin American — be culturally aware
- Every class must be oriented toward real professional conversation

STUDENT PROFILE
Adults 20–45 years old, mostly Latin American (large Costa Rican audience).
Goals: speak fluently and grow professionally. Motivated by relevant, real-world topics.

COACH INTERACTION STYLE
Direct, clear, and conversational. Give real, actionable class tips when relevant.
Always wait for coach confirmation at checkpoints before moving to the next section.
Never generate the full class in one shot — respect the step-by-step flow.

---
DILO CLUB OFFICIAL CURRICULUM
The following is the complete Dilo Club program. Use it as your primary reference for every class you design — chapters, grammar points, vocabulary, idioms, and phrasal verbs must always align with this curriculum.

${DILO_KNOWLEDGE}`;

const PREP_SUGGESTIONS = [
  "Muéstrame el índice del capítulo actual",
  "Necesito una clase de B1 sobre Present Perfect",
  "A2 — tema: trabajo remoto",
  "Foundation — verbos to be y to have",
];

async function streamGemini(messages, onChunk, signal) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key}&alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CLASS_PREP_SYSTEM }] },
      contents: messages.map(m => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 8192, temperature: 1.0 },
    }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const evt  = JSON.parse(raw);
        const text = evt?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {}
    }
  }
}

function parseInline(text, kp = "") {
  const parts = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0, idx = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith("**"))      parts.push(<strong key={kp+idx++}>{m[2]}</strong>);
    else if (raw.startsWith("*"))  parts.push(<em key={kp+idx++}>{m[3]}</em>);
    else parts.push(<code key={kp+idx++} style={{ background:"rgba(240,236,224,0.08)", borderRadius:4, padding:"0 4px", fontSize:"0.88em", fontFamily:"monospace" }}>{m[4]}</code>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownMsg({ text, cursor }) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("### ")) {
      out.push(<p key={i} style={{ fontSize:13, fontWeight:700, color:C.green, margin:"1rem 0 0.2rem" }}>{parseInline(l.slice(4), `h3${i}`)}</p>);
    } else if (l.startsWith("## ")) {
      out.push(<p key={i} style={{ fontSize:15, fontWeight:800, color:C.text, margin:"1.4rem 0 0.3rem", letterSpacing:"-0.01em" }}>{parseInline(l.slice(3), `h2${i}`)}</p>);
    } else if (l.startsWith("# ")) {
      out.push(<p key={i} style={{ fontSize:17, fontWeight:900, color:C.text, margin:"1.5rem 0 0.4rem", letterSpacing:"-0.02em" }}>{parseInline(l.slice(2), `h1${i}`)}</p>);
    } else if (/^---+$/.test(l.trim())) {
      out.push(<div key={i} style={{ height:1, background:C.border, margin:"1rem 0" }} />);
    } else if (/^[-*+] /.test(l)) {
      const items = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom:"0.2rem", lineHeight:1.65 }}>{parseInline(lines[i].slice(2), `li${i}`)}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} style={{ paddingLeft:"1.3rem", margin:"0.35rem 0", fontSize:14, color:C.text }}>{items}</ul>);
      continue;
    } else if (/^\d+\. /.test(l)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom:"0.25rem", lineHeight:1.65 }}>{parseInline(lines[i].replace(/^\d+\. /,""), `oli${i}`)}</li>);
        i++;
      }
      out.push(<ol key={`ol${i}`} style={{ paddingLeft:"1.3rem", margin:"0.35rem 0", fontSize:14, color:C.text }}>{items}</ol>);
      continue;
    } else if (l.trim() === "") {
      if (out.length) out.push(<div key={`sp${i}`} style={{ height:"0.45rem" }} />);
    } else {
      const isLast = i === lines.length - 1;
      out.push(
        <p key={i} style={{ fontSize:14, lineHeight:1.7, color:C.text, margin:"0.05rem 0" }}>
          {parseInline(l, `p${i}`)}
          {isLast && cursor && (
            <span style={{ display:"inline-block", width:2, height:"1em", background:C.green,
              marginLeft:2, verticalAlign:"text-bottom", animation:"pulse 0.8s ease-in-out infinite" }} />
          )}
        </p>
      );
    }
    i++;
  }
  if (cursor && out.length === 0) {
    out.push(<span key="think" style={{ color:C.text3, fontSize:13 }}>Pensando…</span>);
  }
  return <div>{out}</div>;
}

function ClassPrepView() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const textareaRef = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;
    const userMsg = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      await streamGemini(history, (chunk) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }, abortRef.current.signal);
    } catch (err) {
      if (err?.name === "AbortError") return;
      const errText = err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("403")
        ? "API key inválida. Verifica VITE_GEMINI_API_KEY en .env.local"
        : "Error: " + (err?.message || "Unknown error");
      setMessages(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: errText }];
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => { if (!streaming) { setMessages([]); setInput(""); inputRef.current?.focus(); } };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
      height: "100%", maxWidth: 780, width: "100%" }}>

      {/* Toolbar */}
      {messages.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 0.75rem 0", flexShrink: 0 }}>
          <button onClick={reset} disabled={streaming}
            style={{ ...SEL(), padding: "0.3rem 0.75rem", fontSize: 11, opacity: streaming ? 0.4 : 1 }}>
            Nueva conversación
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
        display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "0.5rem" }}>

        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "1.5rem", padding: "2rem 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(109,181,138,0.12)",
              border: "1px solid rgba(109,181,138,0.3)", display: "flex", alignItems: "center",
              justifyContent: "center" }}>
              <DiloLogo height={24} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 6 }}>Prep Class</p>
              <p style={{ fontSize: 13, color: C.text3, maxWidth: 320, lineHeight: 1.6 }}>
                Diseña clases paso a paso. Empieza con el nivel y capítulo, o pide el índice primero.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: 400 }}>
              {PREP_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ ...SEL(), padding: "0.4rem 0.75rem", fontSize: 12, color: C.text2,
                    border: `1px solid ${C.border}`, borderRadius: 20, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const isLast = i === messages.length - 1;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column",
              alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
              {!isUser && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingLeft: 2 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(109,181,138,0.15)",
                    border: "1px solid rgba(109,181,138,0.3)", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: C.green }}>D</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.text3,
                    letterSpacing: "0.06em", textTransform: "uppercase" }}>Dilo</span>
                </div>
              )}
              <div style={{
                maxWidth: "85%",
                padding: isUser ? "0.6rem 1rem" : "0",
                background: isUser ? C.surface2 : "transparent",
                border: isUser ? `1px solid ${C.border2}` : "none",
                borderRadius: isUser ? 14 : 0,
                wordBreak: "break-word",
              }}>
                {isUser
                  ? <p style={{ fontSize:14, lineHeight:1.7, color:C.text, whiteSpace:"pre-wrap" }}>{msg.content}</p>
                  : <MarkdownMsg text={msg.content} cursor={streaming && isLast} />
                }
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: "0.75rem",
        borderTop: `1px solid ${C.border}`, marginTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end",
          background: C.surface2, border: `1px solid ${C.border2}`,
          borderRadius: 16, padding: "0.6rem 0.75rem" }}>
          <textarea
            ref={el => { inputRef.current = el; textareaRef.current = el; }}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={onKeyDown}
            disabled={streaming}
            placeholder="Escribe aquí… (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none",
              color: C.text, fontSize: 14, fontFamily: "inherit", resize: "none",
              lineHeight: 1.6, padding: 0, maxHeight: 140, overflowY: "auto",
              scrollbarWidth: "none", opacity: streaming ? 0.5 : 1 }} />
          <button onClick={() => send()} disabled={streaming || !input.trim()}
            style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer",
              background: streaming || !input.trim() ? C.surface : C.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s", WebkitTapHighlightColor: "transparent" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={streaming || !input.trim() ? C.text3 : C.bg} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 10, color: C.text3, marginTop: "0.4rem", textAlign: "center" }}>
          Shift+Enter para nueva línea
        </p>
      </div>
    </div>
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
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
      else setCollapsed(false);
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
    if (active === "dilo-coach")         return <ClassPrepView user={user} />;
    if (active === "send-feedback")      return <SendFeedbackView user={user} setActive={setActive} />;
    if (active === "class-feedback")    return <ClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-feedback")  return <StudentFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-surveys")   return <StudentSurveysView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-student") return <ClassPrepView user={user} />;
    if (active === "calendario")   return <MasterSchedule role={role} user={user} />;
    if (active === "invites")      return <InvitesView user={user} />;
    if (active === "settings")     return <SettingsView user={user} setActive={setActive} />;
    if (active === "kyc-coach")    return <KYCCoachView user={user} setActive={setActive} />;
    if (active === "perfil")       return <ProfileView user={user} defaultSection="bio" setActive={setActive} />;
    if (active === "perfil-me")    return <ProfileView user={user} defaultSection="me"  setActive={setActive} />;
    if (active === "estudiantes")  return <AttendanceView />;
    if (active === "my-hours")     return <MyHoursView user={user} />;
    if (active === "coaches")      return <CoachesView />;
    if (active === "students")     return <StudentsView />;
    const placeholders = {
      tps:          { title: "TPS", desc: "Training & Practices — content assigned by your coach.", icon: "practice" },
      feedbacks:    { title: "FeedbackHub", desc: "Class feedback history.", icon: "book" },
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
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0.75rem 1.25rem", paddingTop: "max(0.75rem, env(safe-area-inset-top))", gap: "0.75rem", flexShrink: 0, background: C.bg, minHeight: 57 }}>
          {isMobile && (
            <button onClick={() => setCollapsed(c => !c)}
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 6, flexShrink: 0, WebkitTapHighlightColor: "transparent", touchAction: "manipulation", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <Icon name="sidebar" size={18} color={C.text2} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1 }}>
              {VIEW_TITLES[active] || "Dashboard"}<DiloDot size="0.18em" />
            </h1>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "clip", padding: "1.25rem", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}

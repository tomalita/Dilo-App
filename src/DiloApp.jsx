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

// ── SHARED HELPERS ─────────────────────────────────────────────
const IVA_RATE = 0.02;                       // IVA servicios Costa Rica
const CR_UTC_OFFSET_MS = 6 * 60 * 60 * 1000; // Costa Rica es UTC-6 todo el año (sin DST)
const toCRDate = (iso) => new Date(new Date(iso).getTime() - CR_UTC_OFFSET_MS);
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

let USD_RATE = 450; // ₡ por $ — fallback; el valor real vive en app_settings
supabase.from("app_settings").select("value").eq("key", "usd_rate").single()
  .then(({ data }) => { const v = parseFloat(data?.value); if (v > 0) USD_RATE = v; })
  .catch(() => {});

// ── COACH ROSTER — única fuente: coach_rates (via vista coaches_public) ──
// Fallback = roster al momento del build; el vivo se carga antes de renderizar (App.jsx).
const FALLBACK_ROSTER = [
  { coach_name: "Ana",      color: "#f4a7b9", active: true },
  { coach_name: "Ricardo",  color: "#4fc3f7", active: true },
  { coach_name: "Jesse",    color: "#b7e4a0", active: true },
  { coach_name: "Gabriela", color: "#ce93d8", active: true },
  { coach_name: "Mafer",    color: "#1a73e8", active: true },
  { coach_name: "Jose",     color: "#ff9f43", active: true },
];
let COACH_ROSTER = FALLBACK_ROSTER;
const getCoachNames  = () => COACH_ROSTER.filter(c => c.active !== false).map(c => c.coach_name);
const getCoachColors = () => { const m = {}; COACH_ROSTER.forEach(c => { m[c.coach_name] = c.color || "#9e9e9e"; }); return m; };

export async function loadCoachRoster() {
  try {
    const { data } = await supabase.from("coaches_public")
      .select("coach_name, color, active").order("coach_name");
    if (data?.length) {
      COACH_ROSTER = data;
      // Refresh derived module-level lists (declared further down)
      COACH_COLORS = getCoachColors();
      COACHES      = ["All", ...getCoachNames()];
      FB_COACHES   = [...getCoachNames()].sort();
      AVATAR_COLORS = getCoachColors();
    }
  } catch { /* keep fallback */ }
}

// Toast no-bloqueante — reemplaza alert() nativo con el estilo de la app
function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed", left: "50%", bottom: "calc(24px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)", background: "#1e1b17", color: "#f0ece0",
    border: "1px solid rgba(240,236,224,0.25)", borderRadius: "10px",
    padding: "0.6rem 1rem", fontSize: "13px", fontFamily: "'Archivo', sans-serif",
    zIndex: 9999, maxWidth: "90vw", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    opacity: "0", transition: "opacity 0.25s",
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; });
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3500);
}

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
    recap:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    whatsapp:  <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
    slides:    <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
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
    { id: "dashboard",    label: "Dashboard",    icon: "home" },
    { id: "calendario",   label: "Calendar",     icon: "calendar" },
    { id: "feedbacks",    label: "FeedbackHub",  icon: "book" },
    { id: "tps",          label: "TPS",          icon: "practice" },
    { id: "dilo-student", label: "Dilo Student", icon: "agent" },
  ],
  coach: [
    { section: "Overview" },
    { id: "dashboard",    label: "Dashboard",    icon: "home" },
    { id: "calendario",   label: "Calendar",     icon: "calendar" },
    { id: "next-classes", label: "Next Classes", icon: "schedule" },
    { section: "Teaching" },
    { id: "feedbacks",    label: "FeedbackHub",  icon: "book" },
    { id: "class-recaps", label: "Class Recaps", icon: "recap" },
    { id: "dinamicas",    label: "Dynamic Class",icon: "slides" },
    { section: "Track" },
    { id: "progress",     label: "Progress",     icon: "practice" },
    { id: "my-hours",     label: "My Hours",     icon: "metrics" },
  ],
  admin: [
    { section: "Overview" },
    { id: "dashboard",    label: "Dashboard",    icon: "home" },
    { id: "calendario",   label: "Calendar",     icon: "calendar" },
    { id: "next-classes", label: "Next Classes", icon: "schedule" },
    { section: "People" },
    { id: "coaches",      label: "Coaches",      icon: "coach" },
    { id: "students",     label: "Students",     icon: "payment" },
    { id: "progress",     label: "Progress",     icon: "practice" },
    { section: "Reporting" },
    { id: "feedbacks",    label: "FeedbackHub",  icon: "book" },
    { id: "class-recaps", label: "Class Recaps", icon: "recap" },
    { id: "estudiantes",  label: "Attendance",   icon: "users" },
    { section: "Finance" },
    { id: "cashier",      label: "Cashier",      icon: "payment" },
    { section: "Communications" },
    { id: "whatsapp",     label: "WhatsApp",     icon: "whatsapp" },
    { id: "invites",      label: "Invitations",  icon: "invite" },
    { section: "Teaching" },
    { id: "dinamicas",    label: "Dynamic Class",icon: "slides" },
    { id: "dilo-coach",   label: "Dilo Coach",   icon: "agent" },
    { id: "dilo-student", label: "Dilo Student", icon: "agent" },
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
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [weekCache,       setWeekCache]       = useState({});  // offset → events[]
  const [weekLoading,     setWeekLoading]     = useState(true);
  const [rankMonthOffset, setRankMonthOffset] = useState(0);
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

  const COACHES      = getCoachNames();
  const COACH_COLORS = getCoachColors();

  const fetchTeams = (start, end) => fetch(EDGE_URL, {
    method:"POST",
    headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
    body: JSON.stringify({ source:"teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() })
  }).then(r=>r.json()).then(d =>
    Array.isArray(d) ? d.map(ev=>({...ev, date: toCRDate(ev.start)})).filter(ev=>!isNaN(ev.date)) : []
  ).catch(()=>[]);

  // Mount: coach name + month events + sheets (once only)
  useEffect(() => {
    delete _schedCache[0];
    _monthCache = null;
    _dashboardFetch = null;

    const coachNamePromise = supabase.from("profiles").select("nombre").eq("id", user.id).single()
      .then(({ data }) => data?.nombre || user?.nombre || "");

    const p2 = supabase
      .from("class_sessions")
      .select("coach, class_date, class_time")
      .then(({ data }) => (data || []).map(r => ({
        coach:      r.coach,
        fecha:      r.class_date,
        hora_clase: r.class_time,
      }))).catch(() => []);

    const p3 = supabase.from("student_feedback_sent").select("*")
      .then(({ data }) => data || []).catch(() => []);

    const p4 = supabase
      .from("class_session_students")
      .select("student_name, performance_note, next_step, class_sessions(class_date, class_time, coach)")
      .then(({ data }) => (data || []).map(r => ({
        estudiante_nombre: r.student_name,
        nota:              r.performance_note,
        next_step:         r.next_step,
        coach:             r.class_sessions?.coach      || "",
        hora_clase:        r.class_sessions?.class_time  || "",
        fecha:             r.class_sessions?.class_date  || "",
      }))).catch(() => []);

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
      const fbDate = new Date(fb.fecha + "T00:00:00");
      if (`${fbDate.getDate()}/${fbDate.getMonth()+1}/${fbDate.getFullYear()}` !== `${ev.date.getDate()}/${ev.date.getMonth()+1}/${ev.date.getFullYear()}`) return false;
      return (fb.hora_clase||"").trim().toUpperCase() === timeStr.toUpperCase();
    });
  });

  const crNow = new Date(now.getTime() - CR_UTC_OFFSET_MS);
  const pastOnly = evs => evs.filter(ev => ev.date < crNow);
  const weekIsFuture = monday > crNow;
  const missingFbs = getMissingFbs(weekIsFuture ? myClasses : pastOnly(myClasses));
  const missingMonthFbs = getMissingFbs(pastOnly(myMonthClasses));
  // Ranking — month-filtered
  const getRankMonthBounds = (offset) => {
    const n = new Date();
    const start = new Date(n.getFullYear(), n.getMonth() + offset, 1);
    const end   = new Date(n.getFullYear(), n.getMonth() + offset + 1, 0, 23, 59, 59);
    return { start, end };
  };
  const { start: rankStart, end: rankEnd } = getRankMonthBounds(rankMonthOffset);
  const rankMonthLabel = rankStart.toLocaleDateString("en", { month: "long", year: "numeric" });

  const getRating = (coach) => {
    const surveys = allSurveys.filter(s => {
      if (s.coach !== coach) return false;
      if (!s.fecha) return true;
      const dt = new Date(s.fecha + "T00:00:00");
      if (isNaN(dt)) return true;
      return dt >= rankStart && dt <= rankEnd;
    });
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
    .map(r => ({ ...r, _date: new Date(r.fecha + "T00:00:00") }))
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
    // Cross-check rules (100% precision):
    //   1. Student overlap: skip past events with completely different students.
    //   2. Dropped-student filter: exclude notes for students who left the class.
    const toTk = s => s.trim().split('@')[0].split(/[\s_]/)[0].toLowerCase().replace(/\d/g,'');
    const getTkSet = str => new Set((str||'').split(/[,;&\/]/).map(toTk).filter(t=>t.length>=3));
    const currentTks = getTkSet(nextClass.estudiantes);

    for (const ev of candidates) {
      // Rule 1: skip if students are completely different
      const pastTks = getTkSet(ev.estudiantes);
      if (currentTks.size > 0 && pastTks.size > 0) {
        const ok = [...currentTks].some(ct => [...pastTks].some(pt => ct===pt||ct.startsWith(pt)||pt.startsWith(ct)));
        if (!ok) continue;
      }

      const evDay = new Date(ev.date); evDay.setHours(0, 0, 0, 0);
      const evH  = ev.date.getHours();
      const evM  = ev.date.getMinutes();
      const ampm = evH >= 12 ? "PM" : "AM";
      const h12  = evH % 12 || 12;
      const tStr = `${h12}:${evM.toString().padStart(2,"0")} ${ampm}`;

      // Lazy day-by-day search: day 0 first; only advance if empty.
      // Prevents capturing notes from a *different* student's class at the same
      // time on the next day (e.g. Melissa's 5 PM notes leaking into Hector's briefing).
      const matchDayNotes = d => allStudentNotes.filter(r =>
        r._date.getTime() === d.getTime() &&
        r.coach.split(" ")[0] === ev.coach &&
        (r.hora_clase||"").trim().replace(/\s+/g," ").toUpperCase() === tStr.toUpperCase()
      );
      const evDay1 = new Date(evDay); evDay1.setDate(evDay.getDate()+1);
      const evDay2 = new Date(evDay); evDay2.setDate(evDay.getDate()+2);
      const d0 = matchDayNotes(evDay);
      const d1 = d0.length === 0 ? matchDayNotes(evDay1) : [];
      const d2 = d1.length === 0 ? matchDayNotes(evDay2) : [];
      const notes = d0.length > 0 ? d0 : d1.length > 0 ? d1 : d2;
      if (notes.length === 0) continue;

      // Rule 2: filter out notes for students who dropped from the class
      const droppedTks = [...pastTks].filter(pt =>
        !([...currentTks].some(ct => ct===pt||ct.startsWith(pt)||pt.startsWith(ct)))
      );
      const filtered = droppedTks.length > 0
        ? notes.filter(r => {
            const nt = (r.estudiante_nombre||"").split(" ")[0].toLowerCase();
            return !droppedTks.some(d => nt===d||nt.startsWith(d)||d.startsWith(nt));
          })
        : notes;

      if (filtered.length > 0) { prevFeedback = filtered; break; }
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
                      <p style={{ fontSize:10, color:C.text3 }}>{isoFmt(r.fecha)}</p>
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
      <div style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem" }}>
        {/* Month navigator */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
          <button onClick={() => setRankMonthOffset(o => o - 1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1 }}>‹</button>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color: rankMonthOffset === 0 ? C.green : C.text3, margin:0 }}>
              {rankMonthOffset === 0 ? "This month" : rankMonthOffset === -1 ? "Last month" : rankMonthLabel}
            </p>
            <p style={{ fontSize:11, color:C.text3, margin:0 }}>{rankMonthLabel}</p>
          </div>
          <button onClick={() => setRankMonthOffset(o => Math.min(o + 1, 0))}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color: rankMonthOffset === 0 ? C.border2 : C.text2, fontSize:18, cursor: rankMonthOffset === 0 ? "default" : "pointer", lineHeight:1 }}>›</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
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
            { label:"Feedback due this week", value: weekLoading?"—":missingFbs.length, accent: weekLoading ? undefined : missingFbs.length > 0 ? C.amber : C.green },
            { label:"Feedback due this month",value: loading?"—":missingMonthFbs.length, accent: loading ? undefined : missingMonthFbs.length > 0 ? C.amber : C.green },
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
          <p style={{ fontSize:11, fontWeight:700, color:C.amber, marginBottom:"0.6rem" }}>{missingFbs.length} Feedback{missingFbs.length>1?"s":""} pending</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
            {missingFbs.map((ev,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:50, background:"rgba(240,236,224,0.04)", color:C.text2, border:`1px solid ${C.border2}`, display:"inline-flex", alignItems:"center", gap:5 }}>
                {ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} {ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}<span style={{fontSize:10,color:C.amber}}>⚠</span>
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
  const [attendedSessionIds, setAttendedSessionIds] = useState(new Set());
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
  const mo = MONTHS_SHORT;
  const weekLabel = weekMon.getMonth() === weekSat.getMonth()
    ? `${weekMon.getDate()} – ${weekSat.getDate()} ${mo[weekMon.getMonth()]} ${weekMon.getFullYear()}`
    : `${weekMon.getDate()} ${mo[weekMon.getMonth()]} – ${weekSat.getDate()} ${mo[weekSat.getMonth()]} ${weekSat.getFullYear()}`;

  const COACHES = getCoachNames();
  const COACH_COLORS = getCoachColors();

  useEffect(() => {
    const from = new Date(dateFrom + "T00:00:00");
    const to = new Date(dateTo + "T00:00:00"); to.setHours(23,59,59,999);

    setLoading(true);

    const _nowA = new Date(); const _dayA = _nowA.getDay();
    const _monA = new Date(_nowA); _monA.setDate(_nowA.getDate()-(_dayA===0?6:_dayA-1)); _monA.setHours(0,0,0,0);

    (async () => {
      // Teams events
      let ev = [];
      try {
        const d = await fetch(EDGE_URL, {
          method:"POST",
          headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
          body: JSON.stringify({ source:"teams", startDateTime: from.toISOString(), endDateTime: to.toISOString() })
        }).then(r=>r.json());
        ev = Array.isArray(d) ? d.map(e=>({...e, date: toCRDate(e.start)})).filter(e=>!isNaN(e.date)) : [];
        if (from.getTime() === _monA.getTime()) {
          _schedCache[0] = ev.map(e => ({ uid: e.uid||(e.summary||"")+(e.start||""), summary: e.summary||"Sin título", date: e.date, coach: e.coach||"Unassigned", nivel:"", estudiantes:e.estudiantes||"", joinUrl:e.joinUrl||null, urgente:false }));
        }
      } catch(_) {}

      // Class Feedbacks — class_sessions filtered by week (id included for attendance cross-check)
      let cf = [];
      try {
        const { data } = await supabase.from("class_sessions").select("id, coach, class_date, class_time").gte("class_date", dateFrom).lte("class_date", dateTo);
        cf = (data || []).map(r => ({ id: r.id, coach: r.coach, fecha: r.class_date, hora_clase: r.class_time }));
      } catch(_) {}

      // Attendance imported — which sessions have at least one record in session_attendance
      let attIds = new Set();
      try {
        if (cf.length) {
          const { data: attData } = await supabase
            .from("session_attendance")
            .select("class_session_id")
            .in("class_session_id", cf.map(r => r.id));
          attIds = new Set((attData || []).map(a => a.class_session_id));
        }
      } catch(_) {}

      // Student Feedbacks — via class_session_students
      let sf = [];
      try {
        const { data } = await supabase.from("class_sessions").select("coach, class_date, class_session_students(id)").gte("class_date", dateFrom).lte("class_date", dateTo);
        sf = (data || []).flatMap(r => (r.class_session_students || []).map(() => ({ coach: r.coach, fecha: r.class_date })));
      } catch(_) {}

      // Surveys — Supabase
      let sv = [];
      try {
        const { data: svData } = await supabase.from("student_feedback_sent").select("*").gte("fecha", dateFrom).lte("fecha", dateTo);
        sv = svData || [];
      } catch(_) {}

      setTeamsEvents(ev);
      setClassFeedbacks(cf);
      setStudentFeedbacks(sf);
      setSurveys(sv);
      setAttendedSessionIds(attIds);
      setLoading(false);
    })();
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
    classes:    teamsEvents.length,
    classFb:    classFeedbacks.length,
    studentFb:  studentFeedbacks.length,
    surveys:    surveys.length,
    unassigned: teamsEvents.filter(ev => !COACHES.includes(ev.coach)).length,
    attendance: classFeedbacks.filter(r => attendedSessionIds.has(r.id)).length,
  };

  const maxClasses = Math.max(...coachStats.map(c => c.classes), 1);

  const adminNow = new Date();
  const nextAdminClass = teamsEvents.filter(ev => ev.date >= adminNow).sort((a,b) => a.date - b.date)[0] || null;
  const ADMIN_COACH_COLORS = getCoachColors();

  return (
    <div style={{ maxWidth: 900, width: "100%" }}>
      {/* Week navigator */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.5rem" }}>
        <button onClick={() => setWeekOffset(w => w - 1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
        <span style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:C.text }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
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
          { label:"Unassigned", value: loading?"—":totals.unassigned, sub:"No coach assigned",
            accent: !loading ? (totals.unassigned === 0 ? C.green : C.red) : undefined },
          { label:"Attendance", value: loading?"—":`${totals.attendance}/${totals.classFb}`, sub:"Sessions imported",
            accent: !loading && totals.classFb > 0
              ? (totals.attendance === totals.classFb ? C.green : totals.attendance > 0 ? C.amber : undefined)
              : undefined },
          { label:"Class Feedbacks", value: loading?"—":totals.classFb, sub:"Sent by coaches" },
          { label:"Student Feedbacks", value: loading?"—":totals.studentFb, sub:"Individual notes" },
          { label:"Student Surveys", value: loading?"—":totals.surveys, sub:"Received from students" },
        ].map((s,i) => (
          <div key={i} style={{ ...CARD, borderRadius:16, padding:"1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>{s.label}</p>
            <p style={{ fontSize:"clamp(1.8rem,6vw,2.6rem)", fontWeight:900, letterSpacing:"-0.04em", color: s.accent || C.text, lineHeight:1 }}>{s.value}</p>
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
                <div style={{ display:"flex", justifyContent:"center", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
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
                  const fbParsed = new Date(fb.fecha + "T00:00:00");
                  if (`${fbParsed.getDate()}/${fbParsed.getMonth()+1}/${fbParsed.getFullYear()}` !== `${evDate.getDate()}/${evDate.getMonth()+1}/${evDate.getFullYear()}`) return false;
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
                            const label = `${ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} ${ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}`;
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
    { id: "new-class-feedback", title: "Class Feedback", desc: "Submit per-student scores across listening, grammar, reading and speaking.", send: true, notStudent: true },
    { id: "class-feedback",   title: "Class Feedbacks Sent", desc: "Review your submitted class feedback.", coachOnly: true },
    { id: "class-feedback",   title: "Class Feedback Sent", desc: "Coach notes on each class performance.", adminOnly: true },
    { id: "student-feedback", title: "Student Feedback Sent", desc: "Individual student notes and next steps." },
    { id: "student-surveys",  title: "Student Surveys",   desc: "Satisfaction surveys completed by students.", adminOnly: true },
  ];
  const cards = allCards.filter(c => {
    if (c.adminOnly && role !== "admin") return false;
    if (c.coachOnly && role !== "coach") return false;
    if (c.notStudent && role === "student") return false;
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
// Converts ISO "YYYY-MM-DD" → "DD/MM/YYYY" for display (does not create a Date object)
const isoFmt = s => s ? s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4) : "";
const ANON_KEY        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk";
const EDGE_URL        = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/rapid-endpoint";
const ATTENDANCE_URL  = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/attendance-endpoint";
const WHATSAPP_URL    = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/whatsapp-sender";
const CASHIER_URL        = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/smooth-processor";
const CASHIER_INTENT_URL = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/cashier-create-intent"; // update slug after deploy
const ONVO_PUBLIC_KEY    = "onvo_live_publishable_key_-zkvnOlRgc4_rkP58dkc7JcsiIesaqrH-0lLFVXUMAOS7fGKfAxsnM_9TSbWkAi5KnmdmD2CTDSqt44q26CsDQ";
// Module-level caches — survive component unmount/remount (navigation between tabs)
const _schedCache = {};     // weekOffset → events[]  (shared: Dashboard seeds, Schedule reads)
let   _monthCache = null;   // coach month events      (shared: Dashboard seeds, Schedule reads)
let   _dashboardFetch = null; // in-flight p1combined promise — Calendar awaits this instead of a parallel Graph call
const SHEET_CLASS    = "1TmxAa-dbaTgPYCZyXl91fJDIZ997-8twnbQEmVluZ6A";
const SHEET_STUDENT  = "1jwDyhxVAnj0LY5k0fs_n3eYzLorCkAMBxapFA-7SgYw";
const SHEET_SURVEYS  = "1R1n_ucN9mnky1vVYXyEFnYghaJjemzqRHQ7URv6LTUE";

let COACH_COLORS = getCoachColors();
let COACHES = ["All", ...getCoachNames()];

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

function useSurveys() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("student_feedback_sent").select("*").order("fecha", { ascending: false })
      .then(({ data }) => { setData(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
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
let FB_COACHES = [...getCoachNames()].sort();
const FB_HOURS   = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const FB_MINS    = ['00','30'];
const FB_AMPM    = ['AM','PM'];

const fbSection = { background:"rgba(240,236,224,0.06)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"1px solid rgba(240,236,224,0.12)", borderRadius:14, padding:"1.25rem", marginBottom:"0.75rem" };
const fbLabel   = { display:"block", fontSize:12, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", color:"rgba(240,236,224,0.5)", marginBottom:"0.4rem" };
const fbInput   = { width:"100%", background:"rgba(240,236,224,0.05)", border:"1px solid rgba(240,236,224,0.07)", borderRadius:9, color:"#f0ece0", fontFamily:"inherit", fontSize:16, fontWeight:500, padding:"0.75rem 0.9rem", outline:"none", appearance:"none", WebkitAppearance:"none", display:"block" };
const fbErr     = { fontSize:11, color:"#c20000", marginTop:"0.3rem" };
const fbLine    = { height:1, background:"rgba(240,236,224,0.07)", margin:"1.25rem 0" };

function FbScaleInput({ name, label, hint, value, onSelect, error, disabled }) {
  return (
    <div style={{ marginBottom:"1.25rem", opacity: disabled ? 0.3 : 1, transition:"opacity 0.2s", pointerEvents: disabled ? "none" : "auto" }}>
      <label style={fbLabel}>{label} <span style={{ color:"#c20000" }}>*</span></label>
      {hint && <p style={{ fontSize:11, color:"rgba(240,236,224,0.25)", marginBottom:"0.5rem", lineHeight:1.5 }}>{hint}</p>}
      <div style={{ display:"flex", gap:"0.35rem" }}>
        {[1,2,3,4,5].map(v => {
          const active = !disabled && value !== null && v <= value;
          const bc = active ? (value <= 2 ? "#c20000" : value <= 4 ? "#ca9a04" : "#6DB58A") : "rgba(240,236,224,0.1)";
          return (
            <button key={v} type="button" onClick={() => !disabled && onSelect(name, v)}
              style={{ flex:1, aspectRatio:"1", background:"rgba(240,236,224,0.04)", border:`1px solid ${bc}`, borderRadius:8, fontSize:14, fontWeight:active?600:400, color:active?"#f0ece0":"rgba(240,236,224,0.3)", cursor: disabled?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", minHeight:44, fontFamily:"inherit", transition:"all 0.15s" }}>
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
  const coachName = (user?.nombre || "").split(" ")[0];

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
      s.textContent = ".fb-drum::-webkit-scrollbar{display:none}[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:rgba(240,236,224,0.25);pointer-events:none}";
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

// ── NEW CLASS FEEDBACK ────────────────────────────────────────

const NCF_SCORES = [
  { key:"listening",       label:"Listening Comprehension", hint:"How accurately did this student process and respond to spoken input without needing repetition?" },
  { key:"grammar",         label:"Grammar Spontaneity",     hint:"How naturally did they use today's target structures without overthinking?" },
  { key:"reading",         label:"Reading Engagement",      hint:"How well did this student interact with written material — understanding, inferring, and discussing the text?" },
  { key:"oral_confidence", label:"Oral Confidence",         hint:"How confidently did this student engage verbally — initiating, responding, and sustaining ideas in English?" },
  { key:"speaking_fluency",label:"Speaking Fluency",        hint:"How naturally and fluidly did this student express themselves without excessive pausing or switching to Spanish?" },
  { key:"speaking_output", label:"Speaking Output",         hint:"How actively and clearly did this student contribute to the conversation in English?" },
];

function NewStudentCard({ idx, isOnly, data, onChange, onRemove, onToggleNoShow, hasReading, errors }) {
  return (
    <div style={{ background: data.noShow ? "rgba(194,0,0,0.05)" : "rgba(240,236,224,0.06)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border: `1px solid ${data.noShow ? "rgba(194,0,0,0.25)" : "rgba(240,236,224,0.12)"}`, borderRadius:14, padding:"1.25rem", marginBottom:"0.75rem", transition:"background 0.2s, border-color 0.2s" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color: data.noShow ? "#c20000" : C.green }}>
          {isOnly ? "Student" : `Student ${idx+1}`}{data.noShow ? " — NO SHOW" : ""}
        </span>
        {!isOnly && (
          <button type="button" onClick={onRemove}
            style={{ background:"transparent", border:"1px solid rgba(240,236,224,0.07)", color:"rgba(240,236,224,0.3)", borderRadius:50, fontSize:11, fontWeight:600, padding:"0.35rem 0.75rem", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#c20000";e.currentTarget.style.color="#c20000";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(240,236,224,0.07)";e.currentTarget.style.color="rgba(240,236,224,0.3)";}}>
            Remove
          </button>
        )}
      </div>

      {/* Name */}
      <div style={{ marginBottom:"0.75rem" }}>
        <label style={fbLabel}>Student name <span style={{color:"#c20000"}}>*</span></label>
        <input type="text" value={data.name} onChange={e => onChange(idx,"name",e.target.value)} placeholder="Full name..."
          style={{ ...fbInput, borderColor: errors[`${idx}_name`] ? "#c20000" : "rgba(240,236,224,0.07)" }} />
        {errors[`${idx}_name`] && <p style={fbErr}>Enter the name.</p>}
      </div>

      {/* No Show checkbox */}
      <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem", cursor: data.loadingPrev ? "wait" : "pointer", userSelect:"none" }}>
        <input type="checkbox" checked={data.noShow} onChange={() => onToggleNoShow(idx)}
          disabled={data.loadingPrev}
          style={{ width:15, height:15, cursor:"inherit", accentColor:"#c20000", flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:600, color: data.noShow ? "#c20000" : "rgba(240,236,224,0.4)", transition:"color 0.15s" }}>
          No Show
        </span>
        {data.loadingPrev && (
          <span style={{ fontSize:11, color:"rgba(240,236,224,0.3)", fontStyle:"italic" }}>Loading previous notes…</span>
        )}
      </label>

      {/* Scores — disabled when No Show */}
      {NCF_SCORES.filter(s => s.key !== "reading" || hasReading).map(s => (
        <FbScaleInput key={s.key} name={s.key} label={s.label} hint={s.hint}
          value={data[s.key]} onSelect={(_, v) => onChange(idx, s.key, v)}
          error={errors[`${idx}_${s.key}`]} disabled={data.noShow} />
      ))}

      <div style={fbLine} />

      {/* Performance note */}
      <div style={{ marginBottom:"1rem" }}>
        <label style={fbLabel}>Performance note <span style={{color:"#c20000"}}>*</span></label>
        <textarea value={data.performance_note} onChange={e => onChange(idx,"performance_note",e.target.value)}
          placeholder={data.noShow ? "Auto-filled from previous session…" : "Describe their overall performance — what stood out, what struggled..."}
          style={{ ...fbInput, resize:"none", minHeight:80, lineHeight:1.5, borderColor: errors[`${idx}_performance_note`] ? "#c20000" : "rgba(240,236,224,0.07)" }} />
        {errors[`${idx}_performance_note`] && <p style={fbErr}>Add a note.</p>}
      </div>

      {/* Next step */}
      <div>
        <label style={fbLabel}>Next Step <span style={{color:"#c20000"}}>*</span></label>
        <textarea value={data.next_step} onChange={e => onChange(idx,"next_step",e.target.value)}
          placeholder={data.noShow ? "Auto-filled from previous session…" : "One specific, actionable thing to work on next session..."}
          style={{ ...fbInput, resize:"none", minHeight:80, lineHeight:1.5, borderColor: errors[`${idx}_next_step`] ? "#c20000" : "rgba(240,236,224,0.07)" }} />
        {errors[`${idx}_next_step`] && <p style={fbErr}>Add a next step.</p>}
      </div>
    </div>
  );
}

function NewClassFeedbackView({ user, role, setActive }) {
  const coachName = (user?.nombre || "").split(" ")[0];
  const [coach,      setCoach]     = useState(coachName);
  const [classDate,  setClassDate] = useState(crToday);
  const [classType,  setClassType] = useState("");
  const [hasReading, setHasReading]= useState(false);
  const [hora,           setHora]           = useState("");
  const [classTitle,     setClassTitle]     = useState("");
  const [dayClasses,     setDayClasses]     = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);

  const emptyStudent = () => ({ name:"", listening:null, grammar:null, reading:null, oral_confidence:null, speaking_fluency:null, speaking_output:null, performance_note:"", next_step:"", noShow:false, loadingPrev:false });
  const [students,   setStudents]  = useState([emptyStudent()]);
  const [errors,     setErrors]    = useState({});
  const [submitting, setSubmitting]= useState(false);
  const [submitted,  setSubmitted] = useState(false);
  const [submitErr,  setSubmitErr] = useState("");

  // Fetch Teams classes for the selected date + coach
  useEffect(() => {
    if (!classDate || !coach) { setDayClasses([]); return; }
    setDayClasses([]);
    setHora("");
    setClassTitle("");
    setClassesLoading(true);
    const ds = new Date(classDate + "T00:00:00");
    const de = new Date(classDate + "T23:59:59");
    Promise.all([
      fetch(EDGE_URL, {
        method:"POST",
        headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
        body: JSON.stringify({ source:"teams", startDateTime: ds.toISOString(), endDateTime: de.toISOString() })
      }).then(r=>r.json()).catch(()=>[]),
      supabase.from("class_sessions").select("class_time").eq("coach", coach).eq("class_date", classDate)
        .then(({data})=>(data||[]).map(s=>s.class_time.trim().toUpperCase())).catch(()=>[]),
    ]).then(([d, submittedTimes]) => {
      const submitted = new Set(submittedTimes);
      const evs = Array.isArray(d)
        ? d.map(ev=>({...ev, date: toCRDate(ev.start)}))
            .filter(ev=>!isNaN(ev.date))
            .filter(ev=>(ev.coach||"").split(" ")[0].toLowerCase()===coach.toLowerCase())
            .filter(ev=>{
              const h=ev.date.getHours(),m=ev.date.getMinutes();
              const t=`${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
              return !submitted.has(t.toUpperCase());
            })
            .sort((a,b)=>a.date-b.date)
        : [];
      setDayClasses(evs);
    }).catch(()=>setDayClasses([])).finally(()=>setClassesLoading(false));
  }, [classDate, coach]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateStudent(idx, field, val) {
    setStudents(a => a.map((s,i) => i===idx ? { ...s, [field]:val } : s));
    setErrors(e => ({ ...e, [`${idx}_${field}`]:false }));
  }

  async function handleNoShowToggle(idx) {
    const current = students[idx];
    const newNoShow = !current.noShow;

    // If unchecking, just remove no-show state (keep the auto-filled text for editing)
    if (!newNoShow) {
      setStudents(a => a.map((s,i) => i===idx ? { ...s, noShow:false, loadingPrev:false } : s));
      return;
    }

    // Checking: set loadingPrev while we fetch previous session
    setStudents(a => a.map((s,i) => i===idx ? { ...s, noShow:true, loadingPrev:true } : s));

    try {
      const studentName = current.name.trim();
      let prevNote = "";
      let prevNext = "";

      if (studentName) {
        // Last real (non-no-show) session for this student
        const { data: rows } = await supabase
          .from("class_session_students")
          .select("performance_note, next_step, class_sessions(class_date)")
          .ilike("student_name", studentName)
          .eq("no_show", false)
          .not("performance_note", "is", null)
          .order("id", { ascending: false })
          .limit(1);

        if (rows && rows.length > 0) {
          prevNote = rows[0].performance_note || "";
          prevNext = rows[0].next_step || "";
        }
        // If no previous session, leave blank — coach fills in manually
      }

      setStudents(a => a.map((s,i) => i===idx
        ? { ...s, noShow:true, loadingPrev:false, performance_note:prevNote, next_step:prevNext }
        : s
      ));
    } catch(e) {
      console.error("handleNoShowToggle error:", e);
      setStudents(a => a.map((s,i) => i===idx
        ? { ...s, noShow:true, loadingPrev:false, performance_note:"", next_step:"" }
        : s
      ));
    }
  }

  function validate() {
    const errs = {};
    if (!coach)     errs.coach     = true;
    if (!classDate) errs.classDate = true;
    if (!hora)      errs.hora      = true;
    if (!classType) errs.classType = true;
    students.forEach((s,i) => {
      if (!s.name.trim())             errs[`${i}_name`]             = true;
      if (!s.noShow) {
        if (!s.listening)               errs[`${i}_listening`]        = true;
        if (!s.grammar)                 errs[`${i}_grammar`]          = true;
        if (hasReading && !s.reading)   errs[`${i}_reading`]          = true;
        if (!s.oral_confidence)         errs[`${i}_oral_confidence`]  = true;
        if (!s.speaking_fluency)        errs[`${i}_speaking_fluency`] = true;
        if (!s.speaking_output)         errs[`${i}_speaking_output`]  = true;
      }
      if (!s.performance_note.trim()) errs[`${i}_performance_note`] = true;
      if (!s.next_step.trim())        errs[`${i}_next_step`]        = true;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      const { data: session, error: sessionErr } = await supabase
        .from("class_sessions")
        .insert({ coach, class_date: classDate, class_time: hora, class_type: classType, class_title: classTitle||null, has_reading: hasReading, created_by: user?.id })
        .select().single();
      if (sessionErr) throw sessionErr;

      const { error: studentsErr } = await supabase
        .from("class_session_students")
        .insert(students.map(s => ({
          session_id:       session.id,
          student_name:     s.name,
          no_show:          s.noShow || false,
          listening:        s.noShow ? null : s.listening,
          grammar:          s.noShow ? null : s.grammar,
          reading:          s.noShow ? null : (hasReading ? s.reading : null),
          oral_confidence:  s.noShow ? null : s.oral_confidence,
          speaking_fluency: s.noShow ? null : s.speaking_fluency,
          speaking_output:  s.noShow ? null : s.speaking_output,
          performance_note: s.performance_note,
          next_step:        s.next_step,
        })));
      if (studentsErr) throw studentsErr;
      setActive("feedbacks");
    } catch(e) {
      setSubmitErr("Something went wrong. Please try again.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  const drumCol = { flex:1, overflowY:"scroll", scrollSnapType:"y mandatory", WebkitOverflowScrolling:"touch", scrollbarWidth:"none", padding:"88px 0", textAlign:"center" };

  return (
    <div style={{ maxWidth:560, width:"100%" }}>
      <div style={{ marginBottom:"1.5rem" }}>
        <BackBtn onClick={() => setActive("feedbacks")} />
        <h2 style={{ fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text, marginBottom:"0.4rem" }}>Class Feedback</h2>
        <p style={{ fontSize:13, color:C.text2, lineHeight:1.6 }}>Fill in the class details, then add scores and notes for each student.</p>
      </div>

      {/* ── Class Info ── */}
      <div style={fbSection}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:"1rem" }}>Class Info</p>

        {/* Coach */}
        {role === "admin" && (
          <div style={{ marginBottom:"1rem" }}>
            <label style={fbLabel}>Coach <span style={{color:"#c20000"}}>*</span></label>
            <select value={coach} onChange={e=>{setCoach(e.target.value);setErrors(er=>({...er,coach:false}));}}
              style={{ ...fbInput, borderColor: errors.coach ? "#c20000" : "rgba(240,236,224,0.07)" }}>
              <option value="">Select coach...</option>
              {FB_COACHES.map(c=><option key={c} value={c} style={{background:"#1e1b17",color:"#f0ece0"}}>{c}</option>)}
            </select>
            {errors.coach && <p style={fbErr}>Select a coach.</p>}
          </div>
        )}

        {/* Date + Time row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1rem" }}>
          <div>
            <label style={fbLabel}>Date <span style={{color:"#c20000"}}>*</span></label>
            <input type="date" value={classDate} onChange={e=>{setClassDate(e.target.value);setErrors(er=>({...er,classDate:false}));}}
              style={{ ...fbInput, borderColor: errors.classDate ? "#c20000" : "rgba(240,236,224,0.07)" }} />
            {errors.classDate && <p style={fbErr}>Select a date.</p>}
          </div>
          <div>
            <label style={fbLabel}>Class <span style={{color:"#c20000"}}>*</span></label>
            {classesLoading
              ? <div style={{ ...fbInput, color:C.text3 }}>Loading…</div>
              : dayClasses.length === 0
              ? <div style={{ ...fbInput, color:C.green, fontWeight:600 }}>You're up-to-date!</div>
              : <select value={hora}
                  onChange={e=>{
                    const t=e.target.value;
                    const ev=dayClasses.find(ev=>{const h=ev.date.getHours(),m=ev.date.getMinutes(),ap=h>=12?"PM":"AM";return `${h%12||12}:${String(m).padStart(2,"0")} ${ap}`===t;});
                    setHora(t);
                    const title = ev?.summary||"";
                    setClassTitle(title);
                    setErrors(er=>({...er,hora:false}));
                    if (classType === "Private" && title) {
                      const classMatch = title.match(/class\s+(.+)$/i);
                      const studentName = classMatch ? classMatch[1].trim() : title.split(/\s+/).pop();
                      setStudents(prev => prev.map((s,i) => i===0 ? { ...s, name: studentName } : s));
                    }
                  }}
                  style={{ ...fbInput, borderColor: errors.hora ? "#c20000" : "rgba(240,236,224,0.07)", color: hora ? C.text : "rgba(240,236,224,0.25)" }}>
                  <option value="">Select class…</option>
                  {dayClasses.map((ev,i)=>{
                    const h=ev.date.getHours(),m=ev.date.getMinutes();
                    const ampm=h>=12?"PM":"AM"; const h12=h%12||12;
                    const time=`${h12}:${String(m).padStart(2,"0")} ${ampm}`;
                    return <option key={i} value={time} style={{background:"#1e1b17",color:"#f0ece0"}}>{time} · {ev.summary||"Class"}</option>;
                  })}
                </select>
            }
            {errors.hora && <p style={fbErr}>Select a class.</p>}
          </div>
        </div>

        {/* Class type */}
        <div style={{ marginBottom:"1rem" }}>
          <label style={fbLabel}>Class type <span style={{color:"#c20000"}}>*</span></label>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {["Group","Private"].map(t => (
              <button key={t} type="button" onClick={()=>{
                setClassType(t);
                setErrors(er=>({...er,classType:false}));
                if (t === "Private" && classTitle) {
                  const classMatch = classTitle.match(/class\s+(.+)$/i);
                  const studentName = classMatch ? classMatch[1].trim() : classTitle.split(/\s+/).pop();
                  setStudents(prev => prev.map((s,i) => i===0 ? { ...s, name: studentName } : s));
                }
              }}
                style={{ flex:1, padding:"0.65rem", borderRadius:9, border:`1px solid ${classType===t ? C.green : "rgba(240,236,224,0.1)"}`, background: classType===t ? "rgba(109,181,138,0.12)" : "transparent", color: classType===t ? C.green : C.text3, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
          {errors.classType && <p style={fbErr}>Select a class type.</p>}
        </div>

        {/* Reading toggle */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.75rem 0", borderTop:`1px solid rgba(240,236,224,0.07)` }}>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>This class included reading</p>
            <p style={{ fontSize:11, color:C.text3 }}>Enables the Reading Engagement score for all students</p>
          </div>
          <button type="button" onClick={()=>setHasReading(r=>!r)}
            style={{ width:44, height:24, borderRadius:12, border:"none", background: hasReading ? C.green : "rgba(240,236,224,0.12)", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
            <span style={{ position:"absolute", top:2, left: hasReading ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
          </button>
        </div>
      </div>

      {/* ── Students ── */}
      {students.map((s,i) => (
        <NewStudentCard key={i} idx={i} isOnly={students.length===1} data={s}
          onChange={updateStudent} onRemove={() => setStudents(a=>a.filter((_,j)=>j!==i))}
          onToggleNoShow={handleNoShowToggle}
          hasReading={hasReading} errors={errors} />
      ))}


      {classType === "Group" && (
        <button type="button" onClick={()=>setStudents(a=>[...a,emptyStudent()])}
          style={{ width:"100%", background:"transparent", border:"1px dashed rgba(240,236,224,0.1)", borderRadius:14, color:"rgba(240,236,224,0.3)", fontFamily:"inherit", fontSize:13, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", padding:"1rem", cursor:"pointer", transition:"all 0.2s", marginBottom:"0.75rem", minHeight:44 }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(240,236,224,0.25)";e.currentTarget.style.color=C.text2;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(240,236,224,0.1)";e.currentTarget.style.color="rgba(240,236,224,0.3)";}}>
          + Add student
        </button>
      )}

      {submitErr && <p style={{ fontSize:12, color:"#c20000", marginBottom:"0.75rem", textAlign:"center" }}>{submitErr}</p>}

      <button type="button" onClick={handleSubmit} disabled={submitting}
        style={{ width:"100%", background: submitting ? "rgba(109,181,138,0.4)" : C.green, border:"none", borderRadius:12, color:"#0d0b08", fontFamily:"inherit", fontSize:15, fontWeight:700, padding:"1rem", cursor: submitting ? "not-allowed" : "pointer", transition:"all 0.2s", marginBottom:"2rem" }}>
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}

// CLASS FEEDBACK VIEW
function ClassFeedbackView({ user, role, setActive }) {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [coachFilter, setCoachFilter] = useState("All");
  const [dateFrom,    setDateFrom]    = useState(() => getWeekRange().from);
  const [dateTo,      setDateTo]      = useState(() => getWeekRange().to);
  const [expanded,    setExpanded]    = useState(null);

  useEffect(() => {
    if (role === "coach" && user?.id) {
      supabase.from("profiles").select("nombre").eq("id", user.id).single()
        .then(({ data }) => { if (data?.nombre) setCoachFilter(data.nombre.split(" ")[0]); });
    }
  }, [role, user?.id]);

  useEffect(() => {
    supabase
      .from("class_sessions")
      .select("id, coach, class_date, class_time, class_type, has_reading, class_session_students(student_name, listening, grammar, reading, oral_confidence, speaking_fluency, speaking_output, no_show)")
      .order("class_date", { ascending: false })
      .then(({ data: sessions }) => { setData(sessions || []); setLoading(false); });
  }, []);

  const metrics = [
    { key:"listening",        label:"Listening" },
    { key:"grammar",          label:"Grammar" },
    { key:"reading",          label:"Reading" },
    { key:"oral_confidence",  label:"Confidence" },
    { key:"speaking_fluency", label:"Fluency" },
    { key:"speaking_output",  label:"Output" },
  ];

  const filtered = data.filter(r => {
    if (coachFilter !== "All" && r.coach !== coachFilter) return false;
    if (r.class_date) {
      const dt = new Date(r.class_date + "T00:00:00");
      const from = new Date(dateFrom + "T00:00:00");
      const to   = new Date(dateTo   + "T00:00:00"); to.setHours(23,59,59,999);
      if (dt < from || dt > to) return false;
    }
    return true;
  });

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
        {role !== "coach" && <CoachFilter value={coachFilter} onChange={setCoachFilter} />}
      </div>
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
          {filtered.map((session, i) => (
            <div key={session.id || i} style={{ ...CARD, borderLeft:`3px solid ${COACH_COLORS[session.coach]||C.text3}`, borderRadius:14, overflow:"hidden" }}>
              <button onClick={() => setExpanded(expanded===i ? null : i)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"0.75rem", padding:"1rem 1.25rem", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", WebkitTapHighlightColor:"transparent" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:COACH_COLORS[session.coach]||C.text2 }}>{session.coach}</p>
                    <p style={{ fontSize:11, color:C.text3 }}>{session.class_time}</p>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:50, background:"rgba(240,236,224,0.06)", border:`1px solid ${C.border2}`, color:C.text3, textTransform:"uppercase", letterSpacing:"0.08em" }}>{session.class_type}</span>
                    <p style={{ fontSize:11, color:C.text3, marginLeft:"auto" }}>{isoFmt(session.class_date)}</p>
                  </div>
                  <p style={{ fontSize:11, color:C.text3, marginTop:3 }}>{session.class_session_students?.length || 0} student{session.class_session_students?.length !== 1 ? "s" : ""}</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0, transform:expanded===i?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s"}}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {expanded===i && (
                <div style={{ borderTop:`1px solid ${C.border}` }}>
                  {(session.class_session_students || []).map((s, j) => (
                    <div key={j} style={{ padding:"0.75rem 1.25rem", borderBottom: j < session.class_session_students.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.student_name}</p>
                        {s.no_show && <span style={{ fontSize:10, fontWeight:700, color:C.amber }}>No show ⚠</span>}
                      </div>
                      {!s.no_show && (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:"0.4rem" }}>
                          {metrics
                            .filter(m => m.key !== "reading" || session.has_reading)
                            .filter(m => s[m.key] != null)
                            .map(m => (
                              <div key={m.key}>
                                <p style={{ fontSize:10, color:C.text3, marginBottom:2, letterSpacing:"0.06em", textTransform:"uppercase" }}>{m.label}</p>
                                <ScoreBar value={+s[m.key]||0} color={COACH_COLORS[session.coach]||"rgba(240,236,224,0.6)"} />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// STUDENT FEEDBACK VIEW
function StudentFeedbackView({ user, role, setActive }) {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [coachFilter, setCoachFilter] = useState("All");
  const [search,      setSearch]      = useState("");
  const [expanded,    setExpanded]    = useState(null);
  const [dateFrom,    setDateFrom]    = useState(() => getWeekRange().from);
  const [dateTo,      setDateTo]      = useState(() => getWeekRange().to);

  useEffect(() => {
    if (role === "coach" && user?.id) {
      supabase.from("profiles").select("nombre").eq("id", user.id).single()
        .then(({ data }) => { if (data?.nombre) setCoachFilter(data.nombre.split(" ")[0]); });
    }
  }, [role, user?.id]);

  useEffect(() => {
    supabase
      .from("class_session_students")
      .select("student_name, performance_note, next_step, no_show, class_sessions(class_date, class_time, coach)")
      .order("id", { ascending: false })
      .then(({ data: rows }) => {
        setData((rows || []).map(r => ({
          estudiante_nombre: r.student_name,
          nota:              r.performance_note,
          next_step:         r.next_step,
          no_show:           r.no_show,
          coach:             r.class_sessions?.coach || "",
          hora_clase:        r.class_sessions?.class_time || "",
          fecha:             r.class_sessions?.class_date || "",
        })));
        setLoading(false);
      });
  }, []);

  const filtered = data.filter(r => {
    if (coachFilter !== "All" && r.coach !== coachFilter) return false;
    if (search && !r.estudiante_nombre?.toLowerCase().includes(search.toLowerCase())) return false;
    if (r.fecha) {
      const dt = new Date(r.fecha + "T00:00:00");
      const from = new Date(dateFrom + "T00:00:00");
      const to   = new Date(dateTo   + "T00:00:00"); to.setHours(23,59,59,999);
      if (dt < from || dt > to) return false;
    }
    return true;
  });

  const isNoShow = r => r.no_show === true;

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
                    <p style={{ fontSize:11, color:C.text3 }}>{r.hora_clase} · {isoFmt(r.fecha)}</p>
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
  const { data, loading } = useSurveys();
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
      const dt   = new Date(r.fecha + "T00:00:00");
      const from = new Date(dateFrom + "T00:00:00");
      const to   = new Date(dateTo   + "T00:00:00"); to.setHours(23,59,59,999);
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
        <div style={{ display:"flex", justifyContent:"center", gap:6, padding:"2rem" }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
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
                <p style={{ fontSize:11, color:C.text3, marginLeft:"auto" }}>{isoFmt(r.fecha)}</p>
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
  const MONTHS = MONTHS_SHORT;
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

  const coachColors = { ...getCoachColors() };
  if (coachColors.Gabriela) coachColors.Gaby = coachColors.Gabriela; // alias legacy
  const URGENTE_COLOR = "#c20000";

  // Convención: email = nombre en minúscula @dilo.club
  const coachEmails = Object.fromEntries(getCoachNames().map(n => [n.toLowerCase() + "@dilo.club", n]));

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
            const evs = d.map(ev => ({ ...ev, date: toCRDate(ev.start) })).filter(ev => !isNaN(ev.date));
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
            summary: ev.summary||"Sin título", date: toCRDate(ev.start),
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
          const crDate = toCRDate(ev.start);
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
  const mo = MONTHS_SHORT;
  const weekLabel = weekDates[0].getMonth() === weekDates[5].getMonth()
    ? `${weekDates[0].getDate()} – ${weekDates[5].getDate()} ${mo[weekDates[0].getMonth()]}, ${weekDates[0].getFullYear()}`
    : `${weekDates[0].getDate()} ${mo[weekDates[0].getMonth()]} – ${weekDates[5].getDate()} ${mo[weekDates[5].getMonth()]}, ${weekDates[0].getFullYear()}`;

  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", position: "relative" }}>
        <button onClick={() => setWeekOffset(w => Math.max(MIN_OFFSET, w - 1))}
          style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, padding: "4px 12px", color: C.text2, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <button onClick={() => setShowCal(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="calendar" size={16} color={C.text} />
            <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{weekLabel}</h2>
            <span style={{ fontSize: 12, color: C.text }}>▾</span>
          </button>
          {showCal && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
              <MiniCalendar weekOffset={weekOffset} setWeekOffset={setWeekOffset} onClose={() => setShowCal(false)} />
            </div>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(MAX_OFFSET, w + 1))}
          style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, padding: "4px 12px", color: C.text2, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>›</button>
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
        const coachColors = getCoachColors();
        const coaches = getCoachNames();
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
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "1rem" }}>
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
  const [form, setForm] = useState({ nombre: "", apellido: "", teams_email: "", phone: "" });
  const isBio = defaultSection !== "me";

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            teams_email: data.teams_email || data.email || "",
            phone: data.phone || "",
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
        teams_email: form.teams_email.trim(),
        phone: form.phone.trim(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      console.error("Profile save error:", error);
      toast("Error al guardar: " + error.message);
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
    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "2rem" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Teams email</label>
              <input value={form.teams_email} onChange={e => setForm(v => ({ ...v, teams_email: e.target.value }))}
                placeholder="The email where Teams invitations are sent"
                style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
              <p style={{ fontSize: 11, color: C.text3 }}>We use this email to show your classes in the calendar.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>WhatsApp</label>
              <input value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                placeholder="+50688887777"
                style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
              <p style={{ fontSize: 11, color: C.text3 }}>Número con código de país. Lo usamos para enviarte recordatorios de clase y avisos de pago.</p>
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
let AVATAR_COLORS = getCoachColors();

function UserMenu({ user, role, collapsed, isMobile, onLogout, setActive, setCollapsed, unreadWA = 0, setUnreadWA }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (user?.nombre || user?.email || "U")[0].toUpperCase();
  const avatarColor = role === "coach" ? (AVATAR_COLORS[user?.nombre] || C.text2) : C.text2;

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, []);

  return (
    <div ref={ref} style={{ padding: "0.25rem 0.4rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
      {/* Popup menu */}
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "0.4rem", right: "0.4rem", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100 }}>
          {/* User info header */}
          <div style={{ padding: "0.65rem 0.85rem", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.nombre ? `${user.nombre}${user.apellido ? " " + user.apellido : ""}` : user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p style={{ fontSize: 10, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || ""}
            </p>
          </div>
          {/* Menu items */}
          {[
            { label: "Settings",      icon: "settings", action: () => { setActive("settings"); setOpen(false); if (isMobile) setCollapsed(true); } },
            { label: "Notifications", icon: "bell",    action: () => { setActive("whatsapp"); setOpen(false); if (isMobile) setCollapsed(true); }, badge: unreadWA > 0 ? unreadWA : null },
            { label: "Sign out",      icon: "logout",  action: () => { setOpen(false); onLogout(); } },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "none", background: "transparent", cursor: "pointer", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon name={item.icon} size={15} color={item.danger ? C.red : C.text2} />
              <span style={{ fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text2, flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  background: C.red, color: "#fff", fontSize: 10, fontWeight: 700,
                  borderRadius: "50%", minWidth: 18, height: 18, padding: "0 4px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{item.badge > 99 ? "99+" : item.badge}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: collapsed && !isMobile ? "0.35rem" : "0.35rem 0.5rem", borderRadius: 8, border: "none", background: open ? C.surface2 : "transparent", cursor: "pointer", justifyContent: collapsed && !isMobile ? "center" : "flex-start", WebkitTapHighlightColor: "transparent", transition: "background 0.15s" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: avatarColor + "22", border: `1px solid ${avatarColor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: avatarColor }}>{initial}</span>
        </div>
        {(!collapsed || isMobile) && (
          <p style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
            {role && <span style={{ fontWeight: 400, color: C.text3 }}> · {role}</span>}
          </p>
        )}
        {(!collapsed || isMobile) && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────
function Sidebar({ role, user, active, setActive, collapsed, setCollapsed, isMobile, onLogout, unreadWA, setUnreadWA }) {
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
          {navItems.map((item, idx) => {
            if (item.section) {
              if (collapsed && !isMobile) return null;
              return (
                <p key={"sec-" + idx} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, padding: idx === 0 ? "0.5rem 0.75rem 0.25rem" : "1rem 0.75rem 0.25rem" }}>
                  {item.section}
                </p>
              );
            }
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
        <UserMenu user={user} role={role} collapsed={collapsed} isMobile={isMobile} onLogout={onLogout} setActive={setActive} setCollapsed={setCollapsed} unreadWA={unreadWA} setUnreadWA={setUnreadWA} />
        <div style={{ height: "env(safe-area-inset-bottom)", flexShrink: 0 }} />
      </aside>
    </>
  );
}

// ── NEXT CLASSES VIEW ─────────────────────────────────────────
function NextClassesView({ user, role }) {
  const [dayOffset,    setDayOffset]    = useState(0);
  const [dayCache,     setDayCache]     = useState({});
  const [prevWeekEvs,  setPrevWeekEvs]  = useState([]);
  const [currWeekEvs,  setCurrWeekEvs]  = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  const [loadingDay,   setLoadingDay]   = useState(true);
  const [loadingInit,  setLoadingInit]  = useState(true);
  const [coachName,    setCoachName]    = useState(user?.nombre || "");
  const [coachFilter,  setCoachFilter]  = useState("All");

  const COACHES      = getCoachNames();
  const COACH_COLORS = getCoachColors();

  const getDayBounds = (offset) => {
    const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(0,0,0,0);
    const end = new Date(d); end.setHours(23,59,59,999);
    return { dayStart: d, dayEnd: end };
  };
  const { dayStart, dayEnd } = getDayBounds(dayOffset);

  const fetchTeams = (s, e) => fetch(EDGE_URL, {
    method:"POST", headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
    body: JSON.stringify({ source:"teams", startDateTime: s.toISOString(), endDateTime: e.toISOString() })
  }).then(r=>r.json()).then(d =>
    Array.isArray(d) ? d.map(ev=>({...ev, date: toCRDate(ev.start)})).filter(ev=>!isNaN(ev.date)) : []
  ).catch(()=>[]);

  // Mount: coach name + student notes + previous week (for cross-check)
  useEffect(() => {
    const nameP = role === "coach"
      ? supabase.from("profiles").select("nombre").eq("id", user.id).single()
          .then(({ data }) => data?.nombre || user?.nombre || "")
      : Promise.resolve("");

    const notesP = supabase
      .from("class_session_students")
      .select("student_name, performance_note, next_step, no_show, class_sessions(class_date, class_time, coach, class_type, class_title)")
      .then(({ data }) => (data || [])
        .map(r => {
          const d = r.class_sessions?.class_date
            ? new Date(r.class_sessions.class_date + "T00:00:00")
            : null;
          return {
            estudiante_nombre: r.student_name,
            nota:              r.performance_note,
            next_step:         r.next_step,
            coach:             r.class_sessions?.coach       || "",
            hora_clase:        r.class_sessions?.class_time  || "",
            fecha:             r.class_sessions?.class_date  || "",
            class_type:        r.class_sessions?.class_type  || "",
            class_title:       r.class_sessions?.class_title || "",
            _date:             d,
          };
        })
        .filter(r => r._date && !isNaN(r._date))
      ).catch(() => []);

    // Previous week + current week (Mon→now) for cross-check
    const now = new Date(); const dow = now.getDay();

    // Semana pasada (lun–sáb)
    const pMon = new Date(now); pMon.setDate(now.getDate()-(dow===0?6:dow-1)-7); pMon.setHours(0,0,0,0);
    const pSat = new Date(pMon); pSat.setDate(pMon.getDate()+5); pSat.setHours(23,59,59,999);
    const prevP = (_schedCache[-1] && _schedCache[-1].length > 0)
      ? Promise.resolve(_schedCache[-1])
      : fetchTeams(pMon, pSat);

    // Esta semana: lunes 00:00 → ahora
    // Captura clases de días anteriores de la semana actual (ej. martes cuando hoy es jueves)
    const cMon = new Date(now); cMon.setDate(now.getDate()-(dow===0?6:dow-1)); cMon.setHours(0,0,0,0);
    const currP = cMon < now ? fetchTeams(cMon, now) : Promise.resolve([]);

    Promise.all([nameP, notesP, prevP, currP]).then(([name, notes, prevEvs, currEvs]) => {
      if (name) setCoachName(name);
      setStudentNotes(notes);
      setPrevWeekEvs(prevEvs);
      setCurrWeekEvs(currEvs);
      setLoadingInit(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch day's Teams events (with cache)
  useEffect(() => {
    if (dayCache[dayOffset] !== undefined) { setLoadingDay(false); return; }
    setLoadingDay(true);
    fetchTeams(dayStart, dayEnd).then(evs => {
      setDayCache(c => ({ ...c, [dayOffset]: evs }));
      setLoadingDay(false);
    });
  }, [dayOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const nowTs      = new Date();
  const dayEvents  = (dayCache[dayOffset] || []).filter(ev => ev.date >= dayStart && ev.date <= dayEnd);
  const activeCoach = role === "coach" ? coachName : (coachFilter !== "All" ? coachFilter : null);
  const classes    = dayEvents.filter(ev => !activeCoach || ev.coach === activeCoach).sort((a,b) => a.date - b.date);

  // Pool para cross-check: prioridad más reciente primero
  //   1. Eventos pasados de HOY (dayOffset actual)
  //   2. Resto de la semana actual (lunes → ayer/ahora) — captura ej. martes cuando hoy es jueves
  //   3. Semana pasada — fallback si no hubo clase esta semana
  const seenPool = new Set();
  const pool = [
    ...dayEvents.filter(ev => ev.date < nowTs),
    ...currWeekEvs,
    ...prevWeekEvs,
  ].filter(ev => {
    const k = ev.uid || (ev.summary + ev.date.toISOString());
    if (seenPool.has(k)) return false; seenPool.add(k); return true;
  });

  // Extract a stable alpha token from an email or display name.
  // "manfredcordoba06@gmail.com" → "manfredcordoba"
  // "helcha_82@hotmail.com"      → "helcha"
  // "Hellen Something"           → "hellen"
  // "Melissa"                    → "melissa"
  const toToken = s => s.trim().split('@')[0].split(/[\s_]/)[0].toLowerCase().replace(/\d/g,'');
  const getTokenSet = str => new Set(
    (str||'').split(/[,;&\/]/).map(toToken).filter(t => t.length >= 3)
  );

  // Compute pre-class briefing for one class event.
  //
  // Cross-check logic (source of truth):
  //   Teams ev.date       → ancla principal: fecha EXACTA de la clase pasada
  //   Teams ev.date hora  → hora exacta del evento pasado
  //   Teams ev.coach      → coach que impartió ESA sesión específica (puede rotar)
  //   Sheet col A r._date → ventana de envío: mismo día o hasta 2 días después de la clase
  //   Sheet col B r.coach → debe coincidir con ev.coach (el coach del evento PASADO, no el actual)
  //   Sheet col C r.hora_clase → debe coincidir con la hora del evento pasado
  //
  // Precision rules:
  //   1. Only use a past event if its students OVERLAP with the current class's students.
  //      (Prevents showing Christopher's notes when Manfred took the slot.)
  //   2. After finding matching notes, filter OUT notes for students who LEFT the class.
  //      (Prevents showing Melissa's notes when only Hellen remains.)
  const getBriefing = (cls) => {
    const clsH = cls.date.getHours(), clsM = cls.date.getMinutes();
    const clsSum = (cls.summary||"").toLowerCase().trim();
    const clsSeriesId = cls.seriesId || null;
    const currentTokens = getTokenSet(cls.estudiantes);
    const tStrCls = `${clsH%12||12}:${String(clsM).padStart(2,"0")} ${clsH>=12?"PM":"AM"}`;

    // Group classes always start with a digit (e.g. "03A2 - Your English Class").
    // Private classes start with a letter (e.g. "A1 - Your English Class Melissa").
    const isGroupClass = /^\d/.test((cls.summary||"").trim());

    const normStr = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'');

    // Tokens from class title — private class titles include the student name, which
    // normalized matches the student_name field reliably (handles accents like Fráncel).
    const summaryTokens = new Set(
      (cls.summary||"").split(/\s+/)
        .map(w => normStr(w.toLowerCase()).replace(/[^a-z]/g,''))
        .filter(w => w.length >= 3)
    );

    const studentMatches = (r) => {
      const nt = normStr(toToken(r.estudiante_nombre || ""));
      if (summaryTokens.has(nt)) return true;
      return [...currentTokens].some(ct => {
        const nct = normStr(ct);
        return nt === nct || nt.startsWith(nct) || nct.startsWith(nt);
      });
    };

    // ── Path A: private class — most recent notes by student name ────────────
    // No time constraint: private classes get rescheduled; the student name is the
    // reliable identifier. Group classes skip directly to Path B.
    if (!isGroupClass) {
      const byName = studentNotes
        .filter(r => r._date < nowTs && studentMatches(r))
        .sort((a, b) => b._date - a._date);
      if (byName.length > 0) {
        const latestMs = byName[0]._date.getTime();
        return byName.filter(r => r._date.getTime() === latestMs);
      }
    }

    // ── Path A group: match by group code stored in class_title ─────────────
    // Group classes always start with a numeric code (e.g. "03A2"). That code is
    // saved as class_title when the coach submits feedback. This is the most direct
    // way to find all sessions for a group regardless of coach, time, or date.
    if (isGroupClass) {
      // Extract only the numeric group number (e.g. "03" from "03A2 - Your English Class").
      // Matching by group number instead of the full code means notes survive level changes:
      // group 03 at level A2 and at level B1 are the same students.
      const groupNum = ((cls.summary||"").match(/^(\d+)/)||[])[1]||"";
      if (groupNum) {
        const groupNotes = studentNotes
          .filter(r => r._date < nowTs && (r.class_title||"").startsWith(groupNum))
          .sort((a, b) => b._date - a._date);
        if (groupNotes.length > 0) {
          const latestMs = groupNotes[0]._date.getTime();
          const latestTime = groupNotes[0].hora_clase;
          return groupNotes.filter(r =>
            r._date.getTime() === latestMs && r.hora_clase === latestTime
          );
        }
      }
    }

    // ── Path B: Teams pool search ─────────────────────────────────────────────
    // Primary path for group classes without class_title yet (legacy records).
    // Fallback for private classes (Path A found nothing).
    // 1️⃣ Series ID match (coach-agnostic — coaches rotate on the same recurring slot)
    const bySeriesId = clsSeriesId
      ? pool.filter(ev => ev.seriesId && ev.seriesId === clsSeriesId).sort((a,b)=>b.date-a.date)
      : [];

    // 2️⃣ Time slot match (coach-agnostic; student overlap check guards precision)
    const matchT = ev => ev.date.getHours() === clsH && ev.date.getMinutes() === clsM;
    const matchS = ev => { const s=(ev.summary||"").toLowerCase().trim(); return !clsSum||!s||s===clsSum; };

    const candidates = bySeriesId.length > 0 ? bySeriesId : (() => {
      const ts = pool.filter(ev => matchT(ev) && matchS(ev)).sort((a,b)=>b.date-a.date);
      return ts.length > 0 ? ts : pool.filter(matchT).sort((a,b)=>b.date-a.date);
    })();

    for (const ev of candidates) {
      // Rule 1: student overlap check
      const pastTokens = getTokenSet(ev.estudiantes);
      if (currentTokens.size > 0) {
        if (pastTokens.size === 0) {
          // Teams has no attendee data for this past event.
          // Group classes: can't verify → skip.
          // Private classes: studentMatches in Rule 2 will guard precision.
          if (isGroupClass) continue;
        } else {
          const hasOverlap = [...currentTokens].some(ct =>
            [...pastTokens].some(pt => ct === pt || ct.startsWith(pt) || pt.startsWith(ct))
          );
          if (!hasOverlap) continue;
        }
      }

      const h = ev.date.getHours(), m = ev.date.getMinutes();
      const tStr = `${h%12||12}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;
      const evDay = new Date(ev.date); evDay.setHours(0,0,0,0);

      // Lazy day search: day 0 first, advance only if empty (prevents capturing a
      // different student's notes submitted the next day at the same time slot).
      const evStudentCount = (ev.estudiantes||"").split(/[,;&\/]/).map(s=>s.trim()).filter(s=>s.length>2).length;
      const evClassType = evStudentCount > 1 ? "Group" : evStudentCount === 1 ? "Private" : null;
      const matchDay = d => studentNotes.filter(r =>
        r._date.getTime() === d.getTime() && r._date < nowTs &&
        r.coach.split(" ")[0] === ev.coach &&
        (r.hora_clase||"").trim().replace(/\s+/g," ").toUpperCase() === tStr.toUpperCase() &&
        (!evClassType || !r.class_type || r.class_type === evClassType)
      );
      const d0 = matchDay(evDay);
      const evDay1 = new Date(evDay); evDay1.setDate(evDay.getDate()+1);
      const d1 = d0.length === 0 ? matchDay(evDay1) : [];
      const evDay2 = new Date(evDay); evDay2.setDate(evDay.getDate()+2);
      const d2 = d1.length === 0 ? matchDay(evDay2) : [];
      const notes = d0.length > 0 ? d0 : d1.length > 0 ? d1 : d2;
      if (notes.length === 0) continue;

      // Rule 2: private class → filter to the specific student (drops ex-students).
      //         Group class  → return the full session (student name matching is
      //                        unreliable against email tokens like "cinmontoyac").
      const filteredNotes = !isGroupClass
        ? notes.filter(r => studentMatches(r))
        : notes;

      if (filteredNotes.length > 0) return filteredNotes;
    }

    // ── Last resort: group class, Teams pool empty ────────────────────────────
    // Path B found nothing (class last occurred > 2 weeks ago or Teams returned no data).
    // Coaches rotate on group slots, so we drop the coach filter and return the most
    // recent session at this exact time slot.
    if (isGroupClass) {
      const byTime = studentNotes
        .filter(r => r._date < nowTs
          && (r.hora_clase||"").trim().toUpperCase() === tStrCls.toUpperCase())
        .sort((a, b) => b._date - a._date);
      if (byTime.length > 0) {
        const latestMs = byTime[0]._date.getTime();
        return byTime.filter(r => r._date.getTime() === latestMs);
      }
    }
    return [];
  };

  const dayLabel = dayOffset===0 ? "Today" : dayOffset===1 ? "Tomorrow" : dayOffset===-1 ? "Yesterday"
    : dayOffset>0 ? `+${dayOffset} days` : `${dayOffset} days`;

  return (
    <div style={{ maxWidth:700, width:"100%" }}>
      {/* Day navigator */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
        <button onClick={()=>setDayOffset(o=>o-1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1 }}>‹</button>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:dayOffset===0?C.green:C.text3, margin:0 }}>{dayLabel}</p>
          <p style={{ fontSize:11, color:C.text3, margin:0 }}>{dayStart.toLocaleDateString("en",{weekday:"short",month:"long",day:"numeric"})}</p>
        </div>
        <button onClick={()=>setDayOffset(o=>o+1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1 }}>›</button>
      </div>

      {/* Admin coach filter */}
      {role === "admin" && (
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1rem" }}>
          {["All",...COACHES].map(c => (
            <button key={c} onClick={()=>setCoachFilter(c)}
              style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:50, cursor:"pointer", border:"1px solid",
                borderColor: coachFilter===c ? (COACH_COLORS[c]||C.green) : C.border2,
                background:  coachFilter===c ? (COACH_COLORS[c]||C.green)+"22" : "transparent",
                color:       coachFilter===c ? (COACH_COLORS[c]||C.green) : C.text3 }}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Class cards */}
      {loadingDay || loadingInit ? (
        <div style={{ display:"flex", gap:6, padding:"3rem", justifyContent:"center" }}>
          {[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
        </div>
      ) : classes.length === 0 ? (
        <div style={{ ...CARD, borderRadius:16, padding:"2.5rem", textAlign:"center" }}>
          <p style={{ fontSize:13, color:C.text3 }}>No classes{activeCoach?` for ${activeCoach}`:""} on this day.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {classes.map((cls, i) => {
            const briefing = getBriefing(cls);
            const isPast   = cls.date < nowTs;
            return (
              <div key={cls.uid||i} style={{ ...CARD, borderRadius:16, padding:"1.25rem 1.5rem", opacity:isPast?0.65:1, transition:"opacity 0.2s" }}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                  <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
                    background: isPast ? "rgba(240,236,224,0.04)" : "rgba(37,211,102,0.1)",
                    border: `1px solid ${isPast ? C.border : "rgba(37,211,102,0.25)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name="calendar" size={18} color={isPast?C.text3:C.green} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2,
                      color: isPast ? C.text3 : C.green }}>
                      {isPast ? "Past" : "Upcoming"}
                      {role==="admin" && cls.coach && (
                        <span style={{ color:COACH_COLORS[cls.coach]||C.text3, marginLeft:8 }}>· {cls.coach}</span>
                      )}
                    </p>
                    <p style={{ fontSize:15, fontWeight:700, color:C.text }}>
                      {cls.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
                      {cls.summary && cls.summary!=="Sin título" && (
                        <span style={{ fontSize:12, fontWeight:500, color:C.text2, marginLeft:8 }}>{cls.summary}</span>
                      )}
                    </p>
                    {cls.estudiantes && (
                      <p style={{ fontSize:11, color:C.text3, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cls.estudiantes}</p>
                    )}
                  </div>
                </div>

                {/* Pre-class briefing */}
                {briefing.length > 0 ? (
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:"1rem", paddingTop:"1rem" }}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:"0.65rem" }}>
                      Last session · Student notes
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                      {briefing.map((r, j) => (
                        <div key={j} style={{ borderLeft:`2px solid ${C.border2}`, paddingLeft:"0.75rem" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.35rem", flexWrap:"wrap" }}>
                            <p style={{ fontSize:12, fontWeight:700, color:C.text }}>{r.estudiante_nombre}</p>
                            <p style={{ fontSize:10, color:C.text3 }}>{isoFmt(r.fecha)}</p>
                          </div>
                          {r.nota && (
                            <p style={{ fontSize:11, color:C.text2, lineHeight:1.5, marginBottom:r.next_step?"0.3rem":0 }}>
                              <span style={{ color:C.text3, fontWeight:600 }}>Note: </span>{r.nota}
                            </p>
                          )}
                          {r.next_step && (
                            <p style={{ fontSize:11, lineHeight:1.5 }}>
                              <span style={{ color:C.text3, fontWeight:600 }}>Next step: </span>
                              <span style={{ color:C.text }}>{r.next_step}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !isPast && (
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:"1rem", paddingTop:"0.75rem" }}>
                    <p style={{ fontSize:11, color:C.text3 }}>No previous session notes for this class.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── VIEW TITLES (shown in top bar) ────────────────────────────
// ── DINÁMICAS ──────────────────────────────────────────────────
const OPT_COLORS = ['#7a2020','#1e427a','#7a621e','#1e6645'];
function getYouTubeId(url) {
  const m = (url || '').match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function DinamicasView({ user }) {
  const [sub, setSub]                 = useState('list');
  const [decks, setDecks]             = useState([]);
  const [editDeck, setEditDeck]       = useState(null);
  const [editingSlide, setEditingSlide] = useState(null);
  const [session, setSession]         = useState(null);
  const [sessionSlides, setSessionSlides] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [responses, setResponses]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [slidesToDelete, setSlidesToDelete] = useState([]);
  const chanRef = useRef(null);
  const rtfRef  = useRef(null);

  const BTN  = { background: C.text, color: C.bg, border: "none", borderRadius: 50, fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "8px 18px", cursor: "pointer", minHeight: 38, whiteSpace: "nowrap" };
  const GHOST = { background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 50, fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: C.text2, padding: "6px 14px", cursor: "pointer", minHeight: 34, whiteSpace: "nowrap" };

  useEffect(() => { loadDecks(); return () => { if (chanRef.current) supabase.removeChannel(chanRef.current); }; }, []);

  useEffect(() => {
    if (rtfRef.current && sub === 'editor' && editDeck && editingSlide !== null) {
      rtfRef.current.innerHTML = editDeck.slides[editingSlide]?.question || '';
    }
  }, [editingSlide, sub]);

  async function loadDecks() {
    setLoading(true);
    const { data } = await supabase.from('decks').select('id,title,created_at').eq('coach_id', user.id).order('created_at', { ascending: false });
    const withCount = await Promise.all((data || []).map(async d => {
      const { count } = await supabase.from('slides').select('*', { count: 'exact', head: true }).eq('deck_id', d.id);
      return { ...d, slide_count: count || 0 };
    }));
    setDecks(withCount);
    setLoading(false);
  }

  function createDeck() {
    const tempId = 'new-' + Date.now();
    setEditDeck({ id: tempId, coach_id: user.id, title: 'New presentation', slides: [] });
    setEditingSlide(null);
    setTitleEditing(false);
    setSlidesToDelete([]);
    setSub('editor');
  }

  async function openEditor(deck) {
    const { data: slides } = await supabase.from('slides').select('*').eq('deck_id', deck.id).order('position');
    const sl = slides || [];
    setEditDeck({ ...deck, slides: sl });
    setEditingSlide(sl.length ? 0 : null);
    setSlidesToDelete([]);
    setSub('editor');
  }

  async function saveDeck() {
    setSaving(true);
    try {
      let deckId = editDeck.id;

      if (String(deckId).startsWith('new-')) {
        const { data: newDeck, error: deckErr } = await supabase
          .from('decks').insert({ coach_id: user.id, title: editDeck.title }).select().single();
        if (deckErr) throw new Error('deck insert: ' + deckErr.message);
        deckId = newDeck.id;
      } else {
        const { error: deckErr } = await supabase.from('decks').update({ title: editDeck.title }).eq('id', deckId);
        if (deckErr) throw new Error('deck update: ' + deckErr.message);
      }

      for (const slideId of slidesToDelete) {
        await supabase.from('responses').delete().eq('slide_id', slideId);
        const { error } = await supabase.from('slides').delete().eq('id', slideId);
        if (error) throw new Error('slide delete: ' + error.message);
      }
      setSlidesToDelete([]);

      for (const slide of editDeck.slides) {
        const payload = { deck_id: deckId, position: slide.position, type: slide.type, question: slide.question, options: slide.options, correct_answer: slide.correct_answer, time_limit: slide.time_limit, branch_targets: slide.branch_targets || null, image_url: slide.image_url || null, video_url: slide.video_url || null };
        if (String(slide.id).startsWith('new-')) {
          const { error } = await supabase.from('slides').insert(payload);
          if (error) throw new Error('slide insert: ' + error.message);
        } else {
          const { error } = await supabase.from('slides').update(payload).eq('id', slide.id);
          if (error) throw new Error('slide update: ' + error.message);
        }
      }

      await loadDecks();
      setSub('list');
    } catch (err) {
      console.error('[save] ERROR:', err.message);
      toast('Save error: ' + err.message);
    }
    setSaving(false);
  }

  async function deleteDeck(id) {
    const { data: slideRows } = await supabase.from('slides').select('id').eq('deck_id', id);
    const slideIds = (slideRows || []).map(s => s.id);
    if (slideIds.length > 0) {
      const { error: rErr } = await supabase.from('responses').delete().in('slide_id', slideIds);
      if (rErr) { toast('Error deleting responses: ' + rErr.message); return; }
    }
    const { error: sErr } = await supabase.from('slides').delete().eq('deck_id', id);
    if (sErr) { toast('Error deleting slides: ' + sErr.message); return; }
    const { error: seErr } = await supabase.from('sessions').delete().eq('deck_id', id);
    if (seErr) { toast('Error deleting sessions: ' + seErr.message); return; }
    const { error: dErr } = await supabase.from('decks').delete().eq('id', id);
    if (dErr) { toast('Error deleting deck: ' + dErr.message); return; }
    loadDecks();
  }

  function deleteSlide(idx) {
    const slide = editDeck.slides[idx];
    if (!String(slide.id).startsWith('new-')) {
      setSlidesToDelete(prev => [...prev, slide.id]);
    }
    const newSlides = editDeck.slides.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i }));
    setEditDeck(p => ({ ...p, slides: newSlides }));
    setEditingSlide(newSlides.length ? Math.min(idx, newSlides.length - 1) : null);
  }

  function makeSlide(type, position) {
    return {
      id: 'new-' + Date.now(), deck_id: editDeck.id, position,
      type, question: '', options: ['','','',''], correct_answer: null,
      time_limit: ['multiple_choice','story_choice'].includes(type) ? 30 : 0,
      branch_targets: type === 'story_choice' ? [null,null,null,null] : null,
      image_url: null, video_url: null,
    };
  }

  function addSlide(type) {
    const s = makeSlide(type, editDeck.slides.length);
    const newSlides = [...editDeck.slides, s];
    setEditDeck(p => ({ ...p, slides: newSlides }));
    setEditingSlide(newSlides.length - 1);
  }

  function addSlideAfter(afterIdx, type) {
    const s = makeSlide(type, afterIdx + 1);
    const before = editDeck.slides.slice(0, afterIdx + 1);
    const after  = editDeck.slides.slice(afterIdx + 1);
    const all    = [...before, s, ...after].map((sl, i) => ({ ...sl, position: i }));
    setEditDeck(p => ({ ...p, slides: all }));
    setEditingSlide(afterIdx + 1);
  }

  function updateSlide(idx, field, value) {
    setEditDeck(p => ({ ...p, slides: p.slides.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  }

  function updateOption(slideIdx, optIdx, value) {
    const opts = [...(editDeck.slides[slideIdx].options || ['','','',''])];
    opts[optIdx] = value;
    updateSlide(slideIdx, 'options', opts);
  }

  function updateBranchTarget(slideIdx, optIdx, value) {
    const targets = [...(editDeck.slides[slideIdx].branch_targets || [null,null,null,null])];
    targets[optIdx] = value === '' ? null : parseInt(value);
    updateSlide(slideIdx, 'branch_targets', targets);
  }

  function createBranches(slideIdx) {
    const slide = editDeck.slides[slideIdx];
    const validOpts = (slide.options || []).map((o, i) => ({ o, i })).filter(x => x.o.trim());
    if (validOpts.length < 2) return;
    const insertAt = slideIdx + 1;
    const newSlides = validOpts.map(({ o }, bi) => ({
      id: 'new-' + Date.now() + '-' + bi,
      deck_id: editDeck.id, position: insertAt + bi,
      type: 'story', question: '',
      options: ['','','',''], correct_answer: null, time_limit: 0, branch_targets: null,
    }));
    const branchTargets = (slide.options || []).map((o, oi) => {
      if (!o.trim()) return null;
      const bi = validOpts.findIndex(x => x.i === oi);
      return bi >= 0 ? insertAt + bi : null;
    });
    const updatedChoice = { ...slide, branch_targets: branchTargets };
    const before = editDeck.slides.slice(0, slideIdx);
    const after  = editDeck.slides.slice(slideIdx + 1).map((s, i) => ({ ...s, position: insertAt + newSlides.length + i }));
    const all = [...before, updatedChoice, ...newSlides, ...after].map((s, i) => ({ ...s, position: i }));
    setEditDeck(p => ({ ...p, slides: all }));
    setEditingSlide(insertAt);
  }

  async function startSession(deckId, title) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: sess } = await supabase.from('sessions').insert({ deck_id: deckId, coach_id: user.id, code, status: 'waiting', current_slide_index: 0 }).select().single();
    const { data: slides } = await supabase.from('slides').select('*').eq('deck_id', deckId).order('position');
    setSession({ ...sess, deck_title: title });
    setSessionSlides(slides || []);
    setParticipants([]);
    setResponses([]);
    setSub('host');
    if (chanRef.current) supabase.removeChannel(chanRef.current);
    chanRef.current = supabase.channel('session-' + sess.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sess.id}` }, p => setParticipants(prev => [...prev, p.new]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: `session_id=eq.${sess.id}` }, p => setResponses(prev => {
        const filtered = prev.filter(r => !(r.participant_id === p.new.participant_id && r.slide_id === p.new.slide_id));
        return [...filtered, p.new];
      }))
      .subscribe();
  }

  async function advanceSlide(newIdx) {
    const { data } = await supabase.from('sessions').update({ current_slide_index: newIdx, slide_started_at: new Date().toISOString() }).eq('id', session.id).select().single();
    setSession(p => ({ ...p, ...data }));
    setResponses([]);
  }

  async function setStatus(status) {
    const { data } = await supabase.from('sessions').update({ status }).eq('id', session.id).select().single();
    setSession(p => ({ ...p, ...data }));
    if (status === 'ended' && chanRef.current) supabase.removeChannel(chanRef.current);
  }

  async function advanceToWinner() {
    const slide = sessionSlides[session.current_slide_index];
    const slideResps = responses.filter(r => r.slide_id === slide?.id);
    const counts = (slide.options || []).map((_, oi) => slideResps.filter(r => r.answer === String(oi)).length);
    const maxCount = Math.max(...counts, 0);
    const winnerIdx = counts.findIndex(c => c === maxCount && maxCount > 0);
    const targets = slide.branch_targets || [];
    const targetIdx = (winnerIdx >= 0 && targets[winnerIdx] != null) ? targets[winnerIdx] : session.current_slide_index + 1;
    if (targetIdx < sessionSlides.length) await advanceSlide(targetIdx);
    else await setStatus('ended');
  }

  // ── LIST ────────────────────────────────────────────────────────
  if (sub === 'list') return (
    <div style={{ maxWidth: 760, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 15, color: C.text2 }}>Interactive presentations for your live classes.</p>
        <button onClick={createDeck} style={{ background: C.green, border: 'none', borderRadius: 50, color: '#0d0b08', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          + New
        </button>
      </div>
      {loading ? <p style={{ color: C.text2, fontSize: 13 }}>Loading...</p>
        : decks.length === 0 ? (
          <div style={{ ...CARD, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
            <Icon name="slides" size={32} color={C.text3} />
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: '1rem', marginBottom: 4 }}>No presentations yet</p>
            <p style={{ fontSize: 13, color: C.text2 }}>Create your first interactive deck.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {decks.map(d => (
              <div key={d.id} style={{ ...CARD, borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(240,236,224,0.06)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="slides" size={18} color={C.text2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                  <p style={{ fontSize: 12, color: C.text3 }}>{d.slide_count} slide{d.slide_count !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEditor(d)} style={GHOST}>Edit</button>
                  <button onClick={() => startSession(d.id, d.title)} style={BTN}>Start</button>
                  <button onClick={() => deleteDeck(d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );

  // ── EDITOR ──────────────────────────────────────────────────────
  if (sub === 'editor' && editDeck) {
    const slide = editingSlide !== null ? editDeck.slides[editingSlide] : null;
    return (
      <div style={{ maxWidth: 860, width: '100%' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <button onClick={() => { loadDecks(); setSub('list'); }} style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 50, color: C.text2, fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', lineHeight: 1 }}>‹</button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setPreviewSlide(editingSlide ?? 0); setSub('preview'); }}
                style={{ background: 'rgba(240,236,224,0.08)', border: `1px solid rgba(240,236,224,0.2)`, borderRadius: 50, color: C.text, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', letterSpacing: '0.04em' }}>
                Preview
              </button>
              <button onClick={saveDeck} disabled={saving}
                style={{ background: C.green, border: 'none', borderRadius: 50, color: '#0d0b08', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 20px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, letterSpacing: '0.04em' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {titleEditing ? (
              <input autoFocus value={editDeck.title}
                onChange={e => setEditDeck(p => ({ ...p, title: e.target.value }))}
                onBlur={() => setTitleEditing(false)}
                onKeyDown={e => e.key === 'Enter' && setTitleEditing(false)}
                style={{ flex: 1, background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{editDeck.title || 'Untitled'}</p>
                <button onClick={() => setTitleEditing(true)} title="Rename" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 14, padding: '2px 4px', lineHeight: 1 }}>✎</button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Slide list */}
          <div style={{ width: 170, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {editDeck.slides.map((s, i) => (
              <button key={s.id} onClick={() => setEditingSlide(i)}
                style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 9, border: `1px solid ${editingSlide === i ? C.border2 : C.border}`, background: editingSlide === i ? 'rgba(240,236,224,0.06)' : 'transparent', cursor: 'pointer', color: C.text, fontFamily: 'inherit' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text3, marginBottom: 2 }}>
                  {({story:'Story',story_choice:'Choice',open_question:'Open',info:'Info',multiple_choice:'Quiz'})[s.type] || s.type} · {i + 1}
                </p>
                <p style={{ fontSize: 12, color: s.question ? C.text2 : C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 148 }}>
                  {s.question ? s.question.replace(/<[^>]+>/g, '') : 'Sin texto'}
                </p>
              </button>
            ))}
            <button onClick={() => addSlide('story')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Story</button>
            <button onClick={() => addSlide('story_choice')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Choice</button>
            <button onClick={() => addSlide('open_question')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Open Q</button>
            <button onClick={() => addSlide('multiple_choice')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Quiz MC</button>
            <button onClick={() => addSlide('info')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Info</button>
          </div>

          {/* Slide editor */}
          <div style={{ flex: 1, ...CARD, borderRadius: 14, padding: '1.25rem', minHeight: 360 }}>
            {!slide ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, color: C.text3, fontSize: 13 }}>
                Select or add a slide
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Type + delete */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[{id:'story',label:'Story'},{id:'story_choice',label:'Choice'},{id:'open_question',label:'Open Q'},{id:'multiple_choice',label:'Quiz MC'},{id:'info',label:'Info'}].map(t => (
                    <button key={t.id} onClick={() => updateSlide(editingSlide, 'type', t.id)}
                      style={{ ...GHOST, fontSize: 11, padding: '4px 10px', borderColor: slide.type === t.id ? C.text3 : C.border, color: slide.type === t.id ? C.text : C.text2 }}>
                      {t.label}
                    </button>
                  ))}
                  <button onClick={() => deleteSlide(editingSlide)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 12, fontFamily: 'inherit' }}>
                    Delete slide
                  </button>
                </div>

                {/* Question / Content — rich text editor */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>
                    {slide.type === 'info' ? 'Content' : slide.type === 'story' ? 'Narration' : 'Question'}
                  </label>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: 'rgba(240,236,224,0.05)' }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 2, padding: '5px 8px', borderBottom: `1px solid ${C.border}`, background: 'rgba(240,236,224,0.03)' }}>
                      {[
                        { cmd: 'bold',          label: <b>B</b> },
                        { cmd: 'italic',        label: <i>I</i> },
                        { cmd: 'underline',     label: <u>U</u> },
                        { cmd: 'insertUnorderedList', label: '≡' },
                      ].map(({ cmd, label }) => (
                        <button key={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, null); rtfRef.current?.focus(); updateSlide(editingSlide, 'question', rtfRef.current?.innerHTML || ''); }}
                          style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 5, color: C.text2, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: '2px 8px', lineHeight: 1.4 }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Editable area */}
                    <div ref={rtfRef} contentEditable suppressContentEditableWarning
                      onInput={() => updateSlide(editingSlide, 'question', rtfRef.current?.innerHTML || '')}
                      style={{ minHeight: slide.type === 'story' ? 110 : 72, padding: '9px 12px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', lineHeight: 1.6 }}
                      data-placeholder={
                        slide.type === 'info'         ? 'Information for students...' :
                        slide.type === 'story'        ? 'Write the story narration here...' :
                        slide.type === 'story_choice' ? 'What should the protagonist do?' :
                        slide.type === 'open_question'? 'How would you feel if...?' :
                        'What is the correct form of...?'
                      }
                    />
                  </div>
                </div>

                {/* Options — MC */}
                {slide.type === 'multiple_choice' && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>
                      Options <span style={{ fontWeight: 400, fontSize: 10 }}>(tap the letter to mark correct)</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(slide.options || ['','','','']).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => updateSlide(editingSlide, 'correct_answer', slide.correct_answer === oi ? null : oi)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: slide.correct_answer === oi ? OPT_COLORS[oi] : 'rgba(240,236,224,0.1)', color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0, fontFamily: 'inherit' }}>
                            {String.fromCharCode(65 + oi)}
                          </button>
                          <input value={opt} onChange={e => updateOption(editingSlide, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            style={{ flex: 1, background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options + branch targets — story_choice */}
                {slide.type === 'story_choice' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                        Options <span style={{ fontWeight: 400 }}>— branch target per option</span>
                      </label>
                      <button onClick={() => createBranches(editingSlide)}
                        style={{ ...GHOST, fontSize: 10, padding: '3px 10px', color: C.text3 }}
                        title="Inserts one Story slide per filled option and wires up branch targets automatically">
                        ✦ Create branches
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(slide.options || ['','','','']).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ width: 28, height: 28, borderRadius: 6, background: OPT_COLORS[oi], color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <input value={opt} onChange={e => updateOption(editingSlide, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            style={{ flex: 1, background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <select value={slide.branch_targets?.[oi] ?? ''}
                            onChange={e => updateBranchTarget(editingSlide, oi, e.target.value)}
                            style={{ background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 8px', color: C.text2, fontSize: 11, fontFamily: 'inherit', outline: 'none', width: 96 }}>
                            <option value="">→ Next</option>
                            {editDeck.slides.map((_, si) => (
                              <option key={si} value={si}>→ Slide {si + 1}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timer — only for timed types */}
                {['multiple_choice','story_choice'].includes(slide.type) && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>Timer</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[0,15,30,60,90].map(t => (
                        <button key={t} onClick={() => updateSlide(editingSlide, 'time_limit', t)}
                          style={{ ...GHOST, fontSize: 11, padding: '4px 10px', borderColor: slide.time_limit === t ? C.text3 : C.border, color: slide.time_limit === t ? C.text : C.text2 }}>
                          {t === 0 ? 'No limit' : `${t}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image URL */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>Image URL <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input type="url" value={slide.image_url || ''} onChange={e => updateSlide(editingSlide, 'image_url', e.target.value || null)}
                    placeholder="https://..."
                    style={{ width: '100%', background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  {slide.image_url && (
                    <img src={slide.image_url} alt="" onError={e => e.target.style.display='none'}
                      style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />
                  )}
                </div>

                {/* YouTube URL */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>YouTube URL <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input type="url" value={slide.video_url || ''} onChange={e => updateSlide(editingSlide, 'video_url', e.target.value || null)}
                    placeholder="https://youtube.com/watch?v=..."
                    style={{ width: '100%', background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  {getYouTubeId(slide.video_url) && (
                    <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <iframe src={`https://www.youtube.com/embed/${getYouTubeId(slide.video_url)}`}
                        style={{ width: '100%', height: 160, border: 'none', display: 'block' }}
                        allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                </div>

                {/* Quick insert after this slide */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 6 }}>Insert after this slide</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[{type:'story',label:'Story ↓'},{type:'story_choice',label:'Choice ↓'},{type:'open_question',label:'Open Q ↓'},{type:'multiple_choice',label:'Quiz MC ↓'},{type:'info',label:'Info ↓'}].map(t => (
                      <button key={t.type} onClick={() => addSlideAfter(editingSlide, t.type)}
                        style={{ ...GHOST, fontSize: 11, padding: '4px 10px' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW ──────────────────────────────────────────────────────
  if (sub === 'preview' && editDeck) {
    const pvSlide = editDeck.slides[previewSlide];
    const pvTotal = editDeck.slides.length;
    const TYPE_LABELS_PV = {story:'Story',story_choice:'Choose your path',open_question:'Open question',info:'Information',multiple_choice:`Question ${previewSlide + 1} of ${pvTotal}`};

    return (
      <div style={{ maxWidth: 780, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSub('editor')} style={{ ...GHOST, flexShrink: 0 }}>← Editor</button>
          <p style={{ fontSize: 13, color: C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editDeck.title}</p>
          <button onClick={() => setPreviewSlide(p => Math.max(0, p - 1))} disabled={previewSlide === 0} style={{ ...GHOST, opacity: previewSlide === 0 ? 0.35 : 1 }}>← Prev</button>
          <span style={{ fontSize: 12, color: C.text3, minWidth: 54, textAlign: 'center' }}>{previewSlide + 1} / {pvTotal}</span>
          <button onClick={() => setPreviewSlide(p => Math.min(pvTotal - 1, p + 1))} disabled={previewSlide === pvTotal - 1} style={{ ...GHOST, opacity: previewSlide === pvTotal - 1 ? 0.35 : 1 }}>Next →</button>
        </div>

        {/* Slide pills */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: 4 }}>
          {editDeck.slides.map((s, i) => (
            <button key={s.id} onClick={() => setPreviewSlide(i)}
              style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 20, border: `1px solid ${i === previewSlide ? C.text : C.border}`, background: i === previewSlide ? 'rgba(240,236,224,0.08)' : 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: i === previewSlide ? C.text : C.text3, fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {({story:'S',story_choice:'C',open_question:'O',info:'I',multiple_choice:'Q'})[s.type] || '?'}{i + 1}
            </button>
          ))}
        </div>

        {/* Phone frame */}
        <div style={{ maxWidth: 390, margin: '0 auto', background: '#0d0b08', border: `2px solid ${C.border}`, borderRadius: 36, padding: '2rem 1.5rem 2.5rem', minHeight: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 0 6px rgba(240,236,224,0.03)' }}>
          {pvSlide ? (
            <>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 4, width: '100%', marginBottom: '1.5rem' }}>
                {editDeck.slides.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < previewSlide ? 'rgba(240,236,224,0.25)' : i === previewSlide ? '#f0ece0' : 'rgba(240,236,224,0.1)' }} />
                ))}
              </div>

              {/* Type label */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(240,236,224,0.3)', marginBottom: '1rem', textAlign: 'center' }}>
                {TYPE_LABELS_PV[pvSlide.type] || pvSlide.type}
              </p>

              {/* Media */}
              {pvSlide.image_url && (
                <img src={pvSlide.image_url} alt="" style={{ width: '100%', maxHeight: 170, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem', border: '1px solid rgba(240,236,224,0.1)' }} />
              )}
              {!pvSlide.image_url && getYouTubeId(pvSlide.video_url) && (
                <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(240,236,224,0.1)' }}>
                  <iframe src={`https://www.youtube.com/embed/${getYouTubeId(pvSlide.video_url)}`}
                    style={{ width: '100%', height: 170, border: 'none', display: 'block' }}
                    allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowFullScreen />
                </div>
              )}

              {/* Story / Info: large text */}
              {(pvSlide.type === 'story' || pvSlide.type === 'info') && (
                pvSlide.question
                  ? <div dangerouslySetInnerHTML={{ __html: pvSlide.question }} style={{ fontSize: 15, fontWeight: pvSlide.type === 'story' ? 400 : 500, color: '#f0ece0', lineHeight: 1.65, textAlign: 'center', maxWidth: 320 }} />
                  : <span style={{ color: 'rgba(240,236,224,0.2)', fontSize: 15 }}>No text yet</span>
              )}

              {/* Question-based types */}
              {['story_choice','multiple_choice','open_question'].includes(pvSlide.type) && (
                <>
                  {pvSlide.question
                    ? <div dangerouslySetInnerHTML={{ __html: pvSlide.question }} style={{ fontSize: 16, fontWeight: 700, color: '#f0ece0', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.35, maxWidth: 320 }} />
                    : <span style={{ color: 'rgba(240,236,224,0.2)', fontSize: 16, marginBottom: '1.5rem' }}>No question yet</span>
                  }

                  {/* Choice / MC buttons */}
                  {(pvSlide.type === 'story_choice' || pvSlide.type === 'multiple_choice') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', width: '100%' }}>
                      {(pvSlide.options || []).filter(o => o).map((opt, oi) => (
                        <div key={oi} style={{ background: 'transparent', border: `2px solid ${OPT_COLORS[oi % OPT_COLORS.length]}`, borderRadius: 12, padding: '0.85rem 0.7rem', fontSize: 13, fontWeight: 600, color: '#f0ece0', textAlign: 'center', lineHeight: 1.3 }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Open question box */}
                  {pvSlide.type === 'open_question' && (
                    <div style={{ width: '100%', background: 'rgba(240,236,224,0.04)', border: '1px solid rgba(240,236,224,0.1)', borderRadius: 12, padding: '0.9rem 1rem', fontSize: 14, color: 'rgba(240,236,224,0.25)', fontFamily: 'inherit', minHeight: 110, boxSizing: 'border-box' }}>
                      Write your answer...
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <p style={{ color: 'rgba(240,236,224,0.2)', fontSize: 13, margin: 'auto' }}>No slides yet</p>
          )}
        </div>
      </div>
    );
  }

  // ── SESSION HOST ─────────────────────────────────────────────────
  if (sub === 'host' && session) {
    const isWaiting = session.status === 'waiting';
    const isActive  = session.status === 'active';
    const isEnded   = session.status === 'ended';
    const idx       = session.current_slide_index;
    const total     = sessionSlides.length;
    const slide     = sessionSlides[idx];
    const slideLink = `https://dilo.club/app/session.html?code=${session.code}`;
    const slideResponses = responses.filter(r => r.slide_id === slide?.id);
    const isVoteType = ['multiple_choice','story_choice'].includes(slide?.type);
    const optCounts = isVoteType
      ? (slide.options || []).map((_, oi) => slideResponses.filter(r => r.answer === String(oi)).length)
      : [];
    const TYPE_LABELS = {story:'Story',story_choice:'Choice',open_question:'Open Question',info:'Info',multiple_choice:'Quiz MC'};

    return (
      <div style={{ maxWidth: 780, width: '100%' }}>
        {isEnded && <button onClick={() => { setSub('list'); setSession(null); loadDecks(); }} style={{ ...GHOST, marginBottom: '1rem' }}>← Back</button>}

        {/* Code banner */}
        <div style={{ ...CARD, borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Code</p>
            <p style={{ fontSize: 44, fontWeight: 900, letterSpacing: '0.18em', color: C.text, lineHeight: 1 }}>{session.code}</p>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Session link</p>
            <p style={{ fontSize: 12, color: C.text2, marginBottom: 6, wordBreak: 'break-all' }}>dilo.club/app/session.html?code={session.code}</p>
            <button onClick={() => navigator.clipboard?.writeText(slideLink)} style={{ ...GHOST, fontSize: 11, padding: '4px 12px' }}>Copy link</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Connected</p>
            <p style={{ fontSize: 40, fontWeight: 900, color: C.text, lineHeight: 1 }}>{participants.length}</p>
          </div>
        </div>

        {/* Waiting room */}
        {isWaiting && (
          <div style={{ ...CARD, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>Waiting room — {participants.length} connected</p>
              <button onClick={() => setStatus('active')} disabled={participants.length === 0} style={{ ...BTN, opacity: participants.length === 0 ? 0.4 : 1 }}>Start session</button>
            </div>
            {participants.length === 0
              ? <p style={{ fontSize: 13, color: C.text3 }}>Waiting for students to join with the link...</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {participants.map(p => <span key={p.id} style={{ background: 'rgba(240,236,224,0.07)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 13, color: C.text }}>{p.name}</span>)}
                </div>
            }
          </div>
        )}

        {/* Active slide control */}
        {isActive && slide && (
          <div style={{ ...CARD, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                Slide {idx + 1} / {total} · {TYPE_LABELS[slide.type] || slide.type}
              </p>
              {slide.type !== 'story' && slide.type !== 'info' && (
                <p style={{ fontSize: 12, color: C.text2 }}>{slideResponses.length} / {participants.length} responses</p>
              )}
            </div>

            {slide.image_url && (
              <img src={slide.image_url} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, marginBottom: '0.75rem', border: `1px solid ${C.border}` }} />
            )}
            {getYouTubeId(slide.video_url) && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: '0.5rem', border: `1px solid ${C.border}` }}>
                  <iframe src={`https://www.youtube.com/embed/${getYouTubeId(slide.video_url)}`}
                    style={{ width: '100%', height: 180, border: 'none', display: 'block' }}
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            <div dangerouslySetInnerHTML={{ __html: slide.question || '—' }} style={{ fontSize: slide.type === 'story' ? 15 : 16, fontWeight: slide.type === 'story' ? 400 : 700, color: C.text, marginBottom: '1rem', lineHeight: 1.5 }} />

            {/* Vote bars — MC and story_choice */}
            {isVoteType && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
                {(slide.options || []).filter(o => o).map((opt, oi) => {
                  const count = optCounts[oi] || 0;
                  const pct   = participants.length > 0 ? Math.round((count / participants.length) * 100) : 0;
                  const isCor = slide.type === 'multiple_choice' && slide.correct_answer === oi;
                  const branchTarget = slide.branch_targets?.[oi];
                  const voters = slideResponses
                    .filter(r => r.answer === String(oi))
                    .map(r => participants.find(p => p.id === r.participant_id)?.name || '?');
                  return (
                    <div key={oi} style={{ background: `${OPT_COLORS[oi]}18`, border: `1px solid ${isCor ? OPT_COLORS[oi] : 'transparent'}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, color: OPT_COLORS[oi], fontWeight: 700 }}>{opt}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{count}</span>
                      </div>
                      {slide.type === 'story_choice' && branchTarget != null && (
                        <p style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>→ Slide {branchTarget + 1}</p>
                      )}
                      <div style={{ height: 4, background: 'rgba(240,236,224,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: voters.length > 0 ? 6 : 0 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: OPT_COLORS[oi], borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                      {voters.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {voters.map((name, ni) => (
                            <span key={ni} style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 50, background: `${OPT_COLORS[oi]}22`, color: OPT_COLORS[oi] }}>{name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Open question feed */}
            {slide.type === 'open_question' && (
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {slideResponses.length === 0
                  ? <p style={{ fontSize: 13, color: C.text3 }}>Waiting for responses...</p>
                  : slideResponses.map(r => {
                      const pName = participants.find(p => p.id === r.participant_id)?.name;
                      return (
                        <div key={r.id} style={{ background: 'rgba(240,236,224,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
                          {pName && <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 3 }}>{pName}</p>}
                          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{r.answer}</p>
                        </div>
                      );
                    })
                }
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => advanceSlide(idx - 1)} disabled={idx === 0} style={{ ...GHOST, opacity: idx === 0 ? 0.35 : 1 }}>← Previous</button>
              {slide.type === 'story_choice'
                ? <button onClick={advanceToWinner} style={BTN}>Advance to winner →</button>
                : idx < total - 1
                  ? <button onClick={() => advanceSlide(idx + 1)} style={BTN}>Next →</button>
                  : <button onClick={() => setStatus('ended')} style={{ ...BTN, background: C.red }}>End session</button>
              }
              {slide.type === 'story_choice' && idx < total - 1 && (
                <button onClick={() => advanceSlide(idx + 1)} style={{ ...GHOST, fontSize: 12 }}>Skip →</button>
              )}
            </div>
          </div>
        )}

        {/* Participants during active session */}
        {isActive && (
          <div style={{ ...CARD, borderRadius: 12, padding: '0.9rem 1.1rem' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>Participants</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {participants.map(p => <span key={p.id} style={{ background: 'rgba(240,236,224,0.05)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: C.text2 }}>{p.name}</span>)}
            </div>
          </div>
        )}

        {/* Ended */}
        {isEnded && (
          <div style={{ ...CARD, borderRadius: 14, padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 8 }}>Session ended</p>
            <p style={{ fontSize: 14, color: C.text2 }}>{participants.length} participants · {total} slides</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

const VIEW_TITLES = {
  dashboard:          "Dashboard",
  calendario:         "Calendar",
  feedbacks:          "FeedbackHub",
  "new-class-feedback": "FeedbackHub",
  "send-feedback":    "FeedbackHub",
  "class-feedback":   "FeedbackHub",
  "student-feedback": "FeedbackHub",
  "student-surveys":  "FeedbackHub",
  tps:                "Training & Practice",
  "dilo-coach":       "Prep Class",
  "dilo-student":     "Prep Class",
  "next-classes":     "Next Classes",
  estudiantes:        "Attendance",
  coaches:            "Coaches",
  "my-hours":         "My Hours",
  students:           "Students",
  progress:           "Progress",
  metricas:           "Metrics",
  invites:            "Invitations",
  perfil:             "Profile",
  "perfil-me":        "Profile",
  "kyc-coach":        "Settings",
  settings:           "Settings",
  "class-recaps":     "Class Recaps",
  whatsapp:           "WhatsApp",
  dinamicas:          "Dynamic Class",
};

// ── STUDENTS VIEW ──────────────────────────────────────────────
// CR 2026 holidays that fall on weekdays (Mon–Fri)
const CR_HOLIDAYS = new Set([
  "2026-01-01","2026-04-02","2026-04-03","2026-05-01",
  "2026-08-31","2026-09-15","2026-12-01",
]);
const CLASS_END  = new Date(2026, 11, 18); // Dec 18, 2026 inclusive

function stuCountDays(startDate, endDate, dayNums) {
  if (!dayNums?.length) return 0;
  let n = 0;
  const cur = new Date(startDate);
  while (cur <= endDate && cur <= CLASS_END) {
    if (dayNums.includes(cur.getDay())) {
      const iso = cur.toISOString().split("T")[0];
      if (!CR_HOLIDAYS.has(iso)) n++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

function stuCalc(s, year, month, rateOverride = null) {
  const rate = rateOverride != null ? rateOverride : (parseFloat(s.price_per_hour) || 0);
  const disc = parseFloat(s.discount) || 0;
  const days = s.days ? s.days.split(",").map(Number).filter(Boolean) : [];
  const rateC = s.currency === "USD" ? rate * USD_RATE : rate;
  // Numeric groups always use flat monthly rate (no per-hour counter)
  const isNumericGroup = /^\d+$/.test(String(s.group_number || "").trim());
  if (s.billing_type === "monthly" || (isNumericGroup && s.billing_type !== "package")) {
    const net = rateC * (1 - disc / 100);
    const iva = net * IVA_RATE;
    return { hrs: null, net, iva, total: Math.round(net + iva) };
  }
  if (s.billing_type === "package") {
    return { hrs: null, net: 0, iva: 0, total: 0 };
  }
  const payDay = parseInt(s.pay_day) || 30;
  const start = new Date(year, month - 1, payDay);
  const end   = new Date(year, month, payDay - 1);
  const hrs = stuCountDays(start, end, days);
  const net = hrs * rateC * (1 - disc / 100);
  const iva = net * IVA_RATE;
  return { hrs, net, iva, total: Math.round(net + iva) };
}

const STU_BILLING_START = { year: 2026, month: 6 }; // Junio 2026 — primer mes con datos de billing
const STU_LEVELS    = ["Fn","A1","A2","B1","B2","C1","C2"];
const STU_WEEKDAYS  = [{v:1,l:"Mon"},{v:2,l:"Tue"},{v:3,l:"Wed"},{v:4,l:"Thu"},{v:5,l:"Fri"}];
const STU_SCHEDULES = ["Morning","Afternoon","Evening"];
const STU_MONTH_NAMES = MONTHS_LONG;
const STU_BLANK = {
  name:"", email:"", phone:"", group_number:"", level:"A2",
  billing_type:"weekly", days:[], schedule:"Morning", class_time:"09:00",
  company:"Dilo", package_hours:"", package_remaining:"", price_per_hour:"", currency:"CRC",
  discount:"0", pay_day:"30", comments:"",
};

function StudentsView() {
  const [students,   setStudents]   = useState(null);
  const [billing,    setBilling]    = useState({});
  const [showActive, setShowActive] = useState(true);
  const [payFilter,  setPayFilter]  = useState("all");
  const [mOffset,    setMOffset]    = useState(() => {
    const n = new Date();
    return Math.max(0, (STU_BILLING_START.year - n.getFullYear()) * 12 + (STU_BILLING_START.month - 1 - n.getMonth()));
  });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({ ...STU_BLANK, days: [] });
  const [formSaving, setFormSaving] = useState(false);
  const [delId,      setDelId]      = useState(null);
  const [collapsed,       setCollapsed]       = useState(new Set());
  const [toggling,        setToggling]        = useState({});
  const [overrideEditing, setOverrideEditing] = useState(null); // studentId being edited
  const [overrideInput,   setOverrideInput]   = useState("");
  const [overrideSaving,  setOverrideSaving]  = useState({});

  const now   = new Date();
  const base  = new Date(now.getFullYear(), now.getMonth() + mOffset, 1);
  const year  = base.getFullYear();
  const month = base.getMonth() + 1;
  const ym    = `${year}-${String(month).padStart(2,"0")}`;
  const atMin = year * 12 + month <= STU_BILLING_START.year * 12 + STU_BILLING_START.month;

  useEffect(() => { loadStudents(showActive); }, [showActive]);
  useEffect(() => { if (students) loadBilling(); }, [ym, students]);

  const loadStudents = async (activeOnly = true) => {
    setLoading(true); setError(null);
    const { data, error: e } = await supabase
      .from("students").select("*")
      .eq("active", activeOnly)
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

  const saveOverride = async (studentId, raw) => {
    const val = raw === "" ? null : parseFloat(raw);
    setOverrideSaving(p => ({ ...p, [studentId]: true }));
    setBilling(p => ({ ...p, [studentId]: { ...(p[studentId] || {}), amount_override: val } }));
    await supabase.from("student_billing").upsert(
      { student_id: studentId, year_month: ym, amount_override: val },
      { onConflict: "student_id,year_month" }
    );
    setOverrideSaving(p => ({ ...p, [studentId]: false }));
    setOverrideEditing(null);
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
    const rawGroup = form.group_number?.trim() || "";
    const payload = {
      name: form.name.trim(), email: form.email?.trim() || null, group_number: rawGroup,
      level: form.level, billing_type: form.billing_type, days,
      schedule: form.schedule, class_time: form.class_time, company: form.company,
      package_hours: form.billing_type === "package" ? (parseInt(form.package_hours) || 0) : null,
      package_remaining: form.billing_type === "package" ? (parseInt(form.package_remaining) ?? parseInt(form.package_hours) ?? null) : null,
      price_per_hour: parseFloat(form.price_per_hour) || 0,
      currency: form.currency, discount: parseFloat(form.discount) || 0,
      pay_day: parseInt(form.pay_day) || 30, comments: form.comments, phone: form.phone?.trim() || null,
      active: modal.mode === "edit" ? Boolean(form.active) : true,
    };
    let err;
    if (modal.mode === "edit") {
      ({ error: err } = await supabase.from("students").update(payload).eq("id", modal.data.id));
    } else {
      ({ error: err } = await supabase.from("students").insert(payload));
    }
    setFormSaving(false);
    if (err) { toast("Error saving student: " + err.message); return; }
    setModal(null); loadStudents();
  };

  const deleteStudent = async (id) => {
    await supabase.from("students").update({ active: false }).eq("id", id);
    setDelId(null); loadStudents(showActive);
  };

  const reactivateStudent = async (id) => {
    await supabase.from("students").update({ active: true }).eq("id", id);
    loadStudents(showActive);
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
    }).map(([g, arr]) => [g, arr.slice().sort((a,b) => a.name.localeCompare(b.name))]);
  }, [students, payFilter]);

  const summary = React.useMemo(() => {
    if (!students) return { count: 0, d15:{rev:0,col:0,pen:0}, d30:{rev:0,col:0,pen:0} };
    let d15 = { rev:0, col:0 }, d30 = { rev:0, col:0 };
    students.forEach(s => {
      const { total } = stuCalc(s, year, month, billing[s.id]?.amount_override ?? null);
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
      active: s.active !== false,
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
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor: atMin ? "default" : "pointer", lineHeight:1, flexShrink:0, opacity: atMin ? 0.25 : 1 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:C.text, flex:1, textAlign:"center" }}>
            {STU_MONTH_NAMES[month-1]} {year}
          </span>
          <button onClick={() => setMOffset(p => p+1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {[[true,"Active"],[false,"Inactive"]].map(([v,l]) => (
            <button key={l} onClick={() => setShowActive(v)}
              style={{ ...SEL(), padding:"0.4rem 0.65rem", fontSize:12,
                color: showActive===v ? C.text : C.text3,
                border: `1px solid ${showActive===v ? C.accent : C.border}`,
                fontWeight: showActive===v ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        <div style={{ width:1, height:20, background:C.border, flexShrink:0 }} />
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {[["all","All"],["15","Day 15"],["30","Day 30"]].map(([v,l]) => (
            <button key={v} onClick={() => setPayFilter(v)}
              style={{ ...SEL(), padding:"0.4rem 0.65rem", fontSize:12,
                color: payFilter===v ? C.text : C.text3,
                border: `1px solid ${payFilter===v ? C.accent : C.border}`,
                fontWeight: payFilter===v ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        {showActive && (
          <button onClick={openAdd} style={{ ...SEL(), padding:"0.4rem 1rem", color:C.text,
            border:`1px solid ${C.border2}`, flexShrink:0 }}>
            + Add student
          </button>
        )}
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
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"3rem 0", gap:6, width:"100%" }}>
          {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      )}

      {/* Groups */}
      {groups.map(([groupNum, gStudents]) => {
        const isCol = collapsed.has(groupNum);
        const effTotal = st => stuCalc(st, year, month, billing[st.id]?.amount_override ?? null).total;
        const gTotal = gStudents.reduce((s, st) => s + effTotal(st), 0);
        const gPaid  = gStudents.reduce((s, st) => s + (billing[st.id]?.paid ? effTotal(st) : 0), 0);
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
                      const rateOv = billing[s.id]?.amount_override ?? null;
                      const { hrs, total } = stuCalc(s, year, month, rateOv);
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
                          <td style={{ padding:"0.7rem 1rem", whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? (
                              <span style={{ fontSize:12, fontWeight:600, color:C.text2 }}>{rateLabel}</span>
                            ) : overrideEditing === s.id ? (
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <input autoFocus type="number" min="0" value={overrideInput}
                                  onChange={e => setOverrideInput(e.target.value)}
                                  onKeyDown={e => { if (e.key==="Enter") saveOverride(s.id, overrideInput); if (e.key==="Escape") setOverrideEditing(null); }}
                                  style={{ width:76, background:C.surface2, border:`1px solid ${C.amber}`, borderRadius:6,
                                    padding:"0.2rem 0.4rem", color:C.text, fontSize:12, fontFamily:"inherit", outline:"none" }} />
                                <button onClick={() => saveOverride(s.id, overrideInput)}
                                  style={{ background:"none", border:`1px solid ${C.green}55`, borderRadius:6,
                                    padding:"0.15rem 0.4rem", color:C.green, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                                  {overrideSaving[s.id] ? "…" : "OK"}
                                </button>
                                <button onClick={() => setOverrideEditing(null)}
                                  style={{ background:"none", border:"none", color:C.text3, fontSize:13, cursor:"pointer", padding:"0 2px" }}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <span style={{ fontSize:12, fontWeight:600, color: rateOv != null ? C.amber : C.text2 }}>
                                  {rateOv != null ? fmtC(rateOv) : rateLabel}
                                </span>
                                <button onClick={() => { setOverrideEditing(s.id); setOverrideInput(rateOv != null ? String(rateOv) : String(parseFloat(s.price_per_hour||0))); }}
                                  style={{ background:"none", border:`1px solid ${C.amber}66`, borderRadius:4,
                                    color:C.amber, fontSize:10, cursor:"pointer", padding:"1px 4px", lineHeight:1.4 }}>✏</button>
                                {rateOv != null && (
                                  <button onClick={() => saveOverride(s.id, "")}
                                    style={{ background:"none", border:"none", color:"#d95f5f", fontSize:11, cursor:"pointer", padding:"0 2px" }}>↺</button>
                                )}
                              </div>
                            )}
                          </td>
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
                            {showActive ? (
                              <div style={{ display:"flex", gap:4 }}>
                                <button onClick={() => openEdit(s)}
                                  style={{ ...SEL(), padding:"0.2rem 0.45rem", fontSize:11,
                                    color:C.amber, border:`1px solid ${C.amber}44` }}>✏</button>
                                <button onClick={() => setDelId(s.id)}
                                  style={{ ...SEL(), padding:"0.2rem 0.45rem", fontSize:11,
                                    color:"#d95f5f", border:`1px solid #d95f5f44` }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => reactivateStudent(s.id)}
                                style={{ ...SEL(), padding:"0.2rem 0.55rem", fontSize:10,
                                  color:C.green, border:`1px solid ${C.green}44`, whiteSpace:"nowrap" }}>↩ Reactivar</button>
                            )}
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

            {/* WhatsApp */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={labelSty}>WhatsApp</label>
              <input value={form.phone || ""} placeholder="+50688887777"
                onChange={e => setF("phone", e.target.value)}
                style={inputSty} />
            </div>

            {/* Comments */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={labelSty}>Comments</label>
              <textarea value={form.comments} rows={2} placeholder="Notes…"
                onChange={e => setF("comments",e.target.value)}
                style={{ ...inputSty, resize:"vertical", lineHeight:1.5 }} />
            </div>

            {/* Active status — edit only */}
            {modal.mode === "edit" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"0.7rem 0.9rem", borderRadius:10, background:C.surface2,
                border:`1px solid ${C.border}`, marginBottom:"1.25rem" }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.2 }}>Estado del estudiante</p>
                  <p style={{ fontSize:11, color:C.text3, marginTop:2 }}>{form.active ? "Activo" : "Inactivo"}</p>
                </div>
                <div onClick={() => setF("active", !form.active)}
                  style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
                  <div style={{ width:40, height:22, borderRadius:11,
                    background: form.active ? C.green : C.surface2,
                    border:`1px solid ${form.active ? C.green : C.border2}`,
                    position:"relative", transition:"background 0.18s" }}>
                    <div style={{ position:"absolute", top:3,
                      left: form.active ? 19 : 3, width:14, height:14,
                      borderRadius:"50%", transition:"left 0.18s",
                      background: form.active ? "#fff" : C.text3 }} />
                  </div>
                </div>
              </div>
            )}

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
  const [liveRate,    setLiveRate]    = useState(null);
  const [liveIva,     setLiveIva]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    supabase.from("profiles").select("nombre").eq("id", user?.id).single()
      .then(({ data }) => { if (data?.nombre) setCoachName(data.nombre.split(" ")[0]); });
  }, [user?.id]);

  useEffect(() => {
    if (!coachName) return;
    supabase.from("coach_rates").select("rate, iva").eq("coach_name", coachName).single()
      .then(({ data }) => {
        if (data?.rate != null) setLiveRate(parseFloat(data.rate));
        if (data?.iva != null)  setLiveIva(data.iva);
      });
  }, [coachName]);

  const getMonthBounds = (off) => {
    const n = new Date();
    const d = new Date(n.getFullYear(), n.getMonth() + off, 1);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59),
             year: d.getFullYear(), month: d.getMonth() };
  };
  const { start, end, year, month } = getMonthBounds(monthOffset);
  const MO_NAMES = MONTHS_LONG;

  useEffect(() => {
    if (!coachName) return;
    setLoading(true); setError(null); setEvents(null);
    fetch(EDGE_URL, {
      method:"POST",
      headers:{ Authorization:"Bearer "+ANON_KEY, apikey:ANON_KEY, "Content-Type":"application/json" },
      body: JSON.stringify({ source:"teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() })
    }).then(r=>r.json()).then(d => {
      if (!Array.isArray(d)) throw new Error();
      setEvents(d.map(ev=>({ ...ev, date: toCRDate(ev.start) }))
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

  const rateInCRC = liveRate;
  const hasIva    = liveIva ?? true;
  const calc = (n) => {
    if (!rateInCRC) return { net:0, iva:0, total:0 };
    const net = n * rateInCRC, iva = hasIva ? net*IVA_RATE : 0;
    return { net, iva, total: net+iva };
  };
  const fmtC = n => `₡${Math.round(n).toLocaleString("es-CR")}`;
  const fmtWk = (mon,sat) => {
    const mo = MONTHS_SHORT;
    return mon.getMonth()===sat.getMonth()
      ? `${mon.getDate()}–${sat.getDate()} ${mo[mon.getMonth()]}`
      : `${mon.getDate()} ${mo[mon.getMonth()]}–${sat.getDate()} ${mo[sat.getMonth()]}`;
  };

  const totalClasses = weeks.reduce((s,w)=>s+w.count, 0);
  const { net:tNet, iva:tIva, total:tTotal } = calc(totalClasses);

  // Quincenas: pagos son quincenales — Q1 = día 1–15, Q2 = 16–fin de mes
  const q1Count = (events || []).filter(ev => ev.date.getDate() <= 15).length;
  const q2Count = (events || []).length - q1Count;
  const q1Total = calc(q1Count).total;
  const q2Total = calc(q2Count).total;
  const lastDay = new Date(year, month + 1, 0).getDate();
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
        <button onClick={()=>setMonthOffset(p=>p-1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
        <span style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:C.text }}>
          {MO_NAMES[month]} {year}
        </span>
        <button onClick={()=>setMonthOffset(p=>p+1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
      </div>

      {loading && (
        <div style={{ maxWidth:600, display:"flex", justifyContent:"center", padding:"3rem 0", gap:8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.text3,
              animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      )}
      {error && <p style={{ color:"#d95f5f", fontSize:13, marginBottom:"1rem" }}>{error}</p>}

      {/* Desglose quincenal — pagos son quincenales */}
      {!loading && events && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"0.75rem", marginBottom:"1rem", maxWidth:600 }}>
          {[
            { label:`${MONTHS_SHORT[month]} 1–15`,  sub:"First payment",  count:q1Count, amount:q1Total },
            { label:`${MONTHS_SHORT[month]} 16–${lastDay}`, sub:"Second payment", count:q2Count, amount:q2Total },
            { label:"Month total", sub:`${MO_NAMES[month]} ${year}`, count:totalClasses, amount:tTotal, accent:true },
          ].map((c,i) => (
            <div key={i} style={{ ...CARD, borderRadius:14, padding:"1rem 1.1rem",
              border: c.accent ? "1px solid rgba(37,211,102,0.3)" : undefined }}>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:6 }}>{c.label}</p>
              <p style={{ fontSize:"clamp(1.1rem,4vw,1.4rem)", fontWeight:900, letterSpacing:"-0.02em", color: c.accent ? C.green : C.text, lineHeight:1.1 }}>{fmtC(c.amount)}</p>
              <p style={{ fontSize:11, color:C.text3, marginTop:4 }}>{c.count} hr{c.count!==1?"s":""}{c.sub ? ` · ${c.sub}` : ""}</p>
            </div>
          ))}
        </div>
      )}

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
// ── STUDENT PROGRESS VIEW ──────────────────────────────────────
// Syllabus v6.0 — capítulos por nivel (número + título corto)
const SYLLABUS = {
  Fn: { label: "Foundation", chapters: [
    [0,"Survival Kit"],[1,"TO BE — Present"],[2,"TO BE — Past"],[3,"TO BE — Future"],
    [4,"There Is/Are + Articles"],[5,"There Was/Were"],[6,"There Will Be"],
    [7,"Present Continuous"],[8,"Integration — SVO Storyteller"]] },
  A1: { label: "A1", chapters: [
    [1,"Present Simple"],[2,"Simple vs Continuous"],[3,"Likes & Frequency"],
    [4,"Family, Descriptions & do/make"],[5,"Places, Directions & Imperatives"],
    [6,"Plans, Abilities & Requests"],[7,"Integration + Small Talk Ritual"]] },
  A2: { label: "A2", chapters: [
    [1,"Past Simple"],[2,"Past Continuous"],[3,"Used To"],[4,"All Future Forms"],
    [5,"Object Pronouns & Suggestions"],[6,"Modals + Tag Questions"],[7,"Comparisons"],
    [8,"Sequencing & Reflexives"],[9,"Compound Pronouns"],[10,"Duration & -ed/-ing"]] },
  B1: { label: "B1", chapters: [
    [1,"Present Perfect"],[2,"Perfect vs Past"],[3,"Present Perfect Continuous"],
    [4,"Past Perfect"],[5,"Future Perfect & Continuous"],[6,"First Conditional"],
    [7,"Second Conditional"],[8,"Passive Voice"],[9,"Reported Speech"],
    [10,"Gerunds & Infinitives"],[11,"Integration + Pro Update"]] },
  B2: { label: "B2", chapters: [
    [1,"Third Conditional"],[2,"Mixed Conditionals"],[3,"Passive & Causative"],
    [4,"Relative Clauses"],[5,"Inversion & Emphasis"],[6,"Discourse & Hedging"],
    [7,"Ellipsis & Substitution"],[8,"Participle Clauses"],[9,"Modals of Deduction"],
    [10,"Wish & Regret"],[11,"Integration + Pro Meeting"]] },
  C1: { label: "C1", chapters: [
    [1,"Idioms in the Wild"],[2,"Advanced Phrasal Verbs"],[3,"Register Shifts"],
    [4,"Humor, Sarcasm & Irony"],[5,"Storytelling Techniques"],[6,"Negotiation & Persuasion"],
    [7,"Emotional Intelligence"],[8,"Critical Thinking"],[9,"Cultural References"],
    [10,"Integration — Networking Event"]] },
  C2: { label: "C2", chapters: [
    [1,"Nuanced Communication"],[2,"Persuasive Language"],[3,"Sophisticated Vocabulary"],
    [4,"Complex Argumentation"],[5,"Metaphorical Language"],[6,"Academic Discourse"],
    [7,"Executive Communication"],[8,"Literary & Rhetorical Devices"],
    [9,"Cross-Cultural Competence"],[10,"Mastery — Executive Gauntlet"]] },
};

// Chapter content (extracted from syllabi v6.0)
const CHAPTER_INFO = {
  // ── FOUNDATION ──
  "Fn-0": { canDo:"Run my whole class in English — asking for repetition, meaning, spelling, and examples — without switching to Spanish.", grammar:"None. Fixed chunks used as whole blocks (students don't analyze the grammar inside them yet).", traps:"'What means X?' → What does X mean? · 'Repeat me' → Can you repeat that?", chunks:"Sorry, can you repeat that? · What does __ mean? · How do you say __? · How do you spell that? · Can you give me an example? · Let me think... · I'm not sure, but... · I didn't catch that.", pv:"sit down · stand up · come in · hold on · hang on", pron:"'Can you' → /kənjə/ · rising intonation on yes/no · first schwa /ə/", technique:"Repair Ladder: didn't hear→repeat · didn't understand→what does X mean · stuck→let me think · missing word→how do you say", exitTask:"Breakdown Drill (3 min): coach engineers 5 consecutive breakdowns; student must survive them all in English." },
  "Fn-1": { canDo:"Introduce myself (name, nationality, profession, current state) using contractions and sustain a 2-min exchange.", grammar:"S + TO BE + O. Default contractions: I'm, You're, He's, She's, It's, We're, They're. Connector 'and'.", traps:"'I have 30 years' → I'm 30 · 'Is hot today' → It's hot · 'I have hunger' → I'm hungry · ser/estar → only one 'be'", chunks:"Nice to meet you! · How's it going? · Pretty good, thanks. And you? · Not bad! · What about you? · What do you do? · Take care! · Long time no see!", pv:"come from · sit down/stand up · calm down · cheer up · wake up", pron:"/iː/ vs /ɪ/ (he's/his, eat/it, leave/live) · contractions as single syllables", technique:"Repair + Minimal Responses (uh-huh, OK, really?, wow, I see)", exitTask:"Two-Minute Meet & Greet: coworker roleplay with contractions + ≥2 questions + minimal responses." },
  "Fn-2": { canDo:"Contrast how I was before with how I am now (was/were + but) in 5+ connected sentences.", grammar:"was/were, wasn't/weren't. Connector 'but'. Markers: last, ago, yesterday, last week/month.", traps:"'I was 5 persons' → There were 5 people · 'When I was child' → When I was a child · 'I had 10 years' → I was 10", chunks:"Back then... · At the time... · To be honest, I was... · I wasn't really... · You know what I mean? · That was a while ago.", pv:"grow up · move out · move in · get back · look back", pron:"weak /wəz/ /wɚ/ · anti-epenthesis on 'wasn't'", technique:"Repair + Time-buying (Let me think / How do you say)", exitTask:"Then vs Now (2 min): 5+ was...but...am contrasts with correct was/were." },
  "Fn-3": { canDo:"State a future plan or state justified with because, connecting all 3 timelines about myself.", grammar:"will be / won't be. Connector 'because'. Contractions: I'll, you'll, she'll, won't.", traps:"'I will to be' → I will be · 'won't' /woʊnt/ ≠ 'want' /wɑːnt/", chunks:"I'll probably... · Hopefully... · Fingers crossed! · We'll see. · I can't wait! · It depends. · Sounds good!", pv:"look forward to · show up · come over · drop by · hang out", pron:"will-contractions /əl/ /l/ · won't vs want minimal pair", technique:"Repair + first AAA preview (answer, add, ask back)", exitTask:"Three Timelines (2 min): one topic across past→present→future with but and because." },
  "Fn-4": { canDo:"Give a live tour of my home or office with there is/are + quantifiers + correct articles.", grammar:"There + is/are. some (aff) → any (neg/Q). Articles: a/an, the, Ø. Connector 'so'.", traps:"'Have many people' → There are many people · 'The life is hard' → Life is hard · 'informations/advices/furnitures' → uncountables, no plural", chunks:"There's not much... · There's plenty of... · A couple of... · None at all. · Kind of messy. · It's pretty small. · Take a look.", pv:"look around · pick up · put away · clean up · throw out", pron:"'There is' → /ðeərɪz/, 'There are' → /ðeərɑːr/ · th /ð/", technique:"Repair + Minimal Responses while listening to the partner", exitTask:"Home Tour (2-3 min): 3 rooms with quantifiers + articles + ≥1 'there isn't any'." },
  "Fn-5": { canDo:"Describe how my neighborhood or hometown has changed (there was... but now there is...) for 2 min.", grammar:"there was/were + present contrast with 'but'.", traps:"'Had a park before' → There was a park · 'In that time' → At that time / Back then", chunks:"Back in the day... · It used to be... · Things have changed. · Not anymore. · I remember when...", pv:"tear down · build up · turn into · do up · spring up", pron:"'There was' /ðeərwəz/ · contrast intonation", technique:"Storytelling preview: sequence two states in time", exitTask:"My City Then & Now (2 min): 4+ change statements pairing past/present." },
  "Fn-6": { canDo:"Describe an upcoming event, predicting what there will and won't be.", grammar:"there will be / there won't be.", traps:"'Will have a party' → There will be a party · 'It will to have' → There will be", chunks:"It's gonna be great. · Save the date. · Count me in! · I'll be there. · Who's coming? · Bring whatever.", pv:"set up · call off · put on · turn out · kick off", pron:"'There will' → /ðeərəl/", technique:"AAA in event-planning: answer + add detail + ask about logistics", exitTask:"Event Pitch (2 min): real upcoming event with will/won't be + quantities + ≥1 prediction with because." },
  "Fn-7": { canDo:"Narrate in real time what I and the people around me are doing right now, on camera, unprepared.", grammar:"am/is/are + verb-ing. Connectors because/so. Markers: now, right now, at the moment.", traps:"'I reading' (drop aux) → I'm reading · 'I am agree' → I agree (state verbs) · 'What you are doing?' → What are you doing?", chunks:"Right now I'm... · Hang on, I'm just... · I'm in the middle of... · What are you up to? · Nothing much. · Just chilling.", pv:"work on · deal with · get ready · warm up · wind down", pron:"-ing /ɪŋ/ (not /in/) · no 'e-' before s- (studying, not 'estudying')", technique:"Repair + live narration with coach backchannel", exitTask:"Live Cam (2 min): narrate own surroundings + guess what others are doing; auxiliary never dropped." },
  "Fn-8": { canDo:"Tell a 4-min co-created story mixing identity, places, and actions across past/present/future without mental translation.", grammar:"REVIEW: TO BE (3 tenses) + THERE BE (3 tenses) + Present Continuous + connectors + articles + dummy subjects.", traps:"Cumulative: subject never dropped · tener-family killed · haber→there be · Ø-article · question inversion · no 'e-' epenthesis", chunks:"So anyway... · Long story short... · The thing is... · And that's when... · To be honest... · Anyway...", pv:"review of all 35 Foundation PVs in story context", pron:"storytelling rhythm · consolidate /iː/-/ɪ/ and schwa", technique:"Full Repair toolkit + Minimal Responses + AAA — all live", exitTask:"Co-Created Story (4 min): coach plants character + place; student crosses 3 timelines, ≥3 natural repairs, no translation pauses." },
  // ── A1 ──
  "A1-1": { canDo:"Describe my full daily routine and interview a partner about theirs using do/does with correct 3rd-person -s.", grammar:"Base verb (+s/es 3rd person); do/does for neg&Q. Irregulars: have→has, go→goes, do→does. Markers: every day, on weekdays, at night.", traps:"'She work' → She works · 'I no like' → I don't like · 'Do you can?' → one auxiliary · 'every days' → every day", chunks:"I usually... · First thing in the morning... · On a typical day... · It depends on the day. · I'm not a morning person. · More or less.", pv:"get up · wake up · go out · come back · stay in", pron:"3rd-person -s: works /s/, plays /z/, watches /ɪz/ · 'does' weak /dəz/", technique:"Answer-Add-Ask (AAA) — every answer = 3 parts", exitTask:"Routine Interview (3 min): student interviews coach and vice versa; correct -s, do/does, AAA ≥3×." },
  "A1-2": { canDo:"Explain what I normally do vs what I'm doing differently right now or this week.", grammar:"simple (always/usually/often) vs continuous (now/today/this week). State verbs → simple.", traps:"'I am working since 2020' → I have worked · 'Always I do' → I always do · 'I'm wanting/knowing' → want/know are state verbs", chunks:"Normally, but today... · For a change... · These days... · Just for now. · As a rule... · Bear with me.", pv:"work out · hang out · chill out · calm down · focus on", pron:"contrast stress 'I WORK' vs 'I'm WORKing' · frequency adverbs unstressed", technique:"AAA + Wh-chains — turn partner's answer into 2 follow-up questions", exitTask:"Exception to the Rule (2 min): normal habit + today's exception with correct tense choice." },
  "A1-3": { canDo:"Discuss my hobbies + their frequency and recommend an activity based on someone's preferences.", grammar:"like/love/hate + gerund. Frequency (once/twice a week). 'How often...?'", traps:"'I like read' → I like reading · 'I like very much pizza' → I really like pizza · 'me likes' → I like", chunks:"I'm really into... · I'm not a fan of... · It's not my thing. · I could go for... · Count me in. · I'll pass.", pv:"get into · take up · give up · cut down on · get bored of", pron:"like /laɪk/ + gerund linking · b vs v (very ≠ berry)", technique:"AAA + recommending", exitTask:"Hobby Match (3 min): discover coach's tastes + recommend with reason; like+gerund + ≥1 How often." },
  "A1-4": { canDo:"Describe 3 family members (appearance + personality) and explain who I take after.", grammar:"possessives (my/your/his/her/our/their); Saxon genitive (John's car); adjective order. NEW: do vs make.", traps:"'The car of my brother' → my brother's car · 'his/her' confusion · 'make a question' → ask a question · 'make homework' → do homework", chunks:"He takes after... · She's the spitting image of... · We get along great. · We're really close. · They mean the world to me.", pv:"take after · grow up · look after · bring up · settle down", pron:"possessive 's: /ɪz/ /z/ /s/ · th /θ/ in brother/mother/father", technique:"AAA + vivid descriptive detail per person", exitTask:"Family Portrait (3 min): 3 relatives + who you take after + ≥1 do/make collocation." },
  "A1-5": { canDo:"Describe my neighborhood and give working directions someone can actually follow.", grammar:"there is/are review; prepositions of place; relative pronouns (who/which/that). NEW: Imperatives (Turn left, Don't forget).", traps:"'In front of' ≠ 'across from' · overusing 'that' with people → who · 'You turn left' (not command) → Turn left", chunks:"It's right around the corner. · You can't miss it. · It's within walking distance. · Head straight for... · Hang a left. · Just past the bank.", pv:"turn left/right · go straight · head for · look for · find out", pron:"'next to' → /nekstə/ · anti-epenthesis on street/straight", technique:"Clarity check + Repair — summarize-to-confirm preview", exitTask:"Give Me Directions (2-3 min): direct coach from A to B; correct imperatives, listener reaches destination." },
  "A1-6": { canDo:"Talk about abilities, plans, and desires + make polite requests in a service roleplay.", grammar:"catenatives (want/need/hope/plan + to); can (ability/permission); would like; purpose (for + noun / to + verb).", traps:"'I can to swim' → I can swim · 'I want a coffee' → I'd like a coffee · 'for improve' → to improve", chunks:"Could I get...? · Do you mind if...? · Would it be possible to...? · I was wondering if... · No rush. · That works for me.", pv:"aim for · hope for · long for · push for · set out to", pron:"'want to' → /wɑnə/, 'going to' → /ɡʌnə/ · modal weak forms", technique:"Politeness register + AAA — first register-shift (casual vs polite)", exitTask:"Service Roleplay (3 min): ≥3 polite requests + purpose with to+verb; no 'can to'." },
  "A1-7": { canDo:"Sustain a spontaneous 3-min catch-up conversation using AAA at least 3 times.", grammar:"REVIEW: present simple/continuous, contrast, possessives, catenatives, modals, relatives, imperatives. NEW: Small Talk ritual (weather/weekend/work/plans — first 90 sec).", traps:"Cumulative: 3rd-person -s · do/does · adverb placement · can to · me likes · Saxon genitive", chunks:"How was your weekend? · Anything exciting? · How's work? · Crazy weather, huh? · Same old, same old. · Can't complain. · We should catch up soon.", pv:"catch up · fill in · bring up · point out · sum up", pron:"natural rhythm · 'um/uh' (not 'este/o sea') · consolidate -s and th", technique:"Full AAA + Small Talk Ritual — open every class with 90-sec small talk", exitTask:"The Catch-Up (3 min): unscripted small talk → topic → soft close; AAA ≥3×, no Spanish fillers." },
  // ── A2 ──
  "A2-1": { canDo:"Narrate a complete past experience (trip, anecdote) with accurate -ed and answer Wh- follow-ups.", grammar:"regular (+ed) & irregulars; did for neg/Q (base verb after did). Markers: yesterday, last week, ago.", traps:"'I didn't went' → didn't go · 'Yesterday I have eaten' → Yesterday I ate", chunks:"Back in the day · Once upon a time · That takes me back · I'll never forget · Long story short · I remember it like yesterday.", pv:"look back · think back · go back · date back · bring back", pron:"-ed: worked /t/, played /d/, wanted /ɪd/ · irregular vowel shifts (go/went)", technique:"Hook + Buying-Time Fillers (well.../let me see...)", exitTask:"Travel Story (3 min): real trip + 3 Wh- follow-ups; correct -ed, hook used." },
  "A2-2": { canDo:"Tell a dramatic story combining background + interruption with H-C-E-P structure.", grammar:"was/were + -ing; when + past simple (interruption); while + past continuous (background).", traps:"'I was read' → I was reading · 'When I was arriving' → When I arrived", chunks:"Out of the blue · All of a sudden · Before I knew it · In the blink of an eye · That's when it happened. · You should've seen my face.", pv:"break out · cut in · pop in · show up · turn up", pron:"was/were weak forms · suspense intonation (slow background, punch the interruption)", technique:"Full H-C-E-P: Hook → Context (past cont) → Events (past simple) → Punchline", exitTask:"The Day Everything Went Wrong (3 min): dramatic story with all 4 H-C-E-P parts." },
  "A2-3": { canDo:"Compare who I used to be vs who I am now in a 3-min 'then vs now' monologue.", grammar:"used to + base; didn't use to; anymore/any longer/no longer.", traps:"'I used to playing' → used to + base · 'I don't play no more' → not anymore", chunks:"I've turned over a new leaf · Those days are behind me · I'm not that person anymore · It's a thing of the past · Old habits die hard.", pv:"grow out of · get over · move on from · kick the habit · fall back into", pron:"'used to' → /ˈjuːstə/", technique:"Then/Now monologue + Backchanneling (Really? Wow, big change)", exitTask:"Then vs Now (3 min): how you've changed; correct used to + ≥1 anymore." },
  "A2-4": { canDo:"Discuss plans (going to), spontaneous decisions (will), and fixed arrangements (present cont) in one planning conversation.", grammar:"going to (intentions); will (predictions/spontaneous/promises); present continuous (fixed arrangements).", traps:"'I will visit' (planned) → I'm going to visit · 'Tomorrow I work' → I'm working tomorrow", chunks:"I'm playing it by ear · The future looks bright · One step at a time · Time will tell · Fingers crossed.", pv:"plan ahead · look forward to · count on · set up · call off", pron:"'going to' → /ɡʌnə/ — train the EAR first", technique:"H-C-E-P for future ('how I imagine it'll go') + AAA", exitTask:"Weekend Plan (3 min): plan a weekend using all 3 future forms + ≥1 spontaneous will." },
  "A2-5": { canDo:"Propose, accept, and reject plans in a group decision, explaining purpose.", grammar:"object pronouns (me/you/him/her/it/us/them); let's / let's not; purpose (for + noun / to + verb).", traps:"'I saw she' → I saw her · 'For to improve' → to improve · 'Let's to go' → Let's go", chunks:"Let's call it a day · Let's get the ball rolling · Let's play it safe · Let's sleep on it · I'm in. · Works for me.", pv:"count on · depend on · rely on · fall back on · turn to", pron:"object pronoun weak forms · 'let's' + verb linking", technique:"Group decision-making + diplomatic preview (propose, agree, gently reject)", exitTask:"Plan a Group Outing (3 min): propose/accept/reject + purpose with to+verb." },
  "A2-6": { canDo:"Give advice, express obligation, and agree/disagree naturally in a problem-solving chat.", grammar:"can/could/should/must/have to/may/might; agreement (also/too/as well/so do I); NEW: Tag questions (right?, isn't it?, don't you?).", traps:"'I must to go' → I must go · 'I am agree' → I agree · 'no?' universal → match auxiliary (isn't it?)", chunks:"I couldn't agree more · That makes two of us · Tell me about it · You can say that again · I see your point · Easier said than done.", pv:"go along with · side with · stick to · back down · stand firm", pron:"modal weak forms · tag intonation (real Q ↗, rhetorical ↘)", technique:"Agree/Disagree politely + tag questions to invite agreement", exitTask:"Give Me Advice (3 min): give advice + ≥2 tag questions + agree/disagree." },
  "A2-7": { canDo:"Compare two options (jobs, cities, products) and argue which is better and best.", grammar:"comparative (-er/more); superlative (-est/most); as...as; indirect object position (give her a gift / give a gift to her).", traps:"'more better' → better · 'more big' → bigger · 'Explain me' → Explain it to me · 'as tall than' → as tall as", chunks:"Comparing apples and oranges · Night and day · A far cry from... · It doesn't hold a candle to... · Hands down the best · No contest.", pv:"measure up · stack up · live up to · fall short · come close", pron:"comparative -er /ər/ · final clusters: 'asked' /æskt/, 'months' /mʌnθs/", technique:"Justified comparison (opinion + reason) — opinion-expression preview", exitTask:"This or That (3 min): compare 2 options + pick best with reasons; no 'more better', correct explain it to me." },
  "A2-8": { canDo:"Tell a personal story in clear sequence using reflexive pronouns naturally.", grammar:"sequence (first/then/after that/finally); reflexives (myself...); each other; by myself.", traps:"'I cut me' → I cut myself · 'We love us' → We love each other · 'by my own' → by myself", chunks:"I couldn't help myself · I caught myself... · I had to pull myself together · Make yourself at home · Help yourself · Suit yourself.", pv:"help yourself · behave yourself · enjoy yourself · watch yourself · pull yourself together", pron:"reflexive stress (-SELF) · sequence-connector intonation", technique:"H-C-E-P + sequencing for clarity + backchanneling", exitTask:"A Story About Me (3 min): sequenced personal story + ≥2 reflexives." },
  "A2-9": { canDo:"Describe and guess people, places, and objects using compound pronouns in a 20-questions game.", grammar:"somebody/someone/something/somewhere (+ else); every-/no-/any-; none of; each of.", traps:"'I didn't see nobody' → I didn't see anybody · 'Somebody have called' → has called · 'something more' → something else", chunks:"Something's fishy · Nothing to write home about · It's nothing special · Anything but... · No big deal · Nothing ventured, nothing gained.", pv:"sort out · figure out · work out · rule out · leave out", pron:"compound-pronoun stress · 'else' linking", technique:"Guessing game = question sprint (question formation under pressure)", exitTask:"20 Questions (3 min): guess coach's mystery person/object via yes/no; correct compound pronouns." },
  "A2-10": { canDo:"Explain how long my routines/projects take and describe experiences with correct -ed/-ing adjectives.", grammar:"it takes + time + to + verb; -ed adjectives (feelings: bored, excited) vs -ing (qualities: boring, exciting).", traps:"'I'm boring' → I'm bored · 'The class takes me' → It takes me · 'I'm exciting' → I'm excited", chunks:"Time flies · Time is money · Better late than never · In the nick of time · Good things take time · Rome wasn't built in a day.", pv:"drag on · speed up · slow down · hurry up · take up", pron:"'it takes' linking · -ed vs -ing adjective stress", technique:"Pro Track checkpoint: describe past project and future one with full A2 toolkit", exitTask:"My Project (Pro Track, 3-4 min): describe real past project + future one with durations and feelings." },
  // ── B1 ──
  "B1-1": { canDo:"Interview someone about life experiences (Have you ever...?) and dig into details by switching to past simple.", grammar:"have/has + past participle; ever/never; yet/already/just; been vs gone.", traps:"'I've been to Paris last year' → I went to Paris · 'He has gone to the store' (and back) → He's been · 'I have 3 years living here' → I've lived here for 3 years", chunks:"Been there, done that · I've been around · I've had my fair share · I've been in your shoes · Have you ever...? · You name it.", pv:"been through · come across · take up · get into · settle down", pron:"have/has contractions /əv/ /əz/ · 'I've been' → /aɪvbɪn/", technique:"Summarize-then-Respond intro", exitTask:"Experience Interview (3-4 min): Have you ever...? + 3 detail follow-ups in past simple." },
  "B1-2": { canDo:"Accurately choose between 'I've done' and 'I did' depending on whether time is finished — the #1 tense decision for Latin speakers.", grammar:"finished time (yesterday, last week, in 2020) → past simple; unfinished/unspecified (ever, this week, recently) → present perfect; for/since.", traps:"Pretérito overuse: 'Did you finish already?' → Have you finished yet? · 'I lost my keys' (still looking) → I've lost · for/since swapped", chunks:"For as long as I can remember · Since day one · It's been ages · Time has flown by · It feels like forever · For the time being.", pv:"keep on · carry on · go on · hold on · move on", pron:"for weak /fər/ · since stress · stress-timing drill", technique:"Circumlocution intro + Summarize-then-Respond", exitTask:"Finished or Not? (3 min): long-running vs finished parts of life; correct for/since + ≥1 result-now perfect." },
  "B1-3": { canDo:"Explain what I've been doing lately and justify my current state.", grammar:"have/has been + -ing; How long have you been...?; PP simple vs continuous; lately/recently.", traps:"'I'm working here since' → I've been working here since · 'I have been knowing him' → I've known him", chunks:"I've been burning the midnight oil · I've been swamped · I've been running on empty · I've been going non-stop · I've been meaning to...", pv:"keep up · catch up · keep at it · plug away · soldier on", pron:"been weak /bɪn/ · continuous rhythm", technique:"Update Framework intro (Pro): Situation → what's been happening → next step", exitTask:"What I've Been Up To (3 min): recent activities + justify current state with PPC." },
  "B1-4": { canDo:"Tell a layered story making clear which past event happened first, using past perfect 3+ times.", grammar:"had + pp; before/after; by the time; already/never.", traps:"using past simple for both events → earlier one with had+pp · 'I had ate' → I had eaten", chunks:"By the time I knew it · It was too late · The damage was done · Little did I know · Water under the bridge · Hindsight is 20/20.", pv:"set off · take off · turn out · end up · find out", pron:"had contractions /əd/ /d/ · 'I'd already' linking", technique:"H-C-E-P + Past Perfect for backstory layering", exitTask:"A Story With Backstory (3 min): one event clearly precedes another; ≥3 natural past perfects." },
  "B1-5": { canDo:"Pitch my 5-year vision: where I'll be living, what I'll be doing, what I'll have achieved.", grammar:"will have + pp (completion); will be + -ing (in progress); by + time; this time next year.", traps:"'I will have graduate' → I will have graduated · simple future for projection → will have + pp", chunks:"By this time next year · The best is yet to come · Sooner or later · All in good time · Onwards and upwards · The sky's the limit.", pv:"wind up · end up · turn out · work out · pan out", pron:"'will have' → /wɪləv/", technique:"Pro Track: vision pitch (Update framework, future-facing)", exitTask:"5-Year Vision (3 min): Pro pitch with future perfect + continuous; both forms + by + time." },
  "B1-6": { canDo:"Negotiate real plans and consequences using first conditional with if/unless/as long as.", grammar:"If + present, will + verb; unless (= if not); as long as / provided that; when + present for future.", traps:"'If it will rain' → If it rains · 'When I will see him' → When I see him", chunks:"If worse comes to worst · If all else fails · If push comes to shove · No strings attached · Fair enough · It's a deal.", pv:"deal with · cope with · face up to · prepare for · watch out for", pron:"if-clause intonation (pause before result)", technique:"Negotiation preview (if/then offers) + Summarize-then-Respond", exitTask:"Make a Deal (3 min): negotiate real scenario; no 'will' in if-clause, ≥1 unless/as long as." },
  "B1-7": { canDo:"Explore hypothetical scenarios and give advice with 'If I were you...' in a dilemma.", grammar:"If + past, would/could/might + verb; If I were; wish + past.", traps:"'If I would win' → If I won · 'If I was you' → If I were you · 'I wish I have' → I wish I had", chunks:"In a perfect world · If only · Wishful thinking · A pipe dream · Not in a million years · If I were in your shoes.", pv:"dream of · wish for · hope for · long for · count on", pron:"would weak /əd/ /d/ · 'I'd' linking", technique:"Advice-giving (If I were you) + opinion expression", exitTask:"What Would You Do? (3 min): dilemma + hypothetical advice; no would in if-clause, wish + past." },
  "B1-8": { canDo:"Describe a process or news event in passive voice when the agent doesn't matter.", grammar:"am/is/are + pp (present); was/were + pp (past); by + agent; 'It is said that...'", traps:"'Is spoke' → is spoken · 'It speaks English here' → English is spoken here · overusing passive (Spanish 'se')", chunks:"It's been said that... · Word has it... · It goes without saying · What's done is done · It is what it is · That's the way it goes.", pv:"be carried out · be put off · be called off · be set up · be brought up", pron:"passive 'be' weak forms · participle stress", technique:"Describing processes neutrally + Update framework (passive for reports)", exitTask:"Explain a Process (3 min): describe how something is made/done; correct passive, agent dropped appropriately." },
  "B1-9": { canDo:"Accurately relay what a third person said and asked, converting tense and pronouns.", grammar:"say/tell/ask + backshift; pronoun/time changes; reported questions (statement word order). NEW: say vs tell vs speak vs talk.", traps:"'He said me' → He told me · 'She asked me if I am coming' → if I was coming · 'what time is it' → what time it was", chunks:"Word for word · In other words · Straight from the horse's mouth · Through the grapevine · Don't shoot the messenger · To put it another way.", pv:"point out · bring up · go on (talking) · sum up · butt in", pron:"reported-speech intonation · that-clause rhythm", technique:"Relaying messages accurately + Summarize-then-Respond", exitTask:"Message Relay (3 min): coach whispers statement + question; relay both; correct backshift + say/tell/ask." },
  "B1-10": { canDo:"Use gerunds and infinitives correctly, including meaning shifts.", grammar:"verb + gerund (enjoy/finish/mind/suggest); verb + infinitive (want/need/decide/plan); stop/remember/forget/try. NEW: separable vs inseparable PVs.", traps:"'Before to go' → before going · 'I enjoy to read' → I enjoy reading · 'interested to learn' → interested in learning · 'turn off it' → turn it off", chunks:"I can't help it · It's no use · There's no point in... · It's worth a shot · I'd rather not · I look forward to...", pv:"feel like · care for · look forward to · get used to · put up with", pron:"-ing /ɪŋ/ · to-infinitive reduction /tə/", technique:"Expressing preferences/decisions + circumlocution (paraphrase when stuck)", exitTask:"Decisions & Preferences (3 min): ≥3 verb patterns + ≥1 meaning-shift pair; correct PV separation." },
  "B1-11": { canDo:"Hold a 5-min unscripted conversation moving fluidly between past/present/future on one topic + deliver a professional status update.", grammar:"REVIEW: perfect tenses, conditionals 1&2, passive, reported speech, gerunds/infinitives.", traps:"Cumulative: perfect vs past · no-will-in-if · If I were · before+gerund · say/tell · for/since", chunks:"Looking back on it now · From now on · So far so good · In retrospect · All things considered · Where do I even start?", pv:"look back · catch up · keep up · sum up · wind up", pron:"complex-sentence rhythm · consolidate stress-timing and schwa", technique:"Full toolkit: Circumlocution + Summarize-then-Respond + Pro Update framework", exitTask:"Status Update + Time Travel (Pro Track, 5 min): professional update + free conversation crossing 3 timelines; ≥5 B1 structures + ≥1 circumlocution." },
  // ── B2 ──
  "B2-1": { canDo:"Analyze a past decision and its alternative outcomes using should/would/could have.", grammar:"If + past perfect, would have + pp; could/might have + pp; should have + pp (regret); wish + past perfect.", traps:"'If I would have studied' → If I had studied · 'I should of studied' → I should have · 'would have pass' → passed", chunks:"Hindsight is 20/20 · I could kick myself · I dropped the ball · I missed the boat · I put my foot in my mouth · If only I'd known.", pv:"screw up · mess up · pass up · miss out (on) · back out", pron:"would've /ˈwʊdəv/ · never 'of'", technique:"Soften-then-Strike intro (acknowledge, then state regret/critique)", exitTask:"The Decision I Regret (3 min): past choice + alternative + regret; no would-have in if-clause, no 'should of'." },
  "B2-2": { canDo:"Connect past causes to present results in a 'sliding doors' conversation.", grammar:"past condition → present result (If I had..., I would be...); present condition → past result (If I were..., I would have...).", traps:"collapsing both clauses to the same time → keep time mismatch deliberate · 'If I would be rich' → If I were rich", chunks:"It's a Catch-22 · Between a rock and a hard place · A double-edged sword · You can't have your cake and eat it · Every cloud has a silver lining.", pv:"end up · turn out · work out · branch out · settle for", pron:"mixed-conditional rhythm · contracted 'I'd' across both results", technique:"PREP intro (structure a hypothetical argument)", exitTask:"Sliding Doors (3 min): how one past change would alter your present; correct mixed structure." },
  "B2-3": { canDo:"Describe services and delegated tasks with causatives (I had my website redesigned).", grammar:"passive in all tenses; causative have/get + object + pp; get + object + pp (informal); 'It is believed that...'", traps:"'I repaired my car' (when someone else did) → I had my car repaired · 'I cut my hair' (at a salon) → I got my hair cut", chunks:"It serves you right · You reap what you sow · What goes around comes around · A wake-up call · Food for thought · Actions have consequences.", pv:"carry out · take care of · sort out · set up · hand over", pron:"passive 'be' weak forms · causative rhythm (HAD my car rePAIRED)", technique:"Pro: delegating & reporting tasks in a meeting", exitTask:"What I Get Done (3 min): describe delegated/service tasks; ≥2 causatives + ≥1 advanced-tense passive." },
  "B2-4": { canDo:"Define and enrich ideas with relative clauses, distinguishing essential from extra information.", grammar:"defining (no commas: The man who called); non-defining (commas: My brother, who lives in Paris, is...); whose/where/when; reduced relatives.", traps:"'The man that his car' → The man whose car · 'the city where I was born there' → no extra 'there' · 'the person who I spoke with him' → no resumptive · defining ≠ commas", chunks:"It's not what you know, it's who you know · Birds of a feather flock together · It's a small world · By and large · For the most part.", pv:"rely on (who) · deal with (which) · look up to · count on · get on with", pron:"relative-pronoun weak forms · comma-pause in non-defining", technique:"Precise explanation (add layers without losing the listener)", exitTask:"Define It Precisely (3 min): people/things with both clause types; correct comma logic, whose, no resumptive." },
  "B2-5": { canDo:"Deliver a 2-min formal pitch using at least 2 emphasis structures (inversion, cleft, emphatic do).", grammar:"negative-adverbial inversion (Never have I seen); cleft (It was John who); what-cleft (What I need is); emphatic do.", traps:"'Never I have seen' → Never have I seen · over-formality in casual talk · 'Is John who called' → It was John who called", chunks:"Make no mistake about it · Mark my words · Without a shadow of a doubt · The long and short of it · Believe you me · I kid you not.", pv:"stand out · point out · single out · bring up · drive home", pron:"emphatic stress · inversion intonation", technique:"Confident pitch + Holding the Floor", exitTask:"The Emphatic Pitch (2 min): persuasive pitch with ≥2 emphasis structures; natural inversion + cleft." },
  "B2-6": { canDo:"Structure and soften an argument with discourse markers and hedging, disagreeing diplomatically (PREP).", grammar:"addition (furthermore/moreover); contrast (however/nevertheless/on the other hand); cause (therefore/consequently); hedging (sort of/I'd argue/apparently).", traps:"'Actually' ≠ actualmente (use currently) · Spanish-direct → hedge · 'In other hand' → On the other hand", chunks:"Having said that · That being said · On the flip side · Then again · By the same token · To some extent · In a manner of speaking.", pv:"touch on · move on · lead into · wrap up · boil down to", pron:"discourse-marker stress + pause · diplomatic falling intonation", technique:"Full PREP + Soften-then-Strike (level's signature move)", exitTask:"Diplomatic Disagreement (3 min): disagree with coach's position using PREP + hedging; no actually-false-friend." },
  "B2-7": { canDo:"React instantly with ellipsis and substitution (So do I / I think so / the red one) keeping conversational speed.", grammar:"so do I / neither do I; I think so / hope so; one/ones; auxiliary substitution.", traps:"'Me too' for negatives → Me neither · 'I think yes' → I think so · 'I want the red' → I want the red one · 'So do I want' → So do I", chunks:"Same here · Me neither · You can say that again · That makes two of us · Ditto · Likewise · I second that.", pv:"go along with · back up · chime in · weigh in · jump in", pron:"so/neither rhythm · substitution stress (auxiliary carries it)", technique:"Conversational speed + Interrupting (jump in naturally)", exitTask:"Quick Reactions (2-3 min): rapid-fire agree/disagree; correct so/neither, think so, one/ones, pace maintained." },
  "B2-8": { canDo:"Compress and elevate narration with participle clauses (Having finished the report, I...).", grammar:"present participle (Walking down the street, I saw); past participle (Seen from above); perfect (Having finished); negative (Not knowing what to do).", traps:"dangling participle (wrong subject) · 'For finishing the report' → Having finished the report", chunks:"Speaking of which · Generally speaking · Strictly speaking · Broadly speaking · To put it bluntly · Truth be told.", pv:"carry on · move on · build up to · set off · wind down", pron:"participle-clause linking · sophisticated falling intonation", technique:"Elevated narration (compress two clauses into one)", exitTask:"Compressed Story (3 min): retell event with ≥3 participle clauses; no dangling, correct perfect participle." },
  "B2-9": { canDo:"Speculate about present and past situations with calibrated certainty (must/might/can't have) in a mystery discussion.", grammar:"must (certain +); can't (certain −); might/may/could (possible); must have/might have/can't have + pp (past deduction).", traps:"'He must to be tired' → He must be tired · 'must have forget' → must have forgotten · can't have (deduction) ≠ mustn't (prohibition)", chunks:"Your guess is as good as mine · It's anyone's guess · I haven't got a clue · It remains to be seen · It's up in the air · Beats me.", pv:"figure out · work out · piece together · rule out · narrow down", pron:"modal weak forms · 'must've/might've' reductions", technique:"Calibrated certainty (hedge or assert based on evidence)", exitTask:"Solve the Mystery (3 min): deduce from clues with present + past modals; must have + pp; can't-have vs mustn't distinction." },
  "B2-10": { canDo:"Express wishes, regrets, and complaints (I wish / If only / I wish you would) with natural intonation.", grammar:"wish + past (present regret); wish + past perfect (past regret); wish + would (complaint); if only (stronger).", traps:"'I wish I know' → I wish I knew · 'I wish I would have' → I wish I had · 'I wish you listen' → I wish you would listen", chunks:"If only · Would that it were · It's a crying shame · What a pity · To my lasting regret · Live and learn.", pv:"long for · yearn for · pine for · hanker after · kick oneself", pron:"wish/if-only stress · wistful intonation", technique:"Expressing regret/complaint diplomatically (soften-then-strike applied to grievances)", exitTask:"Regrets & Complaints (3 min): present + past regrets + 1 diplomatic complaint; wish + would for complaint." },
  "B2-11": { canDo:"Defend a position in a formal 10-min debate deploying 5+ B2 structures + survive a professional meeting.", grammar:"REVIEW: conditionals 3 & mixed · advanced passive/causative · relatives · inversion · discourse · deduction · wish/regret.", traps:"Cumulative: no-would-in-if · should-have · causative · whose · inversion order · actually false friend · wish+knew", chunks:"At the end of the day · When all is said and done · The bottom line is · By and large · On the whole · Let's agree to disagree.", pv:"kick off · run through · follow up (on) · wrap up · circle back", pron:"connected-speech consolidation · debate prosody", technique:"Full PREP + Soften-then-Strike + Interrupting & Holding the Floor (complete debate kit)", exitTask:"The Debate + The Meeting (Pro Track, ~10 min): debate + meeting roleplay; ≥5 B2 structures + ≥1 polite interruption + ≥1 soften-then-strike." },
  // ── C1 ──
  "C1-1": { canDo:"Deploy 8+ common idioms accurately and naturally in one informal conversation, without forcing them.", grammar:"Advanced Structure — Fixed collocations & idiom grammar: idioms resist alteration (spill the beans, not spill beans); intensifier collocations (highly unlikely, bitterly disappointed).", traps:"literal translation of Spanish idioms · over-formal register where idioms belong · mis-collocation ('do a party' → throw a party)", chunks:"a piece of cake · let the cat out of the bag · kill two birds with one stone · break a leg · bite the bullet · under the weather · spill the beans · once in a blue moon · speak of the devil · beat around the bush · hit the nail on the head · pull someone's leg.", pv:"get along · fall out · make out · work out · turn up", pron:"idiomatic stress & reductions · flapping ('get along' → /ɡeɾəˈlɔŋ/)", technique:"Strategic humor (land an idiom for effect, read the room)", exitTask:"Idiom-Rich Chat (4 min): informal conversation with ≥8 natural idioms; no literal calques." },
  "C1-2": { canDo:"Use multi-meaning PVs across contexts, choosing separable/inseparable correctly at speed.", grammar:"PV grammar mastery: separable vs inseparable; transitive vs intransitive; literal vs figurative; 3-part PVs (put up with, look forward to, get on with).", traps:"avoiding PVs (sounds bookish) · 'turn off it' → turn it off · 'put up with it' word order", chunks:"put up with · look forward to · run out of · get along with · come up with · fall behind · catch up with · keep up with · figure out · give up · look after · make up.", pv:"(this chapter IS phrasal verbs)", pron:"particle stress (PUT it OFF) · reductions at speed", technique:"Register Surfing intro (PVs are informal — when to swap for Latinate)", exitTask:"Phrasal Verb Sprint (3 min): 10 PVs across contexts with pronoun objects; ≥1 three-part PV." },
  "C1-3": { canDo:"Deliver the same message in 3 registers (friend / colleague / executive), adapting vocab, grammar, and tone on demand.", grammar:"Register grammar: contraction vs full form; phrasal vs Latinate (get → obtain); nominalization (we decided → the decision was made); modal politeness gradient.", traps:"Spanish formality maps differently (usted ≠ full forms) · formal false friends (assist ≠ asistir; eventually ≠ eventualmente) · over-formal email English", chunks:"kids/children · buy/purchase · help/assist · start/commence · Can you/Would you mind · Maybe/Perhaps · But/However · So/Therefore · About/Regarding · find out/ascertain · let/permit.", pv:"tone down · dial up · switch over · shift to · adapt to", pron:"register-appropriate intonation (warmer casual, measured formal)", technique:"Register Surfing (level's signature drill) + STAR for professional self-presentation", exitTask:"Three Registers (3 min): same message (e.g. declining an invite) to friend, colleague, VP; clear shifts across all 3 dimensions." },
  "C1-4": { canDo:"Detect sarcasm and irony in native speech and respond in kind, with appropriate timing and intonation.", grammar:"Irony grammar: rhetorical questions; understatement/overstatement; double negatives for effect (not bad at all); tag questions for sarcasm.", traps:"missing sarcasm cues (intonation-carried, not lexical) · literal interpretation · humor that doesn't translate (timing & cultural refs differ)", chunks:"Yeah, right! · Tell me about it · No way! · You don't say! · Oh, that's just great · Could this day get any worse? · As if! · Big deal · Oh, wonderful · Just what I needed · Story of my life.", pv:"crack up · crack down on · mess around · fool around · show off", pron:"sarcasm intonation (flat/drawn-out delivery) — make-or-break · /dʒ/ vs /j/ (joke, not 'yoke')", technique:"Reading & returning humor; safe self-deprecation", exitTask:"Spot the Sarcasm (3 min): coach delivers sincere/sarcastic lines; identify and return sarcasm; no literal misreads." },
  "C1-5": { canDo:"Tell a suspenseful 5-min story with flashbacks, cliffhangers, and direct speech that keeps listeners engaged.", grammar:"Narrative grammar: historic present for drama (So I walk in and he goes...); direct speech with be like/go; fronting for suspense (Out of the shadows came...).", traps:"over-using past simple flatly (no tense variation) · 'he said me' · literal connectors instead of narrative ones", chunks:"Once upon a time · It all started when... · Little did I know · To cut a long story short · The next thing I knew · Out of nowhere · Believe it or not · Just when I thought... · And that's when... · Plot twist · Against all odds.", pv:"build up · wind up · sum up · lead up to · set up (the scene)", pron:"dramatic pacing & pauses · pitch range (Spanish narrower — stretch it)", technique:"Suspense engineering (cliffhangers, strategic pause) + extension", exitTask:"The Gripping Story (5 min): suspenseful story with flashback + cliffhanger + direct speech; listener stays hooked." },
  "C1-6": { canDo:"Lead a negotiation roleplay: propose, counter, compromise, and close using softening strategically.", grammar:"Negotiation grammar: conditional bargaining (If you..., we could...); softened proposals (Would you be open to...?); concession (I take your point, however...).", traps:"too direct or too deferential (register miscalibrated) · 'I am agree' · literal 'we make a deal' timing", chunks:"What if we...? · How about...? · Would you consider...? · Let's meet halfway · Let's compromise · I'm willing to... · Would you be open to...? · That's a fair point · Let's think outside the box · That's my final offer · Take it or leave it · We have a deal · The ball's in your court.", pv:"work out · sort out · iron out · hammer out · back down", pron:"diplomatic intonation · stress on key terms in an offer", technique:"Pro: lead negotiation (propose→counter→compromise→close) + soften-then-strike applied live", exitTask:"Close the Deal (Pro Track, 4 min): negotiate real-ish scenario to close; ≥3 softened proposals + ≥1 concession." },
  "C1-7": { canDo:"Respond to emotional situations with calibrated empathy, matching extreme adjectives and supportive expressions to the moment.", grammar:"Emotional grammar: gradable vs extreme adjectives (very tired vs exhausted — no 'very exhausted'); intensifier collocations (absolutely devastated); empathetic conditionals.", traps:"very + extreme adjective · emotional false friends (sensible = sensato, not sensitive) · under-reacting (English expects verbal empathy)", chunks:"over the moon · devastated · furious · petrified · exhausted · thrilled · heartbroken · I can imagine how you feel · That must be hard · I feel your pain · I'm here for you · Hang in there · I've got your back.", pv:"break down · cheer up · calm down · open up · reach out", pron:"warm/supportive intonation · softening tone", technique:"Calibrated empathy (match intensity to the situation) + active listening", exitTask:"Be There for Someone (3 min): coach shares a problem; respond empathetically; correct gradable/extreme, ≥3 empathy expressions, no very+extreme." },
  "C1-8": { canDo:"Build and defend a critical argument citing evidence, conceding points, and counter-arguing.", grammar:"Argument grammar: concessive clauses (Although/While/Despite the fact that); evidential framing (Given that..., it follows that...); cleft for emphasis.", traps:"'Despite of' → despite / in spite of · 'Although... but...' (no double) · over-asserting without hedging", chunks:"From my perspective · If you ask me · The way I see it · I'm inclined to believe · My take is... · I see your point, but... · While I understand..., I think... · On the contrary · Devil's advocate · The bottom line.", pv:"think through · work through · look into · delve into · back up (with evidence)", pron:"analytical intonation · stress on contrast/concession words", technique:"Concede-then-counter (advanced PREP); citing evidence verbally", exitTask:"Defend Your Position (4 min): debate where student concedes ≥1 point and counters; concessive clause + evidence; no 'despite of'." },
  "C1-9": { canDo:"Recognize and use common American cultural references and sports metaphors in business small talk.", grammar:"Allusion as shorthand: referential idioms (a Catch-22, a Hail Mary, the elephant in the room); sports metaphors in business (ballpark figure, touch base, hit it out of the park).", traps:"missing the reference · mixing US/UK refs · forcing references unnaturally", chunks:"It's like déjà vu · That's so cliché · It's a Catch-22 · It's a no-brainer · It's a game changer · ballpark figure · touch base · drop the ball · the elephant in the room · a Hail Mary · back to square one · throw a curveball · par for the course.", pv:"catch on · tune in · tune out · keep up with · pick up on", pron:"reference delivery (casual, embedded) · American place/name pronunciation", technique:"Small-talk mastery (first 90 seconds of any call: weather, weekend, sports, traffic) — the Pro pain point", exitTask:"Business Small Talk (3 min): open a call with culturally-aware small talk using ≥3 references/sports metaphors; smooth transition into business." },
  "C1-10": { canDo:"Navigate a full social event simulation (small talk → storytelling → debate → goodbye) sounding natural throughout.", grammar:"REVIEW: collocations · PV grammar · register · irony · narrative tense · negotiation conditionals · concession · allusion.", traps:"Cumulative: literal calques · false friends (actually/assist/sensible/eventually) · despite of · very+extreme · register miscalibration", chunks:"At the end of the day · It is what it is · You win some, you lose some · That's life · No worries · Every cloud has a silver lining · Roll with the punches · Go with the flow · Better safe than sorry · Onwards and upwards.", pv:"go with · roll with · take in · take on · deal with", pron:"native-rhythm consolidation · flapping + reductions + irony intonation", technique:"All C1 techniques live: Register Surfing + humor + storytelling + small talk + negotiation", exitTask:"The Networking Event (~8 min): arrive → small talk → tell a story → get into a friendly debate → exit gracefully; all 4 phases natural, register-appropriate throughout." },
  // ── C2 ──
  "C2-1": { canDo:"Express precise degrees of certainty, agreement, and intensity, choosing among 5+ gradable modifiers deliberately.", grammar:"Gradience grammar: modifier scaling (slightly → somewhat → considerably → radically); downtoners vs intensifiers; not entirely / not necessarily / hardly for precision.", traps:"binary thinking (yes/no) instead of gradience · 'quite' confusion (UK 'very' vs US 'somewhat') · 'rather' misused", chunks:"more or less · to some extent · up to a point · in a sense · sort of · rather · quite · fairly · relatively · slightly · somewhat · marginally · substantially · considerably · dramatically · radically.", pv:"boil down to · come down to · get down to · narrow down · zero in on", pron:"subtle stress shifts that carry degree · contrastive stress for precision", technique:"Precision under pressure (avoid absolutes; calibrate)", exitTask:"Calibrate It (3 min): discuss contested topic with ≥5 degree modifiers deliberately; gradience over binaries." },
  "C2-2": { canDo:"Deliver a 5-min persuasive speech using 3+ rhetorical devices, moving an audience to a decision.", grammar:"Rhetorical grammar: anaphora (repeated openings); tricolon (rule of three); rhetorical questions; antithesis (not X, but Y); fronting for impact.", traps:"over-ornate Spanish rhetoric transferring as verbose English · 'consider the possibility to' → of + -ing · weak call-to-action", chunks:"Imagine if · Picture this · Just think about · What if I told you? · Here's the thing · The truth is · Let's be honest · At the end of the day · The fact of the matter is · Mark my words · You have my word · I promise you.", pv:"win over · talk into · talk out of · bring around · get through to", pron:"Rule of Three rhythm · strategic pause before the punch · conviction in delivery", technique:"Rule of Three + strategic pause (level's signature delivery move)", exitTask:"The Persuasive Speech (5 min): persuade coach to a decision with ≥3 rhetorical devices; tricolon + strategic pause + clear call-to-action." },
  "C2-3": { canDo:"Sustain an academic-level discussion deploying sophisticated vocabulary with correct connotation and collocation.", grammar:"Lexical precision grammar: connotation control (positive/negative/neutral synonyms); register-locked collocations (pose a threat, raise concerns, yield results); nominalization for density.", traps:"Latinate over-formality (Spanish cognates sound stiff in casual English) · advanced false friends (comprehensive ≠ comprensivo; eventually ≠ eventualmente) · wrong connotation", chunks:"ubiquitous · ephemeral · pragmatic · ambiguous · inevitable · serendipity · paradigm · dichotomy · nuance · juxtaposition · quintessential · esoteric · pervasive · detrimental · salient · lucid · prudent · resilient.", pv:"dive into · delve into · tap into · draw on · fall back on", pron:"advanced-vocabulary stress (uBIQuitous, ePHEMeral) · precise articulation", technique:"Lexical precision (choosing the exact word for the exact connotation)", exitTask:"Academic Discussion (4 min): discuss abstract topic with ≥6 sophisticated words correctly; no false-friend slips." },
  "C2-4": { canDo:"Construct a formal argument with thesis, evidence, counter-argument, and rebuttal in a moderated debate.", grammar:"Argument architecture: subordination stacking; logical connectors (insofar as, to the extent that, notwithstanding); conditional concession (even if..., that would not...).", traps:"run-on subordination (Spanish tolerates longer chains) · notwithstanding misused · circular argument from weak connector control", chunks:"The central argument is · The premise is that · This is predicated on · This begs the question · This raises the issue of · The implications are · It follows that · Consequently · By extension · By the same token · Conversely · Ceteris paribus · The burden of proof.", pv:"argue for · argue against · point out · bring up · follow through", pron:"logical-rhythm stress on connectors · rebuttal intonation", technique:"Thesis-Evidence-Counter-Rebuttal (formal debate structure) + Reframing intro", exitTask:"Formal Rebuttal (5 min): moderated debate; student must rebut counter-argument; thesis + evidence + rebuttal + ≥3 correct logical connectors." },
  "C2-5": { canDo:"Create and sustain an extended metaphor to explain a complex professional concept memorably.", grammar:"Conceptual metaphor grammar: mapping source→target consistently; extending a metaphor across a turn; avoiding mixed/dead metaphors.", traps:"mixed metaphors from literal translation · dead metaphors used as if fresh · over-extending until it breaks", chunks:"Time is money · Life is a journey · Argument is war · The ship has sailed · The ball is in your court · Don't rock the boat · Stay on track · Don't burn bridges · The tip of the iceberg · Moving the needle · A double-edged sword · Weather the storm.", pv:"sail through · steam ahead · drift apart · sink in · drown out", pron:"imagery-supporting intonation · pacing for a landed metaphor", technique:"Extended metaphor as explanatory tool (make the abstract concrete)", exitTask:"Explain by Metaphor (3 min): explain complex work concept via 1 sustained metaphor; consistent source→target, no mixed metaphor." },
  "C2-6": { canDo:"Participate in academic discourse: hedge claims, cite sources verbally, and challenge methodology respectfully.", grammar:"Academic grammar: the subjunctive (It is essential that he BE present / I suggest that she ARRIVE early); nominalization-heavy style; agentless passive; hedged assertion.", traps:"MISSING subjunctive (that he is → that he BE) · over-personal academic style (Spanish 'yo creo' → English prefers agentless) · investigate vs research register", chunks:"The literature suggests · Research indicates · Evidence points to · It can be argued that · The findings demonstrate · The data reveal · This is consistent with · This contradicts · Further research is needed · The limitations of this study · From a theoretical perspective · The methodological approach.", pv:"draw on · build on · expand on · elaborate on · comment on", pron:"scholarly measured rhythm · hedged-claim intonation", technique:"Hedged assertion + respectful methodological challenge", exitTask:"Challenge the Study (4 min): critique claim's methodology respectfully with ≥1 subjunctive; agentless academic register, hedged not blunt." },
  "C2-7": { canDo:"Run an executive meeting in English: open, drive the agenda, manage interruptions, synthesize, and close with action items.", grammar:"Executive grammar: nominalized action items (ownership of the rollout sits with...); diplomatic imperatives (let's go ahead and...); strategic future (we'll be positioned to...).", traps:"over-direct or over-soft meeting register · literal corporate calques · 'assist to the meeting' → attend", chunks:"Moving forward · Going forward · At this point in time · In the current climate · Given the circumstances · With that in mind · Let's circle back to · Let's touch base · Let's take this offline · I'll loop you in · I'll keep you posted · Let's align on this · The key takeaway is · Action items are.", pv:"ramp up · scale up · roll out · phase out · follow up on", pron:"executive measured authority · pause to control the floor", technique:"Facilitation (level's signature): open, drive, manage interruptions, synthesize, close", exitTask:"Chair the Meeting (Pro Track, 5 min): student runs meeting with coach as difficult participant; clear open + agenda + ≥1 interruption managed + synthesis + action items." },
  "C2-8": { canDo:"Use rhetorical and literary devices (rule of three, strategic pause, understatement) for memorable delivery.", grammar:"Stylistic grammar: parallelism; oxymoron/paradox for effect; deliberate understatement (litotes: not bad at all); periodic sentences (delay the point).", traps:"parallelism breaks (Spanish flexibility transfers as inconsistency) · hyperbole that reads as insincere · literal oxymorons", chunks:"busy as a bee · cool as a cucumber · deafening silence · bittersweet · awfully good · pretty ugly · I'm so hungry I could eat a horse · raining cats and dogs · easy as pie · a needle in a haystack · not the end of the world · less is more.", pv:"play on · draw out · play up · play down · sum up", pron:"dramatic delivery · strategic pause as device · parallel-structure rhythm", technique:"Memorable delivery (rule of three + understatement + pause) — rhetorician's polish", exitTask:"The Memorable Line (3 min): deliver short address with ≥2 literary devices; parallelism intact + ≥1 understatement/paradox + pause landed." },
  "C2-9": { canDo:"Facilitate a cross-cultural discussion, navigating sensitive topics with inclusive language and reframing tension.", grammar:"Diplomatic grammar: maximally hedged disagreement; impersonal framing to depersonalize tension (one might argue); reframing constructions (Perhaps the more useful question is...).", traps:"assuming shared cultural defaults · directness calibrated for LatAm reading as blunt elsewhere · over-generalizing ('the Americans...')", chunks:"In my culture · Where I'm from · Back home · The way we do things · It's customary to · Generally speaking · Of course, this varies · I don't mean to generalize, but · Correct me if I'm wrong · I appreciate your perspective · Let's find common ground · With respect · If I may · Help me understand.", pv:"adapt to · adjust to · fit in · blend in · stand out", pron:"respectful/inclusive intonation · de-escalation tone", technique:"Reframing (level's signature): take tension, reshape into a productive question", exitTask:"Defuse and Reframe (4 min): coach raises tense cross-cultural point; student reframes productively; ≥1 reframing move + inclusive language + tension lowered." },
  "C2-10": { canDo:"Deliver an executive presentation, survive hostile Q&A, and close a complex negotiation — back to back, in one session.", grammar:"REVIEW: gradience · rhetoric · nominalization · subordination · conceptual metaphor · subjunctive · executive register · literary devices · diplomatic reframing.", traps:"Final checklist: binary vs gradience · missing subjunctive · false friends · despite of · over-/under-directness · parallelism · assist→attend", chunks:"It goes without saying · Needless to say · By definition · Virtually · Essentially · Fundamentally · Ostensibly · Purportedly · Allegedly · Presumably · Arguably · Undoubtedly · Indisputably · In essence · For all intents and purposes · When push comes to shove.", pv:"rise above · rise to · live up to · measure up to · stand up to", pron:"full rhetorical-prosody command · effortless native-like flow", technique:"All C2 techniques live: Reframing + Rule of Three + Facilitation, under pressure", exitTask:"The Executive Gauntlet (Capstone, ~12 min): 4-min exec presentation + hostile Q&A + close complex negotiation; poise under hostility, ≥1 reframing of hostile question, flawless register throughout." },
};

const LEVEL_ORDER = ["Fn","A1","A2","B1","B2","C1","C2"];

const TECHNIQUES = [
  { key:"repair-ladder", name:"Repair Ladder", level:"Fn",
    desc:"Survive class 100% in English: when something breaks, repair with emergency phrases instead of switching to Spanish. Ladder: didn't hear → repeat · didn't understand → what does X mean · stuck → let me think · missing the word → how do you say.",
    example:"\"Sorry, can you repeat that?\" · \"What does 'schedule' mean?\" · \"How do you say 'madrugar' in English?\"" },
  { key:"minimal-responses", name:"Minimal Responses", level:"Fn",
    desc:"Short reactions while the other person speaks, to show you're following the conversation without needing full sentences.",
    example:"\"Uh-huh... OK... really? ... wow... I see.\"" },
  { key:"aaa", name:"Answer-Add-Ask (AAA)", level:"A1",
    desc:"Never answer with a single sentence: answer, add a detail, and bounce back a question. It's the engine of every conversation.",
    example:"\"Do you exercise?\" → \"Yes, I run twice a week. It clears my head. Do you work out?\"" },
  { key:"small-talk", name:"Small Talk Ritual", level:"A1",
    desc:"The first 90 seconds of any conversation: weather, weekend, work, plans. Opens and closes every social or professional interaction.",
    example:"\"How was your weekend? Anything exciting?\" · \"Crazy weather, huh?\" · \"We should catch up soon.\"" },
  { key:"politeness", name:"Politeness Register", level:"A1",
    desc:"Ask for things with the right level of politeness for the context (restaurant, hotel, store). First contact with register-switching.",
    example:"\"Could I get a coffee, please?\" · \"Would it be possible to change my seat?\" · \"I was wondering if...\"" },
  { key:"fillers", name:"Buying-Time Fillers", level:"A2",
    desc:"Buy time to think IN ENGLISH instead of using \"este...\", \"o sea...\". Keeps the conversation alive while you process.",
    example:"\"Well... let me see... that's a good question... how can I put it...\"" },
  { key:"hcep", name:"Storytelling H-C-E-P", level:"A2",
    desc:"Story architecture: Hook → Context (background with past continuous) → Events (past simple) → Punchline. Turns flat anecdotes into stories.",
    example:"\"You won't believe what happened... I was cooking dinner when suddenly the lights went out...\"" },
  { key:"backchanneling", name:"Active Backchanneling", level:"A2",
    desc:"React actively while the other person tells something — the listener works too. Without this, the speaker feels they're talking alone.",
    example:"\"No way! And then what? That's crazy. You're kidding!\"" },
  { key:"summarize-respond", name:"Summarize-then-Respond", level:"B1",
    desc:"Summarize what the other person said before responding. Confirms understanding and gives you time to build your reply.",
    example:"\"So you've traveled a lot — what's been your favorite trip?\"" },
  { key:"circumlocution", name:"Circumlocution & Paraphrase", level:"B1",
    desc:"\"Talk around\" the word that won't come out: describe function, form, or category instead of getting stuck or translating.",
    example:"\"It's the thing you use to open a bottle... a bottle opener!\"" },
  { key:"update-framework", name:"Update Framework", level:"B1",
    desc:"Professional status in 3 parts: current situation → what's been happening (perfect tenses) → next step. The structure of a status report.",
    example:"\"The project is on track. I've finished the design phase. Next, I'll start testing.\"" },
  { key:"prep", name:"PREP", level:"B2",
    desc:"Argument structure: Point → Reason → Example → Point. Organizes any opinion for debate or presentation.",
    example:"\"Remote work works (P) because it saves commute time (R). My team gained 2 hours a day (E). That's why I support it (P).\"" },
  { key:"soften-strike", name:"Soften-then-Strike", level:"B2",
    desc:"Acknowledge the other person's point first, disagree after. Diplomatic disagreement that doesn't create friction.",
    example:"\"I see your point, and it's valid. However, the data shows the opposite.\"" },
  { key:"interrupting", name:"Interrupting & Holding the Floor", level:"B2",
    desc:"Interrupt politely and don't let others take the floor from you in meetings or debates.",
    example:"\"Sorry to jump in, but...\" · \"Let me just finish this thought.\"" },
  { key:"register-surfing", name:"Register Surfing", level:"C1",
    desc:"Same message adapted to 3 registers: friend → colleague → executive. Changes vocabulary, grammar, and tone on demand.",
    example:"\"Gotta bail tonight\" → \"I can't make it tonight\" → \"I'm afraid I won't be able to attend.\"" },
  { key:"star", name:"STAR (Self-Promotion)", level:"C1",
    desc:"Sell yourself professionally without sounding arrogant: Situation → Task → Action → Result. The interview and performance-review structure.",
    example:"\"Sales dropped (S). I had to fix the funnel (T). I redesigned onboarding (A). Sales rose 30% (R).\"" },
  { key:"humor", name:"Strategic Humor & Sarcasm", level:"C1",
    desc:"Detect sarcasm/irony (it's in the intonation, not the words) and return it. Includes safe self-deprecation and reading the room.",
    example:"\"Another Monday meeting? Oh, wonderful. Just what I needed.\"" },
  { key:"empathy", name:"Calibrated Empathy", level:"C1",
    desc:"Respond to emotional situations with the right intensity: extreme adjectives used correctly + supportive expressions. In English, empathy is verbalized.",
    example:"\"That must be really hard. I'm here for you. Hang in there.\"" },
  { key:"concede-counter", name:"Concede-then-Counter", level:"C1",
    desc:"Concede a valid point from the opponent and counter-argue — advanced PREP for critical thinking.",
    example:"\"That's a valid argument. However, it ignores the long-term cost.\"" },
  { key:"negotiation", name:"Negotiation", level:"C1",
    desc:"Lead a full negotiation: propose → counter-offer → concede strategically → close.",
    example:"\"Would you be open to a 6-month deal?\" · \"Let's meet halfway.\" · \"We have a deal.\"" },
  { key:"reframing", name:"Reframing", level:"C2",
    desc:"Take a hostile question or tense topic and reformulate it as a productive question. The tool for difficult Q&A.",
    example:"\"Perhaps the more useful question is how we prevent this next time.\"" },
  { key:"rule-of-three", name:"Rule of Three + Strategic Pause", level:"C2",
    desc:"Rhetorical trios and strategic pause before the key point. The rhythm of memorable speeches.",
    example:"\"It's faster. It's cheaper. And — (pause) — it's already working.\"" },
  { key:"facilitation", name:"Facilitation", level:"C2",
    desc:"Moderate executive meetings: open, drive the agenda, manage interruptions, synthesize, and close with action items.",
    example:"\"Let's hear Maria first, then circle back.\" · \"To summarize, we agreed on three actions.\"" },
];

function ProgressView({ user }) {
  const [students,   setStudents]   = useState(null);
  const [selId,      setSelId]      = useState("");
  const [chapProg,   setChapProg]   = useState({});   // { "level-ch": row }
  const [techProg,   setTechProg]   = useState({});   // { techniqueKey: row }
  const [openLevels, setOpenLevels] = useState({});
  const [openChap,   setOpenChap]   = useState("");   // solo un capítulo abierto a la vez
  const [openTechs,  setOpenTechs]  = useState({});
  const [myName,     setMyName]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const STATUS_COLORS = [C.border2, C.amber, C.green];
  const CHAP_LABELS   = ["Not seen", "In progress", "Exit Task passed"];
  const TECH_LABELS   = ["Not introduced", "Practicing", "Mastered"];

  useEffect(() => {
    supabase.from("students_basic").select("*").eq("active", true).order("name")
      .then(({ data, error: e }) => {
        if (e) setError(e.message); else setStudents(data || []);
      });
    supabase.from("profiles").select("nombre").eq("id", user.id).single()
      .then(({ data }) => setMyName(data?.nombre || ""));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selStudent = (students || []).find(s => s.id === selId) || null;

  const loadProgress = async (sid) => {
    setLoading(true);
    const [{ data: ch }, { data: te }] = await Promise.all([
      supabase.from("student_chapter_progress").select("*").eq("student_id", sid),
      supabase.from("student_technique_progress").select("*").eq("student_id", sid),
    ]);
    const cm = {}; (ch || []).forEach(r => { cm[`${r.level}-${r.chapter}`] = r; });
    const tm = {}; (te || []).forEach(r => { tm[r.technique] = r; });
    setChapProg(cm); setTechProg(tm); setLoading(false);
  };

  const selectStudent = (sid) => {
    setSelId(sid); setChapProg({}); setTechProg({}); setOpenTechs({}); setOpenChap("");
    if (!sid) return;
    const stu = (students || []).find(s => s.id === sid);
    setOpenLevels(stu?.level ? { [stu.level]: true } : {});
    loadProgress(sid);
  };

  const cycleChapter = async (level, chapter) => {
    const key  = `${level}-${chapter}`;
    const cur  = chapProg[key]?.status || 0;
    const next = (cur + 1) % 3;
    const row  = { student_id: selId, level, chapter, status: next, updated_by: myName, updated_at: new Date().toISOString() };
    setChapProg(p => ({ ...p, [key]: { ...(p[key] || {}), ...row } }));
    const { error: e } = await supabase.from("student_chapter_progress")
      .upsert(row, { onConflict: "student_id,level,chapter" });
    if (e) { toast("Could not save: " + e.message); loadProgress(selId); }
  };

  const cycleTechnique = async (tkey) => {
    const cur  = techProg[tkey]?.status || 0;
    const next = (cur + 1) % 3;
    const row  = { student_id: selId, technique: tkey, status: next, updated_by: myName, updated_at: new Date().toISOString() };
    setTechProg(p => ({ ...p, [tkey]: { ...(p[tkey] || {}), ...row } }));
    const { error: e } = await supabase.from("student_technique_progress")
      .upsert(row, { onConflict: "student_id,technique" });
    if (e) { toast("Could not save: " + e.message); loadProgress(selId); }
  };

  const fmtWhen = (r) => {
    if (!r?.updated_at) return "";
    const d = new Date(r.updated_at);
    return `${r.updated_by ? r.updated_by.split(" ")[0] + " · " : ""}${d.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
  };

  const StatusDot = ({ status, onClick, title }) => (
    <button onClick={onClick} title={title}
      style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
        background: status > 0 ? STATUS_COLORS[status] : "transparent",
        border: `2px solid ${STATUS_COLORS[status]}`,
        transition: "all 0.15s" }} />
  );

  return (
    <div style={{ width: "100%", maxWidth: 800 }}>
      {/* Student picker */}
      <div style={{ ...CARD, borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1rem",
        display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>Student</p>
        <select value={selId} onChange={e => selectStudent(e.target.value)}
          style={{ flex: 1, minWidth: 180, background: "#1e1b17", color: C.text, fontFamily: "inherit",
            fontSize: 13, fontWeight: 600, padding: "0.5rem 0.7rem", borderRadius: 8,
            border: `1px solid ${C.border2}` }}>
          <option value="">Select a student...</option>
          {(students || []).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {selStudent && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "0.3rem 0.6rem", borderRadius: 6,
            background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: C.green }}>
            Level {selStudent.level}
          </span>
        )}
      </div>

      {error && <div style={{ ...CARD, padding: "1rem", marginBottom: "1rem" }}><p style={{ color: "#d95f5f", fontSize: 13 }}>{error}</p></div>}

      {!selId && !error && (
        <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 13 }}>Select a student to see their progress.</p>
        </div>
      )}

      {selId && (
        <>
          {/* Syllabus Progress header */}
          <div style={{ margin: "0.2rem 0 0.6rem", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text }}>
              Syllabus Progress
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>
              {LEVEL_ORDER.reduce((acc, lv) => acc + (SYLLABUS[lv]?.chapters.filter(([n]) => (chapProg[`${lv}-${n}`]?.status || 0) === 2).length || 0), 0)}/
              {LEVEL_ORDER.reduce((acc, lv) => acc + (SYLLABUS[lv]?.chapters.length || 0), 0)} chapters passed
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem", paddingLeft: 4 }}>
            {[0,1,2].map(s => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text3 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block",
                  background: s > 0 ? STATUS_COLORS[s] : "transparent", border: `2px solid ${STATUS_COLORS[s]}` }} />
                {CHAP_LABELS[s]}
              </span>
            ))}
          </div>

          {/* Chapters by level */}
          {STU_LEVELS.map(lv => {
            const conf = SYLLABUS[lv];
            if (!conf) return null;
            const total  = conf.chapters.length;
            const passed = conf.chapters.filter(([n]) => (chapProg[`${lv}-${n}`]?.status || 0) === 2).length;
            const open   = !!openLevels[lv];
            const isCurrent = selStudent?.level === lv;
            return (
              <div key={lv} style={{ ...CARD, borderRadius: 14, marginBottom: "0.6rem", overflow: "hidden",
                border: isCurrent ? "1px solid rgba(37,211,102,0.35)" : undefined }}>
                <div onClick={() => setOpenLevels(p => ({ ...p, [lv]: !p[lv] }))}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.1rem", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, color: C.text3, width: 14 }}>{open ? "▾" : "▸"}</span>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.text, flexShrink: 0 }}>{conf.label}</p>
                  {isCurrent && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: C.green,
                    textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: 4,
                    background: "rgba(37,211,102,0.1)" }}>current</span>}
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(240,236,224,0.07)", minWidth: 60 }}>
                    <div style={{ width: `${(passed/total)*100}%`, height: "100%", borderRadius: 3,
                      background: passed === total ? C.green : C.amber, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: passed === total ? C.green : C.text2, flexShrink: 0 }}>
                    {passed}/{total}
                  </p>
                </div>
                {open && (
                  <div style={{ borderTop: `1px solid ${C.border}` }}>
                    {conf.chapters.map(([n, title], i) => {
                      const chapKey = `${lv}-${n}`;
                      const row     = chapProg[chapKey];
                      const st      = row?.status || 0;
                      const info    = CHAPTER_INFO[chapKey];
                      const chOpen  = openChap === chapKey;
                      return (
                        <div key={n} style={{ borderBottom: i < conf.chapters.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.65rem 1.1rem" }}>
                            <StatusDot status={st} title={CHAP_LABELS[st]} onClick={() => cycleChapter(lv, n)} />
                            <div onClick={() => info && setOpenChap(cur => cur === chapKey ? "" : chapKey)}
                              style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem",
                                cursor: info ? "pointer" : "default", minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, flex: 1,
                                color: st === 2 ? C.text3 : C.text,
                                textDecoration: st === 2 ? "line-through" : "none" }}>
                                <span style={{ color: C.text3, fontWeight: 700, marginRight: 6 }}>Ch {n}</span>{title}
                              </p>
                              {st > 0 && <p style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>{fmtWhen(row)}</p>}
                              {info && <span style={{ fontSize: 11, color: C.text3, flexShrink: 0, marginLeft: 4 }}>{chOpen ? "▾" : "▸"}</span>}
                            </div>
                          </div>
                          {chOpen && info && (
                            <div style={{ padding: "0.2rem 1.1rem 1rem 3rem", display: "flex", flexDirection: "column", gap: 8 }}>
                              {[
                                ["Can-Do", info.canDo],
                                ["Grammar", info.grammar],
                                ["Spanish Traps", info.traps],
                                ["Chunks / Idioms", info.chunks],
                                ["Phrasal Verbs", info.pv],
                                ["Pronunciation", info.pron],
                                ["Technique", info.technique],
                                ["Exit Task", info.exitTask],
                              ].map(([label, content], j) => (
                                <div key={j}>
                                  <p style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
                                  <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.55 }}>{content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Communication Techniques Progress */}
          <div style={{ margin: "1.8rem 0 0.6rem", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text }}>
              Communication Techniques Progress
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>
              {TECHNIQUES.filter(t => (techProg[t.key]?.status || 0) === 2).length}/{TECHNIQUES.length} mastered
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem", paddingLeft: 4 }}>
            {[0,1,2].map(s => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text3 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block",
                  background: s > 0 ? STATUS_COLORS[s] : "transparent", border: `2px solid ${STATUS_COLORS[s]}` }} />
                {TECH_LABELS[s]}
              </span>
            ))}
          </div>
          {/* Techniques grouped by level */}
          {LEVEL_ORDER.map(lv => {
            const techs = TECHNIQUES.filter(t => t.level === lv);
            if (!techs.length) return null;
            const lvLabel = SYLLABUS[lv]?.label || lv;
            return (
              <div key={lv} style={{ marginBottom: "0.9rem" }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: C.text3, marginBottom: 6, paddingLeft: 4 }}>{lvLabel}</p>
                <div style={{ ...CARD, borderRadius: 14, overflow: "hidden" }}>
                  {techs.map((t, i) => {
                    const row  = techProg[t.key];
                    const st   = row?.status || 0;
                    const open = !!openTechs[t.key];
                    return (
                      <div key={t.key} style={{ borderBottom: i < techs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.65rem 1.1rem" }}>
                          <StatusDot status={st} title={TECH_LABELS[st]} onClick={() => cycleTechnique(t.key)} />
                          <div onClick={() => setOpenTechs(p => ({ ...p, [t.key]: !p[t.key] }))}
                            style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: st === 2 ? C.text3 : C.text }}>{t.name}</p>
                            <span style={{ fontSize: 11, color: C.text3, marginLeft: "auto", flexShrink: 0, paddingLeft: 8 }}>
                              {st > 0 && <span style={{ marginRight: 8 }}>{fmtWhen(row)}</span>}{open ? "▾" : "▸"}
                            </span>
                          </div>
                        </div>
                        {open && (
                          <div style={{ padding: "0 1.1rem 0.9rem 3rem" }}>
                            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 6 }}>{t.desc}</p>
                            <p style={{ fontSize: 12, color: C.text3, fontStyle: "italic", lineHeight: 1.5 }}>{t.example}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ marginBottom: "2rem" }} />
          {loading && <p style={{ fontSize: 12, color: C.text3, textAlign: "center", marginBottom: "1rem" }}>Loading progress...</p>}
        </>
      )}
    </div>
  );
}

// ── COACHES VIEW ───────────────────────────────────────────────
// Admin-only: weekly coach hours + payroll with / without IVA.
// Rates (₡/hr) and per-coach IVA flags are editable inline and persisted in Supabase (coach_rates).
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
  const [receiptPaths,     setReceiptPaths]     = useState({}); // { coach: { partial, final } } paths in storage
  const [receiptUrls,      setReceiptUrls]      = useState({}); // { coach: { partial, final } } signed URLs
  const [receiptUploading, setReceiptUploading] = useState({}); // { coach: { partial, final } } bool
  const [ivaFlags,         setIvaFlags]         = useState({}); // { coachName: bool }
  const [ivaSaving,        setIvaSaving]        = useState({}); // { coachName: bool }
  // ── Roster management ──
  const [rosterOpen,   setRosterOpen]   = useState(false);
  const [rosterRows,   setRosterRows]   = useState([]);   // full coach_rates rows
  const [rosterSaving, setRosterSaving] = useState(false);
  const [addForm,      setAddForm]      = useState({ name: "", email: "", color: "#e6c229", rate: "", iva: false });

  const VALID_COACHES = getCoachNames();
  const IVA      = IVA_RATE;
  const sym      = "₡";
  const fmtMoney = n => n < 0
    ? `-₡${Math.round(-n).toLocaleString("es-CR")}`
    : `₡${Math.round(n).toLocaleString("es-CR")}`;

  // ── Load rates + iva from Supabase ───────────────────────────────
  useEffect(() => {
    supabase.from("coach_rates").select("coach_name, rate, iva, email, color, active")
      .then(({ data, error: e }) => {
        if (!e && data) {
          setRosterRows(data);
          const rMap = {}, iMap = {};
          data.forEach(r => {
            rMap[r.coach_name] = r.rate;
            iMap[r.coach_name] = r.iva ?? true;
          });
          setRates(rMap);
          setRateInputs(rMap);
          setIvaFlags(iMap);
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

  const MONTH_NAMES = MONTHS_LONG;

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
    return data.filter(ev => ev.coach?.trim() && VALID_COACHES.includes(ev.coach.trim()));
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
    setReceiptPaths({}); setReceiptUrls({});
    const { start, end } = getMonthBounds(offset);
    const ym = yearMonthKey(offset);
    try {
      const [evs, { data: saved }] = await Promise.all([
        fetchEvents(start, end),
        supabase.from("coach_monthly_hours")
          .select("coach_name, hours, partial_payment, partial_payment_date, final_payment, final_payment_date, partial_receipt_path, final_receipt_path")
          .eq("year_month", ym),
      ]);
      if (reqId !== monthReqRef.current) return;
      setMonthEvents(evs);
      if (saved?.length) {
        const hoursMap = {}, partMap = {}, finalMap = {}, rpMap = {};
        saved.forEach(r => {
          hoursMap[r.coach_name] = r.hours;
          partMap[r.coach_name]  = { amount: r.partial_payment ?? "", date: r.partial_payment_date ?? "" };
          finalMap[r.coach_name] = { amount: r.final_payment   ?? "", date: r.final_payment_date   ?? "" };
          rpMap[r.coach_name]    = { partial: r.partial_receipt_path || null, final: r.final_receipt_path || null };
        });
        setSavedMonthly(hoursMap);
        setPartialInputs(partMap);
        setFinalInputs(finalMap);
        setMonthSaved(true);
        setReceiptPaths(rpMap);
        // Generar signed URLs para comprobantes existentes
        const urlMap = {};
        await Promise.all(Object.entries(rpMap).map(async ([coach, { partial, final }]) => {
          urlMap[coach] = { partial: null, final: null };
          if (partial) {
            const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(partial, 3600);
            urlMap[coach].partial = data?.signedUrl || null;
          }
          if (final) {
            const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(final, 3600);
            urlMap[coach].final = data?.signedUrl || null;
          }
        }));
        if (reqId !== monthReqRef.current) return;
        setReceiptUrls(urlMap);
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

  const handleIvaToggle = async (coach) => {
    const next = !(ivaFlags[coach] ?? true);
    setIvaFlags(prev => ({ ...prev, [coach]: next }));
    setIvaSaving(prev => ({ ...prev, [coach]: true }));
    await supabase.from("coach_rates").upsert(
      { coach_name: coach, iva: next, updated_at: new Date().toISOString() },
      { onConflict: "coach_name" }
    );
    setIvaSaving(prev => ({ ...prev, [coach]: false }));
  };

  // ── Roster management ─────────────────────────────────────────────
  const saveNewCoach = async () => {
    const name  = addForm.name.trim();
    const email = addForm.email.trim().toLowerCase();
    if (!name) return toast("Name is required");
    if (!/^[a-z0-9._-]+@dilo\.club$/.test(email)) return toast("Email must end in @dilo.club");
    if (email.split("@")[0] !== name.toLowerCase())
      return toast(`Name must match the email prefix (${email.split("@")[0]} → ${email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)})`);
    setRosterSaving(true);
    const row = { coach_name: name, email, color: addForm.color, rate: parseFloat(addForm.rate) || 0,
      iva: addForm.iva, active: true, updated_at: new Date().toISOString() };
    const { error: e } = await supabase.from("coach_rates").upsert(row, { onConflict: "coach_name" });
    if (e) toast("Could not save: " + e.message);
    else {
      toast(`${name} added to roster`);
      setAddForm({ name: "", email: "", color: "#e6c229", rate: "", iva: false });
      setRosterRows(prev => [...prev.filter(r => r.coach_name !== name), row].sort((a, b) => a.coach_name.localeCompare(b.coach_name)));
      setRates(prev => ({ ...prev, [name]: row.rate }));
      setRateInputs(prev => ({ ...prev, [name]: String(row.rate) }));
      setIvaFlags(prev => ({ ...prev, [name]: row.iva }));
      await loadCoachRoster();
    }
    setRosterSaving(false);
  };

  const updateRosterField = async (coach, field, value) => {
    setRosterRows(prev => prev.map(r => r.coach_name === coach ? { ...r, [field]: value } : r));
    const { error: e } = await supabase.from("coach_rates")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("coach_name", coach);
    if (e) toast("Could not save: " + e.message);
    else await loadCoachRoster();
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
  // Funciona independientemente de "Save Summary": siempre incluye las horas
  // para que el upsert pueda hacer INSERT si la fila no existe todavía.
  const savePayments = async (coach, currentRows) => {
    setPaymentSaving(prev => ({ ...prev, [coach]: true }));
    const ym  = yearMonthKey(monthOffset);
    const hrs = currentRows.find(r => r.coach === coach)?.classes || 0;
    const p   = partialInputs[coach] || {};
    const f   = finalInputs[coach]   || {};
    try {
      const { error } = await supabase.from("coach_monthly_hours").upsert(
        {
          coach_name: coach, year_month: ym, hours: hrs,
          partial_payment:      p.amount ? parseFloat(p.amount) : null,
          partial_payment_date: p.date   || null,
          final_payment:        f.amount ? parseFloat(f.amount) : null,
          final_payment_date:   f.date   || null,
        },
        { onConflict: "coach_name,year_month" }
      );
      if (error) throw error;
      // Actualizar savedMonthly para que el banner refleje el estado guardado
      setSavedMonthly(prev => ({ ...prev, [coach]: hrs }));
      setMonthSaved(true);
    } catch (e) {
      console.error("[savePayments]", coach, e.message);
      setError(`Could not save payment for ${coach}: ${e.message}`);
    }
    setPaymentSaving(prev => ({ ...prev, [coach]: false }));
  };

  // ── Upload receipt image to Supabase Storage ─────────────────────
  const uploadReceipt = async (coach, type, file) => {
    setReceiptUploading(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: true } }));
    const ext  = file.name.split(".").pop().toLowerCase() || "jpg";
    const path = `${coach}/${yearMonthKey(monthOffset)}/${type}.${ext}`;
    const col  = type === "partial" ? "partial_receipt_path" : "final_receipt_path";
    try {
      const { error: upErr } = await supabase.storage
        .from("payment-receipts").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const hrs = (monthEvents || []).filter(ev => ev.coach?.trim() === coach).length;
      const { error: dbErr } = await supabase.from("coach_monthly_hours").upsert(
        { coach_name: coach, year_month: yearMonthKey(monthOffset), hours: hrs, [col]: path },
        { onConflict: "coach_name,year_month" }
      );
      if (dbErr) throw dbErr;
      const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(path, 3600);
      setReceiptPaths(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: path } }));
      setReceiptUrls(prev  => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: data?.signedUrl||null } }));
    } catch (e) {
      console.error("[uploadReceipt]", e.message);
      setError(`Could not upload receipt for ${coach}: ${e.message}`);
    }
    setReceiptUploading(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: false } }));
  };

  // ── Delete receipt from Storage + DB ─────────────────────────────
  const deleteReceipt = async (coach, type) => {
    const path = receiptPaths[coach]?.[type];
    if (!path) return;
    const col = type === "partial" ? "partial_receipt_path" : "final_receipt_path";
    await supabase.storage.from("payment-receipts").remove([path]);
    await supabase.from("coach_monthly_hours")
      .update({ [col]: null })
      .eq("coach_name", coach).eq("year_month", yearMonthKey(monthOffset));
    setReceiptPaths(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: null } }));
    setReceiptUrls(prev  => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: null } }));
  };

  // ── Aggregate events → rows ───────────────────────────────────────
  // Quincenas: Q1 = día 1–15 (inclusive) · Q2 = día 16–fin de mes
  const buildRows = (evs) => {
    const byCoach = {};
    (evs || []).forEach(ev => {
      const c = ev.coach.trim();
      if (!byCoach[c]) byCoach[c] = { total: 0, q1: 0, q2: 0 };
      byCoach[c].total++;
      if (toCRDate(ev.start).getDate() <= 15) byCoach[c].q1++; else byCoach[c].q2++;
    });
    return Object.entries(byCoach)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([coach, { total: classes, q1, q2 }]) => {
        const rate    = rates[coach] || 0;
        const hasIva  = ivaFlags[coach] ?? true;
        const amt     = n => { const net = n * rate; return net + (hasIva ? net * IVA : 0); };
        const net     = classes * rate;
        const iva     = hasIva ? net * IVA : 0;
        return { coach, classes, q1, q2, rate, net, iva, hasIva,
          total: net + iva, dueQ1: amt(q1), dueQ2: amt(q2) };
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
      ? ["Coach","Hrs 1–15","Due 1–15","Pay 1–15","Date","Hrs 16–31","Due 16–31","Pay 16–31","Date","Total","Pending"]
      : ["Coach","Hrs","Rate / hr","Net","VAT 2%","Total"];
    const colWidths = monthMode
      ? [null, 52, 95, 85, 115, 52, 95, 85, 115, 110, 100]
      : [null, 50, 100, 100, 80, 110];
    return(
    rows.length === 0
      ? <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 13 }}>{emptyMsg}</p>
        </div>
      : <>
          <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: monthMode ? 1150 : 580 }}>
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
                  const pending  = r.total - partial - final_;
                  const isPaid   = r.total > 0 && pending === 0;
                  return (
                  <tr key={r.coach} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 700, color: C.text,
                      position: "sticky", left: 0, background: C.surface2, whiteSpace: "nowrap" }}>
                      {r.coach.split(" ")[0]}
                    </td>
                    {!monthMode && <>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.classes}</td>
                    <td style={{ padding: "0.75rem 0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                        <input type="number" min="0" step="0.01"
                          value={rateInputs[r.coach] ?? ""} placeholder="0.00"
                          onChange={e => handleRateChange(r.coach, e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleRateBlur(r.coach)}
                          style={{ ...inputStyle, width: 48, minWidth: 0 }} />
                        <button onClick={() => handleRateBlur(r.coach)} disabled={ratesSaving[r.coach]}
                          style={okBtnStyle(ratesSaving[r.coach])}>
                          {ratesSaving[r.coach] ? "…" : "OK"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: r.net > 0 ? C.text : C.text3, whiteSpace: "nowrap" }}>
                      {r.net > 0 ? fmtMoney(r.net) : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", whiteSpace: "nowrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div onClick={() => !ivaSaving[r.coach] && handleIvaToggle(r.coach)}
                          style={{ width:30, height:17, borderRadius:9, flexShrink:0,
                            background: r.hasIva ? C.green : C.surface2,
                            border:`1px solid ${r.hasIva ? C.green : C.border2}`,
                            position:"relative", cursor: ivaSaving[r.coach] ? "default" : "pointer",
                            transition:"background 0.18s", opacity: ivaSaving[r.coach] ? 0.5 : 1 }}>
                          <div style={{ position:"absolute", top:2,
                            left: r.hasIva ? 14 : 2, width:11, height:11,
                            borderRadius:"50%", transition:"left 0.18s",
                            background: r.hasIva ? "#fff" : C.text3 }} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color: r.iva > 0 ? C.text2 : C.text3 }}>
                          {r.iva > 0 ? fmtMoney(r.iva) : "—"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, color: r.total > 0 ? C.green : C.text3, whiteSpace: "nowrap" }}>
                      {r.total > 0 ? fmtMoney(r.total) : "—"}
                    </td>
                    </>}
                    {monthMode && <>
                      {/* Hrs 1–15 */}
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.q1}</td>
                      {/* Due 1–15 — click para copiar al input de pago */}
                      <td onClick={() => r.dueQ1 > 0 && setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: String(Math.round(r.dueQ1)) } }))}
                        title="Click to fill payment"
                        style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                          color: r.dueQ1 > 0 ? C.text : C.text3, cursor: r.dueQ1 > 0 ? "pointer" : "default",
                          textDecoration: r.dueQ1 > 0 ? "underline dotted" : "none", textUnderlineOffset: 3 }}>
                        {r.dueQ1 > 0 ? fmtMoney(r.dueQ1) : "—"}
                      </td>
                      {/* Pay 1–15 — monto */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                          <input type="number" min="0" step="0.01"
                            value={partialInputs[r.coach]?.amount ?? ""} placeholder="0"
                            onChange={e => setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: e.target.value } }))}
                            style={{ ...inputStyle, width: 72, minWidth: 0 }} />
                        </div>
                      </td>
                      {/* Partial Pay — fecha + 📎 + OK */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <input type="date" className="dilo-date"
                            value={partialInputs[r.coach]?.date ?? ""}
                            onChange={e => setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), date: e.target.value } }))}
                            style={{ ...inputStyle, flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                          {receiptPaths[r.coach]?.partial
                            ? <>
                                <button onClick={() => window.open(receiptUrls[r.coach]?.partial, "_blank")}
                                  title="Ver comprobante"
                                  style={{ ...okBtnStyle(false), color: C.green, borderColor: C.green+"55", padding:"0.22rem 0.4rem" }}>🖼</button>
                                <button onClick={() => deleteReceipt(r.coach, "partial")}
                                  title="Eliminar comprobante"
                                  style={{ ...okBtnStyle(false), color:"#d95f5f", borderColor:"#d95f5f44", padding:"0.22rem 0.4rem" }}>✕</button>
                              </>
                            : <label title="Subir comprobante"
                                style={{ ...okBtnStyle(receiptUploading[r.coach]?.partial), padding:"0.22rem 0.4rem", cursor:"pointer", display:"flex", alignItems:"center" }}>
                                {receiptUploading[r.coach]?.partial ? "…" : "📎"}
                                <input type="file" accept="image/*" style={{ display:"none" }}
                                  onChange={e => { if (e.target.files[0]) uploadReceipt(r.coach, "partial", e.target.files[0]); e.target.value=""; }} />
                              </label>
                          }
                          <button onClick={() => savePayments(r.coach, rows)} disabled={paymentSaving[r.coach]}
                            style={okBtnStyle(paymentSaving[r.coach])}>
                            {paymentSaving[r.coach] ? "…" : "OK"}
                          </button>
                        </div>
                      </td>
                      {/* Hrs 16–31 */}
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.q2}</td>
                      {/* Due 16–31 — click para copiar al input de pago */}
                      <td onClick={() => r.dueQ2 > 0 && setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: String(Math.round(r.dueQ2)) } }))}
                        title="Click to fill payment"
                        style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                          color: r.dueQ2 > 0 ? C.text : C.text3, cursor: r.dueQ2 > 0 ? "pointer" : "default",
                          textDecoration: r.dueQ2 > 0 ? "underline dotted" : "none", textUnderlineOffset: 3 }}>
                        {r.dueQ2 > 0 ? fmtMoney(r.dueQ2) : "—"}
                      </td>
                      {/* Pay 16–31 — monto */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                          <input type="number" min="0" step="0.01"
                            value={finalInputs[r.coach]?.amount ?? ""} placeholder="0"
                            onChange={e => setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: e.target.value } }))}
                            style={{ ...inputStyle, width: 72, minWidth: 0 }} />
                        </div>
                      </td>
                      {/* Final Pay — fecha + 📎 + OK */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <input type="date" className="dilo-date"
                            value={finalInputs[r.coach]?.date ?? ""}
                            onChange={e => setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), date: e.target.value } }))}
                            style={{ ...inputStyle, flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                          {receiptPaths[r.coach]?.final
                            ? <>
                                <button onClick={() => window.open(receiptUrls[r.coach]?.final, "_blank")}
                                  title="Ver comprobante"
                                  style={{ ...okBtnStyle(false), color: C.green, borderColor: C.green+"55", padding:"0.22rem 0.4rem" }}>🖼</button>
                                <button onClick={() => deleteReceipt(r.coach, "final")}
                                  title="Eliminar comprobante"
                                  style={{ ...okBtnStyle(false), color:"#d95f5f", borderColor:"#d95f5f44", padding:"0.22rem 0.4rem" }}>✕</button>
                              </>
                            : <label title="Subir comprobante"
                                style={{ ...okBtnStyle(receiptUploading[r.coach]?.final), padding:"0.22rem 0.4rem", cursor:"pointer", display:"flex", alignItems:"center" }}>
                                {receiptUploading[r.coach]?.final ? "…" : "📎"}
                                <input type="file" accept="image/*" style={{ display:"none" }}
                                  onChange={e => { if (e.target.files[0]) uploadReceipt(r.coach, "final", e.target.files[0]); e.target.value=""; }} />
                              </label>
                          }
                          <button onClick={() => savePayments(r.coach, rows)} disabled={paymentSaving[r.coach]}
                            style={okBtnStyle(paymentSaving[r.coach])}>
                            {paymentSaving[r.coach] ? "…" : "OK"}
                          </button>
                        </div>
                      </td>
                      {/* Total mes (incluye IVA si aplica) */}
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, color: r.total > 0 ? C.green : C.text3, whiteSpace: "nowrap" }}>
                        {r.total > 0 ? fmtMoney(r.total) : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap",
                        color: isPaid ? C.green : pending < 0 ? C.amber : "#d95f5f" }}>
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
                    return s + (r.total - p - f);
                  }, 0);
                  const allPaid = tTotal > 0 && tPending === 0;
                  return (
                  <tr style={{ borderTop: `1px solid ${C.border2}`, background: C.surface2 }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 11, fontWeight: 800, color: C.text2, letterSpacing: "0.08em", textTransform: "uppercase", position: "sticky", left: 0, background: C.surface2 }}>Total</td>
                    {!monthMode && <>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{totalHrs} hrs</td>
                    <td />
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tNet > 0 ? fmtMoney(tNet) : "—"}</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text2, whiteSpace: "nowrap" }}>{tIva > 0 ? fmtMoney(tIva) : "—"}</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 15, fontWeight: 900, color: C.green, whiteSpace: "nowrap" }}>{tTotal > 0 ? fmtMoney(tTotal) : "—"}</td>
                    </>}
                    {monthMode && (() => {
                      const tQ1    = rows.reduce((s, r) => s + r.q1, 0);
                      const tQ2    = rows.reduce((s, r) => s + r.q2, 0);
                      const tDueQ1 = rows.reduce((s, r) => s + r.dueQ1, 0);
                      const tDueQ2 = rows.reduce((s, r) => s + r.dueQ2, 0);
                      return <>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{tQ1}</td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tDueQ1 > 0 ? fmtMoney(tDueQ1) : "—"}</td>
                      <td /><td />
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{tQ2}</td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tDueQ2 > 0 ? fmtMoney(tDueQ2) : "—"}</td>
                      <td /><td />
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 15, fontWeight: 900, color: C.green, whiteSpace: "nowrap" }}>{tTotal > 0 ? fmtMoney(tTotal) : "—"}</td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, whiteSpace: "nowrap",
                        color: allPaid ? C.green : tPending < 0 ? C.amber : "#d95f5f" }}>
                        {tTotal > 0 ? (allPaid ? "✓ 0" : fmtMoney(tPending)) : "—"}
                      </td>
                      </>;
                    })()}
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
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 700, flex: 1, textAlign: "center" }}>
            Week {weekNum} · {fmtDate(wStart)} – {fmtDate(wEnd)}, {wEnd.getFullYear()}
          </span>
          <button onClick={() => { const o = weekOffset + 1; setWeekOffset(o); loadWeek(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
        </div>

        {loading && <div style={{ ...CARD, padding: "3rem", display:"flex", justifyContent:"center" }}><Dots /></div>}
        {!loading && error && <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && weekEvents !== null &&
          PayrollTable({ rows: weekRows, totalHrs: totalWeekHrs, emptyMsg: "No classes this week." })}
      </>}

      {/* ══ MES ══ */}
      {tab === "month" && <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button onClick={() => { const o = monthOffset - 1; setMonthOffset(o); loadMonth(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 700, flex: 1, textAlign: "center" }}>
            {MONTH_NAMES[mMonth]} {mYear}
          </span>
          <button onClick={() => { const o = monthOffset + 1; setMonthOffset(o); loadMonth(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
        </div>

        {loading && <div style={{ ...CARD, padding: "3rem", display:"flex", justifyContent:"center" }}><Dots /></div>}
        {!loading && error && <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && monthEvents !== null &&
          PayrollTable({ rows: monthRows, totalHrs: totalMonthHrs, emptyMsg: "No classes this month.", monthMode: true })}
      </>}

      {/* ══ COACH ROSTER ══ */}
      <div style={{ ...CARD, borderRadius: 14, marginTop: "1.5rem", overflow: "hidden" }}>
        <div onClick={() => setRosterOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.1rem", cursor: "pointer" }}>
          <span style={{ fontSize: 13, color: C.text3, width: 14 }}>{rosterOpen ? "▾" : "▸"}</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "0.04em" }}>Coach Roster</p>
          <p style={{ fontSize: 11, color: C.text3, marginLeft: "auto" }}>
            {rosterRows.filter(r => r.active !== false).length} active
          </p>
        </div>
        {rosterOpen && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {rosterRows.map((r, i) => (
              <div key={r.coach_name} style={{ display: "flex", alignItems: "center", gap: "0.8rem",
                padding: "0.6rem 1.1rem", borderBottom: `1px solid ${C.border}`,
                opacity: r.active === false ? 0.45 : 1 }}>
                <input type="color" value={r.color || "#9e9e9e"}
                  onChange={e => updateRosterField(r.coach_name, "color", e.target.value)}
                  title="Coach color"
                  style={{ width: 26, height: 26, padding: 0, border: "none", borderRadius: 6,
                    background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 70 }}>{r.coach_name}</p>
                <p style={{ fontSize: 11, color: C.text3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.email || `${r.coach_name.toLowerCase()}@dilo.club`}
                </p>
                <div onClick={() => updateRosterField(r.coach_name, "active", !(r.active !== false))}
                  title={r.active !== false ? "Deactivate coach" : "Reactivate coach"}
                  style={{ width: 30, height: 17, borderRadius: 9, flexShrink: 0,
                    background: r.active !== false ? C.green : C.surface2,
                    border: `1px solid ${r.active !== false ? C.green : C.border2}`,
                    position: "relative", cursor: "pointer", transition: "background 0.18s" }}>
                  <div style={{ position: "absolute", top: 2, left: r.active !== false ? 14 : 2,
                    width: 11, height: 11, borderRadius: "50%", transition: "left 0.18s",
                    background: r.active !== false ? "#fff" : C.text3 }} />
                </div>
              </div>
            ))}
            {/* Add coach form */}
            <div style={{ padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <input type="color" value={addForm.color}
                onChange={e => setAddForm(f => ({ ...f, color: e.target.value }))}
                title="Coach color"
                style={{ width: 26, height: 26, padding: 0, border: "none", borderRadius: 6,
                  background: "transparent", cursor: "pointer", flexShrink: 0 }} />
              <input placeholder="Name (e.g. Jose)" value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                style={{ ...inputStyle, width: 110 }} />
              <input placeholder="name@dilo.club" value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                style={{ ...inputStyle, width: 150 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11, color: C.text3 }}>{sym}</span>
                <input type="number" min="0" placeholder="Rate" value={addForm.rate}
                  onChange={e => setAddForm(f => ({ ...f, rate: e.target.value }))}
                  style={{ ...inputStyle, width: 64 }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.text3, cursor: "pointer" }}>
                <input type="checkbox" checked={addForm.iva}
                  onChange={e => setAddForm(f => ({ ...f, iva: e.target.checked }))} />
                VAT
              </label>
              <button onClick={saveNewCoach} disabled={rosterSaving}
                style={{ ...okBtnStyle(rosterSaving), padding: "0.35rem 0.8rem" }}>
                {rosterSaving ? "…" : "+ Add Coach"}
              </button>
            </div>
            <p style={{ fontSize: 10, color: C.text3, padding: "0 1.1rem 0.9rem", lineHeight: 1.5 }}>
              The coach must already have a Teams account (name@dilo.club) and a Dilo App account.
              The name must match the email prefix. Deactivating hides a coach from all views without deleting payroll history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CASHIER VIEW ───────────────────────────────────────────────
function CashierView() {
  const [links,        setLinks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [createModal,  setCreateModal]  = useState(false);
  const [copied,       setCopied]       = useState(null);
  const [form,         setForm]         = useState({ description: "", customerName: "", amount: "", currency: "CRC", notes: "" });
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState(null);

  // Embedded charge
  const sdkRef                           = useRef(null);
  const [chargeModal,  setChargeModal]  = useState(false);
  const [chargeForm,   setChargeForm]   = useState({ description: "", customerName: "", amount: "", currency: "CRC" });
  const [chargeStep,   setChargeStep]   = useState("form"); // "form" | "sdk"
  const [chargeIntent, setChargeIntent] = useState(null);
  const [charging,     setCharging]     = useState(false);
  const [chargeError,  setChargeError]  = useState(null);
  const [chargeDone,   setChargeDone]   = useState(false);

  const loadLinks = async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_links").select("*").order("created_at", { ascending: false });
    setLinks(data || []);
    setLoading(false);
  };
  useEffect(() => { loadLinks(); }, []);

  const createLink = async () => {
    if (!form.description || !form.amount) return;
    setCreating(true); setCreateError(null);
    try {
      const res  = await fetch(CASHIER_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description, amount: parseInt(form.amount), currency: form.currency, customerName: form.customerName || null, notes: form.notes || null }),
      });
      const data = await res.json();
      if (data.error) { setCreateError(data.error); return; }
      setCreateModal(false);
      setForm({ description: "", customerName: "", amount: "", currency: "CRC", notes: "" });
      loadLinks();
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link.onvo_url);
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const cancelLink = async (id) => {
    await supabase.from("payment_links").update({ status: "cancelled" }).eq("id", id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: "cancelled" } : l));
  };

  const openChargeModal = () => {
    setChargeForm({ description: "", customerName: "", amount: "", currency: "CRC" });
    setChargeStep("form"); setChargeIntent(null); setChargeError(null); setChargeDone(false);
    setChargeModal(true);
  };

  const initCharge = async () => {
    if (!chargeForm.description || !chargeForm.amount) { setChargeError("Description and amount are required."); return; }
    setCharging(true); setChargeError(null);
    try {
      const res  = await fetch(CASHIER_INTENT_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ description: chargeForm.description, amount: parseInt(chargeForm.amount), currency: chargeForm.currency }),
      });
      const data = await res.json();
      if (data.error) { setChargeError(data.error); return; }
      setChargeIntent(data.id);
      setChargeStep("sdk");
    } catch (e) {
      setChargeError(e.message);
    } finally {
      setCharging(false);
    }
  };

  // Render ONVO SDK once intent is ready and container is mounted
  useEffect(() => {
    if (chargeStep !== "sdk" || !chargeIntent || !sdkRef.current) return;
    if (!window.onvo) { setChargeError("ONVO SDK not loaded."); return; }
    sdkRef.current.innerHTML = "";
    window.onvo.pay({
      publicKey:       ONVO_PUBLIC_KEY,
      paymentIntentId: chargeIntent,
      paymentType:     "one_time",
      locale:          "es",
      onSuccess: async () => {
        await supabase.from("payment_links").insert({
          description:     chargeForm.description,
          amount:          parseInt(chargeForm.amount),
          currency:        chargeForm.currency,
          customer_name:   chargeForm.customerName || null,
          onvo_session_id: chargeIntent,
          status:          "paid",
          paid_at:         new Date().toISOString(),
        });
        setChargeDone(true);
        loadLinks();
      },
      onError: (err) => {
        setChargeError(typeof err === "string" ? err : (err?.message ?? "Payment failed."));
      },
    }).render(sdkRef.current);
  }, [chargeStep, chargeIntent]);

  const fmtAmt = (amount, currency) =>
    currency === "USD" ? `$${(amount / 100).toFixed(2)}` : `₡${Number(amount).toLocaleString("es-CR")}`;

  const fmtD = (d) => d ? new Date(d).toLocaleDateString("es-CR", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const now        = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  const paidLinks    = links.filter(l => l.status === "paid");
  const pendingLinks = links.filter(l => l.status === "pending");
  const paidMonth    = paidLinks.filter(l => l.paid_at >= monthStart);
  const collCRC = paidMonth.filter(l => l.currency === "CRC").reduce((s, l) => s + l.amount, 0);
  const collUSD = paidMonth.filter(l => l.currency === "USD").reduce((s, l) => s + l.amount / 100, 0);

  const visible = filterStatus === "pending"  ? pendingLinks
                : filterStatus === "paid"     ? paidLinks
                : links.filter(l => l.status !== "cancelled");

  const STATUS_C = { pending: C.amber, paid: C.green, cancelled: C.text3 };
  const STATUS_L = { pending: "Pending", paid: "Paid", cancelled: "Cancelled" };

  const inputStyle = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" };

  return (
    <div style={{ width: "100%", maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>Cashier</p>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Payment links via OnvoyPay</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={openChargeModal}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Charge
          </button>
          <button onClick={() => setCreateModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.text, color: C.bg2, border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Collected CRC", value: `₡${collCRC.toLocaleString("es-CR")}`, sub: "This month" },
          { label: "Collected USD", value: `$${collUSD.toFixed(2)}`,               sub: "This month" },
          { label: "Pending",       value: pendingLinks.length, sub: "Awaiting payment", accent: pendingLinks.length > 0 ? C.amber : undefined },
          { label: "Total paid",    value: paidLinks.length,   sub: "All time",          accent: C.green },
        ].map((s, i) => (
          <div key={i} style={{ ...CARD, borderRadius: 14, padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.4rem" }}>{s.label}</p>
            <p style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: s.accent || C.text, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {[["all","All"], ["pending","Pending"], ["paid","Paid"]].map(([mode, label]) => {
          const active = filterStatus === mode;
          const col    = mode === "pending" ? C.amber : mode === "paid" ? C.green : C.text2;
          return (
            <button key={mode} onClick={() => setFilterStatus(mode)}
              style={{ padding: "0.35rem 0.75rem", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${active ? col : C.border}`, background: active ? `${col}18` : "transparent", color: active ? col : C.text3, transition: "all 0.15s" }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "3rem" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ ...CARD, borderRadius: 14, padding: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.text3 }}>No payment links yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Customer / Description", "Amount", "Status", "Created", "Actions"].map((h, i) => (
                  <th key={i} style={{ padding: "0.55rem 1rem", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, textAlign: i === 0 ? "left" : "center", background: C.surface2, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((link, i) => (
                <tr key={link.id} style={{ borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{link.customer_name || "—"}</p>
                    <p style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{link.description}</p>
                    {link.notes && <p style={{ fontSize: 10, color: C.text3, marginTop: 1, fontStyle: "italic" }}>{link.notes}</p>}
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmtAmt(link.amount, link.currency)}</span>
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 50, border: `1px solid ${STATUS_C[link.status]}`, color: STATUS_C[link.status], letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {STATUS_L[link.status]}
                    </span>
                    {link.paid_at && <p style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{fmtD(link.paid_at)}</p>}
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: C.text3 }}>{fmtD(link.created_at)}</p>
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      {link.onvo_url && link.status === "pending" && (
                        <button onClick={() => copyLink(link)}
                          style={{ background: copied === link.id ? `${C.green}18` : C.surface2, border: `1px solid ${copied === link.id ? C.green : C.border}`, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: copied === link.id ? C.green : C.text2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                          {copied === link.id ? "Copied!" : "Copy link"}
                        </button>
                      )}
                      {link.status === "pending" && (
                        <button onClick={() => cancelLink(link.id)}
                          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: C.text3, cursor: "pointer", fontFamily: "inherit" }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charge modal — embedded ONVO SDK */}
      {chargeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ ...CARD, borderRadius: 18, padding: "1.5rem", width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Charge</p>
                {chargeStep === "sdk" && !chargeDone && <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{chargeForm.customerName || "Customer"} · {chargeForm.currency} {parseInt(chargeForm.amount).toLocaleString("es-CR")}</p>}
              </div>
              <button onClick={() => { setChargeModal(false); setChargeStep("form"); setChargeIntent(null); setChargeDone(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, display: "flex", padding: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {chargeDone ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <p style={{ fontSize: 32, marginBottom: "0.75rem" }}>✅</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.green }}>Payment successful</p>
                <p style={{ fontSize: 13, color: C.text3, marginTop: 6 }}>Recorded in Cashier.</p>
                <button onClick={() => { setChargeModal(false); setChargeStep("form"); setChargeDone(false); }}
                  style={{ marginTop: "1.5rem", background: C.text, color: C.bg2, border: "none", borderRadius: 10, padding: "0.65rem 1.5rem", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Done
                </button>
              </div>
            ) : chargeStep === "form" ? (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={labelStyle}>Description *</p>
                  <input value={chargeForm.description} onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Mensualidad junio 2026" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={labelStyle}>Customer name</p>
                  <input value={chargeForm.customerName} onChange={e => setChargeForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Ronald Ibarra" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <p style={labelStyle}>Amount *</p>
                    <input value={chargeForm.amount} onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value.replace(/\D/g,"") }))} placeholder="50000" inputMode="numeric" style={inputStyle} />
                  </div>
                  <div>
                    <p style={labelStyle}>Currency</p>
                    <select value={chargeForm.currency} onChange={e => setChargeForm(p => ({ ...p, currency: e.target.value }))} style={inputStyle}>
                      <option value="CRC">CRC ₡</option>
                      <option value="USD">USD $</option>
                    </select>
                  </div>
                </div>
                {chargeError && <p style={{ fontSize: 12, color: C.red, marginBottom: "0.75rem" }}>{chargeError}</p>}
                <button onClick={initCharge} disabled={charging || !chargeForm.description || !chargeForm.amount}
                  style={{ width: "100%", background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "0.8rem", fontSize: 13, fontWeight: 800, cursor: (charging || !chargeForm.description || !chargeForm.amount) ? "not-allowed" : "pointer", opacity: (charging || !chargeForm.description || !chargeForm.amount) ? 0.5 : 1, fontFamily: "inherit" }}>
                  {charging ? "Preparing…" : "Continue to payment"}
                </button>
              </>
            ) : (
              <>
                {chargeError && <p style={{ fontSize: 12, color: C.red, marginBottom: "0.75rem" }}>{chargeError}</p>}
                <div ref={sdkRef} style={{ minHeight: 200 }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Create modal — defined inline to avoid focus loss on re-render */}
      {createModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ ...CARD, borderRadius: 18, padding: "1.5rem", width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>New payment link</p>
              <button onClick={() => { setCreateModal(false); setCreateError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, display: "flex", padding: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={labelStyle}>Description *</p>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Mensualidad junio 2026" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={labelStyle}>Customer name</p>
              <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Ronald Ibarra" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={labelStyle}>Notes</p>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes (optional)" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Amount *</p>
                <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value.replace(/\D/g,"") }))}
                  placeholder="50000" inputMode="numeric"
                  style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Currency</p>
                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                  style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                  <option value="CRC">CRC ₡</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
            </div>
            {createError && <p style={{ fontSize: 12, color: C.red, marginBottom: "0.75rem" }}>{createError}</p>}
            <button onClick={createLink} disabled={creating || !form.description || !form.amount}
              style={{ width: "100%", background: C.text, color: C.bg2, border: "none", borderRadius: 12, padding: "0.8rem", fontSize: 13, fontWeight: 800, cursor: (creating || !form.description || !form.amount) ? "not-allowed" : "pointer", opacity: (creating || !form.description || !form.amount) ? 0.5 : 1, fontFamily: "inherit" }}>
              {creating ? "Creating…" : "Create payment link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ATTENDANCE VIEW ────────────────────────────────────────────
// Monthly dashboard: per-student stats with 50 effective min/class baseline.
// Filterable by class subject. Coaches excluded. External students flagged.
function AttendanceView() {
  const now = new Date();

  const getMonday = (d) => {
    const dt = new Date(d); dt.setHours(12, 0, 0, 0);
    const dow = dt.getDay();
    dt.setDate(dt.getDate() + (dow === 0 ? -6 : 1 - dow));
    return dt.toISOString().split("T")[0];
  };

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(() => getMonday(now));
  const [filterMode, setFilterMode] = useState("all"); // "all" | "pending" | "imported" | "omitted"

  // Calendar
  const [calSessions,    setCalSessions]    = useState([]);
  const [attendedIds,    setAttendedIds]    = useState(new Set());
  const [omittedIds,     setOmittedIds]     = useState(new Set());
  const [omittedReasons, setOmittedReasons] = useState({});
  const [loadingCal,     setLoadingCal]     = useState(true);

  // Session detail
  const [detailSession,   setDetailSession]   = useState(null);
  const [detailAttendees, setDetailAttendees] = useState([]);
  const [detailCoaches,   setDetailCoaches]   = useState([]);
  const [loadingDetail,   setLoadingDetail]   = useState(false);

  // Student search
  const [studentSearch,  setStudentSearch]  = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [loadingSearch,  setLoadingSearch]  = useState(false);

  // Import
  const fileRef                             = useRef(null);
  const [importModal,   setImportModal]     = useState(false);
  const [importData,    setImportData]      = useState(null);
  const [importSession, setImportSession]   = useState(null);
  const [matchOptions,  setMatchOptions]    = useState([]);
  const [importing,     setImporting]       = useState(false);
  const [importError,   setImportError]     = useState(null);

  // Omit
  const [omitModal,   setOmitModal]   = useState(false);
  const [omitSession, setOmitSession] = useState(null);
  const [omitReason,  setOmitReason]  = useState("");
  const [omitting,    setOmitting]    = useState(false);
  const [omitError,   setOmitError]   = useState(null);

  const MONTHS = MONTHS_SHORT;

  const rateColor = r => r >= 80 ? C.green : r >= 50 ? C.amber : C.red;

  // ── Period navigation ─────────────────────────────────────────
  const pStart = (y, m) => `${y}-${String(m).padStart(2,'0')}-01`;
  const pEnd   = (y, m) => `${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}`;

  const changePeriod = (y, m) => {
    const newMonday = getMonday(new Date(y, m - 1, 1));
    setYear(y); setMonth(m); setDetailSession(null);
    setWeekStart(newMonday);
    loadCalendar(y, m);
  };
  const prevMonth  = () => { const d = new Date(year, month-2); changePeriod(d.getFullYear(), d.getMonth()+1); };
  const nextMonth  = () => { const d = new Date(year, month);   if (d > now) return; changePeriod(d.getFullYear(), d.getMonth()+1); };
  const atCurrent  = year === now.getFullYear() && month === now.getMonth()+1;

  const shiftWeek = (n) => {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + n * 7);
    const newStart = d.toISOString().split("T")[0];
    setWeekStart(newStart);
    const wY = d.getFullYear(), wM = d.getMonth() + 1;
    if (wY !== year || wM !== month) { setYear(wY); setMonth(wM); loadCalendar(wY, wM); }
  };

  // ── Load calendar from Supabase ───────────────────────────────
  const loadCalendar = async (y, m) => {
    setLoadingCal(true);
    const start = pStart(y, m);
    const end   = pEnd(y, m);
    const { data: sess } = await supabase
      .from("class_sessions")
      .select("id, class_title, coach, class_date, class_time")
      .gte("class_date", start).lte("class_date", end)
      .order("class_date").order("class_time");
    const allSessions = sess || [];
    setCalSessions(allSessions);
    if (allSessions.length) {
      const ids = allSessions.map(s => s.id);
      const [{ data: att }, { data: omit }] = await Promise.all([
        supabase.from("session_attendance").select("class_session_id").in("class_session_id", ids),
        supabase.from("session_omissions").select("class_session_id, reason").in("class_session_id", ids),
      ]);
      setAttendedIds(new Set((att || []).map(a => a.class_session_id)));
      setOmittedIds(new Set((omit || []).map(o => o.class_session_id)));
      setOmittedReasons(Object.fromEntries((omit || []).map(o => [o.class_session_id, o.reason])));
    } else {
      setAttendedIds(new Set());
      setOmittedIds(new Set());
      setOmittedReasons({});
    }
    setLoadingCal(false);
  };

  // ── Load single session detail ────────────────────────────────
  const loadSessionDetail = async (session) => {
    setDetailSession(session);
    setLoadingDetail(true);
    const { data } = await supabase
      .from("session_attendance")
      .select("student_name, duration_seconds, is_coach, coach_name, join_time, leave_time")
      .eq("class_session_id", session.id);
    setDetailAttendees((data || []).filter(a => !a.is_coach));
    setDetailCoaches((data || []).filter(a =>  a.is_coach));
    setLoadingDetail(false);
  };

  useEffect(() => { loadCalendar(year, month); }, []);

  const searchStudent = async (name) => {
    if (!name || name.length < 2) { setStudentResults([]); return; }
    setLoadingSearch(true);
    const ids = calSessions.map(s => s.id);
    if (!ids.length) { setStudentResults([]); setLoadingSearch(false); return; }
    const { data } = await supabase
      .from("session_attendance")
      .select("student_name, join_time, leave_time, duration_seconds, is_coach, class_session_id")
      .ilike("student_name", `%${name}%`)
      .in("class_session_id", ids);
    const sessMap = Object.fromEntries(calSessions.map(s => [s.id, s]));
    setStudentResults(
      (data || [])
        .map(r => ({ ...r, session: sessMap[r.class_session_id] }))
        .filter(r => r.session)
        .sort((a, b) => (a.session.class_date || "").localeCompare(b.session.class_date || ""))
    );
    setLoadingSearch(false);
  };

  useEffect(() => {
    const t = setTimeout(() => searchStudent(studentSearch), 350);
    return () => clearTimeout(t);
  }, [studentSearch, calSessions]);

  // ── CSV helpers ───────────────────────────────────────────────
  const teamsDate = str => {
    if (!str) return null;
    const [datePart] = str.trim().split(/[,\s]/);
    const [m, d, y]  = (datePart || "").split("/");
    if (!m || !d || !y) return null;
    return `${y.length === 2 ? "20"+y : y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  };

  const parseDurSecs = str => {
    if (!str) return 0;
    const mt = str.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/);
    return (parseInt(mt?.[1]||0)*3600) + (parseInt(mt?.[2]||0)*60) + parseInt(mt?.[3]||0);
  };

  const handleFileChange = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const text  = await file.text();
    const lines = text.split(/\r?\n/);

    // Scan first 20 lines to detect delimiter reliably
    const sample   = lines.slice(0, 20).join("\n");
    const tabCount = (sample.match(/\t/g) || []).length;
    const delim    = tabCount > 3 ? "\t" : ",";
    const rows     = lines.map(l => l.split(delim).map(c => c.replace(/^"|"$/g, "").trim()));

    // Search for class name in any row with "title" or "meeting"
    const titleRow  = rows.find(r => /meeting.*title|^title/i.test(r[0]));
    const className = titleRow?.[1] || rows[1]?.[1] || "";

    // Search for meeting date
    const dateRow  = rows.find(r => /start time|meeting.*date/i.test(r[0]));
    const meetDate = teamsDate(dateRow?.[1] || "");

    // Must match "2. Participants" section header specifically — not "Attended participants" in Summary
    const partIdx = rows.findIndex(r =>
      /^\d+\.\s*participants/i.test(r[0]?.trim() || "")
    );

    if (partIdx === -1 || !className) {
      const hint = !className
        ? `No se encontró el nombre de la clase (fila con "Meeting title:"). Fila 2: "${rows[1]?.join(" | ")}"`
        : `No se encontró la sección "2. Participants". Revisá el archivo.`;
      setImportError(`Formato no reconocido — ${hint}`);
      setImportData(null); setImportModal(true); return;
    }

    // Skip "2. Participants" header + column-header row; stop at next numbered section (e.g. "3. In-Meeting Activities")
    const slice   = rows.slice(partIdx + 2);
    const stopAt  = slice.findIndex(r => /^\d+\./.test(r[0]?.trim() || ""));
    const rawRows = (stopAt === -1 ? slice : slice.slice(0, stopAt)).filter(r => r[0]?.trim());

    // @dilo.club email = coach/staff; prefer Presenter over Organizer (room account)
    const isCoachRow = p => /dilo\.club/i.test(p.email || "");

    const participants = rawRows.map(r => ({
      name: r[0]?.trim(), joinTime: r[1]?.trim(), leaveTime: r[2]?.trim(),
      duration: r[3]?.trim(), durationSecs: parseDurSecs(r[3]?.trim()),
      email: r[4]?.trim(), role: r[6]?.trim(),
    })).filter(p => p.name && !/^name$/i.test(p.name));

    // Pick Presenter @dilo.club first (human coach), fall back to any @dilo.club (room Organizer)
    const coachRow = participants.find(p => isCoachRow(p) && /presenter/i.test(p.role || ""))
                  || participants.find(isCoachRow);
    const students = participants.filter(p => !isCoachRow(p));

    const classKey   = className.split(" - ")[0]; // e.g. "A1"
    const coachFirst = coachRow?.name?.split(/\s+/)[0] || ""; // e.g. "Gabriela"
    const sessionSelect = "id, class_title, coach, class_date, class_time";

    // Extract student-specific token from end of class title ("A1 - Your English Class Ronald" → "Ronald")
    const classWords   = className.trim().split(/\s+/);
    const studentHint  = classWords[classWords.length - 1] || "";
    const useStudentHint = studentHint.length > 2 &&
      !/^(class|english|your|club|meeting|session|inc|sa)$/i.test(studentHint);

    // Evening classes in Costa Rica (UTC-6) may be stored as next-day UTC in Supabase
    const crDatePlusOne = (() => {
      const d = new Date(meetDate + "T00:00:00");
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })();
    const dateCandidates = [meetDate, crDatePlusOne];

    const byProximity = (arr) =>
      [...(arr || [])].sort((a, b) => {
        // Treat meetDate and crDatePlusOne as equally close (same CR day)
        const distA = dateCandidates.includes(a.class_date) ? 0 : Math.abs(new Date(a.class_date) - new Date(meetDate));
        const distB = dateCandidates.includes(b.class_date) ? 0 : Math.abs(new Date(b.class_date) - new Date(meetDate));
        return distA - distB;
      });

    // 1. Exact: class + student name + coach + date (studentHint disambiguates multiple classes same level/coach/date)
    let options = [];
    if (useStudentHint) {
      let qb = supabase.from("class_sessions").select(sessionSelect)
        .ilike("class_title", `%${classKey}%`)
        .ilike("class_title", `%${studentHint}%`)
        .in("class_date", dateCandidates);
      if (coachFirst) qb = qb.ilike("coach", `%${coachFirst}%`);
      const { data } = await qb.limit(5);
      options = data || [];
    }

    // 1b. Class + coach + date (no student hint — for older sessions without student name in title)
    if (!options.length) {
      let qb = supabase.from("class_sessions").select(sessionSelect)
        .ilike("class_title", `%${classKey}%`)
        .in("class_date", dateCandidates);
      if (coachFirst) qb = qb.ilike("coach", `%${coachFirst}%`);
      const { data } = await qb.limit(10);
      options = data || [];
    }

    // 1c. Coach + date only — class_title format may differ between Teams and Supabase
    if (!options.length && coachFirst) {
      const { data } = await supabase.from("class_sessions")
        .select(sessionSelect)
        .ilike("coach", `%${coachFirst}%`)
        .in("class_date", dateCandidates).limit(10);
      options = data || [];
    }

    // 2. Class + student + coach, any date → sort by date proximity
    if (!options.length && coachFirst && useStudentHint) {
      let qb = supabase.from("class_sessions").select(sessionSelect)
        .ilike("class_title", `%${classKey}%`)
        .ilike("class_title", `%${studentHint}%`)
        .ilike("coach", `%${coachFirst}%`)
        .order("class_date", { ascending: false }).limit(20);
      const { data } = await qb;
      options = byProximity(data);
    }

    // 2b. Class + coach, any date → sort by date proximity
    if (!options.length && coachFirst) {
      const { data } = await supabase.from("class_sessions")
        .select(sessionSelect)
        .ilike("class_title", `%${classKey}%`)
        .ilike("coach", `%${coachFirst}%`)
        .order("class_date", { ascending: false }).limit(50);
      options = byProximity(data);
    }

    // 3. Class only, any date → sort by date proximity
    if (!options.length) {
      const { data } = await supabase.from("class_sessions")
        .select(sessionSelect)
        .ilike("class_title", `%${classKey}%`)
        .order("class_date", { ascending: false }).limit(50);
      options = byProximity(data);
    }

    // 4. Sessions within ±7 days of meetDate (last resort, sorted by proximity)
    if (!options.length) {
      const rangeStart = (() => { const d = new Date(meetDate+"T00:00:00"); d.setDate(d.getDate()-7); return d.toISOString().split("T")[0]; })();
      const rangeEnd   = (() => { const d = new Date(meetDate+"T00:00:00"); d.setDate(d.getDate()+2); return d.toISOString().split("T")[0]; })();
      const { data } = await supabase.from("class_sessions")
        .select(sessionSelect)
        .gte("class_date", rangeStart).lte("class_date", rangeEnd)
        .order("class_date", { ascending: false }).limit(100);
      options = byProximity(data || []);
    }

    // 5. Any recent session (absolute last resort)
    if (!options.length) {
      const { data } = await supabase.from("class_sessions")
        .select(sessionSelect).order("class_date", { ascending: false }).limit(50);
      options = data || [];
    }

    setImportData({ className, meetDate, coach: coachRow?.name || null, coachParticipant: coachRow || null, students, fileName: file.name });
    setMatchOptions(options);
    setImportSession(options[0]?.id || null);
    setImportError(null);
    setImportModal(true);
  };

  const confirmImport = async () => {
    if (!importSession || (!importData?.students?.length && !importData?.coachParticipant)) return;
    setImporting(true);
    await supabase.from("session_attendance").delete().eq("class_session_id", importSession);
    const records = importData.students.map(s => ({
      class_session_id: importSession,
      student_name:     s.name,
      coach_name:       importData.coach,
      duration_seconds: s.durationSecs,
      join_time:        s.joinTime  || null,
      leave_time:       s.leaveTime || null,
      is_coach:         false,
    }));
    if (importData.coachParticipant) {
      records.push({
        class_session_id: importSession,
        student_name:     importData.coachParticipant.name,
        coach_name:       importData.coachParticipant.name,
        duration_seconds: importData.coachParticipant.durationSecs,
        join_time:        importData.coachParticipant.joinTime  || null,
        leave_time:       importData.coachParticipant.leaveTime || null,
        is_coach:         true,
      });
    }
    const { error } = await supabase.from("session_attendance").insert(records);
    setImporting(false);
    if (error) { setImportError(error.message); return; }
    // Optimistic update — move session to imported immediately
    setAttendedIds(prev => new Set([...prev, importSession]));
    setImportModal(false); setImportData(null);
    loadCalendar(year, month);
    if (detailSession) loadSessionDetail(detailSession);
  };

  // ── Omit session ─────────────────────────────────────────────
  const confirmOmit = async () => {
    if (!omitSession) return;
    setOmitting(true);
    const { error } = await supabase.from("session_omissions").upsert(
      { class_session_id: omitSession.id, reason: omitReason.trim() || null },
      { onConflict: "class_session_id" }
    );
    setOmitting(false);
    if (error) { setOmitError(error.message); return; }
    setOmittedIds(prev => new Set([...prev, omitSession.id]));
    setOmittedReasons(prev => ({ ...prev, [omitSession.id]: omitReason.trim() || null }));
    setOmitModal(false); setOmitSession(null); setOmitReason(""); setOmitError(null);
  };

  const removeOmit = async (sessionId) => {
    await supabase.from("session_omissions").delete().eq("class_session_id", sessionId);
    setOmittedIds(prev => { const n = new Set(prev); n.delete(sessionId); return n; });
    setOmittedReasons(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
  };

  // ── CSV export (single session) ──────────────────────────────
  const exportCSV = () => {
    if (!detailSession) return;
    const rows = [["Clase","Fecha","Coach","Estudiante","Entrada","Salida","Duración (min)","Rol"].join(",")];
    for (const c of detailCoaches)
      rows.push([`"${detailSession.class_title}"`, detailSession.class_date, `"${detailSession.coach}"`, `"${c.student_name}"`, c.join_time||"", c.leave_time||"", Math.round((c.duration_seconds||0)/60), "Coach"].join(","));
    for (const a of detailAttendees)
      rows.push([`"${detailSession.class_title}"`, detailSession.class_date, `"${detailSession.coach}"`, `"${a.student_name}"`, a.join_time||"", a.leave_time||"", Math.round((a.duration_seconds||0)/60), "Estudiante"].join(","));
    const el = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob(["﻿"+rows.join("\n")], { type:"text/csv;charset=utf-8;" })),
      download: `asistencia_${detailSession.class_title}_${detailSession.class_date}.csv`,
    });
    el.click(); URL.revokeObjectURL(el.href);
  };

  // ── Shared components ────────────────────────────────────────
  const Dots = () => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"3rem" }}>
      {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.text3, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
    </div>
  );

  const NavBar = ({ right }) => (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.75rem" }}>
      <button onClick={prevMonth} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:"6px 8px", borderRadius:8, display:"flex", alignItems:"center" }}
        onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style={{ fontSize:15, fontWeight:700, color:C.text, minWidth:130, textAlign:"center", letterSpacing:"-0.02em" }}>{MONTHS[month-1]} {year}</span>
      <button onClick={nextMonth} disabled={atCurrent}
        style={{ background:"none", border:"none", cursor:atCurrent?"default":"pointer", color:atCurrent?C.border:C.text3, padding:"6px 8px", borderRadius:8, display:"flex", alignItems:"center" }}
        onMouseEnter={e=>{ if(!atCurrent) e.currentTarget.style.color=C.text; }}
        onMouseLeave={e=>e.currentTarget.style.color=atCurrent?C.border:C.text3}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      {right && <div style={{ marginLeft:"auto" }}>{right}</div>}
    </div>
  );

  const ImportBtn = ({ label = "Import session" }) => (
    <button onClick={()=>fileRef.current?.click()}
      style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"0.5rem 0.85rem", fontSize:12, fontWeight:700, color:C.text2, cursor:"pointer", display:"flex", alignItems:"center", gap:6, WebkitTapHighlightColor:"transparent" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
      {label}
    </button>
  );

  // ── Import modal ──────────────────────────────────────────────
  const ImportModal = () => (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:20, padding:"1.5rem", width:"100%", maxWidth:460, maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:C.text }}>Import session</h3>
          <button onClick={()=>{ setImportModal(false); setImportData(null); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:4, display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {!importData ? (
          <p style={{ fontSize:13, color:C.red, background:"rgba(194,0,0,0.08)", borderRadius:10, padding:"0.75rem 1rem" }}>{importError}</p>
        ) : (<>
          {/* Detected */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"0.85rem 1rem", marginBottom:"1rem" }}>
            <p style={{ fontSize:10, color:C.text3, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:700 }}>Clase detectada</p>
            <p style={{ fontSize:14, fontWeight:700, color:C.text }}>{importData.className}</p>
            {importData.meetDate && <p style={{ fontSize:11, color:C.text3, marginTop:2 }}>{importData.meetDate}</p>}
            {importData.coach    && <p style={{ fontSize:11, color:C.text3, marginTop:1 }}>Coach: <span style={{ color:C.text2 }}>{importData.coach}</span></p>}
          </div>

          {/* Session match */}
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>Sesión en Supabase</p>
            {matchOptions.length === 0
              ? <p style={{ fontSize:12, color:C.amber, background:"rgba(202,154,4,0.08)", borderRadius:8, padding:"0.6rem 0.75rem" }}>No se encontró una sesión coincidente en class_sessions.</p>
              : <>
                  <select value={importSession||""} onChange={e=>setImportSession(e.target.value)} style={{ ...SEL(), width:"100%" }}>
                    {matchOptions.map(s=><option key={s.id} value={s.id}>{s.class_date} · {s.class_title} · {s.coach}</option>)}
                  </select>
                  {importSession && matchOptions.find(o=>o.id===importSession)?.class_date !== importData.meetDate && (
                    <p style={{ fontSize:11, color:C.amber, marginTop:5 }}>
                      ⚠ Fecha del archivo: {importData.meetDate} — no coincide con la sesión seleccionada. Seleccioná la correcta.
                    </p>
                  )}
                </>
            }
          </div>

          {/* Coach + Students */}
          <div style={{ marginBottom:"1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>
              Asistentes ({importData.students.length + (importData.coachParticipant ? 1 : 0)})
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:220, overflowY:"auto" }}>
              {importData.coachParticipant && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(99,102,241,0.08)", border:`1px solid rgba(99,102,241,0.2)`, borderRadius:8, padding:"0.5rem 0.75rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:"#818cf8", background:"rgba(99,102,241,0.15)", borderRadius:4, padding:"1px 5px", letterSpacing:"0.04em" }}>COACH</span>
                    <p style={{ fontSize:12, color:C.text, fontWeight:600 }}>{importData.coachParticipant.name}</p>
                  </div>
                  <span style={{ fontSize:11, color:"#818cf8", fontWeight:700 }}>{Math.round(importData.coachParticipant.durationSecs/60)}m</span>
                </div>
              )}
              {importData.students.map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, borderRadius:8, padding:"0.5rem 0.75rem" }}>
                  <p style={{ fontSize:12, color:C.text, fontWeight:600 }}>{s.name}</p>
                  <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>{Math.round(s.durationSecs/60)}m</span>
                </div>
              ))}
            </div>
          </div>

          {importError && <p style={{ fontSize:12, color:C.red, marginBottom:"0.75rem" }}>{importError}</p>}

          <button onClick={confirmImport} disabled={!importSession || importing}
            style={{ width:"100%", background:C.text, color:C.bg2, border:"none", borderRadius:12, padding:"0.8rem", fontSize:13, fontWeight:800, cursor:(!importSession||importing)?"not-allowed":"pointer", opacity:(!importSession||importing)?0.5:1, fontFamily:"inherit" }}>
            {importing ? "Importing…" : (() => {
              const n = importData.students.length;
              const hasCoach = !!importData.coachParticipant;
              if (hasCoach && n === 0) return "Import coach — no-show";
              const parts = [];
              if (hasCoach) parts.push("coach");
              if (n > 0) parts.push(`${n} student${n === 1 ? "" : "s"}`);
              return `Import ${parts.join(" + ")}`;
            })()}
          </button>
        </>)}
      </div>
    </div>
  );

  // ── Shared hidden file input (always mounted) ─────────────────
  const FileInput = () => (
    <input ref={fileRef} type="file" accept=".csv,.txt,.xls,.xlsx" style={{ display:"none" }} onChange={handleFileChange} />
  );

  // ── Derived: pending = has prior attended sibling this month ─────
  const priorAttended = new Set();
  {
    const byTitle = {};
    for (const s of calSessions) {
      const k = s.class_title || s.id;
      (byTitle[k] = byTitle[k] || []).push(s);
    }
    for (const arr of Object.values(byTitle)) {
      arr.sort((a, b) => a.class_date.localeCompare(b.class_date));
      let seen = false;
      for (const s of arr) {
        if (seen && !attendedIds.has(s.id)) priorAttended.add(s.id);
        if (attendedIds.has(s.id)) seen = true;
      }
    }
  }

  const fmtTime = t => {
    if (!t) return "—";
    const m = t.match(/(\d+:\d+):\d+\s*(AM|PM)/i);
    return m ? `${m[1]} ${m[2].toUpperCase()}` : t;
  };
  const fmtMins = secs => {
    const m = Math.round((secs||0)/60);
    return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
  };
  const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("es-CR", { weekday:"short", month:"short", day:"numeric" });

  // ── SESSION DETAIL VIEW ───────────────────────────────────────
  if (detailSession) {
    const fmtDateLong = d => new Date(d + "T12:00:00").toLocaleDateString("es-CR", { weekday:"long", month:"long", day:"numeric" });
    const classHistory = [...calSessions]
      .filter(s => s.class_title === detailSession.class_title)
      .sort((a, b) => a.class_date.localeCompare(b.class_date));
    const histPrior = new Set();
    { let seen = false;
      for (const s of classHistory) {
        if (seen && !attendedIds.has(s.id)) histPrior.add(s.id);
        if (attendedIds.has(s.id)) seen = true;
      }
    }
    const ROW_STYLE = { display:"grid", gridTemplateColumns:"1fr 90px 90px 80px", gap:"0.5rem", alignItems:"center", padding:"0.6rem 1rem", borderBottom:`1px solid ${C.border}` };
    const HDR_STYLE = { fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.06em", textTransform:"uppercase" };

    return (
      <div style={{ width:"100%", maxWidth:860 }}>
        <FileInput />
        {importModal && <ImportModal />}

        {/* Back + actions */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          <button onClick={() => setDetailSession(null)}
            style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", color:C.text3, fontSize:12, fontWeight:600, padding:0, fontFamily:"inherit", WebkitTapHighlightColor:"transparent" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.text2} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            {MONTHS[month-1]} {year}
          </button>
          <span style={{ color:C.border2, userSelect:"none" }}>·</span>
          <ImportBtn label="Importar" />
          {(detailAttendees.length > 0 || detailCoaches.length > 0) && (
            <button onClick={exportCSV}
              style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"0.4rem 0.75rem", fontSize:11, fontWeight:700, color:C.text3, cursor:"pointer", fontFamily:"inherit" }}>
              CSV
            </button>
          )}
        </div>

        {/* Session header */}
        <div style={{ ...CARD, borderRadius:14, padding:"1rem 1.25rem", marginBottom:"1rem" }}>
          <p style={{ fontSize:17, fontWeight:800, color:C.text, marginBottom:3 }}>{detailSession.class_title}</p>
          <p style={{ fontSize:12, color:C.text3 }}>{fmtDateLong(detailSession.class_date)} · {detailSession.class_time}</p>
          <p style={{ fontSize:12, color:C.text3, marginTop:2 }}>{detailSession.coach}</p>
        </div>

        {/* Attendance table */}
        {loadingDetail ? <Dots /> : (detailAttendees.length === 0 && detailCoaches.length === 0) ? (
          <div style={{ ...CARD, borderRadius:14, padding:"2rem", textAlign:"center", marginBottom:"1rem" }}>
            <p style={{ fontSize:13, color:C.text3 }}>Sin datos de asistencia para esta sesión.</p>
          </div>
        ) : (
          <div style={{ ...CARD, borderRadius:14, overflow:"hidden", marginBottom:"1rem" }}>
            {/* Table header */}
            <div style={{ ...ROW_STYLE, background:C.surface2, borderBottom:`1px solid ${C.border2}` }}>
              <span style={HDR_STYLE}>Participante</span>
              <span style={{ ...HDR_STYLE, textAlign:"center" }}>Entrada</span>
              <span style={{ ...HDR_STYLE, textAlign:"center" }}>Salida</span>
              <span style={{ ...HDR_STYLE, textAlign:"right" }}>Duración</span>
            </div>
            {detailCoaches.map(c => (
              <div key={c.student_name} style={{ ...ROW_STYLE, background:"rgba(99,102,241,0.06)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
                  <span style={{ fontSize:9, fontWeight:800, color:"#818cf8", background:"rgba(99,102,241,0.15)", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>COACH</span>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.student_name}</p>
                </div>
                <p style={{ fontSize:12, color:"#818cf8", textAlign:"center" }}>{fmtTime(c.join_time)}</p>
                <p style={{ fontSize:12, color:"#818cf8", textAlign:"center" }}>{fmtTime(c.leave_time)}</p>
                <p style={{ fontSize:13, fontWeight:700, color:"#818cf8", textAlign:"right" }}>{fmtMins(c.duration_seconds)}</p>
              </div>
            ))}
            {detailAttendees.map(a => (
              <div key={a.student_name} style={ROW_STYLE}>
                <p style={{ fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.student_name}</p>
                <p style={{ fontSize:12, color:C.text3, textAlign:"center" }}>{fmtTime(a.join_time)}</p>
                <p style={{ fontSize:12, color:C.text3, textAlign:"center" }}>{fmtTime(a.leave_time)}</p>
                <p style={{ fontSize:13, fontWeight:700, color:C.green, textAlign:"right" }}>{fmtMins(a.duration_seconds)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Monthly history for this class */}
        {classHistory.length > 1 && (
          <div style={{ ...CARD, borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"0.55rem 1rem", borderBottom:`1px solid ${C.border}` }}>
              <p style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.06em", textTransform:"uppercase" }}>Historial del mes — {detailSession.class_title}</p>
            </div>
            {classHistory.map(s => {
              const isActive = s.id === detailSession.id;
              const hasAtt   = attendedIds.has(s.id);
              const hasPrior = histPrior.has(s.id);
              return (
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.6rem 1rem", borderBottom:`1px solid ${C.border}`, background: isActive ? "rgba(255,255,255,0.04)" : "transparent" }}>
                  <p style={{ fontSize:12, fontWeight: isActive ? 700 : 400, color: isActive ? C.text : C.text2, flex:1 }}>{fmtDate(s.class_date)} · {s.class_time}</p>
                  {hasAtt
                    ? <span style={{ fontSize:11, fontWeight:700, color:C.green }}>✓ Importado</span>
                    : hasPrior
                      ? <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>⚠ Pendiente</span>
                      : <span style={{ fontSize:11, color:C.text3 }}>Sin datos</span>}
                  {hasAtt && !isActive && (
                    <button onClick={() => loadSessionDetail(s)}
                      style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700, color:C.text3, cursor:"pointer", fontFamily:"inherit" }}>
                      Ver
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────
  const weekEnd = (() => {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  })();

  const weekLabel = (() => {
    const s = new Date(weekStart + "T12:00:00");
    const e = new Date(weekEnd   + "T12:00:00");
    const sf = s.toLocaleDateString("en-US", { month:"short", day:"numeric" });
    const ef = s.getMonth() === e.getMonth()
      ? e.getDate()
      : e.toLocaleDateString("en-US", { month:"short", day:"numeric" });
    return `${sf} – ${ef}`;
  })();

  const weekSessions = calSessions
    .filter(s => s.class_date >= weekStart && s.class_date <= weekEnd)
    .sort((a, b) => a.class_date.localeCompare(b.class_date) || (a.class_time||"").localeCompare(b.class_time||""));

  const pendingAll  = weekSessions.filter(s => !attendedIds.has(s.id) && !omittedIds.has(s.id));
  const importedAll = weekSessions.filter(s =>  attendedIds.has(s.id));
  const omittedAll  = weekSessions.filter(s =>  omittedIds.has(s.id));

  const visibleSessions = filterMode === "pending"  ? pendingAll
                        : filterMode === "imported" ? importedAll
                        : filterMode === "omitted"  ? omittedAll
                        : weekSessions;

  const FilterBtn = ({ mode, label, count, color }) => {
    const active = filterMode === mode;
    return (
      <button onClick={() => setFilterMode(active ? "all" : mode)}
        style={{ display:"flex", alignItems:"center", gap:5, padding:"0.35rem 0.75rem", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${active ? color : C.border}`, background: active ? `${color}18` : "transparent", color: active ? color : C.text3, transition:"all 0.15s" }}>
        {label}
        <span style={{ background: active ? color : C.surface2, color: active ? C.bg2 : C.text3, borderRadius:10, padding:"0 5px", fontSize:10, fontWeight:800, minWidth:18, textAlign:"center" }}>{count}</span>
      </button>
    );
  };

  const SessionRow = ({ s }) => {
    const attended = attendedIds.has(s.id);
    const omitted  = omittedIds.has(s.id);
    const reason   = omittedReasons[s.id];
    return (
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.7rem 1rem", borderBottom:`1px solid ${C.border}`, cursor: attended ? "pointer" : "default" }}
        onClick={() => attended && loadSessionDetail(s)}
        onMouseEnter={e=>{ if(attended) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}>
        <span style={{ fontSize:11, fontWeight:700, color: attended ? C.green : omitted ? C.text3 : C.amber, flexShrink:0, width:14, textAlign:"center" }}>
          {attended ? "✓" : omitted ? "–" : "⚠"}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color: omitted ? C.text3 : C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.class_title || "Untitled"}</p>
          <p style={{ fontSize:11, color:C.text3, marginTop:1 }}>{fmtDate(s.class_date)} · {s.class_time} · {s.coach}</p>
          {omitted && reason && <p style={{ fontSize:11, color:C.text3, marginTop:2, fontStyle:"italic" }}>"{reason}"</p>}
        </div>
        {attended ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        ) : omitted ? (
          <button onClick={e=>{ e.stopPropagation(); removeOmit(s.id); }}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:700, color:C.text3, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
            Restore
          </button>
        ) : (
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={e=>{ e.stopPropagation(); setOmitSession(s); setOmitReason(""); setOmitError(null); setOmitModal(true); }}
              style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:700, color:C.text3, cursor:"pointer", fontFamily:"inherit" }}>
              Omit
            </button>
            <button onClick={e=>{ e.stopPropagation(); fileRef.current?.click(); }}
              style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:700, color:C.text2, cursor:"pointer", fontFamily:"inherit" }}>
              Import
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width:"100%", maxWidth:720 }}>
      <FileInput />
      {importModal && <ImportModal />}
      {omitModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ ...CARD, borderRadius:18, padding:"1.5rem", width:"100%", maxWidth:440 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
              <p style={{ fontSize:15, fontWeight:800, color:C.text }}>Omit session</p>
              <button onClick={() => { setOmitModal(false); setOmitSession(null); setOmitReason(""); setOmitError(null); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, display:"flex", padding:2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {omitSession && (
              <div style={{ background:C.surface2, borderRadius:10, padding:"0.75rem 1rem", marginBottom:"1.25rem" }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{omitSession.class_title || "Untitled"}</p>
                <p style={{ fontSize:11, color:C.text3, marginTop:2 }}>{fmtDate(omitSession.class_date)} · {omitSession.class_time} · {omitSession.coach}</p>
              </div>
            )}
            <p style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.5rem" }}>Reason (optional)</p>
            <textarea value={omitReason} onChange={e => setOmitReason(e.target.value)}
              placeholder="e.g. Student cancelled, coach sick, national holiday..."
              rows={3}
              style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"0.65rem 0.75rem", fontSize:13, color:C.text, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            {omitError && <p style={{ fontSize:12, color:C.red, marginTop:"0.5rem" }}>{omitError}</p>}
            <button onClick={confirmOmit} disabled={omitting}
              style={{ width:"100%", background:C.text, color:C.bg2, border:"none", borderRadius:12, padding:"0.8rem", fontSize:13, fontWeight:800, cursor:omitting?"not-allowed":"pointer", opacity:omitting?0.5:1, fontFamily:"inherit", marginTop:"1rem" }}>
              {omitting ? "Saving…" : "Omit session"}
            </button>
          </div>
        </div>
      )}
      <NavBar right={<ImportBtn />} />

      {/* Week nav + filter buttons */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:2, background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"2px" }}>
          <button onClick={()=>shiftWeek(-1)}
            style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:"4px 8px", borderRadius:7, display:"flex", alignItems:"center" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize:12, fontWeight:700, color:C.text, padding:"0 4px", minWidth:110, textAlign:"center" }}>{weekLabel}</span>
          <button onClick={()=>shiftWeek(1)}
            style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:"4px 8px", borderRadius:7, display:"flex", alignItems:"center" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <FilterBtn mode="pending"  label="Pending"  count={pendingAll.length}  color={C.amber} />
        <FilterBtn mode="imported" label="Imported" count={importedAll.length} color={C.green} />
        <FilterBtn mode="omitted"  label="Omitted"  count={omittedAll.length}  color={C.text3} />
      </div>

      {/* Student search */}
      <div style={{ position:"relative", marginBottom:"1.25rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}
          placeholder="Search participant..."
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"0.55rem 0.75rem 0.55rem 2.25rem", fontSize:13, color:C.text, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        {studentSearch && (
          <button onClick={()=>setStudentSearch("")}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.text3, display:"flex", padding:2 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {loadingCal ? <Dots /> : studentSearch.length >= 2 ? (
        /* ── Student results ── */
        <div style={{ ...CARD, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"0.55rem 1rem", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.06em", textTransform:"uppercase" }}>
              Results for "{studentSearch}"
            </p>
            {!loadingSearch && <p style={{ fontSize:11, color:C.text3 }}>{studentResults.length} record{studentResults.length!==1?"s":""}</p>}
          </div>
          {loadingSearch ? <Dots /> : studentResults.length === 0 ? (
            <div style={{ padding:"2rem", textAlign:"center" }}>
              <p style={{ fontSize:13, color:C.text3 }}>No results for "{studentSearch}" in {MONTHS[month-1]} {year}.</p>
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 85px 85px 70px", gap:"0.5rem", padding:"0.4rem 1rem", background:C.surface2, borderBottom:`1px solid ${C.border2}` }}>
                {["Student / Class","Join","Leave","Duration"].map(h => (
                  <p key={h} style={{ fontSize:10, fontWeight:700, color:C.text3, letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</p>
                ))}
              </div>
              {studentResults.map((r, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 85px 85px 70px", gap:"0.5rem", alignItems:"center", padding:"0.65rem 1rem", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.student_name}</p>
                    <p style={{ fontSize:11, color:C.text3, marginTop:1 }}>{fmtDate(r.session.class_date)} · {r.session.class_title}</p>
                  </div>
                  <p style={{ fontSize:12, color:C.text3 }}>{fmtTime(r.join_time)}</p>
                  <p style={{ fontSize:12, color:C.text3 }}>{fmtTime(r.leave_time)}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:C.green, textAlign:"right" }}>{fmtMins(r.duration_seconds)}</p>
                </div>
              ))}
              <div style={{ padding:"0.55rem 1rem", display:"flex", justifyContent:"flex-end" }}>
                <button onClick={() => {
                  const rows = [["Student","Class","Date","Join","Leave","Duration (min)"].join(",")];
                  for (const r of studentResults)
                    rows.push([`"${r.student_name}"`,`"${r.session.class_title}"`,r.session.class_date,r.join_time||"",r.leave_time||"",Math.round((r.duration_seconds||0)/60)].join(","));
                  const el = Object.assign(document.createElement("a"),{ href:URL.createObjectURL(new Blob(["﻿"+rows.join("\n")],{type:"text/csv;charset=utf-8;"})), download:`attendance_${studentSearch}_${year}-${String(month).padStart(2,"0")}.csv` });
                  el.click(); URL.revokeObjectURL(el.href);
                }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:700, color:C.text3, cursor:"pointer", fontFamily:"inherit" }}>
                  Export CSV
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Session list ── */
        visibleSessions.length === 0 ? (
          <div style={{ ...CARD, borderRadius:14, padding:"2.5rem", textAlign:"center" }}>
            <p style={{ fontSize:13, color:C.text3 }}>
              {calSessions.length === 0
                ? `No sessions found for ${MONTHS[month-1]} ${year}.`
                : `No ${filterMode === "all" ? "" : filterMode + " "}sessions for ${weekLabel}.`}
            </p>
          </div>
        ) : (
          <div style={{ ...CARD, borderRadius:14, overflow:"hidden" }}>
            {visibleSessions.map(s => <SessionRow key={s.id} s={s} />)}
          </div>
        )
      )}
    </div>
  );
}

// ── PLACEHOLDER (eliminado — reemplazado por AttendanceView rediseñado) ──
// ── CLASS PREP VIEW (Dilo Coach GEM) ──────────────────────────
const CLASS_PREP_TEMPLATE = `You are a class design assistant for DILO Club coaches. Your job is to:
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

__DILO_KNOWLEDGE__`;

// Curriculum (~200 KB de markdown) se carga solo cuando se abre Dilo Coach/Student,
// no en el bundle inicial.
let _classPrepSystem = null;
async function getClassPrepSystem() {
  if (_classPrepSystem) return _classPrepSystem;
  const mods = await Promise.all([
    import("./knowledge/diloclub_foundation_v5.1.md?raw"),
    import("./knowledge/diloclub_a1_v5.1.md?raw"),
    import("./knowledge/diloclub_a2_v5.1.md?raw"),
    import("./knowledge/diloclub_b1_v5.1.md?raw"),
    import("./knowledge/diloclub_b2_v5.1.md?raw"),
    import("./knowledge/diloclub_c1_v5.1.md?raw"),
    import("./knowledge/diloclub_c2_v5.1.md?raw"),
  ]);
  _classPrepSystem = CLASS_PREP_TEMPLATE.replace("__DILO_KNOWLEDGE__", mods.map(m => m.default).join("\n\n---\n\n"));
  return _classPrepSystem;
}

const PREP_SUGGESTIONS = [
  "Muéstrame el índice del capítulo actual",
  "Necesito una clase de B1 sobre Present Perfect",
  "A2 — tema: trabajo remoto",
  "Foundation — verbos to be y to have",
];

async function streamGemini(messages, onChunk, signal) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const systemText = await getClassPrepSystem();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key}&alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
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

// ── CLASS RECAPS VIEW ──────────────────────────────────────────
// Costa Rica is always UTC-6 (no DST)
function crToday() {
  return new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
}

function timeToMinutes(t) {
  if (!t) return 0;
  const s = t.trim().toUpperCase();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3] === "PM" && h !== 12) h += 12;
  if (m[3] === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function normalizeTime(t) {
  if (!t) return t;
  return t.trim().replace(/\s+/g, " ").toUpperCase();
}

// ── WHATSAPP VIEW ──────────────────────────────────────────────
const WA_TEMPLATES = [
  {
    name: "dilo_class_reminder",
    label: "Recordatorio de clase",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre del estudiante" },
      { name: "hora",     label: "Hora de la clase" },
      { name: "coach",    label: "Nombre del coach" },
    ],
    description: "Avisa al estudiante que su clase empieza en 1 hora.",
    category: "class_reminder",
  },
  {
    name: "dilo_payment_reminder",
    label: "Recordatorio de pago",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre del estudiante" },
      { name: "monto",    label: "Monto (₡)" },
      { name: "fecha",    label: "Fecha de vencimiento" },
    ],
    description: "Recuerda al estudiante que su pago vence pronto.",
    category: "payment_reminder",
  },
  {
    name: "dilo_payment_overdue",
    label: "Pago vencido",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre del estudiante" },
      { name: "monto",    label: "Monto (₡)" },
      { name: "fecha",    label: "Fecha programada" },
    ],
    description: "Notifica al estudiante que su pago está vencido.",
    category: "payment_overdue",
  },
  {
    name: "dilo_announcement",
    label: "Anuncio general",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre (o 'comunidad Dilo')" },
      { name: "mensaje",  label: "Mensaje del anuncio" },
    ],
    description: "Envía un anuncio general a estudiantes o coaches.",
    category: "announcement",
  },
];

const WA_STATUS_COLOR = { sent: C.green, failed: C.red, pending: C.text2 };

function WhatsAppView({ user, role }) {
  const [tab, setTab]           = useState("send");
  const [template, setTemplate] = useState(WA_TEMPLATES[0].name);
  const [toPhone, setToPhone]   = useState("");
  const [params, setParams]     = useState([]);
  const [sending, setSending]   = useState(false);
  const [sendOk, setSendOk]     = useState(false);
  const [sendErr, setSendErr]   = useState("");

  const [history, setHistory]     = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histErr, setHistErr]     = useState("");

  const [inbox, setInbox]           = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxErr, setInboxErr]     = useState("");
  const [unread, setUnread]         = useState(0);

  const tpl = WA_TEMPLATES.find(t => t.name === template) || WA_TEMPLATES[0];

  useEffect(() => {
    setParams(tpl.params.map(() => ""));
  }, [template]);

  async function handleSend() {
    if (!toPhone.trim()) { setSendErr("Enter a phone number."); return; }
    setSending(true); setSendOk(false); setSendErr("");
    try {
      const res = await fetch(WHATSAPP_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "send",
          to: toPhone.trim(),
          template: tpl.name,
          language: tpl.language,
          params: tpl.params.map((p, i) =>
            typeof p === "object" ? { name: p.name, value: params[i] || "" } : params[i] || ""
          ),
          category: tpl.category,
        }),
      });
      const d = await res.json();
      if (d.failed > 0) {
        setSendErr(d.results[0]?.error || "Failed to send.");
      } else {
        setSendOk(true);
        setToPhone("");
        setParams(tpl.params.map(() => ""));
        setTimeout(() => setSendOk(false), 3000);
      }
    } catch (e) {
      setSendErr(e.message);
    } finally {
      setSending(false);
    }
  }

  async function fetchHistory() {
    setLoadingHist(true); setHistErr("");
    try {
      const res = await fetch(WHATSAPP_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "history", limit: 50 }),
      });
      const d = await res.json();
      if (d.error) { setHistErr(d.error); return; }
      setHistory(d.messages || []);
    } catch (e) {
      setHistErr(e.message);
    } finally {
      setLoadingHist(false);
    }
  }

  async function fetchInbox() {
    setLoadingInbox(true); setInboxErr("");
    try {
      const { data, error } = await supabase
        .from("whatsapp_inbox")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const msgs = data || [];
      setInbox(msgs);
      setUnread(msgs.filter(m => !m.is_read).length);
    } catch (e) {
      setInboxErr(e.message);
    } finally {
      setLoadingInbox(false);
    }
  }

  async function markAllRead() {
    await supabase.from("whatsapp_inbox").update({ is_read: true }).eq("is_read", false);
    setInbox(prev => prev.map(m => ({ ...m, is_read: true })));
    setUnread(0);
  }

  useEffect(() => {
    if (tab === "history") fetchHistory();
    if (tab === "inbox")   fetchInbox();
  }, [tab]);

  useEffect(() => {
    const ch = supabase
      .channel("whatsapp_inbox_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_inbox" }, p => {
        setInbox(prev => [p.new, ...prev]);
        setUnread(n => n + 1);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const card = { background: C.card, borderRadius: 14, padding: "1.5rem", marginBottom: "1rem" };
  const label = { display: "block", fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" };
  const input = {
    width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8, border: `1.5px solid ${C.border}`,
    background: C.bg, color: C.text, fontSize: 14, outline: "none",
  };
  const tabBtn = (id) => ({
    padding: "0.45rem 1.1rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: tab === id ? C.green : "transparent",
    color: tab === id ? "#000" : C.text2,
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: 680, margin: "0 auto" }}>
      <p style={{ color: C.text2, fontSize: 13, marginBottom: "1.25rem" }}>
        Send WhatsApp messages to students and coaches via Meta Cloud API.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
        <button style={tabBtn("send")}    onClick={() => setTab("send")}>Send Message</button>
        <button style={tabBtn("history")} onClick={() => setTab("history")}>History</button>
        <button style={{ ...tabBtn("inbox"), position: "relative" }} onClick={() => setTab("inbox")}>
          Inbox
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: C.red, color: "#fff", fontSize: 10, fontWeight: 700,
              borderRadius: "50%", width: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{unread}</span>
          )}
        </button>
      </div>

      {/* ── SEND TAB ── */}
      {tab === "send" && (
        <div style={card}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={label}>Template</span>
            <select value={template} onChange={e => setTemplate(e.target.value)} style={input}>
              {WA_TEMPLATES.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: C.text2, marginTop: 5 }}>{tpl.description}</p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <span style={label}>Recipient Phone (with country code)</span>
            <input
              style={input}
              placeholder="+50688887777"
              value={toPhone}
              onChange={e => { setToPhone(e.target.value); setSendErr(""); }}
            />
          </div>

          {tpl.params.map((p, i) => (
            <div key={i} style={{ marginBottom: "1rem" }}>
              <span style={label}>{typeof p === "object" ? p.label : p}</span>
              <input
                style={input}
                value={params[i] || ""}
                onChange={e => setParams(ps => ps.map((p, j) => j === i ? e.target.value : p))}
              />
            </div>
          ))}

          {sendErr && <p style={{ color: C.red, fontSize: 13, marginBottom: "0.75rem" }}>{sendErr}</p>}
          {sendOk  && <p style={{ color: C.green, fontSize: 13, marginBottom: "0.75rem" }}>Message sent!</p>}

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: "0.6rem 1.5rem", borderRadius: 8, border: "none", cursor: sending ? "not-allowed" : "pointer",
              background: C.green, color: "#000", fontWeight: 700, fontSize: 14,
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? "Sending…" : "Send"}
          </button>

          <div style={{ marginTop: "1.5rem", padding: "0.85rem", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Note — Test mode</p>
            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
              Only numbers added as test recipients in Meta can receive messages right now.
              Additional templates (class reminders, payment reminders) will be available after
              Meta approves the business verification (~2 days).
            </p>
          </div>
        </div>
      )}

      {/* ── INBOX TAB ── */}
      {tab === "inbox" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 13, color: C.text2 }}>
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  padding: "0.3rem 0.8rem", borderRadius: 6, border: `1px solid ${C.border}`,
                  background: "transparent", color: C.text2, fontSize: 12, cursor: "pointer",
                }}>Mark all read</button>
              )}
              <button onClick={fetchInbox} style={{
                padding: "0.3rem 0.8rem", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text2, fontSize: 12, cursor: "pointer",
              }}>Refresh</button>
            </div>
          </div>
          {loadingInbox && <p style={{ color: C.text2, fontSize: 14 }}>Loading…</p>}
          {inboxErr     && <p style={{ color: C.red,   fontSize: 14 }}>{inboxErr}</p>}
          {!loadingInbox && !inboxErr && inbox.length === 0 && (
            <p style={{ color: C.text2, fontSize: 14 }}>No messages received yet.</p>
          )}
          {inbox.map(msg => (
            <div key={msg.id} style={{
              ...card,
              borderLeft: msg.is_read ? `3px solid transparent` : `3px solid ${C.green}`,
              opacity: msg.is_read ? 0.75 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{msg.from_name || msg.from_phone}</span>
                  {msg.from_name && (
                    <span style={{ fontSize: 12, color: C.text2, marginLeft: 8 }}>{msg.from_phone}</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: C.text2, whiteSpace: "nowrap" }}>
                  {new Date(msg.created_at).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" })}
                </span>
              </div>
              <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.5 }}>{msg.message_body}</p>
              {msg.message_type !== "text" && (
                <span style={{ fontSize: 11, color: C.text2, marginTop: 4, display: "block" }}>[{msg.message_type}]</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div>
          {loadingHist && <p style={{ color: C.text2, fontSize: 14 }}>Loading…</p>}
          {histErr     && <p style={{ color: C.red,   fontSize: 14 }}>{histErr}</p>}
          {!loadingHist && !histErr && history.length === 0 && (
            <p style={{ color: C.text2, fontSize: 14 }}>No messages sent yet.</p>
          )}
          {history.map(msg => (
            <div key={msg.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{msg.to_phone}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: (WA_STATUS_COLOR[msg.status] || C.text2) + "22",
                  color: WA_STATUS_COLOR[msg.status] || C.text2,
                }}>
                  {msg.status}
                </span>
              </div>
              <span style={{ fontSize: 12, color: C.text2 }}>
                {msg.template_name}
                {msg.params?.length ? ` · ${msg.params.join(", ")}` : ""}
              </span>
              {msg.error_message && (
                <span style={{ fontSize: 12, color: C.red }}>{msg.error_message}</span>
              )}
              <span style={{ fontSize: 11, color: C.text2 }}>
                {new Date(msg.created_at).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const esc = raw.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>");
    const dimTs = s => s.replace(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g,
      "<span style='color:rgba(240,236,224,0.3);font-size:11px'>$1</span>");
    const boldTitle = s => { const m=s.match(/^(.{5,}?):\s/); return m?`<strong>${m[1]}:</strong> ${s.slice(m[0].length)}`:s; };
    // Teams-style bullets: • or ▶
    if (/^[•▶►]\s*/.test(raw)) {
      if (!inList) { html += "<ul style='margin:0.4rem 0;padding:0;list-style:none'>"; inList = true; }
      const content = dimTs(boldTitle(esc.replace(/^[•▶►]\s*/,"")));
      html += `<li style='margin-bottom:0.6rem;padding-left:0.75rem;border-left:2px solid rgba(240,236,224,0.12)'>${content}</li>`;
    }
    // Standard markdown bullets
    else if (/^[-*]\s+/.test(raw)) {
      if (!inList) { html += "<ul style='margin:0.35rem 0 0.35rem 1.1rem;padding:0'>"; inList = true; }
      html += `<li style='margin-bottom:0.2rem'>${esc.replace(/^[-*]\s+/,"")}</li>`;
    }
    else {
      if (inList) { html += "</ul>"; inList = false; }
      if (/^#{1,3}\s+/.test(raw)) {
        html += `<p style='font-weight:700;font-size:13px;margin:0.7rem 0 0.25rem;color:rgba(240,236,224,0.9)'>${esc.replace(/^#+\s+/,"")}</p>`;
      } else if (esc.trim() === "") {
        html += "<br/>";
      } else {
        html += `<p style='margin:0 0 0.3rem'>${esc}</p>`;
      }
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function stripMd(text) {
  return text.replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*(.+?)\*/g,"$1")
    .replace(/^[•▶►\-*#]+\s*/gm,"").replace(/\n+/g," ").trim();
}

function MeetingRecapsView({ user, role }) {
  const isAdmin = role === "admin";
  const today   = crToday();

  // ── Register card state (admin only) ──
  const [regDate,       setRegDate]       = useState(today);
  const [events,        setEvents]        = useState([]);
  const [loadingEvs,    setLoadingEvs]    = useState(false);
  const [doneRecapNames,setDoneRecapNames]= useState(new Set());
  const [selEvent,      setSelEvent]      = useState("");
  const [regTime,       setRegTime]       = useState("");
  const [recapText,     setRecapText]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saveOk,        setSaveOk]        = useState(false);
  const [saveErr,       setSaveErr]       = useState("");
  const [regErrors,     setRegErrors]     = useState({});

  // ── Access card state ──
  const [accDate,     setAccDate]     = useState(today);
  const [accTime,     setAccTime]     = useState("All");
  const [recaps,      setRecaps]      = useState([]);
  const [loadingAcc,  setLoadingAcc]  = useState(false);
  const [fetchErr,    setFetchErr]    = useState("");
  const [expanded,    setExpanded]    = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState("");
  const [editSaving,  setEditSaving]  = useState(false);
  const [editErr,     setEditErr]     = useState("");

  // Fetch Teams events + existing recaps when regDate changes
  useEffect(() => {
    if (!isAdmin || !regDate) return;
    setLoadingEvs(true); setSelEvent(""); setRegTime(""); setEvents([]);
    Promise.all([
      fetch(ATTENDANCE_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "calendar-events", date: regDate }),
      }).then(r => r.json()).catch(() => ({ events: [] })),
      supabase.from("meeting_recaps").select("event_name").eq("class_date", regDate),
    ]).then(([calData, { data: existingRecaps }]) => {
      setEvents(calData.events || []);
      setDoneRecapNames(new Set((existingRecaps || []).map(r => r.event_name)));
    }).finally(() => setLoadingEvs(false));
  }, [regDate, isAdmin]);

  // Graph returns CR local time via Prefer header — parse string directly
  function handleSelectEvent(subject) {
    setSelEvent(subject);
    const ev = events.find(e => e.subject === subject);
    if (ev?.start) {
      const timePart = ev.start.slice(11, 16);
      const [hStr, mStr] = timePart.split(":");
      const h = parseInt(hStr, 10);
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      setRegTime(`${h12}:${mStr} ${ap}`);
    }
    setRegErrors(e => ({ ...e, selEvent: false, regTime: false }));
  }

  async function handleSave() {
    const errs = {};
    if (!selEvent)         errs.selEvent  = true;
    if (!regTime.trim())   errs.regTime   = true;
    if (!recapText.trim()) errs.recapText = true;
    setRegErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const { error } = await supabase.from("meeting_recaps").insert({
        class_date: regDate, class_time: normalizeTime(regTime),
        event_name: selEvent, recap: recapText.trim(), created_by: user?.id || null,
      });
      if (error) throw error;
      setSaveOk(true);
      setDoneRecapNames(prev => new Set([...prev, selEvent]));
      setSelEvent(""); setRegTime(""); setRecapText("");
      setTimeout(() => setSaveOk(false), 4000);
      if (accDate === regDate) fetchRecaps(regDate);
    } catch (e) {
      setSaveErr("Error: " + (e?.message || JSON.stringify(e)));
    } finally { setSaving(false); }
  }

  async function fetchRecaps(date) {
    setLoadingAcc(true); setFetchErr("");
    const { data, error } = await supabase
      .from("meeting_recaps").select("*").eq("class_date", date);
    if (error) {
      setFetchErr(error.message || JSON.stringify(error));
      setRecaps([]);
    } else {
      const sorted = (data || []).sort((a, b) => timeToMinutes(a.class_time) - timeToMinutes(b.class_time));
      setRecaps(sorted);
    }
    setAccTime("All");
    setLoadingAcc(false);
  }

  useEffect(() => { fetchRecaps(accDate); }, [accDate]);

  async function handleEditSave(id) {
    setEditSaving(true); setEditErr("");
    const { error } = await supabase.from("meeting_recaps").update({ recap: editText }).eq("id", id);
    if (error) { setEditErr("Error saving."); setEditSaving(false); return; }
    setRecaps(rs => rs.map(r => r.id === id ? { ...r, recap: editText } : r));
    setEditingId(null); setEditSaving(false);
  }

  // Unique times for filter dropdown, in chronological order
  // Build unique times keyed by minute value to avoid string format mismatches
  const timesByMin = {};
  recaps.forEach(r => {
    const mins = timeToMinutes(r.class_time);
    if (!timesByMin[mins]) timesByMin[mins] = r.class_time;
  });
  const uniqueTimes = Object.entries(timesByMin)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, label]) => label);

  // Filter by minute value, not by string — immune to format variations
  const accMins = accTime === "All" ? null : timeToMinutes(accTime);
  const filtered = accMins === null ? recaps : recaps.filter(r => timeToMinutes(r.class_time) === accMins);

  // Group filtered recaps by time
  const grouped = filtered.reduce((acc, r) => {
    const key = r.class_time;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const sortedTimes = Object.keys(grouped).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

  const inputSt = {
    width: "100%", background: "rgba(240,236,224,0.05)", border: "1px solid rgba(240,236,224,0.1)",
    borderRadius: 10, color: "rgba(240,236,224,0.9)", fontFamily: "inherit", fontSize: 13,
    padding: "0.65rem 0.85rem", boxSizing: "border-box", outline: "none", appearance: "none",
    WebkitAppearance: "none",
  };
  const labelSt = { display: "block", fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" };

  return (
    <div style={{ maxWidth: 780, width: "100%" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: 13, color: C.text2 }}>Review AI generated summaries from previous classes.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr", gap: "1.25rem", alignItems: "start" }}>

        {/* ── CARD 1: Register (admin only) ───────────────────────── */}
        {isAdmin && (
          <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.green, marginBottom: "1.25rem" }}>Register Recap</p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelSt}>Date</label>
              <input type="date" value={regDate} onChange={e => setRegDate(e.target.value)}
                style={{ ...inputSt, colorScheme: "dark" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelSt}>
                Class {loadingEvs && <span style={{ color: C.text3, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— loading…</span>}
              </label>
              {!loadingEvs && events.length > 0 && events.every(ev => doneRecapNames.has(ev.subject))
                ? <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>✓ All recaps sent</div>
                : <>
                    <select value={selEvent} onChange={e => handleSelectEvent(e.target.value)}
                      style={{ ...inputSt, borderColor: regErrors.selEvent ? "#c20000" : "rgba(240,236,224,0.1)", cursor: "pointer" }}
                      disabled={loadingEvs || events.length === 0}>
                      <option value="">{loadingEvs ? "Loading classes…" : events.length === 0 ? "No classes on this date" : "Select class…"}</option>
                      {events.filter(ev => !doneRecapNames.has(ev.subject)).map(ev => <option key={ev.id} value={ev.subject}>{ev.subject}</option>)}
                    </select>
                    {regErrors.selEvent && <p style={{ fontSize: 11, color: "#c20000", marginTop: 4 }}>Select a class.</p>}
                  </>
              }
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelSt}>Time</label>
              <input type="text" value={regTime} onChange={e => { setRegTime(e.target.value); setRegErrors(er => ({ ...er, regTime: false })); }}
                placeholder="e.g. 8:00 PM"
                style={{ ...inputSt, borderColor: regErrors.regTime ? "#c20000" : "rgba(240,236,224,0.1)" }} />
              {regErrors.regTime && <p style={{ fontSize: 11, color: "#c20000", marginTop: 4 }}>Enter the class time.</p>}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelSt}>Recap (Teams AI Summary)</label>
              <textarea value={recapText} onChange={e => { setRecapText(e.target.value); setRegErrors(er => ({ ...er, recapText: false })); }}
                placeholder="Paste the Teams AI summary here…" rows={10}
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.6, borderColor: regErrors.recapText ? "#c20000" : "rgba(240,236,224,0.1)" }} />
              {regErrors.recapText && <p style={{ fontSize: 11, color: "#c20000", marginTop: 4 }}>Paste the recap content.</p>}
            </div>

            {saveOk && <div style={{ background: "rgba(109,181,138,0.1)", border: "1px solid rgba(109,181,138,0.25)", borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "0.75rem", fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Recap saved successfully.</div>}
            {saveErr && <div style={{ background: "rgba(194,0,0,0.1)", border: "1px solid rgba(194,0,0,0.25)", borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "0.75rem", fontSize: 12, color: "#c20000", fontWeight: 600 }}>{saveErr}</div>}
            <button onClick={handleSave} disabled={saving}
              style={{ width: "100%", background: saving ? "rgba(109,181,138,0.4)" : C.green, border: "none", borderRadius: 10, color: "#0d0b08", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "0.8rem", cursor: saving ? "wait" : "pointer", transition: "background 0.15s" }}>
              {saving ? "Saving…" : "Save Recap"}
            </button>
          </div>
        )}

        {/* ── CARD 2: Access Recaps ────────────────────────────────── */}
        <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.amber, marginBottom: "1.25rem" }}>Access Recaps</p>

          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={labelSt}>Date</label>
              <input type="date" value={accDate} onChange={e => setAccDate(e.target.value)}
                style={{ ...inputSt, colorScheme: "dark" }} />
            </div>
            <div>
              <label style={labelSt}>Time</label>
              <select value={accTime} onChange={e => setAccTime(e.target.value)}
                style={{ ...inputSt, cursor: "pointer" }} disabled={recaps.length === 0}>
                <option value="All">All times</option>
                {uniqueTimes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Fetch error */}
          {fetchErr && <div style={{ background: "rgba(194,0,0,0.1)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "0.75rem", fontSize: 12, color: "#c20000" }}>Error: {fetchErr}</div>}

          {/* Count */}
          {!loadingAcc && !fetchErr && recaps.length > 0 && (
            <p style={{ fontSize: 11, color: C.text3, marginBottom: "0.75rem" }}>
              {recaps.length} recap{recaps.length !== 1 ? "s" : ""} found · showing {filtered.length}
              {accTime !== "All" ? ` at ${accTime}` : ""}
            </p>
          )}

          {/* Results */}
          {loadingAcc ? (
            <p style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: "2rem 0" }}>Loading recaps…</p>
          ) : fetchErr ? null : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ fontSize: 13, color: C.text3 }}>{recaps.length === 0 ? "No recaps found for this date." : "No recaps match the selected time."}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sortedTimes.map(time => (
                <div key={time}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: "0.5rem" }}>{time}</p>
                  {grouped[time].map(r => {
                    const isEditing = editingId === r.id;
                    const isOpen    = expanded[r.id];
                    const preview   = r.recap.length > 140 ? r.recap.slice(0, 140) + "…" : r.recap;
                    return (
                      <div key={r.id} style={{ background: "rgba(240,236,224,0.04)", border: `1px solid ${isEditing ? "rgba(240,236,224,0.2)" : "rgba(240,236,224,0.08)"}`, borderRadius: 12, padding: "1rem", marginBottom: "0.5rem", transition: "border-color 0.15s" }}>
                        {/* Header row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.6rem" }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>{r.event_name}</p>
                          {isAdmin && !isEditing && (
                            <button onClick={() => { setEditingId(r.id); setEditText(r.recap); setEditErr(""); setExpanded(ex => ({ ...ex, [r.id]: false })); }}
                              style={{ background: "rgba(240,236,224,0.06)", border: "1px solid rgba(240,236,224,0.1)", borderRadius: 7, color: C.text2, fontFamily: "inherit", fontSize: 10, fontWeight: 700, padding: "0.3rem 0.65rem", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <>
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={10}
                              style={{ ...inputSt, resize: "vertical", lineHeight: 1.6, marginBottom: "0.75rem" }} />
                            {editErr && <p style={{ fontSize: 11, color: "#c20000", marginBottom: "0.5rem" }}>{editErr}</p>}
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button onClick={() => handleEditSave(r.id)} disabled={editSaving}
                                style={{ flex: 1, background: C.green, border: "none", borderRadius: 8, color: "#0d0b08", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "0.6rem", cursor: editSaving ? "wait" : "pointer" }}>
                                {editSaving ? "Saving…" : "Save"}
                              </button>
                              <button onClick={() => setEditingId(null)}
                                style={{ flex: 1, background: "transparent", border: "1px solid rgba(240,236,224,0.1)", borderRadius: 8, color: C.text2, fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "0.6rem", cursor: "pointer" }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {isOpen
                              ? <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65, wordBreak: "break-word" }}
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(r.recap) }} />
                              : <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.65, wordBreak: "break-word", margin: 0 }}>
                                  {stripMd(r.recap).slice(0, 140)}{r.recap.length > 140 ? "…" : ""}
                                </p>
                            }
                            {r.recap.length > 140 && (
                              <button onClick={() => setExpanded(ex => ({ ...ex, [r.id]: !isOpen }))}
                                style={{ background: "transparent", border: "none", color: C.green, fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "0.4rem 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                {isOpen ? "Show less ↑" : "Read full recap ↓"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

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
  const [unreadWA, setUnreadWA] = useState(0);

  useEffect(() => {
    if (role !== "admin") return;
    supabase.from("whatsapp_inbox").select("id", { count: "exact" }).eq("is_read", false)
      .then(({ count }) => setUnreadWA(count || 0));
    const ch = supabase.channel("wa_inbox_badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_inbox" }, () =>
        setUnreadWA(n => n + 1))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [role]);


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
    // Guards de rol — el sidebar solo oculta los links; esto bloquea el acceso real
    const ADMIN_ONLY = ["coaches", "students", "cashier", "whatsapp", "invites", "estudiantes", "dilo-coach"];
    const STAFF_ONLY = ["next-classes", "class-recaps", "dinamicas", "my-hours", "new-class-feedback", "send-feedback", "progress"];
    if (ADMIN_ONLY.includes(active) && role !== "admin")
      return <PlaceholderView title="Access denied" desc="This section is only available to administrators." icon="home" />;
    if (STAFF_ONLY.includes(active) && role === "student")
      return <PlaceholderView title="Access denied" desc="This section is only available to coaches." icon="home" />;

    if (active === "dashboard") {
      if (role === "admin") return <AdminDashboard />;
      if (role === "coach") return <CoachDashboard user={user} />;
      return <StudentDashboard />;
    }
    if (active === "feedbacks")            return <FeedbacksHub setActive={setActive} role={role} />;
    if (active === "new-class-feedback") return <NewClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-coach")         return <ClassPrepView user={user} />;
    if (active === "send-feedback")      return <SendFeedbackView user={user} setActive={setActive} />;
    if (active === "class-feedback")    return <ClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-feedback")  return <StudentFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-surveys")   return <StudentSurveysView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-student") return <ClassPrepView user={user} />;
    if (active === "calendario")    return <MasterSchedule role={role} user={user} />;
    if (active === "next-classes") return <NextClassesView user={user} role={role} />;
    if (active === "invites")      return <InvitesView user={user} />;
    if (active === "settings")     return <SettingsView user={user} setActive={setActive} />;
    if (active === "kyc-coach")    return <KYCCoachView user={user} setActive={setActive} />;
    if (active === "perfil")       return <ProfileView user={user} defaultSection="bio" setActive={setActive} />;
    if (active === "perfil-me")    return <ProfileView user={user} defaultSection="me"  setActive={setActive} />;
    if (active === "estudiantes")  return <AttendanceView />;
    if (active === "my-hours")     return <MyHoursView user={user} />;
    if (active === "progress")     return <ProgressView user={user} />;
    if (active === "coaches")         return <CoachesView />;
    if (active === "students")        return <StudentsView />;
    if (active === "class-recaps")  return <MeetingRecapsView user={user} role={role} />;
    if (active === "cashier")        return <CashierView />;
    if (active === "whatsapp")      return <WhatsAppView user={user} role={role} />;
    if (active === "dinamicas")    return <DinamicasView user={user} role={role} />;
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

      <Sidebar role={role} user={user} active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} onLogout={onLogout} unreadWA={unreadWA} setUnreadWA={setUnreadWA} />

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

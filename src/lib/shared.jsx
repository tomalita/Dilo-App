import React from "react";
import { supabase } from "../supabase.js";

// ── DESIGN TOKENS ──────────────────────────────────────────────
export const C = {
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
export const CARD = {
  background: "rgba(240,236,224,0.06)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(240,236,224,0.12)",
  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
};
export const SEL = (extra = {}) => ({
  background: "#1e1b17", border: "1px solid rgba(240,236,224,0.12)",
  borderRadius: 8, padding: "0.4rem 0.65rem", color: "rgba(240,236,224,0.5)",
  fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", ...extra,
});
export const ROL_LABELS = { student: "Student", coach: "Coach", admin: "Admin" };
export const ROL_COLORS = { student: C.green, coach: C.text2, admin: C.text2 };

// ── SHARED HELPERS ─────────────────────────────────────────────
export const IVA_RATE = 0.02;                       // IVA servicios Costa Rica
export const CR_UTC_OFFSET_MS = 6 * 60 * 60 * 1000; // Costa Rica es UTC-6 todo el año (sin DST)
export const toCRDate = (iso) => new Date(new Date(iso).getTime() - CR_UTC_OFFSET_MS);
export const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export let USD_RATE = 450; // ₡ por $ — fallback; el valor real vive en app_settings
supabase.from("app_settings").select("value").eq("key", "usd_rate").single()
  .then(({ data }) => { const v = parseFloat(data?.value); if (v > 0) USD_RATE = v; })
  .catch(() => {});

// ── COACH ROSTER — única fuente: coach_rates (via vista coaches_public) ──
// Fallback = roster al momento del build; el vivo se carga antes de renderizar (App.jsx).
export const FALLBACK_ROSTER = [
  { coach_name: "Ana",      color: "#f4a7b9", active: true },
  { coach_name: "Ricardo",  color: "#4fc3f7", active: true },
  { coach_name: "Jesse",    color: "#b7e4a0", active: true },
  { coach_name: "Gabriela", color: "#ce93d8", active: true },
  { coach_name: "Mafer",    color: "#1a73e8", active: true },
  { coach_name: "Jose",     color: "#ff9f43", active: true },
];
export let COACH_ROSTER = FALLBACK_ROSTER;
export const getCoachNames  = () => COACH_ROSTER.filter(c => c.active !== false).map(c => c.coach_name);
export const getCoachColors = () => { const m = {}; COACH_ROSTER.forEach(c => { m[c.coach_name] = c.color || "#9e9e9e"; }); return m; };

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
export function toast(msg) {
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
export function DiloDot({ size = "0.28em" }) {
  return (
    <svg width={size} height={size} viewBox="663 468 58 58" fill="none"
      style={{ display:"inline-block", verticalAlign:"baseline", marginLeft:"0.1em", overflow:"visible" }}>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M692 471C706.359 471 718 482.641 718 497C718 511.359 706.359 523 692 523C677.641 523 666 511.359 666 497C666 482.641 677.641 471 692 471ZM692 479C682.059 479 674 487.283 674 497.5C674 507.717 682.059 516 692 516C701.941 516 710 507.717 710 497.5C710 487.283 701.941 479 692 479Z"
        fill="currentColor" />
    </svg>
  );
}

export function DiloLogo({ height = 20 }) {
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
export const Icon = ({ name, size = 16, color = C.text2 }) => {
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
export const Badge = ({ children, color = C.text3, bg = "rgba(240,236,224,0.06)" }) => (
  <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, border: `1px solid ${color}33` }}>
    {children}
  </span>
);

export const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.text3 }}>{label}</p>
    <p style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: accent || C.text, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: C.text2 }}>{sub}</p>}
  </div>
);

export const ProgressBar = ({ value, max = 100, color = C.green }) => (
  <div style={{ height: 3, background: C.border2, borderRadius: 2, overflow: "hidden" }}>
    <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
  </div>
);

export const SectionHeader = ({ eyebrow, title, action }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.25rem" }}>
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>{eyebrow}</p>
      <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{title}</h2>
    </div>
    {action}
  </div>
);


// ── NAV CONFIG PER ROLE ─────────────────────────────────────────
export const NAV = {
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

export const isoFmt = s => s ? s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4) : "";
export const ANON_KEY        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk";
export const EDGE_URL        = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/rapid-endpoint";
export const ATTENDANCE_URL  = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/attendance-endpoint";
export const WHATSAPP_URL    = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/whatsapp-sender";
export const CASHIER_URL        = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/smooth-processor";
export const CASHIER_INTENT_URL = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/cashier-create-intent"; // update slug after deploy
export const ONVO_PUBLIC_KEY    = "onvo_live_publishable_key_-zkvnOlRgc4_rkP58dkc7JcsiIesaqrH-0lLFVXUMAOS7fGKfAxsnM_9TSbWkAi5KnmdmD2CTDSqt44q26CsDQ";
// Module-level caches — survive component unmount/remount (navigation between tabs)
// Shared Teams-calendar caches — objeto (no lets sueltos) porque los bindings
// importados de ES modules son read-only; mutar propiedades sí está permitido.
export const SCHED = {
  weeks: {},         // weekOffset → events[]  (Dashboard seeds, Schedule/NextClasses read)
  month: null,       // coach month events
  dashPromise: null, // in-flight fetch — Calendar awaits this instead of a parallel Graph call
};
export const SHEET_CLASS    = "1TmxAa-dbaTgPYCZyXl91fJDIZ997-8twnbQEmVluZ6A";
export const SHEET_STUDENT  = "1jwDyhxVAnj0LY5k0fs_n3eYzLorCkAMBxapFA-7SgYw";
export const SHEET_SURVEYS  = "1R1n_ucN9mnky1vVYXyEFnYghaJjemzqRHQ7URv6LTUE";

export let COACH_COLORS = getCoachColors();
export let COACHES = ["All", ...getCoachNames()];
export let FB_COACHES = [...getCoachNames()].sort();
export let AVATAR_COLORS = getCoachColors();

export const VIEW_TITLES = {
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
export const STU_LEVELS    = ["Fn","A1","A2","B1","B2","C1","C2"];

// Costa Rica is always UTC-6 (no DST)
export function crToday() {
  return new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
}


// Placeholder genérico para vistas en construcción / access denied
export function PlaceholderView({ title, desc, icon }) {
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


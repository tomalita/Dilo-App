import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

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

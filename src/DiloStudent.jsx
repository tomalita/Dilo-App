import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

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

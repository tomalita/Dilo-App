import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

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

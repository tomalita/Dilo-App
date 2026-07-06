import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import {
  C, CARD, SEL, ROL_LABELS, ROL_COLORS, IVA_RATE, CR_UTC_OFFSET_MS, toCRDate,
  MONTHS_SHORT, MONTHS_LONG, USD_RATE, loadCoachRoster, getCoachNames, getCoachColors,
  toast, DiloDot, DiloLogo, Icon, Badge, StatCard, ProgressBar, SectionHeader, NAV,
  isoFmt, ANON_KEY, EDGE_URL, ATTENDANCE_URL, WHATSAPP_URL, CASHIER_URL, CASHIER_INTENT_URL,
  ONVO_PUBLIC_KEY, SCHED, SHEET_CLASS, SHEET_STUDENT, SHEET_SURVEYS,
  COACHES, COACH_COLORS, FB_COACHES, AVATAR_COLORS, VIEW_TITLES, STU_LEVELS, crToday, PlaceholderView,
} from "../lib/shared.jsx";

export function FeedbacksHub({ setActive, role }) {
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

export function SendFeedbackView({ user, setActive }) {
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

export function NewClassFeedbackView({ user, role, setActive }) {
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
export function ClassFeedbackView({ user, role, setActive }) {
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
export function StudentFeedbackView({ user, role, setActive }) {
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
export function StudentSurveysView({ user, role, setActive }) {
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


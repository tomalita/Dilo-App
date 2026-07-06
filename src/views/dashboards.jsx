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


// STUDENT DASHBOARD
export function StudentDashboard() {
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
export function CoachDashboard({ user }) {
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
    delete SCHED.weeks[0];
    SCHED.month = null;
    SCHED.dashPromise = null;

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
    SCHED.dashPromise = p1week;
    p1week.then(evs => {
      if (evs.length > 0) {
        SCHED.weeks[0] = evs.map(ev => ({ uid: ev.uid||(ev.summary||"")+(ev.start||""), summary: ev.summary||"Sin título", date: ev.date, coach: ev.coach||"Unassigned", nivel:"", estudiantes:ev.estudiantes||"", joinUrl:ev.joinUrl||null, urgente:false }));
        setWeekCache(c => ({ ...c, 0: evs }));
        setWeekLoading(false);
        // Month events (sequential to avoid throttling)
        return fetchTeams(monthStart, monthEnd).then(evm => {
          if (evm.length > 0) { SCHED.month = evm; setMonthEvents(evm); }
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
export function AdminDashboard() {
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
          SCHED.weeks[0] = ev.map(e => ({ uid: e.uid||(e.summary||"")+(e.start||""), summary: e.summary||"Sin título", date: e.date, coach: e.coach||"Unassigned", nivel:"", estudiantes:e.estudiantes||"", joinUrl:e.joinUrl||null, urgente:false }));
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

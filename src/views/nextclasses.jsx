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

// ── NEXT CLASSES VIEW ─────────────────────────────────────────
export function NextClassesView({ user, role }) {
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
    const prevP = (SCHED.weeks[-1] && SCHED.weeks[-1].length > 0)
      ? Promise.resolve(SCHED.weeks[-1])
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
    <div style={{ maxWidth:760, width:"100%" }}>
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
        <div style={{ ...CARD, borderRadius:16, padding:"3rem", display:"flex", gap:6, justifyContent:"center" }}>
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


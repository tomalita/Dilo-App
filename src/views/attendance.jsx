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

// ── ATTENDANCE VIEW ────────────────────────────────────────────
// Monthly dashboard: per-student stats with 50 effective min/class baseline.
// Filterable by class subject. Coaches excluded. External students flagged.
export function AttendanceView() {
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


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
export function MasterSchedule({ role, user }) {
  const [weekOffset, setWeekOffset] = useState(0);
  // Init from module cache so re-navigation is instant (Dashboard seeds SCHED.weeks on first load)
  const [cache, setCache] = useState(() => ({...SCHED.weeks}));
  const [loading, setLoading] = useState(() => SCHED.weeks[0] === undefined);
  const [error, setError] = useState(null);
  const [monthEvents, setMonthEvents] = useState(() => SCHED.month || []);
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
  // Polls SCHED.month every 300ms — CoachDashboard's sequential month request populates it.
  // Falls back to own month request if Dashboard didn't seed within ~15s (direct navigation).
  useEffect(() => {
    if (role !== "coach") return;
    if (SCHED.month) { setMonthEvents(SCHED.month); return; } // already seeded — instant

    let cancelled = false;
    let pollTimer = null;
    let pollCount = 0;

    const poll = () => {
      if (cancelled) return;
      if (SCHED.month) { setMonthEvents(SCHED.month); return; }
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
            SCHED.month = evs;
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
    const missing = [...offsets].filter(o => o !== weekOffset && cache[o] === undefined && SCHED.weeks[o] === undefined);
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
          if (evs.length > 0) SCHED.weeks[off] = evs;
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
        if (evs.length > 0) SCHED.weeks[weekOffset] = evs; // never cache empty — empty means error/throttle
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

    // For coach offset=0: poll SCHED.weeks[0] every 300ms (seeded by Dashboard's p1week).
    // No concurrent Graph call fired until cache is confirmed missing after ~10s.
    if (role === "coach" && weekOffset === 0) {
      const dashSnap = SCHED.dashPromise;
      if (dashSnap && retryKey === 0) {
        // Wait for Dashboard's p1week — no timeout, handles Edge Function cold starts
        dashSnap.then(() => {
          if (cancelled) return;
          if (SCHED.weeks[0] !== undefined) {
            setCache(c => ({ ...c, 0: SCHED.weeks[0] }));
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
    <div style={{ width: "100%", maxWidth: 1040 }}>
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
        <div style={{ ...CARD, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", gap: 8 }}>
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

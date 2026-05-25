import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── MINI CALENDAR PICKER ──────────────────────────────────────
function MiniCalendar({ weekOffset, setWeekOffset, onClose }) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [showMonths, setShowMonths] = useState(false);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["M","T","W","T","F","S","S"];

  // Get current week's Monday
  const getCurrentWeekMonday = (offset) => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    d.setHours(0,0,0,0);
    return d;
  };

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
                  background: isToday ? "rgba(37,211,102,0.15)" : "transparent",
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
  const [cache, setCache] = useState({}); // keyed by weekOffset
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthEvents, setMonthEvents] = useState([]);

  const events = cache[weekOffset] || [];

  const coachColors = {
    Ana:      "#f4a7b9",
    Ricardo:  "#4fc3f7",
    Jesse:    "#b7e4a0",
    Gabriela: "#ce93d8",
    Gaby:     "#ce93d8",
    Mafer:    "#1a73e8",
  };
  const URGENTE_COLOR = "#c20000";

  const coachEmails = {
    "ana@dilo.club":      "Ana",
    "ricardo@dilo.club":  "Ricardo",
    "jesse@dilo.club":    "Jesse",
    "gabriela@dilo.club": "Gabriela",
    "mafer@dilo.club":    "Mafer",
  };

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

  // Fetch full month events once on mount (for coach monthly total)
  useEffect(() => {
    if (role !== "coach") return;
    const now2 = new Date();
    const mStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
    const mEnd   = new Date(now2.getFullYear(), now2.getMonth()+1, 0, 23,59,59);
    fetch(EDGE_URL, {
      method: "POST",
      headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "teams", startDateTime: mStart.toISOString(), endDateTime: mEnd.toISOString() })
    }).then(r=>r.json()).then(d => {
      if (Array.isArray(d)) {
        const coachN = user?.nombre || "";
        setMonthEvents(d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)}))
          .filter(ev => !isNaN(ev.date) && ev.coach === coachN));
      }
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    // Use cache if available
    if (cache[weekOffset] !== undefined) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const COACH_RATES = {
  Ricardo:  { rate: 5100,  currency: "₡", iva: true },
  Ana:      { rate: 6018,  currency: "₡", iva: true },
  Mafer:    { rate: 3570,  currency: "₡", iva: true },
  Gabriela: { rate: 2550,  currency: "₡", iva: true },
  Jesse:    { rate: 15,    currency: "$", iva: false },
};

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk";
    const EDGE_URL = "https://zadynxqasghbufqzrgfy.supabase.co/functions/v1/rapid-endpoint";
    const fetchViaEdge = async () => {
      try {
        const startStr = weekStart.toISOString();
        const endStr = weekEnd.toISOString();
        const emails = Object.keys(coachEmails);
        const res = await fetch(EDGE_URL, {
          method: "POST",
          headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ source: "teams", startDateTime: startStr, endDateTime: endStr, coaches: emails })
        });
        const text = await res.text();
        if (!res.ok || text.includes("VCALENDAR")) return null;
        try { return JSON.parse(text); } catch(e) { return null; }
      } catch(e) { return null; }
    };

    fetchViaEdge().then(data => {
      if (data && Array.isArray(data)) {
        const evs = data.map(ev => {
          // Teams returns UTC time — convert to Costa Rica (GMT-6)
          const utcDate = new Date(ev.start);
          const crDate = new Date(utcDate.getTime() - (6 * 60 * 60 * 1000));
          return {
            uid: ev.uid || ev.summary + ev.start,
            summary: ev.summary || "Sin título",
            date: crDate,
            coach: ev.coach || "Unassigned",
            nivel: "",
            estudiantes: ev.estudiantes || "",
            urgente: false,
          };
        }).filter(ev => ev.date && !isNaN(ev.date.getTime()));
        // For coaches, filter to only their classes
        const filtered = role === "coach" && user?.nombre
          ? evs.filter(ev => ev.coach === user.nombre)
          : evs;
        setCache(c => ({ ...c, [weekOffset]: filtered }));
        setLoading(false);
      } else {
        // Fallback to Google Calendar iCal
fetch(EDGE_URL, { headers: { "Authorization": "Bearer " + ANON_KEY, "apikey": ANON_KEY } })
        .then(r => r.text())
        .then(text => {
          if (!text || !text.includes("VCALENDAR")) { setError("No se pudo cargar el calendario."); setLoading(false); return; }
          setCache(c => ({ ...c, [weekOffset]: parseICal(text) }));
          setLoading(false);
        })
        .catch(() => { setError("No se pudo cargar el calendario."); setLoading(false); });
      }
    });
  }, [weekOffset]);

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
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekLabel = weekDates[0].getMonth() === weekDates[5].getMonth()
    ? `${weekDates[0].getDate()}–${weekDates[5].getDate()} ${mo[weekDates[0].getMonth()]}, ${weekDates[0].getFullYear()}`
    : `${weekDates[0].getDate()} ${mo[weekDates[0].getMonth()]} – ${weekDates[5].getDate()} ${mo[weekDates[5].getMonth()]}, ${weekDates[0].getFullYear()}`;

  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", position: "relative" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>Microsoft Teams</p>
          <button onClick={() => setShowCal(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{weekLabel}</h2>
            <span style={{ fontSize: 12, color: C.text3 }}>▾</span>
          </button>
          {showCal && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50 }}>
              <MiniCalendar weekOffset={weekOffset} setWeekOffset={setWeekOffset} onClose={() => setShowCal(false)} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setWeekOffset(w => Math.max(MIN_OFFSET, w - 1))} style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>←</button>
          <button onClick={() => setWeekOffset(w => Math.min(MAX_OFFSET, w + 1))} style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "0.4rem 0.75rem", color: C.text2, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>→</button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", gap: 8 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      )}

      {error && <div style={{ background: "rgba(194,0,0,0.08)", border: `1px solid rgba(194,0,0,0.2)`, borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto" }}>
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
                            <div key={si} title={ev.summary} style={{ background: ev.urgente ? "rgba(194,0,0,0.08)" : C.surface, border: `1px solid ${(ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text3) + "55"}`, borderLeft: `3px solid ${ev.urgente ? URGENTE_COLOR : coachColors[ev.coach] || C.text3}`, borderRadius: 8, padding: "0.35rem 0.5rem", marginBottom: si < slots.length - 1 ? 3 : 0, textAlign: "left" }}>
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

      {/* Stats below calendar */}
      {!loading && !error && events.length > 0 && (() => {
        const coachColors = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };
        const coaches = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
        const weekEvents = events;
        const isCoachView = role === "coach";
        const coachN = user?.nombre || "";
        const rateInfo = COACH_RATES[coachN];

        // Month total for coach
        const now2 = new Date();

        const fmtMoney = (count) => {
          if (!rateInfo) return "—";
          const total = count * rateInfo.rate;
          return rateInfo.currency === "$"
            ? `$${total.toLocaleString()}`
            : `₡${total.toLocaleString("es-CR")}`;
        };

        if (isCoachView) {
          const myWeekEvents = weekEvents.filter(ev => ev.coach === coachN);
          return (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <StatCard label="Week" value={`${weekDates[0].getDate()}/${weekDates[0].getMonth()+1}`} sub={weekDates[0].getFullYear()} />
                <StatCard label="Number of classes" value={myWeekEvents.length} sub="This week" />
                <StatCard label="Week total" value={fmtMoney(myWeekEvents.length)} sub={rateInfo?.iva ? "IVA included" : "+ IVA"} />
                <StatCard label="Month total" value={fmtMoney(monthEvents.length)} sub={now2.toLocaleString("en",{month:"long"})} />
              </div>
            </div>
          );
        }

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
            <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              {coaches.filter(c => byCoach[c] > 0).map((coach, i, arr) => (
                <div key={coach} style={{ padding: "0.8rem 1.25rem", display: "flex", alignItems: "center", gap: "0.9rem", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: coachColors[coach]+"22", border: `1px solid ${coachColors[coach]}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: coachColors[coach] }}>{coach[0]}</p>
                  </div>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{coach}</p>
                  <div style={{ flex: 2, margin: "0 0.75rem" }}>
                    <ProgressBar value={byCoach[coach]} max={maxVal} color={coachColors[coach]} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: coachColors[coach], minWidth: 20, textAlign: "right" }}>{byCoach[coach]}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

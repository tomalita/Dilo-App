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

// ── MY HOURS VIEW ─────────────────────────────────────────────
// Coach-only: monthly class counter with weekly breakdown + earnings.
export function MyHoursView({ user }) {
  const [coachName,   setCoachName]   = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [events,      setEvents]      = useState(null);
  const [liveRate,    setLiveRate]    = useState(null);
  const [liveIva,     setLiveIva]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    supabase.from("profiles").select("nombre").eq("id", user?.id).single()
      .then(({ data }) => { if (data?.nombre) setCoachName(data.nombre.split(" ")[0]); });
  }, [user?.id]);

  useEffect(() => {
    if (!coachName) return;
    supabase.from("coach_rates").select("rate, iva").eq("coach_name", coachName).single()
      .then(({ data }) => {
        if (data?.rate != null) setLiveRate(parseFloat(data.rate));
        if (data?.iva != null)  setLiveIva(data.iva);
      });
  }, [coachName]);

  const getMonthBounds = (off) => {
    const n = new Date();
    const d = new Date(n.getFullYear(), n.getMonth() + off, 1);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59),
             year: d.getFullYear(), month: d.getMonth() };
  };
  const { start, end, year, month } = getMonthBounds(monthOffset);
  const MO_NAMES = MONTHS_LONG;

  useEffect(() => {
    if (!coachName) return;
    setLoading(true); setError(null); setEvents(null);
    fetch(EDGE_URL, {
      method:"POST",
      headers:{ Authorization:"Bearer "+ANON_KEY, apikey:ANON_KEY, "Content-Type":"application/json" },
      body: JSON.stringify({ source:"teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() })
    }).then(r=>r.json()).then(d => {
      if (!Array.isArray(d)) throw new Error();
      setEvents(d.map(ev=>({ ...ev, date: toCRDate(ev.start) }))
        .filter(ev => !isNaN(ev.date.getTime()) && ev.coach?.trim() === coachName));
    }).catch(()=>setError("No se pudo cargar el calendario."))
    .finally(()=>setLoading(false));
  }, [coachName, monthOffset]);

  const weeks = React.useMemo(() => {
    if (!events) return [];
    const map = new Map();
    events.forEach(ev => {
      const d = new Date(ev.date), day = d.getDay();
      d.setDate(d.getDate() - (day===0?6:day-1)); d.setHours(0,0,0,0);
      const key = d.toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, { mon: new Date(d), count: 0 });
      map.get(key).count++;
    });
    return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,{mon,count}])=>{
      const sat = new Date(mon); sat.setDate(mon.getDate()+5);
      return { mon, sat, count };
    });
  }, [events]);

  const rateInCRC = liveRate;
  const hasIva    = liveIva ?? true;
  const calc = (n) => {
    if (!rateInCRC) return { net:0, iva:0, total:0 };
    const net = n * rateInCRC, iva = hasIva ? net*IVA_RATE : 0;
    return { net, iva, total: net+iva };
  };
  const fmtC = n => `₡${Math.round(n).toLocaleString("es-CR")}`;
  const fmtWk = (mon,sat) => {
    const mo = MONTHS_SHORT;
    return mon.getMonth()===sat.getMonth()
      ? `${mon.getDate()}–${sat.getDate()} ${mo[mon.getMonth()]}`
      : `${mon.getDate()} ${mo[mon.getMonth()]}–${sat.getDate()} ${mo[sat.getMonth()]}`;
  };

  const totalClasses = weeks.reduce((s,w)=>s+w.count, 0);
  const { net:tNet, iva:tIva, total:tTotal } = calc(totalClasses);

  // Quincenas: pagos son quincenales — Q1 = día 1–15, Q2 = 16–fin de mes
  const q1Count = (events || []).filter(ev => ev.date.getDate() <= 15).length;
  const q2Count = (events || []).length - q1Count;
  const q1Total = calc(q1Count).total;
  const q2Total = calc(q2Count).total;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const thSty = (align="right") => ({
    padding:"0.6rem 1rem", fontSize:10, fontWeight:800, color:C.text3,
    letterSpacing:"0.07em", textTransform:"uppercase",
    textAlign:align, borderBottom:`1px solid ${C.border}`,
    background:C.surface2, whiteSpace:"nowrap",
  });
  const tdSty = (align="right") => ({
    padding:"0.75rem 1rem", textAlign:align, verticalAlign:"middle",
  });

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"clip", padding:"1.25rem",
      paddingLeft:"max(1.25rem,env(safe-area-inset-left))",
      paddingRight:"max(1.25rem,env(safe-area-inset-right))",
      paddingBottom:"max(1.5rem,env(safe-area-inset-bottom))",
      scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>

      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.5rem", maxWidth:600 }}>
        <button onClick={()=>setMonthOffset(p=>p-1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
        <span style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:C.text }}>
          {MO_NAMES[month]} {year}
        </span>
        <button onClick={()=>setMonthOffset(p=>p+1)}
          style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
      </div>

      {loading && (
        <div style={{ maxWidth:600, display:"flex", justifyContent:"center", padding:"3rem 0", gap:8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.text3,
              animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      )}
      {error && <p style={{ color:"#d95f5f", fontSize:13, marginBottom:"1rem" }}>{error}</p>}

      {/* Desglose quincenal — pagos son quincenales */}
      {!loading && events && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"0.75rem", marginBottom:"1rem", maxWidth:600 }}>
          {[
            { label:`${MONTHS_SHORT[month]} 1–15`,  sub:"First payment",  count:q1Count, amount:q1Total },
            { label:`${MONTHS_SHORT[month]} 16–${lastDay}`, sub:"Second payment", count:q2Count, amount:q2Total },
            { label:"Month total", sub:`${MO_NAMES[month]} ${year}`, count:totalClasses, amount:tTotal, accent:true },
          ].map((c,i) => (
            <div key={i} style={{ ...CARD, borderRadius:14, padding:"1rem 1.1rem",
              border: c.accent ? "1px solid rgba(37,211,102,0.3)" : undefined }}>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:6 }}>{c.label}</p>
              <p style={{ fontSize:"clamp(1.1rem,4vw,1.4rem)", fontWeight:900, letterSpacing:"-0.02em", color: c.accent ? C.green : C.text, lineHeight:1.1 }}>{fmtC(c.amount)}</p>
              <p style={{ fontSize:11, color:C.text3, marginTop:4 }}>{c.count} hr{c.count!==1?"s":""}{c.sub ? ` · ${c.sub}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && events && (
        <div style={{ ...CARD, borderRadius:14, overflowX:"auto", WebkitOverflowScrolling:"touch", maxWidth:600 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:380 }}>
            <thead>
              <tr>
                <th style={{ ...thSty("left"), position:"sticky", left:0 }}>Week</th>
                <th style={thSty()}>Classes</th>
                <th style={thSty()}>Net</th>
                <th style={thSty()}>IVA 2%</th>
                <th style={thSty()}>Total</th>
              </tr>
            </thead>
            <tbody>
              {weeks.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:"2.5rem", textAlign:"center", color:C.text3, fontSize:13 }}>No classes recorded this month.</td></tr>
              ) : weeks.map((w, i) => {
                const { net, iva, total } = calc(w.count);
                return (
                  <tr key={i} style={{ borderBottom: i < weeks.length-1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ ...tdSty("left"), position:"sticky", left:0, background:C.surface2, fontWeight:600, fontSize:13, color:C.text, whiteSpace:"nowrap" }}>{fmtWk(w.mon,w.sat)}</td>
                    <td style={{ ...tdSty(), fontSize:13, fontWeight:700, color:C.text }}>{w.count}</td>
                    <td style={{ ...tdSty(), fontSize:12, fontWeight:600, color:C.text2 }}>{fmtC(net)}</td>
                    <td style={{ ...tdSty(), fontSize:12, color:C.text3 }}>{fmtC(iva)}</td>
                    <td style={{ ...tdSty(), fontSize:14, fontWeight:800, color:C.green }}>{fmtC(total)}</td>
                  </tr>
                );
              })}
              {weeks.length > 0 && (
                <tr style={{ borderTop:`1px solid ${C.border2}`, background:C.surface2 }}>
                  <td style={{ ...tdSty("left"), position:"sticky", left:0, background:C.surface2, fontSize:11, fontWeight:800, color:C.text2, letterSpacing:"0.08em", textTransform:"uppercase" }}>Total</td>
                  <td style={{ ...tdSty(), fontSize:14, fontWeight:900, color:C.text }}>{totalClasses}</td>
                  <td style={{ ...tdSty(), fontSize:13, fontWeight:700, color:C.text2 }}>{fmtC(tNet)}</td>
                  <td style={{ ...tdSty(), fontSize:12, color:C.text3 }}>{fmtC(tIva)}</td>
                  <td style={{ ...tdSty(), fontSize:16, fontWeight:900, color:C.green }}>{fmtC(tTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


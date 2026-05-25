import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ADMIN DASHBOARD
function AdminDashboard() {
  const [teamsEvents, setTeamsEvents] = useState([]);
  const [classFeedbacks, setClassFeedbacks] = useState([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filter — default: this month
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(() => getWeekRange().from);
  const [dateTo,   setDateTo]   = useState(() => getWeekRange().to);

  const COACHES = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
  const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  useEffect(() => {
    const from = new Date(dateFrom); from.setHours(0,0,0,0);
    const to = new Date(dateTo); to.setHours(23,59,59,999);

    setLoading(true);

    // Fetch Teams events
    const p1 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: from.toISOString(), endDateTime: to.toISOString() })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []).catch(()=>[]);

    // Fetch Class Feedbacks
    const p2 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_CLASS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    // Fetch Student Feedbacks
    const p3 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_STUDENT })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    // Fetch Surveys
    const p4 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_SURVEYS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    Promise.all([p1,p2,p3,p4]).then(([ev,cf,sf,sv]) => {
      setTeamsEvents(ev);
      // Filter sheets by date range
      const inRange = (r) => {
        if (!r.fecha) return true;
        const raw = r.fecha.split(",")[0].trim(); // "22/5/2026"
        const [d,m,y] = raw.split("/");
        const dt = new Date(+y, +m-1, +d);
        return dt >= from && dt <= to;
      };
      setClassFeedbacks(cf.filter(inRange));
      setStudentFeedbacks(sf.filter(inRange));
      setSurveys(sv.filter(inRange));
      setLoading(false);
    });
  }, [dateFrom, dateTo]);

  // Compute stats per coach
  const coachStats = COACHES.map(coach => {
    const coachSurveys = surveys.filter(r => r.coach === coach);
    const ratingFields = ["practica","sentimiento","gramatica","practicar_mas"];
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
    classes:   teamsEvents.length,
    classFb:   classFeedbacks.length,
    studentFb: studentFeedbacks.length,
    surveys:   surveys.length,
  };

  const maxClasses = Math.max(...coachStats.map(c => c.classes), 1);

  return (
    <div style={{ maxWidth: 900, width: "100%" }}>
      {/* Header + date filter */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", marginBottom:"1.5rem" }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Dilo Club</p>
          <h2 style={{ fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text }}>Dashboard</h2>
        </div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.45rem 0.75rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
          <span style={{ fontSize:11, color:C.text3 }}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"0.45rem 0.75rem", fontSize:12, color:C.text, fontFamily:"inherit", outline:"none" }} />
        </div>
      </div>

      {/* Top totals */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Classes", value: loading?"—":totals.classes, sub:"Teams calendar" },
          { label:"Class Feedbacks", value: loading?"—":totals.classFb, sub:"Sent by coaches" },
          { label:"Student Feedbacks", value: loading?"—":totals.studentFb, sub:"Individual notes" },
          { label:"Student Surveys", value: loading?"—":totals.surveys, sub:"Received from students" },
        ].map((s,i) => (
          <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>{s.label}</p>
            <p style={{ fontSize:"clamp(1.8rem,6vw,2.6rem)", fontWeight:900, letterSpacing:"-0.04em", color:C.text, lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11, color:C.text3, marginTop:4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-coach breakdown */}
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>By coach</p>
      <div style={{ overflowX:"auto", marginBottom:"1.5rem", WebkitOverflowScrolling:"touch" }}>
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", minWidth:520 }}>
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 72px 72px 72px 90px", gap:"0.5rem", padding:"0.6rem 1.25rem", borderBottom:`1px solid ${C.border}` }}>
          {["Coach","Classes","Class FB","Stud. FB","Surveys","Status"].map((h,i) => (
            <p key={i} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, textAlign:i>1?"center":"left" }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ display:"flex", gap:6, padding:"1.5rem" }}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>
        ) : coachStats.map((cs, i) => {
          // Find missing class feedbacks — cross Teams events vs Sheet entries
          const coachEvents = teamsEvents.filter(ev => ev.coach === cs.coach);
          const missingFbs = coachEvents.filter(ev => {
            const evDate = ev.date;
            const evHour = evDate.getHours();
            const evMin  = evDate.getMinutes();
            const ampm = evHour >= 12 ? "PM" : "AM";
            const h12  = evHour % 12 || 12;
            const timeStr = `${h12}:${evMin.toString().padStart(2,"0")} ${ampm}`;
            const dateStr = `${evDate.getDate()}/${evDate.getMonth()+1}/${evDate.getFullYear()}`;
            // A feedback exists if there's ANY entry for this coach+date+hour
            // No show (all scores = 1) is still a valid feedback
            const hasFb = classFeedbacks.some(fb => {
              if (fb.coach !== cs.coach) return false;
              if (!fb.fecha) return false;
              const raw = fb.fecha.split(",")[0].trim();
              const parts = raw.split("/");
              if (parts.length < 3) return false;
              const [d,m,y] = parts;
              const fbDate = `${+d}/${+m}/${+y}`;
              if (fbDate !== `${evDate.getDate()}/${evDate.getMonth()+1}/${evDate.getFullYear()}`) return false;
              const fbHour = (fb.hora_clase||"").trim().replace(/\s+/g," ").toUpperCase();
              const evHourStr = timeStr.toUpperCase();
              return fbHour === evHourStr;
            });
            return !hasFb;
          });
          const covered = cs.classes > 0 && missingFbs.length === 0;
          return (
            <div key={cs.coach} style={{ borderBottom: i<coachStats.length-1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 72px 72px 72px 90px", gap:"0.5rem", padding:"0.8rem 1.25rem", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:(COACH_COLORS[cs.coach]||C.text3)+"22", border:`1px solid ${(COACH_COLORS[cs.coach]||C.text3)}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:9, fontWeight:700, color:COACH_COLORS[cs.coach]||C.text3 }}>{cs.coach[0]}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{cs.coach}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(240,236,224,0.06)" }}>
                    <div style={{ height:"100%", width:`${(cs.classes/maxClasses)*100}%`, borderRadius:2, background:COACH_COLORS[cs.coach]||C.text3, transition:"width 0.4s" }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:COACH_COLORS[cs.coach]||C.text2, minWidth:20, textAlign:"right" }}>{cs.classes}</span>
                </div>
                {[cs.classFb, cs.studentFb, cs.surveys].map((v,j) => (
                  <div key={j} style={{ textAlign:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: v===0 ? C.text3 : C.text }}>{v}</span>
                  </div>
                ))}
                <div style={{ textAlign:"center" }}>
                  {cs.classes > 0 && (
                    <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:50,
                      background: "transparent",
                      color: C.text2,
                      border:`1px solid ${covered ? C.green : C.amber}`,
                      letterSpacing:"0.08em", textTransform:"uppercase"
                    }}>
                      {covered ? "complete" : `${missingFbs.length} missing`}
                    </span>
                  )}
                </div>
              </div>
              {/* Missing feedbacks detail */}
              {!covered && missingFbs.length > 0 && (
                <div style={{ padding:"0 1.25rem 0.75rem", display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
                  {missingFbs.map((ev,mi) => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const evDay = new Date(ev.date); evDay.setHours(0,0,0,0);
                    const isToday = evDay.getTime() === today.getTime();
                    const isPast  = evDay < today;
                    const label = `${ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} ${ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})} · ${ev.estudiantes?.split(",")[0] || ev.summary}`;
                    return (
                      <span key={mi} style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:50,
                        background: "rgba(240,236,224,0.04)",
                        color: C.text2,
                        border:`1px solid ${C.border2}`,
                        display:"inline-flex", alignItems:"center", gap:5
                      }}>
                        {label}
                        <span style={{fontSize:10, color:C.amber}}>⚠</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      <p style={{ fontSize:10, color:C.text3 }}>Coverage = class feedbacks submitted vs classes assigned this period</p>
    </div>
  );
}

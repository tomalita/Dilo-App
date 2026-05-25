import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// COACH DASHBOARD
function CoachDashboard({ user }) {
  const [teamsEvents, setTeamsEvents] = useState([]);
  const [monthEvents, setMonthEvents] = useState([]);
  const [classFeedbacks, setClassFeedbacks] = useState([]);
  const [allSurveys, setAllSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState(user?.nombre || "");

  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now); monday.setDate(now.getDate() - (day===0?6:day-1)); monday.setHours(0,0,0,0);
  const saturday = new Date(monday); saturday.setDate(monday.getDate()+5); saturday.setHours(23,59,59,999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59);

  const COACHES = ["Ana","Ricardo","Jesse","Gabriela","Mafer"];
  const COACH_COLORS = { Ana:"#f4a7b9", Ricardo:"#4fc3f7", Jesse:"#b7e4a0", Gabriela:"#ce93d8", Mafer:"#1a73e8" };

  useEffect(() => {
    supabase.from("profiles").select("nombre").eq("id", user.id).single()
      .then(({ data }) => { if (data?.nombre) setCoachName(data.nombre); });

    // Week events
    const p1 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: monday.toISOString(), endDateTime: saturday.toISOString() })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []).catch(()=>[]);

    // Month events (for month total)
    const p1m = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"teams", startDateTime: monthStart.toISOString(), endDateTime: monthEnd.toISOString() })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d.map(ev=>({...ev, date: new Date(new Date(ev.start).getTime()-6*60*60*1000)})).filter(ev=>!isNaN(ev.date)) : []).catch(()=>[]);

    const p2 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_CLASS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    const p3 = fetch(EDGE_URL, {
      method:"POST",
      headers:{"Authorization":"Bearer "+ANON_KEY,"apikey":ANON_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({ source:"sheets", sheetId: SHEET_SURVEYS })
    }).then(r=>r.json()).then(d => Array.isArray(d) ? d : []).catch(()=>[]);

    Promise.all([p1,p1m,p2,p3]).then(([ev,evm,cf,sv]) => {
      setTeamsEvents(ev);
      setMonthEvents(evm);
      setClassFeedbacks(cf);
      setAllSurveys(sv);
      setLoading(false);
    });
  }, []);

  const myClasses = teamsEvents.filter(ev => ev.coach === coachName);
  const myMonthClasses = monthEvents.filter(ev => ev.coach === coachName);

  // Feedback due = classes without a feedback entry
  const getMissingFbs = (classList) => classList.filter(ev => {
    const evHour = ev.date.getHours();
    const ampm = evHour >= 12 ? "PM" : "AM";
    const h12 = evHour % 12 || 12;
    const timeStr = `${h12}:${ev.date.getMinutes().toString().padStart(2,"0")} ${ampm}`;
    return !classFeedbacks.some(fb => {
      if (fb.coach !== coachName) return false;
      if (!fb.fecha) return false;
      const raw = fb.fecha.split(",")[0].trim();
      const parts = raw.split("/");
      if (parts.length < 3) return false;
      const [d,m,y] = parts;
      if (`${+d}/${+m}/${+y}` !== `${ev.date.getDate()}/${ev.date.getMonth()+1}/${ev.date.getFullYear()}`) return false;
      return (fb.hora_clase||"").trim().toUpperCase() === timeStr.toUpperCase();
    });
  });

  const missingFbs = getMissingFbs(myClasses);
  const missingMonthFbs = getMissingFbs(myMonthClasses);

  // Ranking
  const getRating = (coach) => {
    const surveys = allSurveys.filter(s => s.coach === coach);
    if (!surveys.length) return 0;
    const fields = ["practica","sentimiento","gramatica","practicar_mas"];
    let sum = 0, count = 0;
    surveys.forEach(s => fields.forEach(f => { const v = +s[f]; if (v > 0) { sum += v; count++; } }));
    return count > 0 ? sum/count : 0;
  };
  const rankings = COACHES.map(c => ({ coach: c, rating: getRating(c) })).sort((a,b) => b.rating - a.rating);
  const myRank = rankings.findIndex(r => r.coach === coachName) + 1;
  const myRating = getRating(coachName);

  const today = new Date().toDateString();
  const todayClasses = myClasses.filter(ev => ev.date.toDateString() === today).sort((a,b) => a.date - b.date);

  return (
    <div style={{ maxWidth: 700, width:"100%" }}>
      <div style={{ marginBottom:"1.5rem" }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:4 }}>Dilo Club</p>
        <h2 style={{ fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:900, letterSpacing:"-0.03em", color:C.text }}>Dashboard</h2>
      </div>

      {/* Ranking card */}
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:"1.5rem" }}>
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

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem", marginBottom:"1.25rem" }}>
        {[
          { label:"Classes this week",     value: loading?"—":myClasses.length },
          { label:"Classes this month",    value: loading?"—":myMonthClasses.length },
          { label:"Feedback due this week", value: loading?"—":missingFbs.length, accent: !loading && missingFbs.length > 0 ? C.amber : undefined },
          { label:"Feedback due this month",value: loading?"—":missingMonthFbs.length, accent: !loading && missingMonthFbs.length > 0 ? C.amber : undefined },
        ].map((s,i) => (
          <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:"1rem 1.25rem" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.text3, marginBottom:6 }}>{s.label}</p>
            <p style={{ fontSize:"clamp(1.8rem,6vw,2.4rem)", fontWeight:900, letterSpacing:"-0.04em", color:s.accent||C.text, lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Missing feedbacks detail */}
      {!loading && missingFbs.length > 0 && (
        <div style={{ background:"rgba(202,154,4,0.06)", border:`1px solid ${C.amber}44`, borderRadius:14, padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.amber, marginBottom:"0.6rem" }}>⚠ {missingFbs.length} feedback{missingFbs.length>1?"s":""} pending this week</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
            {missingFbs.map((ev,i) => (
              <span key={i} style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:50, background:"transparent", color:C.text2, border:`1px solid ${C.border2}` }}>
                {ev.date.toLocaleDateString("en",{month:"short",day:"numeric"})} {ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today's classes */}
      {!loading && todayClasses.length > 0 && (
        <>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.text3, marginBottom:"0.6rem" }}>Today</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {todayClasses.map((ev,i) => (
              <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${COACH_COLORS[coachName]||C.text3}`, borderRadius:12, padding:"0.75rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.text, minWidth:60 }}>
                  {ev.date.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit",hour12:true})}
                </p>
                <p style={{ fontSize:12, color:C.text3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.estudiantes || ev.summary}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

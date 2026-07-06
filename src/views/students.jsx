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

// ── STUDENTS VIEW ──────────────────────────────────────────────
// CR 2026 holidays that fall on weekdays (Mon–Fri)
const CR_HOLIDAYS = new Set([
  "2026-01-01","2026-04-02","2026-04-03","2026-05-01",
  "2026-08-31","2026-09-15","2026-12-01",
]);
const CLASS_END  = new Date(2026, 11, 18); // Dec 18, 2026 inclusive

function stuCountDays(startDate, endDate, dayNums) {
  if (!dayNums?.length) return 0;
  let n = 0;
  const cur = new Date(startDate);
  while (cur <= endDate && cur <= CLASS_END) {
    if (dayNums.includes(cur.getDay())) {
      const iso = cur.toISOString().split("T")[0];
      if (!CR_HOLIDAYS.has(iso)) n++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

function stuCalc(s, year, month, rateOverride = null) {
  const rate = rateOverride != null ? rateOverride : (parseFloat(s.price_per_hour) || 0);
  const disc = parseFloat(s.discount) || 0;
  const days = s.days ? s.days.split(",").map(Number).filter(Boolean) : [];
  const rateC = s.currency === "USD" ? rate * USD_RATE : rate;
  // Numeric groups always use flat monthly rate (no per-hour counter)
  const isNumericGroup = /^\d+$/.test(String(s.group_number || "").trim());
  if (s.billing_type === "monthly" || (isNumericGroup && s.billing_type !== "package")) {
    const net = rateC * (1 - disc / 100);
    const iva = net * IVA_RATE;
    return { hrs: null, net, iva, total: Math.round(net + iva) };
  }
  if (s.billing_type === "package") {
    return { hrs: null, net: 0, iva: 0, total: 0 };
  }
  const payDay = parseInt(s.pay_day) || 30;
  const start = new Date(year, month - 1, payDay);
  const end   = new Date(year, month, payDay - 1);
  const hrs = stuCountDays(start, end, days);
  const net = hrs * rateC * (1 - disc / 100);
  const iva = net * IVA_RATE;
  return { hrs, net, iva, total: Math.round(net + iva) };
}

const STU_BILLING_START = { year: 2026, month: 6 }; // Junio 2026 — primer mes con datos de billing
const STU_WEEKDAYS  = [{v:1,l:"Mon"},{v:2,l:"Tue"},{v:3,l:"Wed"},{v:4,l:"Thu"},{v:5,l:"Fri"}];
const STU_SCHEDULES = ["Morning","Afternoon","Evening"];
const STU_MONTH_NAMES = MONTHS_LONG;
const STU_BLANK = {
  name:"", email:"", phone:"", group_number:"", level:"A2",
  billing_type:"weekly", days:[], schedule:"Morning", class_time:"09:00",
  company:"Dilo", package_hours:"", package_remaining:"", price_per_hour:"", currency:"CRC",
  discount:"0", pay_day:"30", comments:"",
};

export function StudentsView() {
  const [students,   setStudents]   = useState(null);
  const [billing,    setBilling]    = useState({});
  const [showActive, setShowActive] = useState(true);
  const [payFilter,  setPayFilter]  = useState("all");
  const [mOffset,    setMOffset]    = useState(() => {
    const n = new Date();
    return Math.max(0, (STU_BILLING_START.year - n.getFullYear()) * 12 + (STU_BILLING_START.month - 1 - n.getMonth()));
  });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({ ...STU_BLANK, days: [] });
  const [formSaving, setFormSaving] = useState(false);
  const [delId,      setDelId]      = useState(null);
  const [collapsed,       setCollapsed]       = useState(new Set());
  const [toggling,        setToggling]        = useState({});
  const [overrideEditing, setOverrideEditing] = useState(null); // studentId being edited
  const [overrideInput,   setOverrideInput]   = useState("");
  const [overrideSaving,  setOverrideSaving]  = useState({});

  const now   = new Date();
  const base  = new Date(now.getFullYear(), now.getMonth() + mOffset, 1);
  const year  = base.getFullYear();
  const month = base.getMonth() + 1;
  const ym    = `${year}-${String(month).padStart(2,"0")}`;
  const atMin = year * 12 + month <= STU_BILLING_START.year * 12 + STU_BILLING_START.month;

  useEffect(() => { loadStudents(showActive); }, [showActive]);
  useEffect(() => { if (students) loadBilling(); }, [ym, students]);

  const loadStudents = async (activeOnly = true) => {
    setLoading(true); setError(null);
    const { data, error: e } = await supabase
      .from("students").select("*")
      .eq("active", activeOnly)
      .order("group_number").order("created_at");
    if (e) setError(e.message); else setStudents(data || []);
    setLoading(false);
  };

  const loadBilling = async () => {
    if (!students?.length) return;
    const { data } = await supabase
      .from("student_billing").select("*")
      .in("student_id", students.map(s => s.id))
      .eq("year_month", ym);
    const map = {};
    (data || []).forEach(b => { map[b.student_id] = b; });
    setBilling(map);
  };

  const saveOverride = async (studentId, raw) => {
    const val = raw === "" ? null : parseFloat(raw);
    setOverrideSaving(p => ({ ...p, [studentId]: true }));
    setBilling(p => ({ ...p, [studentId]: { ...(p[studentId] || {}), amount_override: val } }));
    await supabase.from("student_billing").upsert(
      { student_id: studentId, year_month: ym, amount_override: val },
      { onConflict: "student_id,year_month" }
    );
    setOverrideSaving(p => ({ ...p, [studentId]: false }));
    setOverrideEditing(null);
  };

  const togglePaid = async (studentId) => {
    const cur = billing[studentId]?.paid || false;
    const nxt = !cur;
    const today = new Date().toISOString().split("T")[0];
    setToggling(p => ({ ...p, [studentId]: true }));
    setBilling(p => ({ ...p, [studentId]: { ...(p[studentId] || {}), paid: nxt, paid_date: nxt ? today : null } }));
    await supabase.from("student_billing").upsert(
      { student_id: studentId, year_month: ym, paid: nxt, paid_date: nxt ? today : null },
      { onConflict: "student_id,year_month" }
    );
    setToggling(p => ({ ...p, [studentId]: false }));
  };

  const saveStudent = async () => {
    if (!form.name.trim()) return;
    setFormSaving(true);
    const days = Array.isArray(form.days) ? form.days.join(",") : (form.days || "");
    const rawGroup = form.group_number?.trim() || "";
    const payload = {
      name: form.name.trim(), email: form.email?.trim() || null, group_number: rawGroup,
      level: form.level, billing_type: form.billing_type, days,
      schedule: form.schedule, class_time: form.class_time, company: form.company,
      package_hours: form.billing_type === "package" ? (parseInt(form.package_hours) || 0) : null,
      package_remaining: form.billing_type === "package" ? (parseInt(form.package_remaining) ?? parseInt(form.package_hours) ?? null) : null,
      price_per_hour: parseFloat(form.price_per_hour) || 0,
      currency: form.currency, discount: parseFloat(form.discount) || 0,
      pay_day: parseInt(form.pay_day) || 30, comments: form.comments, phone: form.phone?.trim() || null,
      active: modal.mode === "edit" ? Boolean(form.active) : true,
    };
    let err;
    if (modal.mode === "edit") {
      ({ error: err } = await supabase.from("students").update(payload).eq("id", modal.data.id));
    } else {
      ({ error: err } = await supabase.from("students").insert(payload));
    }
    setFormSaving(false);
    if (err) { toast("Error saving student: " + err.message); return; }
    setModal(null); loadStudents();
  };

  const deleteStudent = async (id) => {
    await supabase.from("students").update({ active: false }).eq("id", id);
    setDelId(null); loadStudents(showActive);
  };

  const reactivateStudent = async (id) => {
    await supabase.from("students").update({ active: true }).eq("id", id);
    loadStudents(showActive);
  };

  const groups = React.useMemo(() => {
    if (!students) return [];
    const map = {};
    students.forEach(s => {
      if (payFilter !== "all" && String(s.pay_day) !== payFilter) return;
      const g = s.group_number?.trim() || "Private";
      if (!map[g]) map[g] = [];
      map[g].push(s);
    });
    return Object.entries(map).sort(([a],[b]) => {
      if (a === "Private" && b !== "Private") return 1;
      if (b === "Private" && a !== "Private") return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    }).map(([g, arr]) => [g, arr.slice().sort((a,b) => a.name.localeCompare(b.name))]);
  }, [students, payFilter]);

  const summary = React.useMemo(() => {
    if (!students) return { count: 0, d15:{rev:0,col:0,pen:0}, d30:{rev:0,col:0,pen:0} };
    let d15 = { rev:0, col:0 }, d30 = { rev:0, col:0 };
    students.forEach(s => {
      const { total } = stuCalc(s, year, month, billing[s.id]?.amount_override ?? null);
      const bucket = parseInt(s.pay_day) === 15 ? d15 : d30;
      bucket.rev += total;
      if (billing[s.id]?.paid) bucket.col += total;
    });
    return {
      count: students.length,
      d15: { rev: d15.rev, col: d15.col, pen: d15.rev - d15.col },
      d30: { rev: d30.rev, col: d30.col, pen: d30.rev - d30.col },
    };
  }, [students, billing, year, month]);

  const groupOptions = React.useMemo(() => {
    if (!students) return [];
    const seen = new Set();
    const opts = [];
    students.forEach(s => {
      const g = s.group_number?.trim();
      if (g && /^\d+$/.test(g) && !seen.has(g)) { seen.add(g); opts.push(g); }
    });
    return opts.sort((a,b) => a.localeCompare(b, undefined, { numeric:true }));
  }, [students]);

  const fmtC = n => `₡${Math.round(n).toLocaleString("es-CR")}`;
  const fmtDays = str => {
    if (!str) return "—";
    return str.split(",").map(Number).filter(Boolean)
      .map(n => ["","Mo","Tu","We","Th","Fr"][n] || "").join(" ");
  };

  const openAdd  = () => { setForm({ ...STU_BLANK, days: [] }); setModal({ mode: "add", data: null }); };
  const openEdit = s => {
    setForm({
      ...s,
      active: s.active !== false,
      days: s.days ? s.days.split(",").map(Number).filter(Boolean) : [],
      discount: String(s.discount ?? 0),
      pay_day: String(s.pay_day ?? 30),
      price_per_hour: String(s.price_per_hour ?? ""),
      package_hours: String(s.package_hours ?? ""),
      package_remaining: String(s.package_remaining ?? s.package_hours ?? ""),
    });
    setModal({ mode: "edit", data: s });
  };
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleDay = d => setForm(p => {
    const cur = Array.isArray(p.days) ? p.days : [];
    return { ...p, days: cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort((a,b) => a-b) };
  });

  const applyGroup = (g) => {
    const ref = students?.find(s => s.group_number?.trim() === g);
    if (!ref) { setF("group_number", g); return; }
    setForm(p => ({
      ...p,
      group_number:  g,
      billing_type:  ref.billing_type  || p.billing_type,
      days:          ref.days ? ref.days.split(",").map(Number).filter(Boolean) : p.days,
      level:         ref.level         || p.level,
      schedule:      ref.schedule      || p.schedule,
      class_time:    ref.class_time    || p.class_time,
      company:       ref.company       || p.company,
      price_per_hour: ref.price_per_hour != null ? String(ref.price_per_hour) : p.price_per_hour,
      currency:      ref.currency      || p.currency,
      pay_day:       ref.pay_day != null ? String(ref.pay_day) : p.pay_day,
    }));
  };

  const inputSty = { width:"100%", background:C.surface2, border:`1px solid ${C.border2}`,
    borderRadius:8, padding:"0.45rem 0.65rem", color:C.text, fontSize:13,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const labelSty = { fontSize:11, fontWeight:700, color:C.text3, marginBottom:4,
    textTransform:"uppercase", letterSpacing:"0.06em", display:"block" };
  const chipSty = (active) => ({
    ...SEL(), padding:"0.28rem 0.6rem", fontSize:12, textAlign:"center",
    color: active ? C.text : C.text3,
    border: `1px solid ${active ? C.accent : C.border}`,
  });

  const TCOLS = "180px 110px 45px 90px 60px 95px 50px 80px 1fr 60px";

  const SummCard = ({ label, value, color = C.text }) => (
    <div style={{ ...CARD, borderRadius:12, padding:"0.85rem 1.1rem", flex:1, minWidth:130 }}>
      <p style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:"0.07em",
        textTransform:"uppercase", marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:17, fontWeight:900, color }}>{value}</p>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"clip", padding:"1.25rem",
      paddingLeft:"max(1.25rem,env(safe-area-inset-left))",
      paddingRight:"max(1.25rem,env(safe-area-inset-right))",
      paddingBottom:"max(1.5rem,env(safe-area-inset-bottom))",
      scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>

      {/* Month nav + filters + Add */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flex:1, minWidth:200 }}>
          <button onClick={() => !atMin && setMOffset(p => p-1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor: atMin ? "default" : "pointer", lineHeight:1, flexShrink:0, opacity: atMin ? 0.25 : 1 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:C.text, flex:1, textAlign:"center" }}>
            {STU_MONTH_NAMES[month-1]} {year}
          </span>
          <button onClick={() => setMOffset(p => p+1)}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {[[true,"Active"],[false,"Inactive"]].map(([v,l]) => (
            <button key={l} onClick={() => setShowActive(v)}
              style={{ ...SEL(), padding:"0.4rem 0.65rem", fontSize:12,
                color: showActive===v ? C.text : C.text3,
                border: `1px solid ${showActive===v ? C.accent : C.border}`,
                fontWeight: showActive===v ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        <div style={{ width:1, height:20, background:C.border, flexShrink:0 }} />
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {[["all","All"],["15","Day 15"],["30","Day 30"]].map(([v,l]) => (
            <button key={v} onClick={() => setPayFilter(v)}
              style={{ ...SEL(), padding:"0.4rem 0.65rem", fontSize:12,
                color: payFilter===v ? C.text : C.text3,
                border: `1px solid ${payFilter===v ? C.accent : C.border}`,
                fontWeight: payFilter===v ? 700 : 400 }}>{l}</button>
          ))}
        </div>
        {showActive && (
          <button onClick={openAdd} style={{ ...SEL(), padding:"0.4rem 1rem", color:C.text,
            border:`1px solid ${C.border2}`, flexShrink:0 }}>
            + Add student
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display:"flex", gap:"0.65rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <SummCard label="Students" value={summary.count} />
        {[{label:"Day 15", d:summary.d15},{label:"Day 30", d:summary.d30}].map(({label,d}) => (
          <div key={label} style={{ ...CARD, borderRadius:12, padding:"0.85rem 1.1rem", flex:1, minWidth:180 }}>
            <p style={{ fontSize:10, fontWeight:800, color:C.text3, letterSpacing:"0.07em",
              textTransform:"uppercase", marginBottom:8 }}>{label}</p>
            <div style={{ display:"flex", gap:"1.1rem", flexWrap:"wrap" }}>
              {[["Expected", fmtC(d.rev), C.text], ["Collected", fmtC(d.col), C.green],
                ["Pending", fmtC(d.pen), d.pen > 0 ? "#d95f5f" : C.text3]].map(([lbl,val,col]) => (
                <div key={lbl}>
                  <p style={{ fontSize:10, color:C.text3, marginBottom:2 }}>{lbl}</p>
                  <p style={{ fontSize:14, fontWeight:800, color:col }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color:"#d95f5f", fontSize:13, marginBottom:"1rem" }}>{error}</p>}

      {loading && !students && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"3rem 0", gap:6, width:"100%" }}>
          {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.text3,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      )}

      {/* Groups */}
      {groups.map(([groupNum, gStudents]) => {
        const isCol = collapsed.has(groupNum);
        const effTotal = st => stuCalc(st, year, month, billing[st.id]?.amount_override ?? null).total;
        const gTotal = gStudents.reduce((s, st) => s + effTotal(st), 0);
        const gPaid  = gStudents.reduce((s, st) => s + (billing[st.id]?.paid ? effTotal(st) : 0), 0);
        return (
          <div key={groupNum} style={{ marginBottom:"1.25rem" }}>
            {/* Group header */}
            <div onClick={() => setCollapsed(p => { const s = new Set(p); s.has(groupNum) ? s.delete(groupNum) : s.add(groupNum); return s; })}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"0.65rem 1rem", background:C.surface2, cursor:"pointer",
                borderRadius: isCol ? 12 : "12px 12px 0 0",
                border:`1px solid ${C.border}`, userSelect:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <span style={{ fontSize:13, fontWeight:800, color:C.text }}>
                  {/^\d+$/.test(groupNum) ? `Group ${groupNum}` : groupNum}
                </span>
                <span style={{ fontSize:11, color:C.text3 }}>{gStudents.length} student{gStudents.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <span style={{ fontSize:12, fontWeight:700, color: gPaid >= gTotal && gTotal > 0 ? C.green : gTotal > 0 ? "#d95f5f" : C.text3 }}>
                  {fmtC(gTotal)}
                </span>
                <span style={{ fontSize:14, color:C.text3, transition:"transform 0.2s",
                  display:"inline-block", transform: isCol ? "rotate(0deg)" : "rotate(90deg)" }}>›</span>
              </div>
            </div>

            {/* Table */}
            {!isCol && (
              <div style={{ ...CARD, borderRadius:"0 0 12px 12px", overflowX:"auto",
                WebkitOverflowScrolling:"touch", borderTop:"none" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:780 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                      {["Student","Days / Pkg","Hrs","Rate","Disc","Total","Pay day","Paid","Comments",""].map((h,i) => (
                        <th key={i} style={{ padding:"0.6rem 1rem", fontSize:10, fontWeight:800, color:C.text3,
                          letterSpacing:"0.07em", textTransform:"uppercase", textAlign:"left", background:C.surface2,
                          whiteSpace:"nowrap", position: i===0 ? "sticky" : "static", left: i===0 ? 0 : "auto" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gStudents.map((s, i) => {
                      const rateOv = billing[s.id]?.amount_override ?? null;
                      const { hrs, total } = stuCalc(s, year, month, rateOv);
                      const isPaid = billing[s.id]?.paid || false;
                      const rateLabel = s.currency === "USD"
                        ? `$${parseFloat(s.price_per_hour||0).toLocaleString("en-US")}`
                        : `₡${Math.round(parseFloat(s.price_per_hour||0)).toLocaleString("es-CR")}`;
                      return (
                        <tr key={s.id} style={{ borderBottom: i < gStudents.length-1 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding:"0.7rem 1rem", position:"sticky", left:0, background:C.surface2, whiteSpace:"nowrap" }}>
                            <p style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{s.name}</p>
                            {s.level && <p style={{ fontSize:10, color:C.text3 }}>{s.level}</p>}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:11, fontWeight:600, color:C.text2, whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? `${s.package_hours}h pkg` : s.billing_type === "monthly" ? `${fmtDays(s.days)} fixed` : fmtDays(s.days)}
                          </td>
                          <td style={{ padding:"0.7rem 1rem" }}>
                            {s.billing_type === "package" ? (() => {
                              const rem  = parseInt(s.package_remaining ?? s.package_hours) || 0;
                              const tot  = parseInt(s.package_hours) || 1;
                              const pct  = Math.min(100, Math.round(rem / tot * 100));
                              const col  = pct > 40 ? C.green : pct > 15 ? C.amber : "#d95f5f";
                              return (
                                <div>
                                  <p style={{ fontSize:12, fontWeight:800, color:col, lineHeight:1 }}>{rem}h</p>
                                  <p style={{ fontSize:9, color:C.text3, marginBottom:2 }}>/{tot}h</p>
                                  <div style={{ height:3, borderRadius:2, background:C.border, overflow:"hidden" }}>
                                    <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:2 }} />
                                  </div>
                                </div>
                              );
                            })() : (
                              <p style={{ fontSize:13, fontWeight:700, color: hrs > 0 ? C.text : C.text3 }}>{hrs || "—"}</p>
                            )}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? (
                              <span style={{ fontSize:12, fontWeight:600, color:C.text2 }}>{rateLabel}</span>
                            ) : overrideEditing === s.id ? (
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <input autoFocus type="number" min="0" value={overrideInput}
                                  onChange={e => setOverrideInput(e.target.value)}
                                  onKeyDown={e => { if (e.key==="Enter") saveOverride(s.id, overrideInput); if (e.key==="Escape") setOverrideEditing(null); }}
                                  style={{ width:76, background:C.surface2, border:`1px solid ${C.amber}`, borderRadius:6,
                                    padding:"0.2rem 0.4rem", color:C.text, fontSize:12, fontFamily:"inherit", outline:"none" }} />
                                <button onClick={() => saveOverride(s.id, overrideInput)}
                                  style={{ background:"none", border:`1px solid ${C.green}55`, borderRadius:6,
                                    padding:"0.15rem 0.4rem", color:C.green, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                                  {overrideSaving[s.id] ? "…" : "OK"}
                                </button>
                                <button onClick={() => setOverrideEditing(null)}
                                  style={{ background:"none", border:"none", color:C.text3, fontSize:13, cursor:"pointer", padding:"0 2px" }}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <span style={{ fontSize:12, fontWeight:600, color: rateOv != null ? C.amber : C.text2 }}>
                                  {rateOv != null ? fmtC(rateOv) : rateLabel}
                                </span>
                                <button onClick={() => { setOverrideEditing(s.id); setOverrideInput(rateOv != null ? String(rateOv) : String(parseFloat(s.price_per_hour||0))); }}
                                  style={{ background:"none", border:`1px solid ${C.amber}66`, borderRadius:4,
                                    color:C.amber, fontSize:10, cursor:"pointer", padding:"1px 4px", lineHeight:1.4 }}>✏</button>
                                {rateOv != null && (
                                  <button onClick={() => saveOverride(s.id, "")}
                                    style={{ background:"none", border:"none", color:"#d95f5f", fontSize:11, cursor:"pointer", padding:"0 2px" }}>↺</button>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:12, color: parseFloat(s.discount)>0 ? C.amber : C.text3, whiteSpace:"nowrap" }}>
                            {parseFloat(s.discount)>0 ? `-${s.discount}%` : "—"}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:13, fontWeight:800, color: total>0 ? C.green : C.text3, whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? <span style={{ fontSize:11, color:C.text3 }}>Prepaid</span> : total>0 ? fmtC(total) : "—"}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:11, color:C.text3, whiteSpace:"nowrap" }}>
                            {s.billing_type === "package" ? "—" : `Day ${s.pay_day||30}`}
                          </td>
                          <td style={{ padding:"0.7rem 1rem" }}>
                            {s.billing_type === "package" ? (
                              <span style={{ fontSize:10, fontWeight:700, color:C.text3 }}>—</span>
                            ) : (
                              <div onClick={() => !toggling[s.id] && togglePaid(s.id)}
                                style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
                                <div style={{ width:34, height:19, borderRadius:10,
                                  background: isPaid ? C.green : C.surface2,
                                  border:`1px solid ${isPaid ? C.green : C.border2}`,
                                  position:"relative", flexShrink:0, transition:"background 0.18s" }}>
                                  <div style={{ position:"absolute", top:2,
                                    left: isPaid ? 16 : 2, width:13, height:13,
                                    borderRadius:"50%", transition:"left 0.18s",
                                    background: isPaid ? "#fff" : C.text3 }} />
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, color: isPaid ? C.green : C.text3 }}>
                                  {isPaid ? "Paid" : "Pend."}
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding:"0.7rem 1rem", fontSize:11, color:C.text3, fontStyle:"italic",
                            maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {s.comments || ""}
                          </td>
                          <td style={{ padding:"0.7rem 1rem" }}>
                            {showActive ? (
                              <div style={{ display:"flex", gap:4 }}>
                                <button onClick={() => openEdit(s)}
                                  style={{ ...SEL(), padding:"0.2rem 0.45rem", fontSize:11,
                                    color:C.amber, border:`1px solid ${C.amber}44` }}>✏</button>
                                <button onClick={() => setDelId(s.id)}
                                  style={{ ...SEL(), padding:"0.2rem 0.45rem", fontSize:11,
                                    color:"#d95f5f", border:`1px solid #d95f5f44` }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => reactivateStudent(s.id)}
                                style={{ ...SEL(), padding:"0.2rem 0.55rem", fontSize:10,
                                  color:C.green, border:`1px solid ${C.green}44`, whiteSpace:"nowrap" }}>↩ Reactivar</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:C.surface2, borderTop:`1px solid ${C.border2}` }}>
                      <td style={{ padding:"0.65rem 1rem", fontSize:11, fontWeight:800, color:C.text2,
                        letterSpacing:"0.08em", textTransform:"uppercase", position:"sticky", left:0, background:C.surface2 }}>Total</td>
                      <td /><td /><td /><td />
                      <td style={{ padding:"0.65rem 1rem", fontSize:13, fontWeight:900, color:C.text, whiteSpace:"nowrap" }}>{fmtC(gTotal)}</td>
                      <td />
                      <td style={{ padding:"0.65rem 1rem" }}>
                        <p style={{ fontSize:10, fontWeight:700, color:C.green }}>{fmtC(gPaid)} paid</p>
                        {gTotal - gPaid > 0 && <p style={{ fontSize:10, fontWeight:700, color:"#d95f5f" }}>{fmtC(gTotal-gPaid)} due</p>}
                      </td>
                      <td /><td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {students?.length === 0 && (
        <div style={{ ...CARD, borderRadius:14, padding:"3rem", textAlign:"center" }}>
          <p style={{ color:C.text3, fontSize:13, marginBottom:"1rem" }}>No students yet.</p>
          <button onClick={openAdd} style={{ ...SEL(), padding:"0.5rem 1.25rem", color:C.text }}>+ Add first student</button>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" }}>
          <div style={{ ...CARD, borderRadius:16, padding:"1.5rem", maxWidth:300, width:"100%" }}>
            <p style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:"0.5rem" }}>Remove student?</p>
            <p style={{ fontSize:13, color:C.text3, marginBottom:"1.5rem" }}>They'll be hidden from all views. You can re-add them later.</p>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={() => setDelId(null)} style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center" }}>Cancel</button>
              <button onClick={() => deleteStudent(delId)}
                style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center",
                  color:"#d95f5f", border:`1px solid #d95f5f44` }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)",
          display:"flex", alignItems:"flex-start", justifyContent:"center",
          zIndex:1000, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"1rem" }}>
          <div style={{ ...CARD, borderRadius:18, padding:"1.5rem", width:"100%",
            maxWidth:460, marginTop:"2rem", marginBottom:"2rem" }}>
            <p style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:"1.25rem" }}>
              {modal.mode === "add" ? "New student" : "Edit student"}
            </p>

            {/* Name + Email */}
            {[["Name *","name","text","Full name"],["Email","email","email","email@example.com"]].map(([lbl,key,type,ph]) => (
              <div key={key} style={{ marginBottom:"0.8rem" }}>
                <label style={labelSty}>{lbl}</label>
                <input type={type} value={form[key]} placeholder={ph}
                  onChange={e => setF(key, e.target.value)} style={inputSty} />
              </div>
            ))}

            {/* Billing type – shown early so group section adapts */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Billing type</label>
              <div style={{ display:"flex", gap:6 }}>
                {[["monthly","Monthly (fixed)"],["weekly","Weekly (per hr × days)"],["package","Package (fixed hrs)"]].map(([v,l]) => (
                  <button key={v} onClick={() => setF("billing_type",v)}
                    style={{ ...chipSty(form.billing_type===v), flex:1, fontSize:11 }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Group – with autofill chips when billing type is weekly */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Group</label>
              <input value={form.group_number} placeholder="03, Private, Hyatt…"
                onChange={e => setF("group_number", e.target.value)} style={inputSty} />
              {form.billing_type !== "package" && groupOptions.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginTop:6 }}>
                  <span style={{ fontSize:10, color:C.text3, flexShrink:0 }}>Autofill →</span>
                  {groupOptions.map(g => (
                    <button key={g} onClick={() => applyGroup(g)}
                      style={{ ...chipSty(form.group_number?.trim() === g),
                        fontSize:11, padding:"0.2rem 0.55rem" }}>
                      Gr. {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Level */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Level</label>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {STU_LEVELS.map(l => <button key={l} onClick={() => setF("level",l)} style={chipSty(form.level===l)}>{l}</button>)}
              </div>
            </div>

            {/* Weekly / Monthly fields */}
            {(form.billing_type === "weekly" || form.billing_type === "monthly") && <>
              <div style={{ marginBottom:"0.8rem" }}>
                <label style={labelSty}>Class days</label>
                <div style={{ display:"flex", gap:5 }}>
                  {STU_WEEKDAYS.map(({v,l}) => {
                    const sel = (Array.isArray(form.days)?form.days:[]).includes(v);
                    return <button key={v} onClick={() => toggleDay(v)} style={{ ...chipSty(sel), flex:1 }}>{l}</button>;
                  })}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
                <div>
                  <label style={labelSty}>Schedule</label>
                  <select value={form.schedule} onChange={e => setF("schedule",e.target.value)}
                    style={{ ...inputSty }}>
                    {STU_SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSty}>Time</label>
                  <input type="time" value={form.class_time} onChange={e => setF("class_time",e.target.value)}
                    style={{ ...inputSty, colorScheme:"dark" }} />
                </div>
              </div>
            </>}

            {/* Package hours */}
            {form.billing_type === "package" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
                <div>
                  <label style={labelSty}>Total hrs (pkg)</label>
                  <input type="number" min="1" value={form.package_hours} placeholder="48"
                    onChange={e => setF("package_hours",e.target.value)} style={inputSty} />
                </div>
                <div>
                  <label style={labelSty}>Remaining hrs</label>
                  <input type="number" min="0" value={form.package_remaining} placeholder="e.g. 36"
                    onChange={e => setF("package_remaining",e.target.value)} style={inputSty} />
                </div>
              </div>
            )}

            {/* Company */}
            <div style={{ marginBottom:"0.8rem" }}>
              <label style={labelSty}>Company</label>
              <input value={form.company} placeholder="Dilo, Hyatt…"
                onChange={e => setF("company",e.target.value)} style={inputSty} />
            </div>

            {/* Rate + Currency */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
              <div>
                <label style={labelSty}>{form.billing_type === "monthly" ? "Rate" : "Rate / hr"}</label>
                <input type="number" min="0" value={form.price_per_hour} placeholder="0"
                  onChange={e => setF("price_per_hour",e.target.value)} style={inputSty} />
              </div>
              <div>
                <label style={labelSty}>Currency</label>
                <div style={{ display:"flex", gap:6, marginTop:4 }}>
                  {[["CRC","₡ CRC"],["USD","$ USD"]].map(([v,l]) => (
                    <button key={v} onClick={() => setF("currency",v)}
                      style={{ ...chipSty(form.currency===v), flex:1 }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Discount + Pay day */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginBottom:"0.8rem" }}>
              <div>
                <label style={labelSty}>Discount %</label>
                <input type="number" min="0" max="100" value={form.discount} placeholder="0"
                  onChange={e => setF("discount",e.target.value)} style={inputSty} />
              </div>
              <div>
                <label style={labelSty}>Pay day</label>
                <div style={{ display:"flex", gap:6, marginTop:4 }}>
                  {["15","30"].map(v => (
                    <button key={v} onClick={() => setF("pay_day",v)}
                      style={{ ...chipSty(String(form.pay_day)===v), flex:1 }}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={labelSty}>WhatsApp</label>
              <input value={form.phone || ""} placeholder="+50688887777"
                onChange={e => setF("phone", e.target.value)}
                style={inputSty} />
            </div>

            {/* Comments */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={labelSty}>Comments</label>
              <textarea value={form.comments} rows={2} placeholder="Notes…"
                onChange={e => setF("comments",e.target.value)}
                style={{ ...inputSty, resize:"vertical", lineHeight:1.5 }} />
            </div>

            {/* Active status — edit only */}
            {modal.mode === "edit" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"0.7rem 0.9rem", borderRadius:10, background:C.surface2,
                border:`1px solid ${C.border}`, marginBottom:"1.25rem" }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.2 }}>Estado del estudiante</p>
                  <p style={{ fontSize:11, color:C.text3, marginTop:2 }}>{form.active ? "Activo" : "Inactivo"}</p>
                </div>
                <div onClick={() => setF("active", !form.active)}
                  style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
                  <div style={{ width:40, height:22, borderRadius:11,
                    background: form.active ? C.green : C.surface2,
                    border:`1px solid ${form.active ? C.green : C.border2}`,
                    position:"relative", transition:"background 0.18s" }}>
                    <div style={{ position:"absolute", top:3,
                      left: form.active ? 19 : 3, width:14, height:14,
                      borderRadius:"50%", transition:"left 0.18s",
                      background: form.active ? "#fff" : C.text3 }} />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={() => setModal(null)}
                style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center" }}>Cancel</button>
              <button onClick={saveStudent} disabled={formSaving || !form.name.trim()}
                style={{ ...SEL(), flex:1, padding:"0.5rem", textAlign:"center",
                  color: formSaving ? C.amber : C.text,
                  border:`1px solid ${formSaving ? C.amber : C.border2}`,
                  opacity: !form.name.trim() ? 0.5 : 1 }}>
                {formSaving ? "Saving…" : modal.mode === "add" ? "Add student" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


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

// ── COACHES VIEW ───────────────────────────────────────────────
// Admin-only: weekly coach hours + payroll with / without IVA.
// Rates (₡/hr) and per-coach IVA flags are editable inline and persisted in Supabase (coach_rates).
export function CoachesView() {
  const [tab,         setTab]         = useState("week");   // "week" | "month"
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);        // months from current
  const [weekEvents,  setWeekEvents]  = useState(null);
  const [monthEvents, setMonthEvents] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [rates,         setRates]         = useState({});
  const [rateInputs,    setRateInputs]    = useState({});  // raw string while typing
  const [ratesSaving,   setRatesSaving]   = useState({});
  const [monthSaving,   setMonthSaving]   = useState(false);
  const [monthSaved,    setMonthSaved]    = useState(false);
  const [savedMonthly,  setSavedMonthly]  = useState({});  // { coachName: hours } from DB
  const [partialInputs, setPartialInputs] = useState({});  // { coachName: { amount, date } }
  const [finalInputs,   setFinalInputs]   = useState({});  // { coachName: { amount, date } }
  const [paymentSaving, setPaymentSaving] = useState({});  // { coachName: bool }
  const [receiptPaths,     setReceiptPaths]     = useState({}); // { coach: { partial, final } } paths in storage
  const [receiptUrls,      setReceiptUrls]      = useState({}); // { coach: { partial, final } } signed URLs
  const [receiptUploading, setReceiptUploading] = useState({}); // { coach: { partial, final } } bool
  const [ivaFlags,         setIvaFlags]         = useState({}); // { coachName: bool }
  const [ivaSaving,        setIvaSaving]        = useState({}); // { coachName: bool }
  // ── Roster management ──
  const [rosterOpen,   setRosterOpen]   = useState(false);
  const [rosterRows,   setRosterRows]   = useState([]);   // full coach_rates rows
  const [rosterSaving, setRosterSaving] = useState(false);
  const [addForm,      setAddForm]      = useState({ name: "", email: "", color: "#e6c229", rate: "", iva: false });

  const VALID_COACHES = getCoachNames();
  const IVA      = IVA_RATE;
  const sym      = "₡";
  const fmtMoney = n => n < 0
    ? `-₡${Math.round(-n).toLocaleString("es-CR")}`
    : `₡${Math.round(n).toLocaleString("es-CR")}`;

  // ── Load rates + iva from Supabase ───────────────────────────────
  useEffect(() => {
    supabase.from("coach_rates").select("coach_name, rate, iva, email, color, active")
      .then(({ data, error: e }) => {
        if (!e && data) {
          setRosterRows(data);
          const rMap = {}, iMap = {};
          data.forEach(r => {
            rMap[r.coach_name] = r.rate;
            iMap[r.coach_name] = r.iva ?? true;
          });
          setRates(rMap);
          setRateInputs(rMap);
          setIvaFlags(iMap);
        }
      });
  }, []);

  // ── Week helpers ──────────────────────────────────────────────────
  const getWeekBounds = (offset) => {
    const today = new Date();
    const dow = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { start: mon, end: sun };
  };

  const isoWeek = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
    const w1 = new Date(dt.getFullYear(), 0, 4);
    return 1 + Math.round(((dt - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  };

  // ── Month helpers ─────────────────────────────────────────────────
  const getMonthBounds = (offset) => {
    const now = new Date();
    const d   = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { start, end, year: d.getFullYear(), month: d.getMonth() };
  };

  const MONTH_NAMES = MONTHS_LONG;

  const yearMonthKey = (offset) => {
    const { year, month } = getMonthBounds(offset);
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  // ── Fetch helpers ─────────────────────────────────────────────────
  const fetchEvents = async (start, end) => {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "teams", startDateTime: start.toISOString(), endDateTime: end.toISOString() }),
    });
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Could not load schedule.");
    return data.filter(ev => ev.coach?.trim() && VALID_COACHES.includes(ev.coach.trim()));
  };

  // Request-id guards prevent stale async responses from overwriting newer results
  const weekReqRef  = React.useRef(0);
  const monthReqRef = React.useRef(0);

  const loadWeek = async (offset) => {
    const reqId = ++weekReqRef.current;
    setLoading(true); setError(null); setWeekEvents(null);
    const { start, end } = getWeekBounds(offset);
    try {
      const evs = await fetchEvents(start, end);
      if (reqId !== weekReqRef.current) return;
      setWeekEvents(evs);
    } catch (e) {
      if (reqId !== weekReqRef.current) return;
      setError(e.message);
    }
    setLoading(false);
  };

  const loadMonth = async (offset) => {
    const reqId = ++monthReqRef.current;
    setLoading(true); setError(null); setMonthEvents(null); setMonthSaved(false);
    setPartialInputs({}); setFinalInputs({});
    setReceiptPaths({}); setReceiptUrls({});
    const { start, end } = getMonthBounds(offset);
    const ym = yearMonthKey(offset);
    try {
      const [evs, { data: saved }] = await Promise.all([
        fetchEvents(start, end),
        supabase.from("coach_monthly_hours")
          .select("coach_name, hours, partial_payment, partial_payment_date, final_payment, final_payment_date, partial_receipt_path, final_receipt_path")
          .eq("year_month", ym),
      ]);
      if (reqId !== monthReqRef.current) return;
      setMonthEvents(evs);
      if (saved?.length) {
        const hoursMap = {}, partMap = {}, finalMap = {}, rpMap = {};
        saved.forEach(r => {
          hoursMap[r.coach_name] = r.hours;
          partMap[r.coach_name]  = { amount: r.partial_payment ?? "", date: r.partial_payment_date ?? "" };
          finalMap[r.coach_name] = { amount: r.final_payment   ?? "", date: r.final_payment_date   ?? "" };
          rpMap[r.coach_name]    = { partial: r.partial_receipt_path || null, final: r.final_receipt_path || null };
        });
        setSavedMonthly(hoursMap);
        setPartialInputs(partMap);
        setFinalInputs(finalMap);
        setMonthSaved(true);
        setReceiptPaths(rpMap);
        // Generar signed URLs para comprobantes existentes
        const urlMap = {};
        await Promise.all(Object.entries(rpMap).map(async ([coach, { partial, final }]) => {
          urlMap[coach] = { partial: null, final: null };
          if (partial) {
            const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(partial, 3600);
            urlMap[coach].partial = data?.signedUrl || null;
          }
          if (final) {
            const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(final, 3600);
            urlMap[coach].final = data?.signedUrl || null;
          }
        }));
        if (reqId !== monthReqRef.current) return;
        setReceiptUrls(urlMap);
      } else {
        setSavedMonthly({});
      }
    } catch (e) {
      if (reqId !== monthReqRef.current) return;
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadWeek(0); }, []);

  // Switch tabs
  const switchTab = (t) => {
    setTab(t); setError(null);
    if (t === "week"  && weekEvents  === null) loadWeek(0);
    if (t === "month" && monthEvents === null) loadMonth(0);
  };

  // ── Rate editing ──────────────────────────────────────────────────
  // While typing: only update the raw input string (no Supabase call)
  const handleRateChange = (coach, val) => {
    setRateInputs(prev => ({ ...prev, [coach]: val }));
  };

  // On blur: parse + save to Supabase
  const handleRateBlur = async (coach) => {
    const rate = parseFloat(rateInputs[coach]) || 0;
    setRates(prev => ({ ...prev, [coach]: rate }));
    setRatesSaving(prev => ({ ...prev, [coach]: true }));
    await supabase.from("coach_rates").upsert(
      { coach_name: coach, rate, updated_at: new Date().toISOString() },
      { onConflict: "coach_name" }
    );
    setRatesSaving(prev => ({ ...prev, [coach]: false }));
  };

  const handleIvaToggle = async (coach) => {
    const next = !(ivaFlags[coach] ?? true);
    setIvaFlags(prev => ({ ...prev, [coach]: next }));
    setIvaSaving(prev => ({ ...prev, [coach]: true }));
    await supabase.from("coach_rates").upsert(
      { coach_name: coach, iva: next, updated_at: new Date().toISOString() },
      { onConflict: "coach_name" }
    );
    setIvaSaving(prev => ({ ...prev, [coach]: false }));
  };

  // ── Roster management ─────────────────────────────────────────────
  const saveNewCoach = async () => {
    const name  = addForm.name.trim();
    const email = addForm.email.trim().toLowerCase();
    if (!name) return toast("Name is required");
    if (!/^[a-z0-9._-]+@dilo\.club$/.test(email)) return toast("Email must end in @dilo.club");
    if (email.split("@")[0] !== name.toLowerCase())
      return toast(`Name must match the email prefix (${email.split("@")[0]} → ${email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)})`);
    setRosterSaving(true);
    const row = { coach_name: name, email, color: addForm.color, rate: parseFloat(addForm.rate) || 0,
      iva: addForm.iva, active: true, updated_at: new Date().toISOString() };
    const { error: e } = await supabase.from("coach_rates").upsert(row, { onConflict: "coach_name" });
    if (e) toast("Could not save: " + e.message);
    else {
      toast(`${name} added to roster`);
      setAddForm({ name: "", email: "", color: "#e6c229", rate: "", iva: false });
      setRosterRows(prev => [...prev.filter(r => r.coach_name !== name), row].sort((a, b) => a.coach_name.localeCompare(b.coach_name)));
      setRates(prev => ({ ...prev, [name]: row.rate }));
      setRateInputs(prev => ({ ...prev, [name]: String(row.rate) }));
      setIvaFlags(prev => ({ ...prev, [name]: row.iva }));
      await loadCoachRoster();
    }
    setRosterSaving(false);
  };

  const updateRosterField = async (coach, field, value) => {
    setRosterRows(prev => prev.map(r => r.coach_name === coach ? { ...r, [field]: value } : r));
    const { error: e } = await supabase.from("coach_rates")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("coach_name", coach);
    if (e) toast("Could not save: " + e.message);
    else await loadCoachRoster();
  };

  // ── Save monthly hours to Supabase ────────────────────────────────
  const saveMonthlyHours = async (rows) => {
    setMonthSaving(true);
    const ym = yearMonthKey(monthOffset);
    const upserts = rows.map(r => ({
      coach_name: r.coach, year_month: ym, hours: r.classes,
      partial_payment:      partialInputs[r.coach]?.amount ? parseFloat(partialInputs[r.coach].amount) : null,
      partial_payment_date: partialInputs[r.coach]?.date   || null,
      final_payment:        finalInputs[r.coach]?.amount   ? parseFloat(finalInputs[r.coach].amount)   : null,
      final_payment_date:   finalInputs[r.coach]?.date     || null,
    }));
    await supabase.from("coach_monthly_hours").upsert(upserts, { onConflict: "coach_name,year_month" });
    const map = {};
    rows.forEach(r => { map[r.coach] = r.classes; });
    setSavedMonthly(map);
    setMonthSaving(false);
    setMonthSaved(true);
  };

  // ── Save partial + final payments for one coach (shared OK button) ──
  // Funciona independientemente de "Save Summary": siempre incluye las horas
  // para que el upsert pueda hacer INSERT si la fila no existe todavía.
  const savePayments = async (coach, currentRows) => {
    setPaymentSaving(prev => ({ ...prev, [coach]: true }));
    const ym  = yearMonthKey(monthOffset);
    const hrs = currentRows.find(r => r.coach === coach)?.classes || 0;
    const p   = partialInputs[coach] || {};
    const f   = finalInputs[coach]   || {};
    try {
      const { error } = await supabase.from("coach_monthly_hours").upsert(
        {
          coach_name: coach, year_month: ym, hours: hrs,
          partial_payment:      p.amount ? parseFloat(p.amount) : null,
          partial_payment_date: p.date   || null,
          final_payment:        f.amount ? parseFloat(f.amount) : null,
          final_payment_date:   f.date   || null,
        },
        { onConflict: "coach_name,year_month" }
      );
      if (error) throw error;
      // Actualizar savedMonthly para que el banner refleje el estado guardado
      setSavedMonthly(prev => ({ ...prev, [coach]: hrs }));
      setMonthSaved(true);
    } catch (e) {
      console.error("[savePayments]", coach, e.message);
      setError(`Could not save payment for ${coach}: ${e.message}`);
    }
    setPaymentSaving(prev => ({ ...prev, [coach]: false }));
  };

  // ── Upload receipt image to Supabase Storage ─────────────────────
  const uploadReceipt = async (coach, type, file) => {
    setReceiptUploading(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: true } }));
    const ext  = file.name.split(".").pop().toLowerCase() || "jpg";
    const path = `${coach}/${yearMonthKey(monthOffset)}/${type}.${ext}`;
    const col  = type === "partial" ? "partial_receipt_path" : "final_receipt_path";
    try {
      const { error: upErr } = await supabase.storage
        .from("payment-receipts").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const hrs = (monthEvents || []).filter(ev => ev.coach?.trim() === coach).length;
      const { error: dbErr } = await supabase.from("coach_monthly_hours").upsert(
        { coach_name: coach, year_month: yearMonthKey(monthOffset), hours: hrs, [col]: path },
        { onConflict: "coach_name,year_month" }
      );
      if (dbErr) throw dbErr;
      const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(path, 3600);
      setReceiptPaths(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: path } }));
      setReceiptUrls(prev  => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: data?.signedUrl||null } }));
    } catch (e) {
      console.error("[uploadReceipt]", e.message);
      setError(`Could not upload receipt for ${coach}: ${e.message}`);
    }
    setReceiptUploading(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: false } }));
  };

  // ── Delete receipt from Storage + DB ─────────────────────────────
  const deleteReceipt = async (coach, type) => {
    const path = receiptPaths[coach]?.[type];
    if (!path) return;
    const col = type === "partial" ? "partial_receipt_path" : "final_receipt_path";
    await supabase.storage.from("payment-receipts").remove([path]);
    await supabase.from("coach_monthly_hours")
      .update({ [col]: null })
      .eq("coach_name", coach).eq("year_month", yearMonthKey(monthOffset));
    setReceiptPaths(prev => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: null } }));
    setReceiptUrls(prev  => ({ ...prev, [coach]: { ...(prev[coach]||{}), [type]: null } }));
  };

  // ── Aggregate events → rows ───────────────────────────────────────
  // Quincenas: Q1 = día 1–15 (inclusive) · Q2 = día 16–fin de mes
  const buildRows = (evs) => {
    const byCoach = {};
    (evs || []).forEach(ev => {
      const c = ev.coach.trim();
      if (!byCoach[c]) byCoach[c] = { total: 0, q1: 0, q2: 0 };
      byCoach[c].total++;
      if (toCRDate(ev.start).getDate() <= 15) byCoach[c].q1++; else byCoach[c].q2++;
    });
    return Object.entries(byCoach)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([coach, { total: classes, q1, q2 }]) => {
        const rate    = rates[coach] || 0;
        const hasIva  = ivaFlags[coach] ?? true;
        const amt     = n => { const net = n * rate; return net + (hasIva ? net * IVA : 0); };
        const net     = classes * rate;
        const iva     = hasIva ? net * IVA : 0;
        return { coach, classes, q1, q2, rate, net, iva, hasIva,
          total: net + iva, dueQ1: amt(q1), dueQ2: amt(q2) };
      });
  };

  // ── Derived ───────────────────────────────────────────────────────
  const { start: wStart, end: wEnd } = getWeekBounds(weekOffset);
  const { start: mStart, year: mYear, month: mMonth } = getMonthBounds(monthOffset);
  const weekNum  = isoWeek(wStart);
  const fmtDate  = d => d.toLocaleDateString("en", { month: "short", day: "numeric" });

  const weekRows  = buildRows(weekEvents);
  const monthRows = buildRows(monthEvents);
  const totalWeekHrs  = weekRows.reduce((s, r) => s + r.classes, 0);
  const totalMonthHrs = monthRows.reduce((s, r) => s + r.classes, 0);

  // ── Sub-components ────────────────────────────────────────────────
  const inputStyle = { minWidth: 0, background: "rgba(240,236,224,0.05)",
    border: `1px solid ${C.border2}`, borderRadius: 6,
    padding: "0.28rem 0.45rem", color: C.text, fontSize: 12,
    fontWeight: 600, fontFamily: "inherit", lineHeight: "1.4", boxSizing: "border-box" };

  const okBtnStyle = (saving) => ({
    flexShrink: 0, padding: "0.22rem 0.45rem", borderRadius: 6,
    fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "default" : "pointer",
    background: C.surface2, border: `1px solid ${saving ? C.amber : C.border2}`,
    color: saving ? C.amber : C.text3, transition: "all 0.15s",
  });

  const Dots = () => (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.text3,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );

  const PayrollTable = ({ rows, totalHrs, emptyMsg, footer, monthMode = false }) => {
    const headers = monthMode
      ? ["Coach","Hrs 1–15","Due 1–15","Pay 1–15","Date","Hrs 16–31","Due 16–31","Pay 16–31","Date","Total","Pending"]
      : ["Coach","Hrs","Rate / hr","Net","VAT 2%","Total"];
    const colWidths = monthMode
      ? [null, 52, 95, 85, 115, 52, 95, 85, 115, 110, 100]
      : [null, 50, 100, 100, 80, 110];
    return(
    rows.length === 0
      ? <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 13 }}>{emptyMsg}</p>
        </div>
      : <>
          <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: monthMode ? 1150 : 580 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: "0.6rem 0.9rem", fontSize: 10, fontWeight: 800, color: C.text3,
                      letterSpacing: "0.07em", textTransform: "uppercase", background: C.surface2,
                      textAlign: i === 0 ? "left" : "left", whiteSpace: "nowrap",
                      width: colWidths[i] || undefined,
                      position: i === 0 ? "sticky" : "static", left: i === 0 ? 0 : "auto" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const partial  = parseFloat(partialInputs[r.coach]?.amount) || 0;
                  const final_   = parseFloat(finalInputs[r.coach]?.amount)   || 0;
                  const pending  = r.total - partial - final_;
                  const isPaid   = r.total > 0 && pending === 0;
                  return (
                  <tr key={r.coach} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 700, color: C.text,
                      position: "sticky", left: 0, background: C.surface2, whiteSpace: "nowrap" }}>
                      {r.coach.split(" ")[0]}
                    </td>
                    {!monthMode && <>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.classes}</td>
                    <td style={{ padding: "0.75rem 0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                        <input type="number" min="0" step="0.01"
                          value={rateInputs[r.coach] ?? ""} placeholder="0.00"
                          onChange={e => handleRateChange(r.coach, e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleRateBlur(r.coach)}
                          style={{ ...inputStyle, width: 48, minWidth: 0 }} />
                        <button onClick={() => handleRateBlur(r.coach)} disabled={ratesSaving[r.coach]}
                          style={okBtnStyle(ratesSaving[r.coach])}>
                          {ratesSaving[r.coach] ? "…" : "OK"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: r.net > 0 ? C.text : C.text3, whiteSpace: "nowrap" }}>
                      {r.net > 0 ? fmtMoney(r.net) : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", whiteSpace: "nowrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div onClick={() => !ivaSaving[r.coach] && handleIvaToggle(r.coach)}
                          style={{ width:30, height:17, borderRadius:9, flexShrink:0,
                            background: r.hasIva ? C.green : C.surface2,
                            border:`1px solid ${r.hasIva ? C.green : C.border2}`,
                            position:"relative", cursor: ivaSaving[r.coach] ? "default" : "pointer",
                            transition:"background 0.18s", opacity: ivaSaving[r.coach] ? 0.5 : 1 }}>
                          <div style={{ position:"absolute", top:2,
                            left: r.hasIva ? 14 : 2, width:11, height:11,
                            borderRadius:"50%", transition:"left 0.18s",
                            background: r.hasIva ? "#fff" : C.text3 }} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color: r.iva > 0 ? C.text2 : C.text3 }}>
                          {r.iva > 0 ? fmtMoney(r.iva) : "—"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, color: r.total > 0 ? C.green : C.text3, whiteSpace: "nowrap" }}>
                      {r.total > 0 ? fmtMoney(r.total) : "—"}
                    </td>
                    </>}
                    {monthMode && <>
                      {/* Hrs 1–15 */}
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.q1}</td>
                      {/* Due 1–15 — click para copiar al input de pago */}
                      <td onClick={() => r.dueQ1 > 0 && setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: String(Math.round(r.dueQ1)) } }))}
                        title="Click to fill payment"
                        style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                          color: r.dueQ1 > 0 ? C.text : C.text3, cursor: r.dueQ1 > 0 ? "pointer" : "default",
                          textDecoration: r.dueQ1 > 0 ? "underline dotted" : "none", textUnderlineOffset: 3 }}>
                        {r.dueQ1 > 0 ? fmtMoney(r.dueQ1) : "—"}
                      </td>
                      {/* Pay 1–15 — monto */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                          <input type="number" min="0" step="0.01"
                            value={partialInputs[r.coach]?.amount ?? ""} placeholder="0"
                            onChange={e => setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: e.target.value } }))}
                            style={{ ...inputStyle, width: 72, minWidth: 0 }} />
                        </div>
                      </td>
                      {/* Partial Pay — fecha + 📎 + OK */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <input type="date" className="dilo-date"
                            value={partialInputs[r.coach]?.date ?? ""}
                            onChange={e => setPartialInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), date: e.target.value } }))}
                            style={{ ...inputStyle, flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                          {receiptPaths[r.coach]?.partial
                            ? <>
                                <button onClick={() => window.open(receiptUrls[r.coach]?.partial, "_blank")}
                                  title="Ver comprobante"
                                  style={{ ...okBtnStyle(false), color: C.green, borderColor: C.green+"55", padding:"0.22rem 0.4rem" }}>🖼</button>
                                <button onClick={() => deleteReceipt(r.coach, "partial")}
                                  title="Eliminar comprobante"
                                  style={{ ...okBtnStyle(false), color:"#d95f5f", borderColor:"#d95f5f44", padding:"0.22rem 0.4rem" }}>✕</button>
                              </>
                            : <label title="Subir comprobante"
                                style={{ ...okBtnStyle(receiptUploading[r.coach]?.partial), padding:"0.22rem 0.4rem", cursor:"pointer", display:"flex", alignItems:"center" }}>
                                {receiptUploading[r.coach]?.partial ? "…" : "📎"}
                                <input type="file" accept="image/*" style={{ display:"none" }}
                                  onChange={e => { if (e.target.files[0]) uploadReceipt(r.coach, "partial", e.target.files[0]); e.target.value=""; }} />
                              </label>
                          }
                          <button onClick={() => savePayments(r.coach, rows)} disabled={paymentSaving[r.coach]}
                            style={okBtnStyle(paymentSaving[r.coach])}>
                            {paymentSaving[r.coach] ? "…" : "OK"}
                          </button>
                        </div>
                      </td>
                      {/* Hrs 16–31 */}
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 600, color: C.text2 }}>{r.q2}</td>
                      {/* Due 16–31 — click para copiar al input de pago */}
                      <td onClick={() => r.dueQ2 > 0 && setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: String(Math.round(r.dueQ2)) } }))}
                        title="Click to fill payment"
                        style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                          color: r.dueQ2 > 0 ? C.text : C.text3, cursor: r.dueQ2 > 0 ? "pointer" : "default",
                          textDecoration: r.dueQ2 > 0 ? "underline dotted" : "none", textUnderlineOffset: 3 }}>
                        {r.dueQ2 > 0 ? fmtMoney(r.dueQ2) : "—"}
                      </td>
                      {/* Pay 16–31 — monto */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{sym}</span>
                          <input type="number" min="0" step="0.01"
                            value={finalInputs[r.coach]?.amount ?? ""} placeholder="0"
                            onChange={e => setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), amount: e.target.value } }))}
                            style={{ ...inputStyle, width: 72, minWidth: 0 }} />
                        </div>
                      </td>
                      {/* Final Pay — fecha + 📎 + OK */}
                      <td style={{ padding: "0.75rem 0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                          <input type="date" className="dilo-date"
                            value={finalInputs[r.coach]?.date ?? ""}
                            onChange={e => setFinalInputs(prev => ({ ...prev, [r.coach]: { ...(prev[r.coach] || {}), date: e.target.value } }))}
                            style={{ ...inputStyle, flex: 1, minWidth: 0, boxSizing: "border-box" }} />
                          {receiptPaths[r.coach]?.final
                            ? <>
                                <button onClick={() => window.open(receiptUrls[r.coach]?.final, "_blank")}
                                  title="Ver comprobante"
                                  style={{ ...okBtnStyle(false), color: C.green, borderColor: C.green+"55", padding:"0.22rem 0.4rem" }}>🖼</button>
                                <button onClick={() => deleteReceipt(r.coach, "final")}
                                  title="Eliminar comprobante"
                                  style={{ ...okBtnStyle(false), color:"#d95f5f", borderColor:"#d95f5f44", padding:"0.22rem 0.4rem" }}>✕</button>
                              </>
                            : <label title="Subir comprobante"
                                style={{ ...okBtnStyle(receiptUploading[r.coach]?.final), padding:"0.22rem 0.4rem", cursor:"pointer", display:"flex", alignItems:"center" }}>
                                {receiptUploading[r.coach]?.final ? "…" : "📎"}
                                <input type="file" accept="image/*" style={{ display:"none" }}
                                  onChange={e => { if (e.target.files[0]) uploadReceipt(r.coach, "final", e.target.files[0]); e.target.value=""; }} />
                              </label>
                          }
                          <button onClick={() => savePayments(r.coach, rows)} disabled={paymentSaving[r.coach]}
                            style={okBtnStyle(paymentSaving[r.coach])}>
                            {paymentSaving[r.coach] ? "…" : "OK"}
                          </button>
                        </div>
                      </td>
                      {/* Total mes (incluye IVA si aplica) */}
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, color: r.total > 0 ? C.green : C.text3, whiteSpace: "nowrap" }}>
                        {r.total > 0 ? fmtMoney(r.total) : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap",
                        color: isPaid ? C.green : pending < 0 ? C.amber : "#d95f5f" }}>
                        {r.total > 0 ? (isPaid ? "✓ 0" : fmtMoney(pending)) : "—"}
                      </td>
                    </>}
                  </tr>
                );})}
              </tbody>
              <tfoot>
                {(() => {
                  const tNet     = rows.reduce((s, r) => s + r.net,   0);
                  const tIva     = rows.reduce((s, r) => s + r.iva,   0);
                  const tTotal   = rows.reduce((s, r) => s + r.total, 0);
                  const tPending = rows.reduce((s, r) => {
                    const p = parseFloat(partialInputs[r.coach]?.amount) || 0;
                    const f = parseFloat(finalInputs[r.coach]?.amount)   || 0;
                    return s + (r.total - p - f);
                  }, 0);
                  const allPaid = tTotal > 0 && tPending === 0;
                  return (
                  <tr style={{ borderTop: `1px solid ${C.border2}`, background: C.surface2 }}>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 11, fontWeight: 800, color: C.text2, letterSpacing: "0.08em", textTransform: "uppercase", position: "sticky", left: 0, background: C.surface2 }}>Total</td>
                    {!monthMode && <>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{totalHrs} hrs</td>
                    <td />
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tNet > 0 ? fmtMoney(tNet) : "—"}</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text2, whiteSpace: "nowrap" }}>{tIva > 0 ? fmtMoney(tIva) : "—"}</td>
                    <td style={{ padding: "0.75rem 0.9rem", fontSize: 15, fontWeight: 900, color: C.green, whiteSpace: "nowrap" }}>{tTotal > 0 ? fmtMoney(tTotal) : "—"}</td>
                    </>}
                    {monthMode && (() => {
                      const tQ1    = rows.reduce((s, r) => s + r.q1, 0);
                      const tQ2    = rows.reduce((s, r) => s + r.q2, 0);
                      const tDueQ1 = rows.reduce((s, r) => s + r.dueQ1, 0);
                      const tDueQ2 = rows.reduce((s, r) => s + r.dueQ2, 0);
                      return <>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{tQ1}</td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tDueQ1 > 0 ? fmtMoney(tDueQ1) : "—"}</td>
                      <td /><td />
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, color: C.text }}>{tQ2}</td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{tDueQ2 > 0 ? fmtMoney(tDueQ2) : "—"}</td>
                      <td /><td />
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 15, fontWeight: 900, color: C.green, whiteSpace: "nowrap" }}>{tTotal > 0 ? fmtMoney(tTotal) : "—"}</td>
                      <td style={{ padding: "0.75rem 0.9rem", fontSize: 14, fontWeight: 900, whiteSpace: "nowrap",
                        color: allPaid ? C.green : tPending < 0 ? C.amber : "#d95f5f" }}>
                        {tTotal > 0 ? (allPaid ? "✓ 0" : fmtMoney(tPending)) : "—"}
                      </td>
                      </>;
                    })()}
                  </tr>
                );})()}
              </tfoot>
            </table>
          </div>
          {footer}
        </>
  );};

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 800 }}>
      {/* ── Tab toggle ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[["week","Week"],["month","Month"]].map(([id, label]) => (
          <button key={id} onClick={() => switchTab(id)}
            style={{ padding: "0.45rem 1.1rem", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              background: C.surface2,
              color:      tab === id ? C.text : C.text3,
              border: `1px solid ${tab === id ? C.accent : C.border}`,
              transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ SEMANA ══ */}
      {tab === "week" && <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button onClick={() => { const o = weekOffset - 1; setWeekOffset(o); loadWeek(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 700, flex: 1, textAlign: "center" }}>
            Week {weekNum} · {fmtDate(wStart)} – {fmtDate(wEnd)}, {wEnd.getFullYear()}
          </span>
          <button onClick={() => { const o = weekOffset + 1; setWeekOffset(o); loadWeek(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
        </div>

        {loading && <div style={{ ...CARD, padding: "3rem", display:"flex", justifyContent:"center" }}><Dots /></div>}
        {!loading && error && <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && weekEvents !== null &&
          PayrollTable({ rows: weekRows, totalHrs: totalWeekHrs, emptyMsg: "No classes this week." })}
      </>}

      {/* ══ MES ══ */}
      {tab === "month" && <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <button onClick={() => { const o = monthOffset - 1; setMonthOffset(o); loadMonth(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>‹</button>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 700, flex: 1, textAlign: "center" }}>
            {MONTH_NAMES[mMonth]} {mYear}
          </span>
          <button onClick={() => { const o = monthOffset + 1; setMonthOffset(o); loadMonth(o); }}
            style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:8, padding:"4px 12px", color:C.text2, fontSize:18, cursor:"pointer", lineHeight:1, flexShrink:0 }}>›</button>
        </div>

        {loading && <div style={{ ...CARD, padding: "3rem", display:"flex", justifyContent:"center" }}><Dots /></div>}
        {!loading && error && <div style={{ background: "rgba(194,0,0,0.08)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 12, padding: "1rem 1.25rem", color: C.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && monthEvents !== null &&
          PayrollTable({ rows: monthRows, totalHrs: totalMonthHrs, emptyMsg: "No classes this month.", monthMode: true })}
      </>}

      {/* ══ COACH ROSTER ══ */}
      <div style={{ ...CARD, borderRadius: 14, marginTop: "1.5rem", overflow: "hidden" }}>
        <div onClick={() => setRosterOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.1rem", cursor: "pointer" }}>
          <span style={{ fontSize: 13, color: C.text3, width: 14 }}>{rosterOpen ? "▾" : "▸"}</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "0.04em" }}>Coach Roster</p>
          <p style={{ fontSize: 11, color: C.text3, marginLeft: "auto" }}>
            {rosterRows.filter(r => r.active !== false).length} active
          </p>
        </div>
        {rosterOpen && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {rosterRows.map((r, i) => (
              <div key={r.coach_name} style={{ display: "flex", alignItems: "center", gap: "0.8rem",
                padding: "0.6rem 1.1rem", borderBottom: `1px solid ${C.border}`,
                opacity: r.active === false ? 0.45 : 1 }}>
                <input type="color" value={r.color || "#9e9e9e"}
                  onChange={e => updateRosterField(r.coach_name, "color", e.target.value)}
                  title="Coach color"
                  style={{ width: 26, height: 26, padding: 0, border: "none", borderRadius: 6,
                    background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 70 }}>{r.coach_name}</p>
                <p style={{ fontSize: 11, color: C.text3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.email || `${r.coach_name.toLowerCase()}@dilo.club`}
                </p>
                <div onClick={() => updateRosterField(r.coach_name, "active", !(r.active !== false))}
                  title={r.active !== false ? "Deactivate coach" : "Reactivate coach"}
                  style={{ width: 30, height: 17, borderRadius: 9, flexShrink: 0,
                    background: r.active !== false ? C.green : C.surface2,
                    border: `1px solid ${r.active !== false ? C.green : C.border2}`,
                    position: "relative", cursor: "pointer", transition: "background 0.18s" }}>
                  <div style={{ position: "absolute", top: 2, left: r.active !== false ? 14 : 2,
                    width: 11, height: 11, borderRadius: "50%", transition: "left 0.18s",
                    background: r.active !== false ? "#fff" : C.text3 }} />
                </div>
              </div>
            ))}
            {/* Add coach form */}
            <div style={{ padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <input type="color" value={addForm.color}
                onChange={e => setAddForm(f => ({ ...f, color: e.target.value }))}
                title="Coach color"
                style={{ width: 26, height: 26, padding: 0, border: "none", borderRadius: 6,
                  background: "transparent", cursor: "pointer", flexShrink: 0 }} />
              <input placeholder="Name (e.g. Jose)" value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                style={{ ...inputStyle, width: 110 }} />
              <input placeholder="name@dilo.club" value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                style={{ ...inputStyle, width: 150 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11, color: C.text3 }}>{sym}</span>
                <input type="number" min="0" placeholder="Rate" value={addForm.rate}
                  onChange={e => setAddForm(f => ({ ...f, rate: e.target.value }))}
                  style={{ ...inputStyle, width: 64 }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.text3, cursor: "pointer" }}>
                <input type="checkbox" checked={addForm.iva}
                  onChange={e => setAddForm(f => ({ ...f, iva: e.target.checked }))} />
                VAT
              </label>
              <button onClick={saveNewCoach} disabled={rosterSaving}
                style={{ ...okBtnStyle(rosterSaving), padding: "0.35rem 0.8rem" }}>
                {rosterSaving ? "…" : "+ Add Coach"}
              </button>
            </div>
            <p style={{ fontSize: 10, color: C.text3, padding: "0 1.1rem 0.9rem", lineHeight: 1.5 }}>
              The coach must already have a Teams account (name@dilo.club) and a Dilo App account.
              The name must match the email prefix. Deactivating hides a coach from all views without deleting payroll history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


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

// ── CLASS RECAPS VIEW ──────────────────────────────────────────
function timeToMinutes(t) {
  if (!t) return 0;
  const s = t.trim().toUpperCase();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3] === "PM" && h !== 12) h += 12;
  if (m[3] === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function normalizeTime(t) {
  if (!t) return t;
  return t.trim().replace(/\s+/g, " ").toUpperCase();
}


function renderMarkdown(text) {
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const esc = raw.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>");
    const dimTs = s => s.replace(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g,
      "<span style='color:rgba(240,236,224,0.3);font-size:11px'>$1</span>");
    const boldTitle = s => { const m=s.match(/^(.{5,}?):\s/); return m?`<strong>${m[1]}:</strong> ${s.slice(m[0].length)}`:s; };
    // Teams-style bullets: • or ▶
    if (/^[•▶►]\s*/.test(raw)) {
      if (!inList) { html += "<ul style='margin:0.4rem 0;padding:0;list-style:none'>"; inList = true; }
      const content = dimTs(boldTitle(esc.replace(/^[•▶►]\s*/,"")));
      html += `<li style='margin-bottom:0.6rem;padding-left:0.75rem;border-left:2px solid rgba(240,236,224,0.12)'>${content}</li>`;
    }
    // Standard markdown bullets
    else if (/^[-*]\s+/.test(raw)) {
      if (!inList) { html += "<ul style='margin:0.35rem 0 0.35rem 1.1rem;padding:0'>"; inList = true; }
      html += `<li style='margin-bottom:0.2rem'>${esc.replace(/^[-*]\s+/,"")}</li>`;
    }
    else {
      if (inList) { html += "</ul>"; inList = false; }
      if (/^#{1,3}\s+/.test(raw)) {
        html += `<p style='font-weight:700;font-size:13px;margin:0.7rem 0 0.25rem;color:rgba(240,236,224,0.9)'>${esc.replace(/^#+\s+/,"")}</p>`;
      } else if (esc.trim() === "") {
        html += "<br/>";
      } else {
        html += `<p style='margin:0 0 0.3rem'>${esc}</p>`;
      }
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function stripMd(text) {
  return text.replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*(.+?)\*/g,"$1")
    .replace(/^[•▶►\-*#]+\s*/gm,"").replace(/\n+/g," ").trim();
}

export function MeetingRecapsView({ user, role }) {
  const isAdmin = role === "admin";
  const today   = crToday();

  // ── Register card state (admin only) ──
  const [regDate,       setRegDate]       = useState(today);
  const [events,        setEvents]        = useState([]);
  const [loadingEvs,    setLoadingEvs]    = useState(false);
  const [doneRecapNames,setDoneRecapNames]= useState(new Set());
  const [selEvent,      setSelEvent]      = useState("");
  const [regTime,       setRegTime]       = useState("");
  const [recapText,     setRecapText]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saveOk,        setSaveOk]        = useState(false);
  const [saveErr,       setSaveErr]       = useState("");
  const [regErrors,     setRegErrors]     = useState({});

  // ── Access card state ──
  const [accDate,     setAccDate]     = useState(today);
  const [accTime,     setAccTime]     = useState("All");
  const [recaps,      setRecaps]      = useState([]);
  const [loadingAcc,  setLoadingAcc]  = useState(false);
  const [fetchErr,    setFetchErr]    = useState("");
  const [expanded,    setExpanded]    = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState("");
  const [editSaving,  setEditSaving]  = useState(false);
  const [editErr,     setEditErr]     = useState("");

  // Fetch Teams events + existing recaps when regDate changes
  useEffect(() => {
    if (!isAdmin || !regDate) return;
    setLoadingEvs(true); setSelEvent(""); setRegTime(""); setEvents([]);
    Promise.all([
      fetch(ATTENDANCE_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "calendar-events", date: regDate }),
      }).then(r => r.json()).catch(() => ({ events: [] })),
      supabase.from("meeting_recaps").select("event_name").eq("class_date", regDate),
    ]).then(([calData, { data: existingRecaps }]) => {
      setEvents(calData.events || []);
      setDoneRecapNames(new Set((existingRecaps || []).map(r => r.event_name)));
    }).finally(() => setLoadingEvs(false));
  }, [regDate, isAdmin]);

  // Graph returns CR local time via Prefer header — parse string directly
  function handleSelectEvent(subject) {
    setSelEvent(subject);
    const ev = events.find(e => e.subject === subject);
    if (ev?.start) {
      const timePart = ev.start.slice(11, 16);
      const [hStr, mStr] = timePart.split(":");
      const h = parseInt(hStr, 10);
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      setRegTime(`${h12}:${mStr} ${ap}`);
    }
    setRegErrors(e => ({ ...e, selEvent: false, regTime: false }));
  }

  async function handleSave() {
    const errs = {};
    if (!selEvent)         errs.selEvent  = true;
    if (!regTime.trim())   errs.regTime   = true;
    if (!recapText.trim()) errs.recapText = true;
    setRegErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const { error } = await supabase.from("meeting_recaps").insert({
        class_date: regDate, class_time: normalizeTime(regTime),
        event_name: selEvent, recap: recapText.trim(), created_by: user?.id || null,
      });
      if (error) throw error;
      setSaveOk(true);
      setDoneRecapNames(prev => new Set([...prev, selEvent]));
      setSelEvent(""); setRegTime(""); setRecapText("");
      setTimeout(() => setSaveOk(false), 4000);
      if (accDate === regDate) fetchRecaps(regDate);
    } catch (e) {
      setSaveErr("Error: " + (e?.message || JSON.stringify(e)));
    } finally { setSaving(false); }
  }

  async function fetchRecaps(date) {
    setLoadingAcc(true); setFetchErr("");
    const { data, error } = await supabase
      .from("meeting_recaps").select("*").eq("class_date", date);
    if (error) {
      setFetchErr(error.message || JSON.stringify(error));
      setRecaps([]);
    } else {
      const sorted = (data || []).sort((a, b) => timeToMinutes(a.class_time) - timeToMinutes(b.class_time));
      setRecaps(sorted);
    }
    setAccTime("All");
    setLoadingAcc(false);
  }

  useEffect(() => { fetchRecaps(accDate); }, [accDate]);

  async function handleEditSave(id) {
    setEditSaving(true); setEditErr("");
    const { error } = await supabase.from("meeting_recaps").update({ recap: editText }).eq("id", id);
    if (error) { setEditErr("Error saving."); setEditSaving(false); return; }
    setRecaps(rs => rs.map(r => r.id === id ? { ...r, recap: editText } : r));
    setEditingId(null); setEditSaving(false);
  }

  // Unique times for filter dropdown, in chronological order
  // Build unique times keyed by minute value to avoid string format mismatches
  const timesByMin = {};
  recaps.forEach(r => {
    const mins = timeToMinutes(r.class_time);
    if (!timesByMin[mins]) timesByMin[mins] = r.class_time;
  });
  const uniqueTimes = Object.entries(timesByMin)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, label]) => label);

  // Filter by minute value, not by string — immune to format variations
  const accMins = accTime === "All" ? null : timeToMinutes(accTime);
  const filtered = accMins === null ? recaps : recaps.filter(r => timeToMinutes(r.class_time) === accMins);

  // Group filtered recaps by time
  const grouped = filtered.reduce((acc, r) => {
    const key = r.class_time;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const sortedTimes = Object.keys(grouped).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

  const inputSt = {
    width: "100%", background: "rgba(240,236,224,0.05)", border: "1px solid rgba(240,236,224,0.1)",
    borderRadius: 10, color: "rgba(240,236,224,0.9)", fontFamily: "inherit", fontSize: 13,
    padding: "0.65rem 0.85rem", boxSizing: "border-box", outline: "none", appearance: "none",
    WebkitAppearance: "none",
  };
  const labelSt = { display: "block", fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" };

  return (
    <div style={{ maxWidth: 780, width: "100%" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: 13, color: C.text2 }}>Review AI generated summaries from previous classes.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr", gap: "1.25rem", alignItems: "start" }}>

        {/* ── CARD 1: Register (admin only) ───────────────────────── */}
        {isAdmin && (
          <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.green, marginBottom: "1.25rem" }}>Register Recap</p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelSt}>Date</label>
              <input type="date" value={regDate} onChange={e => setRegDate(e.target.value)}
                style={{ ...inputSt, colorScheme: "dark" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelSt}>
                Class {loadingEvs && <span style={{ color: C.text3, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— loading…</span>}
              </label>
              {!loadingEvs && events.length > 0 && events.every(ev => doneRecapNames.has(ev.subject))
                ? <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>✓ All recaps sent</div>
                : <>
                    <select value={selEvent} onChange={e => handleSelectEvent(e.target.value)}
                      style={{ ...inputSt, borderColor: regErrors.selEvent ? "#c20000" : "rgba(240,236,224,0.1)", cursor: "pointer" }}
                      disabled={loadingEvs || events.length === 0}>
                      <option value="">{loadingEvs ? "Loading classes…" : events.length === 0 ? "No classes on this date" : "Select class…"}</option>
                      {events.filter(ev => !doneRecapNames.has(ev.subject)).map(ev => <option key={ev.id} value={ev.subject}>{ev.subject}</option>)}
                    </select>
                    {regErrors.selEvent && <p style={{ fontSize: 11, color: "#c20000", marginTop: 4 }}>Select a class.</p>}
                  </>
              }
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelSt}>Time</label>
              <input type="text" value={regTime} onChange={e => { setRegTime(e.target.value); setRegErrors(er => ({ ...er, regTime: false })); }}
                placeholder="e.g. 8:00 PM"
                style={{ ...inputSt, borderColor: regErrors.regTime ? "#c20000" : "rgba(240,236,224,0.1)" }} />
              {regErrors.regTime && <p style={{ fontSize: 11, color: "#c20000", marginTop: 4 }}>Enter the class time.</p>}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelSt}>Recap (Teams AI Summary)</label>
              <textarea value={recapText} onChange={e => { setRecapText(e.target.value); setRegErrors(er => ({ ...er, recapText: false })); }}
                placeholder="Paste the Teams AI summary here…" rows={10}
                style={{ ...inputSt, resize: "vertical", lineHeight: 1.6, borderColor: regErrors.recapText ? "#c20000" : "rgba(240,236,224,0.1)" }} />
              {regErrors.recapText && <p style={{ fontSize: 11, color: "#c20000", marginTop: 4 }}>Paste the recap content.</p>}
            </div>

            {saveOk && <div style={{ background: "rgba(109,181,138,0.1)", border: "1px solid rgba(109,181,138,0.25)", borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "0.75rem", fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Recap saved successfully.</div>}
            {saveErr && <div style={{ background: "rgba(194,0,0,0.1)", border: "1px solid rgba(194,0,0,0.25)", borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "0.75rem", fontSize: 12, color: "#c20000", fontWeight: 600 }}>{saveErr}</div>}
            <button onClick={handleSave} disabled={saving}
              style={{ width: "100%", background: saving ? "rgba(109,181,138,0.4)" : C.green, border: "none", borderRadius: 10, color: "#0d0b08", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "0.8rem", cursor: saving ? "wait" : "pointer", transition: "background 0.15s" }}>
              {saving ? "Saving…" : "Save Recap"}
            </button>
          </div>
        )}

        {/* ── CARD 2: Access Recaps ────────────────────────────────── */}
        <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.amber, marginBottom: "1.25rem" }}>Access Recaps</p>

          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={labelSt}>Date</label>
              <input type="date" value={accDate} onChange={e => setAccDate(e.target.value)}
                style={{ ...inputSt, colorScheme: "dark" }} />
            </div>
            <div>
              <label style={labelSt}>Time</label>
              <select value={accTime} onChange={e => setAccTime(e.target.value)}
                style={{ ...inputSt, cursor: "pointer" }} disabled={recaps.length === 0}>
                <option value="All">All times</option>
                {uniqueTimes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Fetch error */}
          {fetchErr && <div style={{ background: "rgba(194,0,0,0.1)", border: "1px solid rgba(194,0,0,0.2)", borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "0.75rem", fontSize: 12, color: "#c20000" }}>Error: {fetchErr}</div>}

          {/* Count */}
          {!loadingAcc && !fetchErr && recaps.length > 0 && (
            <p style={{ fontSize: 11, color: C.text3, marginBottom: "0.75rem" }}>
              {recaps.length} recap{recaps.length !== 1 ? "s" : ""} found · showing {filtered.length}
              {accTime !== "All" ? ` at ${accTime}` : ""}
            </p>
          )}

          {/* Results */}
          {loadingAcc ? (
            <p style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: "2rem 0" }}>Loading recaps…</p>
          ) : fetchErr ? null : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ fontSize: 13, color: C.text3 }}>{recaps.length === 0 ? "No recaps found for this date." : "No recaps match the selected time."}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sortedTimes.map(time => (
                <div key={time}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: "0.5rem" }}>{time}</p>
                  {grouped[time].map(r => {
                    const isEditing = editingId === r.id;
                    const isOpen    = expanded[r.id];
                    const preview   = r.recap.length > 140 ? r.recap.slice(0, 140) + "…" : r.recap;
                    return (
                      <div key={r.id} style={{ background: "rgba(240,236,224,0.04)", border: `1px solid ${isEditing ? "rgba(240,236,224,0.2)" : "rgba(240,236,224,0.08)"}`, borderRadius: 12, padding: "1rem", marginBottom: "0.5rem", transition: "border-color 0.15s" }}>
                        {/* Header row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.6rem" }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>{r.event_name}</p>
                          {isAdmin && !isEditing && (
                            <button onClick={() => { setEditingId(r.id); setEditText(r.recap); setEditErr(""); setExpanded(ex => ({ ...ex, [r.id]: false })); }}
                              style={{ background: "rgba(240,236,224,0.06)", border: "1px solid rgba(240,236,224,0.1)", borderRadius: 7, color: C.text2, fontFamily: "inherit", fontSize: 10, fontWeight: 700, padding: "0.3rem 0.65rem", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <>
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={10}
                              style={{ ...inputSt, resize: "vertical", lineHeight: 1.6, marginBottom: "0.75rem" }} />
                            {editErr && <p style={{ fontSize: 11, color: "#c20000", marginBottom: "0.5rem" }}>{editErr}</p>}
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button onClick={() => handleEditSave(r.id)} disabled={editSaving}
                                style={{ flex: 1, background: C.green, border: "none", borderRadius: 8, color: "#0d0b08", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "0.6rem", cursor: editSaving ? "wait" : "pointer" }}>
                                {editSaving ? "Saving…" : "Save"}
                              </button>
                              <button onClick={() => setEditingId(null)}
                                style={{ flex: 1, background: "transparent", border: "1px solid rgba(240,236,224,0.1)", borderRadius: 8, color: C.text2, fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "0.6rem", cursor: "pointer" }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {isOpen
                              ? <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65, wordBreak: "break-word" }}
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(r.recap) }} />
                              : <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.65, wordBreak: "break-word", margin: 0 }}>
                                  {stripMd(r.recap).slice(0, 140)}{r.recap.length > 140 ? "…" : ""}
                                </p>
                            }
                            {r.recap.length > 140 && (
                              <button onClick={() => setExpanded(ex => ({ ...ex, [r.id]: !isOpen }))}
                                style={{ background: "transparent", border: "none", color: C.green, fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "0.4rem 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                {isOpen ? "Show less ↑" : "Read full recap ↓"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


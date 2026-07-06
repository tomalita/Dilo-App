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

import { SYLLABUS, CHAPTER_INFO, LEVEL_ORDER, TECHNIQUES } from "../lib/syllabus.js";

// ── CLASS HISTORY VIEW ─────────────────────────────────────────
// ── STUDENT PROGRESS VIEW ──────────────────────────────────────
// Syllabus v6.0 — capítulos por nivel (número + título corto)

export function ProgressView({ user }) {
  const [students,   setStudents]   = useState(null);
  const [selId,      setSelId]      = useState("");
  const [chapProg,   setChapProg]   = useState({});   // { "level-ch": row }
  const [techProg,   setTechProg]   = useState({});   // { techniqueKey: row }
  const [openLevels, setOpenLevels] = useState({});
  const [openChap,   setOpenChap]   = useState("");   // solo un capítulo abierto a la vez
  const [openTechs,  setOpenTechs]  = useState({});
  const [myName,     setMyName]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const STATUS_COLORS = [C.border2, C.amber, C.green];
  const CHAP_LABELS   = ["Not seen", "In progress", "Exit Task passed"];
  const TECH_LABELS   = ["Not introduced", "Practicing", "Mastered"];

  useEffect(() => {
    supabase.from("students_basic").select("*").eq("active", true).order("name")
      .then(({ data, error: e }) => {
        if (e) setError(e.message); else setStudents(data || []);
      });
    supabase.from("profiles").select("nombre").eq("id", user.id).single()
      .then(({ data }) => setMyName(data?.nombre || ""));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selStudent = (students || []).find(s => s.id === selId) || null;

  const loadProgress = async (sid) => {
    setLoading(true);
    const [{ data: ch }, { data: te }] = await Promise.all([
      supabase.from("student_chapter_progress").select("*").eq("student_id", sid),
      supabase.from("student_technique_progress").select("*").eq("student_id", sid),
    ]);
    const cm = {}; (ch || []).forEach(r => { cm[`${r.level}-${r.chapter}`] = r; });
    const tm = {}; (te || []).forEach(r => { tm[r.technique] = r; });
    setChapProg(cm); setTechProg(tm); setLoading(false);
  };

  const selectStudent = (sid) => {
    setSelId(sid); setChapProg({}); setTechProg({}); setOpenTechs({}); setOpenChap("");
    if (!sid) return;
    const stu = (students || []).find(s => s.id === sid);
    setOpenLevels(stu?.level ? { [stu.level]: true } : {});
    loadProgress(sid);
  };

  const cycleChapter = async (level, chapter) => {
    const key  = `${level}-${chapter}`;
    const cur  = chapProg[key]?.status || 0;
    const next = (cur + 1) % 3;
    const row  = { student_id: selId, level, chapter, status: next, updated_by: myName, updated_at: new Date().toISOString() };
    setChapProg(p => ({ ...p, [key]: { ...(p[key] || {}), ...row } }));
    const { error: e } = await supabase.from("student_chapter_progress")
      .upsert(row, { onConflict: "student_id,level,chapter" });
    if (e) { toast("Could not save: " + e.message); loadProgress(selId); }
  };

  const cycleTechnique = async (tkey) => {
    const cur  = techProg[tkey]?.status || 0;
    const next = (cur + 1) % 3;
    const row  = { student_id: selId, technique: tkey, status: next, updated_by: myName, updated_at: new Date().toISOString() };
    setTechProg(p => ({ ...p, [tkey]: { ...(p[tkey] || {}), ...row } }));
    const { error: e } = await supabase.from("student_technique_progress")
      .upsert(row, { onConflict: "student_id,technique" });
    if (e) { toast("Could not save: " + e.message); loadProgress(selId); }
  };

  const fmtWhen = (r) => {
    if (!r?.updated_at) return "";
    const d = new Date(r.updated_at);
    return `${r.updated_by ? r.updated_by.split(" ")[0] + " · " : ""}${d.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
  };

  const StatusDot = ({ status, onClick, title }) => (
    <button onClick={onClick} title={title}
      style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
        background: status > 0 ? STATUS_COLORS[status] : "transparent",
        border: `2px solid ${STATUS_COLORS[status]}`,
        transition: "all 0.15s" }} />
  );

  return (
    <div style={{ width: "100%", maxWidth: 800 }}>
      {/* Student picker */}
      <div style={{ ...CARD, borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1rem",
        display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>Student</p>
        <select value={selId} onChange={e => selectStudent(e.target.value)}
          style={{ flex: 1, minWidth: 180, background: "#1e1b17", color: C.text, fontFamily: "inherit",
            fontSize: 13, fontWeight: 600, padding: "0.5rem 0.7rem", borderRadius: 8,
            border: `1px solid ${C.border2}` }}>
          <option value="">Select a student...</option>
          {(students || []).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {selStudent && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "0.3rem 0.6rem", borderRadius: 6,
            background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: C.green }}>
            Level {selStudent.level}
          </span>
        )}
      </div>

      {error && <div style={{ ...CARD, padding: "1rem", marginBottom: "1rem" }}><p style={{ color: "#d95f5f", fontSize: 13 }}>{error}</p></div>}

      {!selId && !error && (
        <div style={{ ...CARD, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: C.text3, fontSize: 13 }}>Select a student to see their progress.</p>
        </div>
      )}

      {selId && (
        <>
          {/* Syllabus Progress header */}
          <div style={{ margin: "0.2rem 0 0.6rem", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text }}>
              Syllabus Progress
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>
              {LEVEL_ORDER.reduce((acc, lv) => acc + (SYLLABUS[lv]?.chapters.filter(([n]) => (chapProg[`${lv}-${n}`]?.status || 0) === 2).length || 0), 0)}/
              {LEVEL_ORDER.reduce((acc, lv) => acc + (SYLLABUS[lv]?.chapters.length || 0), 0)} chapters passed
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem", paddingLeft: 4 }}>
            {[0,1,2].map(s => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text3 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block",
                  background: s > 0 ? STATUS_COLORS[s] : "transparent", border: `2px solid ${STATUS_COLORS[s]}` }} />
                {CHAP_LABELS[s]}
              </span>
            ))}
          </div>

          {/* Chapters by level */}
          {STU_LEVELS.map(lv => {
            const conf = SYLLABUS[lv];
            if (!conf) return null;
            const total  = conf.chapters.length;
            const passed = conf.chapters.filter(([n]) => (chapProg[`${lv}-${n}`]?.status || 0) === 2).length;
            const open   = !!openLevels[lv];
            const isCurrent = selStudent?.level === lv;
            return (
              <div key={lv} style={{ ...CARD, borderRadius: 14, marginBottom: "0.6rem", overflow: "hidden",
                border: isCurrent ? "1px solid rgba(37,211,102,0.35)" : undefined }}>
                <div onClick={() => setOpenLevels(p => ({ ...p, [lv]: !p[lv] }))}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.1rem", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, color: C.text3, width: 14 }}>{open ? "▾" : "▸"}</span>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.text, flexShrink: 0 }}>{conf.label}</p>
                  {isCurrent && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: C.green,
                    textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: 4,
                    background: "rgba(37,211,102,0.1)" }}>current</span>}
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(240,236,224,0.07)", minWidth: 60 }}>
                    <div style={{ width: `${(passed/total)*100}%`, height: "100%", borderRadius: 3,
                      background: passed === total ? C.green : C.amber, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: passed === total ? C.green : C.text2, flexShrink: 0 }}>
                    {passed}/{total}
                  </p>
                </div>
                {open && (
                  <div style={{ borderTop: `1px solid ${C.border}` }}>
                    {conf.chapters.map(([n, title], i) => {
                      const chapKey = `${lv}-${n}`;
                      const row     = chapProg[chapKey];
                      const st      = row?.status || 0;
                      const info    = CHAPTER_INFO[chapKey];
                      const chOpen  = openChap === chapKey;
                      return (
                        <div key={n} style={{ borderBottom: i < conf.chapters.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.65rem 1.1rem" }}>
                            <StatusDot status={st} title={CHAP_LABELS[st]} onClick={() => cycleChapter(lv, n)} />
                            <div onClick={() => info && setOpenChap(cur => cur === chapKey ? "" : chapKey)}
                              style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem",
                                cursor: info ? "pointer" : "default", minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, flex: 1,
                                color: st === 2 ? C.text3 : C.text,
                                textDecoration: st === 2 ? "line-through" : "none" }}>
                                <span style={{ color: C.text3, fontWeight: 700, marginRight: 6 }}>Ch {n}</span>{title}
                              </p>
                              {st > 0 && <p style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>{fmtWhen(row)}</p>}
                              {info && <span style={{ fontSize: 11, color: C.text3, flexShrink: 0, marginLeft: 4 }}>{chOpen ? "▾" : "▸"}</span>}
                            </div>
                          </div>
                          {chOpen && info && (
                            <div style={{ padding: "0.2rem 1.1rem 1rem 3rem", display: "flex", flexDirection: "column", gap: 8 }}>
                              {[
                                ["Can-Do", info.canDo],
                                ["Grammar", info.grammar],
                                ["Spanish Traps", info.traps],
                                ["Chunks / Idioms", info.chunks],
                                ["Phrasal Verbs", info.pv],
                                ["Pronunciation", info.pron],
                                ["Technique", info.technique],
                                ["Exit Task", info.exitTask],
                              ].map(([label, content], j) => (
                                <div key={j}>
                                  <p style={{ fontSize: 10, fontWeight: 800, color: C.text3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
                                  <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.55 }}>{content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Communication Techniques Progress */}
          <div style={{ margin: "1.8rem 0 0.6rem", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text }}>
              Communication Techniques Progress
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>
              {TECHNIQUES.filter(t => (techProg[t.key]?.status || 0) === 2).length}/{TECHNIQUES.length} mastered
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem", paddingLeft: 4 }}>
            {[0,1,2].map(s => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text3 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block",
                  background: s > 0 ? STATUS_COLORS[s] : "transparent", border: `2px solid ${STATUS_COLORS[s]}` }} />
                {TECH_LABELS[s]}
              </span>
            ))}
          </div>
          {/* Techniques grouped by level */}
          {LEVEL_ORDER.map(lv => {
            const techs = TECHNIQUES.filter(t => t.level === lv);
            if (!techs.length) return null;
            const lvLabel = SYLLABUS[lv]?.label || lv;
            return (
              <div key={lv} style={{ marginBottom: "0.9rem" }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: C.text3, marginBottom: 6, paddingLeft: 4 }}>{lvLabel}</p>
                <div style={{ ...CARD, borderRadius: 14, overflow: "hidden" }}>
                  {techs.map((t, i) => {
                    const row  = techProg[t.key];
                    const st   = row?.status || 0;
                    const open = !!openTechs[t.key];
                    return (
                      <div key={t.key} style={{ borderBottom: i < techs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.65rem 1.1rem" }}>
                          <StatusDot status={st} title={TECH_LABELS[st]} onClick={() => cycleTechnique(t.key)} />
                          <div onClick={() => setOpenTechs(p => ({ ...p, [t.key]: !p[t.key] }))}
                            style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: st === 2 ? C.text3 : C.text }}>{t.name}</p>
                            <span style={{ fontSize: 11, color: C.text3, marginLeft: "auto", flexShrink: 0, paddingLeft: 8 }}>
                              {st > 0 && <span style={{ marginRight: 8 }}>{fmtWhen(row)}</span>}{open ? "▾" : "▸"}
                            </span>
                          </div>
                        </div>
                        {open && (
                          <div style={{ padding: "0 1.1rem 0.9rem 3rem" }}>
                            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.55, marginBottom: 6 }}>{t.desc}</p>
                            <p style={{ fontSize: 12, color: C.text3, fontStyle: "italic", lineHeight: 1.5 }}>{t.example}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ marginBottom: "2rem" }} />
          {loading && <p style={{ fontSize: 12, color: C.text3, textAlign: "center", marginBottom: "1rem" }}>Loading progress...</p>}
        </>
      )}
    </div>
  );
}


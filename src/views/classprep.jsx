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

// ── PLACEHOLDER (eliminado — reemplazado por AttendanceView rediseñado) ──
// ── CLASS PREP VIEW (Dilo Coach GEM) ──────────────────────────
const CLASS_PREP_TEMPLATE = `You are a class design assistant for DILO Club coaches. Your job is to:
- Design conversation-based English classes
- Explain grammar clearly and simply (the why, not just the how)
- Guide the coach step by step — never dump everything at once
- Always check your knowledge base before generating any material to ensure grammar and content align with the student's level

METHODOLOGICAL APPROACH
Always work under these principles:
- Speaking over perfection — fluency first
- Simple, clear grammar explanations
- Natural American English style
- Dynamic classes that feel like real conversations, not textbook exercises

MANDATORY CLASS OUTPUT FORMAT
To start with the design of the class, you will need a chapter or level, unless the coach asks for the index first.
Every class follows this exact structure, in order, with a coach checkpoint between sections.

Section 1 — Grammar Explanation (for the coach)
Clear, simple explanation of the target grammar point.
Include the most common errors made by Spanish speakers for that structure.

Section 2 — Topic and Narrative Suggestion
Suggest an engaging conversation topic appropriate for the level and grammar point.
Recommend the narrative type best suited for the topic and level (e.g. personal anecdote, hypothetical scenario, news-based discussion, debate, storytelling).
If the coach provides a topic, build from it — if not, suggest one proactively.
Checkpoint: Wait for coach confirmation before continuing.

Section 3 — Class Text
Generate a text connected to the grammar point and topic. Word count by level:
Foundation: 50 words | A1: 100–150 | A2: 150–200 | B1: 200–300 | B2/C1/C2: 300–400

Section 4 — List and translate the phrasal verbs in the text with an example each.

Section 5 — Questions and Discussion Material
Foundation/A1/A2: 15 questions, ordered easy to complex, targeting the chapter's grammar. Some may relate to the text topic — none are reading comprehension questions.
B1: 10 questions using the same format, plus 5 debate statements. Each statement includes 3 coach counters to challenge the student when they give their opinion.
B2/C1/C2: 5 debate statements only, each with 3 counters.

CRITICAL RESTRICTIONS
- Never use grammar structures beyond the student's current level
- Never use past tenses at Foundation or A1 level
- Never reference CEFR or external frameworks — use DILO levels only
- All content is designed for adult professionals ages 20 to 45
- The majority of students are Latin American — be culturally aware
- Every class must be oriented toward real professional conversation

STUDENT PROFILE
Adults 20–45 years old, mostly Latin American (large Costa Rican audience).
Goals: speak fluently and grow professionally. Motivated by relevant, real-world topics.

COACH INTERACTION STYLE
Direct, clear, and conversational. Give real, actionable class tips when relevant.
Always wait for coach confirmation at checkpoints before moving to the next section.
Never generate the full class in one shot — respect the step-by-step flow.

---
DILO CLUB OFFICIAL CURRICULUM
The following is the complete Dilo Club program. Use it as your primary reference for every class you design — chapters, grammar points, vocabulary, idioms, and phrasal verbs must always align with this curriculum.

__DILO_KNOWLEDGE__`;

// Curriculum (~200 KB de markdown) se carga solo cuando se abre Dilo Coach/Student,
// no en el bundle inicial.
let _classPrepSystem = null;
async function getClassPrepSystem() {
  if (_classPrepSystem) return _classPrepSystem;
  const mods = await Promise.all([
    import("../knowledge/diloclub_foundation_v5.1.md?raw"),
    import("../knowledge/diloclub_a1_v5.1.md?raw"),
    import("../knowledge/diloclub_a2_v5.1.md?raw"),
    import("../knowledge/diloclub_b1_v5.1.md?raw"),
    import("../knowledge/diloclub_b2_v5.1.md?raw"),
    import("../knowledge/diloclub_c1_v5.1.md?raw"),
    import("../knowledge/diloclub_c2_v5.1.md?raw"),
  ]);
  _classPrepSystem = CLASS_PREP_TEMPLATE.replace("__DILO_KNOWLEDGE__", mods.map(m => m.default).join("\n\n---\n\n"));
  return _classPrepSystem;
}

const PREP_SUGGESTIONS = [
  "Muéstrame el índice del capítulo actual",
  "Necesito una clase de B1 sobre Present Perfect",
  "A2 — tema: trabajo remoto",
  "Foundation — verbos to be y to have",
];

async function streamGemini(messages, onChunk, signal) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const systemText = await getClassPrepSystem();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key}&alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents: messages.map(m => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 8192, temperature: 1.0 },
    }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const evt  = JSON.parse(raw);
        const text = evt?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {}
    }
  }
}

function parseInline(text, kp = "") {
  const parts = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0, idx = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith("**"))      parts.push(<strong key={kp+idx++}>{m[2]}</strong>);
    else if (raw.startsWith("*"))  parts.push(<em key={kp+idx++}>{m[3]}</em>);
    else parts.push(<code key={kp+idx++} style={{ background:"rgba(240,236,224,0.08)", borderRadius:4, padding:"0 4px", fontSize:"0.88em", fontFamily:"monospace" }}>{m[4]}</code>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownMsg({ text, cursor }) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("### ")) {
      out.push(<p key={i} style={{ fontSize:13, fontWeight:700, color:C.green, margin:"1rem 0 0.2rem" }}>{parseInline(l.slice(4), `h3${i}`)}</p>);
    } else if (l.startsWith("## ")) {
      out.push(<p key={i} style={{ fontSize:15, fontWeight:800, color:C.text, margin:"1.4rem 0 0.3rem", letterSpacing:"-0.01em" }}>{parseInline(l.slice(3), `h2${i}`)}</p>);
    } else if (l.startsWith("# ")) {
      out.push(<p key={i} style={{ fontSize:17, fontWeight:900, color:C.text, margin:"1.5rem 0 0.4rem", letterSpacing:"-0.02em" }}>{parseInline(l.slice(2), `h1${i}`)}</p>);
    } else if (/^---+$/.test(l.trim())) {
      out.push(<div key={i} style={{ height:1, background:C.border, margin:"1rem 0" }} />);
    } else if (/^[-*+] /.test(l)) {
      const items = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom:"0.2rem", lineHeight:1.65 }}>{parseInline(lines[i].slice(2), `li${i}`)}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} style={{ paddingLeft:"1.3rem", margin:"0.35rem 0", fontSize:14, color:C.text }}>{items}</ul>);
      continue;
    } else if (/^\d+\. /.test(l)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom:"0.25rem", lineHeight:1.65 }}>{parseInline(lines[i].replace(/^\d+\. /,""), `oli${i}`)}</li>);
        i++;
      }
      out.push(<ol key={`ol${i}`} style={{ paddingLeft:"1.3rem", margin:"0.35rem 0", fontSize:14, color:C.text }}>{items}</ol>);
      continue;
    } else if (l.trim() === "") {
      if (out.length) out.push(<div key={`sp${i}`} style={{ height:"0.45rem" }} />);
    } else {
      const isLast = i === lines.length - 1;
      out.push(
        <p key={i} style={{ fontSize:14, lineHeight:1.7, color:C.text, margin:"0.05rem 0" }}>
          {parseInline(l, `p${i}`)}
          {isLast && cursor && (
            <span style={{ display:"inline-block", width:2, height:"1em", background:C.green,
              marginLeft:2, verticalAlign:"text-bottom", animation:"pulse 0.8s ease-in-out infinite" }} />
          )}
        </p>
      );
    }
    i++;
  }
  if (cursor && out.length === 0) {
    out.push(<span key="think" style={{ color:C.text3, fontSize:13 }}>Pensando…</span>);
  }
  return <div>{out}</div>;
}

export function ClassPrepView() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const textareaRef = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;
    const userMsg = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      await streamGemini(history, (chunk) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }, abortRef.current.signal);
    } catch (err) {
      if (err?.name === "AbortError") return;
      const errText = err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("403")
        ? "API key inválida. Verifica VITE_GEMINI_API_KEY en .env.local"
        : "Error: " + (err?.message || "Unknown error");
      setMessages(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: errText }];
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => { if (!streaming) { setMessages([]); setInput(""); inputRef.current?.focus(); } };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
      height: "100%", maxWidth: 760, width: "100%" }}>

      {/* Toolbar */}
      {messages.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 0.75rem 0", flexShrink: 0 }}>
          <button onClick={reset} disabled={streaming}
            style={{ ...SEL(), padding: "0.3rem 0.75rem", fontSize: 11, opacity: streaming ? 0.4 : 1 }}>
            Nueva conversación
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
        display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "0.5rem" }}>

        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "1.5rem", padding: "2rem 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(109,181,138,0.12)",
              border: "1px solid rgba(109,181,138,0.3)", display: "flex", alignItems: "center",
              justifyContent: "center" }}>
              <DiloLogo height={24} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 6 }}>Prep Class</p>
              <p style={{ fontSize: 13, color: C.text3, maxWidth: 320, lineHeight: 1.6 }}>
                Diseña clases paso a paso. Empieza con el nivel y capítulo, o pide el índice primero.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: 400 }}>
              {PREP_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ ...SEL(), padding: "0.4rem 0.75rem", fontSize: 12, color: C.text2,
                    border: `1px solid ${C.border}`, borderRadius: 20, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const isLast = i === messages.length - 1;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column",
              alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
              {!isUser && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingLeft: 2 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(109,181,138,0.15)",
                    border: "1px solid rgba(109,181,138,0.3)", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: C.green }}>D</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.text3,
                    letterSpacing: "0.06em", textTransform: "uppercase" }}>Dilo</span>
                </div>
              )}
              <div style={{
                maxWidth: "85%",
                padding: isUser ? "0.6rem 1rem" : "0",
                background: isUser ? C.surface2 : "transparent",
                border: isUser ? `1px solid ${C.border2}` : "none",
                borderRadius: isUser ? 14 : 0,
                wordBreak: "break-word",
              }}>
                {isUser
                  ? <p style={{ fontSize:14, lineHeight:1.7, color:C.text, whiteSpace:"pre-wrap" }}>{msg.content}</p>
                  : <MarkdownMsg text={msg.content} cursor={streaming && isLast} />
                }
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: "0.75rem",
        borderTop: `1px solid ${C.border}`, marginTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end",
          background: C.surface2, border: `1px solid ${C.border2}`,
          borderRadius: 16, padding: "0.6rem 0.75rem" }}>
          <textarea
            ref={el => { inputRef.current = el; textareaRef.current = el; }}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={onKeyDown}
            disabled={streaming}
            placeholder="Escribe aquí… (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none",
              color: C.text, fontSize: 14, fontFamily: "inherit", resize: "none",
              lineHeight: 1.6, padding: 0, maxHeight: 140, overflowY: "auto",
              scrollbarWidth: "none", opacity: streaming ? 0.5 : 1 }} />
          <button onClick={() => send()} disabled={streaming || !input.trim()}
            style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer",
              background: streaming || !input.trim() ? C.surface : C.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s", WebkitTapHighlightColor: "transparent" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={streaming || !input.trim() ? C.text3 : C.bg} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 10, color: C.text3, marginTop: "0.4rem", textAlign: "center" }}>
          Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}


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

// ── WHATSAPP VIEW ──────────────────────────────────────────────
const WA_TEMPLATES = [
  {
    name: "dilo_class_reminder",
    label: "Recordatorio de clase",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre del estudiante" },
      { name: "hora",     label: "Hora de la clase" },
      { name: "coach",    label: "Nombre del coach" },
    ],
    description: "Avisa al estudiante que su clase empieza en 1 hora.",
    category: "class_reminder",
  },
  {
    name: "dilo_payment_reminder",
    label: "Recordatorio de pago",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre del estudiante" },
      { name: "monto",    label: "Monto (₡)" },
      { name: "fecha",    label: "Fecha de vencimiento" },
    ],
    description: "Recuerda al estudiante que su pago vence pronto.",
    category: "payment_reminder",
  },
  {
    name: "dilo_payment_overdue",
    label: "Pago vencido",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre del estudiante" },
      { name: "monto",    label: "Monto (₡)" },
      { name: "fecha",    label: "Fecha programada" },
    ],
    description: "Notifica al estudiante que su pago está vencido.",
    category: "payment_overdue",
  },
  {
    name: "dilo_announcement",
    label: "Anuncio general",
    language: "en",
    params: [
      { name: "nombre",   label: "Nombre (o 'comunidad Dilo')" },
      { name: "mensaje",  label: "Mensaje del anuncio" },
    ],
    description: "Envía un anuncio general a estudiantes o coaches.",
    category: "announcement",
  },
];

const WA_STATUS_COLOR = { sent: C.green, failed: C.red, pending: C.text2 };

export function WhatsAppView({ user, role }) {
  const [tab, setTab]           = useState("send");
  const [template, setTemplate] = useState(WA_TEMPLATES[0].name);
  const [toPhone, setToPhone]   = useState("");
  const [params, setParams]     = useState([]);
  const [sending, setSending]   = useState(false);
  const [sendOk, setSendOk]     = useState(false);
  const [sendErr, setSendErr]   = useState("");

  const [history, setHistory]     = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histErr, setHistErr]     = useState("");

  const [inbox, setInbox]           = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxErr, setInboxErr]     = useState("");
  const [unread, setUnread]         = useState(0);

  const tpl = WA_TEMPLATES.find(t => t.name === template) || WA_TEMPLATES[0];

  useEffect(() => {
    setParams(tpl.params.map(() => ""));
  }, [template]);

  async function handleSend() {
    if (!toPhone.trim()) { setSendErr("Enter a phone number."); return; }
    setSending(true); setSendOk(false); setSendErr("");
    try {
      const res = await fetch(WHATSAPP_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "send",
          to: toPhone.trim(),
          template: tpl.name,
          language: tpl.language,
          params: tpl.params.map((p, i) =>
            typeof p === "object" ? { name: p.name, value: params[i] || "" } : params[i] || ""
          ),
          category: tpl.category,
        }),
      });
      const d = await res.json();
      if (d.failed > 0) {
        setSendErr(d.results[0]?.error || "Failed to send.");
      } else {
        setSendOk(true);
        setToPhone("");
        setParams(tpl.params.map(() => ""));
        setTimeout(() => setSendOk(false), 3000);
      }
    } catch (e) {
      setSendErr(e.message);
    } finally {
      setSending(false);
    }
  }

  async function fetchHistory() {
    setLoadingHist(true); setHistErr("");
    try {
      const res = await fetch(WHATSAPP_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + ANON_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "history", limit: 50 }),
      });
      const d = await res.json();
      if (d.error) { setHistErr(d.error); return; }
      setHistory(d.messages || []);
    } catch (e) {
      setHistErr(e.message);
    } finally {
      setLoadingHist(false);
    }
  }

  async function fetchInbox() {
    setLoadingInbox(true); setInboxErr("");
    try {
      const { data, error } = await supabase
        .from("whatsapp_inbox")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const msgs = data || [];
      setInbox(msgs);
      setUnread(msgs.filter(m => !m.is_read).length);
    } catch (e) {
      setInboxErr(e.message);
    } finally {
      setLoadingInbox(false);
    }
  }

  async function markAllRead() {
    await supabase.from("whatsapp_inbox").update({ is_read: true }).eq("is_read", false);
    setInbox(prev => prev.map(m => ({ ...m, is_read: true })));
    setUnread(0);
  }

  useEffect(() => {
    if (tab === "history") fetchHistory();
    if (tab === "inbox")   fetchInbox();
  }, [tab]);

  useEffect(() => {
    const ch = supabase
      .channel("whatsapp_inbox_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_inbox" }, p => {
        setInbox(prev => [p.new, ...prev]);
        setUnread(n => n + 1);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const card = { background: C.card, borderRadius: 14, padding: "1.5rem", marginBottom: "1rem" };
  const label = { display: "block", fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" };
  const input = {
    width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8, border: `1.5px solid ${C.border}`,
    background: C.bg, color: C.text, fontSize: 14, outline: "none",
  };
  const tabBtn = (id) => ({
    padding: "0.45rem 1.1rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: tab === id ? C.green : "transparent",
    color: tab === id ? "#000" : C.text2,
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: 680, margin: "0 auto" }}>
      <p style={{ color: C.text2, fontSize: 13, marginBottom: "1.25rem" }}>
        Send WhatsApp messages to students and coaches via Meta Cloud API.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
        <button style={tabBtn("send")}    onClick={() => setTab("send")}>Send Message</button>
        <button style={tabBtn("history")} onClick={() => setTab("history")}>History</button>
        <button style={{ ...tabBtn("inbox"), position: "relative" }} onClick={() => setTab("inbox")}>
          Inbox
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: C.red, color: "#fff", fontSize: 10, fontWeight: 700,
              borderRadius: "50%", width: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{unread}</span>
          )}
        </button>
      </div>

      {/* ── SEND TAB ── */}
      {tab === "send" && (
        <div style={card}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={label}>Template</span>
            <select value={template} onChange={e => setTemplate(e.target.value)} style={input}>
              {WA_TEMPLATES.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: C.text2, marginTop: 5 }}>{tpl.description}</p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <span style={label}>Recipient Phone (with country code)</span>
            <input
              style={input}
              placeholder="+50688887777"
              value={toPhone}
              onChange={e => { setToPhone(e.target.value); setSendErr(""); }}
            />
          </div>

          {tpl.params.map((p, i) => (
            <div key={i} style={{ marginBottom: "1rem" }}>
              <span style={label}>{typeof p === "object" ? p.label : p}</span>
              <input
                style={input}
                value={params[i] || ""}
                onChange={e => setParams(ps => ps.map((p, j) => j === i ? e.target.value : p))}
              />
            </div>
          ))}

          {sendErr && <p style={{ color: C.red, fontSize: 13, marginBottom: "0.75rem" }}>{sendErr}</p>}
          {sendOk  && <p style={{ color: C.green, fontSize: 13, marginBottom: "0.75rem" }}>Message sent!</p>}

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: "0.6rem 1.5rem", borderRadius: 8, border: "none", cursor: sending ? "not-allowed" : "pointer",
              background: C.green, color: "#000", fontWeight: 700, fontSize: 14,
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? "Sending…" : "Send"}
          </button>

          <div style={{ marginTop: "1.5rem", padding: "0.85rem", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Note — Test mode</p>
            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
              Only numbers added as test recipients in Meta can receive messages right now.
              Additional templates (class reminders, payment reminders) will be available after
              Meta approves the business verification (~2 days).
            </p>
          </div>
        </div>
      )}

      {/* ── INBOX TAB ── */}
      {tab === "inbox" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 13, color: C.text2 }}>
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  padding: "0.3rem 0.8rem", borderRadius: 6, border: `1px solid ${C.border}`,
                  background: "transparent", color: C.text2, fontSize: 12, cursor: "pointer",
                }}>Mark all read</button>
              )}
              <button onClick={fetchInbox} style={{
                padding: "0.3rem 0.8rem", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text2, fontSize: 12, cursor: "pointer",
              }}>Refresh</button>
            </div>
          </div>
          {loadingInbox && <p style={{ color: C.text2, fontSize: 14 }}>Loading…</p>}
          {inboxErr     && <p style={{ color: C.red,   fontSize: 14 }}>{inboxErr}</p>}
          {!loadingInbox && !inboxErr && inbox.length === 0 && (
            <p style={{ color: C.text2, fontSize: 14 }}>No messages received yet.</p>
          )}
          {inbox.map(msg => (
            <div key={msg.id} style={{
              ...card,
              borderLeft: msg.is_read ? `3px solid transparent` : `3px solid ${C.green}`,
              opacity: msg.is_read ? 0.75 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{msg.from_name || msg.from_phone}</span>
                  {msg.from_name && (
                    <span style={{ fontSize: 12, color: C.text2, marginLeft: 8 }}>{msg.from_phone}</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: C.text2, whiteSpace: "nowrap" }}>
                  {new Date(msg.created_at).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" })}
                </span>
              </div>
              <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.5 }}>{msg.message_body}</p>
              {msg.message_type !== "text" && (
                <span style={{ fontSize: 11, color: C.text2, marginTop: 4, display: "block" }}>[{msg.message_type}]</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div>
          {loadingHist && <p style={{ color: C.text2, fontSize: 14 }}>Loading…</p>}
          {histErr     && <p style={{ color: C.red,   fontSize: 14 }}>{histErr}</p>}
          {!loadingHist && !histErr && history.length === 0 && (
            <p style={{ color: C.text2, fontSize: 14 }}>No messages sent yet.</p>
          )}
          {history.map(msg => (
            <div key={msg.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{msg.to_phone}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: (WA_STATUS_COLOR[msg.status] || C.text2) + "22",
                  color: WA_STATUS_COLOR[msg.status] || C.text2,
                }}>
                  {msg.status}
                </span>
              </div>
              <span style={{ fontSize: 12, color: C.text2 }}>
                {msg.template_name}
                {msg.params?.length ? ` · ${msg.params.join(", ")}` : ""}
              </span>
              {msg.error_message && (
                <span style={{ fontSize: 12, color: C.red }}>{msg.error_message}</span>
              )}
              <span style={{ fontSize: 11, color: C.text2 }}>
                {new Date(msg.created_at).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


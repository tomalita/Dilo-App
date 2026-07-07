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

// ── CASHIER VIEW ───────────────────────────────────────────────
export function CashierView() {
  const [links,        setLinks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [createModal,  setCreateModal]  = useState(false);
  const [copied,       setCopied]       = useState(null);
  const [form,         setForm]         = useState({ description: "", customerName: "", amount: "", currency: "CRC", notes: "" });
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState(null);

  // Embedded charge
  const sdkRef                           = useRef(null);
  const [chargeModal,  setChargeModal]  = useState(false);
  const [chargeForm,   setChargeForm]   = useState({ description: "", customerName: "", amount: "", currency: "CRC" });
  const [chargeStep,   setChargeStep]   = useState("form"); // "form" | "sdk"
  const [chargeIntent, setChargeIntent] = useState(null);
  const [charging,     setCharging]     = useState(false);
  const [chargeError,  setChargeError]  = useState(null);
  const [chargeDone,   setChargeDone]   = useState(false);

  const loadLinks = async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_links").select("*").order("created_at", { ascending: false });
    setLinks(data || []);
    setLoading(false);
  };
  useEffect(() => { loadLinks(); }, []);

  const createLink = async () => {
    if (!form.description || !form.amount) return;
    setCreating(true); setCreateError(null);
    try {
      const res  = await fetch(CASHIER_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description, amount: parseInt(form.amount), currency: form.currency, customerName: form.customerName || null, notes: form.notes || null }),
      });
      const data = await res.json();
      if (data.error) { setCreateError(data.error); return; }
      setCreateModal(false);
      setForm({ description: "", customerName: "", amount: "", currency: "CRC", notes: "" });
      loadLinks();
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link.onvo_url);
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const cancelLink = async (id) => {
    await supabase.from("payment_links").update({ status: "cancelled" }).eq("id", id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: "cancelled" } : l));
  };

  const openChargeModal = () => {
    setChargeForm({ description: "", customerName: "", amount: "", currency: "CRC" });
    setChargeStep("form"); setChargeIntent(null); setChargeError(null); setChargeDone(false);
    setChargeModal(true);
  };

  const initCharge = async () => {
    if (!chargeForm.description || !chargeForm.amount) { setChargeError("Description and amount are required."); return; }
    setCharging(true); setChargeError(null);
    try {
      const res  = await fetch(CASHIER_INTENT_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ description: chargeForm.description, amount: parseInt(chargeForm.amount), currency: chargeForm.currency }),
      });
      const data = await res.json();
      if (data.error) { setChargeError(data.error); return; }
      setChargeIntent(data.id);
      setChargeStep("sdk");
    } catch (e) {
      setChargeError(e.message);
    } finally {
      setCharging(false);
    }
  };

  // Render ONVO SDK once intent is ready and container is mounted
  useEffect(() => {
    if (chargeStep !== "sdk" || !chargeIntent || !sdkRef.current) return;
    if (!window.onvo) { setChargeError("ONVO SDK not loaded."); return; }
    sdkRef.current.innerHTML = "";
    window.onvo.pay({
      publicKey:       ONVO_PUBLIC_KEY,
      paymentIntentId: chargeIntent,
      paymentType:     "one_time",
      locale:          "es",
      onSuccess: async () => {
        await supabase.from("payment_links").insert({
          description:     chargeForm.description,
          amount:          parseInt(chargeForm.amount),
          currency:        chargeForm.currency,
          customer_name:   chargeForm.customerName || null,
          onvo_session_id: chargeIntent,
          status:          "paid",
          paid_at:         new Date().toISOString(),
        });
        setChargeDone(true);
        loadLinks();
      },
      onError: (err) => {
        setChargeError(typeof err === "string" ? err : (err?.message ?? "Payment failed."));
      },
    }).render(sdkRef.current);
  }, [chargeStep, chargeIntent]);

  const fmtAmt = (amount, currency) =>
    currency === "USD" ? `$${(amount / 100).toFixed(2)}` : `₡${Number(amount).toLocaleString("es-CR")}`;

  const fmtD = (d) => d ? new Date(d).toLocaleDateString("es-CR", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const now        = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  const paidLinks    = links.filter(l => l.status === "paid");
  const pendingLinks = links.filter(l => l.status === "pending");
  const paidMonth    = paidLinks.filter(l => l.paid_at >= monthStart);
  const collCRC = paidMonth.filter(l => l.currency === "CRC").reduce((s, l) => s + l.amount, 0);
  const collUSD = paidMonth.filter(l => l.currency === "USD").reduce((s, l) => s + l.amount / 100, 0);

  const visible = filterStatus === "pending"  ? pendingLinks
                : filterStatus === "paid"     ? paidLinks
                : links.filter(l => l.status !== "cancelled");

  const STATUS_C = { pending: C.amber, paid: C.green, cancelled: C.text3 };
  const STATUS_L = { pending: "Pending", paid: "Paid", cancelled: "Cancelled" };

  const inputStyle = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" };

  return (
    <div style={{ width: "100%", maxWidth: 1040 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>Cashier</p>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Payment links via OnvoyPay</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={openChargeModal}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Charge
          </button>
          <button onClick={() => setCreateModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.text, color: C.bg2, border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Collected CRC", value: `₡${collCRC.toLocaleString("es-CR")}`, sub: "This month" },
          { label: "Collected USD", value: `$${collUSD.toFixed(2)}`,               sub: "This month" },
          { label: "Pending",       value: pendingLinks.length, sub: "Awaiting payment", accent: pendingLinks.length > 0 ? C.amber : undefined },
          { label: "Total paid",    value: paidLinks.length,   sub: "All time",          accent: C.green },
        ].map((s, i) => (
          <div key={i} style={{ ...CARD, borderRadius: 14, padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.4rem" }}>{s.label}</p>
            <p style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: s.accent || C.text, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {[["all","All"], ["pending","Pending"], ["paid","Paid"]].map(([mode, label]) => {
          const active = filterStatus === mode;
          const col    = mode === "pending" ? C.amber : mode === "paid" ? C.green : C.text2;
          return (
            <button key={mode} onClick={() => setFilterStatus(mode)}
              style={{ padding: "0.35rem 0.75rem", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${active ? col : C.border}`, background: active ? `${col}18` : "transparent", color: active ? col : C.text3, transition: "all 0.15s" }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ ...CARD, borderRadius: 14, padding: "3rem", display: "flex", justifyContent: "center", gap: 6 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ ...CARD, borderRadius: 14, padding: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.text3 }}>No payment links yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ ...CARD, borderRadius: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Customer / Description", "Amount", "Status", "Created", "Actions"].map((h, i) => (
                  <th key={i} style={{ padding: "0.55rem 1rem", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, textAlign: i === 0 ? "left" : "center", background: C.surface2, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((link, i) => (
                <tr key={link.id} style={{ borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{link.customer_name || "—"}</p>
                    <p style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{link.description}</p>
                    {link.notes && <p style={{ fontSize: 10, color: C.text3, marginTop: 1, fontStyle: "italic" }}>{link.notes}</p>}
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmtAmt(link.amount, link.currency)}</span>
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 50, border: `1px solid ${STATUS_C[link.status]}`, color: STATUS_C[link.status], letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {STATUS_L[link.status]}
                    </span>
                    {link.paid_at && <p style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{fmtD(link.paid_at)}</p>}
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: C.text3 }}>{fmtD(link.created_at)}</p>
                  </td>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      {link.onvo_url && link.status === "pending" && (
                        <button onClick={() => copyLink(link)}
                          style={{ background: copied === link.id ? `${C.green}18` : C.surface2, border: `1px solid ${copied === link.id ? C.green : C.border}`, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: copied === link.id ? C.green : C.text2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                          {copied === link.id ? "Copied!" : "Copy link"}
                        </button>
                      )}
                      {link.status === "pending" && (
                        <button onClick={() => cancelLink(link.id)}
                          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: C.text3, cursor: "pointer", fontFamily: "inherit" }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charge modal — embedded ONVO SDK */}
      {chargeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ ...CARD, borderRadius: 18, padding: "1.5rem", width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Charge</p>
                {chargeStep === "sdk" && !chargeDone && <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{chargeForm.customerName || "Customer"} · {chargeForm.currency} {parseInt(chargeForm.amount).toLocaleString("es-CR")}</p>}
              </div>
              <button onClick={() => { setChargeModal(false); setChargeStep("form"); setChargeIntent(null); setChargeDone(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, display: "flex", padding: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {chargeDone ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <p style={{ fontSize: 32, marginBottom: "0.75rem" }}>✅</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.green }}>Payment successful</p>
                <p style={{ fontSize: 13, color: C.text3, marginTop: 6 }}>Recorded in Cashier.</p>
                <button onClick={() => { setChargeModal(false); setChargeStep("form"); setChargeDone(false); }}
                  style={{ marginTop: "1.5rem", background: C.text, color: C.bg2, border: "none", borderRadius: 10, padding: "0.65rem 1.5rem", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Done
                </button>
              </div>
            ) : chargeStep === "form" ? (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={labelStyle}>Description *</p>
                  <input value={chargeForm.description} onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Mensualidad junio 2026" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={labelStyle}>Customer name</p>
                  <input value={chargeForm.customerName} onChange={e => setChargeForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Ronald Ibarra" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <p style={labelStyle}>Amount *</p>
                    <input value={chargeForm.amount} onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value.replace(/\D/g,"") }))} placeholder="50000" inputMode="numeric" style={inputStyle} />
                  </div>
                  <div>
                    <p style={labelStyle}>Currency</p>
                    <select value={chargeForm.currency} onChange={e => setChargeForm(p => ({ ...p, currency: e.target.value }))} style={inputStyle}>
                      <option value="CRC">CRC ₡</option>
                      <option value="USD">USD $</option>
                    </select>
                  </div>
                </div>
                {chargeError && <p style={{ fontSize: 12, color: C.red, marginBottom: "0.75rem" }}>{chargeError}</p>}
                <button onClick={initCharge} disabled={charging || !chargeForm.description || !chargeForm.amount}
                  style={{ width: "100%", background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "0.8rem", fontSize: 13, fontWeight: 800, cursor: (charging || !chargeForm.description || !chargeForm.amount) ? "not-allowed" : "pointer", opacity: (charging || !chargeForm.description || !chargeForm.amount) ? 0.5 : 1, fontFamily: "inherit" }}>
                  {charging ? "Preparing…" : "Continue to payment"}
                </button>
              </>
            ) : (
              <>
                {chargeError && <p style={{ fontSize: 12, color: C.red, marginBottom: "0.75rem" }}>{chargeError}</p>}
                <div ref={sdkRef} style={{ minHeight: 200 }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Create modal — defined inline to avoid focus loss on re-render */}
      {createModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ ...CARD, borderRadius: 18, padding: "1.5rem", width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>New payment link</p>
              <button onClick={() => { setCreateModal(false); setCreateError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, display: "flex", padding: 2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={labelStyle}>Description *</p>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Mensualidad junio 2026" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={labelStyle}>Customer name</p>
              <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Ronald Ibarra" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={labelStyle}>Notes</p>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes (optional)" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Amount *</p>
                <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value.replace(/\D/g,"") }))}
                  placeholder="50000" inputMode="numeric"
                  style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Currency</p>
                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                  style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                  <option value="CRC">CRC ₡</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
            </div>
            {createError && <p style={{ fontSize: 12, color: C.red, marginBottom: "0.75rem" }}>{createError}</p>}
            <button onClick={createLink} disabled={creating || !form.description || !form.amount}
              style={{ width: "100%", background: C.text, color: C.bg2, border: "none", borderRadius: 12, padding: "0.8rem", fontSize: 13, fontWeight: 800, cursor: (creating || !form.description || !form.amount) ? "not-allowed" : "pointer", opacity: (creating || !form.description || !form.amount) ? 0.5 : 1, fontFamily: "inherit" }}>
              {creating ? "Creating…" : "Create payment link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


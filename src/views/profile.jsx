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

export function InvitesView({ user }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ rol: "student", plan: "Group" });
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCodes(); }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = () => Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
    return `DILO-${seg()}-${seg()}`;
  };

  const createCode = async () => {
    setCreating(true); setError(null);
    const code = generateCode();
    const { data, error: err } = await supabase.from("invite_codes").insert({
      code, rol: form.rol, plan: form.rol === "student" ? form.plan : null, creado_por: user?.id || null,
    }).select().single();
    if (err || !data) setError("Error creating code. Please try again.");
    else setCodes(prev => [data, ...prev]); // insert optimista — sin recargar toda la lista
    setCreating(false);
  };

  const deleteCode = async (id) => {
    if (!window.confirm("Delete this code?")) return;
    setDeleting(id);
    const { error: err } = await supabase.from("invite_codes").delete().eq("id", id);
    if (err) { setDeleting(null); toast("Could not delete code"); return; }
    setCodes(prev => prev.filter(c => c.id !== id)); // remove optimista — sin flash
    setDeleting(null);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code); setTimeout(() => setCopied(null), 2000);
  };

  const copyWhatsApp = (code, rol, plan) => {
    const planText = plan ? ` — Plan: ${plan}` : "";
    const msg = `Hola! Te comparto tu código de acceso a la plataforma de Dilo Club 🎓\n\nCódigo: *${code}*\nRol: ${rol === "student" ? "Student" : "Coach"}${planText}\n\nIngresá a: dilo.club/app → "Crear cuenta con código"`;
    navigator.clipboard.writeText(msg);
    setCopied(code + "_wa"); setTimeout(() => setCopied(null), 2000);
  };

  const WA_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  const COPY_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  const TRASH_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
  const BTN = { padding: "0.35rem 0.85rem", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "transparent" };

  const available = codes.filter(c => !c.usado);
  const used      = codes.filter(c =>  c.usado);
  const displayed = filter === "available" ? available : filter === "used" ? used : codes;

  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      {/* Create new code */}
      <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: "1rem" }}>New code</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {["student","coach"].map(r => (
            <button key={r} onClick={() => setForm(f => ({ ...f, rol: r }))}
              style={{ ...BTN, border: `1px solid ${form.rol === r ? C.text : C.border2}`, color: form.rol === r ? C.text : C.text3 }}>
              {r === "student" ? "Student" : "Coach"}
            </button>
          ))}
          {form.rol === "student" && ["Group","Private"].map(p => (
            <button key={p} onClick={() => setForm(f => ({ ...f, plan: p }))}
              style={{ ...BTN, border: `1px solid ${form.plan === p ? C.text : C.border2}`, color: form.plan === p ? C.text : C.text3 }}>
              {p}
            </button>
          ))}
          <button onClick={createCode} disabled={creating}
            style={{ ...BTN, border: "none", background: creating ? C.surface2 : "#f0ece0", color: creating ? C.text3 : "#0d0b08", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: creating ? "default" : "pointer" }}>
            {creating ? "Generating..." : "Generate code"}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: C.red, marginTop: "0.75rem" }}>{error}</p>}
      </div>

      {/* Filter tabs + counts */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { key: "all",       label: "All",       count: codes.length },
          { key: "available", label: "Available",  count: available.length },
          { key: "used",      label: "Used",        count: used.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.3rem 0.75rem", borderRadius: 50, border: `1px solid ${filter === tab.key ? C.text : C.border2}`, background: "transparent", color: filter === tab.key ? C.text : C.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {tab.label}
            <span style={{ fontSize: 10, fontWeight: 700, background: filter === tab.key ? C.surface2 : "transparent", borderRadius: 50, padding: "0 4px", minWidth: 16, textAlign: "center" }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...CARD, borderRadius: 14, padding: "2rem", display: "flex", justifyContent: "center", gap: 6 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ ...CARD, borderRadius: 14, padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.text3 }}>{codes.length === 0 ? "No codes generated yet." : "No codes in this filter."}</p>
        </div>
      ) : (
        <div style={{ ...CARD, borderRadius: 14, overflow: "hidden" }}>
          {displayed.map((c, i) => (
            <div key={c.id} style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: i < displayed.length-1 ? `1px solid ${C.border}` : "none" }}>

              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: c.usado ? C.text3 : C.green, opacity: c.usado ? 0.4 : 1 }} />

              {/* Code + copy */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 180 }}>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, fontWeight: 700, color: c.usado ? C.text3 : C.text, letterSpacing: "0.1em" }}>{c.code}</p>
                <button onClick={() => copyCode(c.code)} title="Copy"
                  style={{ width: 24, height: 24, borderRadius: "50%", border: `1px solid ${C.border2}`, background: "transparent", color: copied===c.code ? C.green : C.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {copied===c.code ? <span style={{fontSize:10}}>✓</span> : COPY_ICON}
                </button>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: "0.35rem", flex: 1, flexWrap: "wrap" }}>
                {[c.rol === "student" ? "Student" : c.rol === "coach" ? "Coach" : "Admin", c.plan].filter(Boolean).map((label, li) => (
                  <span key={li} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 50, background: "transparent", color: C.text2, border: `1px solid ${C.border2}` }}>
                    {label}
                  </span>
                ))}
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 50, background: "transparent",
                  color: c.usado ? C.text3 : C.green,
                  border: `1px solid ${c.usado ? C.border2 : C.green+"55"}` }}>
                  {c.usado ? "Used" : "Available"}
                </span>
              </div>

              {/* WhatsApp — available only */}
              {!c.usado && (
                <button onClick={() => copyWhatsApp(c.code, c.rol, c.plan)}
                  style={{ height: 26, padding: "0 0.6rem", borderRadius: 50, border: `1px solid ${C.green}55`, background: "transparent", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {WA_ICON}
                  <span>{copied===c.code+"_wa" ? "✓" : "WhatsApp"}</span>
                </button>
              )}

              {/* Delete */}
              <button onClick={() => deleteCode(c.id)} disabled={deleting === c.id}
                title="Delete code"
                style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${C.border2}`, background: "transparent", color: deleting === c.id ? C.text3 : C.red, cursor: deleting === c.id ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: deleting === c.id ? 0.5 : 1, transition: "opacity 0.15s" }}>
                {deleting === c.id ? <span style={{fontSize:9}}>...</span> : TRASH_ICON}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// KYS (Know Your Student) form
const KYS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwhfLVUpEJshkruvTA55XBva0qJWGZg6wk1raHgfT-V722rP_5rv9XsN750QqDOASjF/exec';
const KYS_BLOCKS = 7;
const KYS_AREAS = ["Tecnología / IT","Finanzas / Contabilidad","Marketing / Publicidad","Ventas / Comercial","Recursos Humanos","Legal / Jurídico","Salud / Medicina","Educación","Ingeniería","Logística / Operaciones","Administración / Gestión","Comunicación / Medios","Otro"];
const KYS_SELECT_ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")";

function KysPill({ label, checked, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:"0.4rem 0.85rem", borderRadius:50, border:`1px solid ${checked ? C.accent+"99" : "rgba(240,236,224,0.14)"}`,
        background: checked ? `${C.accent}22` : "transparent",
        color: checked ? C.accent : "rgba(240,236,224,0.55)",
        fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
        transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

function KysScaleInput({ label, hint, value, onSelect, error }) {
  return (
    <div style={{ marginBottom:"0.2rem" }}>
      <label style={fbLabel}>{label} <span style={{color:"#c20000"}}>*</span></label>
      {hint && <p style={{ fontSize:11, color:"rgba(240,236,224,0.38)", marginBottom:"0.5rem", lineHeight:1.4 }}>{hint}</p>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const sel = value === n;
          const col = n<=3 ? "#e57373" : n<=6 ? "#ffa726" : n<=8 ? "#a3d977" : "#66bb6a";
          return (
            <button key={n} type="button" onClick={() => onSelect(n)}
              style={{ width:34, height:34, borderRadius:"50%", border:`2px solid ${sel ? col : "rgba(240,236,224,0.14)"}`,
                background: sel ? col+"33" : "transparent", color: sel ? col : "rgba(240,236,224,0.5)",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s" }}>
              {n}
            </button>
          );
        })}
      </div>
      {error && <p style={fbErr}>{error}</p>}
    </div>
  );
}

function KYSForm({ user, profile, compact = false }) {
  const ci = compact ? { ...fbInput, fontSize: 14, padding: "0.6rem 0.85rem" } : fbInput;
  const cl = compact ? { ...fbLabel, fontSize: 11 } : fbLabel;
  const mb = compact ? "0.65rem" : "0.9rem";
  const [block, setBlock] = useState(0);
  const [fields, setFields] = useState({
    nombre: profile?.nombre || user?.email?.split("@")[0] || "",
    email: profile?.email || user?.email || "",
    area: "", cargo: "", contextos: [], meta: "",
    anios: "", metodos: [], por_que_no: "",
    emocion_error: [], emocion_extra: "", correccion: "", bloqueo: "", miedo_tipo: "",
    estilo: "", idioma_clase: "", no_entiende: "", debilidades: [],
    tiempo_extra: "", urgencia: null, abandono: "",
    consumo: [], temas_opinion: [], debate: "", tema_evitar: "", temas_pasion: "",
    coach_saber: "", extra: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => { setFields(f => ({ ...f, [k]: v })); setErrors(e => { const n={...e}; delete n[k]; return n; }); };
  const toggle = (k, v) => setFields(f => ({ ...f, [k]: f[k].includes(v) ? f[k].filter(x=>x!==v) : [...f[k], v] }));

  const validates = [
    () => { const e={}; if(!fields.nombre.trim())e.nombre="Campo requerido"; if(!fields.email.trim())e.email="Campo requerido"; if(!fields.area)e.area="Seleccioná una opción"; if(!fields.contextos.length)e.contextos="Seleccioná al menos una"; if(!fields.meta.trim())e.meta="Campo requerido"; return e; },
    () => { const e={}; if(!fields.anios)e.anios="Seleccioná una opción"; if(!fields.metodos.length)e.metodos="Seleccioná al menos uno"; return e; },
    () => { const e={}; if(!fields.emocion_error.length)e.emocion_error="Seleccioná al menos una"; if(!fields.correccion)e.correccion="Seleccioná una opción"; if(!fields.miedo_tipo)e.miedo_tipo="Seleccioná una opción"; return e; },
    () => { const e={}; if(!fields.estilo)e.estilo="Seleccioná una opción"; if(!fields.idioma_clase)e.idioma_clase="Seleccioná una opción"; if(!fields.no_entiende)e.no_entiende="Seleccioná una opción"; if(!fields.debilidades.length)e.debilidades="Seleccioná al menos una"; return e; },
    () => { const e={}; if(!fields.tiempo_extra)e.tiempo_extra="Seleccioná una opción"; if(!fields.urgencia)e.urgencia="Indicá tu nivel de urgencia"; return e; },
    () => { const e={}; if(!fields.consumo.length)e.consumo="Seleccioná al menos uno"; if(!fields.temas_opinion.length)e.temas_opinion="Seleccioná al menos uno"; if(!fields.debate)e.debate="Seleccioná una opción"; return e; },
    () => ({})
  ];

  const next = () => { const e=validates[block](); if(Object.keys(e).length){setErrors(e);return;} setErrors({}); setBlock(b=>b+1); };
  const back = () => { setErrors({}); setBlock(b=>b-1); };

  const submit = async () => {
    const e=validates[block](); if(Object.keys(e).length){setErrors(e);return;}
    setSubmitting(true);
    const payload = {
      nombre:fields.nombre, email:fields.email, area_profesional:fields.area, cargo:fields.cargo,
      contextos_uso:fields.contextos.join(", "), meta_ingles:fields.meta,
      anios_estudiando:fields.anios, metodos_intentados:fields.metodos.join(", "), por_que_no_funciono:fields.por_que_no,
      emocion_al_errar:fields.emocion_error.join(", "), emocion_extra:fields.emocion_extra,
      preferencia_correccion:fields.correccion, ultimo_bloqueo:fields.bloqueo, presion_al_hablar:fields.miedo_tipo,
      estilo_aprendizaje:fields.estilo, idioma_en_clase:fields.idioma_clase, cuando_no_entiende:fields.no_entiende,
      areas_debiles:fields.debilidades.join(", "), tiempo_fuera_clase:fields.tiempo_extra,
      urgencia:fields.urgencia, causa_abandono:fields.abandono,
      consumo_libre:fields.consumo.join(", "), temas_opinion:fields.temas_opinion.join(", "),
      estilo_debate:fields.debate, tema_a_evitar:fields.tema_evitar, temas_pasion:fields.temas_pasion,
      coach_debe_saber:fields.coach_saber, comentario_extra:fields.extra,
      fecha: new Date().toISOString()
    };
    try { await fetch(KYS_WEBHOOK, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) }); } catch(_) {}
    setSubmitting(false); setSubmitted(true);
  };

  const blockTitles = ["","Tu historial con el inglés","Cómo te sentís al hablar","Tu estilo de aprendizaje","Tu compromiso","Tus intereses","Para tu coach"];
  const kysSel = { ...ci, backgroundImage:KYS_SELECT_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 0.9rem center", paddingRight:"2.2rem", cursor:"pointer" };

  if (submitted) return (
    <div style={{ textAlign:"center", padding:"1.5rem 0.5rem" }}>
      <div style={{ fontSize:36, marginBottom:"0.75rem", color:C.green }}>✓</div>
      <p style={{ fontSize:"1rem", fontWeight:800, color:C.text, marginBottom:"0.5rem" }}>¡Gracias!</p>
      <p style={{ fontSize:13, color:C.text3, lineHeight:1.6 }}>Tu perfil fue enviado a tus coaches. Lo usaremos para personalizar cada clase.</p>
    </div>
  );

  return (
    <div>
      {/* Progress */}
      <div style={{ display:"flex", gap:3, marginBottom:"1.25rem" }}>
        {Array.from({length:KYS_BLOCKS}).map((_,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=block ? C.accent : "rgba(240,236,224,0.1)", transition:"background 0.3s" }} />
        ))}
      </div>
      {blockTitles[block] && <>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text3, marginBottom:"0.2rem" }}>{block+1} / {KYS_BLOCKS}</p>
        <p style={{ fontSize:"1rem", fontWeight:800, color:C.text, marginBottom:"1.25rem", letterSpacing:"-0.02em" }}>{blockTitles[block]}</p>
      </>}

      {/* Block 0 — Sobre vos */}
      {block===0 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Nombre <span style={{color:"#c20000"}}>*</span></label>
          <input value={fields.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Tu nombre completo"
            style={{...ci, borderColor:errors.nombre?"#c20000":"rgba(240,236,224,0.07)"}} />
          {errors.nombre&&<p style={fbErr}>{errors.nombre}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Email <span style={{color:"#c20000"}}>*</span></label>
          <input value={fields.email} onChange={e=>set("email",e.target.value)} placeholder="tu@email.com"
            style={{...ci, borderColor:errors.email?"#c20000":"rgba(240,236,224,0.07)"}} />
          {errors.email&&<p style={fbErr}>{errors.email}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Área profesional <span style={{color:"#c20000"}}>*</span></label>
          <select value={fields.area} onChange={e=>set("area",e.target.value)}
            style={{...kysSel, borderColor:errors.area?"#c20000":"rgba(240,236,224,0.07)"}}>
            <option value="">Seleccioná...</option>
            {KYS_AREAS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          {errors.area&&<p style={fbErr}>{errors.area}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Cargo / Puesto <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <input value={fields.cargo} onChange={e=>set("cargo",e.target.value)} placeholder="Ej: Gerente de ventas" style={ci} />
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿En qué contextos usás el inglés? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Reuniones","Emails","Presentaciones","Llamadas","Clientes externos","Reportes","No lo uso aún"].map(v=>(
              <KysPill key={v} label={v} checked={fields.contextos.includes(v)} onClick={()=>toggle("contextos",v)} />
            ))}
          </div>
          {errors.contextos&&<p style={fbErr}>{errors.contextos}</p>}
        </div>
        <div>
          <label style={cl}>¿Cuál es tu meta con el inglés? <span style={{color:"#c20000"}}>*</span></label>
          <textarea value={fields.meta} onChange={e=>set("meta",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5, borderColor:errors.meta?"#c20000":"rgba(240,236,224,0.07)"}}
            placeholder="Contanos qué querés lograr..." />
          {errors.meta&&<p style={fbErr}>{errors.meta}</p>}
        </div>
      </div>}

      {/* Block 1 — Historial */}
      {block===1 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Hace cuánto estudiás inglés? <span style={{color:"#c20000"}}>*</span></label>
          <select value={fields.anios} onChange={e=>set("anios",e.target.value)}
            style={{...kysSel, borderColor:errors.anios?"#c20000":"rgba(240,236,224,0.07)"}}>
            <option value="">Seleccioná...</option>
            {["Menos de 1 año","1–2 años","3–5 años","6–10 años","Más de 10 años"].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          {errors.anios&&<p style={fbErr}>{errors.anios}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué métodos probaste antes? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Academia tradicional","Apps","Tutor particular","Autodidacta","Plataforma online","Inmersión","Ninguno"].map(v=>(
              <KysPill key={v} label={v} checked={fields.metodos.includes(v)} onClick={()=>toggle("metodos",v)} />
            ))}
          </div>
          {errors.metodos&&<p style={fbErr}>{errors.metodos}</p>}
        </div>
        <div>
          <label style={cl}>¿Por qué no funcionó? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.por_que_no} onChange={e=>set("por_que_no",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}}
            placeholder="Si ninguno funcionó del todo, contanos por qué..." />
        </div>
      </div>}

      {/* Block 2 — Emociones */}
      {block===2 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué sentís cuando cometés un error? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Vergüenza","Frustración","Bloqueo mental","Ansiedad","No me afecta","Me motiva"].map(v=>(
              <KysPill key={v} label={v} checked={fields.emocion_error.includes(v)} onClick={()=>toggle("emocion_error",v)} />
            ))}
          </div>
          {errors.emocion_error&&<p style={fbErr}>{errors.emocion_error}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Algo más <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <input value={fields.emocion_extra} onChange={e=>set("emocion_extra",e.target.value)} style={ci} placeholder="Otra emoción..." />
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cuándo preferís que te corrijan? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["En el momento","Al final de la clase","Lo menos posible","No sé todavía"].map(v=>(
              <KysPill key={v} label={v} checked={fields.correccion===v} onClick={()=>set("correccion",v)} />
            ))}
          </div>
          {errors.correccion&&<p style={fbErr}>{errors.correccion}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cuál fue tu último bloqueo al hablar? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.bloqueo} onChange={e=>set("bloqueo",e.target.value)} rows={2}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Contanos una situación concreta..." />
        </div>
        <div>
          <label style={cl}>¿Cuándo sentís más presión al hablar? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Con nativos","Con colegas que me conocen","Con ambos por igual","Con ninguno"].map(v=>(
              <KysPill key={v} label={v} checked={fields.miedo_tipo===v} onClick={()=>set("miedo_tipo",v)} />
            ))}
          </div>
          {errors.miedo_tipo&&<p style={fbErr}>{errors.miedo_tipo}</p>}
        </div>
      </div>}

      {/* Block 3 — Estilo */}
      {block===3 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cómo aprendés mejor? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Teoría primero","Directo a la práctica","Combinación"].map(v=>(
              <KysPill key={v} label={v} checked={fields.estilo===v} onClick={()=>set("estilo",v)} />
            ))}
          </div>
          {errors.estilo&&<p style={fbErr}>{errors.estilo}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué idioma preferís en clase? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Mayoría inglés","Mezcla inglés / español","Español para lo complejo"].map(v=>(
              <KysPill key={v} label={v} checked={fields.idioma_clase===v} onClick={()=>set("idioma_clase",v)} />
            ))}
          </div>
          {errors.idioma_clase&&<p style={fbErr}>{errors.idioma_clase}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>Cuando no entendés algo, ¿qué hacés? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Pregunto","Finjo que entendí","Lo busco después","Depende"].map(v=>(
              <KysPill key={v} label={v} checked={fields.no_entiende===v} onClick={()=>set("no_entiende",v)} />
            ))}
          </div>
          {errors.no_entiende&&<p style={fbErr}>{errors.no_entiende}</p>}
        </div>
        <div>
          <label style={cl}>¿Cuáles son tus áreas más débiles? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Speaking","Listening","Writing","Grammar","Vocabulario","Pronunciación","Confianza"].map(v=>(
              <KysPill key={v} label={v} checked={fields.debilidades.includes(v)} onClick={()=>toggle("debilidades",v)} />
            ))}
          </div>
          {errors.debilidades&&<p style={fbErr}>{errors.debilidades}</p>}
        </div>
      </div>}

      {/* Block 4 — Compromiso */}
      {block===4 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Cuánto tiempo podés estudiar fuera de clase? <span style={{color:"#c20000"}}>*</span></label>
          <select value={fields.tiempo_extra} onChange={e=>set("tiempo_extra",e.target.value)}
            style={{...kysSel, borderColor:errors.tiempo_extra?"#c20000":"rgba(240,236,224,0.07)"}}>
            <option value="">Seleccioná...</option>
            {["Menos de 15 min","15–30 min","30–60 min","Más de 1 hora","No estudio fuera de clase"].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          {errors.tiempo_extra&&<p style={fbErr}>{errors.tiempo_extra}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <KysScaleInput label="¿Qué tan urgente es mejorar tu inglés?" hint="1 = sin prisa, 10 = necesito mejorar ya"
            value={fields.urgencia} onSelect={v=>set("urgencia",v)} error={errors.urgencia} />
        </div>
        <div>
          <label style={cl}>¿Qué te hizo abandonar antes? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.abandono} onChange={e=>set("abandono",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Si empezaste y paraste, ¿qué pasó?" />
        </div>
      </div>}

      {/* Block 5 — Intereses */}
      {block===5 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué consumís en inglés en tu tiempo libre? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Series y películas","Música","Podcasts","Libros y artículos","YouTube","Redes sociales","Videojuegos","Noticias","Ninguno"].map(v=>(
              <KysPill key={v} label={v} checked={fields.consumo.includes(v)} onClick={()=>toggle("consumo",v)} />
            ))}
          </div>
          {errors.consumo&&<p style={fbErr}>{errors.consumo}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Sobre qué temas te animás a opinar? <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Política","Tecnología","Deportes","Arte y cultura","Economía","Ciencia","Entretenimiento","Medioambiente","Redes sociales"].map(v=>(
              <KysPill key={v} label={v} checked={fields.temas_opinion.includes(v)} onClick={()=>toggle("temas_opinion",v)} />
            ))}
          </div>
          {errors.temas_opinion&&<p style={fbErr}>{errors.temas_opinion}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>En un debate, preferís… <span style={{color:"#c20000"}}>*</span></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["Debatir activamente","Escuchar","Depende del tema"].map(v=>(
              <KysPill key={v} label={v} checked={fields.debate===v} onClick={()=>set("debate",v)} />
            ))}
          </div>
          {errors.debate&&<p style={fbErr}>{errors.debate}</p>}
        </div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Hay algún tema que preferís evitar? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <input value={fields.tema_evitar} onChange={e=>set("tema_evitar",e.target.value)} style={ci} placeholder="Ej: política, religión..." />
        </div>
        <div>
          <label style={cl}>¿De qué podés hablar horas? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.temas_pasion} onChange={e=>set("temas_pasion",e.target.value)} rows={2}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Tus temas de pasión..." />
        </div>
      </div>}

      {/* Block 6 — Para tu coach */}
      {block===6 && <div>
        <div style={{marginBottom:mb}}>
          <label style={cl}>¿Qué más debería saber tu coach? <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.coach_saber} onChange={e=>set("coach_saber",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Cualquier info que te parezca útil..." />
        </div>
        <div>
          <label style={cl}>Comentario adicional <span style={{fontSize:10,color:"rgba(240,236,224,0.3)"}}>opcional</span></label>
          <textarea value={fields.extra} onChange={e=>set("extra",e.target.value)} rows={3}
            style={{...ci, resize:"none", lineHeight:1.5}} placeholder="Algo que quieras agregar..." />
        </div>
      </div>}

      {/* Nav */}
      <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.5rem" }}>
        {block>0 && (
          <button type="button" onClick={back}
            style={{ flex:1, padding:"0.8rem", borderRadius:50, border:`1px solid ${C.border2}`, background:"transparent", color:C.text3, fontSize:13, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>
            ← Atrás
          </button>
        )}
        {block<KYS_BLOCKS-1 ? (
          <button type="button" onClick={next}
            style={{ flex:block>0?2:1, padding:"0.8rem", borderRadius:50, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>
            Siguiente →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting}
            style={{ flex:2, padding:"0.8rem", borderRadius:50, border:"none", background:submitting?C.surface2:C.accent, color:submitting?C.text3:C.bg, fontSize:13, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", cursor:submitting?"default":"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
            {submitting ? "Enviando..." : "Enviar →"}
          </button>
        )}
      </div>
    </div>
  );
}

// PROFILE VIEW
export function ProfileView({ user, defaultSection = "bio", setActive }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", teams_email: "", phone: "" });
  const isBio = defaultSection !== "me";

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            teams_email: data.teams_email || data.email || "",
            phone: data.phone || "",
          });
        }
        setLoading(false);
      });
  }, [user.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        teams_email: form.teams_email.trim(),
        phone: form.phone.trim(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      console.error("Profile save error:", error);
      toast("Error al guardar: " + error.message);
    } else {
      setProfile(p => ({ ...p, nombre: form.nombre, apellido: form.apellido, teams_email: form.teams_email }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const planColors = { Group: "#4fc3f7", Private: "#ce93d8", Grupal: "#4fc3f7", Privada: "#ce93d8" };
  const rolLabels = ROL_LABELS;
  const rolColors = ROL_COLORS;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "2rem" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, width: "100%", overflowX: "hidden" }}>
      {/* ← Settings back button */}
      <button onClick={() => setActive?.("settings")}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "0 0 1.25rem 0", WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.color = C.text2}
        onMouseLeave={e => e.currentTarget.style.color = C.text3}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Settings
      </button>
      {/* Avatar + info */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{(form.nombre || user.email)[0].toUpperCase()}</p>
        </div>
        <div>
          <p style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{form.nombre} {form.apellido}</p>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, background: `${rolColors[profile?.rol]||C.text3}18`, color: rolColors[profile?.rol]||C.text3, border: `1px solid ${rolColors[profile?.rol]||C.text3}44` }}>
              {rolLabels[profile?.rol] || profile?.rol}
            </span>
            {profile?.plan && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, background: `${planColors[profile.plan]||C.text3}18`, color: planColors[profile.plan]||C.text3, border: `1px solid ${planColors[profile.plan]||C.text3}44` }}>
                {profile.plan}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal Info (direct, no dropdown) ── */}
      {isBio && (
        <>
          <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                { label: "First name", key: "nombre",   placeholder: "Tu nombre" },
                { label: "Last name",  key: "apellido", placeholder: "Tu apellido" },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Login email</label>
              <input value={user.email} disabled
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text3, fontFamily: "inherit", outline: "none", cursor: "not-allowed" }} />
              <p style={{ fontSize: 11, color: C.text3 }}>Este correo no se puede cambiar — es el que usás para entrar a la app.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Teams email</label>
              <input value={form.teams_email} onChange={e => setForm(v => ({ ...v, teams_email: e.target.value }))}
                placeholder="The email where Teams invitations are sent"
                style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
              <p style={{ fontSize: 11, color: C.text3 }}>We use this email to show your classes in the calendar.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>WhatsApp</label>
              <input value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                placeholder="+50688887777"
                style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
              <p style={{ fontSize: 11, color: C.text3 }}>Número con código de país. Lo usamos para enviarte recordatorios de clase y avisos de pago.</p>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            style={{ width: "100%", padding: "0.85rem", borderRadius: 50, border: "none", background: saved ? C.green : saving ? C.surface2 : C.accent, color: saved ? "#fff" : saving ? C.text3 : C.bg, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: saving ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
          </button>
        </>
      )}

      {/* ── About me — KYS form only, no BIO ── */}
      {!isBio && (
        <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", width: "100%" }}>
          <p style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1, marginBottom: "0.4rem" }}>Sobre mí</p>
          <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Respondé con honestidad, no hay respuestas incorrectas. Esta información es exclusiva para nuestros coaches y nos permite personalizar cada una de tus clases.
          </p>
          <KYSForm user={user} profile={profile} compact />
        </div>
      )}
    </div>
  );
}

// ── KYC COACH VIEW ────────────────────────────────────────────
export function KYCCoachView({ user, setActive }) {
  const [pg, setPg]       = useState(0);
  const [scales, setScales] = useState({});
  const [chips,  setChips]  = useState({});
  const [vals, setVals] = useState({
    nombre: [user?.nombre, user?.apellido].filter(Boolean).join(" "),
    pais: "", tiempo: "",
    porq: "", estudiante: "",
    parte: "", recomienda: "",
    llegaste: "", reto: "",
    salida: "", final_msg: "",
  });

  const setS = (k, v) => setScales(s => ({ ...s, [k]: v }));
  const togC = (k, v) => setChips(c => {
    const a = c[k] || [];
    return { ...c, [k]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] };
  });
  const sv  = (k, v) => setVals(f => ({ ...f, [k]: v }));
  const isC = (k, v) => (chips[k] || []).includes(v);

  const kIn = { ...fbInput };
  const kLb = { ...fbLabel };
  const kTa = { ...kIn, resize: "vertical", minHeight: 100, lineHeight: 1.6 };
  const kQ  = { fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: "0.55rem", fontFamily: "inherit" };
  const kHn = { fontSize: 12, color: C.text3, lineHeight: 1.5, marginBottom: "0.5rem", fontFamily: "inherit" };
  const kFd = { marginBottom: "1.15rem" };
  const kDv = { borderTop: `1px solid ${C.border}`, margin: "1.25rem 0" };
  const kSel = { ...kIn, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(240,236,224,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2rem", cursor: "pointer" };

  const chips_ = (gk, items) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(([v, l]) => {
        const on = isC(gk, v);
        return (
          <button key={v} onClick={() => togC(gk, v)}
            style={{ border: `1px solid ${on ? C.text : C.border2}`, borderRadius: 20, padding: "5px 13px", fontSize: 11, cursor: "pointer", color: on ? C.text : C.text2, background: on ? "rgba(240,236,224,0.11)" : "transparent", transition: "all 0.13s", fontFamily: "inherit", WebkitTapHighlightColor: "transparent" }}>
            {l}
          </button>
        );
      })}
    </div>
  );

  const scale_ = (sk, lL, rL) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: C.text3 }}>{lL}</span>
        <span style={{ fontSize: 10, color: C.text3 }}>{rL}</span>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        {[1, 2, 3, 4, 5].map(v => {
          const on = scales[sk] === v;
          return (
            <button key={v} onClick={() => setS(sk, v)}
              style={{ flex: 1, height: 38, border: `1px solid ${on ? C.text : C.border2}`, borderRadius: 7, background: on ? "rgba(240,236,224,0.14)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: on ? C.text : C.text2, transition: "all 0.13s", WebkitTapHighlightColor: "transparent" }}>
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );

  const nav_ = (back, onNext, nextLbl = "Siguiente →") => (
    <div style={{ display: "flex", gap: 8, marginTop: "1.5rem" }}>
      {back !== null && (
        <button onClick={() => setPg(back)}
          style={{ flex: 1, padding: "0.85rem", borderRadius: 50, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
          ← Atrás
        </button>
      )}
      <button onClick={onNext}
        style={{ flex: back !== null ? 2 : undefined, width: back !== null ? undefined : "100%", padding: "0.85rem", borderRadius: 50, border: "none", background: C.text, color: C.bg, fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
        {nextLbl}
      </button>
    </div>
  );

  const hdr_ = (tag, desc) => (
    <div style={{ marginBottom: "1.25rem", fontFamily: "inherit" }}>
      <p style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1, marginBottom: desc ? "0.4rem" : 0, fontFamily: "inherit" }}>{tag}</p>
      {desc && <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.6, fontFamily: "inherit", marginBottom: pg > 0 && pg < 5 ? "0.85rem" : 0 }}>{desc}</p>}
      {pg > 0 && pg < 5 && (
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= pg ? C.text2 : C.border }} />
          ))}
        </div>
      )}
    </div>
  );

  const scaleBar = (k, label) => {
    const v = scales[k] || 0;
    const col = v >= 4 ? C.green : v >= 3 ? C.amber : v ? C.red : C.text3;
    return (
      <div key={k} style={{ marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.text2 }}>{label}</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: C.text3 }}>{v ? `${v}/5` : "–"}</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: 4, width: v ? `${(v / 5) * 100}%` : "0%", background: col, borderRadius: 2, transition: "width 0.6s ease" }} />
        </div>
      </div>
    );
  };

  const IC = { alerta: C.red, positivo: C.green, oportunidad: C.green, accion: C.amber };
  const II = { alerta: "⚠", positivo: "✓", oportunidad: "◈", accion: "→" };

  const buildInsights = () => {
    const ins = [];
    const { temperatura, impacto, conexion, pasion_ingles, crecer_economico } = scales;
    const ch = chips;
    if (temperatura) {
      if (temperatura <= 2) ins.push({ tipo: "alerta",   txt: `Temperatura crítica (${temperatura}/5). Riesgo de desvinculación.` });
      else if (temperatura === 3) ins.push({ tipo: "accion",   txt: `Temperatura media (${temperatura}/5). Explorar qué falta para mayor compromiso.` });
      else ins.push({ tipo: "positivo", txt: `Temperatura alta (${temperatura}/5). Momento ideal para nuevas responsabilidades.` });
    }
    if (conexion && conexion <= 2) ins.push({ tipo: "alerta", txt: `Poca conexión con el equipo (${conexion}/5). Considerar espacios comunitarios.` });
    if ((ch.roles || []).includes("mentor"))    ins.push({ tipo: "oportunidad", txt: "Interesado/a en mentoría. Candidato/a para coach senior." });
    if ((ch.roles || []).includes("lider"))     ins.push({ tipo: "oportunidad", txt: "Abierto/a a coordinación. Evaluar para roles de liderazgo." });
    if ((ch.roles || []).includes("contenido")) ins.push({ tipo: "oportunidad", txt: "Quiere crear material pedagógico. Potencial para currículo." });
    if (crecer_economico && crecer_economico >= 4) ins.push({ tipo: "accion", txt: `Alta motivación económica (${crecer_economico}/5). Mostrar ruta clara de crecimiento.` });
    if ((ch.aprende || []).includes("mucho")) ins.push({ tipo: "positivo", txt: "Aprende activamente por cuenta propia. Alta inversión de capacitación." });
    if ((ch.aprende || []).includes("no"))    ins.push({ tipo: "accion",   txt: "No prioriza aprendizaje autónomo. Beneficiaría de estructura interna." });
    if ((ch.actividad || []).includes("transicion")) ins.push({ tipo: "oportunidad", txt: "En transición a Dilo como fuente principal. Alta retención potencial." });
    return ins;
  };

  // ── Page renderers ───────────────────────────────────────────

  const renderIntro = () => (
    <>
      {hdr_("Know your coach", "Este formulario no es un examen. Es una conversación: queremos entender qué te mueve y cómo crecer juntos.")}
      <div style={kFd}>
        <label style={kLb}>Nombre completo</label>
        <input value={vals.nombre} onChange={e => sv("nombre", e.target.value)} placeholder="Tu nombre completo" style={kIn} />
      </div>
      <div style={kFd}>
        <label style={kLb}>Tiempo en Dilo</label>
        <select value={vals.tiempo} onChange={e => sv("tiempo", e.target.value)} style={kSel}>
          <option value="">Seleccioná...</option>
          {["Menos de 3 meses","3–6 meses","6–12 meses","Más de 1 año"].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={kFd}>
        <label style={kLb}>Niveles que enseñás</label>
        {chips_("niveles", [["Foundation","Foundation"],["A1","A1"],["A2","A2"],["B1","B1"],["B2","B2"],["C1","C1"],["C2","C2"]])}
      </div>
      {nav_(null, () => setPg(1), "Comenzar →")}
    </>
  );

  const renderProposito = () => (
    <>
      {hdr_("Propósito", "Queremos entender el motivo real, no el oficial. Sin filtros.")}
      <div style={kFd}>
        <p style={kQ}>¿Por qué enseñás inglés? El motivo de verdad.</p>
        <p style={kHn}>No el que ponés en el CV. Lo que realmente te movió a estar acá.</p>
        <textarea value={vals.porq} onChange={e => sv("porq", e.target.value)} placeholder="Escribí con libertad..." style={kTa} />
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué momento de una clase te da más satisfacción?</p>
        {chips_("momento", [["breakthrough","Cuando alguien entiende algo que no podía"],["fluency","Primera vez que habla con fluidez"],["confianza","Cuando ganan confianza visible"],["feedback","Cuando me dan feedback positivo"],["conexion","La conexión real en la conversación"],["otro","Otro"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Cuánto sentís que tu trabajo impacta la vida de tus estudiantes?</p>
        {scale_("impacto", "Poco impacto", "Impacto enorme")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué tipo de estudiante hace que tu trabajo valga la pena?</p>
        <textarea value={vals.estudiante} onChange={e => sv("estudiante", e.target.value)} placeholder="Descríbelo..." style={kTa} />
      </div>
      {nav_(0, () => setPg(2))}
    </>
  );

  const renderPertenencia = () => (
    <>
      {hdr_("Pertenencia", "Queremos saber si te sentís parte de algo más grande que una clase.")}
      <div style={kFd}>
        <p style={kQ}>¿Qué tan conectado/a te sentís con el equipo de coaches de Dilo?</p>
        {scale_("conexion", "Muy desconectado/a", "Muy conectado/a")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué es lo que más valorás de trabajar con Dilo?</p>
        {chips_("valor", [["autonomia","Autonomía y flexibilidad"],["respaldo","Respaldo y soporte"],["metodologia","Metodología clara"],["ambiente","Ambiente entre coaches"],["mision","La misión"],["otro","Otro"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué te haría sentir más parte de Dilo?</p>
        <p style={kHn}>Sé honesto/a. Esto nos ayuda a mejorar.</p>
        <textarea value={vals.parte} onChange={e => sv("parte", e.target.value)} placeholder="Espacio tuyo..." style={kTa} />
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Recomendarías a alguien que enseñe con Dilo? ¿Por qué?</p>
        <textarea value={vals.recomienda} onChange={e => sv("recomienda", e.target.value)} placeholder="¿Qué le dirías?" style={kTa} />
      </div>
      {nav_(1, () => setPg(3))}
    </>
  );

  const renderPasion = () => (
    <>
      {hdr_("Pasión", "Queremos entender qué hay detrás de tu relación con el idioma.")}
      <div style={kFd}>
        <p style={kQ}>¿Cómo llegaste al inglés? ¿Cuándo se convirtió en parte de tu vida?</p>
        <textarea value={vals.llegaste} onChange={e => sv("llegaste", e.target.value)} placeholder="Contá tu historia con el idioma..." style={kTa} />
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué tan apasionado/a estás por enseñar inglés específicamente?</p>
        {scale_("pasion_ingles", "Me gusta enseñar en general", "El inglés es especial para mí")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Seguís aprendiendo sobre inglés o metodología por tu cuenta?</p>
        {chips_("aprende", [["mucho","Sí, constantemente"],["aveces","A veces"],["poco","Poco, lo que ya sé me alcanza"],["no","No lo he priorizado"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Cuál es el mayor reto pedagógico que enfrentás hoy?</p>
        <textarea value={vals.reto} onChange={e => sv("reto", e.target.value)} placeholder="El desafío real, no el políticamente correcto..." style={kTa} />
      </div>
      {nav_(2, () => setPg(4))}
    </>
  );

  const renderCrecimiento = () => (
    <>
      {hdr_("Crecimiento", "Motivación económica y ambición dentro de Dilo.")}
      <div style={kFd}>
        <p style={kQ}>¿Las clases en Dilo son tu actividad principal o complementaria?</p>
        {chips_("actividad", [["principal","Fuente principal de ingresos"],["complementaria","Ingreso complementario"],["transicion","En transición a principal"],["otro","Otra situación"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué tan importante es aumentar tus horas o ingresos dentro de Dilo?</p>
        {scale_("crecer_economico", "No es prioridad", "Es muy importante")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Te interesaría asumir roles más allá de dar clases?</p>
        {chips_("roles", [["mentor","Ser mentor de otros coaches"],["contenido","Crear material pedagógico"],["lider","Coordinación o liderazgo"],["nada","Prefiero solo dar clases"],["abierto","Abierto a lo que venga"]])}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Qué necesitaría pasar para que dejaras de dar clases en Dilo?</p>
        <p style={kHn}>Esta pregunta nos ayuda a entender tus prioridades reales.</p>
        <textarea value={vals.salida} onChange={e => sv("salida", e.target.value)} placeholder="Honestidad total acá..." style={kTa} />
      </div>
      <div style={kDv} />
      <div style={kFd}>
        <p style={kQ}>¿Cómo te sentís hoy con tu trabajo en Dilo? Temperatura general.</p>
        {scale_("temperatura", "Pensando en salir", "Muy comprometido/a")}
      </div>
      <div style={kFd}>
        <p style={kQ}>¿Hay algo que quisieras que Ricardo supiera sobre vos?</p>
        <textarea value={vals.final_msg} onChange={e => sv("final_msg", e.target.value)} placeholder="Espacio libre para lo que quieras decir..." style={kTa} />
      </div>
      {nav_(3, () => setPg(5), "Ver perfil motivacional →")}
    </>
  );

  const renderDash = () => {
    const insights = buildInsights();
    const allChips = [...(chips.momento || []), ...(chips.roles || []), ...(chips.actividad || []), ...(chips.aprende || []), ...(chips.valor || [])];
    const openQs = [
      { q: "¿Por qué enseñás inglés?",           v: vals.porq },
      { q: "Tipo de estudiante ideal",            v: vals.estudiante },
      { q: "Para sentirme más parte de Dilo",     v: vals.parte },
      { q: "¿Recomendarías enseñar en Dilo?",     v: vals.recomienda },
      { q: "Historia con el inglés",              v: vals.llegaste },
      { q: "Mayor reto pedagógico",               v: vals.reto },
      { q: "Motivo para salir",                   v: vals.salida },
      { q: "Mensaje para Ricardo",                v: vals.final_msg },
    ].filter(x => x.v && x.v.trim());
    const name = vals.nombre || [user?.nombre, user?.apellido].filter(Boolean).join(" ") || "Coach";
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <>
        <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(240,236,224,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: C.text, flexShrink: 0, fontFamily: "monospace" }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 300, color: C.text }}>{name}</p>
            <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{[vals.pais, vals.tiempo].filter(Boolean).join(" · ") || "Dilo Club"}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "0.85rem" }}>
          {[["temperatura","Temperatura"],["impacto","Impacto percibido"],["conexion","Conexión equipo"],["pasion_ingles","Pasión por inglés"]].map(([k, l]) => {
            const v = scales[k];
            const col = v >= 4 ? C.green : v >= 3 ? C.amber : v ? C.red : C.text3;
            return (
              <div key={k} style={{ ...CARD, borderRadius: 10, padding: "0.85rem", textAlign: "center" }}>
                <p style={{ fontSize: 22, fontWeight: 300, color: col, fontFamily: "monospace" }}>{v ? `${v}/5` : "–"}</p>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: C.text3, marginTop: 3 }}>{l}</p>
              </div>
            );
          })}
        </div>
        <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "1rem" }}>Dimensiones motivacionales</p>
          {[["temperatura","Temperatura (compromiso)"],["impacto","Propósito e impacto"],["conexion","Pertenencia al equipo"],["pasion_ingles","Pasión por enseñar inglés"],["crecer_economico","Motivación económica"]].map(([k, l]) => scaleBar(k, l))}
        </div>
        {allChips.length > 0 && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>Motivadores declarados</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {allChips.map(t => (
                <span key={t} style={{ background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {insights.length > 0 && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>Notas para Ricardo</p>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 9, padding: "0.65rem 0.85rem", borderRadius: 8, marginBottom: i < insights.length - 1 ? "0.5rem" : 0, background: `${IC[ins.tipo]}18`, alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, color: IC[ins.tipo], flexShrink: 0, marginTop: 1 }}>{II[ins.tipo]}</span>
                <span style={{ fontSize: 12, color: IC[ins.tipo], lineHeight: 1.6 }}>{ins.txt}</span>
              </div>
            ))}
          </div>
        )}
        {vals.porq && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>En sus propias palabras</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: C.text2, lineHeight: 1.8, borderLeft: `3px solid ${C.border2}`, paddingLeft: "1rem" }}>
              {vals.porq.slice(0, 280)}{vals.porq.length > 280 ? "…" : ""}
            </p>
          </div>
        )}
        {openQs.length > 0 && (
          <div style={{ ...CARD, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: "0.75rem" }}>Respuestas abiertas</p>
            {openQs.map((q, i) => (
              <div key={i}>
                {i > 0 && <div style={{ borderTop: `1px solid ${C.border}`, margin: "0.85rem 0" }} />}
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.text3, marginBottom: 4 }}>{q.q}</p>
                <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>{q.v}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => {
          setScales({}); setChips({});
          setVals({ nombre: [user?.nombre, user?.apellido].filter(Boolean).join(" "), pais: "", tiempo: "", porq: "", estudiante: "", parte: "", recomienda: "", llegaste: "", reto: "", salida: "", final_msg: "" });
          setPg(0);
        }} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: "0.25rem" }}>
          ← Nuevo formulario
        </button>
      </>
    );
  };

  const role     = user?.role || "coach";
  const rolColor = ROL_COLORS[role] || C.text2;
  const rolLabel = ROL_LABELS[role] || role;
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(" ") || user?.email || "Coach";
  const initials = fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
      {/* ← Settings back button */}
      <button onClick={() => setActive?.("settings")}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", padding: "0 0 1.25rem 0", fontFamily: "inherit", WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.color = C.text2}
        onMouseLeave={e => e.currentTarget.style.color = C.text3}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Settings
      </button>

      {/* Avatar + name + role */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{initials[0]}</p>
        </div>
        <div>
          <p style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>{fullName}</p>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 50, background: `${rolColor}18`, color: rolColor, border: `1px solid ${rolColor}44` }}>
              {rolLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ ...CARD, borderRadius: 16, padding: "1.5rem", width: "100%" }}>
        {pg === 0 && renderIntro()}
        {pg === 1 && renderProposito()}
        {pg === 2 && renderPertenencia()}
        {pg === 3 && renderPasion()}
        {pg === 4 && renderCrecimiento()}
        {pg === 5 && renderDash()}
      </div>
    </div>
  );
}

// ── SETTINGS VIEW ─────────────────────────────────────────────
export function SettingsView({ user, setActive }) {
  const role  = user?.role || "student";
  const cards = [
    { label: "Personal Info", desc: "Edit your name, email and account details.", target: "perfil" },
    { label: "About me",      desc: "Fill out your learning profile for your coach.", target: "perfil-me" },
    ...(role !== "student" ? [{ label: "Know Your Coach", desc: "Cuestionario motivacional para el equipo de coaches.", target: "kyc-coach" }] : []),
  ];
  return (
    <div style={{ maxWidth: 560, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {cards.map(card => (
          <button key={card.label} onClick={() => setActive(card.target)}
            style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 16, padding: "0.9rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", textAlign: "left", WebkitTapHighlightColor: "transparent", transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.borderColor = C.border2; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{card.label}</p>
              <p style={{ fontSize: 11, color: C.text3 }}>{card.desc}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, flexShrink: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>Open →</span>
          </button>
        ))}
      </div>
    </div>
  );
}


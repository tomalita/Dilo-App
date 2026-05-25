import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// PLACEHOLDER VIEW
function PlaceholderView({ title, desc, icon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} color={C.text3} />
      </div>
      <div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: C.text, marginBottom: 6 }}>{title}</h2>
        <p style={{ fontSize: 13, color: C.text3, maxWidth: 300 }}>{desc}</p>
      </div>
      <Badge color={C.text3}>Próximamente</Badge>
    </div>
  );
}

// INVITATIONS VIEW
function InvitesView({ user }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ rol: "student", plan: "Group" });
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

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
    setCreating(true);
    setError(null);
    const code = generateCode();
    const { error: err } = await supabase.from("invite_codes").insert({
      code,
      rol: form.rol,
      plan: form.rol === "student" ? form.plan : null,
      creado_por: user?.id || null,
    });
    if (err) { setError("Error creating code. Please try again."); }
    else { await loadCodes(); }
    setCreating(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyWhatsApp = (code, rol, plan) => {
    const planText = plan ? ` — Plan: ${plan}` : "";
    const msg = `Hola! Te comparto tu código de acceso a la plataforma de Dilo Club 🎓\n\nCódigo: *${code}*\nRol: ${rol === "student" ? "Student" : "Coach"}${planText}\n\nIngresá a: dilo.club/app → "Crear cuenta con código"`;
    navigator.clipboard.writeText(msg);
    setCopied(code + "_wa");
    setTimeout(() => setCopied(null), 2000);
  };

  const WA_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  const COPY_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  const BTN = { padding: "0.35rem 0.85rem", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "transparent" };

  return (
    <div style={{ maxWidth: 760, width: "100%" }}>
      {/* Create new code */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
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

      {/* Codes list */}
      <SectionHeader eyebrow="Invitations" title="Generated codes" />

      {loading ? (
        <div style={{ display: "flex", gap: 6, padding: "1rem" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      ) : codes.length === 0 ? (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.text3 }}>No codes generated yet.</p>
        </div>
      ) : (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {codes.map((c, i) => (
            <div key={c.id} style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: i < codes.length-1 ? `1px solid ${C.border}` : "none", opacity: c.usado ? 0.5 : 1 }}>
              {/* Code + copy inline */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 170 }}>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, fontWeight: 700, color: c.usado ? C.text3 : C.text, letterSpacing: "0.1em" }}>{c.code}</p>
                {!c.usado && (
                  <button onClick={() => copyCode(c.code)} title="Copy"
                    style={{ width: 24, height: 24, borderRadius: "50%", border: `1px solid ${C.border2}`, background: "transparent", color: copied===c.code ? C.green : C.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {copied===c.code ? <span style={{fontSize:10}}>✓</span> : COPY_ICON}
                  </button>
                )}
              </div>
              {/* Badges — white border only */}
              <div style={{ display: "flex", gap: "0.35rem", flex: 1, flexWrap: "wrap" }}>
                {[c.rol === "student" ? "Student" : c.rol === "coach" ? "Coach" : "Admin", c.plan, c.usado ? "Used" : "Available"].filter(Boolean).map((label, li) => (
                  <span key={li} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 50, background: "transparent", color: C.text2, border: `1px solid ${C.border2}` }}>
                    {label}
                  </span>
                ))}
              </div>
              {/* WhatsApp */}
              {!c.usado && (
                <button onClick={() => copyWhatsApp(c.code, c.rol, c.plan)}
                  style={{ height: 26, padding: "0 0.6rem", borderRadius: 50, border: `1px solid ${C.green}55`, background: "transparent", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {WA_ICON}
                  <span>{copied===c.code+"_wa" ? "✓" : "WhatsApp"}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// PROFILE VIEW
function ProfileView({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", teams_email: "" });

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            teams_email: data.teams_email || data.email || ""
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
        teams_email: form.teams_email.trim()
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      console.error("Profile save error:", error);
      alert("Error al guardar: " + error.message);
    } else {
      setProfile(p => ({ ...p, nombre: form.nombre, apellido: form.apellido, teams_email: form.teams_email }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const planColors = { Group: "#4fc3f7", Private: "#ce93d8", Grupal: "#4fc3f7", Privada: "#ce93d8" };
  const rolLabels = { student: "Student", coach: "Coach", admin: "Admin" };
  const rolColors = { student: C.green, coach: C.amber, admin: C.red };

  if (loading) return (
    <div style={{ display: "flex", gap: 6, padding: "2rem" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 560, width: "100%", overflowX: "hidden" }}>
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

      {/* Form */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "0.75rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: "1.25rem" }}>Personal information</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "First name", key: "nombre", placeholder: "Tu nombre" },
            { label: "Last name", key: "apellido", placeholder: "Tu apellido" },
          ].map(f => (
            <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Email de login</label>
          <input value={user.email} disabled
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text3, fontFamily: "inherit", outline: "none", cursor: "not-allowed" }} />
          <p style={{ fontSize: 11, color: C.text3 }}>Este correo no se puede cambiar — es el que usás para entrar a la app.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3 }}>Email de Teams</label>
          <input value={form.teams_email} onChange={e => setForm(v => ({ ...v, teams_email: e.target.value }))}
            placeholder="The email where Teams invitations are sent"
            style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "0.7rem 0.9rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none" }} />
          <p style={{ fontSize: 11, color: C.text3 }}>We use this email to show your classes in the calendar.</p>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ width: "100%", padding: "0.85rem", borderRadius: 50, border: "none", background: saved ? C.green : saving ? C.surface2 : C.accent, color: saved ? "#fff" : saving ? C.text3 : C.bg, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: saving ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
        {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

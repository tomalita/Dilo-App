import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase.js";

// ── DESIGN TOKENS ──────────────────────────────────────────────
const C = {
  bg:       "#0d0b08",
  bg2:      "#111009",
  surface:  "#161310",
  surface2: "#1e1b17",
  border:   "rgba(240,236,224,0.07)",
  border2:  "rgba(240,236,224,0.12)",
  text:     "#f0ece0",
  text2:    "rgba(240,236,224,0.5)",
  text3:    "rgba(240,236,224,0.25)",
  green:    "#25D366",
  red:      "#c20000",
  amber:    "#ca9a04",
};

// ── DILO LOGO ANIMADO ──────────────────────────────────────────
function DiloLogo({ height = 80 }) {
  const iDotRef = useRef(null);
  const periodRef = useRef(null);

  useEffect(() => {
    const iEl = iDotRef.current;
    const pEl = periodRef.current;
    if (!iEl || !pEl) return;

    const ICX=319.5, ICY=300.5, DCX=692, DCY=497;
    const BOY=24, INIT_OY=-155, G=1000;
    const R_I=0.70, SPK=200, SPD=28, PVX=267, PVY=-558;

    let id = { oy: INIT_OY, vy: 0, ph: 'fall', bc: 0 };
    let pd = { ph: 'hidden' };
    let lastT = null;
    let raf;

    iEl.setAttribute('transform', `translate(0,${INIT_OY})`);
    pEl.setAttribute('transform', 'translate(0,0)');
    pEl.style.opacity = '0';

    function tick(ts) {
      if (!lastT) { lastT = ts; raf = requestAnimationFrame(tick); return; }
      const dt = Math.min((ts - lastT) / 1000, 0.033);
      lastT = ts;

      if (id.ph === 'fall') {
        id.vy += G * dt; id.oy += id.vy * dt;
        if (id.oy >= BOY && id.vy > 0) {
          id.oy = BOY; id.vy = -id.vy * R_I; id.bc++;
          if (id.bc >= 3) {
            id.ph = 'spring';
            pd = { cx: ICX, cy: ICY, vx: PVX, vy: PVY, ph: 'fly' };
            pEl.style.opacity = '1';
            pEl.setAttribute('transform', `translate(${ICX - DCX},${ICY - DCY})`);
          }
        }
        iEl.setAttribute('transform', `translate(0,${id.oy.toFixed(2)})`);
      } else if (id.ph === 'spring') {
        id.vy += (-SPK * id.oy - SPD * id.vy) * dt;
        id.oy += id.vy * dt;
        if (Math.abs(id.oy) < 0.3 && Math.abs(id.vy) < 4) {
          id.oy = 0; id.ph = 'done';
          iEl.setAttribute('transform', 'translate(0,0)');
        } else {
          iEl.setAttribute('transform', `translate(0,${id.oy.toFixed(2)})`);
        }
      }

      if (pd.ph === 'fly') {
        pd.vy += G * dt; pd.cx += pd.vx * dt; pd.cy += pd.vy * dt;
        if (pd.vy > 0 && pd.cy >= DCY) {
          pd.ph = 'done';
          pEl.setAttribute('transform', 'translate(0,0)');
          return;
        }
        pEl.setAttribute('transform', `translate(${(pd.cx - DCX).toFixed(2)},${(pd.cy - DCY).toFixed(2)})`);
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const w = Math.round(height * 640 / 475);
  return (
    <svg height={height} width={w} viewBox="80 95 640 475" fill="none" style={{ overflow: 'visible' }}>
      <g>
        <path fillRule="evenodd" clipRule="evenodd" d="M163.5 346C209.063 346 246 386.966 246 437.5C246 488.034 209.063 529 163.5 529C117.937 529 81 488.034 81 437.5C81 386.966 117.937 346 163.5 346ZM173.5 386C162.813 386 153.349 388.087 146 395C136.068 404.343 130 420.812 130 437C130 453.188 134.568 469.157 144.5 478.5C152.5 486.025 162.813 488 173.5 488C208 483.5 219 465.167 219 437C220 406.5 199.5 388.5 173.5 386Z" fill={C.text}/>
        <path d="M254 524V272L207 276V475L218.5 509L229 524H254Z" fill={C.text}/>
      </g>
      <path d="M343 351H296V524H343V351Z" fill={C.text}/>
      <g ref={iDotRef}>
        <path d="M346 300.5C346 315.136 334.136 327 319.5 327C304.864 327 293 315.136 293 300.5C293 285.864 304.864 274 319.5 274C334.136 274 346 285.864 346 300.5Z" fill={C.text}/>
      </g>
      <path d="M385 523.5V276L431 272V523.5H385Z" fill={C.text}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M554.5 346C613.5 346 646 386.966 646 437.5C646 488.034 613.5 527.5 554.5 527.5C491 527.5 463 488.034 463 437.5C463 386.966 494 346 554.5 346ZM555.5 386C526.738 386 512 407.376 512 437.446C512 467.516 525.311 488 555.5 488C578 488 599 467.516 599 437.446C599 407.376 580.5 386 555.5 386Z" fill={C.text}/>
      <g ref={periodRef} style={{ opacity: 0 }}>
        <path fillRule="evenodd" clipRule="evenodd" d="M692 471C706.359 471 718 482.641 718 497C718 511.359 706.359 523 692 523C677.641 523 666 511.359 666 497C666 482.641 677.641 471 692 471ZM692 479C682.059 479 674 487.283 674 497.5C674 507.717 682.059 516 692 516C701.941 516 710 507.717 710 497.5C710 487.283 701.941 479 692 479Z" fill={C.text}/>
      </g>
    </svg>
  );
}

// ── SHARED ─────────────────────────────────────────────────────
const Field = ({ label, type = "text", value, onChange, placeholder, error, hint, autoFocus }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: error ? C.red : C.text3 }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        background: C.surface2,
        border: `1px solid ${error ? C.red : C.border2}`,
        borderRadius: 10,
        padding: "0.75rem 1rem",
        fontSize: 14,
        color: C.text,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.15s",
        WebkitAppearance: "none",
      }}
      onFocus={e => { if (!error) e.target.style.borderColor = "rgba(240,236,224,0.3)"; }}
      onBlur={e => { if (!error) e.target.style.borderColor = C.border2; }}
    />
    {error && <p style={{ fontSize: 11, color: C.red, fontWeight: 500 }}>{error}</p>}
    {hint && !error && <p style={{ fontSize: 11, color: C.text3 }}>{hint}</p>}
  </div>
);

const Btn = ({ children, onClick, loading, disabled, variant = "primary" }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: "100%",
      padding: "0.85rem",
      borderRadius: 50,
      border: variant === "secondary" ? `1px solid ${C.border2}` : "none",
      background: variant === "secondary" ? "transparent" : disabled || loading ? C.surface2 : C.text,
      color: variant === "secondary" ? C.text2 : disabled || loading ? C.text3 : C.bg,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      cursor: disabled || loading ? "default" : "pointer",
      fontFamily: "inherit",
      transition: "opacity 0.15s",
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = "0.82"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
  >
    {loading ? "Cargando..." : children}
  </button>
);

// ── STEP INDICATOR ─────────────────────────────────────────────
const Steps = ({ current, total }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        height: 3, borderRadius: 2,
        width: i === current ? 24 : 8,
        background: i <= current ? C.text : C.border2,
        transition: "all 0.3s ease",
      }} />
    ))}
  </div>
);

// ── LOGIN VIEW ─────────────────────────────────────────────────
function LoginView({ onSwitch, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "El correo es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Ingresá un correo válido.";
    if (!password) e.password = "La contraseña es requerida.";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrors({ password: "Correo o contraseña incorrectos." });
        setLoading(false); return;
      }
      // Fetch profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      setLoading(false);
      onLogin({ email, role: profile?.rol || 'student', nombre: `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim(), id: data.user.id });
    } catch(e) {
      setErrors({ password: "Error de conexión. Intentá de nuevo." });
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 8 }}>Bienvenido de vuelta</p>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: C.text }}>Entrá a tu cuenta.</h1>
      </div>

      <Field label="Correo" type="email" value={email} onChange={v => { setEmail(v); setErrors(e => ({ ...e, email: "" })); }} placeholder="nombre@correo.com" error={errors.email} autoFocus />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: errors.password ? C.red : C.text3 }}>Contraseña</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: "" })); }}
            placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{
              width: "100%", background: C.surface2, border: `1px solid ${errors.password ? C.red : C.border2}`,
              borderRadius: 10, padding: "0.75rem 3rem 0.75rem 1rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none",
            }}
          />
          <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>
            {showPass ? "OCULTAR" : "VER"}
          </button>
        </div>
        {errors.password && <p style={{ fontSize: 11, color: C.red }}>{errors.password}</p>}

      </div>

      <Btn onClick={submit} loading={loading}>Entrar</Btn>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <p style={{ fontSize: 11, color: C.text3, whiteSpace: "nowrap" }}>¿Primera vez?</p>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <Btn variant="secondary" onClick={onSwitch}>Crear cuenta con código</Btn>
    </div>
  );
}

// ── REGISTER VIEW — 3 steps ────────────────────────────────────
function RegisterView({ onSwitch, onLogin }) {
  const [step, setStep] = useState(0); // 0: code, 1: info, 2: password
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passErrors, setPassErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [codeData, setCodeData] = useState(null); // { role, plan }

  // MOCK valid codes — replace with Supabase lookup
  const roleLabels = { student: "Estudiante", coach: "Coach", admin: "Admin" };
  const roleColors = { student: C.text2, coach: C.green, admin: C.amber };

  // STEP 0 — Validate invite code via Supabase
  const validateCode = async () => {
    if (!code.trim()) { setCodeError("Ingresá tu código de invitación."); return; }
    setLoading(true);
    const trimmed = code.trim().toUpperCase();
    console.log("Buscando código:", trimmed);
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', trimmed)
      .eq('usado', false)
      .single();
    console.log("Resultado:", JSON.stringify({ data, error }));
    if (error || !data) {
      setCodeError(`Código inválido o ya utilizado. (${error?.code || 'no data'})`);
      setLoading(false); return;
    }
    setCodeData({ role: data.rol, plan: data.plan });
    setCodeError("");
    setLoading(false);
    setStep(1);
  };

  // STEP 1 — Validate personal info
  const validateInfo = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = "El nombre es requerido.";
    if (!apellido.trim()) e.apellido = "El apellido es requerido.";
    if (!email.trim()) e.email = "El correo es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Ingresá un correo válido.";
    setFieldErrors(e);
    if (!Object.keys(e).length) setStep(2);
  };

  // STEP 2 — Validate password and submit
  const validatePass = async () => {
    const e = {};
    if (password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (password !== confirm) e.confirm = "Las contraseñas no coinciden.";
    setPassErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      // 1. Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, apellido, rol: codeData.role, plan: codeData.plan || null }
        }
      });
      if (authError) { setPassErrors({ password: authError.message }); setLoading(false); return; }

      // 2. Mark invite code as used
      await supabase.from('invite_codes')
        .update({ usado: true, usado_por: authData.user.id })
        .eq('code', code.trim().toUpperCase());

      setLoading(false);
      onLogin({ email, role: codeData.role, nombre: `${nombre} ${apellido}`, id: authData.user.id });
    } catch(e) {
      setPassErrors({ password: "Error al crear la cuenta. Intentá de nuevo." });
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: "Débil", color: C.red, w: "30%" };
    if (password.length < 10 || !/[A-Z]/.test(password)) return { label: "Media", color: C.amber, w: "60%" };
    return { label: "Fuerte", color: C.green, w: "100%" };
  };
  const strength = passwordStrength();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ textAlign: "center", marginBottom: "0.25rem" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 8 }}>
          {step === 0 ? "Registro" : step === 1 ? "Tu información" : "Elegí tu contraseña"}
        </p>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.03em", color: C.text, marginBottom: 16 }}>
          {step === 0 ? "Creá tu cuenta." : step === 1 ? `Hola, bienvenido${codeData?.role === "coach" ? " coach" : ""}.` : "Casi listo."}
        </h1>
        <Steps current={step} total={3} />
      </div>

      {/* STEP 0 — Invite code */}
      {step === 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: codeError ? C.red : C.text3 }}>Código de invitación</label>
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setCodeError(""); }}
              onKeyDown={e => e.key === "Enter" && validateCode()}
              placeholder="Ej: DILO-2026-AB3"
              autoFocus
              style={{
                background: C.surface2, border: `1px solid ${codeError ? C.red : C.border2}`,
                borderRadius: 10, padding: "0.75rem 1rem", fontSize: 15, color: C.text,
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.12em",
                outline: "none", textTransform: "uppercase",
              }}
            />
            {codeError
              ? <p style={{ fontSize: 11, color: C.red }}>{codeError}</p>
              : <p style={{ fontSize: 11, color: C.text3 }}>Tu coach o admin te envió este código por WhatsApp.</p>
            }
          </div>
          <Btn onClick={validateCode} loading={loading}>Verificar código</Btn>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <p style={{ fontSize: 11, color: C.text3, whiteSpace: "nowrap" }}>¿Ya tenés cuenta?</p>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <Btn variant="secondary" onClick={onSwitch}>Entrar</Btn>
        </>
      )}

      {/* STEP 1 — Personal info */}
      {step === 1 && (
        <>
          {codeData && (
            <div style={{ background: "rgba(37,211,102,0.06)", border: `1px solid rgba(37,211,102,0.2)`, borderRadius: 12, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.green }}>Código verificado</p>
                <p style={{ fontSize: 11, color: C.text3 }}>
                  Rol: <span style={{ color: roleColors[codeData.role], fontWeight: 600 }}>{roleLabels[codeData.role]}</span>
                  {codeData.plan && <> · Plan: <span style={{ color: C.text2 }}>{codeData.plan}</span></>}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            <Field label="Nombre" value={nombre} onChange={v => { setNombre(v); setFieldErrors(e => ({ ...e, nombre: "" })); }} placeholder="Nombre" error={fieldErrors.nombre} autoFocus />
            <Field label="Apellido" value={apellido} onChange={v => { setApellido(v); setFieldErrors(e => ({ ...e, apellido: "" })); }} placeholder="Apellido" error={fieldErrors.apellido} />
          </div>
          <Field label="Correo" type="email" value={email} onChange={v => { setEmail(v); setFieldErrors(e => ({ ...e, email: "" })); }} placeholder="nombre@correo.com" error={fieldErrors.email} hint="Este será tu usuario de acceso." />

          <Btn onClick={validateInfo}>Continuar</Btn>
          <button onClick={() => setStep(0)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.text3, fontFamily: "inherit", letterSpacing: "0.06em" }}>← Volver</button>
        </>
      )}

      {/* STEP 2 — Password */}
      {step === 2 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: passErrors.password ? C.red : C.text3 }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setPassErrors(er => ({ ...er, password: "" })); }}
                placeholder="Mínimo 8 caracteres"
                autoFocus
                style={{
                  width: "100%", background: C.surface2, border: `1px solid ${passErrors.password ? C.red : C.border2}`,
                  borderRadius: 10, padding: "0.75rem 3rem 0.75rem 1rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none",
                }}
              />
              <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.text3, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", fontFamily: "inherit" }}>
                {showPass ? "OCULTAR" : "VER"}
              </button>
            </div>
            {passErrors.password
              ? <p style={{ fontSize: 11, color: C.red }}>{passErrors.password}</p>
              : strength && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ height: 2, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: strength.w, height: "100%", background: strength.color, borderRadius: 2, transition: "width 0.3s ease" }} />
                  </div>
                  <p style={{ fontSize: 10, color: strength.color, fontWeight: 600, letterSpacing: "0.08em" }}>Contraseña {strength.label}</p>
                </div>
              )
            }
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: passErrors.confirm ? C.red : C.text3 }}>Confirmá tu contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setPassErrors(er => ({ ...er, confirm: "" })); }}
              onKeyDown={e => e.key === "Enter" && validatePass()}
              placeholder="••••••••"
              style={{
                background: C.surface2, border: `1px solid ${passErrors.confirm ? C.red : confirm && confirm === password ? "rgba(37,211,102,0.4)" : C.border2}`,
                borderRadius: 10, padding: "0.75rem 1rem", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none",
              }}
            />
            {passErrors.confirm
              ? <p style={{ fontSize: 11, color: C.red }}>{passErrors.confirm}</p>
              : confirm && confirm === password && <p style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ Las contraseñas coinciden</p>
            }
          </div>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, marginBottom: 8 }}>Resumen de tu cuenta</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Nombre", val: `${nombre} ${apellido}` },
                { label: "Correo", val: email },
                { label: "Rol", val: roleLabels[codeData?.role], color: roleColors[codeData?.role] },
                ...(codeData?.plan ? [{ label: "Plan", val: codeData.plan }] : []),
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12, color: C.text3 }}>{r.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: r.color || C.text2 }}>{r.val}</p>
                </div>
              ))}
            </div>
          </div>

          <Btn onClick={validatePass} loading={loading}>Crear cuenta</Btn>
          <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.text3, fontFamily: "inherit", letterSpacing: "0.06em" }}>← Volver</button>
        </>
      )}
    </div>
  );
}

// ── SUCCESS STATE ──────────────────────────────────────────────
function SuccessState({ user }) {
  const roleLabels = { student: "Estudiante", coach: "Coach", admin: "Admin" };
  const greetings = {
    student: "Tu cuenta está lista. Ya podés ver tus prácticas y el calendario de clases.",
    coach:   "Bienvenido/a al equipo. Ya tenés acceso al agente de preparación y tus herramientas.",
    admin:   "Acceso completo activado. Todo el sistema está en tus manos.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(37,211,102,0.1)", border: `1px solid rgba(37,211,102,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3, marginBottom: 6 }}>
          {roleLabels[user.role] || "Usuario"}
        </p>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.03em", color: C.text, marginBottom: 8 }}>
          {user.nombre ? `Hola, ${user.nombre.split(" ")[0]}.` : "¡Todo listo!"}
        </h2>
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
          {greetings[user.role] || "Tu cuenta está activa."}
        </p>
      </div>
      <button
        onClick={() => onLogin && onLogin(user)}
        style={{ background: C.text, color: C.bg, border: "none", borderRadius: 50, padding: "0.85rem 2rem", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}
      >
        Entrar al dashboard →
      </button>
    </div>
  );
}

// ── MAIN AUTH ──────────────────────────────────────────────────
export default function DiloAuth({ onLogin }) {
  const [view, setView] = useState("login");
  const [authedUser, setAuthedUser] = useState(null);

  const handleLogin = (user) => { setAuthedUser(user); onLogin && setTimeout(() => onLogin(user), 1800); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: "'Archivo', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;900&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        input { font-size: 16px !important; }
        input::placeholder { color: ${C.text3}; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>

        {/* LEFT PANEL — branding */}
        <div style={{
          flex: 1, display: "none", flexDirection: "column", justifyContent: "center",
          alignItems: "center",
          padding: "clamp(2rem, 5vw, 3.5rem)",
          background: C.bg2,
          borderRight: `1px solid ${C.border}`,
        }}
        className="auth-left">
          <div>
            <h2 style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.92, color: C.text, marginBottom: "1.5rem" }}>
              Dilo mal,<br />pero Dilo.
            </h2>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.65, maxWidth: 320 }}>
              Plataforma interna para estudiantes y coaches.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — forms */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
              <DiloLogo height={80} />
            </div>

            {/* Card */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 20,
              padding: "clamp(1.5rem, 4vw, 2.25rem)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}>
              {authedUser ? (
                <SuccessState user={authedUser} />
              ) : view === "login" ? (
                <LoginView onSwitch={() => setView("register")} onLogin={handleLogin} />
              ) : (
                <RegisterView onSwitch={() => setView("login")} onLogin={handleLogin} />
              )}
            </div>

            {!authedUser && (
              <p style={{ textAlign: "center", fontSize: 11, color: C.text3, marginTop: "1.5rem" }}>
                ¿Problemas para entrar? Contactanos por{" "}
              <a href="https://wa.me/50660443456" target="_blank" rel="noopener noreferrer"
                style={{ color: "#25D366", fontWeight: 600, textDecoration: "none" }}>
                WhatsApp
              </a>.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 900px) {
          .auth-left { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

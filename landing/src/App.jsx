import { useEffect, useRef, useState, useCallback } from "react";


// ── DATA ─────────────────────────────────────────────────
const STATS = [
  { pct: 90, cardColor: "#7a0000", segments: [{ text: "de la población ", red: false }, { text: "no logra dominar", red: true }, { text: " un segundo idioma.", red: false }] },
  { pct: 81.1, cardColor: "#9e0000", segments: [{ text: "de los empleadores confirma que el talento bilingüe disponible ", red: false }, { text: "no es suficiente", red: true }, { text: " para cubrir la demanda del mercado.", red: false }] },
  { pct: 46.7, cardColor: "#c20000", segments: [{ text: "de los profesionales que ya hablan inglés admiten ", red: false }, { text: "sentirse inseguros", red: true }, { text: " al conversar.", red: false }] },
];
const S3_WORDS = ["Dilo", "puede", "solucionar", "__BR__", "este", "problema."];
const CLOSING_TEXT = "Practicar con un búho o un cyborg no te va a hacer crecer profesionalmente. No es un ataque, es la realidad del mercado. Nuestro coaching te saca del estancamiento para ponerte en el 10% que sí domina el idioma.";
const CLOSING_WORDS = CLOSING_TEXT.split(" ");
const ROWS = 5;
const HERO_BAR = 2;
const BARS_INIT = [0.55, 0.65, 0.60, 0.70, 0.50, 0.62];
const WA_LINK = "https://wa.me/50660443456";
const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "El Problema", href: "#problema" },
  { label: "La Solución", href: "#s3" },
  { label: "Mindset", href: "#mindset" },
  { label: "Técnica", href: "#tecnica" },
  { label: "Precisión", href: "#precision" },
  { label: "Aplica Aquí", href: "#cta" },
  { label: "Student Login", href: "/app" },
];

// ── SHARED HOOKS ─────────────────────────────────────────
const useFadeIn = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  const fade = (delay = 0) => ({ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px)", transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s` });
  return { ref, fade };
};

const useBlurReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const onScroll = useCallback(() => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * 0.85 - rect.top) / (vh * 0.5)));
    setProgress(p);
  }, []);
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);
  return { ref, progress };
};

const useScrollZone = () => {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const onScroll = useCallback(() => {
    const el = ref.current; if (!el) return;
    setProgress(Math.max(0, Math.min(1, -el.getBoundingClientRect().top / (el.offsetHeight - window.innerHeight))));
  }, []);
  useEffect(() => { window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); return () => window.removeEventListener("scroll", onScroll); }, [onScroll]);
  return { ref, progress };
};





// ── DILO LOGO SVG — vector real ──────────────────────────
function DiloLogo({ height = 32, color = "#f0ece0" }) {
  // viewBox cropped to just the logo paths, no background
  return (
    <svg height={height} width={height * 2.5} viewBox="80 270 640 290" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="dilo." style={{ display: "block" }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M163.5 346C209.063 346 246 386.966 246 437.5C246 488.034 209.063 529 163.5 529C117.937 529 81 488.034 81 437.5C81 386.966 117.937 346 163.5 346ZM173.5 386C162.813 386 153.349 388.087 146 395C136.068 404.343 130 420.812 130 437C130 453.188 134.568 469.157 144.5 478.5C152.5 486.025 162.813 488 173.5 488C208 483.5 219 465.167 219 437C220 406.5 199.5 388.5 173.5 386Z" fill={color}/>
      <path d="M254 524V272L207 276V475L218.5 509L229 524H254Z" fill={color}/>
      <path d="M343 351H296V524H343V351Z" fill={color}/>
      <path d="M346 300.5C346 315.136 334.136 327 319.5 327C304.864 327 293 315.136 293 300.5C293 285.864 304.864 274 319.5 274C334.136 274 346 285.864 346 300.5Z" fill={color}/>
      <path d="M385 523.5V276L431 272V523.5H385Z" fill={color}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M554.5 346C613.5 346 646 386.966 646 437.5C646 488.034 613.5 527.5 554.5 527.5C491 527.5 463 488.034 463 437.5C463 386.966 494 346 554.5 346ZM555.5 386C526.738 386 512 407.376 512 437.446C512 467.516 525.311 488 555.5 488C578 488 599 467.516 599 437.446C599 407.376 580.5 386 555.5 386Z" fill={color}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M692 471C706.359 471 718 482.641 718 497C718 511.359 706.359 523 692 523C677.641 523 666 511.359 666 497C666 482.641 677.641 471 692 471ZM692 479C682.059 479 674 487.283 674 497.5C674 507.717 682.059 516 692 516C701.941 516 710 507.717 710 497.5C710 487.283 701.941 479 692 479Z" fill={color}/>
    </svg>
  );
}


// ── VIDEO BLOCK — expanding card like CTA section ─────────
function VideoBlock({ heroIn }) {
  const wrapRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const onScroll = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 1.6)));
    setProgress(p);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const eased = 1 - Math.pow(1 - progress, 2.5);
  const margin = Math.max(0, 6 - eased * 6);
  const radius = Math.max(0, 24 - eased * 24);

  return (
    <div
      ref={wrapRef}
      style={{
        marginTop: "3rem",
        opacity: heroIn ? 1 : 0,
        transform: heroIn ? "none" : "translateY(20px)",
        transition: "opacity 1s ease 0.75s, transform 1s ease 0.75s",
        width: "100%",
      }}
    >
      <div className="vid-wrap" style={{
        marginLeft: `${margin}rem`,
        marginRight: `${margin}rem`,
        borderRadius: `${radius}px`,
        overflow: "hidden",
        position: "relative",
        background: "#0d0b08",
        aspectRatio: "16 / 9",
        willChange: "border-radius, margin",
      }}>
        <style>{`@media (max-width: 640px) { .vid-wrap { aspect-ratio: 9/16 !important; } }`}</style>
        <video
          src="https://dilo.club/videointro.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
}

// ── HEADER ───────────────────────────────────────────────
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dilo Club");
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Hide on scroll UP, show on scroll DOWN (opposite of before)
      if (y < 80) setVisible(true); // always show at top
      else if (y < lastY.current - 8) setVisible(false); // hide scrolling up
      else if (y > lastY.current + 8) { setVisible(true); } // show scrolling down
      lastY.current = y;

      const sections = [
        { id: "hero", label: "Home" },
        { id: "problema", label: "El Problema" },
        { id: "s3", label: "La Solución" },
        { id: "mindset", label: "Mindset" },
        { id: "tecnica", label: "Técnica" },
        { id: "precision", label: "Precisión" },
      ];
      let current = "Home";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) current = s.label;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isTop = false; // always pill

  return (
    <>
      <style>{`
        .pill-link { display: block; font-family: 'Archivo', sans-serif; font-size: clamp(1.2rem, 3vw, 1.5rem); font-weight: 600; letter-spacing: -0.01em; color: rgba(240,236,224,0.6); text-decoration: none; padding: 0.7rem 1.5rem; transition: color 0.15s; }
        .pill-link:hover { color: #f0ece0; }
      `}</style>

      {/* Always-floating pill */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", justifyContent: "center",
        padding: isTop ? "0" : "14px 1rem 0",
        pointerEvents: "none",
        transform: visible ? "translateY(0)" : "translateY(-140%)",
        transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{
          pointerEvents: "all",
          width: "auto",
          minWidth: "220px",
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: menuOpen ? "20px" : "50px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}>
          {/* Row */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.6rem 1.25rem",
            height: "auto",
            position: "relative",
          }}>
            {/* Logo + section name always */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: 0 }}>
              <a href="#hero" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
                <DiloLogo height={22} />
              </a>
              <span style={{ color: "rgba(240,236,224,0.3)", fontSize: "12px" }}>·</span>
              <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(240,236,224,0.85)", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
                {activeSection}
              </span>
            </div>

            {/* Dots navigation */}
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {["hero","problema","s3","mindset","tecnica","precision"].map((id, i) => {
                const labels = ["Home","Los Datos","La Solución","Mindset","Técnica","Precisión"];
                const isActive = labels[i] === activeSection;
                return <div key={id} style={{ width: isActive ? "16px" : "5px", height: "5px", borderRadius: "3px", background: isActive ? "#f0ece0" : "rgba(240,236,224,0.35)", transition: "all 0.3s" }} />;
              })}
            </div>

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px", marginLeft: isTop ? "auto" : "0.5rem", zIndex: 1 }}
              aria-label="Menu">
              {menuOpen
                ? <span style={{ fontSize: "16px", color: "#f0ece0", lineHeight: 1 }}>✕</span>
                : [0,1,2].map(i => <span key={i} style={{ display: "block", height: "1.5px", borderRadius: "2px", background: "#f0ece0", width: i === 1 ? "14px" : "20px" }} />)
              }
            </button>
          </div>

          {/* Dropdown */}
          <div style={{ maxHeight: menuOpen ? "500px" : "0", overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
            <div style={{ borderTop: "1px solid rgba(240,236,224,0.1)", padding: "0.5rem 0 1rem" }}>
              {NAV_LINKS.map((link, i) => {
                const isActive = link.label === activeSection;
                return (
                  <a key={i} href={link.href}
                    className="pill-link"
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      color: isActive ? "#f0ece0" : "rgba(240,236,224,0.45)",
                      fontWeight: isActive ? 700 : 600,
                      borderLeft: isActive ? "2px solid #f0ece0" : "2px solid transparent",
                      paddingLeft: "1.25rem",
                    }}>
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



// ── FOOTER ───────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: "#0d0b08",
      borderTop: "1px solid rgba(240,236,224,0.07)",
      padding: "2.5rem 2rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1rem",
    }}>
      <DiloLogo height={20} />
      <p style={{
        fontFamily: "'Archivo', sans-serif",
        fontSize: "0.65rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(240,236,224,0.22)",
        margin: 0,
      }}>
        © 2026 Dilo Club · Todos los derechos reservados
      </p>
    </footer>
  );
}

// ── STAT CARD ─────────────────────────────────────────────
function StatCard({ pct, cardColor, segments }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { setStarted(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el); return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const fps = 60, steps = 126; let step = 0;
    const t = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      const progress = Math.min(1, ease);
      setCount(parseFloat(Math.min(pct, pct * ease).toFixed(1)));
      setBarWidth(progress * pct);
      if (step >= steps) { setCount(pct); setBarWidth(pct); clearInterval(t); }
    }, 1000 / fps);
    return () => clearInterval(t);
  }, [started, pct]);

  const disp = Number.isInteger(pct) ? Math.round(count) : count.toFixed(1);

  return (
    <div ref={ref} style={{ marginBottom: "3rem" }}>
      <div style={{
        background: "rgba(240,236,224,0.06)",
        borderRadius: "8px",
        marginBottom: "1.25rem",
        minHeight: "160px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: 0, left: 0, bottom: 0,
          width: `${barWidth}%`,
          background: cardColor,
          borderRadius: "8px",
          transition: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, padding: "2rem 2rem 2.5rem" }}>
          <span style={{
            fontFamily: "'Archivo', sans-serif", fontWeight: 800,
            fontSize: "clamp(3.5rem, 12vw, 6rem)", lineHeight: 1,
            letterSpacing: "-0.04em", color: "#0d0b08",
          }}>{disp}%</span>
        </div>
      </div>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: "clamp(0.95rem, 2vw, 1.1rem)", fontWeight: 700, lineHeight: 1.45 }}>
        {segments.map((seg, i) => <span key={i} style={{ color: seg.red ? "#D50000" : "#f0ece0" }}>{seg.text}</span>)}
      </div>
    </div>
  );
}


// ── SOLUCIÓN SECTION — título blur + texto gris→blanco, mismo tamaño ─────
function SolucionSection() {
  const zone1Ref = useRef(null);
  const zone2Ref = useRef(null);
  const [blurP, setBlurP] = useState(0);
  const [revealed, setRevealed] = useState(0);

  const onScroll = useCallback(() => {
    const el1 = zone1Ref.current;
    if (el1) {
      const travel = -el1.getBoundingClientRect().top;
      setBlurP(Math.max(0, Math.min(1, travel / (el1.offsetHeight - window.innerHeight))));
    }
    const el2 = zone2Ref.current;
    if (el2) {
      const travel = -el2.getBoundingClientRect().top;
      const p = Math.max(0, Math.min(1, travel / (el2.offsetHeight - window.innerHeight)));
      setRevealed(Math.round(p * CLOSING_WORDS.length));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const FONT_S3 = { fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: "clamp(2.4rem, 5.5vw, 6rem)", lineHeight: 1.1, letterSpacing: "-0.06em" };
  const FONT = { fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: "clamp(2.8rem, 6vw, 6.8rem)", lineHeight: 0.92, letterSpacing: "-0.03em" };
  const realWords = S3_WORDS.filter(w => w !== "__BR__");
  const getBlur = (ri) => {
    const p = Math.max(0, Math.min(1, (blurP - (ri / realWords.length) * 0.2) / 0.5));
    return { blur: p * 28, opacity: 1 - p };
  };

  return (
    <>
      {/* Zona 1 — "Dilo puede solucionar..." blur out */}
      <div id="s3" ref={zone1Ref} style={{ background: "#0d0b08", height: "clamp(500px, 200vh, 200vh)", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 clamp(1.25rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "min(960px, 90vw)", width: "100%", textAlign: "center",
            transform: `translateY(${Math.max(0, 50 - blurP * 60)}px) scale(${0.88 + blurP * 0.12})`,
            transformOrigin: "center center",
            transition: "none",
            willChange: "transform",
          }}>
            {(() => {
              let ri = 0;
              return S3_WORDS.map((word, i) => {
                if (word === "__BR__") return <br key={i} />;
                const { blur, opacity } = getBlur(ri++);
                return (
                  <span key={i} style={{ display: "inline-block", ...FONT_S3, color: "#f0ece0", marginRight: "0.22em", filter: `blur(${blur}px)`, opacity, willChange: "filter, opacity" }}>
                    {word}
                  </span>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Zona 2 — búho word reveal, overlaps with zone1 */}
      <div ref={zone2Ref} style={{ background: "#0d0b08", height: "280vh", position: "relative", marginTop: "-50vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 clamp(1.25rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "min(960px, 90vw)", width: "100%", textAlign: "center" }}>
            <p style={{ ...FONT, margin: 0, display: "block" }}>
              {CLOSING_WORDS.map((word, i) => {
                const cleanWord = word.replace(/[.,!?]/g, "");
                const isGreen = ["que", "sí", "domina"].includes(cleanWord);
                const activeColor = isGreen ? "#25D366" : "#f0ece0";
                return (
                  <span key={i} style={{ display: "inline", color: i < revealed ? activeColor : "rgba(240,236,224,0.1)", transition: "color 0.08s ease" }}>
                    {word}{i < CLOSING_WORDS.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


// ── ANIMATED ARROW CHART ──────────────────────────────────
function AnimatedChart() {
  const zoneRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const onScroll = useCallback(() => {
    const el = zoneRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    setProgress(Math.max(0, Math.min(1, (window.innerHeight * 0.75 - rect.top) / (rect.height + window.innerHeight * 0.3))));
  }, []);
  useEffect(() => { window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); return () => window.removeEventListener("scroll", onScroll); }, [onScroll]);
  const W = 900, H = 360, padX = 50, padY = 50;
  const chartW = W - padX * 2, chartH = H - padY * 2;
  const x1 = padX, y1 = padY + chartH, x2 = padX + chartW, y2 = padY;
  const tipX = x1 + (x2 - x1) * progress, tipY = y1 + (y2 - y1) * progress;
  const angle = Math.atan2(y2 - y1, x2 - x1), headLen = 20, spread = 0.42;
  const ah1x = tipX - headLen * Math.cos(angle - spread), ah1y = tipY - headLen * Math.sin(angle - spread);
  const ah2x = tipX - headLen * Math.cos(angle + spread), ah2y = tipY - headLen * Math.sin(angle + spread);
  const spikes = [
    { t: 0.10, up: -1, amp: 38 }, { t: 0.20, up: 1, amp: 20 },
    { t: 0.33, up: -1, amp: 85 }, { t: 0.44, up: 1, amp: 16 },
    { t: 0.57, up: -1, amp: 105 }, { t: 0.67, up: 1, amp: 28 },
    { t: 0.79, up: -1, amp: 68 }, { t: 0.89, up: 1, amp: 22 },
  ];
  const zigPts = [{ x: padX, y: y1 }, ...spikes.map(({ t, up, amp }) => ({ x: padX + t * chartW, y: Math.max(padY - 15, Math.min(H - padY + 15, y1 + (y2 - y1) * t + up * amp)) })), { x: padX + chartW, y: y2 }];
  const zigPath = zigPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const arrowLen = Math.hypot(x2 - x1, y2 - y1);
  return (
    <div ref={zoneRef} style={{ width: "100%", maxWidth: "560px", margin: "3rem auto 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible", display: "block" }}>
        <path d={zigPath} fill="none" stroke="rgba(240,236,224,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={x1} y1={y1} x2={tipX} y2={tipY} stroke="#f0ece0" strokeWidth="3" strokeLinecap="round" strokeDasharray={arrowLen} strokeDashoffset={arrowLen - arrowLen * progress} />
        {progress > 0.05 && <polyline points={`${ah1x.toFixed(1)},${ah1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${ah2x.toFixed(1)},${ah2y.toFixed(1)}`} fill="none" stroke="#f0ece0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </div>
  );
}

// ── SECTION TEMPLATE ──────────────────────────────────────

function ContentSection({ id, eyebrow, title, body, children, padBottom = "6rem", extraPad }) {
  const { ref, fade } = useFadeIn();
  return (
    <section id={id} ref={ref} style={{ background: "#0d0b08", padding: `${extraPad ? "clamp(4rem, 8vw, 6rem)" : "clamp(2.5rem, 5vw, 3.5rem)"} clamp(1.25rem, 4vw, 2rem) ${padBottom}` }}>
      <div style={{ maxWidth: "min(860px, 90vw)", margin: "0 auto" }}>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: "clamp(0.8rem, 1.3vw, 1rem)", fontWeight: 400, letterSpacing: "0.08em", lineHeight: 1.5, textTransform: "uppercase", color: "rgba(240,236,224,0.35)", marginBottom: "1.25rem", ...fade(0) }}>{eyebrow}</p>
        <h2 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: "clamp(2rem, 5.5vw, 4rem)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#f0ece0", marginBottom: "2rem", ...fade(0.12) }}>{title}</h2>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: "clamp(1.1rem, 2.2vw, 1.4rem)", fontWeight: 500, lineHeight: 1.5, letterSpacing: "-0.01em", color: "rgba(240,236,224,0.58)", ...fade(0.24) }}>{body}</p>
        {children}
      </div>
    </section>
  );
}

// ── REPETITION ANIM — inline like AnimatedChart, no sticky ──
// ── REPETITION ANIM — horizontal scroll-triggered ──
function RepetitionAnim() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const onScroll = useCallback(() => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * 0.75 - rect.top) / (vh * 0.6)));
    setProgress(p);
  }, []);
  useEffect(() => { window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); return () => window.removeEventListener("scroll", onScroll); }, [onScroll]);

  const WORDS = ["Aprende", "Practica", "Mecaniza", "Practica", "Automatiza"];
  const n = WORDS.length;
  const items = Array.from({ length: n }, (_, i) => {
    const p = Math.max(0, Math.min(1, progress * n - i));
    return { opacity: 0.1 + p * 0.9, weight: p > 0.5 ? 700 : 400 };
  });

  return (
    <div ref={ref} style={{ width: "100%", maxWidth: "560px", margin: "3rem auto 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "clamp(0.3rem, 1vw, 0.5rem)" }}>
        {WORDS.map((word, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "clamp(0.3rem, 1vw, 0.5rem)" }}>
            <span style={{
              fontFamily: "'Share Tech Mono', 'Courier New', monospace",
              fontSize: "clamp(1rem, 2.8vw, 1.8rem)",
              fontWeight: items[i].weight,
              letterSpacing: "0.15em",
              color: `rgba(240,236,224,${items[i].opacity})`,
              transition: "color 0.4s ease, font-weight 0.4s ease",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>{word}</span>
            {i < n - 1 && (
              <span style={{
                fontSize: "clamp(0.8rem, 2vw, 1.2rem)",
                color: `rgba(240,236,224,${Math.max(items[i].opacity, items[i+1].opacity) * 0.4})`,
                transition: "color 0.4s ease",
                lineHeight: 1, flexShrink: 0,
              }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PRECISION BARS ANIM — 5 horizontal lines, one grows others shrink ──
function PrecisionBarsAnim() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const [containerW, setContainerW] = useState(320);

  const onScroll = useCallback(() => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (window.innerHeight * 0.8 - rect.top) / (rect.height + window.innerHeight * 0.8)));
    setProgress(p);
    setContainerW(el.offsetWidth || 320);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => { if (ref.current) setContainerW(ref.current.offsetWidth); });
    if (ref.current) ro.observe(ref.current);
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [onScroll]);

  const eased = 1 - Math.pow(1 - progress, 2.5);
  const LINES = [0.6, 0.65, 0.62, 0.58, 0.63]; // all start similar ~60%
  const HERO = 2;
  const MAX_W = containerW;
  const LINE_H = Math.max(1.5, Math.min(2.5, containerW * 0.004));
  const GAP = Math.max(10, Math.min(16, containerW * 0.03));

  return (
    <div ref={ref} style={{ width: "100%", maxWidth: "560px", margin: "3rem auto 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
        {LINES.map((initRatio, i) => {
          const isHero = i === HERO;
          const w = isHero
            ? initRatio * MAX_W + (MAX_W - initRatio * MAX_W) * eased
            : Math.max(MAX_W * 0.03, initRatio * MAX_W - initRatio * MAX_W * eased);
          const opacity = isHero ? 1 : Math.max(0.1, (1 - eased * 0.85));
          return (
            <div key={i} style={{ width: "100%", height: `${LINE_H}px`, background: "rgba(240,236,224,0.08)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${w}px`, height: "100%", background: `rgba(240,236,224,${opacity})`, borderRadius: "2px", willChange: "width" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CTA SECTION ───────────────────────────────────────────
function CTASection() {
  const wrapRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const onScroll = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    // Start expanding when top of section enters bottom of viewport
    // Complete when top reaches center
    const p = Math.max(0, Math.min(1, (vh - rect.top) / vh));
    setProgress(p);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  // Interpolate: starts with 2rem margin each side, expands to 0
  const margin = Math.max(0, 2 - progress * 2);
  const radius = Math.max(0, 20 - progress * 20);

  return (
    <div id="cta" ref={wrapRef} style={{ background: "#0d0b08", paddingTop: "0" }}>
      <section style={{
        background: "#f5f2ec",
        borderRadius: `${radius}px`,
        margin: `0 ${margin}rem`,
        padding: "clamp(4rem, 8vw, 6rem) clamp(2rem, 6vw, 4rem) clamp(5rem, 9vw, 7rem)",
        transition: "none",
        willChange: "border-radius, margin",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: "min(860px, 90vw)", margin: "0 auto" }}>
          <p style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(15,12,8,0.55)",
            textAlign: "center",
            maxWidth: "640px",
            margin: "0 auto 2.5rem",
          }}>
            Tu crecimiento laboral empieza con resultados, no con certificados.
          </p>
          <h2 style={{
            fontFamily: "'Archivo', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(2rem, 5.5vw, 4rem)",
            lineHeight: 1.15, letterSpacing: "-0.02em",
            color: "#0d0b08", marginBottom: "3rem", textAlign: "center",
          }}>
            ¿Cuánto te cuesta no hablar inglés con seguridad hoy?
          </h2>
          <div style={{ textAlign: "center" }}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: "0.6rem",
              background: "#0d0b08", color: "#f5f2ec",
              fontFamily: "'Archivo', sans-serif", fontSize: "0.85rem",
              fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
              textDecoration: "none", padding: "0.65rem 1.5rem", transition: "opacity 0.2s",
              borderRadius: "50px",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Aplica Aquí
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function DiloPage() {
  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroIn(true), 60); return () => clearTimeout(t); }, []);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800;900&family=Share+Tech+Mono&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
        body { background: #0d0b08; font-family: 'Archivo', sans-serif; color: #f0ece0; -webkit-font-smoothing: antialiased; overscroll-behavior-y: none; }
        input, textarea, select { font-size: 16px; }
        a, button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        /* ── BASE: 360px — Android mid-range (Moto E7, Samsung A series) ── */
        .hero { min-height: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: env(safe-area-inset-top, 5rem) 1.25rem 2rem; padding-top: max(5rem, env(safe-area-inset-top)); }
        .hero-title { font-family: 'Archivo', sans-serif; font-size: clamp(3.2rem, 17vw, 5.5rem); font-weight: 900; line-height: 0.9; letter-spacing: -0.04em; color: #f0ece0; margin-bottom: 1.25rem; opacity: 0; transform: translateY(28px); transition: opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s; }
        .hero-title.in { opacity: 1; transform: none; }
        .hero-body { font-size: 0.7rem; font-weight: 400; line-height: 1.75; color: rgba(240,236,224,0.55); max-width: 88vw; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0; transform: translateY(16px); transition: opacity 0.9s ease 0.45s, transform 0.9s ease 0.45s; }
        .hero-body.in { opacity: 1; transform: none; }
        .video-block { max-width: 100%; margin: 2rem auto 0; aspect-ratio: 16/9; position: relative; background: #1a1714; opacity: 0; transform: translateY(20px); transition: opacity 1s ease 0.75s, transform 1s ease 0.75s; }
        .video-block.in { opacity: 1; transform: none; }
        .video-inner { position: absolute; inset: 0; background: linear-gradient(160deg,#1f1c17 0%,#0d0b08 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
        .play-btn { width: 52px; height: 52px; border-radius: 50%; background: rgba(240,236,224,0.12); border: 1.5px solid rgba(240,236,224,0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .play-btn:hover { background: rgba(240,236,224,0.22); }
        .play-btn svg { margin-left: 4px; }
        .video-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(240,236,224,0.35); }
        .section2 { padding: 3.5rem 1.25rem 1rem; }
        .stats-eyebrow { font-size: 0.72rem; font-weight: 400; letter-spacing: 0.08em; line-height: 1.5; text-transform: uppercase; color: rgba(240,236,224,0.38); text-align: center; margin-bottom: 0.75rem; }
        .stats-title { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: clamp(2.2rem, 8vw, 3.5rem); line-height: 1.1; letter-spacing: -0.03em; color: #f0ece0; text-align: center; margin-bottom: 1.75rem; max-width: 90vw; margin-left: auto; margin-right: auto; }
        .stats-grid { max-width: 100%; margin: 0 auto; padding: 0; }

        /* ── 375px: iPhone SE / iPhone 8 ── */
        @media (min-width: 375px) {
          .hero-title { font-size: clamp(3.4rem, 17.5vw, 5.8rem); }
          .hero-body { font-size: 0.72rem; }
        }

        /* ── 390px: iPhone 12/13/14 — Dynamic Island safe area ── */
        @media (min-width: 390px) {
          .hero { padding-top: max(5.5rem, env(safe-area-inset-top)); padding-left: 1.35rem; padding-right: 1.35rem; }
          .hero-title { font-size: clamp(3.6rem, 18vw, 6rem); margin-bottom: 1.4rem; }
          .hero-body { font-size: 0.74rem; max-width: 85vw; }
          .section2 { padding: 4rem 1.35rem 1rem; }
          .stats-title { font-size: clamp(2.4rem, 8.5vw, 3.8rem); }
        }

        /* ── 430px: iPhone 14 Plus / 15 Plus ── */
        @media (min-width: 430px) {
          .hero-title { font-size: clamp(3.8rem, 18vw, 6.2rem); }
          .hero-body { font-size: 0.76rem; max-width: 82vw; }
          .stats-title { font-size: clamp(2.6rem, 8vw, 4rem); }
        }

        /* ── 576px: Mobile landscape / small tablets ── */
        @media (min-width: 576px) {
          .hero { padding: 6rem 1.5rem 2rem; }
          .hero-title { font-size: clamp(4rem, 15vw, 7rem); }
          .hero-body { font-size: 0.78rem; max-width: 480px; letter-spacing: 0.14em; }
          .section2 { padding: 5rem 1.5rem 1rem; }
          .stats-title { font-size: clamp(2.8rem, 6vw, 5rem); }
        }

        /* ── 768px: iPad / tablet portrait (768×1024 = 20% of tablets) ── */
        @media (min-width: 768px) {
          .hero { padding: 7rem 2.5rem 2rem; }
          .hero-title { font-size: clamp(5rem, 13vw, 10rem); line-height: 0.88; margin-bottom: 2rem; }
          .hero-body { font-size: 0.82rem; max-width: 580px; letter-spacing: 0.15em; }
          .video-block { width: calc(100% - 3rem); border-radius: 14px; margin-top: 3rem; }
          .section2 { padding: 6rem 2.5rem 5rem; }
          .stats-title { font-size: clamp(3rem, 5.5vw, 5.5rem); margin-bottom: 2.75rem; }
          .stats-grid { max-width: 660px; }
        }

        /* ── 1024px: iPad landscape / small laptops ── */
        @media (min-width: 1024px) {
          .hero { padding: 8rem 3rem 2rem; }
          .hero-title { font-size: clamp(6rem, 12vw, 11rem); }
          .hero-body { font-size: 0.86rem; max-width: 620px; }
          .section2 { padding: 7rem 3rem 7rem; }
          .stats-title { font-size: clamp(3.2rem, 5vw, 5.5rem); }
          .stats-grid { max-width: 760px; }
        }

        /* ── 1366px: Most common laptop (Dell, Lenovo budget — 12.77% share) ── */
        @media (min-width: 1280px) {
          .hero { padding: 8.5rem 4rem 2rem; }
          .hero-title { font-size: clamp(7rem, 11vw, 13rem); margin-bottom: 2.5rem; }
          .hero-body { font-size: 0.88rem; max-width: 640px; }
          .section2 { padding: 8rem 4rem 8rem; }
          .stats-title { font-size: clamp(3.4rem, 4.5vw, 5.8rem); margin-bottom: 3rem; }
          .stats-grid { max-width: 860px; }
        }

        /* ── 1536px: Mid-range laptops (Dell E2318H — 11.85% share) ── */
        @media (min-width: 1440px) {
          .hero { padding: 9.5rem 5rem 2rem; }
          .hero-title { font-size: clamp(8rem, 11vw, 15rem); margin-bottom: 3rem; }
          .hero-body { font-size: 0.92rem; max-width: 700px; }
          .section2 { padding: 9rem 5rem 9rem; }
          .stats-title { font-size: clamp(3.8rem, 4vw, 6.2rem); margin-bottom: 3.5rem; }
          .stats-grid { max-width: 980px; }
        }

        /* ── 1920px: Full HD — most common desktop (24.52% share) ── */
        @media (min-width: 1920px) {
          .hero { padding: 11rem 7rem 2rem; }
          .hero-title { font-size: clamp(10rem, 11vw, 17rem); }
          .hero-body { font-size: 1rem; max-width: 820px; letter-spacing: 0.14em; }
          .section2 { padding: 11rem 7rem 11rem; }
          .stats-grid { max-width: 1150px; }
          .stats-title { font-size: clamp(4.2rem, 3.8vw, 6.8rem); }
        }

        /* ── 2560px: 2K / QHD monitors ── */
        @media (min-width: 2560px) {
          .hero { padding: 14rem 10rem 2rem; }
          .hero-title { font-size: clamp(12rem, 10vw, 20rem); }
          .hero-body { font-size: 1.15rem; max-width: 1000px; }
          .section2 { padding: 14rem 10rem 14rem; }
          .stats-grid { max-width: 1400px; }
          .stats-title { font-size: clamp(5rem, 3.5vw, 8rem); }
        }
      `}</style>

      <Header />

      <section id="inicio" className="hero" style={{ background: "#0d0b08", paddingBottom: "0" }}>
        <h1 className={`hero-title${heroIn ? " in" : ""}`}>Inglés de<br />Precisión</h1>
        <p className={`hero-body${heroIn ? " in" : ""}`} style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
              fontWeight: 400,
              lineHeight: 1.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(240,236,224,0.55)",
            }}>Mientras que la demanda de profesionales bilingües aumenta en latinoamérica, los métodos de enseñanza obsoletos siguen entregando resultados insuficientes.</p>
      </section>
      <VideoBlock heroIn={heroIn} />

      <section id="problema" className="section2" style={{ background: "#0d0b08", boxSizing: "border-box" }}>
        <p className="stats-eyebrow">El estado actual</p>
        <h2 className="stats-title">Los datos son<br />contundentes.</h2>
        <div className="stats-grid">{STATS.map((s, i) => <StatCard key={i} {...s} />)}</div>
      </section>
      <SolucionSection />

      <ContentSection id="mindset" eyebrow="MINDSET" title="Mindset" extraPad="true" body="La mentalidad correcta es la que genera resultados constantes. Eliminamos la cultura del regaño y la necesidad de pedir perdón por equivocarse. Creamos un entorno donde el error es una oportunidad de mejora, no un motivo de vergüenza." padBottom="3rem">
        <AnimatedChart />
      </ContentSection>

      <ContentSection id="tecnica" eyebrow="TECHNIQUE" title="Técnica" body="La gramática son las reglas del juego, pero no sirve de nada saturarse de teoría si no se pone en práctica. Si un estudiante se sobrecarga de reglas que no utiliza, la información se pierde. Priorizamos la simplicidad para que cada estructura sea una herramienta de uso inmediato." padBottom="4rem">
        <RepetitionAnim />
      </ContentSection>

      <ContentSection id="precision" eyebrow="PRECISION" title="Precisión" body='Utilizamos Inteligencia Artificial propia para diagnosticar y corregir errores de forma quirúrgica. Esta tecnología, junto al acompañamiento de nuestro equipo, permite una personalización que otros métodos no pueden alcanzar.' padBottom="4rem">
        <PrecisionBarsAnim />
      </ContentSection>

      <CTASection />
      <Footer />
    </>
  );
}

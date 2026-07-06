import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import {
  C, CARD, SEL, ROL_LABELS, ROL_COLORS, IVA_RATE, CR_UTC_OFFSET_MS, toCRDate,
  MONTHS_SHORT, MONTHS_LONG, USD_RATE, loadCoachRoster, getCoachNames, getCoachColors,
  toast, DiloDot, DiloLogo, Icon, Badge, StatCard, ProgressBar, SectionHeader, NAV,
  isoFmt, ANON_KEY, EDGE_URL, ATTENDANCE_URL, WHATSAPP_URL, CASHIER_URL, CASHIER_INTENT_URL,
  ONVO_PUBLIC_KEY, SCHED, SHEET_CLASS, SHEET_STUDENT, SHEET_SURVEYS,
  COACHES, COACH_COLORS, FB_COACHES, AVATAR_COLORS, VIEW_TITLES, STU_LEVELS, crToday,
  PlaceholderView,
} from "./lib/shared.jsx";
// Vistas de primer render (post-login) — estáticas para que carguen con el bundle inicial
import { StudentDashboard, CoachDashboard, AdminDashboard } from "./views/dashboards.jsx";
import { MasterSchedule } from "./views/calendar.jsx";
// Resto de vistas: lazy — cada una se descarga la primera vez que se abre
const lazyView = (loader, name) => React.lazy(() => loader().then(m => ({ default: m[name] })));
const FeedbacksHub        = lazyView(() => import("./views/feedback.jsx"), "FeedbacksHub");
const SendFeedbackView    = lazyView(() => import("./views/feedback.jsx"), "SendFeedbackView");
const NewClassFeedbackView= lazyView(() => import("./views/feedback.jsx"), "NewClassFeedbackView");
const ClassFeedbackView   = lazyView(() => import("./views/feedback.jsx"), "ClassFeedbackView");
const StudentFeedbackView = lazyView(() => import("./views/feedback.jsx"), "StudentFeedbackView");
const StudentSurveysView  = lazyView(() => import("./views/feedback.jsx"), "StudentSurveysView");
const InvitesView         = lazyView(() => import("./views/profile.jsx"), "InvitesView");
const ProfileView         = lazyView(() => import("./views/profile.jsx"), "ProfileView");
const KYCCoachView        = lazyView(() => import("./views/profile.jsx"), "KYCCoachView");
const SettingsView        = lazyView(() => import("./views/profile.jsx"), "SettingsView");
const NextClassesView     = lazyView(() => import("./views/nextclasses.jsx"), "NextClassesView");
const DinamicasView       = lazyView(() => import("./views/dinamicas.jsx"), "DinamicasView");
const StudentsView        = lazyView(() => import("./views/students.jsx"), "StudentsView");
const MyHoursView         = lazyView(() => import("./views/myhours.jsx"), "MyHoursView");
const ProgressView        = lazyView(() => import("./views/progress.jsx"), "ProgressView");
const CoachesView         = lazyView(() => import("./views/coaches.jsx"), "CoachesView");
const CashierView         = lazyView(() => import("./views/cashier.jsx"), "CashierView");
const AttendanceView      = lazyView(() => import("./views/attendance.jsx"), "AttendanceView");
const ClassPrepView       = lazyView(() => import("./views/classprep.jsx"), "ClassPrepView");
const WhatsAppView        = lazyView(() => import("./views/whatsapp.jsx"), "WhatsAppView");
const MeetingRecapsView   = lazyView(() => import("./views/recaps.jsx"), "MeetingRecapsView");


// ── VIEWS ──────────────────────────────────────────────────────
// ── USER MENU ─────────────────────────────────────────────────

function UserMenu({ user, role, collapsed, isMobile, onLogout, setActive, setCollapsed, unreadWA = 0, setUnreadWA }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (user?.nombre || user?.email || "U")[0].toUpperCase();
  const avatarColor = role === "coach" ? (AVATAR_COLORS[user?.nombre] || C.text2) : C.text2;

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, []);

  return (
    <div ref={ref} style={{ padding: "0.25rem 0.4rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
      {/* Popup menu */}
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "0.4rem", right: "0.4rem", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100 }}>
          {/* User info header */}
          <div style={{ padding: "0.65rem 0.85rem", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.nombre ? `${user.nombre}${user.apellido ? " " + user.apellido : ""}` : user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p style={{ fontSize: 10, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || ""}
            </p>
          </div>
          {/* Menu items */}
          {[
            { label: "Settings",      icon: "settings", action: () => { setActive("settings"); setOpen(false); if (isMobile) setCollapsed(true); } },
            { label: "Notifications", icon: "bell",    action: () => { setActive("whatsapp"); setOpen(false); if (isMobile) setCollapsed(true); }, badge: unreadWA > 0 ? unreadWA : null },
            { label: "Sign out",      icon: "logout",  action: () => { setOpen(false); onLogout(); } },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "none", background: "transparent", cursor: "pointer", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon name={item.icon} size={15} color={item.danger ? C.red : C.text2} />
              <span style={{ fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text2, flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  background: C.red, color: "#fff", fontSize: 10, fontWeight: 700,
                  borderRadius: "50%", minWidth: 18, height: 18, padding: "0 4px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{item.badge > 99 ? "99+" : item.badge}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: collapsed && !isMobile ? "0.35rem" : "0.35rem 0.5rem", borderRadius: 8, border: "none", background: open ? C.surface2 : "transparent", cursor: "pointer", justifyContent: collapsed && !isMobile ? "center" : "flex-start", WebkitTapHighlightColor: "transparent", transition: "background 0.15s" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: avatarColor + "22", border: `1px solid ${avatarColor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: avatarColor }}>{initial}</span>
        </div>
        {(!collapsed || isMobile) && (
          <p style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
            {role && <span style={{ fontWeight: 400, color: C.text3 }}> · {role}</span>}
          </p>
        )}
        {(!collapsed || isMobile) && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────
function Sidebar({ role, user, active, setActive, collapsed, setCollapsed, isMobile, onLogout, unreadWA, setUnreadWA }) {
  const navItems = NAV[role] || NAV.student;
  const roleLabels = { student: "Student", coach: "Coach", admin: "Admin" };
  const roleColors = { student: C.text2, coach: C.green, admin: C.amber };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div onClick={() => setCollapsed(true)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
      )}

      <aside style={{
        position: isMobile ? "fixed" : "relative",
        left: isMobile ? (collapsed ? "-260px" : "0") : "0",
        top: 0, bottom: 0,
        width: isMobile ? 240 : (collapsed ? 56 : 240),
        minWidth: isMobile ? 240 : (collapsed ? 56 : 240),
        background: C.bg2,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        zIndex: 50,
        flexShrink: 0,
        WebkitOverflowScrolling: "touch",
      }}>
        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0, justifyContent: collapsed && !isMobile ? "center" : "flex-start", minHeight: 57, padding: "0 0.75rem" }}>
          {(!collapsed || isMobile) && <div style={{ flexShrink: 0, paddingLeft: "0.25rem", display: "flex", alignItems: "center" }}><DiloLogo height={26} /></div>}
          {(!collapsed || isMobile) && <div style={{ flex: 1 }} />}
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>
            <Icon name={collapsed && !isMobile ? "sidein" : "sidebar"} size={16} color={C.text2} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.5rem", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
          {navItems.map((item, idx) => {
            if (item.section) {
              if (collapsed && !isMobile) return null;
              return (
                <p key={"sec-" + idx} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, padding: idx === 0 ? "0.5rem 0.75rem 0.25rem" : "1rem 0.75rem 0.25rem" }}>
                  {item.section}
                </p>
              );
            }
            const isActive = active === item.id || item.children?.some(c => c.id === active);
            const isChildActive = item.children?.some(c => c.id === active);
            const [expanded, setExpanded] = React.useState(isChildActive);
            return (
              <div key={item.id}>
                <button onClick={() => {
                    if (item.children) { setExpanded(e => !e); }
                    else { setActive(item.id); if (isMobile) setCollapsed(true); }
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: isMobile ? "0.65rem 0.75rem" : "0.55rem 0.75rem",
                    minHeight: isMobile ? 44 : 36,
                    borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2,
                    background: isActive && !item.children ? C.surface2 : "transparent",
                    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                    transition: "background 0.15s",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surface; }}
                  onMouseLeave={e => { if (!(isActive && !item.children)) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ flexShrink: 0 }}>
                    <Icon name={item.icon} size={16} color={isActive ? C.text : C.text2} />
                  </span>
                  {(!collapsed || isMobile) && (
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.text : C.text2, whiteSpace: "nowrap", overflow: "hidden", flex: 1 }}>
                      {item.label}
                    </span>
                  )}
                  {(!collapsed || isMobile) && item.children && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  )}
                  {(!collapsed || isMobile) && !item.children && isActive && (
                    <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#25D366", flexShrink: 0 }} />
                  )}
                </button>
                {/* Children */}
                {item.children && expanded && (!collapsed || isMobile) && (
                  <div style={{ paddingLeft: "2rem", marginBottom: 4 }}>
                    {item.children.map(child => {
                      const isChildAct = active === child.id;
                      return (
                        <button key={child.id} onClick={() => { setActive(child.id); if (isMobile) setCollapsed(true); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem 0.75rem", minHeight: 36,
                            borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 1,
                            background: isChildAct ? C.surface2 : "transparent",
                            WebkitTapHighlightColor: "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (!isChildAct) e.currentTarget.style.background = C.surface; }}
                          onMouseLeave={e => { if (!isChildAct) e.currentTarget.style.background = "transparent"; }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: isChildAct ? C.green : C.text3, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: isChildAct ? 600 : 400, color: isChildAct ? C.text : C.text2 }}>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User menu bottom */}
        <UserMenu user={user} role={role} collapsed={collapsed} isMobile={isMobile} onLogout={onLogout} setActive={setActive} setCollapsed={setCollapsed} unreadWA={unreadWA} setUnreadWA={setUnreadWA} />
        <div style={{ height: "env(safe-area-inset-bottom)", flexShrink: 0 }} />
      </aside>
    </>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
export default function DiloApp({ user, onLogout = () => {} }) {
  const role = user?.role || "student";
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadWA, setUnreadWA] = useState(0);

  useEffect(() => {
    if (role !== "admin") return;
    supabase.from("whatsapp_inbox").select("id", { count: "exact" }).eq("is_read", false)
      .then(({ count }) => setUnreadWA(count || 0));
    const ch = supabase.channel("wa_inbox_badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_inbox" }, () =>
        setUnreadWA(n => n + 1))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [role]);


  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
      else setCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const renderView = () => {
    // Guards de rol — el sidebar solo oculta los links; esto bloquea el acceso real
    const ADMIN_ONLY = ["coaches", "students", "cashier", "whatsapp", "invites", "estudiantes", "dilo-coach"];
    const STAFF_ONLY = ["next-classes", "class-recaps", "dinamicas", "my-hours", "new-class-feedback", "send-feedback", "progress"];
    if (ADMIN_ONLY.includes(active) && role !== "admin")
      return <PlaceholderView title="Access denied" desc="This section is only available to administrators." icon="home" />;
    if (STAFF_ONLY.includes(active) && role === "student")
      return <PlaceholderView title="Access denied" desc="This section is only available to coaches." icon="home" />;

    if (active === "dashboard") {
      if (role === "admin") return <AdminDashboard />;
      if (role === "coach") return <CoachDashboard user={user} />;
      return <StudentDashboard />;
    }
    if (active === "feedbacks")            return <FeedbacksHub setActive={setActive} role={role} />;
    if (active === "new-class-feedback") return <NewClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-coach")         return <ClassPrepView user={user} />;
    if (active === "send-feedback")      return <SendFeedbackView user={user} setActive={setActive} />;
    if (active === "class-feedback")    return <ClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-feedback")  return <StudentFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-surveys")   return <StudentSurveysView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-student") return <ClassPrepView user={user} />;
    if (active === "calendario")    return <MasterSchedule role={role} user={user} />;
    if (active === "next-classes") return <NextClassesView user={user} role={role} />;
    if (active === "invites")      return <InvitesView user={user} />;
    if (active === "settings")     return <SettingsView user={user} setActive={setActive} />;
    if (active === "kyc-coach")    return <KYCCoachView user={user} setActive={setActive} />;
    if (active === "perfil")       return <ProfileView user={user} defaultSection="bio" setActive={setActive} />;
    if (active === "perfil-me")    return <ProfileView user={user} defaultSection="me"  setActive={setActive} />;
    if (active === "estudiantes")  return <AttendanceView />;
    if (active === "my-hours")     return <MyHoursView user={user} />;
    if (active === "progress")     return <ProgressView user={user} />;
    if (active === "coaches")         return <CoachesView />;
    if (active === "students")        return <StudentsView />;
    if (active === "class-recaps")  return <MeetingRecapsView user={user} role={role} />;
    if (active === "cashier")        return <CashierView />;
    if (active === "whatsapp")      return <WhatsAppView user={user} role={role} />;
    if (active === "dinamicas")    return <DinamicasView user={user} role={role} />;
    const placeholders = {
      tps:          { title: "TPS", desc: "Training & Practices — content assigned by your coach.", icon: "practice" },
      feedbacks:    { title: "FeedbackHub", desc: "Class feedback history.", icon: "book" },
      metricas:     { title: "Metrics", desc: "Detailed academy analytics.", icon: "metrics" },
    };
    const p = placeholders[active];
    return p ? <PlaceholderView {...p} /> : <PlaceholderView title="Coming soon" desc="This section is under development." icon="home" />;
  };

  return (
    <div style={{ display: "flex", height: "100dvh", background: C.bg, color: C.text, fontFamily: "'Archivo', sans-serif", overflow: "hidden" }}>
<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0b08; }
        ::-webkit-scrollbar { display: none; }
        input { background: transparent; color: #f0ece0; font-family: 'Archivo', sans-serif; }
        input::placeholder { color: rgba(240,236,224,0.25); }
        input:focus { outline: none; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>

      <Sidebar role={role} user={user} active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} onLogout={onLogout} unreadWA={unreadWA} setUnreadWA={setUnreadWA} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0.75rem 1.25rem", paddingTop: "max(0.75rem, env(safe-area-inset-top))", gap: "0.75rem", flexShrink: 0, background: C.bg, minHeight: 57 }}>
          {isMobile && (
            <button onClick={() => setCollapsed(c => !c)}
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 6, flexShrink: 0, WebkitTapHighlightColor: "transparent", touchAction: "manipulation", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <Icon name="sidebar" size={18} color={C.text2} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "clamp(1.2rem,2.5vw,1.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, lineHeight: 1.1 }}>
              {VIEW_TITLES[active] || "Dashboard"}<DiloDot size="0.18em" />
            </h1>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "clip", padding: "1.25rem", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          <React.Suspense fallback={
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0", gap: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.text3,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          }>
            {renderView()}
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}

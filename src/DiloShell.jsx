import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── USER MENU ─────────────────────────────────────────────────
function UserMenu({ user, collapsed, isMobile, onLogout, setActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (user?.nombre || user?.email || "U")[0].toUpperCase();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, []);

  return (
    <div ref={ref} style={{ padding: "0.5rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
      {/* Popup menu */}
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "0.5rem", right: "0.5rem", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100 }}>
          {[
            { label: "My Profile", icon: "coach", action: () => { setActive("perfil"); setOpen(false); } },
            { label: "Notifications", icon: "bell", action: () => setOpen(false) },
            { label: "Sign out", icon: "logout", action: () => { setOpen(false); onLogout(); }, danger: false },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "none", background: "transparent", cursor: "pointer", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon name={item.icon} size={15} color={item.danger ? C.red : C.text2} />
              <span style={{ fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text2 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: collapsed && !isMobile ? "0.5rem" : "0.6rem 0.75rem", borderRadius: 10, border: "none", background: open ? C.surface2 : "transparent", cursor: "pointer", justifyContent: collapsed && !isMobile ? "center" : "flex-start", WebkitTapHighlightColor: "transparent", transition: "background 0.15s" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text2 }}>{initial}</span>
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p style={{ fontSize: 10, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || ""}
            </p>
          </div>
        )}
        {(!collapsed || isMobile) && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────
function Sidebar({ role, user, active, setActive, collapsed, setCollapsed, isMobile, onLogout }) {
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
        left: isMobile ? (collapsed ? "-280px" : "0") : "0",
        top: 0, bottom: 0,
        width: isMobile ? 260 : (collapsed ? 56 : 240),
        minWidth: isMobile ? 260 : (collapsed ? 56 : 240),
        background: C.bg2,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        zIndex: 50,
        flexShrink: 0,
        WebkitOverflowScrolling: "touch",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {/* Logo area */}
        <div style={{ padding: "0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: `1px solid ${C.border}`, minHeight: 57, flexShrink: 0, justifyContent: collapsed && !isMobile ? "center" : "flex-start" }}>
          {(!collapsed || isMobile) && <div style={{ flexShrink: 0, paddingLeft: "0.25rem" }}><DiloLogo height={22} /></div>}
          {(!collapsed || isMobile) && <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, padding: "2px 7px", borderRadius: 50, border: `1px solid ${C.border2}` }}>{roleLabels[role]}</span>
          </div>}
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
          {navItems.map(item => {
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
                    padding: isMobile ? "0.85rem 0.75rem" : "0.65rem 0.75rem",
                    minHeight: isMobile ? 48 : 38,
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
                    <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
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
        <UserMenu user={user} collapsed={collapsed} isMobile={isMobile} onLogout={onLogout} setActive={setActive} />
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


  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const renderView = () => {
    if (active === "dashboard") {
      if (role === "admin") return <AdminDashboard />;
      if (role === "coach") return <CoachDashboard user={user} />;
      return <StudentDashboard />;
    }
    if (active === "feedbacks")          return <FeedbacksHub setActive={setActive} role={role} />;
    if (active === "dilo-coach")         return <AgentView mode="coach" />;
    if (active === "send-feedback")      return <SendFeedbackView user={user} setActive={setActive} />;
    if (active === "class-feedback")    return <ClassFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-feedback")  return <StudentFeedbackView user={user} role={role} setActive={setActive} />;
    if (active === "student-surveys")   return <StudentSurveysView user={user} role={role} setActive={setActive} />;
    if (active === "dilo-student") return <AgentView mode="student" />;
    if (active === "calendario")   return <MasterSchedule role={role} user={user} />;
    if (active === "invites")      return <InvitesView user={user} />;
    if (active === "perfil")       return <ProfileView user={user} />;
    const placeholders = {
      tps:          { title: "TPS", desc: "Training & Practices — content assigned by your coach.", icon: "practice" },
      feedbacks:    { title: "Feedbacks", desc: "Class feedback history.", icon: "book" },
      estudiantes:  { title: "Students", desc: "Student management, profiles and assignments.", icon: "users" },
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

      <Sidebar role={role} user={user} active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} onLogout={onLogout} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ minHeight: 57, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 1rem", paddingTop: "env(safe-area-inset-top)", gap: "0.75rem", flexShrink: 0, background: C.bg }}>
          {isMobile && (
            <button onClick={() => setCollapsed(c => !c)}
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 6, flexShrink: 0, WebkitTapHighlightColor: "transparent", touchAction: "manipulation", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <Icon name="sidebar" size={18} color={C.text2} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              {NAV[role]?.flatMap(n => n.children ? [n, ...n.children] : [n]).find(n => n.id === active)?.label || "Dashboard"}
            </p>
          </div>

        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.25rem", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}

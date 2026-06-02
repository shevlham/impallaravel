import { NavLink, useNavigate } from "react-router-dom";
import { C } from "../../styles/tokens";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useState, useRef, useEffect, createContext, useContext } from "react";

// ─── Sidebar collapse context (dipakai App.jsx) ──────────────────────────────
export const SidebarCtx = createContext({ collapsed: false });
export const useSidebar = () => useContext(SidebarCtx);

// ─── Inline SVG icons ────────────────────────────────────────────────────────
const Ic = {
  grid:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  menu:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  order:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
  admin:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  settings: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  collapse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  expand:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const PATH_ICON = { "/dashboard": Ic.grid, "/": Ic.menu, "/pesanan": Ic.order, "/admin": Ic.admin };

// ─── Constants ────────────────────────────────────────────────────────────────
const W_FULL      = 220;
const W_COLLAPSED = 64;

export default function Navbar({ onCollapse }) {
  const { user, token, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const dropRef = useRef(null);

  const sidebarW = collapsed ? W_COLLAPSED : W_FULL;

  // Notify parent when collapsed changes
  useEffect(() => { onCollapse?.(collapsed); }, [collapsed, onCollapse]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const links = [
    { path: "/admin",     label: "Dashboard",   roles: ["ADMIN"] },
    { path: "/dashboard", label: "Dashboard",  roles: ["MERCHANT"] },
    { path: "/",          label: "Menu",        roles: ["PELANGGAN", "MERCHANT", "ADMIN"] },
    { path: "/pesanan",   label: "Pesanan",     roles: ["PELANGGAN", "MERCHANT", "ADMIN"] },
  ].filter(l => l.roles.includes(user?.role));

  const displayName = user?.profile?.nama || user?.profile?.nama_merchant || user?.username || "U";
  const initial     = displayName[0].toUpperCase();

  const handleLogout = async () => {
    setDropdown(false);
    await logout(token);
    toast("Sesi berakhir.");
    navigate("/login");
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════════════════ */}
      <aside
        className="hide-mobile"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: sidebarW,
          background: C.sidebarBg,
          display: "flex", flexDirection: "column",
          zIndex: 200,
          transition: "width .22s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
          borderRight: `1px solid ${C.sidebarActive}`,
        }}
      >
        {/* ── Logo + Toggle ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "18px 0" : "18px 16px",
          borderBottom: `1px solid ${C.sidebarActive}`,
          minHeight: 64, flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div 
                className="logo-glow-effect"
                style={{ width: 34, height: 34, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}
              >
                <img src="/logo.png" alt="TelEat" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, color: C.white, whiteSpace: "nowrap", letterSpacing: "0.2px" }}>
                TelEat
              </span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            style={{
              background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer",
              width: 30, height: 30, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.sidebarText, flexShrink: 0,
              transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
          >
            {collapsed ? Ic.expand : Ic.collapse}
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {links.map(l => (
            <NavLink
              key={l.path}
              to={l.path}
              title={collapsed ? l.label : undefined}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 11,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px 0" : "9px 11px",
                borderRadius: 8, textDecoration: "none",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                color: isActive ? C.sidebarTextActive : C.sidebarText,
                background: isActive ? C.sidebarActive : "transparent",
                transition: "all .15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes(C.sidebarActive)) {
                  e.currentTarget.style.background = "rgba(255,255,255,.05)";
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.background = "";
                }
              }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}>{PATH_ICON[l.path] || Ic.menu}</span>
              {!collapsed && l.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Profile ── */}
        <div style={{ borderTop: `1px solid ${C.sidebarActive}`, padding: "10px 8px", position: "relative" }} ref={dropRef}>
          <button
            onClick={() => setDropdown(d => !d)}
            title={collapsed ? displayName : undefined}
            style={{
              display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 9,
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%", padding: collapsed ? "8px 0" : "8px 10px",
              borderRadius: 8, background: dropdown ? C.sidebarActive : "transparent",
              border: "none", cursor: "pointer", transition: "background .15s",
              overflow: "hidden",
            }}
            onMouseEnter={e => { if (!dropdown) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
            onMouseLeave={e => { if (!dropdown) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: C.white, overflow: "hidden",
            }}>
              {user?.foto_profil
                ? <img src={user.foto_profil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initial}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {user?.role}
                  </div>
                </div>
                <span style={{ color: C.sidebarText, display: "flex", transform: dropdown ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  {Ic.chevron}
                </span>
              </>
            )}
          </button>

          {/* Dropdown */}
          {dropdown && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: collapsed ? "calc(100% + 6px)" : 8,
              right: collapsed ? "auto" : 8,
              width: collapsed ? 170 : "auto",
              background: C.white, borderRadius: 10,
              boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
              border: `1px solid ${C.gray100}`, overflow: "hidden", zIndex: 300,
            }}>
              <button
                onClick={() => { setDropdown(false); navigate("/setting"); }}
                style={dropItemStyle()}
                onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ display: "flex", color: C.gray500 }}>{Ic.settings}</span>
                Pengaturan
              </button>
              <div style={{ height: 1, background: C.gray100 }} />
              <button
                onClick={handleLogout}
                style={dropItemStyle(true)}
                onMouseEnter={e => e.currentTarget.style.background = C.redLight}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ display: "flex" }}>{Ic.logout}</span>
                Keluar
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM TAB
      ═══════════════════════════════════════════ */}
      <nav className="hide-desktop" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: C.white, borderTop: `1px solid ${C.gray100}`,
        display: "flex", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        boxShadow: "0 -2px 12px rgba(16,24,40,.06)",
      }}>
        {links.map(l => (
          <NavLink key={l.path} to={l.path} style={({ isActive }) => ({
            flex: 1, padding: "10px 0 8px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, textDecoration: "none",
            color: isActive ? C.red : C.gray400, transition: "color .15s",
          })}>
            {({ isActive }) => (
              <>
                <span style={{ display: "flex", color: isActive ? C.red : C.gray400 }}>
                  {PATH_ICON[l.path] || Ic.menu}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{l.label}</span>
                {isActive && <div style={{ width: 18, height: 2, background: C.red, borderRadius: 99 }} />}
              </>
            )}
          </NavLink>
        ))}
        {/* Mobile Profil Button */}
        <button 
          onClick={() => setMobileProfileOpen(true)}
          style={{
            flex: 1, padding: "10px 0 8px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, background: "transparent", border: "none",
            color: mobileProfileOpen ? C.red : C.gray400, transition: "color .15s",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: C.white, overflow: "hidden",
            marginBottom: 2,
          }}>
            {user?.foto_profil
              ? <img src={user.foto_profil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initial}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700 }}>Profil</span>
          {mobileProfileOpen && <div style={{ width: 18, height: 2, background: C.red, borderRadius: 99 }} />}
        </button>
      </nav>

      {/* Mobile Profile Bottom Sheet */}
      {mobileProfileOpen && (
        <>
          {/* Overlay background */}
          <div 
            onClick={() => setMobileProfileOpen(false)}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 10000,
            }}
          />
          {/* Bottom Sheet Card */}
          <div 
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: C.white,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "20px 20px max(24px, env(safe-area-inset-bottom)) 20px",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.12)",
              zIndex: 10001,
              animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>

            {/* Drag Handle */}
            <div style={{ width: 36, height: 5, background: C.gray200, borderRadius: 99, margin: "0 auto 20px auto" }} />

            {/* Profile Summary */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 800, color: C.white, overflow: "hidden",
                boxShadow: "0 4px 12px rgba(240,68,56,0.2)",
              }}>
                {user?.foto_profil
                  ? <img src={user.foto_profil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initial}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.gray900, textAlign: "center" }}>
                {displayName}
              </div>
              <div style={{ 
                fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", 
                letterSpacing: "1px", background: C.redLight, padding: "4px 12px", borderRadius: 99 
              }}>
                {user?.role}
              </div>
            </div>

            {/* Menu Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => { setMobileProfileOpen(false); navigate("/setting"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", width: "100%", border: "none",
                  background: C.gray50, borderRadius: 12, cursor: "pointer",
                  color: C.gray700, fontSize: 14, fontWeight: 600,
                  transition: "background .15s",
                }}
              >
                <span style={{ display: "flex", color: C.gray500 }}>{Ic.settings}</span>
                Pengaturan Profil
              </button>
              
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", width: "100%", border: "none",
                  background: C.redLight, borderRadius: 12, cursor: "pointer",
                  color: C.red, fontSize: 14, fontWeight: 600,
                  transition: "background .15s",
                }}
              >
                <span style={{ display: "flex", color: C.red }}>{Ic.logout}</span>
                Keluar Sesi
              </button>
              
              <button
                onClick={() => setMobileProfileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "14px 16px", width: "100%", border: `1px solid ${C.gray200}`,
                  background: "transparent", borderRadius: 12, cursor: "pointer",
                  color: C.gray500, fontSize: 14, fontWeight: 600, marginTop: 4,
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const dropItemStyle = (danger = false) => ({
  display: "flex", alignItems: "center", gap: 10,
  padding: "11px 14px", width: "100%", border: "none",
  background: "none", cursor: "pointer",
  color: danger ? C.red : C.gray700,
  fontSize: 13, fontWeight: 500, textAlign: "left",
  transition: "background .15s",
});
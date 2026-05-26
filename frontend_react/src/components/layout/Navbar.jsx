import { NavLink } from "react-router-dom";
import { C } from "../../styles/tokens";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { BtnGhost } from "../ui/Button";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const toast = useToast();

  const links = [
    { path: "/dashboard", icon: "📊", label: "Dashboard", roles: ["MERCHANT"] },
    { path: "/", icon: "🍜", label: "Menu", roles: ["PELANGGAN", "MERCHANT", "ADMIN"] },
    { path: "/pesanan", icon: "📋", label: "Pesanan", roles: ["PELANGGAN", "MERCHANT", "ADMIN"] },
    { path: "/admin", icon: "⚙️", label: "Admin", roles: ["ADMIN"] },
  ].filter(l => l.roles.includes(user?.role));

  const navBtnStyle = ({ isActive }) => ({
    padding: "7px 18px", borderRadius: 9, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 14, textDecoration: "none",
    background: isActive ? C.redLight : "transparent",
    color: isActive ? C.red : C.gray600,
    transition: "all .2s",
    display: "flex", alignItems: "center", gap: 6,
  });

  const mobileTabStyle = ({ isActive }) => ({
    flex: 1, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    color: isActive ? C.red : C.gray400, transition: "color .2s",
    textDecoration: "none",
  });

  return (
    <>
        {/* Desktop Navbar */}
        <header className="hide-mobile" style={{ position: "sticky", top: 0, zIndex: 200, background: C.white, borderBottom: `1px solid ${C.gray100}`, boxShadow: "0 1px 8px rgba(15,23,42,.06)" }}>
        <div style={{ margin: "0 auto", padding: "0 20px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="/logo.png" alt="logo" style={{ width: 50, height: 50, borderRadius: 13, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.2), 0 0 20px rgba(255,255,255,0.5)" }} />
            </div>
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 19, color: C.gray900 }}>TelEat</span>
            </div>

            <nav style={{ display: "flex", gap: 70 }}>
            {links.map(l => (
                <NavLink key={l.path} to={l.path} className="btn-hover" style={navBtnStyle}>
                    {l.icon} {l.label}
                </NavLink>
            ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.white, overflow: "hidden" }}>
                {user?.foto_profil ? (
                    <img src={user.foto_profil} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    (user?.profile?.nama || user?.profile?.nama_merchant || user?.username || "U")[0].toUpperCase()
                )}
                </div>
                <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gray900, lineHeight: 1.2 }}>
                    {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.blue }}>{user?.role}</div>
                </div>
            </div>
            <BtnGhost small onClick={async () => { await logout(token); toast("Sampai jumpa! 👋"); }}>Keluar</BtnGhost>
            </div>
        </div>
        </header>

        {/* Mobile Bottom Nav */}
        <nav className="hide-desktop" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: C.white, borderTop: `1px solid ${C.gray100}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom,0)", boxShadow: "0 -4px 20px rgba(15,23,42,.06)" }}>
        {links.map(t => (
            <NavLink key={t.path} to={t.path} style={mobileTabStyle}>
                {({ isActive }) => (
                    <>
                        <span style={{ fontSize: 22 }}>{t.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
                        {isActive && <div style={{ width: 16, height: 2, background: C.red, borderRadius: 99, marginTop: 1 }} />}
                    </>
                )}
            </NavLink>
        ))}
        </nav>
    </>
  );
}

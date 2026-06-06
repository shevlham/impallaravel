import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MenuPage from "./pages/MenuPage";
import OrderPage from "./pages/OrderPage";
import AdminPage from "./pages/AdminPage";
import MerchantDashboard from "./pages/MerchantDashboard";
import SettingsPage from "./pages/SettingPage";

// Helper: halaman awal berdasarkan role
function defaultPath(user) {
  if (!user) return "/login";
  if (user.role === "MERCHANT") return "/dashboard";
  if (user.role === "ADMIN")    return "/admin";
  return "/";
}

export default function App() {
  const { user } = useAuth();
  const [sidebarW, setSidebarW] = useState(220);

  const handleCollapse = useCallback((collapsed) => {
    setSidebarW(collapsed ? 64 : 220);
  }, []);

  return (
    <Routes>
      {/* ── Auth routes ── */}
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to={defaultPath(user)} />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to={defaultPath(user)} />} />
      <Route path="/setting"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* ── App routes ── */}
      <Route path="/*" element={
        <div style={{ minHeight: "100vh", background: "var(--off-white)" }}>
          {user && <Navbar onCollapse={handleCollapse} />}
          <main style={{
            minHeight: "100vh",
            paddingTop: user ? 0 : 28,
            paddingBottom: 28,
            paddingRight: 28,
            /* Desktop: shift right of sidebar */
            paddingLeft: user ? `calc(${sidebarW}px + 28px)` : 28,
            transition: "padding-left .22s cubic-bezier(.4,0,.2,1)",
            /* Mobile: no sidebar offset, handled by media query */
          }}>
            <style>{`
              @media (max-width: 768px) {
                main { padding-left: 16px !important; padding-right: 16px !important; padding-bottom: 80px !important; }
              }
            `}</style>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute><MenuPage /></ProtectedRoute>
              } />
              <Route path="/pesanan" element={
                <ProtectedRoute><OrderPage /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute roles={["MERCHANT"]}><MerchantDashboard /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={["ADMIN"]}><AdminPage /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to={defaultPath(user)} />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  );
}

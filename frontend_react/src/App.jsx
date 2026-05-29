import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ── Auth routes: fullscreen, NO navbar, NO container ── */}
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/setting" element={
        <ProtectedRoute> 
          <SettingsPage />
        </ProtectedRoute>
    } />

      {/* ── App routes: with navbar & centered container ── */}
      <Route path="/*" element={
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--off-white)" }}>
          {user && <Navbar />}
          <main style={{ flex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  );
}

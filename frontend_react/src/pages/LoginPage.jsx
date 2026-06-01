import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import AuthShell from "../components/layout/AuthShell";
import Inp, { inputStyle, labelStyle } from "../components/ui/Input";
import Divider from "../components/ui/Divider";
import GoogleSignInBtn from "../components/ui/GoogleSignInBtn";
import { BtnRed } from "../components/ui/Button";

const EyeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;

function getDefaultPath(user) {
  if (!user) return "/";
  if (user.role === "MERCHANT") return "/dashboard";
  if (user.role === "ADMIN") return "/admin";
  return "/";
}

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("POST", "/login", form);
      login(res.user, res.token);
      toast("Selamat datang kembali!");
      navigate(getDefaultPath(res.user));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: C.gray900, marginBottom: 4 }}>Masuk</h1>
      <p style={{ color: C.gray400, fontSize: 14, marginBottom: 24 }}>Senang melihatmu lagi!</p>

      <form onSubmit={submit}>
        <Inp label="Username" placeholder="Masukkan username"
          value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
              style={{ ...inputStyle, paddingRight: 42 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: C.gray400,
              display: "flex", alignItems: "center", padding: 0,
            }}>{showPw ? <EyeOffIcon /> : <EyeIcon />}</button>
          </div>
        </div>

        <BtnRed full disabled={loading} style={{ marginTop: 24 }}>
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}><circle cx="12" cy="12" r="10" strokeDasharray="30 30" /></svg>
              Masuk
            </span>
          ) : "Masuk"}
        </BtnRed>

        <Divider />
        <GoogleSignInBtn />
      </form>

      <p style={{ textAlign: "center", marginTop: 24, color: C.gray400, fontSize: 14 }}>
        Belum punya akun?{" "}
        <span style={{ color: C.blue, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/register")}>Daftar sekarang</span>
      </p>
    </AuthShell>
  );
}

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

export default function RegisterPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: "", username: "", password: "", role: "PELANGGAN", foto_profil: null });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();

    // Validasi Nama
    if (!form.nama || form.nama.trim().length < 3) {
      toast("Nama minimal 3 karakter", "error");
      return;
    }
    if (form.nama.length > 100) {
      toast("Nama maksimal 100 karakter", "error");
      return;
    }

    // Validasi Username
    if (!form.username || form.username.trim().length < 3) {
      toast("Username minimal 3 karakter", "error");
      return;
    }
    if (form.username.includes(' ')) {
      toast("Username tidak boleh mengandung spasi", "error");
      return;
    }

    // Validasi Password
    if (!form.password) {
      toast("Password wajib diisi", "error");
      return;
    }
    if (form.password.length < 6) {
      toast("Password minimal 6 karakter", "error");
      return;
    }
    if (form.password.length > 255) {
      toast("Password maksimal 255 karakter", "error");
      return;
    }

    // Validasi Role
    if (!form.role) {
      toast("Pilih role sebagai Pelanggan atau Merchant", "error");
      return;
    }

    // Validasi Foto Profil (jika ada)
    if (form.foto_profil) {
      if (form.foto_profil.size > 2 * 1024 * 1024) {
        toast("Ukuran gambar maksimal 2MB", "error");
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(form.foto_profil.type)) {
        toast("Format harus JPG, PNG, atau GIF", "error");
        return;
      }
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("nama", form.nama);
      fd.append("username", form.username);
      fd.append("password", form.password);
      fd.append("role", form.role);
      if (form.foto_profil) {
        fd.append("foto_profil", form.foto_profil);
      }

      const res = await apiFetch("POST", "/register", fd);

      login(res.user, res.token);
      toast("Akun berhasil dibuat! 🎉");
      navigate("/");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: C.gray900, marginBottom: 4 }}>Daftar</h1>
      <p style={{ color: C.gray400, fontSize: 14, marginBottom: 24 }}>Buat akun baru gratis!</p>

      <form onSubmit={submit}>
        <Inp label="Nama Lengkap / Nama Warung" placeholder="Nama kamu"
          value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
        <Inp label="Username" placeholder="Username kamu"
          value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        <Inp label="Password" type="password" placeholder="Min. 6 karakter"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Foto Profil / Logo Toko</label>
          <input type="file" accept="image/*" onChange={e => setForm({ ...form, foto_profil: e.target.files[0] })} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Daftar sebagai</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { val: "PELANGGAN", icon: "🛍️", label: "Pelanggan", desc: "Pesan makanan" },
              { val: "MERCHANT", icon: "🏪", label: "Merchant", desc: "Jual makanan" },
            ].map(r => (
              <button type="button" key={r.val} onClick={() => setForm({ ...form, role: r.val })} style={{
                padding: "14px 10px", border: `2px solid ${form.role === r.val ? C.blue : C.gray200}`,
                borderRadius: 12, background: form.role === r.val ? C.blueLight : C.white,
                cursor: "pointer", textAlign: "center", transition: "all .2s",
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: form.role === r.val ? C.blue : C.gray900 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <BtnRed full disabled={loading} style={{ marginTop: 24 }}>
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}><circle cx="12" cy="12" r="10" strokeDasharray="30 30" /></svg>
              Mendaftar
            </span>
          ) : "Buat Akun"}
        </BtnRed>

        <Divider />
        <GoogleSignInBtn />
      </form>

      <p style={{ textAlign: "center", marginTop: 24, color: C.gray400, fontSize: 14 }}>
        Sudah punya akun?{" "}
        <span style={{ color: C.blue, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>Masuk</span>
      </p>
    </AuthShell>
  );
}

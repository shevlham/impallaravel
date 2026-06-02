import { useState, useEffect, useCallback } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import Inp, { inputStyle, labelStyle } from "../components/ui/Input";
import { BtnRed, BtnBlue, BtnGhost } from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";

export default function SettingPage() {
  const { user, token, login } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const isMerchant = role === "MERCHANT";
  const isPelanggan = role === "PELANGGAN";
  
  const [profileLoading, setProfileLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // ✅ MODE EDIT
  const [updating, setUpdating] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  
  const [form, setForm] = useState({
    username: "",
    email: "", 
    foto_profil: null,
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

const loadProfile = useCallback(async () => {
  setProfileLoading(true);
  try {
    const r = await apiFetch("GET", "/me", null, token);
    const userData = r.data;
    setForm({
      username: userData?.username || "",
      email: userData?.email || "",   
      foto_profil: null,
    });
  } catch (e) {
    toast(e.message, "error");
  } finally {
    setProfileLoading(false);
  }
}, [token, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (profileLoading || !user) {
    return <Spinner />;
  }

  // UPDATE EMAIL
const updateEmail = async () => {
  if (!form.email || !form.email.includes("@")) {
    toast("Email tidak valid", "error");
    return;
  }
  
  setUpdating(true);
  try {
    const payload = { email: form.email };
    const r = await apiFetch("PUT", "/profile", payload, token);
    
    toast("Email berhasil diperbarui!", "success");
    
    if (r.data?.user) {
      login(r.data.user, token);
    }
    
    loadProfile();
    setEditMode(false);
    window.location.reload();
    
  } catch (e) {
    toast(e.message, "error");
  } finally {
    setUpdating(false);
  }
};

  // UPDATE USERNAME
  const updateUsername = async () => {
    if (!form.username || form.username.trim().length < 3) {
      toast("Username minimal 3 karakter", "error");
      return;
    }
    if (form.username.includes(" ")) {
      toast("Username tidak boleh mengandung spasi", "error");
      return;
    }
    
  setUpdating(true);
  try {
    const payload = { username: form.username };
    const r = await apiFetch("PUT", "/profile", payload, token);
    
    toast("Username berhasil diperbarui!", "success");
    
    // ✅ UPDATE DATA DI CONTEXT
    if (r.data?.user) {
      login(r.data.user, token);  // Update user context
    }
    
    // ✅ REFRESH HALAMAN (opsional, untuk reload navbar)
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (e) {
    toast(e.message, "error");
  } finally {
    setUpdating(false);
  }
};

  // UPDATE FOTO PROFIL
  const updatePhoto = async () => {
    if (!previewFoto) {
      toast("Pilih foto terlebih dahulu", "error");
      return;
    }
    
    if (previewFoto.size > 2 * 1024 * 1024) {
      toast("Ukuran gambar maksimal 2MB", "error");
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(previewFoto.type)) {
      toast("Format harus JPG, JPEG, atau PNG", "error");
      return;
    }
    
    setUpdating(true);
    try {
      const fd = new FormData();
      fd.append("foto_profil", previewFoto);
      
      const r = await apiFetch("POST", "/upload-photo", fd, token);
      
      toast("Foto profil berhasil diperbarui!", "success");
      
      if (r.data?.user) {
        login(r.data.user, token);
      }
      setPreviewFoto(null);
      loadProfile();
      setEditMode(false); // ✅ TUTUP MODE EDIT
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setUpdating(false);
    }
  };

    // UPDATE PROFILE (EMAIL + USERNAME)
    const updateProfile = async () => {
      let hasChange = false;
      const payload = {};
      
      // Cek username (opsional)
      if (form.username && form.username !== user?.username) {
        if (form.username.trim().length < 3) {
          toast("Username minimal 3 karakter", "error");
          return;
        }
        if (form.username.includes(" ")) {
          toast("Username tidak boleh mengandung spasi", "error");
          return;
        }
        payload.username = form.username;
        hasChange = true;
      }
      
      // Cek email
      if (form.email && form.email !== user?.email) {
        if (!form.email.includes("@")) {
          toast("Email tidak valid", "error");
          return;
        }
        payload.email = form.email;
        hasChange = true;
      }
      
      if (!hasChange) {
        toast("Tidak ada perubahan", "info");
        return;
      }
      
      setUpdating(true);
      try {
        console.log("📡 Mengirim ke /profile:", payload);
        
        const response = await fetch("http://localhost:8000/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });
        
        const text = await response.text();
        console.log("📡 Response:", text);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server error: " + text.substring(0, 100));
        }
        
        if (!response.ok) {
          throw new Error(data.message || "Update gagal");
        }
        
        toast("Profil berhasil diperbarui!", "success");
        
        if (data.data?.user) {
          login(data.data.user, token);
        }
        
        loadProfile();
        setEditMode(false);
        
      } catch (e) {
        console.error("Error:", e);
        toast(e.message, "error");
      } finally {
        setUpdating(false);
      }
    };

  // UPDATE PASSWORD
  const updatePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.current_password) {
      toast("Password saat ini wajib diisi", "error");
      return;
    }
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      toast("Password baru minimal 6 karakter", "error");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toast("Konfirmasi password baru tidak cocok", "error");
      return;
    }
    
    setUpdatingPassword(true);
    try {
      await apiFetch("PUT", "/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      }, token);
      
      toast("Password berhasil diubah!", "success");
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setShowPasswordForm(false);
      setEditMode(false); // ✅ TUTUP MODE EDIT
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // BATAL EDIT
  const cancelEdit = () => {
    setEditMode(false);
    setPreviewFoto(null);
    setShowPasswordForm(false);
    setForm({ ...form, username: user?.username || "" });
    loadProfile();
  };

  return (
    <>
      <Navbar />
      <div className="setting-container">
        <div style={{
          maxWidth: 550,
          width: "100%",
          background: C.white,
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          overflow: "hidden"
        }}>
          
          {/* HEADER */}
          <div style={{
            padding: "28px 32px",
            borderBottom: `1px solid ${C.gray100}`,
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            color: C.white,
            textAlign: "center"
          }}>
            <div style={{ 
              width: 80, height: 80, 
              background: C.white, 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 16px",
              overflow: "hidden",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
            }}>
              {user?.foto_profil ? (
                <img src={user.foto_profil} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 40, fontWeight: 600, color: C.red }}>
                  {isMerchant ? "🏪" : isPelanggan ? "👤" : "👑"}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
              @{user?.username} • {isMerchant ? "Merchant" : isPelanggan ? "Pelanggan" : "Admin"}
            </p>
          </div>

          {/* BODY */}
          <div style={{ padding: "28px 32px" }}>
            
            {/* TAMPILAN PROFIL (MODE VIEW) */}
            {!editMode && (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  background: C.gray50,
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: 20
                }}>
                  {/* NAMA TOKO */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: C.gray500 }}>Nama Toko</span>
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.gray900 }}>
                      {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
                    </div>
                  </div>
                  
                  {/* USERNAME */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: C.gray500 }}>Username</span>
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.gray900 }}>
                      @{user?.username}
                    </div>
                  </div>
                  
                  {/* EMAIL */}
                  <div>
                    <span style={{ fontSize: 13, color: C.gray500 }}>Email</span>
                    <div style={{ fontSize: 14, color: C.gray700 }}>
                      {user?.email || "Belum diatur"}
                    </div>
                  </div>
                </div>
                
                <BtnBlue 
                  onClick={() => setEditMode(true)}
                  style={{ width: "100%", padding: "14px", borderRadius: 12 }}
                >
                  Edit Profil
                </BtnBlue>
              </div>
            )}

            {/* FORM EDIT (MODE EDIT) */}
            {editMode && (
              <div>
                {/* FOTO PROFIL */}
                <div style={{ marginBottom: 24, textAlign: "center" }}>
                  <div style={{ 
                    width: 100, height: 100, 
                    background: C.gray100, 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    overflow: "hidden"
                  }}>
                    {previewFoto ? (
                      <img src={URL.createObjectURL(previewFoto)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : user?.foto_profil ? (
                      <img src={user.foto_profil} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 40 }}>{isMerchant ? "🏪" : "👤"}</span>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    id="upload-foto"
                    onChange={e => setPreviewFoto(e.target.files[0])}
                  />
                  <label 
                    htmlFor="upload-foto"
                    style={{ 
                      cursor: "pointer", 
                      color: C.blue,
                      fontSize: 13,
                      textDecoration: "underline"
                    }}
                  >
                    Ganti Foto
                  </label>
                  {previewFoto && (
                    <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>
                      ✓ Foto siap diupload
                    </div>
                  )}
                </div>

                {/* USERNAME (OPSIONAL) */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 8 }}>
                    Username Baru <span style={{ fontSize: 11, color: C.gray400 }}>(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="Kosongkan jika tidak ingin mengganti username"
                    style={{
                      ...inputStyle,
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 12,
                      fontSize: 14
                    }}
                  />
                  <p style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>
                    Biarkan kosong jika tidak ingin mengganti username
                  </p>
                </div>
                  {/* EMAIL */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 8 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Masukkan email"
                    style={{
                      ...inputStyle,
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 12,
                      fontSize: 14
                    }}
                  />
                </div>

                {/* DIVIDER */}
                <div style={{
                  height: 1,
                  background: C.gray200,
                  margin: "20px 0"
                }} />

                {/* GANTI PASSWORD */}
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: showPasswordForm ? C.redLight : C.gray50,
                    border: `1px solid ${showPasswordForm ? C.red : C.gray200}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    color: showPasswordForm ? C.red : C.gray700,
                    marginBottom: showPasswordForm ? 16 : 0
                  }}
                >
                  <span>Ganti Password</span>
                  <span>{showPasswordForm ? "▲" : "▼"}</span>
                </button>

                {showPasswordForm && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        placeholder="Masukkan password lama"
                        style={{
                          ...inputStyle,
                          width: "100%",
                          padding: "10px 12px",
                          border: `1px solid ${C.gray200}`,
                          borderRadius: 10,
                          fontSize: 14
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        style={{
                          ...inputStyle,
                          width: "100%",
                          padding: "10px 12px",
                          border: `1px solid ${C.gray200}`,
                          borderRadius: 10,
                          fontSize: 14
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordForm.new_password_confirmation}
                        onChange={e => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                        placeholder="Ulangi password baru"
                        style={{
                          ...inputStyle,
                          width: "100%",
                          padding: "10px 12px",
                          border: `1px solid ${C.gray200}`,
                          borderRadius: 10,
                          fontSize: 14
                        }}
                      />
                    </div>

                    <BtnBlue 
                      onClick={updatePassword} 
                      disabled={updatingPassword} 
                      style={{ width: "100%", padding: "10px", borderRadius: 10 }}
                    >
                      {updatingPassword ? "Memproses..." : "Ganti Password"}
                    </BtnBlue>
                  </div>
                )}

                {/* BUTTON ACTION */}
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <BtnRed 
                    onClick={updateProfile}   
                    disabled={updating} 
                    style={{ flex: 1, padding: "12px", borderRadius: 10 }}
                  >
                    {updating ? "Menyimpan..." : "Simpan"}
                  </BtnRed>
                  <BtnGhost 
                    onClick={cancelEdit} 
                    style={{ flex: 1, padding: "12px", borderRadius: 10 }}
                  >
                    Batal
                  </BtnGhost>
                </div>

                {previewFoto && (
                  <div style={{ marginTop: 12 }}>
                    <BtnBlue 
                      onClick={updatePhoto} 
                      disabled={updating} 
                      style={{ width: "100%", padding: "10px", borderRadius: 10 }}
                    >
                      Upload Foto Sekarang
                    </BtnBlue>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
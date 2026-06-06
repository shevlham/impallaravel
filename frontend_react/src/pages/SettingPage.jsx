import { useState, useEffect, useCallback } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import { inputStyle, labelStyle } from "../components/ui/Input";
import { BtnRed, BtnBlue, BtnGhost } from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  X, 
  CheckCircle,
  Store,
  Crown,
  UserCircle,
  Key,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff
} from "lucide-react";

export default function SettingPage() {
  const { user, token, login } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const isMerchant = role === "MERCHANT";
  const isPelanggan = role === "PELANGGAN";

  const [profileLoading, setProfileLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

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
      const userData = r;
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

  const triggerSuccessAnimation = () => {
    setSuccessAnimation(true);
    setTimeout(() => setSuccessAnimation(false), 2000);
  };

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
      triggerSuccessAnimation();

      if (r.user) {
        login(r.user, token);
      }
      setPreviewFoto(null);
      loadProfile();
      setEditMode(false);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const updateProfile = async () => {
    let hasChange = false;
    const payload = {};

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
      const r = await apiFetch("PUT", "/profile", payload, token);
      toast("Profil berhasil diperbarui!", "success");
      triggerSuccessAnimation();

      if (r.user) {
        login(r.user, token);
      }

      loadProfile();
      setEditMode(false);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setUpdating(false);
    }
  };

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
      triggerSuccessAnimation();
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setShowPasswordForm(false);
      setEditMode(false);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setPreviewFoto(null);
    setShowPasswordForm(false);
    setForm({ ...form, username: user?.username || "" });
    loadProfile();
  };

  const getRoleIcon = () => {
    if (isMerchant) return <Store size={32} />;
    if (isPelanggan) return <UserCircle size={32} />;
    return <Crown size={32} />;
  };

  const getRoleName = () => {
    if (isMerchant) return "Merchant";
    if (isPelanggan) return "Pelanggan";
    return "Admin";
  };

  if (profileLoading || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="setting-container" style={{
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: `linear-gradient(135deg, ${C.gray50} 0%, ${C.white} 100%)`
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: 550,
            width: "100%",
            background: C.white,
            borderRadius: 24,
            boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.05)",
            overflow: "hidden"
          }}
        >
          {/* HEADER */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: "32px",
              background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)`,
              color: C.white,
              textAlign: "center",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 150,
              height: 150,
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%"
            }} />
            <div style={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 120,
              height: 120,
              background: "rgba(255,255,255,0.05)",
              borderRadius: "50%"
            }} />
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: 100,
                height: 100,
                background: C.white,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                overflow: "hidden",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                position: "relative",
                cursor: "pointer"
              }}
              onClick={() => document.getElementById("upload-foto-header")?.click()}
            >
              {user?.foto_profil ? (
                <img src={user.foto_profil} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 48, fontWeight: 600, color: C.red }}>
                  {getRoleIcon()}
                </span>
              )}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0,0,0,0.5)",
                padding: "4px",
                fontSize: 12,
                textAlign: "center"
              }}>
                <Camera size={16} />
              </div>
            </motion.div>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
              @{user?.username} • {getRoleName()}
            </p>
          </motion.div>

          {/* BODY */}
          <div style={{ padding: "32px" }}>
            <AnimatePresence mode="wait">
              {!editMode ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{
                    background: C.gray50,
                    borderRadius: 16,
                    padding: "24px",
                    marginBottom: 24
                  }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <User size={18} color={C.gray500} />
                        <span style={{ fontSize: 13, color: C.gray500, fontWeight: 500 }}>Nama</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.gray900, marginLeft: 30 }}>
                        {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <User size={18} color={C.gray500} />
                        <span style={{ fontSize: 13, color: C.gray500, fontWeight: 500 }}>Username</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.gray900, marginLeft: 30 }}>
                        @{user?.username}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <Mail size={18} color={C.gray500} />
                        <span style={{ fontSize: 13, color: C.gray500, fontWeight: 500 }}>Email</span>
                      </div>
                      <div style={{ fontSize: 14, color: C.gray700, marginLeft: 30 }}>
                        {user?.email || "Belum diatur"}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditMode(true)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: C.blue,
                      color: C.white,
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Edit Profil
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* FOTO PROFIL */}
                  <div style={{ marginBottom: 28, textAlign: "center" }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      style={{
                        width: 120,
                        height: 120,
                        background: C.gray100,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative"
                      }}
                      onClick={() => document.getElementById("upload-foto").click()}
                    >
                      {previewFoto ? (
                        <img src={URL.createObjectURL(previewFoto)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : user?.foto_profil ? (
                        <img src={user.foto_profil} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <ImageIcon size={48} color={C.gray400} />
                      )}
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.6)",
                        padding: "8px",
                        fontSize: 11,
                        textAlign: "center",
                        color: C.white
                      }}>
                        <Upload size={14} style={{ marginRight: 4 }} />
                        Ubah
                      </div>
                    </motion.div>

                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      id="upload-foto"
                      onChange={e => setPreviewFoto(e.target.files[0])}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      id="upload-foto-header"
                      onChange={e => setPreviewFoto(e.target.files[0])}
                    />
                    
                    {previewFoto && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: 12, color: C.green, marginTop: 8 }}
                      >
                        <CheckCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                        Foto siap diupload
                      </motion.div>
                    )}
                  </div>

                  {/* USERNAME */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 8 }}>
                      <User size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
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
                        fontSize: 14,
                        transition: "all 0.2s"
                      }}
                      onFocus={e => e.target.style.borderColor = C.blue}
                      onBlur={e => e.target.style.borderColor = C.gray200}
                    />
                  </div>

                  {/* EMAIL */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 8 }}>
                      <Mail size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
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
                        fontSize: 14,
                        transition: "all 0.2s"
                      }}
                      onFocus={e => e.target.style.borderColor = C.blue}
                      onBlur={e => e.target.style.borderColor = C.gray200}
                    />
                  </div>

                  {/* GANTI PASSWORD */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: showPasswordForm ? C.redLight : C.gray50,
                      border: `1px solid ${showPasswordForm ? C.red : C.gray200}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontWeight: 600,
                      color: showPasswordForm ? C.red : C.gray700,
                      marginBottom: showPasswordForm ? 20 : 0,
                      transition: "all 0.2s"
                    }}
                  >
                    <span><Lock size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />Ganti Password</span>
                    <motion.span animate={{ rotate: showPasswordForm ? 180 : 0 }}>▼</motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {showPasswordForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden", marginBottom: 20 }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 6 }}>
                            Password Saat Ini
                          </label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordForm.current_password}
                              onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                              placeholder="Masukkan password lama"
                              style={{
                                ...inputStyle,
                                width: "100%",
                                padding: "12px 40px 12px 16px",
                                border: `1px solid ${C.gray200}`,
                                borderRadius: 10,
                                fontSize: 14
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0
                              }}
                            >
                              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 6 }}>
                            Password Baru
                          </label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={passwordForm.new_password}
                              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                              placeholder="Minimal 6 karakter"
                              style={{
                                ...inputStyle,
                                width: "100%",
                                padding: "12px 40px 12px 16px",
                                border: `1px solid ${C.gray200}`,
                                borderRadius: 10,
                                fontSize: 14
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0
                              }}
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <label style={{ ...labelStyle, fontWeight: 600, display: "block", marginBottom: 6 }}>
                            Konfirmasi Password Baru
                          </label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordForm.new_password_confirmation}
                              onChange={e => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                              placeholder="Ulangi password baru"
                              style={{
                                ...inputStyle,
                                width: "100%",
                                padding: "12px 40px 12px 16px",
                                border: `1px solid ${C.gray200}`,
                                borderRadius: 10,
                                fontSize: 14
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0
                              }}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={updatePassword}
                          disabled={updatingPassword}
                          style={{
                            width: "100%",
                            padding: "12px",
                            background: C.blue,
                            color: C.white,
                            border: "none",
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: updatingPassword ? "not-allowed" : "pointer",
                            opacity: updatingPassword ? 0.7 : 1
                          }}
                        >
                          {updatingPassword ? (
                            <Spinner size="small" />
                          ) : (
                            <>
                              Ganti Password
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* BUTTON ACTION */}
                  <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={updateProfile}
                      disabled={updating}
                      style={{
                        flex: 1,
                        padding: "14px",
                        background: C.blue,
                        color: C.white,
                        border: "none",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: updating ? "not-allowed" : "pointer",
                        opacity: updating ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                      }}
                    >
                      {updating ? <Spinner size="small" /> : <Save size={18} />}
                      {updating ? "Menyimpan..." : "Simpan Perubahan"}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={cancelEdit}
                      style={{
                        flex: 1,
                        padding: "14px",
                        background: C.white,
                        color: C.gray700,
                        border: `1px solid ${C.gray300}`,
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                      }}
                    >
                      <X size={18} />
                      Batal
                    </motion.button>
                  </div>

                  {previewFoto && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 16 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={updatePhoto}
                        disabled={updating}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
                          color: C.white,
                          border: "none",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: updating ? "not-allowed" : "pointer",
                          opacity: updating ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8
                        }}
                      >
                        <Upload size={18} />
                        Upload Foto Sekarang
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* SUCCESS ANIMATION */}
      <AnimatePresence>
        {successAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            style={{
              position: "fixed",
              bottom: 30,
              right: 30,
              background: C.green,
              color: C.white,
              padding: "12px 20px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000
            }}
          >
            <CheckCircle size={20} />
            <span>Berhasil disimpan!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .setting-container {
          width: 100%;
        }

        @media (max-width: 640px) {
          .setting-container > div > div {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
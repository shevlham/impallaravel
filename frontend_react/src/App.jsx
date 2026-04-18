// ╔══════════════════════════════════════════════════════╗
// ║  TelEat — Frontend App.jsx                           ║
// ║  Tema: Merah · Putih · Biru                          ║
// ║  Stack: React + Vite                                 ║
// ║  Fitur: Auth (email + Google OAuth UI), Menu,        ║
// ║          Pesanan, Admin, Responsive Mobile+Web       ║
// ╚══════════════════════════════════════════════════════╝

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";

// ─── ENV CONFIG ───────────────────────────────────────────────────────────────
const API_URL    = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const GOOGLE_CID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  red      : "#DC2626",
  redDark  : "#B91C1C",
  redLight : "#FEE2E2",
  blue     : "#1D4ED8",
  blueDark : "#1E3A8A",
  blueMid  : "#3B82F6",
  blueLight: "#DBEAFE",
  white    : "#FFFFFF",
  offWhite : "#F8FAFC",
  gray50   : "#F1F5F9",
  gray100  : "#E2E8F0",
  gray200  : "#CBD5E1",
  gray400  : "#94A3B8",
  gray600  : "#475569",
  gray800  : "#1E293B",
  gray900  : "#0F172A",
  success  : "#16A34A",
  warn     : "#D97706",
  danger   : "#DC2626",
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: ${C.offWhite}; color: ${C.gray900}; }
  input, select, textarea, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: ${C.gray100}; }
  ::-webkit-scrollbar-thumb { background: ${C.gray200}; border-radius: 99px; }
  input:focus, select:focus { outline: 2px solid ${C.blue}; outline-offset: 1px; }

  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes fadeUp    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideRight{ from { opacity:0; transform:translateX(110%); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulseRed  { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)} 70%{box-shadow:0 0 0 10px rgba(220,38,38,0)} }

  .page-enter { animation: fadeUp .32s ease both; }
  .card-hover { transition: transform .18s, box-shadow .18s; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,.12); }
  .btn-hover  { transition: filter .15s, transform .12s; }
  .btn-hover:hover  { filter: brightness(1.07); }
  .btn-hover:active { transform: scale(.97); }

  @media (max-width: 767px)  { .hide-mobile  { display: none !important; } }
  @media (min-width: 768px)  { .hide-desktop { display: none !important; } }
`;

// ─── CONTEXTS ─────────────────────────────────────────────────────────────────
const AuthCtx  = createContext(null);
const ToastCtx = createContext(null);
const useAuth  = () => useContext(AuthCtx);
const useToast = () => useContext(ToastCtx);

// ─── API HELPER ───────────────────────────────────────────────────────────────
async function apiFetch(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_URL + path, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
  return data;
}

// ─── GOOGLE GSI LOADER ────────────────────────────────────────────────────────
function loadGSI() {
  return new Promise(resolve => {
    if (window.google?.accounts) { resolve(); return; }
    const existing = document.getElementById("gsi-script");
    if (existing) { existing.addEventListener("load", resolve); return; }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true; s.onload = resolve;
    document.head.appendChild(s);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════════════════════════════════

function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setList(p => [...p, { id, msg, type }]);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3800);
  }, []);

  const bgMap   = { success: C.success, error: C.danger, warn: C.warn };
  const iconMap = { success: "✓", error: "✕", warn: "⚠" };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:320 }}>
        {list.map(t => (
          <div key={t.id} style={{
            display:"flex", alignItems:"center", gap:10,
            background: bgMap[t.type] || C.success,
            color: C.white, padding:"12px 18px", borderRadius:12,
            fontSize:14, fontWeight:600,
            boxShadow:`0 8px 24px ${(bgMap[t.type]||C.success)}55`,
            animation:"slideRight .3s ease",
          }}>
            <span style={{ fontSize:16, fontWeight:800 }}>{iconMap[t.type]}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem("te_user")||"null"); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("te_token") || "");

  const login = useCallback((u, t) => {
    setUser(u); setToken(t);
    localStorage.setItem("te_user",  JSON.stringify(u));
    localStorage.setItem("te_token", t);
  }, []);

  const logout = useCallback(async (tok) => {
    try { await apiFetch("POST", "/logout", null, tok || token); } catch {}
    setUser(null); setToken("");
    localStorage.removeItem("te_user");
    localStorage.removeItem("te_token");
  }, [token]);

  return <AuthCtx.Provider value={{ user, token, login, logout }}>{children}</AuthCtx.Provider>;
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════════

function Spinner({ size = 32 }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:48 }}>
      <div style={{ width:size, height:size, border:`3px solid ${C.gray100}`, borderTopColor:C.red, borderRadius:"50%", animation:"spin .65s linear infinite" }} />
    </div>
  );
}

function Empty({ icon = "🍽️", title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"64px 24px", color:C.gray400 }}>
      <div style={{ fontSize:52, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:700, color:C.gray600, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:13 }}>{sub}</div>}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:16 }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:C.white, borderRadius:20, padding:"28px 28px 24px", width:"100%", maxWidth:440, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(15,23,42,.24)", animation:"fadeUp .25s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:C.gray900 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:C.gray400, lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── FORM ATOMS ───────────────────────────────────────────────────────
const inputStyle = {
  width:"100%", padding:"11px 14px", borderRadius:10,
  border:`1.5px solid ${C.gray200}`, background:C.white,
  fontSize:14, color:C.gray900, transition:"border .2s",
};
const labelStyle = {
  display:"block", fontSize:12, fontWeight:700, color:C.gray600,
  marginBottom:6, textTransform:"uppercase", letterSpacing:.5,
};

function Inp({ label, style: extraStyle, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input style={{ ...inputStyle, ...extraStyle }} {...props} />
    </div>
  );
}

function Sel({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <select style={inputStyle} {...props}>{children}</select>
    </div>
  );
}

// ─── BUTTONS ─────────────────────────────────────────────────────────
function BtnRed({ children, full, small, style: s, ...p }) {
  return (
    <button className="btn-hover" style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
      width:full?"100%":"auto", padding:small?"8px 16px":"12px 20px",
      background:`linear-gradient(135deg, ${C.red}, ${C.redDark})`,
      color:C.white, border:"none", borderRadius:10,
      fontWeight:700, fontSize:small?13:15, cursor:"pointer",
      boxShadow:`0 4px 12px ${C.red}44`,
      ...s,
    }} {...p}>{children}</button>
  );
}

function BtnBlue({ children, full, small, ...p }) {
  return (
    <button className="btn-hover" style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
      width:full?"100%":"auto", padding:small?"8px 16px":"12px 20px",
      background:`linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
      color:C.white, border:"none", borderRadius:10,
      fontWeight:700, fontSize:small?13:15, cursor:"pointer",
      boxShadow:`0 4px 12px ${C.blue}44`,
    }} {...p}>{children}</button>
  );
}

function BtnGhost({ children, full, small, danger, style: s, ...p }) {
  return (
    <button className="btn-hover" style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
      width:full?"100%":"auto", padding:small?"7px 14px":"11px 18px",
      background:"transparent",
      color: danger ? C.red : C.gray600,
      border:`1.5px solid ${danger ? C.redLight : C.gray200}`,
      borderRadius:10, fontWeight:600, fontSize:small?13:14, cursor:"pointer",
      ...s,
    }} {...p}>{children}</button>
  );
}

// ─── GOOGLE SIGN-IN BUTTON ────────────────────────────────────────────
function GoogleSignInBtn() {
  const { login } = useAuth();
  const toast = useToast();
  const ref   = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await loadGSI();
      if (!window.google || !GOOGLE_CID) { setLoaded(true); return; }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CID,
        callback: async ({ credential }) => {
          try {
            const res = await apiFetch("POST", "/auth/google/callback", { id_token: credential });
            login(res.user, res.token);
            toast("Berhasil masuk dengan Google! 🎉");
          } catch (err) { toast(err.message, "error"); }
        },
        ux_mode: "popup",
      });
      if (ref.current) {
        window.google.accounts.id.renderButton(ref.current, {
          theme:"outline", size:"large", width:360, shape:"rectangular",
          text:"continue_with", logo_alignment:"left",
        });
      }
      setLoaded(true);
    })();
  }, []);

  if (!GOOGLE_CID) {
    return (
      <button className="btn-hover" style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        padding:"11px 16px", border:`1.5px solid ${C.gray200}`, borderRadius:10,
        background:C.white, cursor:"pointer", fontWeight:600, fontSize:14, color:C.gray800,
        boxShadow:`0 2px 6px rgba(15,23,42,.06)`,
      }}
        onClick={() => toast("Tambahkan VITE_GOOGLE_CLIENT_ID di file .env!", "warn")}
      >
        <GoogleSVG />
        Lanjutkan dengan Google
      </button>
    );
  }

  return (
    <div style={{ width:"100%", minHeight:44 }}>
      <div ref={ref} style={{ width:"100%" }} />
      {!loaded && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:C.gray400, fontSize:13, height:44 }}>
          <Spinner size={16} /> Memuat Google…
        </div>
      )}
    </div>
  );
}

function GoogleSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.3 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.3 29 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c4.9 0 9.3-1.9 12.7-4.9l-5.9-5c-1.8 1.3-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.4l-6.5 5C9.5 41 16.2 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l5.9 5c-.4.4 6.3-4.6 6.3-13.5 0-1.3-.1-2.6-.4-3.8z"/>
    </svg>
  );
}

function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0", color:C.gray400, fontSize:13 }}>
      <div style={{ flex:1, height:1, background:C.gray100 }} />
      <span style={{ fontWeight:600 }}>atau</span>
      <div style={{ flex:1, height:1, background:C.gray100 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH SHELL (two-column layout)
// ═══════════════════════════════════════════════════════════════════════

function AuthShell({ children }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex" }}>

      {/* LEFT: hero panel */}
      <div className="hide-mobile" style={{
        width:"42%", minHeight:"100vh",
        background:`linear-gradient(160deg, ${C.blueDark} 0%, ${C.blue} 55%, ${C.blueMid} 100%)`,
        padding:"48px 44px", display:"flex", flexDirection:"column", justifyContent:"space-between",
        position:"relative", overflow:"hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", border:`60px solid rgba(255,255,255,.05)`, top:-60, right:-80 }} />
        <div style={{ position:"absolute", width:220, height:220, borderRadius:"50%", border:`40px solid rgba(220,38,38,.15)`, bottom:80, left:-60 }} />

        <div style={{ display:"flex", alignItems:"center", gap:10, position:"relative" }}>
          <div style={{
            width:44,
            height:44,
            borderRadius:13,
            overflow:"hidden",   // biar rapi
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
          }}>
            <img 
              src="/logo.png" 
              alt="logo" 
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          </div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:22, color:C.white }}>TelEat</span>
        </div>

        <div style={{ position:"relative" }}>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:36, color:C.white, lineHeight:1.25, marginBottom:16 }}>
            Pesan makanan<br />favoritmu,<br /><span style={{ color:`${C.redLight}` }}>kapan saja.</span>
          </h2>
          <p style={{ color:"rgba(255,255,255,.65)", fontSize:15, lineHeight:1.7, marginBottom:32 }}>
            Beli makan di kantin tanpa ngantri? — semua ada di TelEat.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { icon:"🚀", text:"Pesan cepat & mudah" },
              { icon:"🏪", text:"Tanpa antre panjang" },
              { icon:"💳", text:"QRIS, Cash, Transfer" },
            ].map(f => (
              <div key={f.text} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, background:"rgba(255,255,255,.12)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{f.icon}</div>
                <span style={{ color:"rgba(255,255,255,.8)", fontSize:14, fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color:"rgba(255,255,255,.3)", fontSize:12, position:"relative" }}>© 2025 TelEat. All rights reserved.</p>
      </div>

      {/* RIGHT: form panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 20px", background:C.offWhite, overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeUp .35s ease" }}>
          {/* Mobile brand */}
          <div className="hide-desktop" style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{
              width:44,
              height:44,
              borderRadius:13,
              overflow:"hidden",   // biar rapi
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
            }}>
              <img 
                src="/logo.png" 
                alt="logo" 
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
            </div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:22, color:C.gray900 }}>TelEat</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════

function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const toast = useToast();
  const [form,    setForm]    = useState({ username:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await apiFetch("POST", "/login", form);
      login(res.user, res.token);
      toast("Selamat datang kembali! 👋");
    } catch (err) { toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:26, color:C.gray900, marginBottom:4 }}>Masuk</h1>
      <p style={{ color:C.gray400, fontSize:14, marginBottom:24 }}>Senang melihatmu lagi!</p>

      <GoogleSignInBtn />
      <Divider />

      <form onSubmit={submit}>
        <Inp label="Username" placeholder="Masukkan username"
          value={form.username} onChange={e => setForm({...form, username:e.target.value})} required />

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPw?"text":"password"} placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password:e.target.value})} required
              style={{ ...inputStyle, paddingRight:42 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.gray400, lineHeight:1,
            }}>{showPw ? "🙈" : "👁"}</button>
          </div>
        </div>

        <BtnRed full disabled={loading}>
          {loading ? "Masuk…" : "Masuk"}
        </BtnRed>
      </form>

      <p style={{ textAlign:"center", marginTop:24, color:C.gray400, fontSize:14 }}>
        Belum punya akun?{" "}
        <span style={{ color:C.blue, fontWeight:700, cursor:"pointer" }} onClick={onSwitch}>Daftar sekarang</span>
      </p>
    </AuthShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// REGISTER PAGE
// ═══════════════════════════════════════════════════════════════════════

function RegisterPage({ onSwitch }) {
  const { login } = useAuth();
  const toast = useToast();
  const [form,    setForm]    = useState({ nama:"", username:"", password:"", role:"PELANGGAN" });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 6) { toast("Password minimal 6 karakter", "warn"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("POST", "/register", form);
      login(res.user, res.token);
      toast("Akun berhasil dibuat! 🎉");
    } catch (err) { toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:26, color:C.gray900, marginBottom:4 }}>Daftar</h1>
      <p style={{ color:C.gray400, fontSize:14, marginBottom:24 }}>Buat akun baru gratis!</p>

      <GoogleSignInBtn />
      <Divider />

      <form onSubmit={submit}>
        <Inp label="Nama Lengkap / Nama Warung" placeholder="Nama kamu"
          value={form.nama} onChange={e => setForm({...form, nama:e.target.value})} required />
        <Inp label="Username" placeholder="Username kamu"
          value={form.username} onChange={e => setForm({...form, username:e.target.value})} required />
        <Inp label="Password" type="password" placeholder="Min. 6 karakter"
          value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Daftar sebagai</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { val:"PELANGGAN", icon:"🛍️", label:"Pelanggan", desc:"Pesan makanan" },
              { val:"MERCHANT",  icon:"🏪", label:"Merchant",  desc:"Jual makanan"  },
            ].map(r => (
              <button type="button" key={r.val} onClick={() => setForm({...form, role:r.val})} style={{
                padding:"14px 10px", border:`2px solid ${form.role===r.val ? C.blue : C.gray200}`,
                borderRadius:12, background:form.role===r.val ? C.blueLight : C.white,
                cursor:"pointer", textAlign:"center", transition:"all .2s",
              }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{r.icon}</div>
                <div style={{ fontWeight:700, fontSize:13, color:form.role===r.val ? C.blue : C.gray900 }}>{r.label}</div>
                <div style={{ fontSize:11, color:C.gray400, marginTop:2 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <BtnRed full disabled={loading}>
          {loading ? "Mendaftar…" : "Buat Akun →"}
        </BtnRed>
      </form>

      <p style={{ textAlign:"center", marginTop:24, color:C.gray400, fontSize:14 }}>
        Sudah punya akun?{" "}
        <span style={{ color:C.blue, fontWeight:700, cursor:"pointer" }} onClick={onSwitch}>Masuk</span>
      </p>
    </AuthShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// NAVBAR (Desktop)
// ═══════════════════════════════════════════════════════════════════════

function Navbar({ page, setPage }) {
  const { user, logout, token } = useAuth();
  const toast = useToast();
  const links = [
    { key:"menu",    icon:"🍜", label:"Menu",    roles:["PELANGGAN","MERCHANT","ADMIN"] },
    { key:"pesanan", icon:"📋", label:"Pesanan", roles:["PELANGGAN","MERCHANT","ADMIN"] },
    { key:"admin",   icon:"⚙️", label:"Admin",   roles:["ADMIN"]                        },
  ].filter(l => l.roles.includes(user?.role));

  return (
    <header style={{ position:"sticky", top:0, zIndex:200, background:C.white, borderBottom:`1px solid ${C.gray100}`, boxShadow:"0 1px 8px rgba(15,23,42,.06)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        {/* Brand */}
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{
            width:44,
            height:44,
            borderRadius:13,
            overflow:"hidden",   // biar rapi
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
          }}>
            <img 
              src="/logo.png" 
              alt="logo" 
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          </div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:19, color:C.gray900 }}>TelEat</span>
        </div>

        {/* Nav */}
        <nav style={{ display:"flex", gap:4 }}>
          {links.map(l => (
            <button key={l.key} onClick={() => setPage(l.key)} className="btn-hover" style={{
              padding:"7px 18px", borderRadius:9, border:"none", cursor:"pointer",
              fontWeight:600, fontSize:14,
              background: page===l.key ? C.redLight : "transparent",
              color:       page===l.key ? C.red      : C.gray600,
              transition:"all .2s",
            }}>{l.icon} {l.label}</button>
          ))}
        </nav>

        {/* User */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg, ${C.red}, ${C.redDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:C.white }}>
              {(user?.profile?.nama || user?.username || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.gray900, lineHeight:1.2 }}>
                {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:C.blue }}>{user?.role}</div>
            </div>
          </div>
          <BtnGhost small onClick={async () => { await logout(token); toast("Sampai jumpa! 👋"); }}>Keluar</BtnGhost>
        </div>
      </div>
    </header>
  );
}

// ─── BOTTOM NAV (Mobile) ──────────────────────────────────────────────
function BottomNav({ page, setPage, role }) {
  const tabs = [
    { key:"menu",    icon:"🍜", label:"Menu",    roles:["PELANGGAN","MERCHANT","ADMIN"] },
    { key:"pesanan", icon:"📋", label:"Pesanan", roles:["PELANGGAN","MERCHANT","ADMIN"] },
    { key:"admin",   icon:"⚙️", label:"Admin",   roles:["ADMIN"]                        },
  ].filter(t => t.roles.includes(role));

  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:C.white, borderTop:`1px solid ${C.gray100}`, display:"flex", paddingBottom:"env(safe-area-inset-bottom,0)", boxShadow:"0 -4px 20px rgba(15,23,42,.06)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setPage(t.key)} style={{
          flex:1, padding:"10px 0 8px", background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:2,
          color: page===t.key ? C.red : C.gray400, transition:"color .2s",
        }}>
          <span style={{ fontSize:22 }}>{t.icon}</span>
          <span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
          {page===t.key && <div style={{ width:16, height:2, background:C.red, borderRadius:99, marginTop:1 }} />}
        </button>
      ))}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MENU PAGE
// ═══════════════════════════════════════════════════════════════════════

function MenuCard({ m, role, onEdit, onDel, onCart }) {
  const isMerchant = role === "MERCHANT";
  const isPelanggan = role === "PELANGGAN";
  const inStock = Number(m.stok) > 0;
  return (
    <div className="card-hover" style={{ background:C.white, borderRadius:16, overflow:"hidden", border:`1px solid ${C.gray100}`, boxShadow:"0 2px 8px rgba(15,23,42,.06)" }}>
      <div style={{ height:120, position:"relative", background:`linear-gradient(135deg, ${C.blueLight}, ${C.redLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>
        {m.foto_url && <img src={m.foto_url} alt={m.nama_menu} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />}
        {!m.foto_url && "🍽️"}
        {!inStock && (
          <div style={{ position:"absolute", inset:0, background:"rgba(15,23,42,.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ background:C.danger, color:C.white, fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:99 }}>HABIS</span>
          </div>
        )}
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontWeight:700, fontSize:14, color:C.gray900, marginBottom:2 }}>{m.nama_menu}</div>
        <div style={{ fontSize:12, color:C.gray400, marginBottom:8 }}>{m.merchant?.nama_merchant}</div>
        <div style={{ fontWeight:800, fontSize:17, color:C.red }}>Rp{Number(m.harga).toLocaleString("id-ID")}</div>
        <div style={{ fontSize:12, marginTop:3, color:inStock?C.success:C.danger, fontWeight:600 }}>Stok: {inStock?m.stok:"Habis"}</div>
      </div>
      <div style={{ padding:"0 14px 14px", display:"flex", gap:8 }}>
        {isMerchant && <>
          <BtnGhost small style={{ flex:1 }} onClick={() => onEdit(m)}>✏️ Edit</BtnGhost>
          <BtnGhost small danger onClick={() => onDel(m.id)}>🗑️</BtnGhost>
        </>}
        {isPelanggan && inStock && <BtnRed small full onClick={() => onCart(m)}>+ Keranjang</BtnRed>}
      </div>
    </div>
  );
}

const qtyBtnStyle = {
  width:28, height:28, border:`1px solid ${C.gray200}`, borderRadius:7,
  background:C.gray50, cursor:"pointer", fontSize:14, fontWeight:700,
  display:"inline-flex", alignItems:"center", justifyContent:"center", color:C.gray800,
};

function MenuPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const isMerchant = role === "MERCHANT";
  const isPelanggan = role === "PELANGGAN";

  const [menus,      setMenus]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [cart,       setCart]       = useState([]);
  const [menuModal,  setMenuModal]  = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [form,       setForm]       = useState({ nama_menu:"", harga:"", stok:"" });
  const [editId,     setEditId]     = useState(null);
  const [metode,     setMetode]     = useState("CASH");

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const r = await apiFetch("GET", "/menus"); 
      setMenus(r.data); 
    }
    catch (e) { 
      toast(e.message, "error"); 
    }
    finally { 
      setLoading(false); 
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const displayed = menus
    .filter(m => isMerchant ? m.merchant_id === user.profile?.id : true)
    .filter(m => m.nama_menu?.toLowerCase().includes(search.toLowerCase()));

  const saveMenu = async e => {
    e.preventDefault();
    try {
      if (editId) { await apiFetch("PUT",  `/menus/${editId}`, form, token); toast("Menu diperbarui!"); }
      else        { await apiFetch("POST", "/menus", form, token);            toast("Menu ditambahkan! 🎉"); }
      setMenuModal(false); load();
    } catch (er) { toast(er.message, "error"); }
  };

  const delMenu = async id => {
    if (!window.confirm("Hapus menu ini?")) return;
    try { await apiFetch("DELETE", `/menus/${id}`, null, token); toast("Menu dihapus"); load(); }
    catch (er) { toast(er.message, "error"); }
  };

  const addCart = m => {
    setCart(p => {
      const ex = p.find(c => c.id === m.id);
      return ex ? p.map(c => c.id===m.id ? {...c, qty:c.qty+1} : c) : [...p, {...m, qty:1}];
    });
    toast(`${m.nama_menu} ditambahkan 🛒`);
  };

  const changeQty  = (id, d) => setCart(p => p.map(c => c.id===id ? {...c, qty:Math.max(1,c.qty+d)} : c));
  const removeItem = id      => setCart(p => p.filter(c => c.id!==id));
  const totalCart  = cart.reduce((s,c) => s + Number(c.harga)*c.qty, 0);
  const cartCount  = cart.reduce((s,c) => s + c.qty, 0);

  const submitOrder = async () => {
    if (!cart.length) return;
    try {
      await apiFetch("POST", "/pesanans", { merchant_id:cart[0].merchant_id, metode_bayar:metode, items:cart.map(c=>({menu_id:c.id, jumlah:c.qty})) }, token);
      toast("Pesanan berhasil dibuat! 🎉");
      setCart([]); setOrderModal(false);
    } catch (er) { toast(er.message, "error"); }
  };

  return (
    <div className="page-enter">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:C.gray900 }}>🍜 Daftar Menu</h2>
          <p style={{ color:C.gray400, fontSize:13, marginTop:2 }}>{displayed.length} menu tersedia</p>
        </div>
        {isMerchant && <BtnRed small onClick={() => { setEditId(null); setForm({nama_menu:"",harga:"",stok:""}); setMenuModal(true); }}>+ Tambah Menu</BtnRed>}
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:20 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:C.gray400 }}>🔍</span>
        <input style={{ ...inputStyle, paddingLeft:42 }} placeholder="Cari menu…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : displayed.length===0
        ? <Empty icon="🍽️" title="Menu tidak ditemukan" sub="Coba kata kunci lain" />
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:14 }}>
            {displayed.map(m => <MenuCard key={m.id} m={m} role={role} onEdit={m=>{setEditId(m.id);setForm({nama_menu:m.nama_menu,harga:m.harga,stok:m.stok});setMenuModal(true);}} onDel={delMenu} onCart={addCart} />)}
          </div>
      }

      {/* Cart FAB */}
      {isPelanggan && cart.length>0 && (
        <button onClick={() => setOrderModal(true)} style={{
          position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
          background:`linear-gradient(135deg, ${C.red}, ${C.redDark})`,
          color:C.white, border:"none", borderRadius:99, padding:"13px 28px",
          fontWeight:700, fontSize:14, cursor:"pointer", whiteSpace:"nowrap", zIndex:190,
          boxShadow:`0 8px 28px ${C.red}55`, animation:"pulseRed 2s infinite",
        }}>
          🛒 {cartCount} item · Rp{totalCart.toLocaleString("id-ID")}
        </button>
      )}

      {/* Menu Modal */}
      <Modal open={menuModal} onClose={() => setMenuModal(false)} title={editId?"Edit Menu":"Tambah Menu"}>
        <form onSubmit={saveMenu}>
          <Inp label="Nama Menu" placeholder="Contoh: Nasi Goreng Spesial" value={form.nama_menu} onChange={e=>setForm({...form,nama_menu:e.target.value})} required />
          <Inp label="Harga (Rp)" type="number" placeholder="15000"        value={form.harga}     onChange={e=>setForm({...form,harga:e.target.value})}     required />
          <Inp label="Stok"       type="number" placeholder="10"           value={form.stok}      onChange={e=>setForm({...form,stok:e.target.value})}      required />
          <div style={{ display:"flex", gap:10 }}>
            <BtnRed full>Simpan</BtnRed>
            <BtnGhost full onClick={() => setMenuModal(false)}>Batal</BtnGhost>
          </div>
        </form>
      </Modal>

      {/* Order Modal */}
      <Modal open={orderModal} onClose={() => setOrderModal(false)} title="🛒 Konfirmasi Pesanan">
        <div style={{ maxHeight:"35vh", overflowY:"auto", marginBottom:16 }}>
          {cart.map(c => (
            <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.gray100}` }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:C.gray900 }}>{c.nama_menu}</div>
                <div style={{ fontSize:13, color:C.red, fontWeight:700 }}>Rp{(Number(c.harga)*c.qty).toLocaleString("id-ID")}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button style={qtyBtnStyle} onClick={() => changeQty(c.id,-1)}>−</button>
                <span style={{ fontWeight:700, minWidth:22, textAlign:"center", fontSize:14 }}>{c.qty}</span>
                <button style={qtyBtnStyle} onClick={() => changeQty(c.id,+1)}>+</button>
                <button style={{ ...qtyBtnStyle, color:C.red }} onClick={() => removeItem(c.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:`1px solid ${C.gray100}`, marginBottom:16 }}>
          <span style={{ color:C.gray600, fontWeight:600 }}>Total</span>
          <span style={{ fontWeight:800, fontSize:18, color:C.red }}>Rp{totalCart.toLocaleString("id-ID")}</span>
        </div>
        <Sel label="Metode Pembayaran" value={metode} onChange={e => setMetode(e.target.value)}>
          <option value="CASH">💵 Cash</option>
          <option value="QRIS">📱 QRIS</option>
          <option value="TRANSFER">🏦 Transfer Bank</option>
        </Sel>
        <div style={{ display:"flex", gap:10 }}>
          <BtnRed full onClick={submitOrder}>✅ Pesan Sekarang</BtnRed>
          <BtnGhost full onClick={() => setOrderModal(false)}>Batal</BtnGhost>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PESANAN PAGE
// ═══════════════════════════════════════════════════════════════════════

const STATUS_CFG = {
  PENDING  : { color:C.warn,    bg:"#FEF3C7" },
  DIPROSES : { color:C.blue,    bg:C.blueLight },
  SELESAI  : { color:C.success, bg:"#DCFCE7" },
  BATAL    : { color:C.red,     bg:C.redLight  },
};

function PesananPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const isMerchant = user?.role === "MERCHANT";

  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("SEMUA");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiFetch("GET", "/pesanans", null, token); setList(r.data); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { await apiFetch("PUT", `/pesanans/${id}/status`, { status }, token); toast(`Status → ${status}`); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const shown = filter === "SEMUA" ? list : list.filter(p => p.status === filter);

  return (
    <div className="page-enter">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:C.gray900 }}>📋 Pesanan</h2>
        <BtnGhost small onClick={load}>↻ Refresh</BtnGhost>
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["SEMUA","PENDING","DIPROSES","SELESAI","BATAL"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:"6px 16px", borderRadius:99, border:"none", cursor:"pointer", fontWeight:700, fontSize:12,
            background:filter===f ? C.red : C.gray100, color:filter===f ? C.white : C.gray600, transition:"all .15s",
          }}>{f}</button>
        ))}
      </div>

      {loading ? <Spinner /> : shown.length===0
        ? <Empty icon="📋" title="Belum ada pesanan" sub="Pesanan akan muncul di sini" />
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {shown.map(p => {
              const sc = STATUS_CFG[p.status] || { color:C.gray400, bg:C.gray100 };
              return (
                <div key={p.id} style={{ background:C.white, borderRadius:16, padding:"18px 20px", border:`1px solid ${C.gray100}`, boxShadow:"0 2px 8px rgba(15,23,42,.05)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div>
                      <span style={{ fontWeight:800, color:C.red, fontSize:16 }}>#{p.id}</span>
                      <div style={{ fontSize:12, color:C.gray400, marginTop:2 }}>{p.pelanggan?.nama} → {p.merchant?.nama_merchant}</div>
                    </div>
                    <span style={{ padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:700, color:sc.color, background:sc.bg }}>{p.status}</span>
                  </div>

                  <div style={{ borderTop:`1px solid ${C.gray100}`, paddingTop:10, marginBottom:12 }}>
                    {p.details?.map(d => (
                      <div key={d.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:C.gray600, padding:"3px 0" }}>
                        <span>{d.menu?.nama_menu} ×{d.jumlah}</span>
                        <span style={{ fontWeight:600 }}>Rp{Number(d.subtotal).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>

                  {p.transaksi && (
                    <div style={{ background:C.gray50, borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6, fontSize:13 }}>
                      <span style={{ color:C.gray600 }}>Total: <strong style={{ color:C.red }}>Rp{Number(p.transaksi.total_bayar).toLocaleString("id-ID")}</strong></span>
                      <span style={{ color:C.gray600 }}>{p.transaksi.metode_bayar} · <strong style={{ color:p.transaksi.status_bayar==="LUNAS"?C.success:C.warn }}>{p.transaksi.status_bayar}</strong></span>
                    </div>
                  )}

                  {isMerchant && (
                    <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                      {p.status==="PENDING" && <>
                        <BtnBlue small onClick={() => updateStatus(p.id,"DIPROSES")}>▶ Proses</BtnBlue>
                        <BtnRed  small onClick={() => updateStatus(p.id,"SELESAI")}>✅ Selesai</BtnRed>
                        <BtnGhost small danger onClick={() => updateStatus(p.id,"BATAL")}>✕ Batal</BtnGhost>
                      </>}
                      {p.status==="DIPROSES" && <BtnRed small onClick={() => updateStatus(p.id,"SELESAI")}>✅ Selesai</BtnRed>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════

function AdminPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        apiFetch("GET", "/admin/users",     null, token),
        apiFetch("GET", "/admin/dashboard", null, token),
      ]);
      setUsers(u.data); setStats(s.data);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const delUser = async id => {
    if (!window.confirm("Hapus user ini?")) return;
    try { await apiFetch("DELETE", `/admin/users/${id}`, null, token); toast("User dihapus"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const ROLE_CLR = { ADMIN:{c:C.red,bg:C.redLight}, MERCHANT:{c:C.blue,bg:C.blueLight}, PELANGGAN:{c:C.success,bg:"#DCFCE7"} };

  const statCards = stats ? [
    { label:"Total User",       val:stats.total_user,                                                 icon:"👥", border:C.blue    },
    { label:"Total Pesanan",    val:stats.total_pesanan,                                              icon:"📋", border:C.red     },
    { label:"Pesanan Pending",  val:stats.pesanan_pending,                                            icon:"⏳", border:C.warn    },
    { label:"Total Transaksi",  val:`Rp${Number(stats.total_transaksi||0).toLocaleString("id-ID")}`, icon:"💰", border:C.success },
  ] : [];

  return (
    <div className="page-enter">
      <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:C.gray900, marginBottom:20 }}>⚙️ Dashboard Admin</h2>

      {loading ? <Spinner /> : <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:28 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background:C.white, borderRadius:16, padding:"20px", border:`1px solid ${C.gray100}`, borderLeft:`4px solid ${s.border}`, boxShadow:"0 2px 8px rgba(15,23,42,.05)" }}>
              <div style={{ fontSize:26, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontWeight:800, fontSize:22, color:s.border }}>{s.val}</div>
              <div style={{ fontSize:12, color:C.gray400, marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize:16, fontWeight:800, color:C.gray900, marginBottom:14 }}>👥 Semua User</h3>
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray100}`, overflow:"hidden", boxShadow:"0 2px 8px rgba(15,23,42,.05)" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:C.gray50 }}>
                  {["ID","Username","Role","Nama","Aksi"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:C.gray400, textTransform:"uppercase", letterSpacing:.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const rc = ROLE_CLR[u.role] || { c:C.gray600, bg:C.gray100 };
                  return (
                    <tr key={u.id} style={{ borderTop:`1px solid ${C.gray100}`, background:i%2===0?C.white:C.gray50 }}>
                      <td style={{ padding:"12px 16px", fontSize:13, color:C.gray600, fontWeight:600 }}>{u.id}</td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:C.gray900, fontWeight:600 }}>{u.username}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700, color:rc.c, background:rc.bg }}>{u.role}</span>
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:C.gray900 }}>{u.nama}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <BtnGhost small danger onClick={() => delUser(u.id)}>🗑️ Hapus</BtnGhost>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════

function AppCore() {
  const { user } = useAuth();
  const [page,    setPage]    = useState("menu");
  const [isLogin, setIsLogin] = useState(true);
  const [mobile,  setMobile]  = useState(window.innerWidth < 768);

  console.log("CLIENT ID:", GOOGLE_CID);

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  if (!user) {
    return isLogin
      ? <LoginPage    onSwitch={() => setIsLogin(false)} />
      : <RegisterPage onSwitch={() => setIsLogin(true)} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:C.offWhite }}>
      {!mobile && <Navbar page={page} setPage={setPage} />}
      <main style={{ maxWidth:1100, margin:"0 auto", padding:mobile?"20px 16px 90px":"28px 20px" }}>
        {page==="menu"    && <MenuPage />}
        {page==="pesanan" && <PesananPage />}
        {page==="admin"   && user.role==="ADMIN" && <AdminPage />}
      </main>
      {mobile && <BottomNav page={page} setPage={setPage} role={user.role} />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <AuthProvider>
        <ToastProvider>
          <AppCore />
        </ToastProvider>
      </AuthProvider>
    </>
  );
}

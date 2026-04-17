// src/App.jsx
import { useState, useEffect, createContext, useContext } from "react";

const API = "http://localhost:8000/api";
const AuthCtx = createContext(null);

// ─── API HELPER ──────────────────────────────────────────────────────────────
async function api(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request gagal");
  return data;
}

// ─── AUTH PROVIDER ───────────────────────────────────────────────────────────
function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const login = (u, t) => {
    setUser(u); setToken(t);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", t);
  };
  const logout = async () => {
    try { await api("POST", "/logout", null, token); } catch {}
    setUser(null); setToken("");
    localStorage.clear();
  };

  return <AuthCtx.Provider value={{ user, token, login, logout }}>{children}</AuthCtx.Provider>;
}
const useAuth = () => useContext(AuthCtx);

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? "#ef4444" : "#22c55e";
  return (
    <div style={{ position:"fixed", top:20, right:20, background:bg, color:"#fff",
      padding:"12px 20px", borderRadius:10, zIndex:9999, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.3)" }}>
      {msg}
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign:"center", padding:40, color:"#f97316", fontSize:32 }}>⏳</div>;
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm]   = useState({ username:"", password:"" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api("POST", "/login", form);
      login(res.user, res.token);
    } catch (err) {
      setToast({ msg: err.message, type:"error" });
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.authWrap}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={styles.authCard}>
        <div style={styles.logo}>🍽️</div>
        <h1 style={styles.authTitle}>Warung Digital</h1>
        <p style={styles.authSub}>Masuk ke akun kamu</p>
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Username" value={form.username}
            onChange={e => setForm({...form, username: e.target.value})} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} required />
          <button style={styles.btnOrange} disabled={loading}>
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:16, color:"#888" }}>
          Belum punya akun?{" "}
          <span style={{ color:"#f97316", cursor:"pointer", fontWeight:600 }} onClick={onSwitch}>Daftar</span>
        </p>
      </div>
    </div>
  );
}

// ─── REGISTER PAGE ───────────────────────────────────────────────────────────
function RegisterPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm]   = useState({ username:"", password:"", nama:"", role:"PELANGGAN" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api("POST", "/register", form);
      login(res.user, res.token);
    } catch (err) {
      setToast({ msg: err.message, type:"error" });
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.authWrap}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={styles.authCard}>
        <div style={styles.logo}>🍽️</div>
        <h1 style={styles.authTitle}>Warung Digital</h1>
        <p style={styles.authSub}>Buat akun baru</p>
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Nama Lengkap / Nama Warung" value={form.nama}
            onChange={e => setForm({...form, nama: e.target.value})} required />
          <input style={styles.input} placeholder="Username" value={form.username}
            onChange={e => setForm({...form, username: e.target.value})} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} required />
          <select style={styles.input} value={form.role}
            onChange={e => setForm({...form, role: e.target.value})}>
            <option value="PELANGGAN">Pelanggan</option>
            <option value="MERCHANT">Merchant</option>
          </select>
          <button style={styles.btnOrange} disabled={loading}>
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:16, color:"#888" }}>
          Sudah punya akun?{" "}
          <span style={{ color:"#f97316", cursor:"pointer", fontWeight:600 }} onClick={onSwitch}>Masuk</span>
        </p>
      </div>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const role = user?.role;

  const links = [
    { key:"menu", label:"🍜 Menu", roles:["PELANGGAN","MERCHANT","ADMIN"] },
    { key:"pesanan", label:"📋 Pesanan", roles:["PELANGGAN","MERCHANT","ADMIN"] },
    { key:"admin", label:"⚙️ Admin", roles:["ADMIN"] },
  ].filter(l => l.roles.includes(role));

  return (
    <nav style={styles.nav}>
      <span style={styles.navBrand}>🍽️ Warung Digital</span>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {links.map(l => (
          <button key={l.key} onClick={() => setPage(l.key)}
            style={{ ...styles.navBtn, ...(page===l.key ? styles.navBtnActive : {}) }}>
            {l.label}
          </button>
        ))}
        <div style={styles.navUser}>
          <span style={{ color:"#ffd6b3" }}>
            {user?.profile?.nama || user?.profile?.nama_merchant || user?.username}
          </span>
          <span style={styles.badge}>{role}</span>
        </div>
        <button onClick={logout} style={styles.btnLogout}>Keluar</button>
      </div>
    </nav>
  );
}

// ─── MENU PAGE ────────────────────────────────────────────────────────────────
function MenuPage() {
  const { user, token } = useAuth();
  const [menus, setMenus]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ nama_menu:"", harga:"", stok:"" });
  const [editId, setEditId] = useState(null);
  const [cart, setCart]     = useState([]);
  const [orderModal, setOrderModal] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState("CASH");

  const isMerchant = user?.role === "MERCHANT";
  const isPelanggan = user?.role === "PELANGGAN";

  const load = async () => {
    setLoading(true);
    try {
      const res = await api("GET", "/menus");
      setMenus(res.data);
    } catch { setToast({ msg:"Gagal memuat menu", type:"error" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const myMenus = isMerchant
    ? menus.filter(m => m.merchant_id === user.profile?.id)
    : menus;

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api("PUT", `/menus/${editId}`, form, token);
        setToast({ msg:"Menu diperbarui!", type:"success" });
      } else {
        await api("POST", "/menus", form, token);
        setToast({ msg:"Menu ditambahkan!", type:"success" });
      }
      setModal(false); setForm({ nama_menu:"", harga:"", stok:"" }); setEditId(null);
      load();
    } catch (err) { setToast({ msg: err.message, type:"error" }); }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus menu ini?")) return;
    try {
      await api("DELETE", `/menus/${id}`, null, token);
      setToast({ msg:"Menu dihapus", type:"success" });
      load();
    } catch (err) { setToast({ msg: err.message, type:"error" }); }
  };

  const addCart = (menu) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === menu.id);
      if (ex) return prev.map(c => c.id === menu.id ? {...c, jumlah: c.jumlah+1} : c);
      return [...prev, { ...menu, jumlah: 1 }];
    });
    setToast({ msg: `${menu.nama_menu} ditambahkan ke keranjang`, type:"success" });
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    const merchantId = cart[0].merchant_id;
    try {
      await api("POST", "/pesanans", {
        merchant_id: merchantId,
        metode_bayar: metodeBayar,
        items: cart.map(c => ({ menu_id: c.id, jumlah: c.jumlah }))
      }, token);
      setToast({ msg:"Pesanan berhasil dibuat!", type:"success" });
      setCart([]); setOrderModal(false);
    } catch (err) { setToast({ msg: err.message, type:"error" }); }
  };

  const totalCart = cart.reduce((s,c) => s + c.harga * c.jumlah, 0);

  return (
    <div style={styles.page}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>🍜 Daftar Menu</h2>
        {isMerchant && (
          <button style={styles.btnOrangeSmall} onClick={() => { setModal(true); setEditId(null); setForm({ nama_menu:"", harga:"", stok:"" }); }}>
            + Tambah Menu
          </button>
        )}
        {isPelanggan && cart.length > 0 && (
          <button style={styles.btnOrangeSmall} onClick={() => setOrderModal(true)}>
            🛒 Keranjang ({cart.length}) — Rp{totalCart.toLocaleString()}
          </button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div style={styles.grid}>
          {myMenus.map(m => (
            <div key={m.id} style={styles.card}>
              <div style={styles.cardEmoji}>🍽️</div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{m.nama_menu}</h3>
                <p style={styles.cardSub}>{m.merchant?.nama_merchant}</p>
                <p style={styles.cardPrice}>Rp{Number(m.harga).toLocaleString()}</p>
                <p style={{ color: m.stok>0?"#22c55e":"#ef4444", fontSize:13 }}>
                  Stok: {m.stok > 0 ? m.stok : "Habis"}
                </p>
              </div>
              <div style={styles.cardActions}>
                {isMerchant && (
                  <>
                    <button style={styles.btnEdit} onClick={() => {
                      setEditId(m.id); setForm({ nama_menu:m.nama_menu, harga:m.harga, stok:m.stok }); setModal(true);
                    }}>✏️ Edit</button>
                    <button style={styles.btnDel} onClick={() => del(m.id)}>🗑️ Hapus</button>
                  </>
                )}
                {isPelanggan && m.stok > 0 && (
                  <button style={styles.btnOrangeSmall} onClick={() => addCart(m)}>+ Pesan</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Menu */}
      {modal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom:16 }}>{editId ? "Edit Menu" : "Tambah Menu"}</h3>
            <form onSubmit={save}>
              <input style={styles.input} placeholder="Nama Menu" value={form.nama_menu}
                onChange={e => setForm({...form, nama_menu: e.target.value})} required />
              <input style={styles.input} type="number" placeholder="Harga" value={form.harga}
                onChange={e => setForm({...form, harga: e.target.value})} required />
              <input style={styles.input} type="number" placeholder="Stok" value={form.stok}
                onChange={e => setForm({...form, stok: e.target.value})} required />
              <div style={{ display:"flex", gap:8 }}>
                <button style={styles.btnOrange}>Simpan</button>
                <button type="button" style={styles.btnGray} onClick={() => setModal(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Order */}
      {orderModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom:16 }}>🛒 Konfirmasi Pesanan</h3>
            {cart.map(c => (
              <div key={c.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #333" }}>
                <span>{c.nama_menu} x{c.jumlah}</span>
                <span>Rp{(c.harga*c.jumlah).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", fontWeight:700, color:"#f97316" }}>
              <span>Total</span><span>Rp{totalCart.toLocaleString()}</span>
            </div>
            <select style={styles.input} value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer</option>
            </select>
            <div style={{ display:"flex", gap:8 }}>
              <button style={styles.btnOrange} onClick={submitOrder}>✅ Pesan Sekarang</button>
              <button style={styles.btnGray} onClick={() => setOrderModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PESANAN PAGE ────────────────────────────────────────────────────────────
function PesananPage() {
  const { user, token } = useAuth();
  const [pesanans, setPesanans] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  const isMerchant = user?.role === "MERCHANT";

  const load = async () => {
    setLoading(true);
    try {
      const res = await api("GET", "/pesanans", null, token);
      setPesanans(res.data);
    } catch { setToast({ msg:"Gagal memuat pesanan", type:"error" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api("PUT", `/pesanans/${id}/status`, { status }, token);
      setToast({ msg:`Status diubah ke ${status}`, type:"success" });
      load();
    } catch (err) { setToast({ msg: err.message, type:"error" }); }
  };

  const statusColor = { PENDING:"#f59e0b", DIPROSES:"#3b82f6", SELESAI:"#22c55e", BATAL:"#ef4444" };

  return (
    <div style={styles.page}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>📋 Pesanan</h2>
      </div>
      {loading ? <Spinner /> : pesanans.length === 0 ? (
        <div style={{ textAlign:"center", color:"#888", padding:60 }}>Belum ada pesanan</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {pesanans.map(p => (
            <div key={p.id} style={styles.pesananCard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <span style={{ fontWeight:700, color:"#f97316" }}>#{p.id}</span>
                  <span style={{ marginLeft:12, color:"#ccc" }}>
                    {p.pelanggan?.nama} → {p.merchant?.nama_merchant}
                  </span>
                </div>
                <span style={{ ...styles.statusBadge, background: statusColor[p.status] || "#888" }}>
                  {p.status}
                </span>
              </div>
              <div style={{ marginTop:12 }}>
                {p.details?.map(d => (
                  <div key={d.id} style={{ display:"flex", justifyContent:"space-between", color:"#aaa", fontSize:14, padding:"4px 0" }}>
                    <span>{d.menu?.nama_menu} x{d.jumlah}</span>
                    <span>Rp{Number(d.subtotal).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {p.transaksi && (
                <div style={{ marginTop:8, padding:"8px 12px", background:"#1a1a1a", borderRadius:8, display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"#888" }}>Total: <strong style={{ color:"#f97316" }}>Rp{Number(p.transaksi.total_bayar).toLocaleString()}</strong></span>
                  <span style={{ color:"#888" }}>{p.transaksi.metode_bayar} — <strong style={{ color: p.transaksi.status_bayar==="LUNAS"?"#22c55e":"#f59e0b" }}>{p.transaksi.status_bayar}</strong></span>
                </div>
              )}
              {isMerchant && p.status === "PENDING" && (
                <div style={{ marginTop:12, display:"flex", gap:8 }}>
                  <button style={styles.btnEdit} onClick={() => updateStatus(p.id, "DIPROSES")}>▶ Proses</button>
                  <button style={styles.btnOrangeSmall} onClick={() => updateStatus(p.id, "SELESAI")}>✅ Selesai</button>
                  <button style={styles.btnDel} onClick={() => updateStatus(p.id, "BATAL")}>❌ Batal</button>
                </div>
              )}
              {isMerchant && p.status === "DIPROSES" && (
                <div style={{ marginTop:12, display:"flex", gap:8 }}>
                  <button style={styles.btnOrangeSmall} onClick={() => updateStatus(p.id, "SELESAI")}>✅ Selesai</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PAGE ──────────────────────────────────────────────────────────────
function AdminPage() {
  const { token } = useAuth();
  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        api("GET", "/admin/users", null, token),
        api("GET", "/admin/dashboard", null, token),
      ]);
      setUsers(u.data); setStats(s.data);
    } catch { setToast({ msg:"Gagal memuat data admin", type:"error" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Hapus user ini?")) return;
    try {
      await api("DELETE", `/admin/users/${id}`, null, token);
      setToast({ msg:"User dihapus", type:"success" });
      load();
    } catch (err) { setToast({ msg: err.message, type:"error" }); }
  };

  const roleColor = { ADMIN:"#a855f7", MERCHANT:"#3b82f6", PELANGGAN:"#22c55e" };

  return (
    <div style={styles.page}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={styles.pageTitle}>⚙️ Dashboard Admin</h2>

      {loading ? <Spinner /> : (
        <>
          {stats && (
            <div style={styles.statsGrid}>
              {[
                { label:"Total User", val: stats.total_user, icon:"👥" },
                { label:"Total Pesanan", val: stats.total_pesanan, icon:"📋" },
                { label:"Pesanan Pending", val: stats.pesanan_pending, icon:"⏳" },
                { label:"Total Transaksi", val: `Rp${Number(stats.total_transaksi).toLocaleString()}`, icon:"💰" },
              ].map(s => (
                <div key={s.label} style={styles.statCard}>
                  <div style={{ fontSize:32 }}>{s.icon}</div>
                  <div style={{ color:"#f97316", fontSize:22, fontWeight:700 }}>{s.val}</div>
                  <div style={{ color:"#888", fontSize:13 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ color:"#fff", marginTop:32, marginBottom:16 }}>👥 Semua User</h3>
          <div style={{ overflowX:"auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>{["ID","Username","Role","Nama","Aksi"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>{u.id}</td>
                    <td style={styles.td}>{u.username}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, background: roleColor[u.role] || "#888" }}>{u.role}</span>
                    </td>
                    <td style={styles.td}>{u.nama}</td>
                    <td style={styles.td}>
                      <button style={styles.btnDel} onClick={() => del(u.id)}>🗑️ Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { user } = useAuth();
  const [page, setPage]   = useState("menu");
  const [isLogin, setIsLogin] = useState(true);

  if (!user) {
    return isLogin
      ? <LoginPage onSwitch={() => setIsLogin(false)} />
      : <RegisterPage onSwitch={() => setIsLogin(true)} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0f0f0f", color:"#fff", fontFamily:"'Segoe UI', sans-serif" }}>
      <Navbar page={page} setPage={setPage} />
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 16px" }}>
        {page === "menu"    && <MenuPage />}
        {page === "pesanan" && <PesananPage />}
        {page === "admin"   && user.role === "ADMIN" && <AdminPage />}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  authWrap: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
    background:"linear-gradient(135deg,#0f0f0f 0%,#1a1a1a 100%)", fontFamily:"'Segoe UI',sans-serif" },
  authCard: { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:20,
    padding:40, width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(0,0,0,.5)" },
  logo: { textAlign:"center", fontSize:48, marginBottom:8 },
  authTitle: { textAlign:"center", color:"#fff", fontSize:24, fontWeight:800, margin:0 },
  authSub: { textAlign:"center", color:"#888", marginBottom:24 },
  input: { width:"100%", padding:"12px 14px", marginBottom:12, borderRadius:10,
    border:"1px solid #333", background:"#111", color:"#fff", fontSize:15, boxSizing:"border-box" },
  btnOrange: { width:"100%", padding:"13px", background:"linear-gradient(135deg,#f97316,#ea580c)",
    color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:16, cursor:"pointer" },
  btnOrangeSmall: { padding:"8px 16px", background:"linear-gradient(135deg,#f97316,#ea580c)",
    color:"#fff", border:"none", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer" },
  btnEdit: { padding:"8px 16px", background:"#1d4ed8", color:"#fff", border:"none",
    borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer" },
  btnDel: { padding:"8px 16px", background:"#dc2626", color:"#fff", border:"none",
    borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer" },
  btnGray: { padding:"13px 24px", background:"#333", color:"#fff", border:"none",
    borderRadius:10, fontWeight:600, fontSize:15, cursor:"pointer" },
  btnLogout: { padding:"8px 16px", background:"#333", color:"#fff", border:"none",
    borderRadius:8, cursor:"pointer", fontWeight:600 },
  nav: { background:"#111", borderBottom:"1px solid #2a2a2a", padding:"14px 24px",
    display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100 },
  navBrand: { color:"#f97316", fontWeight:800, fontSize:20 },
  navBtn: { padding:"7px 14px", background:"transparent", color:"#888", border:"1px solid #333",
    borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 },
  navBtnActive: { background:"#f97316", color:"#fff", borderColor:"#f97316" },
  navUser: { display:"flex", alignItems:"center", gap:8, padding:"0 12px" },
  badge: { background:"#1a1a1a", border:"1px solid #333", padding:"2px 8px",
    borderRadius:20, fontSize:11, color:"#f97316", fontWeight:700 },
  page: { paddingTop:8 },
  pageHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 },
  pageTitle: { color:"#fff", fontSize:22, fontWeight:700, margin:0 },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 },
  card: { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:16, overflow:"hidden",
    transition:"transform .2s", cursor:"default" },
  cardEmoji: { background:"linear-gradient(135deg,#f97316,#ea580c)", textAlign:"center",
    fontSize:40, padding:20 },
  cardBody: { padding:"14px 16px" },
  cardTitle: { color:"#fff", fontWeight:700, fontSize:16, margin:"0 0 4px" },
  cardSub: { color:"#888", fontSize:12, margin:"0 0 8px" },
  cardPrice: { color:"#f97316", fontWeight:700, fontSize:18 },
  cardActions: { padding:"0 16px 16px", display:"flex", gap:8, flexWrap:"wrap" },
  pesananCard: { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:16, padding:20 },
  statusBadge: { padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700, color:"#fff" },
  statsGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:8 },
  statCard: { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:16,
    padding:24, textAlign:"center" },
  table: { width:"100%", borderCollapse:"collapse", background:"#1a1a1a", borderRadius:16, overflow:"hidden" },
  th: { background:"#111", color:"#f97316", padding:"12px 16px", textAlign:"left", fontWeight:700, fontSize:13 },
  td: { padding:"12px 16px", color:"#ccc", borderBottom:"1px solid #2a2a2a", fontSize:14 },
  tr: { transition:"background .15s" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex",
    alignItems:"center", justifyContent:"center", zIndex:1000 },
  modal: { background:"#1a1a1a", border:"1px solid #333", borderRadius:20,
    padding:32, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,.6)" },
};

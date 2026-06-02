import { useState, useEffect, useCallback } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import { BtnRed, BtnGhost, BtnBlue } from "../components/ui/Button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from "../components/ui/Modal";
import Inp from "../components/ui/Input";
import Sel from "../components/ui/Select";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcUsers    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcOrders   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>;
const IcClock    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcRevenue  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcCard     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcUser     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcTrash    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcShield   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcRefresh  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcMenu     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IcEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;


// ─── Role Badge Colors ────────────────────────────────────────────────────────
const ROLE_CLR = {
  ADMIN:     { c: C.red,     bg: C.redLight },
  MERCHANT:  { c: C.blue,    bg: C.blueLight },
  PELANGGAN: { c: C.success, bg: C.successLight },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, val, icon, color, lightBg, liftClass }) {
  return (
    <div className={liftClass} style={{
      background: C.white, borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${C.gray100}`,
      boxShadow: "0 1px 4px rgba(16,24,40,.05)",
      display: "flex", alignItems: "flex-start", gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: lightBg || C.gray50,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.gray900 }}>{val}</div>
      </div>
    </div>
  );
}

// ─── Table Header ─────────────────────────────────────────────────────────────
function Th({ children }) {
  return (
    <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: ".5px", background: C.gray50, whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function Td({ children, style: s }) {
  return <td style={{ padding: "11px 16px", fontSize: 13, ...s }}>{children}</td>;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [tab, setTab]       = useState("pembayaran");   // "pembayaran" | "pelanggan"
  const [users, setUsers]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const [u, s] = await Promise.all([
        apiFetch("GET", "/admin/users", null, token),
        apiFetch("GET", "/admin/dashboard", null, token),
      ]);
      setUsers(u.data);
      setStats(s.data);
    } catch (e) {
      if (!isPolling) toast(e.message, "error");
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { 
    load(); 
    const interval = setInterval(() => load(true), 10000);
    return () => clearInterval(interval);
  }, [load]);

  const delUser = async id => {
    if (!window.confirm("Hapus user ini?")) return;
    try {
      await apiFetch("DELETE", `/admin/users/${id}`, null, token);
      toast("User berhasil dihapus.");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const lunasTransaksi = async id => {
    if (!window.confirm("Verifikasi pembayaran LUNAS?")) return;
    try {
      await apiFetch("PUT", `/admin/transaksi/${id}/lunas`, null, token);
      toast("Pembayaran berhasil dikonfirmasi.");
      load();
    } catch (e) { toast(e.message, "error"); }
  };



  // ── Derived counts ──────────────────────────────────────────────────────────
  const pembayaranCount = stats?.transaksis?.length ?? 0;
  const pendingCount    = stats?.transaksis?.filter(t => t.status_bayar === "PENDING").length ?? 0;

  const statCards = stats ? [
    { label: "Total User",              val: stats.total_user,    icon: <IcUsers />,   color: C.blue,    lightBg: C.blueLight,    liftClass: "card-lift-blue"  },
    { label: "Total Pesanan",           val: stats.total_pesanan, icon: <IcOrders />,  color: C.red,     lightBg: C.redLight,     liftClass: "card-lift-red"   },
    { label: "Pesanan Pending",         val: stats.pesanan_pending, icon: <IcClock />, color: C.warn,    lightBg: C.warnLight,    liftClass: "card-lift-yellow"  },
    { label: "Pendapatan Lunas",        val: `Rp${Number(stats.total_transaksi || 0).toLocaleString("id-ID")}`, icon: <IcRevenue />, color: C.success, lightBg: C.successLight, liftClass: "card-lift-green" },
  ] : [];

  return (
    <div className="page-enter" style={{ maxWidth: 1100, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="ambient-glow-circle-1" />
        <div className="ambient-glow-circle-2" />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── Page Header ── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(248, 250, 252, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "24px 28px 20px 28px",
        margin: "0 -28px 24px -28px",
        borderBottom: `1px solid ${C.gray100}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.02)",
      }} className="responsive-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.redLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}>
            <IcShield />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: C.gray900, lineHeight: 1.2 }}>
              Dashboard Admin
            </h2>
            <p style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>Manajemen sistem kantin Telkom</p>
          </div>
        </div>
        <BtnGhost small onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IcRefresh /> Refresh</BtnGhost>
      </div>

      {loading ? <Spinner /> : <>

        {/* TABS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, borderBottom: `1px solid ${C.gray200}`, paddingBottom: 12 }}>
            <button 
                onClick={() => setTab("pembayaran")}
                style={{ 
                    padding: "10px 20px", 
                    background: tab === "pembayaran" ? C.red : "transparent",
                    color: tab === "pembayaran" ? C.white : C.gray600,
                    border: "none",
                    borderRadius: 99,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.2s"
                }}
            >
                <IcCard /> Pembayaran
            </button>
            <button 
                onClick={() => setTab("pelanggan")}
                style={{ 
                    padding: "10px 20px", 
                    background: tab === "pelanggan" ? C.red : "transparent",
                    color: tab === "pelanggan" ? C.white : C.gray600,
                    border: "none",
                    borderRadius: 99,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.2s"
                }}
            >
                <IcUser /> User
            </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14, marginBottom: 28 }}>
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* GRAPH */}
        {stats?.grafik_pendapatan && stats.grafik_pendapatan.length > 0 && (
            <div className="responsive-card" style={{ background: C.white, borderRadius: 16, marginBottom: 28, border: `1px solid ${C.gray100}`, boxShadow: "0 2px 8px rgba(15,23,42,.05)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.gray900, marginBottom: 20 }}>Grafik Pendapatan Seluruh Merchant (7 Hari Terakhir)</h3>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.grafik_pendapatan} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.gray100} />
                            <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: C.gray400 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: C.gray400 }} tickFormatter={val => `Rp${(val/1000)}k`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                formatter={(value) => [`Rp${Number(value).toLocaleString("id-ID")}`, "Total Pendapatan"]}
                                labelStyle={{ color: C.gray500, marginBottom: 4 }}
                            />
                            <Line type="monotone" dataKey="total" stroke={C.success} strokeWidth={4} dot={{ r: 5, fill: C.success, strokeWidth: 2, stroke: C.white }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* ════════════════════════════════
            TAB: PEMBAYARAN MASUK
        ════════════════════════════════ */}
        {tab === "pembayaran" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>Pembayaran Masuk</h3>
                {pendingCount > 0 && (
                  <p style={{ fontSize: 12, color: C.warn, fontWeight: 600, marginTop: 2 }}>
                    {pendingCount} transaksi menunggu konfirmasi
                  </p>
                )}
              </div>
            </div>

            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.gray100}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,24,40,.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Order ID", "Pelanggan", "Merchant", "Metode", "Total Bayar", "Status", "Aksi"].map(h => (
                        <Th key={h}>{h}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!stats.transaksis || stats.transaksis.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "32px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: C.gray400 }}>
                            <IcCard />
                            <span style={{ fontSize: 13 }}>Belum ada transaksi.</span>
                          </div>
                        </td>
                      </tr>
                    ) : stats.transaksis.map((t, i) => (
                      <tr key={t.transaksi_id} style={{ borderTop: `1px solid ${C.gray100}`, background: i % 2 === 0 ? C.white : C.gray50 }}>
                        <Td style={{ fontWeight: 700, color: C.gray900 }}>#{t.pesanan_id}</Td>
                        <Td style={{ color: C.gray700 }}>{t.pesanan?.pelanggan?.nama || "-"}</Td>
                        <Td style={{ color: C.gray600 }}>{t.pesanan?.merchant?.nama_merchant || "-"}</Td>
                        <Td>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.gray600, background: C.gray100, padding: "2px 8px", borderRadius: 4 }}>
                            {t.metode_bayar}
                          </span>
                        </Td>
                        <Td style={{ fontWeight: 700, color: C.red }}>Rp{Number(t.total_bayar).toLocaleString("id-ID")}</Td>
                        <Td>
                          <span style={{
                            padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                            color:      t.status_bayar === "LUNAS" ? C.success : C.warn,
                            background: t.status_bayar === "LUNAS" ? C.successLight : C.warnLight,
                          }}>
                            {t.status_bayar}
                          </span>
                        </Td>
                        <Td>
                          {t.status_bayar === "PENDING" && (
                            <BtnRed small onClick={() => lunasTransaksi(t.transaksi_id)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                            >
                              <IcCheck /> Lunas
                            </BtnRed>
                          )}
                          {t.status_bayar === "LUNAS" && (
                            <span style={{ fontSize: 12, color: C.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <IcCheck /> Terkonfirmasi
                            </span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            TAB: MANAJEMEN USER
        ════════════════════════════════ */}
        {tab === "pelanggan" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>Manajemen User</h3>
              <p style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{users.length} user terdaftar di sistem</p>
            </div>

            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.gray100}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,24,40,.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["ID", "Username", "Role", "Nama", "Aksi"].map(h => <Th key={h}>{h}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "32px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: C.gray400 }}>
                            <IcUsers />
                            <span style={{ fontSize: 13 }}>Tidak ada user.</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.map((u, i) => {
                      const rc = ROLE_CLR[u.role] || { c: C.gray600, bg: C.gray100 };
                      return (
                        <tr key={u.id} style={{ borderTop: `1px solid ${C.gray100}`, background: i % 2 === 0 ? C.white : C.gray50 }}>
                          <Td style={{ color: C.gray400, fontWeight: 600, fontSize: 12 }}>{u.id}</Td>
                          <Td>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 800, color: C.white, flexShrink: 0,
                                overflow: "hidden",
                              }}>
                                {u.foto_profil ? (
                                  <img src={u.foto_profil} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  (u.username || "?")[0].toUpperCase()
                                )}
                              </div>
                              <span style={{ fontWeight: 600, color: C.gray900, fontSize: 13 }}>{u.username}</span>
                            </div>
                          </Td>
                          <Td>
                            <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: rc.c, background: rc.bg }}>
                              {u.role}
                            </span>
                          </Td>
                          <Td style={{ color: C.gray700 }}>{u.nama}</Td>
                          <Td>
                            <BtnGhost small danger onClick={() => delUser(u.id)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                            >
                              <IcTrash /> Hapus
                            </BtnGhost>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </>}
      </div>
    </div>
  );
}

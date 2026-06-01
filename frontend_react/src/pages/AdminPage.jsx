import { useState, useEffect, useCallback } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import { BtnRed, BtnGhost } from "../components/ui/Button";

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

// ─── Role Badge Colors ────────────────────────────────────────────────────────
const ROLE_CLR = {
  ADMIN:     { c: C.red,     bg: C.redLight },
  MERCHANT:  { c: C.blue,    bg: C.blueLight },
  PELANGGAN: { c: C.success, bg: C.successLight },
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 18px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontWeight: active ? 700 : 500,
        fontSize: 13.5,
        color: active ? C.red : C.gray500,
        background: active ? C.redLight : "transparent",
        transition: "all .15s",
        position: "relative",
      }}
    >
      <span style={{ display: "flex", color: active ? C.red : C.gray400 }}>{icon}</span>
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: active ? C.red : C.gray200,
          color: active ? C.white : C.gray600,
          padding: "1px 6px", borderRadius: 99,
          lineHeight: "16px",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        apiFetch("GET", "/admin/users", null, token),
        apiFetch("GET", "/admin/dashboard", null, token),
      ]);
      setUsers(u.data);
      setStats(s.data);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { load(); }, [load]);

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
  const pelangganCount  = users.filter(u => u.role === "PELANGGAN").length;
  const pembayaranCount = stats?.transaksis?.length ?? 0;
  const pendingCount    = stats?.transaksis?.filter(t => t.status_bayar === "PENDING").length ?? 0;

  const statCards = stats ? [
    { label: "Total User",              val: stats.total_user,    icon: <IcUsers />,   color: C.blue,    lightBg: C.blueLight,    liftClass: "card-lift-blue"  },
    { label: "Total Pesanan",           val: stats.total_pesanan, icon: <IcOrders />,  color: C.red,     lightBg: C.redLight,     liftClass: "card-lift-red"   },
    { label: "Pesanan Pending",         val: stats.pesanan_pending, icon: <IcClock />, color: C.warn,    lightBg: C.warnLight,    liftClass: "card-lift-yellow"  },
    { label: "Pendapatan Lunas",        val: `Rp${Number(stats.total_transaksi || 0).toLocaleString("id-ID")}`, icon: <IcRevenue />, color: C.success, lightBg: C.successLight, liftClass: "card-lift-green" },
  ] : [];

  return (
    <div className="page-enter ambient-glow-wrapper" style={{ maxWidth: 1100, position: "relative" }}>
      {/* Ambient background decoration blobs */}
      <div className="ambient-glow-circle-1" />
      <div className="ambient-glow-circle-2" />

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
      }}>
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

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14, marginBottom: 28 }}>
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Tab Bar ── */}
        <div style={{
          display: "flex", gap: 4,
          background: C.gray50, padding: 4, borderRadius: 10,
          border: `1px solid ${C.gray100}`,
          marginBottom: 20, width: "fit-content",
        }}>
          <TabBtn
            active={tab === "pembayaran"}
            onClick={() => setTab("pembayaran")}
            icon={<IcCard />}
            label="Pembayaran Masuk"
            count={pembayaranCount}
          />
          <TabBtn
            active={tab === "pelanggan"}
            onClick={() => setTab("pelanggan")}
            icon={<IcUser />}
            label="Manajemen User"
            count={users.length}
          />
        </div>

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
            TAB: MANAJEMEN USER (PELANGGAN)
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
                              }}>
                                {(u.username || "?")[0].toUpperCase()}
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

import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import { BtnRed, BtnBlue, BtnGhost } from "../components/ui/Button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcOrders = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 12h6M9 16h4" /></svg>;
const IcClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IcRevenue = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IcStore = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IcRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
const IcAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const IcCancel = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const formatDateHeader = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    return "";
  }
};


const IcCalendar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IcClockSmall = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const STATUS_CFG = {
  PENDING: { color: C.warn, bg: "#FEF3C7" },
  DIPROSES: { color: C.blue, bg: C.blueLight },
  SELESAI: { color: C.success, bg: "#DCFCE7" },
  BATAL: { color: C.red, bg: C.redLight },
};

export default function MerchantDashboard() {
  const { user, token } = useAuth();
  const isMerchant = user?.role === "MERCHANT";
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusToko, setStatusToko] = useState("BUKA");
  const [updating, setUpdating] = useState(false);



  const lastPendingCount = useRef(0);

  const load = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const s = await apiFetch("GET", "/merchant/dashboard", null, token);

      // Notifikasi pesanan baru
      if (s.data && s.data.pesanans) {
        const currentPending = s.data.pesanans.filter(p => p.status === 'PENDING');
        if (isPolling && currentPending.length > lastPendingCount.current) {
          // Ada pesanan baru
          toast(`Pesanan baru masuk!`, "success");
          // Play sound
          const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
          audio.play().catch(e => console.log('Audio play error', e));
        }
        lastPendingCount.current = currentPending.length;
      }

      setStats(s.data);
    } catch (e) {
      if (!isPolling) toast(e.message, "error");
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [token, toast]);

  const loadStatusToko = useCallback(async () => {
    if (!isMerchant) return;
    try {
      const r = await apiFetch("GET", "/merchant/status", null, token);
      setStatusToko(r.data.status_toko);
    } catch (e) {
      console.error(e);
    }
  }, [token, isMerchant]);

  const updateStatusToko = async (status) => {
    setUpdating(true);
    try {
      const r = await apiFetch("PUT", "/merchant/status", { status_toko: status }, token);
      setStatusToko(r.data.status_toko);
      toast(`Toko ${status === 'BUKA' ? 'dibuka' : 'ditutup'}!`, "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    load();
    loadStatusToko();

    // Polling setiap 10 detik
    const interval = setInterval(() => {
      load(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [load, loadStatusToko]);

  const updateStatus = async (id, status) => {
    try {
      await apiFetch("PUT", `/pesanans/${id}/status`, { status }, token);
      toast(`Status → ${status}`);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const statCards = stats ? [
    { label: "Total Pesanan", val: stats.total_pesanan, icon: <IcOrders />, color: C.blue, lightBg: C.blueLight, liftClass: "card-lift-blue" },
    { label: "Pesanan Pending", val: stats.pesanan_pending, icon: <IcClock />, color: C.warn, lightBg: C.warnLight, liftClass: "card-lift-yellow" },
    { label: "Total Transaksi", val: `Rp${Number(stats.total_transaksi || 0).toLocaleString("id-ID")}`, icon: <IcRevenue />, color: C.success, lightBg: C.successLight, liftClass: "card-lift-green" },
  ] : [];


  return (
    <div className="page-enter" style={{ position: "relative", minHeight: "100%" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="ambient-glow-circle-1" />
        <div className="ambient-glow-circle-2" />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(248, 250, 252, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "24px 28px 20px 28px",
          margin: "0 -28px 20px -28px",
          borderBottom: `1px solid ${C.gray100}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.02)",
        }} className="responsive-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.blue }}><IcStore /></div>
            <div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: C.gray900, lineHeight: 1.2 }}>Dashboard Merchant</h2>
              <p style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>Pantau pesanan dan status toko Anda</p>
            </div>
          </div>
          <BtnGhost small onClick={() => load(false)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IcRefresh /> Refresh</BtnGhost>
        </div>

            {/* CARD STATUS TOKO - Glassmorphism Control Panel */}
            <div className="responsive-card" style={{
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 16,
              marginBottom: 24,
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 8px 32px rgba(15, 23, 42, 0.03)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: C.gray500, marginBottom: 4 }}>Status Toko</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusToko === "BUKA" ? C.success : C.red, boxShadow: statusToko === "BUKA" ? `0 0 0 3px ${C.successLight}` : `0 0 0 3px ${C.redLight}` }} />
                    <span style={{ fontSize: 20, fontWeight: 800, color: C.gray900, fontFamily: "'Sora',sans-serif" }}>
                      {statusToko === "BUKA" ? "TOKO BUKA" : "TOKO TUTUP"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.gray500, marginTop: 6 }}>
                    {statusToko === "BUKA"
                      ? "Menu Anda terlihat oleh pelanggan"
                      : "Menu Anda tidak terlihat oleh pelanggan"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => updateStatusToko("BUKA")}
                    disabled={updating || statusToko === "BUKA"}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 99,
                      border: `1px solid ${statusToko === "BUKA" ? C.success : C.gray300}`,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: statusToko === "BUKA" ? "default" : "pointer",
                      background: statusToko === "BUKA" ? C.success : C.white,
                      color: statusToko === "BUKA" ? C.white : C.gray700,
                      boxShadow: statusToko === "BUKA" ? `0 6px 20px ${C.success}45` : "none",
                      transition: "all .2s ease",
                      opacity: statusToko === "BUKA" ? 1 : 0.8,
                    }}
                  >
                    BUKA
                  </button>
                  <button
                    onClick={() => updateStatusToko("TUTUP")}
                    disabled={updating || statusToko === "TUTUP"}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 99,
                      border: `1px solid ${statusToko === "TUTUP" ? C.red : C.gray300}`,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: statusToko === "TUTUP" ? "default" : "pointer",
                      background: statusToko === "TUTUP" ? C.red : C.white,
                      color: statusToko === "TUTUP" ? C.white : C.gray700,
                      boxShadow: statusToko === "TUTUP" ? `0 6px 20px ${C.red}45` : "none",
                      transition: "all .2s ease",
                      opacity: statusToko === "TUTUP" ? 1 : 0.8,
                    }}
                  >
                    TUTUP
                  </button>
                </div>
              </div>
            </div>

            {loading ? <Spinner /> : !stats ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: C.gray400, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <IcAlert />
                <div style={{ fontWeight: 600, fontSize: 14, color: C.gray600 }}>Gagal memuat data</div>
                <div style={{ fontSize: 12 }}>Data tidak ditemukan atau terjadi kesalahan</div>
              </div>
            ) : <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 28 }}>
                {statCards.map(s => (
                  <div
                    key={s.label}
                    className={s.liftClass}
                    style={{ background: C.white, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.gray100}`, boxShadow: "0 1px 4px rgba(16,24,40,.05)", display: "flex", alignItems: "flex-start", gap: 14 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 9, background: s.lightBg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontWeight: 800, fontSize: 19, color: C.gray900 }}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRAPH */}
              {stats.grafik_pendapatan && stats.grafik_pendapatan.length > 0 && (
                <div className="responsive-card" style={{ background: C.white, borderRadius: 16, marginBottom: 28, border: `1px solid ${C.gray100}`, boxShadow: "0 2px 8px rgba(15,23,42,.05)" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.gray900, marginBottom: 20 }}>Grafik Pendapatan (7 Hari Terakhir)</h3>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={stats.grafik_pendapatan} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.gray100} />
                        <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: C.gray400 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: C.gray400 }} tickFormatter={val => `Rp${(val / 1000)}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          formatter={(value) => [`Rp${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]}
                          labelStyle={{ color: C.gray500, marginBottom: 4 }}
                        />
                        <Line type="monotone" dataKey="total" stroke={C.red} strokeWidth={4} dot={{ r: 5, fill: C.red, strokeWidth: 2, stroke: C.white }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.gray900, marginBottom: 14 }}>Pesanan Masuk</h3>
              {stats.pesanans && stats.pesanans.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: C.gray400, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <IcOrders />
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.gray600 }}>Belum ada pesanan</div>
                  <div style={{ fontSize: 12 }}>Pesanan akan muncul di sini</div>
                </div>
              ) : (() => {
                let lastDate = "";
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {stats.pesanans.map(p => {
                      const sc = STATUS_CFG[p.status] || { color: C.gray400, bg: C.gray100 };
                      const pDate = p.created_at ? p.created_at.split("T")[0] : "";
                      const showDivider = pDate && pDate !== lastDate;
                      if (showDivider) {
                        lastDate = pDate;
                      }

                      const formattedHeaderDate = pDate ? formatDateHeader(p.created_at) : "Tanggal Tidak Diketahui";
                      const timeStr = p.created_at ? formatTime(p.created_at) : "";

                      return (
                        <div key={p.id}>
                          {showDivider && (
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 12, 
                              margin: "24px 0 12px 0",
                              position: "relative"
                            }}>
                              <span style={{ 
                                fontSize: 12, 
                                fontWeight: 800, 
                                color: C.gray600, 
                                background: C.gray50, 
                                padding: "4px 12px", 
                                borderRadius: 6,
                                border: `1px solid ${C.gray200}`,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6
                              }}>
                                <IcCalendar size={13} />
                                {formattedHeaderDate}
                              </span>
                              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
                            </div>
                          )}
                          <div style={{ background: C.white, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.gray100}`, boxShadow: "0 2px 8px rgba(15,23,42,.05)", transition: "transform 0.2s", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                              <div>
                                <span style={{ fontWeight: 800, color: C.red, fontSize: 16 }}>#{p.id}</span>
                                <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{p.pelanggan?.nama}</div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>{p.status}</span>
                                {timeStr && (
                                  <span style={{ fontSize: 11, color: C.gray500, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <IcClockSmall size={12} />
                                    {timeStr}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ borderTop: `1px solid ${C.gray100}`, paddingTop: 10, marginBottom: 12 }}>
                              {p.details?.map(d => (
                                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.gray600, padding: "3px 0" }}>
                                  <span>{d.menu?.nama_menu} ×{d.jumlah}</span>
                                  <span style={{ fontWeight: 600 }}>Rp{Number(d.subtotal).toLocaleString("id-ID")}</span>
                                </div>
                              ))}
                            </div>

                            {p.catatan && (
                              <div style={{ marginBottom: 12, padding: "8px 12px", background: "#FEF9C3", borderRadius: 8, fontSize: 12, color: "#854D0E" }}>
                                <strong>Catatan:</strong> {p.catatan}
                              </div>
                            )}

                            {p.transaksi && (
                              <div style={{ background: C.gray50, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: 13 }}>
                                <span style={{ color: C.gray600 }}>Total: <strong style={{ color: C.red }}>Rp{Number(p.transaksi.total_bayar).toLocaleString("id-ID")}</strong></span>
                                <span style={{ color: C.gray600 }}>{p.transaksi.metode_bayar} · <strong style={{ color: p.transaksi.status_bayar === "LUNAS" ? C.success : C.warn }}>{p.transaksi.status_bayar}</strong></span>
                              </div>
                            )}

                            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {p.status === "PENDING" && <>
                                <BtnBlue small onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "DIPROSES"); }}>Proses</BtnBlue>
                                <BtnRed small onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "SELESAI"); }}>Selesai</BtnRed>
                                <BtnGhost small danger onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "BATAL"); }} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcCancel /> Batal</BtnGhost>
                              </>}
                              {p.status === "DIPROSES" && <BtnRed small onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "SELESAI"); }}>Selesai</BtnRed>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>}
      </div>
    </div>
  );
}

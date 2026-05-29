import { useState, useEffect, useCallback } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import Empty from "../components/ui/Empty";
import { BtnRed, BtnBlue, BtnGhost } from "../components/ui/Button";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiFetch("GET", "/merchant/dashboard", null, token);
      setStats(s.data);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  const loadStatusToko = useCallback(async () => {
    if (!isMerchant) return;
    try {
      const r = await apiFetch("GET", "/merchant/status", null, token);
      console.log("📦 Response status toko:", r.data); // ✅ DEBUG
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
    loadStatusToko(); // ← PANGGIL loadStatusToko
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
    { label: "Total Pesanan", val: stats.total_pesanan, icon: "📋", border: C.blue },
    { label: "Pesanan Pending", val: stats.pesanan_pending, icon: "⏳", border: C.warn },
    { label: "Total Transaksi", val: `Rp${Number(stats.total_transaksi || 0).toLocaleString("id-ID")}`, icon: "💰", border: C.success },
  ] : [];
  

  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: C.gray900 }}> Dashboard Merchant</h2>
        <BtnGhost small onClick={load}>↻ Refresh</BtnGhost>
      </div>
         {/* CARD STATUS TOKO */}
      <div style={{
        background: C.gray50,
        borderRadius: 16,
        padding: "20px",
        marginBottom: 24,
        border: `1px solid ${C.gray200}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: C.gray500, marginBottom: 4 }}>Status Toko</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.gray900 }}>
              {statusToko === "BUKA" ? "✅ TOKO BUKA" : "🔒 TOKO TUTUP"}
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
                opacity: statusToko === "TUTUP" ? 1 : 0.8,
              }}
            >
              TUTUP
            </button>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : !stats ? <Empty icon="⚠️" title="Gagal memuat" sub="Data tidak ditemukan atau terjadi kesalahan" /> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 28 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: "20px", border: `1px solid ${C.gray100}`, borderLeft: `4px solid ${s.border}`, boxShadow: "0 2px 8px rgba(15,23,42,.05)" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: s.border }}>{s.val}</div>
              <div style={{ fontSize: 12, color: C.gray400, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.gray900, marginBottom: 14 }}> Pesanan Masuk</h3>
        {stats.pesanans && stats.pesanans.length === 0 ? (
          <Empty icon="📋" title="Belum ada pesanan" sub="Pesanan akan muncul di sini" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.pesanans.map(p => {
              const sc = STATUS_CFG[p.status] || { color: C.gray400, bg: C.gray100 };
              return (
                <div key={p.id} style={{ background: C.white, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.gray100}`, boxShadow: "0 2px 8px rgba(15,23,42,.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 800, color: C.red, fontSize: 16 }}>#{p.id}</span>
                      <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{p.pelanggan?.nama}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>{p.status}</span>
                  </div>

                  <div style={{ borderTop: `1px solid ${C.gray100}`, paddingTop: 10, marginBottom: 12 }}>
                    {p.details?.map(d => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.gray600, padding: "3px 0" }}>
                        <span>{d.menu?.nama_menu} ×{d.jumlah}</span>
                        <span style={{ fontWeight: 600 }}>Rp{Number(d.subtotal).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>

                  {p.transaksi && (
                    <div style={{ background: C.gray50, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: 13 }}>
                      <span style={{ color: C.gray600 }}>Total: <strong style={{ color: C.red }}>Rp{Number(p.transaksi.total_bayar).toLocaleString("id-ID")}</strong></span>
                      <span style={{ color: C.gray600 }}>{p.transaksi.metode_bayar} · <strong style={{ color: p.transaksi.status_bayar === "LUNAS" ? C.success : C.warn }}>{p.transaksi.status_bayar}</strong></span>
                    </div>
                  )}

                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {p.status === "PENDING" && <>
                      <BtnBlue small onClick={() => updateStatus(p.id, "DIPROSES")}> Proses</BtnBlue>
                      <BtnRed small onClick={() => updateStatus(p.id, "SELESAI")}> Selesai</BtnRed>
                      <BtnGhost small danger onClick={() => updateStatus(p.id, "BATAL")}>✕ Batal</BtnGhost>
                    </>}
                    {p.status === "DIPROSES" && <BtnRed small onClick={() => updateStatus(p.id, "SELESAI")}> Selesai</BtnRed>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>}
    </div>
  );
}

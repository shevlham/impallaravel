import { useState, useEffect, useCallback } from "react";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../services/api";
import Spinner from "../components/ui/Spinner";
import Empty from "../components/ui/Empty";
import { BtnRed, BtnBlue, BtnGhost } from "../components/ui/Button";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcOrders   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>;
const IcPlate    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.gray300} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>;
const IcNote     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcRefresh  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcCancel   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const STATUS_CFG = {
  PENDING: { color: C.warn, bg: "#FEF3C7" },
  DIPROSES: { color: C.blue, bg: C.blueLight },
  SELESAI: { color: C.success, bg: "#DCFCE7" },
  BATAL: { color: C.red, bg: C.redLight },
};

export default function OrderPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const isMerchant = user?.role === "MERCHANT";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("SEMUA");

  const load = useCallback(async () => {
    setLoading(true);
    try { 
        const r = await apiFetch("GET", "/pesanans", null, token);
        console.log(r.data);
        console.log(r.data[0]?.catatan); 
        setList(r.data); 
    } catch (e) { 
        toast(e.message, "error"); 
    } finally { 
        setLoading(false); 
    }
  }, [token, toast]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { 
        await apiFetch("PUT", `/pesanans/${id}/status`, { status }, token); 
        toast(`Status → ${status}`); 
        load(); 
    } catch (e) { 
        toast(e.message, "error"); 
    }
  };

  const shown = filter === "SEMUA" ? list : list.filter(p => p.status === filter);
  
  // tampil gambar menu 
  const getImageUrl = (gambar) => {
    if (!gambar) return null;
    if (gambar.startsWith('http')) return gambar;
    return `http://localhost:8000/storage/${gambar}`;
  };

  return (
    <div className="page-enter">
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
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: C.redLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}><IcOrders /></div>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: C.gray900, lineHeight: 1.2 }}>Pesanan</h2>
            <p style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>Riwayat & status pesanan Anda</p>
          </div>
        </div>
        <BtnGhost small onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IcRefresh /> Refresh</BtnGhost>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["SEMUA", "PENDING", "DIPROSES", "SELESAI", "BATAL"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 16px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
            background: filter === f ? C.red : C.gray100, color: filter === f ? C.white : C.gray600, transition: "all .15s",
          }}>{f}</button>
        ))}
      </div>

      {loading ? <Spinner /> : shown.length === 0
        ? <div style={{ padding: "40px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <IcOrders />
            <div style={{ fontWeight: 600, fontSize: 14, color: C.gray600 }}>Belum ada pesanan</div>
            <div style={{ fontSize: 12, color: C.gray400 }}>Pesanan akan muncul di sini</div>
          </div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.map(p => {
              const sc = STATUS_CFG[p.status] || { color: C.gray400, bg: C.gray100 };
              return (
                <div key={p.id} style={{ background: C.white, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.gray100}`, boxShadow: "0 2px 8px rgba(15,23,42,.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 800, color: C.red, fontSize: 16 }}>#{p.id}</span>
                      <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{p.pelanggan?.nama} → {p.merchant?.nama_merchant}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg }}>{p.status}</span>
                  </div>
                  
                  <div style={{ borderTop: `1px solid ${C.gray100}`, paddingTop: 10, marginBottom: 12 }}>
                    {p.details?.map(d => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.gray50}` }}>
                        {/* GAMBAR MENU */}
                        {d.menu?.gambar && (
                          <img 
                            src={getImageUrl(d.menu.gambar)} 
                            alt={d.menu.nama_menu}
                            style={{ 
                              width: 50, 
                              height: 50, 
                              borderRadius: 10, 
                              objectFit: "cover",
                              background: C.gray100
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        )}
                        {/* FALLBACK JIKA GAMBAR ERROR */}
                        <div style={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: 10, 
                          background: C.gray100,
                          display: !d.menu?.gambar ? 'flex' : 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <IcPlate />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: C.gray800 }}>{d.menu?.nama_menu}</div>
                          <div style={{ fontSize: 11, color: C.gray400 }}>×{d.jumlah}</div>
                        </div>
                        
                        <span style={{ fontWeight: 700, color: C.red }}>
                          Rp{Number(d.subtotal).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CATATAN PESANAN - TAMBAHAN */}
                  {p.catatan && (
                    <div style={{ 
                      background: C.gray100, 
                      borderRadius: 10, 
                      padding: "10px 14px", 
                      marginBottom: 12,
                      borderLeft: `4px solid ${C.redDark}`
                    }}>
                      <div style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: C.gray700, 
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}>
                        <span style={{ display: "flex", color: C.gray500 }}><IcNote /></span> Catatan Pesanan
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: C.gray700, 
                        fontStyle: "italic",
                        wordBreak: "break-word"
                      }}>
                        {p.catatan}
                      </div>
                    </div>
                  )}

                  {p.transaksi && (
                    <div style={{ background: C.gray50, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: 13 }}>
                      <span style={{ color: C.gray600 }}>Total: <strong style={{ color: C.red }}>Rp{Number(p.transaksi.total_bayar).toLocaleString("id-ID")}</strong></span>
                      <span style={{ color: C.gray600 }}>{p.transaksi.metode_bayar} · <strong style={{ color: p.transaksi.status_bayar === "LUNAS" ? C.success : C.warn }}>{p.transaksi.status_bayar}</strong></span>
                    </div>
                  )}

                  {isMerchant && (
                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {p.status === "PENDING" && <>
                        <BtnBlue small onClick={() => updateStatus(p.id, "DIPROSES")}>Proses</BtnBlue>
                        <BtnRed small onClick={() => updateStatus(p.id, "SELESAI")}>Selesai</BtnRed>
                        <BtnGhost small danger onClick={() => updateStatus(p.id, "BATAL")} style={{ display:"inline-flex",alignItems:"center",gap:4 }}><IcCancel /> Batal</BtnGhost>
                      </>}
                      {p.status === "DIPROSES" && <BtnRed small onClick={() => updateStatus(p.id, "SELESAI")}>Selesai</BtnRed>}
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
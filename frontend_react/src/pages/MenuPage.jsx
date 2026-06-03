import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { C } from "../styles/tokens";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiFetch, API_URL } from "../services/api";
import Spinner from "../components/ui/Spinner";
import Empty from "../components/ui/Empty";
import Modal from "../components/ui/Modal";
import Inp, { inputStyle, labelStyle } from "../components/ui/Input";
import Sel from "../components/ui/Select";
import { BtnRed, BtnGhost } from "../components/ui/Button";
import MenuCard from "../components/ui/MenuCard";

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const Ic = {
  storeOpen: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  storeClosed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  plate: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
  ),
  store: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
  ),
  search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
  ),
  cart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
  ),
  warn: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  note: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
  ),
  cash: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><line x1="6" y1="12" x2="6.01" y2="12" /><line x1="18" y1="12" x2="18.01" y2="12" /></svg>
  ),
  card: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
  ),
  arrowRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
  ),
  menuIcon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
  ),
};

const qtyBtnStyle = {
  width: 28, height: 28, border: `1px solid ${C.gray200}`, borderRadius: 7,
  background: C.gray50, cursor: "pointer", fontSize: 14, fontWeight: 700,
  display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.gray800,
};

export default function
  MenuPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const role = user?.role;
  const isMerchant = role === "MERCHANT";
  const isPelanggan = role === "PELANGGAN";

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterToko, setFilterToko] = useState("Semua");
  const [cart, setCart] = useState([]);
  const [menuModal, setMenuModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [form, setForm] = useState({ nama_menu: "", harga: "", stok: "", kategori: "Lainnya" });
  const [editId, setEditId] = useState(null);
  const [metode, setMetode] = useState("CASH");
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [bankTransfer, setBankTransfer] = useState("BCA");
  const [orderNote, setOrderNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [statusToko, setStatusToko] = useState('BUKA');
  const [tokoLoading, setTokoLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [tipePemesanan, setTipePemesanan] = useState("DINE_IN");

  useEffect(() => {
    const merchantId = searchParams.get("merchant_id");
    if (merchantId) {
      setFilterToko(Number(merchantId));
    }
  }, [searchParams]);

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
    .filter(m => m.nama_menu?.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filterKategori === "Semua" || m.kategori === filterKategori)
    .filter(m => filterToko === "Semua" || m.merchant_id === filterToko);

  const saveMenu = async e => {
    e.preventDefault();
    // 1. Validasi Nama Menu
    if (!form.nama_menu || form.nama_menu.trim().length < 3) {
      toast("Nama menu minimal 3 karakter", "error");
      return;
    }

    // 2. Validasi Harga
    if (!form.harga || Number(form.harga) <= 2000) {
      toast("Harga harus lebih dari RP 2.000", "error");
      return;
    }
    if (Number(form.harga) > 999999999) {
      toast("Harga melebihi batas maksimal", "error");
      return;
    }

    // 3. Validasi Stok
    if (form.stok === "" || form.stok === null) {
      toast("Stok wajib diisi", "error");
      return;
    }
    if (Number(form.stok) < 0) {
      toast("Stok tidak boleh negatif", "error");
      return;
    }
    if (Number(form.stok) > 999999) {
      toast("Stok melebihi batas maksimal", "error");
      return;
    }

    // 4. Validasi Kategori
    if (!form.kategori) {
      toast("Kategori wajib dipilih", "error");
      return;
    }

    // 5. Validasi Gambar (jika ada)
    if (form.gambar) {
      if (form.gambar.size > 2 * 1024 * 1024) {
        toast("Ukuran gambar maksimal 2MB", "error");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(form.gambar.type)) {
        toast("Format gambar harus JPG, PNG, atau GIF", "error");
        return;
      }
    }

    // Lanjut ke proses simpan jika semua validasi lolos
    try {
      const fd = new FormData();
      fd.append("nama_menu", form.nama_menu);
      fd.append("harga", form.harga);
      fd.append("stok", form.stok);
      fd.append("kategori", form.kategori);

      if (form.gambar) {
        fd.append("gambar", form.gambar);
      }

      if (editId) {
        fd.append("_method", "PUT");
      }

      const endpoint = (role === "ADMIN" && editId) 
        ? `/admin/menus/${editId}` 
        : (editId ? `/menus/${editId}` : "/menus");

      const res = await apiFetch(
        "POST",
        endpoint,
        fd,
        token
      );

      toast(editId ? "Menu diperbarui!" : "Menu ditambahkan! 🎉");
      setMenuModal(false);
      load();

    } catch (er) {
      toast(er.message, "error");
    }
  };

  const delMenu = async id => {
    if (!window.confirm("Hapus menu ini?")) return;
    try {
      const endpoint = role === "ADMIN" ? `/admin/menus/${id}` : `/menus/${id}`;
      await apiFetch("DELETE", endpoint, null, token);
      toast("Menu dihapus");
      load();
    } catch (er) {
      toast(er.message, "error");
    }
  };

  const addCart = (m) => {
    const stokTersedia = Number(m.stok);
    const existingItem = cart.find(c => c.id === m.id);
    const currentQty = existingItem ? existingItem.qty : 0;

    if (currentQty >= stokTersedia) {
      toast(`Stok ${m.nama_menu} hanya tersisa ${stokTersedia}!`, "warn");
      return;
    }

    setCart(p => {
      const ex = p.find(c => c.id === m.id);
      if (ex) {
        return p.map(c => c.id === m.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...p, { ...m, qty: 1 }];
    });
    toast(`${m.nama_menu} ditambahkan 🛒`);
  };

  const changeQty = (id, delta) => {
    setCart(p => p.map(c => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      const stokTersedia = Number(c.stok);
      if (delta > 0 && newQty > stokTersedia) {
        toast(`Stok ${c.nama_menu} hanya ${stokTersedia}`, "warn");
        return c;
      }
      if (newQty < 1) return c;
      return { ...c, qty: newQty };
    }));
  };

  const removeItem = id => setCart(p => p.filter(c => c.id !== id));
  const totalCart = cart.reduce((s, c) => s + Number(c.harga) * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const submitOrder = async () => {
    if (!cart.length) return;
    try {
      const byMerchant = {};
      cart.forEach(c => {
        if (!byMerchant[c.merchant_id]) byMerchant[c.merchant_id] = [];
        byMerchant[c.merchant_id].push(c);
      });

      const orders = [];
      for (const mId in byMerchant) {
        const res = await apiFetch("POST", "/pesanans", {
          merchant_id: mId,
          metode_bayar: metode,
          items: byMerchant[mId].map(c => ({ menu_id: c.id, jumlah: c.qty })),
          catatan: orderNote,
          tipe_pemesanan: tipePemesanan,
        }, token);
        orders.push(res.data);
      }

      toast("Pesanan berhasil dibuat! 🎉");
      setCart([]);
      setOrderModal(false);

      // Jika metode bayar CASH, tampilkan panduan bayar manual di Kasir
      if (metode === "CASH") {
        setPaymentOrders(orders);
        setPaymentModal(true);
      } else {
        // Jika metode bayar online (QRIS / TRANSFER), buat snap token Midtrans dan panggil snap
        try {
          const primaryOrder = orders[0];
          const email = user?.email || "customer@teleat.com";

          toast("Menghubungi Midtrans... 💳");

          const payRes = await apiFetch("POST", "/payment/create", {
            order_id: primaryOrder.id,
            email: email
          }, token);

          if (payRes.snap_token) {
            toast("Membuka gerbang pembayaran... 🚀");
            window.snap.pay(payRes.snap_token, {
              onSuccess: function(result){
                toast("Pembayaran berhasil!");
                setCart([]);
                load();
                // Opsional: navigate ke pesanan
              },
              onPending: function(result){
                toast("Menunggu pembayaran!");
                setCart([]);
              },
              onError: function(result){
                toast("Pembayaran gagal!");
              },
              onClose: function(){
                toast("Popup ditutup sebelum pembayaran selesai.");
              }
            });
          } else {
            throw new Error("Gagal memperoleh token pembayaran.");
          }
        } catch (payErr) {
          toast("Gagal memproses pembayaran otomatis: " + payErr.message, "error");
          // Fallback: tampilkan modal instruksi manual jika API Midtrans bermasalah
          setPaymentOrders(orders);
          setPaymentModal(true);
        }
      }
    } catch (er) {
      toast(er.message, "error");
    }
  };


  const loadStatusToko = useCallback(async () => {
    if (!isMerchant) return;
    try {
      const r = await apiFetch("GET", "/merchant/status", null, token);
      setStatusToko(r.data.status_toko);
    } catch (e) {
      console.error(e);
    }
  }, [token, isMerchant]);

  useEffect(() => {
    load();
    if (isMerchant) {
      loadStatusToko();
    }
  }, [load, loadStatusToko, isMerchant]);
  return (
    <>
      <div className="page-enter" style={{ paddingBottom: "90px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: C.redLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}>{Ic.menuIcon}</div>
            <div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: C.gray900 }}>Daftar Menu</h2>
              <p style={{ color: C.gray400, fontSize: 13, marginTop: 2 }}>{displayed.length} menu tersedia</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BtnGhost small onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ display: "flex" }}>{Ic.refresh}</span> Refresh</BtnGhost>
            {isMerchant && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: statusToko === "BUKA" ? `${C.success}20` : `${C.warn}20`,
                padding: "6px 14px",
                borderRadius: 99,
              }}>
                <span style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: statusToko === "BUKA" ? C.success : C.warn }}>
                  {statusToko === "BUKA" ? Ic.storeOpen : Ic.storeClosed}
                  {statusToko === "BUKA" ? "Toko Buka" : "Toko Tutup"}
                </span>
              </div>
            )}
            {isMerchant && (
              <span className="hide-mobile">
                <BtnRed small onClick={() => {
                  setEditId(null);
                  setForm({ nama_menu: "", harga: "", stok: "", kategori: "Lainnya" });
                  setMenuModal(true);
                }}>
                  + Tambah Menu
                </BtnRed>
              </span>
            )}
          </div>
        </div>

        {isPelanggan && (
          <div style={{ marginBottom: 24 }}>
            {/* Rekomendasi — infinite auto-scroll */}
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Rekomendasi Menu</h3>
            <div className="bleed-container">
              <style>{`
                @keyframes marquee {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .rekom-track {
                  display: flex;
                  width: max-content;
                  animation: marquee 55s linear infinite;
                  gap: 16px;
                  padding: 4px 20px 8px;
                }
                .rekom-track:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="rekom-track">
                {/* original set */}
                {menus.filter(m => m.stok > 0).slice(0, 8).map(m => (
                  <div key={`orig-${m.id}`}
                    onClick={() => { setFilterToko(m.merchant_id); setFilterKategori(m.kategori || "Lainnya"); setSearch(m.nama_menu); }}
                    className="card-hover"
                    style={{ minWidth: 200, maxWidth: 200, background: C.white, borderRadius: 16, cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.06)", overflow: "hidden", flexShrink: 0 }}>
                    {m.gambar
                      ? <img src={m.gambar.startsWith('http') ? m.gambar : `http://localhost:8000/storage/${m.gambar}`} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} alt={m.nama_menu} />
                      : <div style={{ width: "100%", height: 130, background: C.redLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}>{Ic.plate}</div>
                    }
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.gray900 }}>{m.nama_menu}</div>
                      <div style={{ fontSize: 12, color: C.gray400, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-flex", color: C.gray400 }}>{Ic.store}</span> {m.merchant?.nama_merchant}
                      </div>
                    </div>
                  </div>
                ))}
                {/* clone set — for seamless loop */}
                {menus.filter(m => m.stok > 0).slice(0, 8).map(m => (
                  <div key={`clone-${m.id}`}
                    onClick={() => { setFilterToko(m.merchant_id); setFilterKategori(m.kategori || "Lainnya"); setSearch(m.nama_menu); }}
                    className="card-hover"
                    style={{ minWidth: 200, maxWidth: 200, background: C.white, borderRadius: 16, cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,0.06)", overflow: "hidden", flexShrink: 0 }}>
                    {m.gambar
                      ? <img src={m.gambar.startsWith('http') ? m.gambar : `http://localhost:8000/storage/${m.gambar}`} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} alt={m.nama_menu} />
                      : <div style={{ width: "100%", height: 130, background: C.redLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}>{Ic.plate}</div>
                    }
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.gray900 }}>{m.nama_menu}</div>
                      <div style={{ fontSize: 12, color: C.gray400, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-flex", color: C.gray400 }}>{Ic.store}</span> {m.merchant?.nama_merchant}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Toko */}
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, marginTop: 12 }}>Pilih Toko</h3>
            <div className="scroll-x-container">
              <div onClick={() => setFilterToko("Semua")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 16, background: filterToko === "Semua" ? C.blueLight : C.white, border: `1px solid ${filterToko === "Semua" ? C.blue : C.gray100}`, cursor: "pointer", minWidth: 76, transition: "all .2s" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: filterToko === "Semua" ? C.blue : C.gray50, color: filterToko === "Semua" ? C.white : C.gray400, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.globe}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: filterToko === "Semua" ? C.blueDark : C.gray600, textAlign: "center", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Semua</span>
              </div>
              {Array.from(new Map(menus.map(m => [m.merchant_id, m.merchant])).values()).filter(Boolean).map(merch => (
                <div key={merch.id} onClick={() => setFilterToko(merch.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 16, background: filterToko === merch.id ? C.blueLight : C.white, border: `1px solid ${filterToko === merch.id ? C.blue : C.gray100}`, cursor: "pointer", minWidth: 76, maxWidth: 84, transition: "all .2s" }}>
                  {merch.user?.foto_profil ? <img src={merch.user.foto_profil} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: 12, background: filterToko === merch.id ? C.blue : C.gray50, color: filterToko === merch.id ? C.white : C.gray400, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.store}</div>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: filterToko === merch.id ? C.blueDark : C.gray600, textAlign: "center", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{merch.nama_merchant}</span>
                </div>
              ))}
            </div>

            {/* Filter Kategori */}
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, marginTop: 12 }}>Kategori Makanan</h3>
            <div className="scroll-x-container" style={{ gap: 8 }}>
              {["Semua", "Makanan", "Minuman", "Cemilan", "Lainnya"].map(kat => (
                <button key={kat} onClick={() => setFilterKategori(kat)} style={{ padding: "6px 16px", borderRadius: 99, background: filterKategori === kat ? C.red : C.gray100, color: filterKategori === kat ? C.white : C.gray600, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}>{kat}</button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", color: C.gray400 }}>{Ic.search}</span>
          <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="Cari menu…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <Spinner /> : displayed.length === 0
          ? <Empty icon={Ic.plate} title="Menu tidak ditemukan" sub="Coba kata kunci lain" />
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14 }}>
            {displayed.map(m => <MenuCard key={m.id} m={m} role={role} onEdit={m => { setEditId(m.id); setForm({ nama_menu: m.nama_menu, harga: m.harga, stok: m.stok }); setMenuModal(true); }} onDel={delMenu} onCart={addCart} />)}
          </div>
        }
      </div>

      {/* Cart FAB */}
      {isPelanggan && cart.length > 0 && (
        <button onClick={() => {
          setOrderModal(true);
          setOrderNote("");  // Reset note setiap buka modal
        }} className="cart-fab">
          <span style={{ display: "flex", order: 1, color: C.white }}>{Ic.cart}</span>
          <div style={{ textAlign: "right", order: 2 }}>
            <div style={{ fontSize: 11, opacity: 0.9 }}>{cartCount} item</div>
            <div style={{ fontWeight: 800 }}>Rp{totalCart.toLocaleString("id-ID")}</div>
          </div>
        </button>
      )}

      {/* Merchant Add Menu FAB */}
      {isMerchant && (
        <button 
          onClick={() => {
            setEditId(null);
            setForm({ nama_menu: "", harga: "", stok: "", kategori: "Lainnya" });
            setMenuModal(true);
          }} 
          className="hide-desktop"
          style={{
            position: "fixed",
            bottom: "calc(76px + env(safe-area-inset-bottom))",
            right: 16,
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            color: C.white,
            border: "none",
            borderRadius: 99,
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: `0 8px 24px ${C.red}66`,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800 }}>+</span> Tambah Menu
        </button>
      )}

      {/* Menu Modal */}
      <Modal open={menuModal} onClose={() => setMenuModal(false)} title={editId ? "Edit Menu" : "Tambah Menu"}>
        <form onSubmit={saveMenu}>
          <Inp
            label="Nama Menu"
            placeholder="Contoh: Nasi Goreng Spesial"
            value={form.nama_menu}
            onChange={e => setForm({ ...form, nama_menu: e.target.value })}
            required
          />
          {/* Error: Nama menu terlalu pendek */}
          {form.nama_menu && form.nama_menu.trim().length < 3 && (
            <div style={{ color: C.red, fontSize: 11, marginTop: -8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.warn} Nama menu minimal 3 karakter
            </div>
          )}

          <Sel label="Kategori" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
            <option value="Makanan">Makanan</option>
            <option value="Minuman">Minuman</option>
            <option value="Cemilan">Cemilan</option>
            <option value="Lainnya">Lainnya</option>
          </Sel>
          {/* Error: Kategori tidak dipilih */}
          {!form.kategori && (
            <div style={{ color: C.red, fontSize: 11, marginTop: -8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.warn} Kategori wajib dipilih
            </div>
          )}

          <Inp
            label="Harga (Rp)"
            type="number"
            placeholder="15000"
            value={form.harga}
            onChange={e => setForm({ ...form, harga: e.target.value })}
            required
          />
          {/* Error: Harga nol atau negatif */}
          {form.harga && (Number(form.harga) <= 0) && (
            <div style={{ color: C.red, fontSize: 11, marginTop: -8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.warn} Harga harus lebih dari 0
            </div>
          )}
          {/* Error: Harga terlalu besar */}
          {form.harga && (Number(form.harga) > 999999999) && (
            <div style={{ color: C.red, fontSize: 11, marginTop: -8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.warn} Harga melebihi batas maksimal (Rp 999.999.999)
            </div>
          )}

          <Inp
            label="Stok"
            type="number"
            placeholder="10"
            value={form.stok}
            onChange={e => setForm({ ...form, stok: e.target.value })}
            required
          />
          {/* Error: Stok negatif */}
          {form.stok && (Number(form.stok) < 0) && (
            <div style={{ color: C.red, fontSize: 11, marginTop: -8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.warn} Stok tidak boleh kurang dari 0
            </div>
          )}
          {/* Error: Stok terlalu besar */}
          {form.stok && (Number(form.stok) > 999999) && (
            <div style={{ color: C.red, fontSize: 11, marginTop: -8, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {Ic.warn} Stok melebihi batas maksimal (999.999)
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Gambar Menu</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setForm({ ...form, gambar: e.target.files[0] })}
            />
            {/* Error: File gambar terlalu besar */}
            {form.gambar && form.gambar.size > 2 * 1024 * 1024 && (
              <div style={{ color: C.red, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                {Ic.warn} Ukuran gambar maksimal 2MB
              </div>
            )}
            {/* Error: Tipe file tidak valid */}
            {form.gambar && !['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(form.gambar.type) && (
              <div style={{ color: C.red, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                {Ic.warn} Format harus JPG, PNG, atau GIF
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <BtnRed full type="submit">Simpan</BtnRed>
            <BtnGhost full onClick={() => setMenuModal(false)}>Batal</BtnGhost>
          </div>
        </form>
      </Modal>

      {/* Order Modal */}
      <Modal open={orderModal} onClose={() => setOrderModal(false)} title={<span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.red }}>{Ic.cart} Konfirmasi Pesanan</span>}>
        {/* TIPE PEMESANAN */}
        <div style={{
          background: C.gray50,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontSize: 13, color: C.gray600, fontWeight: 600 }}>Tipe Pemesanan</span>
          <select 
            value={tipePemesanan} 
            onChange={e => setTipePemesanan(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${C.gray300}`,
              background: C.white,
              fontWeight: 700,
              fontSize: 13,
              color: C.gray900,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="DINE_IN">Makan di tempat</option>
            <option value="TAKE_AWAY">Take Away / Dibungkus</option>
          </select>
        </div>

        {/* REKOMENDASI MENU TERKAIT */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: C.gray900 }}>Menu Terkait</h4>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
            {/* Contoh menu rekomendasi - ganti dengan data dari API */}
            {menus.filter(m => m.merchant_id === cart[0]?.merchant_id).slice(0, 3).map(menu => (
              <div
                key={menu.id}
                onClick={() => addCart(menu)}
                style={{
                  minWidth: 120,
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.gray100}`,
                  overflow: "hidden",
                  cursor: "pointer"
                }}
              >
                {menu.gambar ? (
                  <img
                    src={menu.gambar.startsWith('http') ? menu.gambar : `http://localhost:8000/storage/${menu.gambar}`}
                    alt={menu.nama_menu}
                    style={{ width: "100%", height: 100, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 100, background: C.gray100, display: "flex", alignItems: "center", justifycontent: "center", color: C.gray400 }}>{Ic.plate}</div>
                )}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: C.gray900 }}>{menu.nama_menu}</div>
                  <div style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>Rp{Number(menu.harga).toLocaleString("id-ID")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ITEM YANG DIPESAN */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: C.gray900 }}>Item yang dipesan ({cart.reduce((s, c) => s + c.qty, 0)})</h4>
            <button
              onClick={() => setOrderModal(false)}
              style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              + Tambah Item
            </button>
          </div>

          <div style={{ maxHeight: "30vh", overflowY: "auto" }}>
            {cart.map(c => (
              <div key={c.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.gray100}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.gray900 }}>{c.nama_menu}</div>
                    <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>
                      {c.qty}x Rp{Number(c.harga).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.red }}>
                    Rp{(Number(c.harga) * c.qty).toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Tombol quantity */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <button
                    style={{ ...qtyBtnStyle, width: 24, height: 24, fontSize: 12 }}
                    onClick={() => changeQty(c.id, -1)}
                  >−</button>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{c.qty}</span>
                  <button
                    style={{ ...qtyBtnStyle, width: 24, height: 24, fontSize: 12 }}
                    onClick={() => changeQty(c.id, +1)}
                  >+</button>
                  <button
                    style={{ ...qtyBtnStyle, width: 24, height: 24, fontSize: 10, color: C.red }}
                    onClick={() => removeItem(c.id)}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Catatan */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowNote(!showNote)}
              style={{ fontSize: 12, color: C.gray500, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <span style={{ display: "flex" }}>{Ic.note}</span> {orderNote ? "Ubah catatan" : "Tambah catatan lainnya"}
            </button>
            {showNote && (
              <textarea
                rows={2}
                placeholder="Contoh: Level kepedasan 10, pisahkan sambal..."
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${C.gray200}`,
                  fontSize: 12,
                  resize: "vertical"
                }}
              />
            )}
          </div>
        </div>

        {/* RINCIAN PEMBAYARAN */}
        <div style={{
          background: C.gray50,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: C.gray900, marginBottom: 12 }}>Rincian Pembayaran</h4>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.gray600 }}>Subtotal ({cart.reduce((s, c) => s + c.qty, 0)} menu)</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.gray800 }}>Rp{totalCart.toLocaleString("id-ID")}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.gray600 }}>Pembulatan</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.gray800 }}>-Rp{Math.floor(totalCart % 1000).toLocaleString("id-ID")}</span>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: `1px dashed ${C.gray200}`,
            marginTop: 4
          }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: C.gray900 }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: C.red }}>
              Rp{(totalCart - Math.floor(totalCart % 1000)).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* METODE PEMBAYARAN */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: C.gray900, marginBottom: 10 }}>Metode Pembayaran</h4>
          <div style={{ display: "flex", gap: 10 }}>
            {["CASH", "CASHLESS"].map(m => (
              <button
                key={m}
                onClick={() => setMetode(m)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${metode === m ? C.red : C.gray200}`,
                  background: metode === m ? C.redLight : C.white,
                  color: metode === m ? C.red : C.gray600,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                {m === "CASH" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{Ic.cash} Cash / Tunai</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{Ic.card} Cashless (Online)</span>}
              </button>
            ))}
          </div>
        </div>

        {/* TOTAL PEMBAYARAN & TOMbol */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          borderTop: `1px solid ${C.gray100}`,
          marginTop: 8
        }}>
          <div>
            <div style={{ fontSize: 12, color: C.gray500 }}>Total Pembayaran</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: C.red }}>
              Rp{(totalCart - Math.floor(totalCart % 1000)).toLocaleString("id-ID")}
            </div>
          </div>
          <BtnRed onClick={submitOrder} style={{ padding: "12px 24px", fontSize: 14 }}>
            Lanjut Pembayaran
          </BtnRed>
        </div>
      </Modal>


      {/* Payment Modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="💳 Tagihan Pembayaran">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: C.gray900 }}>Instruksi Pembayaran</h3>
          <p style={{ fontSize: 13, color: C.gray600, marginTop: 4 }}>
            Silakan lakukan pembayaran ke Kantin Telkom Pusat (Admin). Total tagihan di bawah ini adalah gabungan seluruh keranjang Anda.
          </p>
        </div>

        {paymentOrders.length > 0 && (
          <div style={{ background: C.offWhite, borderRadius: 16, padding: "20px", marginBottom: 16, border: `1px solid ${C.gray100}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: `2px dashed ${C.gray200}`, paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: C.gray400, fontWeight: 600 }}>Tujuan Pembayaran</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Kantin Telkom (Admin)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: C.gray400, fontWeight: 600 }}>Grand Total</div>
                <div style={{ fontWeight: 900, fontSize: 22, color: C.red }}>
                  Rp{paymentOrders.reduce((sum, o) => sum + Number(o.transaksi?.total_bayar || 0), 0).toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            {paymentOrders[0]?.transaksi?.metode_bayar === "CASH" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 12, color: C.gray600, marginBottom: 8 }}>Nomor Pesanan Anda:</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.blue, letterSpacing: 2 }}>
                  #{paymentOrders.map(o => o.id).join(", #")}
                </div>
                <div style={{ fontSize: 13, color: C.gray600, marginTop: 16, background: C.white, padding: "16px", borderRadius: 10, border: `1px solid ${C.blueLight}` }}>
                  Silakan menuju ke Kasir Pusat Kantin Telkom, tunjukkan nomor pesanan di atas, dan lakukan pembayaran tunai. Admin akan memverifikasi pesanan Anda.
                </div>
              </div>
            )}

            {paymentOrders[0]?.transaksi?.metode_bayar === "QRIS" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: C.gray600, marginBottom: 8 }}>Nomor Pesanan Anda:</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.blue, letterSpacing: 2, marginBottom: 12 }}>
                  #{paymentOrders.map(o => o.id).join(", #")}
                </div>
                <div style={{ background: C.white, padding: "16px", borderRadius: 12, display: "inline-block", border: `1px solid ${C.gray200}`, marginBottom: 12 }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QRIS Kantin Telkom" style={{ width: 180, height: 180, opacity: 0.9 }} />
                </div>
                <div style={{ fontSize: 13, color: C.gray600, textAlign: "left", background: C.white, padding: "16px", borderRadius: 10, border: `1px solid ${C.blueLight}` }}>
                  <strong style={{ display: "block", marginBottom: 8 }}>Cara Bayar:</strong>
                  1. Buka aplikasi M-Banking atau e-Wallet Anda.<br />
                  2. Pilih menu Scan QRIS.<br />
                  3. Scan gambar QRIS Kantin Telkom di atas.<br />
                  4. Masukkan Grand Total tepat <strong>Rp{paymentOrders.reduce((sum, o) => sum + Number(o.transaksi?.total_bayar || 0), 0).toLocaleString("id-ID")}</strong>.<br />
                  5. Tunjukkan bukti transfer ke kasir pusat untuk diverifikasi.
                </div>
              </div>
            )}

            {paymentOrders[0]?.transaksi?.metode_bayar === "TRANSFER" && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: C.gray600, marginBottom: 8 }}>Nomor Pesanan Anda:</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: C.blue, letterSpacing: 2 }}>
                    #{paymentOrders.map(o => o.id).join(", #")}
                  </div>
                </div>

                <Sel label="Pilih Bank Tujuan (Kantin Telkom)" value={bankTransfer} onChange={e => setBankTransfer(e.target.value)}>
                  <option value="BCA">BCA</option>
                  <option value="MANDIRI">Mandiri</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                </Sel>

                <div style={{ background: C.white, padding: "20px", borderRadius: 12, border: `1px dashed ${C.blue}`, textAlign: "center", marginBottom: 16, marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: C.gray600 }}>Nomor Rekening {bankTransfer}:</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.gray900, margin: "6px 0", letterSpacing: 2 }}>
                    {bankTransfer === "BCA" ? "8720 1234 567" : bankTransfer === "MANDIRI" ? "1370 0012 3456" : bankTransfer === "BRI" ? "0012 0102 3456 789" : "0123 4567 89"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700 }}>a.n. Kantin Telkom Pusat</div>
                </div>
              </div>
            )}
          </div>
        )}
        <BtnRed full onClick={() => setPaymentModal(false)}>Saya Sudah Bayar</BtnRed>
      </Modal>
    </>
  );
}

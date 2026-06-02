import { C } from "../../styles/tokens";
import { BtnRed, BtnGhost } from "./Button";

const PlateIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.gray200} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
);

export default function MenuCard({ m, role, onEdit, onDel, onCart }) {
  const isMerchant = role === "MERCHANT";
  const isPelanggan = role === "PELANGGAN";
  const inStock = Number(m.stok) > 0;

  return (
    <div className="card-hover" style={{
      background: C.white, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.gray100}`,
      boxShadow: "0 1px 4px rgba(16,24,40,.06)",
    }}>
      {/* Image */}
      <div style={{
        height: 120, position: "relative",
        background: C.gray50,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {m.gambar
          ? <img src={m.gambar.startsWith("http") ? m.gambar : `http://localhost:8000/storage/${m.gambar}`}
              alt={m.nama_menu}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          : <PlateIcon />
        }
        {!inStock && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(16,24,40,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: C.danger, color: C.white, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50, letterSpacing: "0.5px" }}>HABIS</span>
          </div>
        )}
        {m.kategori && (
          <span style={{
            position: "absolute", top: 8, right: 8,
            fontSize: 10, background: C.white, color: C.gray600,
            padding: "2px 7px", borderRadius: 4, fontWeight: 600,
            boxShadow: "0 1px 4px rgba(16,24,40,.1)",
          }}>{m.kategori}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 6px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.gray900, marginBottom: 2 }}>{m.nama_menu}</div>
        <div style={{ fontSize: 11, color: C.gray400, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
          {m.merchant?.user?.foto_profil && (
            <img src={m.merchant.user.foto_profil} alt="" style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} />
          )}
          {m.merchant?.nama_merchant}
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.red }}>Rp{Number(m.harga).toLocaleString("id-ID")}</div>
        <div style={{ fontSize: 11, marginTop: 2, color: inStock ? C.success : C.danger, fontWeight: 600 }}>
          Stok: {inStock ? m.stok : "Habis"}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "6px 12px 12px", display: "flex", gap: 6 }}>
        {(isMerchant || role === "ADMIN") && <>
          <BtnGhost small style={{ flex: 1 }} onClick={() => onEdit(m)}>Edit</BtnGhost>
          <BtnGhost small danger onClick={() => onDel(m.id)}>Hapus</BtnGhost>
        </>}
        {isPelanggan && inStock && <BtnRed small full onClick={() => onCart(m)}>+ Keranjang</BtnRed>}
      </div>
    </div>
  );
}

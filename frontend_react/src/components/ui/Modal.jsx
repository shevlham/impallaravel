import { useEffect } from "react";
import { C } from "../../styles/tokens";

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(16,24,40,.5)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 500, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.white, borderRadius: 16, padding: "24px 24px 20px",
        width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(16,24,40,.22)", animation: "fadeUp .22s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.gray900 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: C.gray50, border: "none", cursor: "pointer",
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.gray500, transition: "background .15s",
          }}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

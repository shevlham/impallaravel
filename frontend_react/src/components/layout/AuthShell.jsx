import { C } from "../../styles/tokens";

export default function AuthShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", overflow: "hidden" }}>

      {/* LEFT: hero panel — 40% lebar layar, hanya tampil di desktop */}
      <div className="hide-mobile" style={{
        flex: "0 0 40%",
        minHeight: "100vh",
        background: C.sidebarBg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 52px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative subtle glow */}
        <div style={{ position: "absolute", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(240,68,56,0.12) 0%, transparent 70%)", top: "-10%", right: "-15%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)", bottom: "10%", left: "-10%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Logo */}
          <div 
            className="logo-glow-effect"
            style={{ width: 96, height: 96, borderRadius: 20, overflow: "hidden", marginBottom: 36, cursor: "pointer" }}
          >
            <img src="/logo.png" alt="TelEat Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "clamp(28px, 3vw, 40px)", color: C.white, lineHeight: 1.2, marginBottom: 18 }}>
            Pesan makanan<br />favoritmu,<br /><span style={{ color: C.red }}>kapan saja.</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,.55)", fontSize: "clamp(14px, 1.2vw, 16px)", lineHeight: 1.7, marginBottom: 40 }}>
            Nikmati kemudahan memesan di kantin Telkom&nbsp;— tanpa antre, langsung dari HP-mu.
          </p>

        {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                ),
                text: "Pesan cepat & mudah"
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                ),
                text: "Tanpa antre panjang"
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                ),
                text: "Cash & Cashless"
              },
            ].map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, background: "rgba(255,255,255,.12)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.9)", flexShrink: 0 }}>{f.icon}</div>
                <span style={{ color: "rgba(255,255,255,.88)", fontSize: 14, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: form panel — mengisi sisa layar */}
      <div style={{
        flex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.white,
        overflowY: "auto",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp .32s ease" }}>

          {/* Mobile-only logo */}
          <div className="hide-desktop" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div 
              className="logo-glow-effect"
              style={{ width: 88, height: 88, borderRadius: 18, overflow: "hidden" }}
            >
              <img src="/logo.png" alt="TelEat Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>

          {children}
        </div>
      </div>

    </div>
  );
}

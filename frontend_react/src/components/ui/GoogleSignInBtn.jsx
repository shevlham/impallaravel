import { useState, useEffect, useRef } from "react";
import { C } from "../../styles/tokens";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch, loadGSI, GOOGLE_CID } from "../../services/api";
import Spinner from "./Spinner";

let globalCallback = null;

export default function GoogleSignInBtn() {
  const { login } = useAuth();
  const toast = useToast();
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const loginRef = useRef(login);
  const toastRef = useRef(toast);
  loginRef.current = login;
  toastRef.current = toast;

  useEffect(() => {
    globalCallback = async ({ credential }) => {
      try {
        const res = await apiFetch("POST", "/auth/google/callback", { id_token: credential });
        loginRef.current(res.user, res.token);
        toastRef.current("Berhasil masuk dengan Google! 🎉");
      } catch (err) {
        toastRef.current(err.message, "error");
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      await loadGSI();
      if (!window.google || !GOOGLE_CID) { setLoaded(true); return; }
      
      if (!window._gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CID,
          callback: (res) => {
            if (globalCallback) globalCallback(res);
          },
          ux_mode: "popup",
        });
        window._gsiInitialized = true;
      }

      if (ref.current) {
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline", size: "large", width: 360, shape: "rectangular",
          text: "continue_with", logo_alignment: "center"
        });
      }
      setLoaded(true);
    })();
  }, []);

  if (!GOOGLE_CID) {
    return (
      <button className="btn-hover" style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "11px 16px", border: `1.5px solid ${C.gray200}`, borderRadius: 10,
        background: C.white, cursor: "pointer", fontWeight: 600, fontSize: 14, color: C.gray800,
        boxShadow: `0 2px 6px rgba(15,23,42,.06)`,
      }}
        onClick={() => toast("Tambahkan VITE_GOOGLE_CLIENT_ID di file .env!", "warn")}
      >
        <GoogleSVG />
        Lanjutkan dengan Google
      </button>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: 44 }}>
      <div ref={ref} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
      {!loaded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.gray400, fontSize: 13, height: 44 }}>
          <Spinner size={16} /> Memuat Google…
        </div>
      )}
    </div>
  );
}

function GoogleSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.3 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.3 29 5 24 5 16.3 5 9.7 9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c4.9 0 9.3-1.9 12.7-4.9l-5.9-5c-1.8 1.3-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.4l-6.5 5C9.5 41 16.2 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l5.9 5c-.4.4 6.3-4.6 6.3-13.5 0-1.3-.1-2.6-.4-3.8z" />
    </svg>
  );
}

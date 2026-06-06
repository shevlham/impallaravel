import { createContext, useContext, useState, useCallback } from "react";
import { apiFetch } from "../services/api";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { 
    try { 
        return JSON.parse(localStorage.getItem("te_user") || "null"); 
    } catch { 
        return null; 
    } 
  });
  const [token, setToken] = useState(() => localStorage.getItem("te_token") || "");

  const login = useCallback((u, t) => {
    setUser(u); 
    setToken(t);
    localStorage.setItem("te_user", JSON.stringify(u));
    localStorage.setItem("te_token", t);
  }, []);

  const logout = useCallback(async (tok) => {
    try { 
        await apiFetch("POST", "/logout", null, tok || token); 
    } catch { 
        // ignore logout error
    }
    setUser(null); 
    setToken("");
    localStorage.removeItem("te_user");
    localStorage.removeItem("te_token");
  }, [token]);

  return (
    <AuthCtx.Provider value={{ user, token, login, logout }}>
        {children}
    </AuthCtx.Provider>
  );
}

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
export const GOOGLE_CID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export async function apiFetch(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    if (body instanceof FormData) {
        delete headers["Content-Type"]; // Let browser set boundary
        options.body = body;
    } else {
        options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(API_URL + path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function loadGSI() {
  return new Promise(resolve => {
    if (window.google?.accounts) { resolve(); return; }
    const existing = document.getElementById("gsi-script");
    if (existing) { existing.addEventListener("load", resolve); return; }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true; s.onload = resolve;
    document.head.appendChild(s);
  });
}


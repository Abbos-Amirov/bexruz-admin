import axios from "axios";
import { serverApi } from "./config";

/** Admin tokeni: IP (http) orqali cookie saqlanmagani uchun header bilan yuboriladi */
export const ADMIN_TOKEN_KEY = "bexruz_admin_token";

export const getAdminToken = (): string | null => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string | null | undefined) => {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem("memberData");
};

let installed = false;

/** Barcha backend so'rovlariga tokenni qo'shadi; 401 bo'lsa login sahifasiga qaytaradi */
export function installAdminAuth() {
  if (installed) return;
  installed = true;

  axios.interceptors.request.use((config) => {
    const token = getAdminToken();
    if (token && String(config.url ?? "").startsWith(serverApi)) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const url = String(err?.config?.url ?? "");
      if (err?.response?.status === 401 && url.includes("/admin/")) {
        clearAdminSession();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }
      }
      return Promise.reject(err);
    }
  );
}

import { io } from "socket.io-client";

const apiBase =
  process.env.REACT_APP_API_URL || "http://38.247.134.248:4013";
export const serverApi: string = apiBase;
/** Rasmlar uchun backend URL (proxy bypass, to'g'ridan-to'g'ri so'rov) */
export const imageBaseUrl: string = apiBase;
/** Admin panel URL (logout redirect) */
export const frontendUrl: string =
  process.env.REACT_APP_FRONTEND_URL || "http://38.247.134.248:3013";
/** BEXRUZ client frontend - QR kod orqali mijozlar shu linkga yo'naltiriladi */
export const clientUrl: string =
  process.env.REACT_APP_CLIENT_URL || "http://38.247.134.248:3014";

export const socket = io(apiBase, {
  transports: ["websocket"],
  // Admin xonasiga faqat token bilan ulaniladi; ContextProvider login bo'lganda ulaydi
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("bexruz_admin_token") ?? "" }),
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});
export const Messages = {
  error1: "Something went wrong!",
  error2: "Please login first!",
  error3: "Please fulfill all inputs!",
  error4: "Message is empty!",
  error5: "Only images with jpeg, jpg, png format allowed!",
};

export function dateFmt(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

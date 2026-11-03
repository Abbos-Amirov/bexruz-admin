import React, { ReactNode, useEffect, useRef, useState } from "react";
import Cookies from "universal-cookie";
import { Member } from "../../lib/types/member";
import { GlobalContext } from "../hooks/useGlobals";
import { socket } from "../../lib/config";
import { Notification } from "../../lib/types/notif";
import NotificationService from "../../services/Notification.service";
import { useDispatch, useSelector } from "react-redux";
import { retrieveTableStatus } from "../../screens/dashboardPage/selector";
import { setTableStatus } from "../../screens/dashboardPage/slice";
import { Table } from "../../lib/types/table";
import { TableCall } from "../../lib/enums/tableCall.enum";

const playNotificationSound = () => {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 900;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // autoplay policy bo'lishi mumkin
  }
};

const playNotificationVibration = () => {
  if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
};

const extractTableNumber = (text: string): string | null => {
  const m = text.match(/(?:Table|Stol|Стол)\s*:?\s*(\d+)/i);
  return m ? m[1] : null;
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value || value === "undefined" || value === "null") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const ContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const tableStatus = useSelector(retrieveTableStatus);
  const [authMember, setAuthMember] = useState<Member | null>(() =>
    safeParse<Member | null>(localStorage.getItem("memberData"), null)
  );

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const parsed = safeParse<unknown>(localStorage.getItem("notifications"), []);
    return Array.isArray(parsed) ? (parsed as Notification[]) : [];
  });

  const [darkMode, setDarkMode] = useState<boolean>(() =>
    safeParse<boolean>(localStorage.getItem("darkMode"), true)
  );

  const [notificationAlert, setNotificationAlert] = useState<Notification | null>(null);
  const notificationsRef = useRef<Notification[]>([]);
  const tableStatusRef = useRef<Table[]>([]);
  const isInitialNotifSyncDoneRef = useRef(false);

  useEffect(() => {
    notificationsRef.current = Array.isArray(notifications) ? notifications : [];
  }, [notifications]);

  useEffect(() => {
    tableStatusRef.current = Array.isArray(tableStatus) ? (tableStatus as Table[]) : [];
  }, [tableStatus]);

  useEffect(() => {
    const cookies = new Cookies();
    const accessToken = cookies.get("accessToken");

    if (!accessToken) {
      localStorage.removeItem("memberData");
      setAuthMember(null);
    } else {
      const storedMember = localStorage.getItem("memberData");
      if (storedMember && !authMember) {
        const parsed = safeParse<Member | null>(storedMember, null);
        if (parsed) setAuthMember(parsed);
      }
      // Admin kirganida bazadagi notificationlarni yuklash (real-time dan tashqari)
      const notifSvc = new NotificationService();
      notifSvc.getNotifications().then((list) => {
        if (list.length > 0) setNotifications(list);
      });
    }
  }, []);

  // Socket ishlamasa ham qo'ng'iroqcha realtimega yaqin yangilanib turishi uchun polling
  useEffect(() => {
    if (!authMember) return;
    let alive = true;
    const notifSvc = new NotificationService();

    const syncNotifications = async () => {
      const incoming = await notifSvc.getNotifications();
      if (!alive || !Array.isArray(incoming) || incoming.length === 0) return;

      const prevList = notificationsRef.current;
      const prevMap = new Map(prevList.map((n) => [n.id, n]));
      const merged = incoming.map((n) => {
        const existing = prevMap.get(n.id);
        // Agar user o'qib bo'lgan bo'lsa, read=true saqlanib qolsin
        return existing ? { ...n, read: existing.read ?? n.read } : n;
      });

      setNotifications(merged);

      // Birinchi syncda eski xabarlarga alert chiqarmaymiz.
      if (!isInitialNotifSyncDoneRef.current) {
        isInitialNotifSyncDoneRef.current = true;
        return;
      }

      const newestIncoming = merged.find((n) => !prevMap.has(n.id));
      if (newestIncoming) {
        if (newestIncoming.type === "CALL" && newestIncoming.tableId) {
          const current = tableStatusRef.current;
          if (Array.isArray(current) && current.length > 0) {
            const next = current.map((t) =>
              t._id === newestIncoming.tableId
                ? { ...t, tableCall: TableCall.ACTIVE }
                : t
            );
            dispatch(setTableStatus(next));
          }
        }
        playNotificationSound();
        playNotificationVibration();
        setNotificationAlert(newestIncoming);
      }
    };

    syncNotifications();
    const id = window.setInterval(syncNotifications, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [authMember, dispatch]);

  useEffect(() => {
    if (authMember) {
      localStorage.setItem("memberData", JSON.stringify(authMember));
    } else {
      localStorage.removeItem("memberData");
    }
  }, [authMember]);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    } else {
      localStorage.removeItem("notifications");
    }
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const setSpecificTableCallActive = (tableId: string | null | undefined) => {
      if (!tableId) return;
      const current = tableStatusRef.current;
      if (!Array.isArray(current) || current.length === 0) return;
      const next = current.map((t) =>
        t._id === tableId ? { ...t, tableCall: TableCall.ACTIVE } : t
      );
      dispatch(setTableStatus(next));
    };

    const toNotification = (raw: Notification & Record<string, unknown>): Notification => {
      const notifType = String(raw.type ?? raw.notifType ?? "").toUpperCase();
      const normalizedType: Notification["type"] =
        notifType === "ORDER" ? "ORDER"
        : notifType === "CALL" || notifType === "TABLE_CALL" ? "CALL"
        : undefined;
      const title = String(raw.title ?? "");
      const message = String(raw.message ?? raw.title ?? "Yangi xabar");
      const tableNumberFromText = extractTableNumber(`${title} ${message}`);
      return {
        id: String(
          raw.id ??
          raw._id ??
          `${raw.createdAt ?? Date.now()}-${raw.tableId ?? raw.table_id ?? ""}-${raw.message ?? raw.title ?? ""}`
        ),
        title,
        message,
        status: String(raw.status ?? raw.notifStatus ?? ""),
        read: false,
        type: normalizedType,
        tableId: (raw.tableId ?? raw.table_id ?? null) as string | null,
        tableNumber: (raw.tableNumber ?? raw.table_number ?? tableNumberFromText ?? null) as string | null,
        orderId: (raw.orderId ?? raw.order_id ?? null) as string | null,
      };
    };

    const appendIncoming = (payload: Notification & Record<string, unknown>) => {
      const fullNotif = toNotification(payload);
      playNotificationSound();
      playNotificationVibration();
      if (fullNotif.type === "CALL") {
        setSpecificTableCallActive(fullNotif.tableId);
      }
      setNotificationAlert(fullNotif);
      setNotifications((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((n) => n.id === fullNotif.id)) return list;
        return [fullNotif, ...list];
      });
    };

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err.message);
    });

    socket.on("newNotification", appendIncoming);
    socket.on("notification", appendIncoming);
    socket.on("newOrder", appendIncoming);
    socket.on("newCall", appendIncoming);

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("newNotification", appendIncoming);
      socket.off("notification", appendIncoming);
      socket.off("newOrder", appendIncoming);
      socket.off("newCall", appendIncoming);
    };
  }, [dispatch]);

  return (
    <GlobalContext.Provider
      value={{
        authMember,
        setAuthMember,
        notifications,
        setNotifications,
        notificationAlert,
        setNotificationAlert,
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default ContextProvider;

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useNavigate } from "react-router-dom";
import { useGlobals } from "../../hooks/useGlobals";
import { useDispatch, useSelector } from "react-redux";
import TableService from "../../../services/Table.service";
import { TableCall } from "../../../lib/enums/tableCall.enum";
import { setTableStatus } from "../../../screens/dashboardPage/slice";
import { retrieveTableStatus } from "../../../screens/dashboardPage/selector";
import { Table } from "../../../lib/types/table";

export default function NotificationAlertDialog() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { notificationAlert, setNotificationAlert } = useGlobals();
  const dispatch = useDispatch();
  const tableStatus = useSelector(retrieveTableStatus);

  const open = Boolean(notificationAlert);
  const isCall = notificationAlert?.type === "CALL";
  const isOrder = notificationAlert?.type === "ORDER";
  const lang = i18n.resolvedLanguage || i18n.language || "uz";

  const dict = useMemo(() => {
    if (lang === "ru") {
      return {
        typeCall: "Вызов официанта",
        typeOrder: "Новый заказ",
        table: "Стол",
        fromTable: "Со стола",
        gotIt: "Понятно",
        openDetails: "Подробнее",
      };
    }
    if (lang === "en") {
      return {
        typeCall: "Waiter Call",
        typeOrder: "New Order",
        table: "Table",
        fromTable: "From table",
        gotIt: "Got it",
        openDetails: "Open details",
      };
    }
    if (lang === "uz-Cyrl") {
      return {
        typeCall: "Официант чақируви",
        typeOrder: "Янги буюртма",
        table: "Стол",
        fromTable: "Қайси столдан",
        gotIt: "Тушундим",
        openDetails: "Батафсил",
      };
    }
    return {
      typeCall: "Ofitsiant chaqiruvi",
      typeOrder: "Yangi buyurtma",
      table: "Stol",
      fromTable: "Qaysi stoldan",
      gotIt: "Tushundim",
      openDetails: "Batafsil",
    };
  }, [lang]);

  const tableNumber = useMemo(() => {
    if (!notificationAlert) return null;
    if (notificationAlert.tableNumber) return notificationAlert.tableNumber;
    const sourceText = `${notificationAlert.message || ""} ${notificationAlert.title || ""}`;
    const m = sourceText.match(/(?:Table|Stol|Стол)\s*:?\s*(\d+)/i);
    return m ? m[1] : null;
  }, [notificationAlert]);

  const clearSpecificTableCall = async () => {
    if (!notificationAlert?.tableId || !isCall) return;
    // Avval UI da shu stolning call ikonkasini o'chiramiz
    if (Array.isArray(tableStatus) && tableStatus.length > 0) {
      const updated = (tableStatus as Table[]).map((t) =>
        t._id === notificationAlert.tableId ? { ...t, tableCall: TableCall.PAUSE } : t
      );
      dispatch(setTableStatus(updated));
    }
    // Keyin backendga ham mark as read (tableCall=PAUSE) yuboramiz
    try {
      const tableSvc = new TableService();
      await tableSvc.updateChosenTable({
        _id: notificationAlert.tableId,
        tableCall: TableCall.PAUSE,
      });
    } catch {
      // Bu xatoni jim qoldiramiz: UI allaqachon o'chirilgan, keyingi fetch baribir sync qiladi
    }
  };

  const handleClose = () => {
    clearSpecificTableCall().then();
    setNotificationAlert(null);
  };

  const handleGoToDetails = () => {
    const n = notificationAlert;
    if (!n) return;
    const resolvedTableNum = n.tableNumber || tableNumber;
    // Stol ma'lum bo'lsa — Kassada o'sha stol ochiladi; aks holda buyurtma batafsili
    if (resolvedTableNum) {
      navigate(`/kassa?table=${encodeURIComponent(resolvedTableNum)}`);
    } else if (isOrder && n.orderId) {
      navigate(`/orders/${n.orderId}`);
    } else {
      navigate("/kassa");
    }
    setNotificationAlert(null);
  };

  if (!notificationAlert) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 0 }}>
        {isCall && (
          <Chip
            icon={<PhoneInTalkIcon sx={{ fontSize: 22 }} />}
            label={dict.typeCall}
            color="primary"
            size="medium"
            sx={{ fontSize: 16, fontWeight: 600 }}
          />
        )}
        {isOrder && (
          <Chip
            icon={<ShoppingCartIcon sx={{ fontSize: 22 }} />}
            label={dict.typeOrder}
            color="success"
            size="medium"
            sx={{ fontSize: 16, fontWeight: 600 }}
          />
        )}
        {!isCall && !isOrder && (
          <Chip
            icon={<TableRestaurantIcon sx={{ fontSize: 18 }} />}
            label={t("notificationAlert.newNotification") || "Bildirishnoma"}
            size="small"
          />
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        {(notificationAlert.tableId || tableNumber) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, color: "text.secondary" }}>
            <TableRestaurantIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontSize: 20, fontWeight: 700 }}>
              {dict.fromTable}: {dict.table} {tableNumber || notificationAlert.tableId}
            </Typography>
          </Box>
        )}
        <Typography variant="body1" color="text.primary">
          {notificationAlert.message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          {dict.gotIt}
        </Button>
        {(notificationAlert.tableId || notificationAlert.orderId || tableNumber) && (
          <Button onClick={handleGoToDetails} variant="contained">
            {dict.openDetails}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

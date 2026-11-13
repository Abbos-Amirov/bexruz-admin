import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dispatch } from "@reduxjs/toolkit";
import { Box, Dialog, DialogContent, IconButton, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import { setTableStatus } from "../dashboardPage/slice";
import { TableInquiry } from "../../lib/types/table";
import TableService from "../../services/Table.service";
import { socket } from "../../lib/config";
import TableInfo from "../dashboardPage/TableStatus";
import { TableOrdersCard, useTableOrders } from "../dashboardPage/TableStatusTop";
import "../../css/tableStatus.css";

const actionDispatch = (dispatch: Dispatch) => ({
  setTableStatus: (data: any[]) => dispatch(setTableStatus(data)),
});

/** Admin stolni ochib ko'rgan buyurtmalar — "Yangi" belgisi shular uchun chiqmaydi */
const SEEN_KEY = "orderStatus_seenOrderIds";
/** Stollar holati (band / tozalanmoqda / bo'sh, chaqiruv) shu oraliqda yangilanadi */
const TABLES_REFRESH_MS = 10000;

const readSeen = (): Record<string, string[]> => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
};

/**
 * Kassa: chapda stollar, o'ngda tanlangan stolning buyurtmalari
 * (taomlar, taomni bekor qilish, Berildi, Chek, To'landi).
 * Kichik ekranda o'ng panel o'rniga oyna ochiladi.
 */
export default function KassaPage() {
  const { t } = useTranslation();
  const { setTableStatus } = actionDispatch(useDispatch());
  const isWide = useMediaQuery("(min-width:1101px)");
  const [inquiry, setInquiry] = useState<TableInquiry>({ limit: 1000, page: 1 });
  const [params, setParams] = useSearchParams();
  // /kassa?table=5 — bildirishnoma yoki Stollar sahifasidan kelganda stol darhol ochiladi
  const [selected, setSelectedState] = useState<string | null>(() => params.get("table"));
  const setSelected = useCallback(
    (table: string | null) => {
      setSelectedState(table);
      setParams(table ? { table } : {}, { replace: true });
    },
    [setParams]
  );
  const [seen, setSeen] = useState<Record<string, string[]>>(readSeen);
  const {
    groupedOrders,
    deliveredOrderIds,
    handleDelivered,
    handleCompleteTableOrders,
    handleCancelItem,
  } = useTableOrders();

  const loadTables = useCallback(() => {
    new TableService()
      .getAllTables(inquiry)
      .then((data) => setTableStatus(data))
      .catch((err) => console.warn("getAllTables:", err));
  }, [inquiry, setTableStatus]);

  // Stollar: darhol, har 10 soniyada va server xabar berganda (chaqiruv, stol bo'shadi, yangi buyurtma)
  useEffect(() => {
    loadTables();
    const id = window.setInterval(loadTables, TABLES_REFRESH_MS);
    const events = ["tablesUpdated", "tableCall", "newNotification", "orderCreated", "orderUpdated"];
    events.forEach((e) => socket.on(e, loadTables));
    return () => {
      window.clearInterval(id);
      events.forEach((e) => socket.off(e, loadTables));
    };
  }, [loadTables]);

  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {}
  }, [seen]);

  const orderCounts = useMemo(() => {
    const result: Record<string, number> = {};
    Object.entries(groupedOrders).forEach(([table, orders]) => (result[table] = orders.length));
    return result;
  }, [groupedOrders]);

  const newCounts = useMemo(() => {
    const result: Record<string, number> = {};
    Object.entries(groupedOrders).forEach(([table, orders]) => {
      const seenIds = new Set(seen[table] ?? []);
      const fresh = orders.filter((o) => !seenIds.has(o.orderId)).length;
      if (fresh > 0) result[table] = fresh;
    });
    return result;
  }, [groupedOrders, seen]);

  const markSeen = useCallback(
    (tableNumber: string) => {
      const ids = (groupedOrders[tableNumber] ?? []).map((o) => o.orderId);
      setSeen((prev) => ({ ...prev, [tableNumber]: ids }));
    },
    [groupedOrders]
  );

  // Ochiq turgan stolga kelgan buyurtmalar ham "ko'rilgan" bo'ladi
  useEffect(() => {
    if (selected) markSeen(selected);
  }, [selected, markSeen]);

  const orders = selected ? groupedOrders[selected] ?? [] : [];

  const card = selected ? (
    <TableOrdersCard
      tableNumber={selected}
      orders={orders}
      deliveredIds={deliveredOrderIds[selected]}
      onDelivered={(e) => handleDelivered(selected, orders, e)}
      onCancelItem={handleCancelItem}
      onPaid={async () => {
        const table = selected;
        if (!isWide) setSelected(null);
        await handleCompleteTableOrders(table);
        loadTables();
      }}
    />
  ) : null;

  return (
    <Box className="kassa-layout">
      <TableInfo
        title={t("sidebar.kassa")}
        inquiry={inquiry}
        setInquiry={setInquiry}
        orderCounts={orderCounts}
        newCounts={newCounts}
        selectedTable={selected}
        onTableClick={(table) => setSelected(table.tableNumber)}
      />

      {isWide ? (
        <Box className="kassa-panel" component="aside">
          {card ?? (
            <div className="kassa-empty">
              <TouchAppRoundedIcon />
              <span>{t("kassa.pickTable")}</span>
            </div>
          )}
        </Box>
      ) : (
        <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm" scroll="paper">
          <IconButton
            aria-label="close"
            onClick={() => setSelected(null)}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 2 }}>{card}</DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dispatch } from "@reduxjs/toolkit";
import { Box, Button, Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { setTableStatus } from "../dashboardPage/slice";
import { TableInquiry } from "../../lib/types/table";
import TableService from "../../services/Table.service";
import TableInfo from "../dashboardPage/TableStatus";
import { TableOrdersCard, useTableOrders } from "../dashboardPage/TableStatusTop";

const actionDispatch = (dispatch: Dispatch) => ({
  setTableStatus: (data: any[]) => dispatch(setTableStatus(data)),
});

/** Admin stolni ochib ko'rgan buyurtmalar — "Yangi" belgisi shular uchun chiqmaydi */
const SEEN_KEY = "orderStatus_seenOrderIds";

const readSeen = (): Record<string, string[]> => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
};

/**
 * "Buyurtmalar holati": faqat stollar setkasi. Buyurtma kelgan stolda belgi chiqadi,
 * stol bosilganda o'sha stolning buyurtmalari (Berildi / Chek / To'landi) ochiladi.
 */
export default function OrderStatusPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTableStatus } = actionDispatch(useDispatch());
  const [inquiry, setInquiry] = useState<TableInquiry>({ limit: 1000, page: 1 });
  const [openTable, setOpenTable] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, string[]>>(readSeen);
  const { groupedOrders, deliveredOrderIds, handleDelivered, handleCompleteTableOrders } = useTableOrders();

  useEffect(() => {
    const table = new TableService();
    table
      .getAllTables(inquiry)
      .then((data) => setTableStatus(data))
      .catch((err) => console.warn("getAllTables:", err));
  }, [inquiry, setTableStatus]);

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

  // Dialog ochiq turganda kelgan buyurtmalar ham "ko'rilgan" bo'ladi
  useEffect(() => {
    if (openTable) markSeen(openTable);
  }, [openTable, markSeen]);

  const orders = openTable ? groupedOrders[openTable] ?? [] : [];

  return (
    <Box sx={{ width: "100%" }}>
      <TableInfo
        inquiry={inquiry}
        setInquiry={setInquiry}
        orderCounts={orderCounts}
        newCounts={newCounts}
        onTableClick={(table) => setOpenTable(table.tableNumber)}
        headerAction={
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<ListAltRoundedIcon />}
            onClick={() => navigate("/orders-panel/all")}
          >
            {t("orderStatus.allDetail")}
          </Button>
        }
      />

      <Dialog
        open={Boolean(openTable)}
        onClose={() => setOpenTable(null)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
      >
        <IconButton
          aria-label="close"
          onClick={() => setOpenTable(null)}
          sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, pt: { xs: 6, sm: 6 } }}>
          {openTable && (
            <TableOrdersCard
              tableNumber={openTable}
              orders={orders}
              deliveredIds={deliveredOrderIds[openTable]}
              onDelivered={(e) => handleDelivered(openTable, orders, e)}
              onPaid={async () => {
                const table = openTable;
                setOpenTable(null);
                await handleCompleteTableOrders(table);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

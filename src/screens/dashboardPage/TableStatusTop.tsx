import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography, Stack, Box, Divider, Chip, Button, Paper, IconButton, Tooltip } from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { createSelector } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { retrieveTableStatus } from "./selector";
import { Table } from "../../lib/types/table";
import OrderService from "../../services/Order.service";
import { serverApi, socket } from "../../lib/config";
import { setTableStatus } from "./slice";
import { TableStatus } from "../../lib/enums/table.enum";
import TableService from "../../services/Table.service";
import { printReceipt } from "../../lib/printReceipt";
import { sweetErrorHandling } from "../../lib/sweetAlert";
import "../../css/tableStatus.css";

const tableStatusRetriever = createSelector(
  retrieveTableStatus,
  (tableStatus) => ({ tableStatus })
);

const STORAGE_KEY = "orderStatus_deliveredOrderIds";

const parseStored = (): Record<string, Set<string>> => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: Record<string, string[]> = JSON.parse(raw);
    const result: Record<string, Set<string>> = {};
    for (const [table, ids] of Object.entries(parsed)) {
      result[table] = new Set(Array.isArray(ids) ? ids : []);
    }
    return result;
  } catch {
    return {};
  }
};

const saveStored = (data: Record<string, Set<string>>) => {
  try {
    const toSave: Record<string, string[]> = {};
    for (const [table, set] of Object.entries(data)) {
      toSave[table] = Array.from(set);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
};

export type TableOrderView = {
  orderId: string;
  tableId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  products: { productName: string; productImage: string; quantity: number; price: number }[];
};

/**
 * "Buyurtmalar holati": ochiq stol buyurtmalarini yuklaydi (socket + 5s polling),
 * "Berildi" va "To'landi" amallarini beradi. Stollar setkasi va dialog shu hook'dan foydalanadi.
 */
export function useTableOrders() {  const dispatch = useDispatch();
  const { tableStatus } = useSelector(tableStatusRetriever);
  const [groupedOrders, setGroupedOrders] = useState<
    Record<string, TableOrderView[]>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  /** Berildi bosilganda o'sha paytda mavjud bo'lgan order ID lar; sessionStorage da saqlanadi */
  const [deliveredOrderIds, setDeliveredOrderIds] = useState<Record<string, Set<string>>>(parseStored);

  const resolveImageUrl = useCallback((path?: string | null): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = serverApi.endsWith("/") ? serverApi.slice(0, -1) : serverApi;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }, []);

  const fetchOrdersByTable = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: payload } = await axios.get(`${serverApi}/admin/orders/all/panel`, {
        withCredentials: true,
      });
      const panelRows: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.orders)
        ? payload.orders
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.orders)
        ? payload.data.orders
        : Array.isArray(payload?.rows)
        ? payload.rows
        : Array.isArray(payload?.result)
        ? payload.result
        : Array.isArray(payload?.tables)
        ? payload.tables
        : [];

      const grouped: Record<string, TableOrderView[]> = {};

      const mapOrderToView = (order: any) => {
        const orderType = String(order?.orderType ?? order?.order_type ?? "").toUpperCase();
        if (orderType && orderType !== "TABLE") return null;
        const orderStatus = String(order?.orderStatus ?? order?.order_status ?? "").toUpperCase();
        if (orderStatus === "COMPLETED" || orderStatus === "CANCELLED" || orderStatus === "CANCELED") return null;

        const orderItems = Array.isArray(order?.orderItems)
          ? order.orderItems
          : Array.isArray(order?.order_items)
          ? order.order_items
          : [];
        const productData = Array.isArray(order?.productData)
          ? order.productData
          : Array.isArray(order?.product_data)
          ? order.product_data
          : Array.isArray(order?.products)
          ? order.products
          : [];

        const productById = new Map<string, any>();
        productData.forEach((p: any) => {
          const pid = String(p?._id ?? p?.id ?? "").trim();
          if (pid) productById.set(pid, p);
        });

        const products = orderItems.map((item: any) => {
          const productId = String(
            item?.productId ?? item?.product_id ?? item?.product?._id ?? item?.product?.id ?? ""
          ).trim();
          const product = productById.get(productId) ?? item?.product ?? {};
          const images = Array.isArray(product?.productImages)
            ? product.productImages
            : Array.isArray(product?.product_images)
            ? product.product_images
            : [];
          const productImage = resolveImageUrl(images[0] ?? "");
          const quantity = Number(item?.itemQuantity ?? item?.item_quantity ?? item?.quantity ?? 0) || 0;
          const price =
            Number(item?.itemPrice ?? item?.item_price ?? product?.productPrice ?? product?.product_price ?? 0) || 0;

          return {
            productName: String(
              product?.productName ?? product?.product_name ?? item?.productName ?? item?.product_name ?? "Unknown product"
            ),
            productImage,
            quantity,
            price,
          };
        });

        return {
          orderId: String(order?._id ?? order?.id ?? ""),
          tableId: String(order?.tableId ?? order?.table_id ?? ""),
          orderStatus: String(order?.orderStatus ?? order?.order_status ?? ""),
          paymentStatus: String(order?.paymentStatus ?? order?.payment_status ?? ""),
          paymentMethod: String(order?.paymentMethod ?? order?.payment_method ?? ""),
          createdAt: String(order?.createdAt ?? order?.updatedAt ?? ""),
          products,
        };
      };

      panelRows.forEach((row: any) => {
        const nestedOrders = Array.isArray(row?.orders)
          ? row.orders
          : Array.isArray(row?.orderList)
          ? row.orderList
          : Array.isArray(row?.items)
          ? row.items
          : null;

        if (nestedOrders) {
          nestedOrders.forEach((order: any) => {
            const tableNumber = String(
              order?.tableNumber ??
                order?.table_number ??
                row?.tableNumber ??
                row?.table_number ??
                row?.table?.tableNumber ??
                row?.table?.table_number ??
                ""
            ).trim();
            if (!tableNumber) return;
            const orderView = mapOrderToView({
              ...order,
              tableNumber:
                order?.tableNumber ??
                order?.table_number ??
                row?.tableNumber ??
                row?.table_number ??
                row?.table?.tableNumber,
            });
            if (!orderView) return;
            if (!grouped[tableNumber]) grouped[tableNumber] = [];
            grouped[tableNumber].push(orderView);
          });
          return;
        }

        const tableNumber = String(
          row?.tableNumber ?? row?.table_number ?? row?.table?.tableNumber ?? row?.table?.table_number ?? ""
        ).trim();
        const orderView = mapOrderToView(row);
        if (!tableNumber || !orderView) return;
        if (!grouped[tableNumber]) grouped[tableNumber] = [];
        grouped[tableNumber].push(orderView);
      });

      setGroupedOrders(grouped);
    } catch (err) {
      console.error("fetchOrdersByTable error:", err);
      setGroupedOrders({});
    } finally {
      if (!silent) setLoading(false);
    }
  }, [resolveImageUrl]);

  useEffect(() => {
    fetchOrdersByTable();
  }, [fetchOrdersByTable]);

  useEffect(() => {
    saveStored(deliveredOrderIds);
  }, [deliveredOrderIds]);

  useEffect(() => {
    const refreshBySocket = () => {
      // faqat order oqimi bo'yicha yangilash
      fetchOrdersByTable(true);
    };
    const refreshByAnyOrderEvent = (eventName: string) => {
      if (String(eventName).toLowerCase().includes("order")) {
        fetchOrdersByTable(true);
      }
    };

    socket.on("newOrder", refreshBySocket);
    socket.on("orderCreated", refreshBySocket);
    socket.on("orderUpdated", refreshBySocket);
    socket.on("order", refreshBySocket);
    socket.onAny(refreshByAnyOrderEvent);

    return () => {
      socket.off("newOrder", refreshBySocket);
      socket.off("orderCreated", refreshBySocket);
      socket.off("orderUpdated", refreshBySocket);
      socket.off("order", refreshBySocket);
      socket.offAny(refreshByAnyOrderEvent);
    };
  }, [fetchOrdersByTable]);

  useEffect(() => {
    // Socket uzilib qolsa ham list eskirib qolmasligi uchun fallback
    const id = window.setInterval(() => {
      fetchOrdersByTable(true);
    }, 5000);

    return () => window.clearInterval(id);
  }, [fetchOrdersByTable]);

  const tableNumbers = useMemo(() => {
    const fromOrders = Object.keys(groupedOrders);
    const unique = Array.from(new Set(fromOrders)).filter(Boolean);
    return unique.sort((a, b) => Number(a) - Number(b));
  }, [groupedOrders]);

  const handleCompleteTableOrders = useCallback(
    async (tableNumber: string) => {
      const orders = groupedOrders[tableNumber] ?? [];
      const fromOrder = orders.find((o) => o.tableId)?.tableId;
      const fromStore = (Array.isArray(tableStatus) ? tableStatus : []).find(
        (t: Table) => String(t.tableNumber) === String(tableNumber)
      )?._id;
      const tableId = fromOrder || fromStore;
      if (!tableId) return;

      // Kartochka darhol yo'qolsin; xato bo'lsa qaytariladi
      const snapshot = groupedOrders[tableNumber];
      setGroupedOrders((prev) => {
        const next = { ...prev };
        delete next[tableNumber];
        return next;
      });

      try {
        const orderSvc = new OrderService();
        await orderSvc.completeTableOrders(tableId);

        // Stol holatini "tozalanmoqda"ga o‘tkazamiz (UIda darhol ko‘rinsin)
        const currentTables = Array.isArray(tableStatus) ? (tableStatus as Table[]) : [];
        if (currentTables.length > 0) {
          const nowIso = new Date().toISOString();
          const nextTables = currentTables.map((t) =>
            t._id === tableId
              ? { ...t, tableStatus: TableStatus.CLEANING, updatedAt: nowIso }
              : t
          );
          dispatch(setTableStatus(nextTables));
        }

        // Backend table status ham sync bo‘lsin
        const tableSvc = new TableService();
        await tableSvc.updateChosenTable({
          _id: tableId,
          tableStatus: TableStatus.CLEANING,
        });

        // Bu paneldan yo‘qolsin va delivered ro‘yxatdan o‘chirish
        setDeliveredOrderIds((prev) => {
          const next = { ...prev };
          delete next[String(tableNumber)];
          return next;
        });
        fetchOrdersByTable(true);
      } catch (err) {
        console.error("handleCompleteTableOrders error:", err);
        if (snapshot) setGroupedOrders((prev) => ({ ...prev, [tableNumber]: snapshot }));
        sweetErrorHandling(err);
      }
    },
    [dispatch, fetchOrdersByTable, groupedOrders, tableStatus]
  );

  const handleDelivered = useCallback((tableNumber: string, orders: { orderId: string }[], e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = new Set(orders.map((o) => o.orderId));
    setDeliveredOrderIds((prev) => ({ ...prev, [String(tableNumber)]: ids }));
  }, []);


  return {
    groupedOrders,
    loading,
    tableNumbers,
    deliveredOrderIds,
    handleDelivered,
    handleCompleteTableOrders,
    refresh: fetchOrdersByTable,
  };
}

interface TableOrdersCardProps {
  tableNumber: string;
  orders: TableOrderView[];
  deliveredIds?: Set<string>;
  onDelivered: (e: React.MouseEvent) => void;
  onPaid: () => void;
}

/** Bitta stolning buyurtmalari: taomlar, "Berildi", chek va "To'landi" */
export function TableOrdersCard(props: TableOrdersCardProps) {
  const { tableNumber, orders, deliveredIds, onDelivered, onPaid } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAnyDelivered = Boolean(deliveredIds && deliveredIds.size > 0);
  const tableTotal = orders.reduce(
    (sum, order) =>
      sum + order.products.reduce((orderSum, product) => orderSum + product.quantity * product.price, 0),
    0
  );

  return (
    <Paper
      className={`table-top-item table-order-box${hasAnyDelivered ? " table-order-has-delivered" : ""}`}
      sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.75rem" }, color: "primary.main" }}
        >
          Stol {tableNumber}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            color="info"
            disabled={orders.length === 0}
            onClick={onDelivered}
          >
            {t("dashboard.delivered")}
          </Button>
          <Chip size="small" label={t("dashboard.ordersCount", { count: orders.length })} variant="outlined" />
          <Button size="small" variant="text" onClick={() => navigate(`/orders-panel/table/${tableNumber}`)}>
            {t("dashboard.detail")}
          </Button>
        </Stack>
      </Stack>

      {orders.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("orderStatus.noOrders")}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {orders.map((order) => {
            const isOrderDelivered = Boolean(hasAnyDelivered && deliveredIds?.has(order.orderId));
            return (
              <Box
                key={`${tableNumber}-${order.orderId}`}
                sx={{
                  border: "1px solid",
                  borderColor: isOrderDelivered ? "rgba(245, 158, 11, 0.5)" : "divider",
                  borderRadius: 1,
                  p: 1,
                  bgcolor: isOrderDelivered ? "rgba(245, 158, 11, 0.12)" : "background.paper",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                  </Typography>
                  <Tooltip title={t("receipt.printOrder")}>
                    <IconButton
                      size="small"
                      className="receipt-icon-btn"
                      aria-label={t("receipt.printOrder")}
                      onClick={() => printReceipt({ tableNumber, orders: [order], t })}
                    >
                      <PrintRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Divider sx={{ mb: 0.75 }} />
                <Stack spacing={0.75}>
                  {order.products.map((p, idx) => (
                    <Stack key={`${order.orderId}-${idx}`} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                          component="img"
                          src={p.productImage || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
                          alt={p.productName}
                          sx={{ width: 28, height: 28, borderRadius: 0.75, objectFit: "cover", bgcolor: "action.hover" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}
                        >
                          {p.productName}
                        </Typography>
                      </Stack>
                      <Typography variant="caption">
                        <Box component="span" sx={{ fontSize: "1.2rem", fontWeight: 700 }}>
                          {p.quantity} {t("dashboard.ordersUnit")}
                        </Box>{" "}
                        <Box component="span" sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
                          - {t("dashboard.priceLabel")}: {p.quantity * p.price}
                        </Box>
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
          Jami: {tableTotal}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<PrintRoundedIcon />}
            disabled={orders.length === 0}
            onClick={() => printReceipt({ tableNumber, orders, t })}
          >
            {t("receipt.print")}
          </Button>
          <Button size="small" variant="contained" color="success" disabled={orders.length === 0} onClick={onPaid}>
            {t("dashboard.paid")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

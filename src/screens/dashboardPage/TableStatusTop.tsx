import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Tooltip } from "@mui/material";
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

const money = (v: number) => `₩${(Number(v) || 0).toLocaleString("en-US")}`;

const clock = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Bitta stolning buyurtmalari: taomlar, "Berildi", chek va "To'landi" */
export function TableOrdersCard(props: TableOrdersCardProps) {
  const { tableNumber, orders, deliveredIds, onDelivered, onPaid } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAnyDelivered = Boolean(deliveredIds && deliveredIds.size > 0);
  const orderSum = (o: TableOrderView) => o.products.reduce((s, p) => s + p.quantity * p.price, 0);
  const tableTotal = orders.reduce((sum, o) => sum + orderSum(o), 0);
  const itemCount = orders.reduce((sum, o) => sum + o.products.reduce((s, p) => s + p.quantity, 0), 0);

  const ago = (iso: string) => {
    const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (!Number.isFinite(min)) return "";
    if (min < 1) return t("orderStatus.justNow");
    if (min < 60) return t("orderStatus.minutesAgo", { count: min });
    return t("orderStatus.hoursAgo", { count: Math.floor(min / 60) });
  };

  return (
    <div className="toc">
      {/* Sarlavha */}
      <div className="toc-head">
        <div>
          <div className="toc-kicker">{t("receipt.table")}</div>
          <div className="toc-title">{tableNumber}</div>
        </div>
        <div className="toc-head-meta">
          <span className="toc-summary">
            {t("dashboard.ordersCount", { count: orders.length })} · {itemCount} {t("dashboard.ordersUnit")}
          </span>
          <button type="button" className="toc-link" onClick={() => navigate(`/orders-panel/table/${tableNumber}`)}>
            {t("dashboard.detail")} →
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="toc-empty">{t("orderStatus.noOrders")}</div>
      ) : (
        <div className="toc-orders">
          {orders.map((order, index) => {
            const delivered = Boolean(hasAnyDelivered && deliveredIds?.has(order.orderId));
            return (
              <section key={`${tableNumber}-${order.orderId}`} className={`toc-order${delivered ? " is-delivered" : ""}`}>
                <header className="toc-order-head">
                  <span className="toc-order-no">#{index + 1}</span>
                  <span className="toc-order-time">{clock(order.createdAt)}</span>
                  <span className="toc-order-ago">{ago(order.createdAt)}</span>
                  {delivered && <span className="toc-delivered">✓ {t("dashboard.delivered")}</span>}
                  <Tooltip title={t("receipt.printOrder")}>
                    <IconButton
                      size="small"
                      className="receipt-icon-btn toc-order-print"
                      aria-label={t("receipt.printOrder")}
                      onClick={() => printReceipt({ tableNumber, orders: [order], t })}
                    >
                      <PrintRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </header>

                <ul className="toc-items">
                  {order.products.map((p, idx) => (
                    <li key={`${order.orderId}-${idx}`} className="toc-item">
                      {p.productImage ? (
                        <img className="toc-item-img" src={p.productImage} alt="" loading="lazy" />
                      ) : (
                        <span className="toc-item-img" aria-hidden="true" />
                      )}
                      <div className="toc-item-text">
                        <span className="toc-item-name">{p.productName}</span>
                        <span className="toc-item-unit">{money(p.price)}</span>
                      </div>
                      <span className="toc-item-qty">×{p.quantity}</span>
                      <span className="toc-item-sum">{money(p.quantity * p.price)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* Jami va amallar */}
      <footer className="toc-foot">
        <div className="toc-total">
          <span>{t("receipt.total")}</span>
          <strong>{money(tableTotal)}</strong>
        </div>
        <div className="toc-actions">
          <Button variant="outlined" color="secondary" disabled={orders.length === 0} onClick={onDelivered}>
            {t("dashboard.delivered")}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<PrintRoundedIcon />}
            disabled={orders.length === 0}
            onClick={() => printReceipt({ tableNumber, orders, t })}
          >
            {t("receipt.print")}
          </Button>
          <Button variant="contained" color="success" disabled={orders.length === 0} onClick={onPaid} className="toc-paid">
            {t("dashboard.paid")}
          </Button>
        </div>
      </footer>
    </div>
  );
}

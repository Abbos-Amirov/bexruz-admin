import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OrderService from "../../services/Order.service";

type ProductRow = { productName: string; quantity: number; price: number };
type OrderView = {
  orderId: string;
  createdAt: string;
  orderTotal: number;
  products: ProductRow[];
};

type PeriodKey = "all" | "year" | "month" | "week" | "day";

const getPeriodFilter = (period: PeriodKey) => {
  const now = new Date();
  const toMs = (d: Date) => d.getTime();

  if (period === "all") return () => true;

  if (period === "year") {
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const cutoff = toMs(yearAgo);
    return (createdAt: string | Date) => new Date(createdAt).getTime() >= cutoff;
  }

  if (period === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const cutoff = toMs(monthAgo);
    return (createdAt: string | Date) => new Date(createdAt).getTime() >= cutoff;
  }

  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = toMs(weekAgo);
    return (createdAt: string | Date) => new Date(createdAt).getTime() >= cutoff;
  }

  if (period === "day") {
    const dayAgo = new Date(now);
    dayAgo.setDate(dayAgo.getDate() - 1);
    const cutoff = toMs(dayAgo);
    return (createdAt: string | Date) => new Date(createdAt).getTime() >= cutoff;
  }

  return () => true;
};

const parseOrder = (order: any): OrderView => {
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

  const products: ProductRow[] = orderItems.map((item: any) => {
    const productId = String(
      item?.productId ?? item?.product_id ?? item?.product?._id ?? item?.product?.id ?? ""
    ).trim();
    const product = productById.get(productId) ?? item?.product ?? {};
    return {
      productName: String(
        product?.productName ??
          product?.product_name ??
          item?.productName ??
          item?.product_name ??
          "—"
      ),
      quantity: Number(item?.itemQuantity ?? item?.item_quantity ?? item?.quantity ?? 0) || 0,
      price: Number(item?.itemPrice ?? item?.item_price ?? product?.productPrice ?? product?.product_price ?? 0) || 0,
    };
  });

  return {
    orderId: String(order?._id ?? order?.id ?? ""),
    createdAt: String(order?.createdAt ?? order?.updatedAt ?? ""),
    orderTotal: Number(order?.orderTotal ?? order?.order_total ?? 0) || 0,
    products:
      products.length > 0
        ? products
        : [{ productName: "—", quantity: 1, price: Number(order?.orderTotal ?? order?.order_total ?? 0) || 0 }],
  };
};

const PERIODS: { key: PeriodKey; labelKey: string }[] = [
  { key: "all", labelKey: "completedOrders.all" },
  { key: "year", labelKey: "completedOrders.lastYear" },
  { key: "month", labelKey: "completedOrders.lastMonth" },
  { key: "week", labelKey: "completedOrders.lastWeek" },
  { key: "day", labelKey: "completedOrders.lastDay" },
];

export default function CompletedOrdersStatsPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const svc = new OrderService();
      const raw = await svc.getCompletedOrdersWithDetails();
      const parsed = raw.map(parseOrder).filter((o) => o.orderId);
      setOrders(parsed);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <Box sx={{ p: 2, display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography component="h1" className="bx-page-title">
        {t("completedOrders.title")}
      </Typography>

      {PERIODS.map(({ key, labelKey }) => {
        const filter = getPeriodFilter(key);
        const filtered = orders.filter((o) => filter(o.createdAt));

        return (
          <Accordion key={key} defaultExpanded={key === "all"}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h6">{t(labelKey)}</Typography>
                <Chip
                label={t("completedOrders.ordersCount", { count: filtered.length })}
                size="small"
                color="primary"
                variant="outlined"
              />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {filtered.length === 0 ? (
                <Typography color="text.secondary">{t("completedOrders.noOrders")}</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell>{t("completedOrders.orderDate")}</TableCell>
                        <TableCell>{t("completedOrders.productName")}</TableCell>
                        <TableCell align="right">{t("completedOrders.quantity")}</TableCell>
                        <TableCell align="right">{t("completedOrders.price")}</TableCell>
                        <TableCell align="right">{t("completedOrders.total")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.flatMap((order) =>
                        order.products.map((p, idx) => (
                          <TableRow key={`${order.orderId}-${idx}`}>
                            {idx === 0 && (
                              <TableCell rowSpan={order.products.length} sx={{ verticalAlign: "top" }}>
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleString()
                                  : "—"}
                              </TableCell>
                            )}
                            <TableCell>{p.productName}</TableCell>
                            <TableCell align="right">{p.quantity}</TableCell>
                            <TableCell align="right">₩{p.price.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              ₩{(p.quantity * p.price).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

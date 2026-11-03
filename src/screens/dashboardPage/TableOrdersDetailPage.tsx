import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OrderService from "../../services/Order.service";
import { serverApi, socket } from "../../lib/config";
import { printReceipt } from "../../lib/printReceipt";

type ProductView = {
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
};

type OrderView = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  orderTotal: number;
  products: ProductView[];
};

const getTodaySevenAM = (): Date => {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  return d;
};

export default function TableOrdersDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tableNumber = "" } = useParams();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(false);

  const resolveImageUrl = useCallback((path?: string | null): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = serverApi.endsWith("/") ? serverApi.slice(0, -1) : serverApi;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }, []);

  const loadTableOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const svc = new OrderService();
        const payload = (await svc.getAllOrders({ page: 1, limit: 1000 } as any)) as any;
        const rawOrders = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.orders)
          ? payload.orders
          : Array.isArray(payload?.data?.orders)
          ? payload.data.orders
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
          ? payload.result
          : Array.isArray(payload?.rows)
          ? payload.rows
          : [];

        const fromTime = getTodaySevenAM().getTime();
        const normalized: OrderView[] = rawOrders
          .filter((order: any) => {
            const orderType = String(order?.orderType ?? order?.order_type ?? "").toUpperCase();
            if (orderType && orderType !== "TABLE") return false;
            const tn = String(
              order?.tableNumber ??
                order?.table_number ??
                order?.table?.tableNumber ??
                order?.table?.table_number ??
                ""
            ).trim();
            if (tn !== String(tableNumber).trim()) return false;
            const createdAt = new Date(order?.createdAt ?? order?.updatedAt ?? 0).getTime();
            return Number.isFinite(createdAt) && createdAt >= fromTime;
          })
          .map((order: any) => {
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

            const products: ProductView[] = orderItems.map((item: any) => {
              const productId = String(
                item?.productId ?? item?.product_id ?? item?.product?._id ?? item?.product?.id ?? ""
              ).trim();
              const product = productById.get(productId) ?? item?.product ?? {};
              const images = Array.isArray(product?.productImages)
                ? product.productImages
                : Array.isArray(product?.product_images)
                ? product.product_images
                : [];

              return {
                productName: String(
                  product?.productName ??
                    product?.product_name ??
                    item?.productName ??
                    item?.product_name ??
                    "Unknown product"
                ),
                productImage: resolveImageUrl(images[0] ?? ""),
                quantity: Number(item?.itemQuantity ?? item?.item_quantity ?? item?.quantity ?? 0) || 0,
                price:
                  Number(
                    item?.itemPrice ??
                      item?.item_price ??
                      product?.productPrice ??
                      product?.product_price ??
                      0
                  ) || 0,
              };
            });

            return {
              orderId: String(order?._id ?? order?.id ?? ""),
              orderStatus: String(order?.orderStatus ?? order?.order_status ?? ""),
              paymentStatus: String(order?.paymentStatus ?? order?.payment_status ?? ""),
              paymentMethod: String(order?.paymentMethod ?? order?.payment_method ?? ""),
              createdAt: String(order?.createdAt ?? order?.updatedAt ?? ""),
              orderTotal: Number(order?.orderTotal ?? order?.order_total ?? 0) || 0,
              products,
            };
          })
          .sort(
            (a: OrderView, b: OrderView) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setOrders(normalized);
      } catch (err) {
        console.error("loadTableOrders error:", err);
        setOrders([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [resolveImageUrl, tableNumber]
  );

  useEffect(() => {
    loadTableOrders();
  }, [loadTableOrders]);

  useEffect(() => {
    const refreshBySocket = () => loadTableOrders(true);
    const refreshByAnyOrderEvent = (eventName: string) => {
      if (String(eventName).toLowerCase().includes("order")) {
        loadTableOrders(true);
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
  }, [loadTableOrders]);

  const totalSum = useMemo(
    () => orders.reduce((acc, order) => acc + order.orderTotal, 0),
    [orders]
  );

  return (
    <Card className="table-status-card">
      <CardContent sx={{ width: "100%", p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Orqaga
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Stol {tableNumber} - batafsil
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PrintRoundedIcon />}
              disabled={orders.length === 0}
              onClick={() => printReceipt({ tableNumber, orders, t })}
            >
              {t("receipt.print")}
            </Button>
            <Chip label={`Umumiy summa: ${totalSum}`} color="primary" />
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Bugun soat 07:00 dan beri qilingan buyurtmalar
        </Typography>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : orders.length === 0 ? (
          <Typography color="text.secondary">Bu stol uchun 07:00 dan keyin buyurtma yo'q</Typography>
        ) : (
          <Stack spacing={1.25}>
            {orders.map((order) => (
              <Box
                key={order.orderId}
                sx={{
                  border: 1, borderColor: "divider",
                  borderRadius: 1.25,
                  p: 1.25,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">
                      {order.orderStatus}/{order.paymentStatus}/{order.paymentMethod}
                    </Typography>
                    <Tooltip title={t("receipt.printOrder")}>
                  <IconButton
                    size="small"
                    className="receipt-icon-btn"
                    aria-label={t("receipt.printOrder")}
                    onClick={(e) => {
                      e.stopPropagation();
                      printReceipt({ tableNumber, orders: [order], t });
                    }}
                  >
                    <PrintRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 0.9 }} />
                <Stack spacing={0.75}>
                  {order.products.map((p, idx) => (
                    <Stack
                      key={`${order.orderId}-${idx}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                          component="img"
                          src={
                            p.productImage ||
                            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                          }
                          alt={p.productName}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 0.75,
                            objectFit: "cover",
                            bgcolor: "action.hover",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 220,
                          }}
                        >
                          {p.productName}
                        </Typography>
                      </Stack>
                      <Typography variant="caption">
                        {p.quantity} {t("dashboard.ordersUnit")} - {t("dashboard.priceLabel")}: {p.quantity * p.price}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

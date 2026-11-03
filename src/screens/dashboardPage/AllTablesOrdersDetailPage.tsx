import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OrderService from "../../services/Order.service";
import { serverApi, socket } from "../../lib/config";

type ProductView = {
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
};

type OrderView = {
  orderId: string;
  tableNumber: string;
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

export default function AllTablesOrdersDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ordersByTable, setOrdersByTable] = useState<Record<string, OrderView[]>>({});
  const [loading, setLoading] = useState(false);

  const resolveImageUrl = useCallback((path?: string | null): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = serverApi.endsWith("/") ? serverApi.slice(0, -1) : serverApi;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }, []);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const svc = new OrderService();
        const payload = (await svc.getAllOrders({ page: 1, limit: 5000 } as any)) as any;
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
            if (!tn) return false;
            const createdAt = new Date(order?.createdAt ?? order?.updatedAt ?? 0).getTime();
            return Number.isFinite(createdAt) && createdAt >= fromTime;
          })
          .map((order: any) => {
            const tn = String(
              order?.tableNumber ??
                order?.table_number ??
                order?.table?.tableNumber ??
                order?.table?.table_number ??
                ""
            ).trim();
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
              tableNumber: tn,
              orderStatus: String(order?.orderStatus ?? order?.order_status ?? ""),
              paymentStatus: String(order?.paymentStatus ?? order?.payment_status ?? ""),
              paymentMethod: String(order?.paymentMethod ?? order?.payment_method ?? ""),
              createdAt: String(order?.createdAt ?? order?.updatedAt ?? ""),
              orderTotal: Number(order?.orderTotal ?? order?.order_total ?? 0) || 0,
              products,
            };
          })
          .sort((a: OrderView, b: OrderView) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const grouped: Record<string, OrderView[]> = {};
        normalized.forEach((o) => {
          if (!grouped[o.tableNumber]) grouped[o.tableNumber] = [];
          grouped[o.tableNumber].push(o);
        });
        const sortedKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
        const result: Record<string, OrderView[]> = {};
        sortedKeys.forEach((k) => (result[k] = grouped[k]));
        setOrdersByTable(result);
      } catch (err) {
        console.error("loadOrders error:", err);
        setOrdersByTable({});
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [resolveImageUrl]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const refreshBySocket = () => loadOrders(true);
    const refreshByAnyOrderEvent = (eventName: string) => {
      if (String(eventName).toLowerCase().includes("order")) loadOrders(true);
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
  }, [loadOrders]);

  const tableNumbers = useMemo(
    () => Object.keys(ordersByTable).sort((a, b) => Number(a) - Number(b)),
    [ordersByTable]
  );

  const totalSum = useMemo(
    () =>
      Object.values(ordersByTable).reduce(
        (acc, orders) => acc + orders.reduce((s, o) => s + o.orderTotal, 0),
        0
      ),
    [ordersByTable]
  );

  return (
    <Card className="table-status-card">
      <CardContent sx={{ width: "100%", p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate(-1)}>
              Orqaga
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Barcha stollar - batafsil
            </Typography>
          </Stack>
          <Chip label={`Umumiy summa: ₩${totalSum.toLocaleString()}`} color="primary" />
        </Stack>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Ertalab soat 07:00 dan beri qaysi stoldan qanday buyurtma kelgani
        </Typography>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : tableNumbers.length === 0 ? (
          <Typography color="text.secondary">
            Soat 07:00 dan keyin hech qanday stol buyurtmasi yo'q
          </Typography>
        ) : (
          <Stack spacing={1}>
            {tableNumbers.map((tableNum) => {
              const orders = ordersByTable[tableNum] ?? [];
              const tableSum = orders.reduce((s, o) => s + o.orderTotal, 0);
              return (
                <Accordion key={tableNum} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Stol {tableNum}
                      </Typography>
                      <Chip label={`${orders.length} ta`} size="small" />
                      <Chip label={`₩${tableSum.toLocaleString()}`} size="small" color="primary" />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders-panel/table/${tableNum}`);
                        }}
                      >
                        Batafsil
                      </Button>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
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
                            <Typography variant="caption">
                              {order.orderStatus}/{order.paymentStatus}/{order.paymentMethod}
                            </Typography>
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
                                  {p.quantity} {t("dashboard.ordersUnit")} - {t("dashboard.priceLabel")}:{" "}
                                  ₩{(p.quantity * p.price).toLocaleString()}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

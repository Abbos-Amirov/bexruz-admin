import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import OrderService from "../../services/Order.service";
import { serverApi } from "../../lib/config";
import { Order } from "../../lib/types/order";

type ProductView = {
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
};

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const orderFromState = (location.state as { order?: Order })?.order;

  const [order, setOrder] = useState<any>(null);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveImageUrl = useCallback((path?: string | null): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = serverApi.endsWith("/") ? serverApi.slice(0, -1) : serverApi;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }, []);

  const parseOrderData = useCallback(
    (raw: any) => {
      const orderItems = Array.isArray(raw?.orderItems)
        ? raw.orderItems
        : Array.isArray(raw?.order_items)
        ? raw.order_items
        : [];
      const productData = Array.isArray(raw?.productData)
        ? raw.productData
        : Array.isArray(raw?.product_data)
        ? raw.product_data
        : Array.isArray(raw?.products)
        ? raw.products
        : [];

      const productById = new Map<string, any>();
      productData.forEach((p: any) => {
        const pid = String(p?._id ?? p?.id ?? "").trim();
        if (pid) productById.set(pid, p);
      });

      const prods: ProductView[] = orderItems.map((item: any) => {
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
              "—"
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

      return prods;
    },
    [resolveImageUrl]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!orderId) {
        setError("Buyurtma topilmadi");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const svc = new OrderService();
        const res = await svc.getOrderById(orderId);
        const data = res?.data ?? res?.order ?? res;
        if (!cancelled && data) {
          setOrder(data);
          setProducts(parseOrderData(data));
        }
      } catch (err) {
        if (!cancelled) {
          if (orderFromState) {
            setOrder(orderFromState);
            setProducts(parseOrderData(orderFromState));
          } else {
            setError("Buyurtma ma'lumotlarini yuklashda xato");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, orderFromState, parseOrderData]);

  if (loading && !order) {
    return (
      <Box sx={{ p: 2, display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !order) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/orders")}>
          Orqaga
        </Button>
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  const o = order || {};
  const subtotal = Number(o.orderTotal ?? o.order_total ?? 0) - Number(o.deliveryFee ?? o.delivery_fee ?? 0);

  return (
    <Card sx={{ maxWidth: 800, mx: "auto" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate("/orders")}>
              Orqaga
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Buyurtma #{String(o._id ?? o.id ?? "").slice(-8)}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip label={o.orderType ?? o.order_type ?? "—"} color="secondary" size="small" />
            <Chip label={o.orderStatus ?? o.order_status ?? "—"} color="success" size="small" />
            <Chip label={o.paymentStatus ?? o.payment_status ?? "—"} color="primary" size="small" />
            <Chip label={o.paymentMethod ?? o.payment_method ?? "—"} variant="outlined" size="small" />
          </Stack>

          <Divider />

          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>{t("orders.table")}:</strong> {o.tableNumber ?? o.table_number ?? o.tableId ?? "—"}
            </Typography>
            <Typography variant="body2">
              <strong>{t("orders.member")}:</strong> {o.memberNick ?? o.member_nick ?? o.memberId ?? "—"}
            </Typography>
            <Typography variant="body2">
              <strong>{t("orders.created")}:</strong>{" "}
              {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
            </Typography>
            {o.orderNote && (
              <Typography variant="body2">
                <strong>Izoh:</strong> {o.orderNote}
              </Typography>
            )}
          </Stack>

          <Divider />

          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Mahsulotlar
          </Typography>

          {products.length > 0 ? (
            <Stack spacing={1}>
              {products.map((p, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1,
                    border: 1, borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      component="img"
                      src={
                        p.productImage ||
                        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                      }
                      alt={p.productName}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        objectFit: "cover",
                        bgcolor: "action.hover",
                      }}
                    />
                    <Typography>{p.productName}</Typography>
                  </Stack>
                  <Typography>
                    {p.quantity} {t("dashboard.ordersUnit")} × ₩{p.price.toLocaleString()} = ₩
                    {(p.quantity * p.price).toLocaleString()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary" variant="body2">
              Mahsulotlar ro'yxati mavjud emas
            </Typography>
          )}

          <Divider />

          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t("orders.subtotal")}:</Typography>
              <Typography>₩{subtotal.toLocaleString()}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t("orders.deliveryFee")}:</Typography>
              <Typography>₩{Number(o.deliveryFee ?? o.delivery_fee ?? 0).toLocaleString()}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
              <Typography>{t("orders.total")}:</Typography>
              <Typography>₩{Number(o.orderTotal ?? o.order_total ?? 0).toLocaleString()}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

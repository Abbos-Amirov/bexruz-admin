import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Button, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import OrderService, { ProductSale } from "../../services/Order.service";
import { imageBaseUrl } from "../../lib/config";
import { SalesPeriod, salesPeriodStart } from "../../lib/salesPeriod";
import "../../css/dashboardPage.css";
import "../../css/productSales.css";

const PERIODS: SalesPeriod[] = ["today", "week", "month"];

const money = (v: number) => `₩${(Number(v) || 0).toLocaleString("en-US")}`;

const imageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${imageBaseUrl}/${path}`.replace(/([^:]\/)\/+/g, "$1");
};

/** Dashboard → "Jami buyurtma qilingan ovqatlar": har bir taom qanchadan sotilgani */
export default function ProductSalesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<SalesPeriod>("month");
  const [rows, setRows] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    new OrderService()
      .getProductSales(salesPeriodStart(period))
      .then((data) => alive && setRows(data))
      .catch((err) => {
        console.log("getProductSales:", err);
        if (alive) setRows([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [period]);

  const totals = useMemo(() => {
    const qty = rows.reduce((s, r) => s + (r.soldQty || 0), 0);
    const revenue = rows.reduce((s, r) => s + (r.revenue || 0), 0);
    const kinds = rows.filter((r) => r.soldQty > 0).length;
    const maxQty = rows.reduce((m, r) => Math.max(m, r.soldQty || 0), 0);
    return { qty, revenue, kinds, maxQty };
  }, [rows]);

  const summary = [
    { key: "qty", tone: "red", icon: <RestaurantMenuIcon />, label: t("productSales.totalQty"), value: `${totals.qty} ${t("productSales.unit")}` },
    { key: "revenue", tone: "neutral", icon: <MonetizationOnIcon />, label: t("productSales.totalRevenue"), value: money(totals.revenue) },
    { key: "kinds", tone: "neutral", icon: <ReceiptLongIcon />, label: t("productSales.dishTypes"), value: totals.kinds },
  ];

  return (
    <Box className="product-sales-page">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")}>
            {t("productSales.back")}
          </Button>
          <Box>
            <Typography component="h1" className="bx-page-title" sx={{ mb: "0 !important" }}>
              {t("productSales.title")}
            </Typography>
            <Typography className="product-sales-subtitle">{t("productSales.subtitle")}</Typography>
          </Box>
        </Stack>

        <Box className="product-sales-periods" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              className={`product-sales-period${period === p ? " active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {t(`productSales.${p}`)}
            </button>
          ))}
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summary.map((c) => (
          <Grid item xs={12} sm={4} key={c.key}>
            <Paper className={`kpi-item kpi-tone-${c.tone}`}>
              <Stack direction="row" spacing={1.25} alignItems="center" className="kpi-item-head">
                <Avatar variant="rounded" className="kpi-item-avatar">{c.icon}</Avatar>
                <Typography className="kpi-item-label">{c.label}</Typography>
              </Stack>
              <Typography className="kpi-item-value">{loading ? "…" : c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      ) : rows.length === 0 ? (
        <Box className="product-sales-empty">{t("productSales.empty")}</Box>
      ) : (
        <Box className="product-sales-grid">
          {rows.map((r, i) => {
            const sold = r.soldQty > 0;
            const share = totals.maxQty > 0 ? Math.round((r.soldQty / totals.maxQty) * 100) : 0;
            return (
              <Paper key={r._id} className={`product-sale-card${sold ? "" : " is-empty"}`}>
                <Box
                  className="product-sale-img"
                  sx={{ backgroundImage: r.productImages?.[0] ? `url(${imageUrl(r.productImages[0])})` : "none" }}
                >
                  {sold && i < 3 && <span className="product-sale-rank">#{i + 1}</span>}
                </Box>
                <Box className="product-sale-body">
                  <Typography className="product-sale-name" title={r.productName}>
                    {r.productName}
                  </Typography>
                  <Typography className="product-sale-meta">
                    {money(r.productPrice)}
                    {sold ? ` · ${r.orderCount} ${t("productSales.orders")}` : ""}
                  </Typography>
                  {sold ? (
                    <>
                      <Box className="product-sale-bar" aria-hidden="true">
                        <span style={{ width: `${share}%` }} />
                      </Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                        <Typography className="product-sale-qty">
                          {r.soldQty} <small>{t("productSales.unit")}</small>
                        </Typography>
                        <Typography className="product-sale-revenue">{money(r.revenue)}</Typography>
                      </Stack>
                    </>
                  ) : (
                    <Typography className="product-sale-none">{t("productSales.noSales")}</Typography>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

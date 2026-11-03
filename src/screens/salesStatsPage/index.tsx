import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Paper,
  Avatar,
  Grid,
  CircularProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeIcon from "@mui/icons-material/DateRange";
import TodayIcon from "@mui/icons-material/Today";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import OrderService from "../../services/Order.service";
import { Order } from "../../lib/types/order";
import "../../css/dashboardPage.css";

type SalesPeriod = "all" | "year" | "month" | "week" | "today7";

const getToday7AM = (): Date => {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  return d;
};

const sumByPeriod = (orders: Order[], period: SalesPeriod): number => {
  const now = new Date();
  const today7 = getToday7AM();

  const toMs = (d: Date) => d.getTime();
  const orderDate = (o: Order) => new Date((o as any).createdAt ?? o.createdAt).getTime();

  return orders.reduce((sum, o) => {
    const total = Number((o as any).orderTotal ?? o.orderTotal ?? 0) || 0;
    const od = orderDate(o);

    if (period === "all") return sum + total;

    if (period === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      if (od >= toMs(yearAgo)) return sum + total;
      return sum;
    }

    if (period === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (od >= toMs(monthAgo)) return sum + total;
      return sum;
    }

    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (od >= toMs(weekAgo)) return sum + total;
      return sum;
    }

    if (period === "today7") {
      if (od >= toMs(today7)) return sum + total;
      return sum;
    }

    return sum;
  }, 0);
};

export default function SalesStatsPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const svc = new OrderService();
      const data = await svc.getOrdersForStats();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const cards: { period: SalesPeriod; labelKey: string; icon: React.ReactNode; tone: "red" | "neutral" }[] = [
    {
      period: "all",
      labelKey: "sales.totalSales",
      icon: <TrendingUpIcon />,
      tone: "red",
    },
    {
      period: "year",
      labelKey: "sales.lastYear",
      icon: <CalendarMonthIcon />,
      tone: "neutral",
    },
    {
      period: "month",
      labelKey: "sales.lastMonth",
      icon: <DateRangeIcon />,
      tone: "neutral",
    },
    {
      period: "week",
      labelKey: "sales.lastWeek",
      icon: <TodayIcon />,
      tone: "neutral",
    },
    {
      period: "today7",
      labelKey: "sales.todayAfter7",
      icon: <AccessTimeIcon />,
      tone: "neutral",
    },
  ];

  return (
    <Box>
      <Typography component="h1" className="bx-page-title">
        {t("sales.title")}
      </Typography>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      ) : (
        <Grid container spacing={2}>
          {cards.map((c) => {
            const value = sumByPeriod(orders, c.period);
            return (
              <Grid item xs={12} sm={6} md={4} key={c.period}>
                <Paper className={`kpi-item kpi-tone-${c.tone}`}>
                  <Stack direction="row" spacing={1.25} alignItems="center" className="kpi-item-head">
                    <Avatar variant="rounded" className="kpi-item-avatar">{c.icon}</Avatar>
                    <Typography className="kpi-item-label">{t(c.labelKey)}</Typography>
                  </Stack>
                  <Typography className="kpi-item-value">
                    ₩{Number(value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

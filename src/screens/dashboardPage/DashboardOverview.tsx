import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Typography, Stack, Paper, Avatar, Grid } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { createSelector } from "@reduxjs/toolkit";
import {
  retrieveOrderStatis,
  retrieveProductStatus,
  retrieveTableStatus,
} from "./selector";
import { useSelector } from "react-redux";
import { TableStatus } from "../../lib/enums/table.enum";
import { TableCall } from "../../lib/enums/tableCall.enum";
import OrderService from "../../services/Order.service";
import { salesPeriodStart } from "../../lib/salesPeriod";
import "../../css/dashboardPage.css";

/** REDUX SLICE & SELECTOR */
const orderStatisRetriever = createSelector(
  retrieveOrderStatis,
  (orderStatis) => ({ orderStatis })
);
const productStatusRetriever = createSelector(
  retrieveProductStatus,
  (productStatus) => ({ productStatus })
);

const tableStatusRetriever = createSelector(
  retrieveTableStatus,
  (tableStatus) => ({ tableStatus })
);

type KpiTone = "red" | "success" | "warning" | "neutral";

function KpiItem({ labelKey, value, icon, tone = "neutral", onClick }: any) {
  const { t } = useTranslation();
  const label = t(labelKey);
  const isMoney = labelKey === "dashboard.monthlySales" || labelKey === "dashboard.todayIncome" || labelKey === "dashboard.avgOrderValue";
  
  // Handle undefined/null values and format properly
  const displayValue = (() => {
    if (value === undefined || value === null) {
      return isMoney ? "₩0" : 0;
    }
    if (isMoney) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return "₩0";
      }
      return `₩${numValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return value;
  })();

  return (
    <Paper
      className={`kpi-item kpi-tone-${tone as KpiTone}${onClick ? " kpi-clickable" : ""}`}
      onClick={onClick}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" className="kpi-item-head">
        <Avatar variant="rounded" className="kpi-item-avatar">
          {icon}
        </Avatar>
        <Typography className="kpi-item-label">{label}</Typography>
      </Stack>
      <Typography className="kpi-item-value">{displayValue}</Typography>
    </Paper>
  );
}

export default function DashboardOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderStatis } = useSelector(orderStatisRetriever);
  const { productStatus } = useSelector(productStatusRetriever);
  const { tableStatus } = useSelector(tableStatusRetriever);
  const [monthlySales, setMonthlySales] = useState<number | null>(null);
  const [orderedDishes, setOrderedDishes] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    new OrderService()
      .getProductSales(salesPeriodStart("month"))
      .then((rows) => alive && setOrderedDishes(rows.reduce((s, r) => s + (r.soldQty || 0), 0)))
      .catch(() => alive && setOrderedDishes(0));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const OrderService = (await import("../../services/Order.service")).default;
        const svc = new OrderService();
        const data = await svc.getOrdersForStats();
        const orders = Array.isArray(data) ? data : [];
        const now = new Date();
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthAgoMs = monthAgo.getTime();
        const sum = orders.reduce((s, o) => {
          const total = Number((o as any).orderTotal ?? o.orderTotal ?? 0) || 0;
          const created = new Date((o as any).createdAt ?? o.createdAt).getTime();
          return created >= monthAgoMs ? s + total : s;
        }, 0);
        if (!cancelled) setMonthlySales(sum);
      } catch {
        if (!cancelled) setMonthlySales(0);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const kpis = [
    // ===== Orders =====
    {
      labelKey: "dashboard.totalOrders",
      value: orderStatis?.totalOrder,
      icon: <ReceiptLongIcon />,
      tone: "red",
    },
    {
      labelKey: "dashboard.pendingOrders",
      value: orderStatis?.pendingOrder,
      icon: <QueryBuilderIcon />,
      tone: "warning",
    },
    {
      labelKey: "dashboard.completedOrders",
      value: orderStatis?.complatedOrder,
      icon: <CheckCircleIcon />,
      tone: "success",
      onClick: () => navigate("/reports?tab=completed"),
    },

    // ===== Items =====
    {
      // Oxirgi 1 oyda buyurtma qilingan ovqatlar soni; bosilsa har bir taom bo'yicha ro'yxat
      labelKey: "dashboard.totalOrderedDishes",
      value: orderedDishes,
      icon: <RestaurantMenuIcon />,
      tone: "neutral",
      onClick: () => navigate("/reports?tab=dishes"),
    },
    {
      labelKey: "dashboard.availableItems",
      value: productStatus[0]?.available,
      icon: <CheckCircleIcon />,
      tone: "success",
    },
    {
      labelKey: "dashboard.unavailableItems",
      value: productStatus[0]?.unavailable,
      icon: <CancelRoundedIcon />,
      tone: "red",
    },
    // ===== Tables =====
    {
      labelKey: "dashboard.freeTables",
      value: tableStatus?.filter(
        (val) => val.tableStatus === TableStatus.AVAILABLE
      ).length,
      icon: <TableRestaurantIcon />,
      tone: "success",
    },
    {
      labelKey: "dashboard.tablesOccupied",
      value: tableStatus?.filter(
        (val) => val.tableStatus === TableStatus.OCCUPIED
      ).length,
      icon: <TableRestaurantIcon />,
      tone: "red",
    },
    {
      labelKey: "dashboard.cleaningTables",
      value: tableStatus?.filter(
        (val) => val.tableStatus === TableStatus.CLEANING
      ).length,
      icon: <TableRestaurantIcon />,
      tone: "warning",
    },

    // ===== Other Metrics =====
    {
      labelKey: "dashboard.callWaiterRequests",
      value: tableStatus?.filter((val) => val.tableCall === TableCall.ACTIVE)
        .length,
      icon: <NotificationsRoundedIcon />,
      tone: "warning",
    },
    {
      labelKey: "dashboard.monthlySales",
      value: monthlySales ?? orderStatis?.todayIncomeAndAOV?.[0]?.totalSum ?? 0,
      icon: <MonetizationOnIcon />,
      tone: "red",
      onClick: () => navigate("/reports?tab=sales"),
    },
    {
      labelKey: "dashboard.avgOrderValue",
      value: orderStatis?.todayIncomeAndAOV?.[0]?.aovGross ?? 0,
      icon: <MonetizationOnIcon />,
      tone: "neutral",
    },
  ];
  return (
    <Grid container spacing={2} className="dashboard-kpis">
      {kpis.map((k) => (
        <Grid item xs={12} sm={6} lg={4} xl={3} key={k.labelKey}>
          <KpiItem {...k} />
        </Grid>
      ))}
    </Grid>
  );
}

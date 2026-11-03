import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Typography, useTheme } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { createSelector } from "@reduxjs/toolkit";
import { retrieveOrderStatis } from "../selector";
import { useSelector } from "react-redux";
import { BX_RED, chartColors } from "../../../lib/chartTheme";

/** REDUX SLICE & SELECTOR */
const orderStatisRetriever = createSelector(
  retrieveOrderStatis,
  (orderStatis) => ({ orderStatis })
);

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function TopItemsBar() {
  const { t } = useTranslation();
  const { orderStatis } = useSelector(orderStatisRetriever);

  const allLabels = orderStatis?.topSellingItems.map((val) => val.productName);
  const allValues = orderStatis?.topSellingItems.map(
    (val) => val.totalQuantity
  );

  const labels = allLabels?.slice(0, 6);
  const values = allValues?.slice(0, 6);

  const theme = useTheme();
  const c = chartColors(theme);
  // Eng ko'p sotilgan — to'liq qizil, qolganlari bosiqroq
  const bgColors = (values ?? []).map((_, i) =>
    i === 0 ? BX_RED : "rgba(225, 29, 46, 0.38)"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Orders (this week)",
        data: values,
        backgroundColor: bgColors,
        hoverBackgroundColor: BX_RED,
        borderWidth: 0,
        borderRadius: 10,
        maxBarThickness: 48,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y} orders`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: c.text, font: c.font },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: c.grid },
        ticks: { color: c.text, font: c.font, precision: 0 },
      },
    },
  };

  return (
    <Card className="bx-chart-card">
      <CardContent sx={{ height: 1 }}>
        <Typography className="bx-card-title">
          {t("dashboard.topSellingItems")}
        </Typography>
        <div style={{ height: 270 }}>
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

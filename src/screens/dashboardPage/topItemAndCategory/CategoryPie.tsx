import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Typography, useTheme } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { createSelector } from "@reduxjs/toolkit";
import { retrieveOrderStatis } from "../selector";
import { useSelector } from "react-redux";
import { categoryColors, chartColors } from "../../../lib/chartTheme";

/** REDUX SLICE & SELECTOR */
const orderStatisRetriever = createSelector(
  retrieveOrderStatis,
  (orderStatis) => ({ orderStatis })
);

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPie() {
  const { t } = useTranslation();
  const { orderStatis } = useSelector(orderStatisRetriever);
  const theme = useTheme();
  const c = chartColors(theme);
  const categories = orderStatis?.ordersByCategory.map((val) => val.collection);
  const values = orderStatis?.ordersByCategory.map((val) => val.orders);
  const data = {
    labels: categories,
    datasets: [
      {
        data: values,
        backgroundColor: categories?.map((cat) => categoryColors[cat] ?? "#52525b"),
        borderColor: c.surface,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: c.text,
          font: c.font,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 16,
        },
      },
      tooltip: { enabled: true },
    },
    cutout: "68%",
  };

  return (
    <Card className="bx-chart-card">
      <CardContent sx={{ height: 1 }}>
        <Typography className="bx-card-title">
          {t("dashboard.ordersByCategory")}
        </Typography>
        <div style={{ height: 270 }}>
          <Doughnut data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

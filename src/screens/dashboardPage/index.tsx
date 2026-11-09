import DashboardOverview from "./DashboardOverview";
import TopItemAndCategory from "./topItemAndCategory";
import { useDispatch } from "react-redux";
import { OrderStatis } from "../../lib/types/order";
import { setOrderStatis, setProductStatus, setTableStatus } from "./slice";
import { Table, TableInquiry } from "../../lib/types/table";
import { ProductsStat } from "../../lib/types/product";
import { Dispatch } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";
import "../../css/dashboardPage.css";
import OrderService from "../../services/Order.service";
import ProductService from "../../services/Product.service";
import TableService from "../../services/Table.service";

// Brauzerlarda o'zbekcha sana formati yo'q ("2026 M11 9") — nomlar qo'lda
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function formatToday(lang: string): string {
  const d = new Date();
  if (lang === "ru" || lang === "en") {
    return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()} · ${UZ_WEEKDAYS[d.getDay()]}`;
}

/** REDUX SLICE & SELECTOR */
const actionDispatch = (dispatch: Dispatch) => ({
  setOrderStatis: (data: OrderStatis) => dispatch(setOrderStatis(data)),
  setTableStatus: (data: Table[]) => dispatch(setTableStatus(data)),
  setProductStatus: (data: ProductsStat[]) => dispatch(setProductStatus(data)),
});

export default function DashboardPage() {
  const { setOrderStatis, setTableStatus, setProductStatus } = actionDispatch(
    useDispatch()
  );
  const { t, i18n } = useTranslation();
  const today = formatToday(i18n.language);
  const [inquiry, setInquiry] = useState<TableInquiry>({
    limit: 1000,
    page: 1,
  });

  useEffect(() => {
    const order = new OrderService();
    order
      .getOrderStatis()
      .then((data) => {
        setOrderStatis(data);
      })
      .catch((err) => console.warn("getOrderStatis:", err));

    const product = new ProductService();
    product
      .getProductsStat()
      .then((data) => setProductStatus(data))
      .catch((err) => console.warn("getProductsStat:", err));

    const table = new TableService();
    table
      .getAllTables(inquiry)
      .then((data) => setTableStatus(data))
      .catch((err) => console.warn("getAllTables:", err));
  }, [inquiry]);
  return (
    <Stack spacing={3}>
      {/* Sarlavha — o'rtada, bezakli kartochka ichida */}
      <Box className="dash-hero">
        <div className="dash-hero-ornament" aria-hidden="true">
          <span />
          <i>✦</i>
          <span />
        </div>
        <Typography component="h1" className="dash-hero-title">
          {t("dashboard.overview")}
        </Typography>
        <Typography className="dash-hero-date">{today}</Typography>
      </Box>
      {/* Box: Stack margin reset Grid manfiy marginini buzmasligi uchun */}
      <Box>
        <DashboardOverview />
      </Box>
      <TopItemAndCategory />
    </Stack>
  );
}

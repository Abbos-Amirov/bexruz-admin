import DashboardOverview from "./DashboardOverview";
import TopItemAndCategory from "./topItemAndCategory";
import QuickActions from "./QuickActions";
import { useDispatch } from "react-redux";
import { OrderStatis } from "../../lib/types/order";
import { setOrderStatis, setProductStatus, setTableStatus } from "./slice";
import { Table, TableInquiry } from "../../lib/types/table";
import { ProductsStat } from "../../lib/types/product";
import { Dispatch } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";
import OrderService from "../../services/Order.service";
import ProductService from "../../services/Product.service";
import TableService from "../../services/Table.service";

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
  const { t } = useTranslation();
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Typography component="h1" className="bx-page-title" sx={{ mb: "0 !important" }}>
          {t("dashboard.overview")}
        </Typography>
        <QuickActions />
      </Stack>
      {/* Box: Stack margin reset Grid manfiy marginini buzmasligi uchun */}
      <Box>
        <DashboardOverview />
      </Box>
      <TopItemAndCategory />
    </Stack>
  );
}

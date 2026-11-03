import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack, Typography } from "@mui/material";
import OrdersFilters from "./OrdersFilters";
import OrdersTable from "./OrdersTable";
import OrderEditDialog from "./OrderEditDialog";
import { Order, OrderInquiry, OrderUpdateInput } from "../../lib/types/order";
import { setOrders, addOrder } from "./slice";
import { Dispatch } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import OrderService from "../../services/Order.service";
import { socket } from "../../lib/config";
import { sweetErrorHandling } from "../../lib/sweetAlert";
import "../../css/orders.css"

/** REDUX SLICE & SELECTOR */
const actionDispatch = (dispatch: Dispatch) => ({
  setOrders: (data: Order[]) => dispatch(setOrders(data)),
  addOrder: (order: Order) => dispatch(addOrder(order)),
});

export default function OrdersPage() {
  const { t } = useTranslation();
  const { setOrders, addOrder } = actionDispatch(useDispatch());

  const [open, setOpen] = useState<boolean>(false);
  const [edit, setEdit] = useState<OrderUpdateInput>({ orderId: "" });
  const [orderSearch, setOrderSearch] = useState<OrderInquiry>({
    page: 1,
    limit: 10,
    search: "",
  });

  useEffect(() => {
    const order = new OrderService();
    order
      .getAllOrders(orderSearch)
      .then((data) => setOrders(data))
      .catch((err) => {
        console.log(err);
        sweetErrorHandling(err).then();
      });
  }, [orderSearch]);

  useEffect(() => {
    const onOrderCreated = (order: Order & { orderDelivery?: number }) => {
      addOrder({
        ...order,
        deliveryFee: order.deliveryFee ?? order.orderDelivery ?? 0,
      } as Order);
    };
    socket.on("orderCreated", onOrderCreated);
    return () => {
      socket.off("orderCreated", onOrderCreated);
    };
  }, [addOrder]);

  return (
    <Stack spacing={2} className="order-page">
      <Typography component="h1" className="bx-page-title">
        {t("orders.title")}
      </Typography>

      <OrdersFilters
        orderSearch={orderSearch}
        setOrderSearch={setOrderSearch}
      />

      <OrdersTable
        orderSearch={orderSearch}
        setOrderSearch={setOrderSearch}
        setOpen={setOpen}
        edit={edit}
        setEdit={setEdit}
      />

      <OrderEditDialog
        open={open}
        setOpen={setOpen}
        edit={edit}
        setEdit={setEdit}
        orderSearch={orderSearch}
        setOrderSearch={setOrderSearch}
      />
    </Stack>
  );
}

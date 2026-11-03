import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PaginationItem from "@mui/material/PaginationItem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Button,
  Chip,
  Divider,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { retrieveOrders } from "./selector";
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
} from "../../lib/enums/order.enum";
import { dateFmt } from "../../lib/config";
import { OrderInquiry, OrderUpdateInput } from "../../lib/types/order";

const ordersRetriever = createSelector(retrieveOrders, (orders) => ({
  orders,
}));

const typeColor = (t: OrderType) =>
  t === OrderType.TABLE
    ? "secondary"
    : t === OrderType.DELIVERY
    ? "info"
    : "warning";
const statusColor = (s: OrderStatus) =>
  s === OrderStatus.PENDING
    ? "warning"
    : s === OrderStatus.PROCESS
    ? "info"
    : s === OrderStatus.COMPLETED
    ? "success"
    : "error";
const payStatusColor = (p: PaymentStatus) =>
  p === PaymentStatus.UNPAID
    ? "warning"
    : p === PaymentStatus.PAID
    ? "success"
    : "error";

interface OrderTableProps {
  orderSearch: OrderInquiry;
  setOrderSearch: (input: OrderInquiry) => void;
  setOpen: (open: boolean) => void;
  edit: OrderUpdateInput;
  setEdit: (edti: OrderUpdateInput) => void;
}

export default function OrdersTable(props: OrderTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderSearch, setOrderSearch, setOpen, edit, setEdit } = props;

  const { orders } = useSelector(ordersRetriever);

  /** HANDLERS **/
  const paginationHandler = (e: ChangeEvent<any>, value: number) => {
    orderSearch.page = value;
    setOrderSearch({ ...orderSearch });
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>{t("orders.type")}</TableCell>
            <TableCell>{t("orders.table")}</TableCell>
            <TableCell>{t("orders.member")}</TableCell>
            <TableCell align="right">{t("orders.subtotal")}</TableCell>
            <TableCell align="right">{t("orders.deliveryFee")}</TableCell>
            <TableCell align="right">{t("orders.total")}</TableCell>
            <TableCell>{t("orders.payMethod")}</TableCell>
            <TableCell>{t("orders.payStatus")}</TableCell>
            <TableCell>{t("orders.status")}</TableCell>
            <TableCell>{t("orders.created")}</TableCell>
            <TableCell align="right">{t("orders.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((v) => {
            const grand = v.orderTotal - (v.deliveryFee || 0);
            return (
              <TableRow
                key={v._id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/orders/${v._id}`, { state: { order: v } })}
              >
                <TableCell sx={{ fontFamily: "monospace" }}>
                  {v._id.slice(-8)}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={v.orderType}
                    color={typeColor(v.orderType) as any}
                  />
                </TableCell>
                <TableCell>{v.tableNumber ?? v.tableId ?? "-"}</TableCell>
                <TableCell>{v.memberNick ?? v.memberId ?? "-"}</TableCell>
                <TableCell align="right">₩{grand}</TableCell>
                <TableCell align="right">₩{v.deliveryFee}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ₩{v.orderTotal}
                </TableCell>
                <TableCell>{v.paymentMethod}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={v.paymentStatus}
                    color={payStatusColor(v.paymentStatus) as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={v.orderStatus}
                    color={statusColor(v.orderStatus) as any}
                  />
                </TableCell>
                <TableCell>{dateFmt(v.createdAt)}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(true);
                      setEdit({
                        orderId: v._id,
                        orderStatus: v.orderStatus,
                        paymentStatus: v.paymentStatus,
                        paymentMethod: v.paymentMethod,
                      });
                    }}
                  >
                    {t("orders.edit")}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={12}>{t("orders.noOrders")}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Divider />
      <Stack className="pagination-section">
        <Stack spacing={2}>
          <Pagination
            count={
              orders.length !== 0 ? orderSearch.page + 1 : orderSearch.page
            }
            page={orderSearch.page}
            renderItem={(item) => (
              <PaginationItem
                slots={{
                  previous: ArrowBackIcon,
                  next: ArrowForwardIcon,
                }}
                {...item}
                color={"secondary"}
              />
            )}
            onChange={paginationHandler}
          />
        </Stack>
      </Stack>
    </TableContainer>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { Stack, Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { useNavigate } from "react-router-dom";

type Props = {};

export default function QuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  /** HANDLERS **/
  const newOrderHandler = () => {
    const confirmation = window.confirm(t("dashboard.createNewOrderConfirm"));
    if (confirmation) {
      navigate("/products");
    }
  };

  const addTableHandler = () => navigate("/tables");
  return (
    <Stack direction="row" spacing={1.5}>
      <Button
        startIcon={<TableRestaurantIcon />}
        variant="outlined"
        color="secondary"
        onClick={addTableHandler}
      >
        {t("dashboard.addTable")}
      </Button>
      <Button
        startIcon={<AddRoundedIcon />}
        variant="contained"
        onClick={newOrderHandler}
      >
        {t("dashboard.newOrder")}
      </Button>
    </Stack>
  );
}

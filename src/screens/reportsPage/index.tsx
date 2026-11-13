import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Box, Tab, Tabs } from "@mui/material";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import SalesStatsPage from "../salesStatsPage";
import CompletedOrdersStatsPage from "../completedOrdersStatsPage";
import ProductSalesPage from "../productSalesPage";

const TABS = ["sales", "completed", "dishes"] as const;
type ReportTab = (typeof TABS)[number];

/**
 * Hisobotlar: avval alohida bo'lgan 3 ta statistika sahifasi bitta joyda —
 * Sotuv summasi, Yakunlangan buyurtmalar, Taomlar bo'yicha sotuv.
 * Tanlangan bo'lim manzilda saqlanadi: /reports?tab=dishes
 */
export default function ReportsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: ReportTab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as ReportTab) : "sales";

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v: ReportTab) => setParams({ tab: v }, { replace: true })}
          variant="scrollable"
          scrollButtons="auto"
          textColor="secondary"
          indicatorColor="secondary"
        >
          <Tab value="sales" icon={<MonetizationOnRoundedIcon />} iconPosition="start" label={t("reports.sales")} />
          <Tab value="completed" icon={<CheckCircleRoundedIcon />} iconPosition="start" label={t("reports.completed")} />
          <Tab value="dishes" icon={<RestaurantMenuRoundedIcon />} iconPosition="start" label={t("reports.dishes")} />
        </Tabs>
      </Box>
      {tab === "sales" && <SalesStatsPage />}
      {tab === "completed" && <CompletedOrdersStatsPage />}
      {tab === "dishes" && <ProductSalesPage />}
    </Box>
  );
}

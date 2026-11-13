import React from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  Box,
  List,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  ListItemButton,
  IconButton,
  Tooltip,
} from "@mui/material";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";

import "../../../css/sidebar.css";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  /** Kompyuterda sidebar yashirilgan */
  collapsed?: boolean;
  /** Sidebar tepasidagi "<" tugmasi */
  onCollapse?: () => void;
}

const Sidebar = ({ mobileOpen, onClose, collapsed = false, onCollapse }: SidebarProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");

  /** Oddiy, bitta darajali menyu: kundalik ish tartibida */
  const items = [
    { to: "/", label: t("sidebar.dashboard"), icon: <DashboardIcon className="sidebar-icon" /> },
    { to: "/kassa", label: t("sidebar.kassa"), icon: <PointOfSaleRoundedIcon className="sidebar-icon" /> },
    { to: "/orders", label: t("sidebar.ordersHistory"), icon: <ReceiptLongIcon className="sidebar-icon" /> },
    { to: "/products", label: t("sidebar.dishes"), icon: <RestaurantMenuRoundedIcon className="sidebar-icon" /> },
    { to: "/tables", label: t("sidebar.tables"), icon: <TableRestaurantIcon className="sidebar-icon" /> },
    { to: "/reports", label: t("sidebar.reports"), icon: <InsightsRoundedIcon className="sidebar-icon" /> },
  ];

  const renderLink = (item: { to: string; label: string; icon: React.ReactNode }) => (
    <NavLink
      to={item.to}
      key={item.to}
      end={item.to === "/"}
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      onClick={isMobile ? onClose : undefined}
    >
      <ListItemButton className="sidebar-button">
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText className="sidebar-item" primary={item.label} />
      </ListItemButton>
    </NavLink>
  );

  const drawerContent = (
    <Box className="sidebar">
      <Box className="sidebar-brand">
        <Box className="sidebar-brand-text">
          <img src="/icons/bexruz-logo.svg" alt="BEXRUZ" className="sidebar-logo" />
          <span className="sidebar-title">{t("sidebar.adminPanel")}</span>
        </Box>
        <Tooltip title={t("topbar.hideMenu")} placement="right">
          <IconButton
            className="sidebar-collapse-btn"
            aria-label={t("topbar.hideMenu")}
            onClick={isMobile ? onClose : onCollapse}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <List className="sidebar-list">
        {items.map((item) => renderLink(item))}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          classes={{ paper: "sidebar-drawer-paper" }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          anchor="left"
          classes={{ paper: "sidebar-drawer-paper" }}
          open={!collapsed}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;

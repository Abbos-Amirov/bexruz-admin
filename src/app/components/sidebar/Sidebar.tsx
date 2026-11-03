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
} from "@mui/material";
import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import "../../../css/sidebar.css";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");

  const navItems = [
    {
      to: "/",
      label: t("sidebar.dashboard"),
      icon: <DashboardIcon className="sidebar-icon" />,
    },
    {
      to: "/order-status",
      label: t("sidebar.orderStatus"),
      icon: <AssignmentIcon className="sidebar-icon" />,
    },
    {
      to: "/products",
      label: t("sidebar.menu"),
      icon: <ReceiptLongIcon className="sidebar-icon" />,
    },
    {
      to: "/orders",
      label: t("sidebar.orders"),
      icon: <Inventory2Icon className="sidebar-icon" />,
    },
    {
      to: "/tables",
      label: t("sidebar.tables"),
      icon: <TableRestaurantIcon className="sidebar-icon" />,
    },
    {
      to: "/user/all",
      label: t("sidebar.users"),
      icon: <AccountCircleIcon className="sidebar-icon" />,
    },
  ];

  const drawerContent = (
    <Box className="sidebar">
      <Box className="sidebar-brand">
        <img src="/icons/bexruz-logo.svg" alt="BEXRUZ" className="sidebar-logo" />
        <span className="sidebar-title">{t("sidebar.adminPanel")}</span>
      </Box>
      <List className="sidebar-list">
        {navItems.map((item) => (
          <NavLink
            to={item.to}
            key={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={isMobile ? onClose : undefined}
          >
            <ListItemButton className="sidebar-button">
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText className="sidebar-item" primary={item.label} />
            </ListItemButton>
          </NavLink>
        ))}
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
          variant="permanent"
          classes={{ paper: "sidebar-drawer-paper" }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;

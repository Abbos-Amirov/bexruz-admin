import React, { useEffect, useState } from "react";
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
  Collapse,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import { NavLink, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import "../../../css/sidebar.css";

/** "Menyu" guruhi ochiq/yopiq holati */
const GROUP_KEY = "bexruz_sidebar_menu_group";

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

  const topItems = [
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
  ];

  /** "Menyu" guruhi: bosilganda ochiladi, yana bosilganda yashirinadi */
  const groupItems = [
    {
      to: "/products",
      label: t("sidebar.dishes"),
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

  const location = useLocation();
  const groupActive = groupItems.some((i) => location.pathname.startsWith(i.to));
  const [groupOpen, setGroupOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GROUP_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Guruhdagi sahifa ochilsa — faol band ko'rinib tursin
  useEffect(() => {
    if (groupActive) setGroupOpen(true);
  }, [groupActive]);

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_KEY, String(groupOpen));
    } catch {}
  }, [groupOpen]);

  const renderLink = (item: { to: string; label: string; icon: React.ReactNode }, nested = false) => (
    <NavLink
      to={item.to}
      key={item.to}
      end={item.to === "/"}
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}${nested ? " is-nested" : ""}`}
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
        {topItems.map((item) => renderLink(item))}

        <ListItemButton
          className={`sidebar-button sidebar-group-toggle${groupActive ? " has-active" : ""}`}
          onClick={() => setGroupOpen((v) => !v)}
          aria-expanded={groupOpen}
        >
          <ListItemIcon>
            <RestaurantMenuRoundedIcon className="sidebar-icon" />
          </ListItemIcon>
          <ListItemText className="sidebar-item" primary={t("sidebar.menu")} />
          <ExpandMoreRoundedIcon className={`sidebar-group-chevron${groupOpen ? " is-open" : ""}`} />
        </ListItemButton>
        <Collapse in={groupOpen} timeout="auto" unmountOnExit>
          <Box className="sidebar-group-items">
            {groupItems.map((item) => renderLink(item, true))}
          </Box>
        </Collapse>
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

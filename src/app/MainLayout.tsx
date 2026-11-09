import { PropsWithChildren, useEffect, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import Topbar from "./components/topbar/Topbar";
import { Box, Stack, useMediaQuery } from "@mui/material";
import "../css/mainLayout.css";

/** Kompyuterda sidebar yashirilgan/ochiq holati eslab qolinadi */
const COLLAPSE_KEY = "bexruz_sidebar_collapsed";

const MainLayout = ({ children }: PropsWithChildren) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  // Telefonda — ustidan ochiladigan drawer, kompyuterda — sidebar'ni yashirish/ko'rsatish
  const handleMenuClick = () => (isMobile ? handleDrawerToggle() : setCollapsed((prev) => !prev));

  return (
    <Stack
      direction="row"
      className="main-layout-container"
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={handleDrawerToggle}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(true)}
      />
      <Box component="main" className={`main-layout-content${collapsed ? " is-collapsed" : ""}`}>
        {/* Sticky top bar */}
        <Topbar onMenuClick={handleMenuClick} sidebarOpen={isMobile ? mobileOpen : !collapsed} />

        {/* Page content */}
        <Box className="main-layout-page-content">
          {children}
        </Box>
      </Box>
    </Stack>
  );
};

export default MainLayout;

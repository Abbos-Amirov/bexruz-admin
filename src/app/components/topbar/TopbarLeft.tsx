import { Box, Stack, IconButton, InputBase, Tooltip, useMediaQuery } from "@mui/material";
import { useTranslation } from "react-i18next";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

interface TopbarLeftProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export default function TopbarLeft({ onMenuClick, sidebarOpen }: TopbarLeftProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
      {/* Sidebar'ni ochish/yopish — kompyuterda ham, telefonda ham */}
      <Tooltip title={sidebarOpen ? t("topbar.hideMenu") : t("topbar.showMenu")}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label={sidebarOpen ? t("topbar.hideMenu") : t("topbar.showMenu")}
          aria-expanded={sidebarOpen}
          className="bx-menu-toggle"
          sx={{ mr: 1 }}
        >
          {sidebarOpen && !isMobile ? <MenuOpenRoundedIcon /> : <MenuIcon />}
        </IconButton>
      </Tooltip>

      {/* Search Box */}
      <Box className="bx-topbar-search">
        <SearchRoundedIcon fontSize="small" />
        {!isMobile && (
          <InputBase
            placeholder={t("topbar.search")}
            fullWidth
            sx={{ fontSize: 14 }}
          />
        )}
      </Box>
    </Stack>
  );
}

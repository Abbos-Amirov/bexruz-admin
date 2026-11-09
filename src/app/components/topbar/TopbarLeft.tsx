import { Box, Stack, IconButton, InputBase, Tooltip, useMediaQuery } from "@mui/material";
import { useTranslation } from "react-i18next";
import MenuIcon from "@mui/icons-material/Menu";
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
      {/* Sidebar yopiq bo'lsa — ochish tugmasi (ochiqda "<" sidebar tepasida turadi) */}
      {(isMobile || !sidebarOpen) && (
        <Tooltip title={t("topbar.showMenu")}>
          <IconButton
            edge="start"
            onClick={onMenuClick}
            aria-label={t("topbar.showMenu")}
            aria-expanded={sidebarOpen}
            className="bx-menu-toggle"
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
      )}

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

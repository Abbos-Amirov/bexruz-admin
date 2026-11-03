import { Box, Stack, IconButton, InputBase, useMediaQuery } from "@mui/material";
import { useTranslation } from "react-i18next";
import MenuIcon from "@mui/icons-material/Menu";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

interface TopbarLeftProps {
  onMenuClick: () => void;
}

export default function TopbarLeft({ onMenuClick }: TopbarLeftProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
      {isMobile && (
        <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>
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

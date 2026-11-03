import { Box, Stack, Avatar, useTheme } from "@mui/material";

import { imageBaseUrl } from "../../../lib/config";
import SettingsMenu from "./Settings";
import NotificationsMenu from "./Notifications";
import NotificationAlertDialog from "./NotificationAlertDialog";
import LanguageSelector from "./LanguageSelector";
import TopbarLeft from "./TopbarLeft";
import { useGlobals } from "../../hooks/useGlobals";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar(props: TopbarProps) {
  const { onMenuClick } = props;
  const theme = useTheme();
  const { authMember } = useGlobals();

  return (
    <Box sx={{ position: "sticky", top: 0, zIndex: theme.zIndex.appBar }}>
      <Box className="bx-topbar">
        {/* LEFT SECTION */}
        <TopbarLeft onMenuClick={onMenuClick} />

        {/* RIGHT SECTION */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LanguageSelector />
          <NotificationsMenu />
          <SettingsMenu />
          <Avatar
            alt="Profile"
            src={`${imageBaseUrl}/${authMember?.memberImage}`}
            className="bx-topbar-avatar"
            sx={{ width: 36, height: 36, ml: 0.5 }}
          />
        </Stack>
      </Box>
      <NotificationAlertDialog />
    </Box>
  );
}

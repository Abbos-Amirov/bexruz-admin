import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { UserInquiry } from "../../lib/types/member";
import { MemberStatus } from "../../lib/enums/member.enum";

interface UserFilterProps {
  userSearch: UserInquiry;
  setUserSearch: (input: UserInquiry) => void;
}

export default function UserFilter(props: UserFilterProps) {
  const { t } = useTranslation();
  const { userSearch, setUserSearch } = props;

  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    if (searchText === "") {
      userSearch.search = "";
      setUserSearch({ ...userSearch });
    }
  }, [searchText]);

  /** HANDLERS **/
  const searchUserHandler = () => {
    userSearch.search = searchText;
    setUserSearch({ ...userSearch });
  };

  const searchUserStatusHandler = (status: MemberStatus) => {
    userSearch.page = 1;
    userSearch.status = status;
    setUserSearch({ ...userSearch });
  };

  return (
    <Stack spacing={2}>
      <Typography component="h1" className="bx-page-title">
        {t("users.title")}
      </Typography>

      {/* Top controls: search + status filter */}
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Box>
            <input
              type="search"
              name="singleResearch"
              placeholder={t("users.typeHere")}
              className="search-input"
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchUserHandler();
              }}
            />
            <Button
              variant="contained"
              color="primary"
              className="search-input-btn"
              endIcon={<SearchIcon />}
              onClick={searchUserHandler}
            >
              {t("menu.search")}
            </Button>
          </Box>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t("orders.status")}</InputLabel>
            <Select
              label="Status"
              value={userSearch.status}
              onChange={(e) =>
                searchUserStatusHandler(e.target.value as MemberStatus)
              }
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="BLOCK">BLOCK</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>
    </Stack>
  );
}

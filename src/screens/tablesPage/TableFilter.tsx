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
import AddIcon from "@mui/icons-material/Add";
import { TableInquiry, TableUpdateInput } from "../../lib/types/table";
import { TableStatus } from "../../lib/enums/table.enum";

interface TableFilterProps {
  tableSearch: TableInquiry;
  setTableSearch: (input: TableInquiry) => void;
  edit: TableUpdateInput;
  setEdit: (edit: TableUpdateInput) => void;
  setCreate: (input: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function TableFilter(props: TableFilterProps) {
  const { t } = useTranslation();
  const {
    tableSearch,
    setTableSearch,
    edit,
    setEdit,
    setCreate,
    open,
    setOpen,
  } = props;

  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    if (searchText === "") {
      tableSearch.search = "";
      setTableSearch({ ...tableSearch });
    }
  }, [searchText]);

  /** HANDLERS **/
  const searchTableHandler = () => {
    tableSearch.search = searchText;
    setTableSearch({ ...tableSearch });
  };

  const searchTableStatusHandler = (status: TableStatus | "") => {
    tableSearch.page = 1;
    tableSearch.status = status || undefined;
    setTableSearch({ ...tableSearch });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center">
        <Typography component="h1" className="bx-page-title">
          {t("tables.title")}
        </Typography>
      </Stack>
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent={"space-between"}
        >
          <Stack direction={"row"} gap={"10px"}>
            <Box>
              <input
                type="search"
                name="singleResearch"
                placeholder={t("users.typeHere")}
                className="search-input"
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchTableHandler();
                }}
              />
              <Button
                variant="contained"
                color="primary"
                className="search-input-btn"
                endIcon={<SearchIcon />}
                onClick={searchTableHandler}
              >
                {t("menu.search")}
              </Button>
            </Box>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t("orders.status")}</InputLabel>
              <Select
                label="Status"
                value={tableSearch.status ?? ""}
                onChange={(e) =>
                  searchTableStatusHandler(e.target.value as TableStatus | "")
                }
              >
                <MenuItem value="">{t("orders.all")}</MenuItem>
                <MenuItem value="AVAILABLE">{t("tables.available")}</MenuItem>
                <MenuItem value="OCCUPIED">{t("tables.occupied")}</MenuItem>
                <MenuItem value="CLEANING">{t("tables.cleaning")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreate(true);
                setOpen(true);
                setEdit({
                  ...edit,
                  tableNumber: "",
                  tableStatus: TableStatus.CLEANING,
                });
              }}
            >
              {t("tables.addTable")}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

// src/features/tables/TablesTable.tsx
import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Divider,
  FormControl,
  MenuItem,
  Pagination,
  PaginationItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/Download";
import { QRCodeSVG } from "qrcode.react";
import { TableInquiry, TableUpdateInput } from "../../lib/types/table";
import { createSelector } from "@reduxjs/toolkit";
import { retrieveTables } from "./selector";
import { useSelector } from "react-redux";
import { TableStatus } from "../../lib/enums/table.enum";
import { dateFmt, clientUrl } from "../../lib/config";
import {
  confirmDelete,
  sweetCenterSuccessAlert,
  sweetErrorHandling,
} from "../../lib/sweetAlert";
import TableService from "../../services/Table.service";

const tablesRetriever = createSelector(retrieveTables, (tables) => ({
  tables,
}));

const statusColor = (s: TableStatus) =>
  s === TableStatus.AVAILABLE
    ? "success"
    : s === TableStatus.OCCUPIED
    ? "error"
    : "warning";

const getStatusLabel = (t: (key: string) => string, s: TableStatus) =>
  s === TableStatus.AVAILABLE
    ? t("tables.available")
    : s === TableStatus.OCCUPIED
    ? t("tables.occupied")
    : t("tables.cleaning");

// --- helpers: SVG → PNG ---
function downloadSvgAsPng(svgEl: SVGSVGElement, filename: string, px = 1024) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns"))
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    (ctx as any).imageSmoothingEnabled = false; // keep modules crisp
    ctx.drawImage(img, 0, 0, px, px);
    URL.revokeObjectURL(svgUrl);

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  img.src = svgUrl;
}

interface TablesTableProps {
  tableSearch: TableInquiry;
  setTableSearch: (input: TableInquiry) => void;
  setOpen: (open: boolean) => void;
  setCreate: (create: boolean) => void;
  edit: TableUpdateInput;
  setEdit: (edti: TableUpdateInput) => void;
}

export default function TablesTable(props: TablesTableProps) {
  const { t: trans } = useTranslation();
  const navigate = useNavigate();
  const { tableSearch, setTableSearch, setOpen, setCreate, setEdit } =
    props;

  const { tables } = useSelector(tablesRetriever);

  /** HANDLERS **/
  const paginationHandler = (e: ChangeEvent<any>, value: number) => {
    tableSearch.page = value;
    setTableSearch({ ...tableSearch });
  };

  const updateTableHandler = async (input: TableUpdateInput) => {
    try {
      const table = new TableService();
      await table.updateChosenTable(input);
      setTableSearch({ ...tableSearch });
      sweetCenterSuccessAlert("Updated", 700);
    } catch (err) {
      console.log(err);
      sweetErrorHandling(err).then();
    }
  };

  const deleteTableHandler = async (id: string, tableNumber: string) => {
    try {
      await confirmDelete(tableNumber);
      const table = new TableService();
      await table.deleteChosenTable(id);
      setTableSearch({ ...tableSearch });
      sweetCenterSuccessAlert("Deleted", 700);
    } catch (err) {
      console.log(err);
      sweetErrorHandling(err).then();
    }
  };
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{trans("orders.table")}</TableCell>
            <TableCell>{trans("orders.status")}</TableCell>
            <TableCell>{trans("tables.currentOrder")}</TableCell>
            <TableCell>{trans("tables.qr")}</TableCell>
            <TableCell>{trans("tables.created")}</TableCell>
            <TableCell>{trans("tables.updated")}</TableCell>
            <TableCell align="center">{trans("tables.actions")}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {tables.map((t) => {
            const url = `${clientUrl}/table/qr/${encodeURIComponent(
              // Scane URL of table
              t.qrToken
            )}`;
            const qrId = `qr-${t._id}`;
            return (
              <TableRow key={t._id} hover>
                <TableCell>#{t.tableNumber}</TableCell>

                {/* read-only status chip */}
                <TableCell>
                  <Chip
                    size="small"
                    label={getStatusLabel(trans, t.tableStatus)}
                    color={statusColor(t.tableStatus) as any}
                  />
                </TableCell>

                <TableCell sx={{ fontFamily: "monospace" }}>
                  <Stack direction="column" spacing={0.5} alignItems="flex-start">
                    <span>-</span>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(
                          `/orders-panel/table/${encodeURIComponent(t.tableNumber)}`
                        )
                      }
                    >
                      {trans("tables.detail")}
                    </Button>
                  </Stack>
                </TableCell>

                {/* QR preview + Download buttons */}
                <TableCell>
                  <Tooltip title={url}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <QRCodeSVG id={qrId} value={url} size={96} level="L" />
                      <Stack direction="column" spacing={0.5}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => {
                            const svg = document.getElementById(
                              qrId
                            ) as SVGSVGElement | null;
                            if (svg)
                              downloadSvgAsPng(
                                svg,
                                `table-${t.tableNumber}-qr.png`,
                                1024
                              );
                          }}
                        >
                          PNG
                        </Button>
                      </Stack>
                    </div>
                  </Tooltip>
                </TableCell>

                <TableCell>{dateFmt(t.createdAt)}</TableCell>
                <TableCell>{dateFmt(t.updatedAt)}</TableCell>

                {/* Action: select + edit/delete */}
                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select<TableStatus>
                        value={t.tableStatus}
                        onChange={(e) =>
                          updateTableHandler({
                            _id: t._id,
                            tableStatus: e.target.value as TableStatus,
                          })
                        }
                      >
                        <MenuItem value="AVAILABLE">{trans("tables.available")}</MenuItem>
                        <MenuItem value="OCCUPIED">{trans("tables.occupied")}</MenuItem>
                        <MenuItem value="CLEANING">{trans("tables.cleaning")}</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onClick={() => {
                        setCreate(false);
                        setOpen(true);
                        setEdit({
                          _id: t._id,
                          tableNumber: t.tableNumber,
                          tableStatus: t.tableStatus,
                        });
                      }}
                    >
                      {trans("tables.edit")}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => deleteTableHandler(t._id, t.tableNumber)}
                    >
                      {trans("tables.delete")}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}

          {tables.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>{trans("tables.noTables")}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Divider />
      <Stack className="pagination-section">
        <Stack spacing={2}>
          <Pagination
            count={
              tables.length !== 0 ? tableSearch.page + 1 : tableSearch.page
            }
            page={tableSearch.page}
            renderItem={(item) => (
              <PaginationItem
                slots={{
                  previous: ArrowBackIcon,
                  next: ArrowForwardIcon,
                }}
                {...item}
                color={"secondary"}
              />
            )}
            onChange={paginationHandler}
          />
        </Stack>
      </Stack>
    </TableContainer>
  );
}

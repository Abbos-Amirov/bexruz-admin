import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Pagination,
  PaginationItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { createSelector } from "@reduxjs/toolkit";
import { retrieveUsers } from "./selector";
import { MemberStatus } from "../../lib/enums/member.enum";
import { MemberUpdateInput, UserInquiry } from "../../lib/types/member";
import { useSelector } from "react-redux";
import { dateFmt, imageBaseUrl } from "../../lib/config";

const usersRetriever = createSelector(retrieveUsers, (users) => ({
  users,
}));

const statusColor = (s: MemberStatus) =>
  s === MemberStatus.ACTIVE
    ? "success"
    : s === MemberStatus.BLOCK
    ? "warning"
    : "error";

interface UsersTableProps {
  userSearch: UserInquiry;
  setUserSearch: (input: UserInquiry) => void;
  setOpen: (open: boolean) => void;
  edit: MemberUpdateInput;
  setEdit: (edti: MemberUpdateInput) => void;
}

export default function UsersTable(props: UsersTableProps) {
  const { t } = useTranslation();
  const { userSearch, setUserSearch, setOpen, edit, setEdit } = props;

  const { users } = useSelector(usersRetriever);

  /** HANDLERS **/
  const paginationHandler = (e: ChangeEvent<any>, value: number) => {
    userSearch.page = value;
    setUserSearch({ ...userSearch });
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("users.number")}</TableCell>
            <TableCell>{t("users.nickname")}</TableCell>
            <TableCell>{t("users.phoneNumber")}</TableCell>
            <TableCell>{t("orders.status")}</TableCell>
            <TableCell>{t("users.created")}</TableCell>
            <TableCell>{t("users.updated")}</TableCell>
            <TableCell align="right">{t("users.action")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u, index) => (
            <TableRow key={u._id} hover>
              <TableCell>#{index + 1}</TableCell>

              <TableCell>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    src={`${imageBaseUrl}/${u.memberImage}`}
                    alt={u.memberNick}
                    sx={{ width: 36, height: 36 }}
                  />
                  <Box marginLeft={"8px"}>{u.memberNick}</Box>
                </Stack>
              </TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {u.memberPhone}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={u.memberStatus}
                  color={statusColor(u.memberStatus) as any}
                />
              </TableCell>
              <TableCell>{dateFmt(u.createdAt)}</TableCell>
              <TableCell>{dateFmt(u.updatedAt)}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setOpen(true);
                    setEdit({
                      memberNick: u.memberNick,
                      _id: u._id,
                      memberPhone: u.memberPhone,
                      memberStatus: u.memberStatus,
                    });
                  }}
                >
                  {t("users.edit")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>{t("users.noUsers")}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Divider />
      <Stack className="pagination-section">
        <Stack spacing={2}>
          <Pagination
            count={users.length !== 0 ? userSearch.page + 1 : userSearch.page}
            page={userSearch.page}
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

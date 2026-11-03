import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Fade,
  Link,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import { LoginInput } from "../../lib/types/member";
import MemberService from "../../services/Member.service";
import { sweetErrorHandling, sweetTopSuccessAlert } from "../../lib/sweetAlert";
import { useGlobals } from "../../app/hooks/useGlobals";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../css/loginPage.css";

export default function LoginPage() {
  const { t } = useTranslation();
  const { authMember, setAuthMember } = useGlobals();
  const navigate = useNavigate();
  const [loginInput, setLoginInput] = useState<LoginInput>({
    memberNick: "",
    memberPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLoginRequest = async () => {
    try {
      setError("");
      if (!loginInput.memberNick || !loginInput.memberPassword) {
        setError(t("auth.fillAllFields"));
        return;
      }

      setLoading(true);
      const member = new MemberService();
      const result = await member.login(loginInput);

      setAuthMember(result);
      await sweetTopSuccessAlert(t("auth.loginSuccess"), 1000);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.log("Error, handleLoginRequest:", err);
      let errorMessage = t("auth.loginFailed");
      if (err.code === "ERR_NETWORK" || err.response?.status === 504) {
        errorMessage =
          "Backend serverga ulanishda xato (504). Server ishlayotganini tekshiring.";
      } else {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      sweetErrorHandling(err);
    } finally {
      setLoading(false);
    }
  };

  if (authMember) return <Navigate to="/" replace />;

  return (
    <Box className="login-page-container">
      <Container maxWidth="sm" className="login-container">
        <Fade in={true} timeout={800}>
          <Paper className="login-paper">
            <Box className="login-logo-section">
              <img src="/icons/bexruz-logo.svg" alt="BEXRUZ" className="login-logo" />
              <Typography variant="h4" component="h1" className="login-title">
                {t("auth.adminPanel")}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="login-subtitle">
                {t("auth.signInSubtitle")}
              </Typography>
            </Box>

            {error && (
              <Fade in={!!error}>
                <Alert severity="error" onClose={() => setError("")} className="login-alert">
                  {error}
                </Alert>
              </Fade>
            )}

            <Box className="login-form-container">
              <TextField
                fullWidth
                label={t("auth.username")}
                variant="outlined"
                value={loginInput.memberNick}
                onChange={(e) =>
                  setLoginInput({ ...loginInput, memberNick: e.target.value })
                }
                disabled={loading}
                autoComplete="username"
                className="login-textfield"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={t("auth.password")}
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={loginInput.memberPassword}
                onChange={(e) =>
                  setLoginInput({ ...loginInput, memberPassword: e.target.value })
                }
                disabled={loading}
                autoComplete="current-password"
                className="login-textfield"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                       
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleLoginRequest();
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleLoginRequest}
              disabled={loading}
              className="login-button"
            >
              {loading ? t("auth.loggingIn") : t("auth.signIn")}
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
              {t("auth.noAccount")}{" "}
              <Link component={RouterLink} to="/signup" sx={{ fontWeight: 600 }}>
                {t("auth.signUp")}
              </Link>
            </Typography>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}


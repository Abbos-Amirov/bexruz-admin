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
import PhoneIcon from "@mui/icons-material/Phone";
import { MemberInput } from "../../lib/types/member";
import { MemberType } from "../../lib/enums/member.enum";
import MemberService from "../../services/Member.service";
import { sweetErrorHandling, sweetTopSuccessAlert } from "../../lib/sweetAlert";
import { useGlobals } from "../../app/hooks/useGlobals";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../css/loginPage.css";

export default function SignupPage() {
  const { t } = useTranslation();
  const { authMember, setAuthMember } = useGlobals();
  const navigate = useNavigate();
  const [signupInput, setSignupInput] = useState<MemberInput & { confirmPassword: string }>({
    memberNick: "",
    memberPhone: "",
    memberPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSignupRequest = async () => {
    try {
      setError("");
      if (!signupInput.memberNick || !signupInput.memberPhone || !signupInput.memberPassword) {
        setError(t("auth.fillAllFields"));
        return;
      }
      if (signupInput.memberPassword !== signupInput.confirmPassword) {
        setError(t("auth.passwordsNotMatch"));
        return;
      }
      if (signupInput.memberPassword.length < 4) {
        setError(t("auth.passwordTooShort"));
        return;
      }

      setLoading(true);
      const member = new MemberService();
      const { confirmPassword, ...input } = signupInput;
      // Faqat birinchi admin (restoran) akkaunti yaratiladi; mavjud bo'lsa server rad etadi
      const result = await member.signup({ ...input, memberType: MemberType.RESTAURANT });

      setAuthMember(result);
      await sweetTopSuccessAlert(t("auth.signupSuccess"), 1000);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.log("Error, handleSignupRequest:", err);
      let errorMessage = t("auth.signupFailed");
      if (err.code === "ERR_NETWORK" || err.response?.status === 504) {
        errorMessage =
          "Backend serverga ulanishda xato (504). Server ishlayotganini va REACT_APP_API_URL to'g'riligini tekshiring.";
      } else {
        errorMessage =
          err.message ||
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data?.msg ||
          errorMessage;
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
                {t("auth.signupSubtitle")}
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
                value={signupInput.memberNick}
                onChange={(e) =>
                  setSignupInput({ ...signupInput, memberNick: e.target.value })
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
                label={t("auth.phoneNumber")}
                variant="outlined"
                value={signupInput.memberPhone}
                onChange={(e) =>
                  setSignupInput({ ...signupInput, memberPhone: e.target.value })
                }
                disabled={loading}
                autoComplete="tel"
                className="login-textfield"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={t("auth.password")}
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={signupInput.memberPassword}
                onChange={(e) =>
                  setSignupInput({ ...signupInput, memberPassword: e.target.value })
                }
                disabled={loading}
                autoComplete="new-password"
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
              />

              <TextField
                fullWidth
                label={t("auth.confirmPassword")}
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={signupInput.confirmPassword}
                onChange={(e) =>
                  setSignupInput({ ...signupInput, confirmPassword: e.target.value })
                }
                disabled={loading}
                autoComplete="new-password"
                className="login-textfield"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSignupRequest();
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSignupRequest}
              disabled={loading}
              className="login-button"
            >
              {loading ? t("auth.signingUp") : t("auth.signUp")}
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
              {t("auth.alreadyHaveAccount")}{" "}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
                {t("auth.signIn")}
              </Link>
            </Typography>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}

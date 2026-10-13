import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Box,
  Typography,
} from "@mui/material";
import { AccountCircle, Lock } from "@mui/icons-material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import newgenone from "./newgenone-removebg-preview.png";
import vector from "./vector.png";
import BgDark from "./BgDark.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useMediaQuery from "@mui/material/useMediaQuery"; // Import useMediaQuery
import "./Login.css";
import { Snackbar } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsCondition from "./TermsCondition";
import SecurityGuidelines from "./SecurityGuidelines";
import { Bars } from "react-loader-spinner";
function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [alert, setAlert] = useState({ message: "", severity: "" });
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [enteredCaptcha, setEnteredCaptcha] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  // const [showPassword, setShowPassword] = useState(false);

  // const toggleShowPassword = () => {
  //   setShowPassword((prev) => !prev);
  // };
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  // const [hasReloaded, setHasReloaded] = useState(false);

  // useEffect(() => {
  //   if (!hasReloaded) {
  //     window.location.reload();
  //     setHasReloaded(true); // Ensures reload happens only once
  //   }
  // }, [hasReloaded]);
  // Detect if screen width is less than 600px
  const isMobile = useMediaQuery("(max-width:600px)");

  const handleUsername = (event) => {
    setUsername(event.target.value);
  };

  const handlePassword = (event) => {
    setPassword(event.target.value);
  };

  const getVendorData = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchUserDetails",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!username || !password) {
      setAlert({ message: "Username and Password are required", severity: "error" });
      return;
    }

    const tokenValidation = await getData();
    console.log(tokenValidation);

    if (tokenValidation) {
      console.log(localStorage.getItem("token"));
      setAlert({ message: "Successfully Logged in", severity: "success" });
      const response = await getVendorData();
      console.log("helllosd", response);
      localStorage.setItem("username", username);
      localStorage.setItem("type", response.Persona);
      localStorage.setItem("reload", "1");
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 800);
    } else {
      setAlert({ message: "Invalid Username or Password", severity: "error" });
      setUsername("");
      setPassword("");
    }
  };

  const getData = async () => {
    localStorage.clear();
    try {
      const response = await axios.get(
        `https://scfdemo.newgensoftware.net:8443/scf/login?userName=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`
      );
      console.log(response.status);

      if (response.status == 200) {
        localStorage.setItem("token", response.data.access_token);
        console.log("item set");
      }
      return true;
    } catch (error) {
      console.log("Error");
      console.error(error);
      return false;
    }
  };

  //captcha
  function generateCaptcha() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return captcha.split("").join("");
  }

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setEnteredCaptcha("");
  };
  //captcha

  const handleCaptchaValidation = () => {
    if (enteredCaptcha === captcha) {
      setAlert({ message: "Correct Captcha", severity: "success" });
      setTimeout(() => {
        handleSubmit();
      }, 200);
    } else {
      setAlert({ message: "Enter Correct Captcha", severity: "error" });
    }
  };

  return (
    <>
      <div
        className="login-page"
        style={{
          backgroundImage: `url(${BgDark})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <header className="login-header">
          <img src={newgenone} alt="Logo" className="header-logo" />
        </header>

        <div className="login-center">
          <Container
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flex: 1,
              height: "100%",
              maxWidth: "1300px",
              margin: "0 auto",
            }}
          >
            <Grid container spacing={6} justifyContent="flex-end">
              <Grid
                item
                xs={12}
                md={6}
                style={{
                  display: "flex",
                  justifyContent: isMobile ? "center" : "flex-start",
                  alignItems: "center",
                  color: "white",
                  paddingLeft: isMobile ? 16 : 48,
                }}
              >
                <div className="login-hero">
                  <h1 className="hero-title">
                    Welcome to the Supply
                    <br />
                    Chain Finance Portal
                  </h1>
                  <p className="hero-subtitle">
                    Connecting Buyers, Suppliers, and Financial Institutions on a Single Digital
                    Platform
                  </p>

                  <div className="feature-list">
                    <div className="feature-item feature-1">
                      <div className="feature-icon">
                        <MonetizationOnIcon fontSize="large" />
                      </div>
                      <div className="feature-text">
                        <strong>Optimise Liquidity</strong>
                        <div className="feature-desc">
                          Unlock working capital and strengthen cash flow across your supply chain.
                        </div>
                      </div>
                    </div>

                    <div className="feature-item feature-2">
                      <div className="feature-icon">
                        <ReceiptLongIcon fontSize="large" />
                      </div>
                      <div className="feature-text">
                        <strong>
                          Streamline Financing
                          <br />
                          Operations
                        </strong>
                        <div className="feature-desc">
                          Digitise onboarding, invoice processing, approvals, and funding requests.
                        </div>
                      </div>
                    </div>

                    <div className="feature-item feature-3">
                      <div className="feature-icon">
                        <VisibilityIcon fontSize="large" />
                      </div>
                      <div className="feature-text">
                        <strong>Gain Complete Visibility</strong>
                        <div className="feature-desc">
                          Monitor transactions, programme performance, and financing activities in
                          real time.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Grid>
              <Grid
                item
                xs={isMobile ? 12 : 6}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "primary.main",
                }}
              >
                <Card
                  sx={{ boxShadow: 5 }}
                  style={{
                    // maxHeight: "82%",
                    width: "100%",
                    maxWidth: "375px",
                    paddingTop: "12px",
                    paddingBottom: "20px",
                    borderRadius: "16px",
                    marginLeft: isMobile ? "0" : "9em",
                    boxSizing: "border-box",
                  }}
                >
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        size="small"
                        sx={{ backgroundColor: "white" }}
                        value={username}
                        onChange={handleUsername}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountCircle />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        margin="dense"
                        size="small"
                        sx={{ backgroundColor: "white" }}
                        value={password}
                        onChange={handlePassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                size="small"
                              >
                                {showPassword ? <Visibility /> : <VisibilityOff />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Box width="100%">
                        <Box mt={2} display="flex" alignItems="center" width="100%">
                          <TextField
                            variant="outlined"
                            margin="dense"
                            size="small"
                            fullWidth
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: "0.95rem", color: "black", ml: 1 }}
                                >
                                  {captcha}
                                </Typography>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Button onClick={refreshCaptcha} size="small">
                                    <RefreshIcon />
                                  </Button>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                paddingRight: 0,
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      <TextField
                        variant="outlined"
                        placeholder="Enter captcha text"
                        fullWidth
                        margin="dense"
                        size="small"
                        value={enteredCaptcha}
                        onChange={(e) => setEnteredCaptcha(e.target.value)}
                      />

                      <Box mt={1} />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "10px",
                          width: "100%",
                        }}
                      >
                        <FormControlLabel control={<Checkbox />} label="Remember me" />
                        <Link href="#" variant="body2">
                          Forgot Password?
                        </Link>
                      </div>

                      <Button
                        variant="contained"
                        onClick={handleCaptchaValidation}
                        sx={{
                          background: "#008533",
                          color: "white",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          "&:hover": {
                            background: "#0d9441",
                            transform: "scale(1.05)",
                            boxShadow: "0 2px 5px #022907",
                          },
                        }}
                        fullWidth
                        style={{ marginTop: "12px", backgroundColor: "#5a5aaf", height: 40 }}
                      >
                        Login
                      </Button>

                      {alert.message && (
                        <Alert
                          variant="filled"
                          severity={alert.severity}
                          sx={{
                            marginBottom: "20px",
                            width: "90%",
                            marginTop: "20px",
                            bgcolor:
                              alert.message === "Correct Captcha" ||
                              alert.message === "Successfully Logged in"
                                ? "#5a5aaf"
                                : undefined,
                            color:
                              alert.message === "Correct Captcha" ||
                              alert.message === "Successfully Logged in"
                                ? "#ffffff"
                                : undefined,
                          }}
                        >
                          {alert.message}
                        </Alert>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </div>

        <footer className="login-footer">
          <div className="footer-left">© 2026 Supply Chain Finance Portal. All Rights Reserved</div>
          <div className="footer-links">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPolicyOpen(true);
              }}
              sx={{ ml: 1 }}
            >
              Privacy Policy
            </Link>

            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTermsOpen(true);
              }}
              sx={{ ml: 1 }}
            >
              Terms & Conditions
            </Link>

            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSecurityOpen(true);
              }}
              sx={{ ml: 1 }}
            >
              Security Guidelines
            </Link>
          </div>
        </footer>

        <PrivacyPolicy open={policyOpen} onClose={() => setPolicyOpen(false)} />
        <TermsCondition open={termsOpen} onClose={() => setTermsOpen(false)} />
        <SecurityGuidelines open={securityOpen} onClose={() => setSecurityOpen(false)} />
      </div>
    </>
  );
}

export default Login;

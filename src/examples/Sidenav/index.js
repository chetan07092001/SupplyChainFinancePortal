/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";

// react-router-dom components
import { useLocation, NavLink } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import List from "@mui/material/List";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import NegwenLogo from "../../assets/images/NewgenLogo.png";

// Material Dashboard 2 React example components
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";
import axios from "axios";
// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";
import { Bars } from "react-loader-spinner";
// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "context";
import { experimental_extendTheme as extendTheme } from "@mui/material/styles";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;
  const location = useLocation();
  const collapseName = location.pathname.replace("/admin", "");
  const [loading, setLoading] = useState(false);
  let textColor = "white";
  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const theme = extendTheme({
    cssVarPrefix: "color",
    colorSchemes: {
      light: {
        palette: {
          purple: {
            600: "#9333ea",
          },
        },
      },
    },
  });

  const getData = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/createWorkItem",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response;
    } catch (e) {
      console.log(e);
    }
  };

  const uploadInvoice = async () => {
    try {
      setLoading(true);
      const response = await getData();

      setTimeout(() => {
        setLoading(false);
        if (response && response.status === 200) {
          const wiName = response.data.wiName;
          const sID = response.data.sessionId;
          window.open(
            `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
          );
        }
      }, 4000);
    } catch (e) {
      console.log("Error is ", e);
    }
  };

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
      setTransparentSidenav(dispatch, window.innerWidth < 1200 ? false : transparentSidenav);
      setWhiteSidenav(dispatch, window.innerWidth < 1200 ? false : whiteSidenav);
    }

    window.addEventListener("resize", handleMiniSidenav);
    handleMiniSidenav();
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, transparentSidenav, whiteSidenav]);

  // Render routes
  const [expandedParents, setExpandedParents] = useState({});
  const toggleParent = (key) => {
    setExpandedParents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderRoutes = routes.map((route) => {
    const { type, name, icon, title, noCollapse, key, href, route: routePath, children } = route;
    let returnValue;

    if (type === "collapse") {
      if (children && Array.isArray(children) && children.length > 0) {
        returnValue = (
          <div key={key}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleParent(key)}
              onKeyPress={() => toggleParent(key)}
              style={{ textDecoration: "none" }}
            >
              <SidenavCollapse
                name={name}
                icon={icon}
                active={key === collapseName.replace("/", "")}
                noCollapse={noCollapse}
              />
            </div>

            <Collapse in={!!expandedParents[key]} timeout="auto" unmountOnExit>
              <List sx={{ pl: 2 }}>
                {children.map((child) => {
                  // If child route belongs to EOnboarding, navigate to parent route with a hash
                  const childRoutePath =
                    child.route && child.route.startsWith("E-onboarding")
                      ? `E-onboarding#${child.route.split("/").pop()}`
                      : child.route;

                  return (
                    <NavLink key={child.key} to={childRoutePath} style={{ textDecoration: "none" }}>
                      <SidenavCollapse
                        nested
                        name={child.name}
                        icon={child.icon}
                        active={child.key === collapseName.replace("/", "")}
                      />
                    </NavLink>
                  );
                })}
              </List>
            </Collapse>
          </div>
        );
      } else {
        returnValue = href ? (
          <Link
            href={href}
            key={key}
            target="_blank"
            rel="noreferrer"
            sx={{ textDecoration: "none" }}
          >
            <SidenavCollapse
              name={name}
              icon={icon}
              active={key === collapseName.replace("/", "")}
              noCollapse={noCollapse}
            />
          </Link>
        ) : (
          <NavLink key={key} to={routePath}>
            <SidenavCollapse
              name={name}
              icon={icon}
              active={key === collapseName.replace("/", "")}
            />
          </NavLink>
        );
      }
    } else if (type === "title") {
      returnValue = (
        <MDTypography
          key={key}
          color={textColor}
          display="block"
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          pl={3}
          mt={2}
          mb={1}
          ml={1}
        >
          {title}
        </MDTypography>
      );
    } else if (type === "divider") {
      returnValue = (
        <Divider
          key={key}
          light={
            (!darkMode && !whiteSidenav && !transparentSidenav) ||
            (darkMode && !transparentSidenav && whiteSidenav)
          }
        />
      );
    }

    return returnValue;
  });

  return (
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 9999,
          }}
        >
          <Bars
            height="80"
            width="80"
            color="#24a4d8"
            ariaLabel="bars-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
        </div>
      )}
      <SidenavRoot
        {...rest}
        variant="permanent"
        ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
        sx={{ color: "#800000" }}
      >
        <MDBox pt={3} pb={1} px={4} textAlign="center">
          <MDBox component={NavLink} to="/" display="flex" alignItems="center">
            <MDBox component="img" src={NegwenLogo} alt="Brand" width="10rem" />
          </MDBox>
        </MDBox>
        <Divider
          light={
            (!darkMode && !whiteSidenav && !transparentSidenav) ||
            (darkMode && !transparentSidenav && whiteSidenav)
          }
        />
        <List>{renderRoutes}</List>
        <MDBox p={2} mt="auto">
          <MDButton
            disableRipple
            disableFocusRipple
            onClick={uploadInvoice}
            fullWidth
            variant="gradient"
            style={{ backgroundColor: "#008533", color: "white" }}
            sx={{
              backgroundColor: "lightcoral",
              "&:hover": {
                backgroundColor: "darkred",
              },
            }}
          >
            Upload new Invoice
          </MDButton>
        </MDBox>
      </SidenavRoot>
    </>
  );
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;

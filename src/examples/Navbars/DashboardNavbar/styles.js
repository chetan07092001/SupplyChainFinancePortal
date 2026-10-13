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
function navbar(theme, ownerState) {
  const { palette, boxShadows, functions, transitions, breakpoints, borders } = theme;
  const { transparentNavbar, absolute, light, darkMode } = ownerState;

  const { dark, white, text, transparent, background } = palette;
  const { navbarBoxShadow } = boxShadows;
  const { rgba, pxToRem } = functions;
  const { borderRadius } = borders;

  return {
    // boxShadow: transparentNavbar || absolute ? "none" : "0px 4px 10px rgba(0, 0, 0, 0.25)",

    // backdropFilter: transparentNavbar || absolute ? "none" : `saturate(200%) blur(${pxToRem(30)})`,
    // backgroundColor: transparentNavbar || absolute ? "none" : "white",
    // boxShadow: transparentNavbar || absolute ? "none" : "0px 4px 10px rgba(0, 0, 0, 0.25)",
    // backdropFilter: transparentNavbar || absolute ? "none" : "none",
    // backgroundColor: ,
    position: "sticky", // Make the navbar sticky
    top: 0, // Stick to the top of the viewport
    zIndex: 1100, // Ensure it stays above other content
    borderRadius: 0, // Remove any rounding to align with the top
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.25)", // Optional shadow for visual depth
    backgroundColor: light ? white.main : background.default,
    color: () => {
      let color = "#292075";

      // if (light) {
      //   color = white.main;
      // } else if (transparentNavbar) {
      //   color = text.main;
      // } else {
      //   color = dark.main;
      // }

      return color;
    },
    top: absolute ? 0 : pxToRem(12),
    minHeight: pxToRem(75),
    display: "grid",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    paddingTop: pxToRem(8),
    paddingBottom: pxToRem(8),
    paddingRight: absolute ? pxToRem(8) : 0,
    paddingLeft: absolute ? pxToRem(16) : 0,

    "& > *": {
      transition: transitions.create("all", {
        easing: transitions.easing.easeInOut,
        duration: transitions.duration.standard,
      }),
    },

    "& .MuiToolbar-root": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",

      [breakpoints.up("sm")]: {
        minHeight: "auto",
        padding: `${pxToRem(4)} ${pxToRem(16)}`,
      },
    },
  };
}

const navbarContainer = ({ breakpoints }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: 0,
});

const navbarRow = ({ breakpoints }, { isMini }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",

  [breakpoints.up("md")]: {
    justifyContent: isMini ? "space-between" : "stretch",
    width: isMini ? "100%" : "max-content",
  },

  [breakpoints.up("xl")]: {
    justifyContent: "stretch !important",
    width: "max-content !important",
  },
});

const navbarIconButton = ({ typography: { size }, breakpoints }) => ({
  px: 1,

  "& .material-icons, .material-icons-round": {
    fontSize: `${size.xl} !important`,
  },

  "& .MuiTypography-root": {
    display: "none",

    [breakpoints.up("sm")]: {
      display: "inline-block",
      lineHeight: 1.2,
      ml: 0.5,
    },
  },
});

const navbarMobileMenu = ({ breakpoints }) => ({
  display: "inline-block",
  lineHeight: 0,

  [breakpoints.up("xl")]: {
    display: "none",
  },
});

export { navbar, navbarContainer, navbarRow, navbarIconButton, navbarMobileMenu };

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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React contexts
import { useMaterialUIController } from "context";

function DataTableHeadCell({ width, children, sorted, align, ...rest }) {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  return (
    <MDBox
      component="th"
      width={width}
      py={1.5}
      px={3}
      sx={({ palette: { light }, borders: { borderWidth } }) => ({
        borderBottom: `${borderWidth[1]} solid ${light.main}`,
        boxSizing: "border-box",
        whiteSpace: "nowrap",
      })}
    >
      <MDBox
        {...rest}
        display="inline-flex"
        alignItems="center"
        justifyContent={
          align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start"
        }
        color="#7b809a"
        opacity={0.7}
        sx={({ typography: { size, fontWeightBold } }) => ({
          fontSize: size.xxs,
          fontWeight: fontWeightBold,
          textTransform: "uppercase",
          cursor: sorted ? "pointer" : "default",
          userSelect: sorted ? "none" : "auto",
          whiteSpace: "nowrap",
        })}
      >
        <span>{children}</span>
        {sorted && (
          <MDBox
            component="span"
            display="inline-flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            ml={1}
            sx={{ position: "relative", width: "12px", height: "14px", flexShrink: 0 }}
          >
            <Icon
              sx={{
                position: "absolute",
                top: "-5px",
                fontSize: "14px !important",
                color: sorted === "asce" ? "text.main" : "secondary.main",
                opacity: sorted === "asce" ? 1 : 0.4,
              }}
            >
              arrow_drop_up
            </Icon>
            <Icon
              sx={{
                position: "absolute",
                bottom: "-5px",
                fontSize: "14px !important",
                color: sorted === "desc" ? "text.main" : "secondary.main",
                opacity: sorted === "desc" ? 1 : 0.4,
              }}
            >
              arrow_drop_down
            </Icon>
          </MDBox>
        )}
      </MDBox>
    </MDBox>
  );
}

// Setting default values for the props of DataTableHeadCell
DataTableHeadCell.defaultProps = {
  width: "auto",
  sorted: "none",
  align: "left",
};

// Typechecking props for the DataTableHeadCell
DataTableHeadCell.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node.isRequired,
  sorted: PropTypes.oneOf([false, "none", "asce", "desc"]),
  align: PropTypes.oneOf(["left", "right", "center"]),
};

export default DataTableHeadCell;

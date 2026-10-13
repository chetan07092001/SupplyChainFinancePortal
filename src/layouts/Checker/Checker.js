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

// @mui material components
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import DataTable from "examples/Tables/DataTable";
import StockAuditData from "./data.js";
import { Card } from "@mui/material";
import MDTypography from "components/MDTypography";
import "animate.css";
function ApprovalReq() {
  const { columns, rows } = StockAuditData();

  return (
    <DashboardLayout>
      <MDTypography
        sx={{ borderLeft: 4, borderColor: "secondary.main" }}
        variant="h5"
        gutterBottom
        pl={1}
      >
        Checker
      </MDTypography>

      <MDBox mt={8} className="animate__animated animate__fadeIn">
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={3} pl={3}></MDBox>
                <MDBox pt={1}>
                  <DataTable
                    table={{ columns, rows }}
                    entriesPerPage={false}
                    showTotalEntries={true}
                    noEndBorder
                  />
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default ApprovalReq;

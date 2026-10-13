import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import EarlyPaymentData from "./data";

const blankCardStyle = {
  p: 2,
  borderRadius: "12px",
  minHeight: 92,
  border: "1px solid #e6e9ee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function EarlyPaymentRecommendation() {
  const { columns, rows, onfetchData, loading } = EarlyPaymentData();
  const [filter, setFilter] = useState("");

  const handleClear = () => setFilter("");

  useEffect(() => {
    if (typeof onfetchData === "function") onfetchData();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} lg={4}>
            <Card>
              <MDBox sx={blankCardStyle}>
                <MDTypography variant="subtitle2" color="text">
                  {/* blank for future */}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4} lg={4}>
            <Card>
              <MDBox sx={blankCardStyle}>
                <MDTypography variant="subtitle2" color="text">
                  {/* blank for future */}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4} lg={4}>
            <Card>
              <MDBox sx={blankCardStyle}>
                <MDTypography variant="subtitle2" color="text">
                  {/* blank for future */}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        <MDBox mt={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" p={2}>
                  <MDTypography variant="h6">Early Payment Recommendation</MDTypography>
                  <MDBox display="flex" gap={1} alignItems="center">
                    <MDInput
                      placeholder="Filter by WI Name / Spoke / Status"
                      size="small"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      style={{ width: 260 }}
                    />
                    <MDButton color="info" variant="contained" onClick={() => {}}>
                      Filter
                    </MDButton>
                    <MDButton color="dark" variant="outlined" onClick={handleClear}>
                      Clear
                    </MDButton>
                  </MDBox>
                </MDBox>

                <MDBox p={2}>
                  <DataTable
                    canSearch
                    showTotalEntries
                    table={{ columns, rows }}
                    entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
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

export default EarlyPaymentRecommendation;

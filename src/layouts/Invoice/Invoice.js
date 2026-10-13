import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import { Bars } from "react-loader-spinner";
// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Button from "@mui/material/Button";
import DataTable from "examples/Tables/DataTable";
import StockAuditData from "./data.js";
import { Card } from "@mui/material";
import MDTypography from "components/MDTypography";
import "animate.css";
function Invoice() {
  const { columns, rows, onfetchData, submitData, loading } = StockAuditData();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {/* <MDTypography
        sx={{ borderLeft: 4, borderColor: "secondary.main" }}
        variant="h5"
        gutterBottom
        pl={1}
      >
        Discrepancy
      </MDTypography> */}
      <MDBox mt={8} className="animate__animated animate__fadeIn">
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
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox sx={{ display: "flex", flexDirection: "row-reverse" }}>
                  <Button
                    component="label"
                    onClick={onfetchData}
                    variant="contained"
                    style={{
                      backgroundColor: "#008533",
                      color: "white",
                      height: "5px",
                    }}
                    sx={{
                      m: 2,
                      width: "13%",
                      display: "flex",
                      flexDirection: "row-reverse",
                      background: "#008533", // blue → purple
                      color: "white",
                      transition: "transform 0.3s, box-shadow 0.3s",
                      "&:hover": {
                        background: "#0d9441", // slightly darker hover gradient
                        transform: "scale(1.05)", // Scale up the button
                        boxShadow: "0 2px 5px #15f132",
                      },
                    }}
                    tabIndex={-1}
                  >
                    Fetch Data
                  </Button>
                </MDBox>

                <MDBox pt={1}>
                  <DataTable
                    isSorted={false}
                    table={{ columns, rows }}
                    entriesPerPage={false}
                    showTotalEntries={true}
                    noEndBorder
                  />
                </MDBox>
                <MDBox sx={{ display: "flex", flexDirection: "row-reverse" }}>
                  <Button
                    component="label"
                    variant="contained"
                    onClick={submitData}
                    sx={{
                      m: 2,
                      width: "13%",
                      display: "flex",
                      flexDirection: "row-reverse",
                      background: "#008533", // blue → purple
                      color: "white",
                      transition: "transform 0.3s, box-shadow 0.3s",
                      "&:hover": {
                        background: "#0d9441", // slightly darker hover gradient
                        transform: "scale(1.05)", // Scale up the button
                        boxShadow: "0 2px 5px #15f132",
                      },
                    }}
                    style={{
                      backgroundColor: "#008533",
                      color: "white",
                      height: "5px",
                    }}
                    tabIndex={-1}
                  >
                    Submit Data
                  </Button>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default Invoice;

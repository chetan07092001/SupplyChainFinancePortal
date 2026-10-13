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
import { Bars } from "react-loader-spinner";
// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import StockAuditData from "./data.js";
import { Card, Button } from "@mui/material";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Box from "@mui/material/Box";
import "animate.css";
import * as XLSX from "xlsx/xlsx.mjs";
import { saveAs } from "file-saver";
import { excelData } from "./data.js";
import Icon from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
function Amendment() {
  const { columns, rows } = StockAuditData();

  function rearrangeObjects(dataArray) {
    return dataArray.map((item) => {
      // Extract the winame key-value pair
      const { winame, ...rest } = item;

      // Create a new object with winame first, followed by the rest of the key-value pairs
      return { winame, ...rest };
    });
  }
  const getData = () => {
    const jsonData = rearrangeObjects(excelData());

    console.log(jsonData);
    const headers = [
      [
        "Reference Number",
        "Anchor Name",
        "Anchor Code",
        "Vendor Name",
        "Vendor Code",
        "Transaction Date",
        "Status",
      ],
    ];

    const worksheet = XLSX.utils.json_to_sheet(jsonData, { skipHeader: true });

    XLSX.utils.sheet_add_aoa(worksheet, headers, { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    console.log(excelBuffer);
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(data, "UserData.xlsx");
  };
  return (
    <DashboardLayout>
      <DashboardNavbar />
      {/* <MDTypography
        sx={{ borderLeft: 4, borderColor: "secondary.main" }}
        variant="h5"
        gutterBottom
        pl={1}
      >
        Settlement
      </MDTypography> */}

      {/* <div
        style={{
          position: "fixed", // Ensures it covers the whole screen
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.7)", // Optional: To dim the background
          zIndex: 9999, // Ensures the loader is on top of everything
        }}
      >
        <Bars
          height="80"
          width="80"
          color="#4fa94d"
          ariaLabel="bars-loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div> */}
      <MDBox mt={2} className="animate__animated animate__fadeIn">
        <Box mb={3} sx={{ display: "flex", flexDirection: "row-reverse", alignItems: "center" }}>
          <MDButton
            onClick={getData}
            style={{
              backgroundColor: "#008533",
              color: "white",
              height: "5px",
              width: "5px",
              borderRadius: "50%",
            }}
            sx={{
              background: "#008533", // blue → purple
              color: "white",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                background: "#0d9441", // slightly darker hover gradient
                transform: "scale(1.05)", // Scale up the button
                boxShadow: "0 2px 5px #15f132",
              },
            }}
            iconOnly
          >
            <FileDownloadIcon />
          </MDButton>

          <MDButton
            component="label"
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
                background: "#008533", // slightly darker hover gradient
                transform: "scale(1.05)", // Scale up the button
                boxShadow: "0 2px 5px #15f132",
              },
            }}
            tabIndex={-1}
          >
            Fetch Data
          </MDButton>
        </Box>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card mt={3}>
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

export default Amendment;

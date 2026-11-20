import { useEffect } from "react";
import { Box, Button, Card, Grid } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import InvoiceData from "layouts/Invoice/data";
import * as XLSX from "xlsx";

const blueButtonSx = {
  backgroundColor: "#292075",
  color: "#ffffff",
  "&:hover": { backgroundColor: "#21185f" },
  "&.Mui-disabled": {
    backgroundColor: "#292075 !important",
    color: "#ffffff !important",
    opacity: 0.6,
  },
  "& .MuiButton-startIcon": { color: "#ffffff" },
};

function InvoiceManagement() {
  const {
    columns,
    rows,
    onfetchData,
    handleFileUpload,
    submitData,
    loading,
    uploadedCount,
    selectedCount,
  } = InvoiceData();

  useEffect(() => {
    if (typeof onfetchData === "function") onfetchData();
  }, []);

  const downloadTemplate = () => {
    const headers = [
      "S No",
      "Spoke Code",
      "Anchor Code",
      "Invoice Date",
      "Invoice Number",
      "Invoice Amount",
      "Account No",
      "Email ID",
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet["!cols"] = headers.map(() => ({ wch: 22 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "InvoiceTemplate.xlsx");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12} mb={3}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Button
                variant="contained"
                onClick={downloadTemplate}
                startIcon={<DownloadIcon />}
                sx={{ ...blueButtonSx, height: 40 }}
              >
                Download
              </Button>
              <Button
                component="label"
                variant="contained"
                disabled={loading}
                startIcon={<CloudUploadIcon />}
                sx={{ ...blueButtonSx, height: 40 }}
              >
                Upload Files
                <input hidden type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
              </Button>
            </Box>
            <Card>
              <MDBox
                m={2}
                p={0}
                sx={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  minWidth: 300,
                  height: "15%",
                }}
              >
                <Box sx={{ minWidth: 120 }} />
              </MDBox>
              <MDBox pt={1}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted
                  entriesPerPage={false}
                  showTotalEntries
                  noEndBorder
                />
              </MDBox>
              <Box m={2} sx={{ display: "flex", flexDirection: "row-reverse" }}>
                <Button
                  variant="contained"
                  onClick={submitData}
                  disabled={
                    loading || (uploadedCount != null ? uploadedCount === 0 : rows.length === 0)
                  }
                  sx={{ ...blueButtonSx, height: 40 }}
                >
                  Send for approval
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default InvoiceManagement;

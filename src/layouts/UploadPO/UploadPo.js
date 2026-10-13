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
import * as React from "react";
// @mui material components
import { useState, useEffect, useContext } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Typography from "@mui/material/Typography";
// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Alert, Snackbar } from "@mui/material";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";
import { Icon, IconButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CancelIcon from "@mui/icons-material/Cancel";
import { styled } from "@mui/material/styles";
import * as XLSX from "xlsx";
import axios from "axios";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
// Data
import authorsTableData from "layouts/tables/data/authorsTableData";
import UserContext from "context/userContext";
import Swal from "sweetalert2";
import { token } from "stylis";
import { ConstructionOutlined } from "@mui/icons-material";
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function Tables() {
  const transformData = (Tabledata) => {
    return Tabledata.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => {
          if (key === "invoiceStatus") {
            console.log(key, value);
            return [
              key,
              <MDBadge
                key={key}
                badgeContent={value}
                color={colorObject[value]}
                variant="gradient"
                size="sm"
              />,
            ];
          } else {
            return [
              key,
              <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
                {value}
              </MDTypography>,
            ];
          }
        })
      )
    );
  };

  function Tabledata() {
    return {
      columns: [
        { Header: "Spoke Code", accessor: "Spoke Code", width: "15%", align: "left" },
        { Header: "Anchor Code", accessor: "Anchor Code", width: "15%", align: "left" },
        {
          Header: "PO Date",
          accessor: "PO Date",
          width: "15%",
          align: "left",
        },
        { Header: "PO Number", accessor: "PO Number", width: "15%", align: "center" },
        { Header: "Account Number", accessor: "Account Number", width: "15%", align: "center" },
        { Header: "CCY", accessor: "CCY", width: "5%", align: "center" },
        { Header: "PO Amount", accessor: "PO Amount", width: "15%", align: "center" },
        { Header: "Email ID", accessor: "Email ID", width: "15%", align: "center" },
        { Header: "Credit Term", accessor: "Credit Term", width: "25%", align: "left" },
        {
          Header: "Goods Description",
          accessor: "Goods Description",
          width: "15%",
          align: "center",
        },
      ],

      rows: rowData,
    };
  }

  function Tabledata2(rowData2) {
    return {
      columns: [
        { Header: "Reference Number", accessor: "Contact Number", width: "15%", align: "left" },
        { Header: "Mobile Number", accessor: "Address", width: "15%", align: "left" },
        { Header: "Customer Name", accessor: "Email", width: "5%", align: "center" },
        { Header: "Reference Status", accessor: "Email", width: "5%", align: "center" },
      ],

      rows: rowData2,
    };
  }

  const [response, setResponse] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [rowData2, setRowData2] = useState([]);
  const [alert, setAlert] = useState(false);
  const [dataArray, setDataArray] = useState([]);
  const [reject, setReject] = useState(false);
  const [alertMessage, setAlertMessage] = useState(false);
  const { columns, rows } = Tabledata(rowData);
  const tableData2 = Tabledata2(rowData2);

  //setrowdata (transformdata) will be used to populate data in the table

  useEffect(() => {
    if (localStorage.getItem("username") == "aminah1") {
      setReject(true);
      const storedData = sessionStorage.getItem("excelData");
      if (storedData) {
        const parsedStoredData = JSON.parse(storedData);
        console.log("Session storage data:", parsedStoredData);
        setDataArray(parsedStoredData);
        setRowData(transformData(parsedStoredData));
      }
    }
  }, []);

  function removeDuplicatePOs(data) {
    const seen = new Set();
    const uniqueData = data.filter((item) => {
      if (seen.has(item.poNumber)) {
        return false;
      }
      seen.add(item.poNumber);
      return true;
    });
    return uniqueData;
  }

  const handleFileUpload = (e) => {
    const input = e.target;
    const file = e.target.files?.[0];

    if (!file) {
      console.error("No file selected");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const parsedData = XLSX.utils.sheet_to_json(sheet);
      console.log("Parsed Data:", parsedData);

      setDataArray(parsedData);
      setRowData(transformData(parsedData));

      input.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  const showSwal = () => {
    Swal.fire({
      title: "Data sent for approval",
      icon: "success",
    });
  };
  const showSwal2 = () => {
    Swal.fire({
      title: "Please remove duplicate POs from the file",
      icon: "error",
    });
  };

  const submitDataArray = async () => {
    console.log("inside submit");

    const jsonData = postData(dataArray);
    const updatedJsonData = updatePOStatus(jsonData, "Pending");

    if (hasDuplicatePONumber(updatedJsonData)) {
      console.error("Duplicate PO Numbers found");
      setDataArray([]);
      setRowData([]);
      showSwal2();
    } else if (!hasDuplicatePONumber(updatedJsonData)) {
      setDataArray(updatedJsonData);

      console.log("post request", updatedJsonData);
      const url = "https://scfdemo.newgensoftware.net:8443/scf/SavePurchaseOrderDetails";
      const token2 = localStorage.getItem("token"); // replace with your actual token
      console.log("updated json data", updatedJsonData);

      axios
        .post(url, updatedJsonData, {
          headers: {
            Authorization: `Bearer ${token2}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("Response:", response.data);
          setDataArray([]);
          setRowData([]);
          showSwal();
        })
        .catch((error) => {
          console.error("Error:", error);
        });
      console.log("this is the dataarray", newData);
    }
  };

  function updatePOStatus(data, newStatus) {
    return data.map((item) => ({
      ...item,
      poStatus: newStatus,
    }));
  }

  function hasDuplicatePONumber(data) {
    const poNumbers = data.map((item) => item.poNumber);
    return new Set(poNumbers).size !== poNumbers.length;
  }

  function postData(data) {
    const keyMap = {
      "Spoke Code": "spokeCode",
      "Anchor Code": "anchorCode",
      "PO Date": "poDate",
      "PO Number": "poNumber",
      "Account Number": "accountNo",
      CCY: "ccy",
      "PO Amount": "poAmount",
      "Email ID": "emailId",
      "Credit Term": "creditTerm",
      "Goods Description": "goodsDescription",
    };

    return data.map((item) => {
      const transformed = {};
      for (const oldKey in keyMap) {
        const newKey = keyMap[oldKey];
        transformed[newKey] = item[oldKey];
      }
      return transformed;
    });
  }

  const newData = (data) => {
    const updatedData = data.map((obj) => ({
      ...Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/\s+/g, "").toLowerCase(), // Remove spaces and convert to lowercase
          value,
        ])
      ),
      status: "Sent for approval", // Default status
    }));
    setRowData2(transformData(updatedData));
  };

  const downloadExcel = () => {
    // Define headers
    const headers = [
      "Spoke Code",
      "Anchor Code",
      "PO Date",
      "PO Number",
      "Account Number",
      "CCY",
      "PO Amount",
      "Email ID",
      "Credit Term",
      "Goods Description",
    ];

    // Create an empty worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths
    const columnWidths = [{ wch: 20 }, { wch: 25 }, { wch: 45 }, { wch: 25 }, { wch: 45 }];
    worksheet["!cols"] = columnWidths;

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write and trigger download
    XLSX.writeFile(workbook, "Data.xlsx");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {/* <MDTypography
        sx={{ borderLeft: 4, borderColor: "secondary.main" }}
        variant="h5"
        gutterBottom
        pl={1}
        mb={5}
      >
        Draft
      </MDTypography> */}

      <MDBox pt={3} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12} mb={3}>
            <Box
              mb={3}
              sx={{
                display: "flex",
                flexDirection: "row-reverse",
                justifyContent: "space-between",
              }}
            >
              {/* {reject && (
                <Button
                  component="label"
                  role={undefined}
                  variant="contained"
                  style={{
                    backgroundColor: "maroon",
                    color: "white",
                    height: "5px",
                    marginLeft: "5px",
                  }}
                  tabIndex={-1}
                  onClick={handleReject}
                  startIcon={<CancelIcon />}
                >
                  Reject
                </Button>
              )} */}

              <Button
                component="label"
                role={undefined}
                variant="contained"
                style={{
                  backgroundColor: "#292075",
                  color: "white",
                  height: "5px",
                }}
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                Upload files
                <VisuallyHiddenInput
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  multiple
                />
              </Button>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                style={{
                  backgroundColor: "#292075",
                  color: "white",
                  height: "5px",
                  marginLeft: "5px",
                }}
                onClick={downloadExcel}
                tabIndex={-1}
                startIcon={<DownloadIcon />}
              >
                Download
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
                <Box sx={{ minWidth: 120 }}></Box>
              </MDBox>
              <MDBox pt={1}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                />
              </MDBox>
              <Box m={2} sx={{ display: "flex", flexDirection: "row-reverse" }}>
                <Button
                  component="label"
                  role={undefined}
                  variant="contained"
                  onClick={submitDataArray}
                  style={{
                    backgroundColor: "#292075",
                    color: "white",
                    height: "5px",
                  }}
                  tabIndex={-1}
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

export default Tables;

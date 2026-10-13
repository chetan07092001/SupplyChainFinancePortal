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
  const viewDoc = async (item) => {
    console.log("hello");
    const wiName = item.proccessinstanceid; // Change to match the API response
    console.log(wiName + " WID");

    const sID = await useSessionId(); // Make sure to await for the session ID
    console.log(sID + " SID");

    window.open(
      `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
    );
    console.log(item);
  };
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
        {
          Header: "Name",
          accessor: "Name",
          align: "left",
          width: "15%",
        },

        { Header: "Contact Number", accessor: "Contact Number", width: "15%", align: "left" },
        { Header: "Address", accessor: "Address", width: "15%", align: "left" },
        {
          Header: "Registration number",
          accessor: "Registration number",
          width: "15%",
          align: "left",
        },
        { Header: "Email", accessor: "Email", width: "5%", align: "center" },
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
    const fetch = async () => {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/customerData/fetchCustomer"
      );
      const transformedTabData = transformData(response.data);
      setRowData2(transformedTabData);

      console.log("api res", rowData2);
    };
    fetch();

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

  const handleFileUpload = (e) => {
    const reader = new FileReader();
    reader.readAsBinaryString(e.target.files[0]);
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      console.log(workbook);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      console.log(parsedData);
      setDataArray(parsedData);
      setRowData(transformData(parsedData));
      sessionStorage.setItem("excelData", JSON.stringify(parsedData));
      console.log(parsedData);
    };
  };

  const sendEmail = async (mail, sid, user) => {
    try {
      // console.log("Inside mail function", mail, sid);

      // const url = `https://scfdemo.newgensoftware.net/iBPSRestFulWebServices/ibps/Restful/newgenibps/WFAddToMailQueue/?mailFrom=hrithik.sengar@newgensoft.com&mailTo=${mail}&mailSubject=Test mail&mailMessage=test mail&priority=3&processDefId=5`;

      // // Construct query parameters

      // const headers = {
      //   "Content-Type": "application/json",
      //   sessionId: `&{sid}`,
      // };

      // console.log("Request URL:", url);
      // console.log("Headers:", headers);

      // const response = await fetch(
      //   "https://scfdemo.newgensoftware.net/iBPSRestFulWebServices/ibps/Restful/newgenibps/WFAddToMailQueue/?mailFrom=hrithik.sengar@newgensoft.com&mailTo=hrithik.sengar@newgensoft.com&mailSubject=Test mail&mailMessage=test mail&priority=3&processDefId=5",
      //   {
      //     method: "POST",
      //     headers: {
      //       sessionId: `${sid}`,
      //     },
      //   }
      // );

      const htmlContent = `
      <!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Onboarding Approval</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    h2 {
      color: #333;
    }
    p {
      font-size: 16px;
      color: #555;
    }
    .btn-container {
      margin-top: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      margin: 10px;
      text-decoration: none;
      font-size: 16px;
      border-radius: 5px;
      color: #fff;
    }
    .approve-btn {
      background-color: #28a745;
    }
    .reject-btn {
      background-color: #dc3545;
    }
  </style>
</head>
<body>

  <div class="email-container">
    <h2>Onboarding Process Initiated for ${user.Name} </h2>
    <h3>Registration number : ${user["Registration number"]} </h3>
    <h3>Contact number : ${user["Contact Number"]} </h3>

    <p>The onboarding process has been started for a new employee. Please review and approve or reject the request.</p>

    <div class="btn-container">
      <a href="https://arabbankdemo.newgensoftware.net/CBQAccountOpening" class="btn approve-btn">Approve</a>
      <a href="https://arabbankdemo.newgensoftware.net/CBQAccountOpening/reject.html" class="btn reject-btn">Reject</a>
    </div>
  </div>

</body>
</html>

      `;

      // Encode the HTML content to be safely included in a URL
      const encodedHtmlContent = encodeURIComponent(htmlContent);

      const url = `https://scfdemo.newgensoftware.net/iBPSRestFulWebServices/ibps/Restful/newgenibps/WFAddToMailQueue/?
      mailFrom=ibpsnewgensoftware@gmail.com
      &mailTo=${mail}
      &mailSubject=Test mail
      &mailMessage=${encodedHtmlContent}
      &priority=3
      &processDefId=5`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          sessionId: `${sid}`,
        },
      });

      console.log("Full Response:", response);
      console.log("Email sent successfully:", response?.data);
    } catch (error) {
      console.error("Error sending email:", error?.response ? error.response.data : error.message);
    }
  };

  const showSwal = () => {
    Swal.fire({
      title: "Data sent for approval",
      icon: "success",
    });
  };
  const showSwal2 = () => {
    Swal.fire({
      title: "Email sent successfully",
      icon: "success",
    });
  };

  const submitDataArray = async () => {
    if (localStorage.getItem("username") !== "aminah1") {
      console.log("inside submit");

      showSwal();
    }

    if (localStorage.getItem("username") == "aminah1") {
      setAlertMessage(true);
      showSwal2();
      const sid = await useSessionId();
      console.log(sid);

      const sendMail = dataArray.map((user) => {
        sendEmail(user.Email, sid.toString(), user);
      });
      setRowData([]);
    }
  };

  const handleReject = () => {
    if (localStorage.getItem("username") == "aminah1") {
      setDataArray([]);
      sessionStorage.clear();
      setRowData([]);
    }
  };

  const downloadExcel = () => {
    // Define headers
    const headers = ["Name", "Contact Number", "Address", "Registration number", "Email"];

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

              {/* <Button
                component="label"
                role={undefined}
                variant="contained"
                style={{
                  backgroundColor: "maroon",
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
                  backgroundColor: "maroon",
                  color: "white",
                  height: "5px",
                  marginLeft: "5px",
                }}
                onClick={downloadExcel}
                tabIndex={-1}
                startIcon={<DownloadIcon />}
              >
                Download
              </Button> */}
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
                  Submit Data
                </Button>
              </Box>
            </Card>

            <Card sx={{ mt: 3, p: 2 }}>
              <MDTypography>Onboarding Status</MDTypography>
              <MDBox
                m={2}
                p={0}
                sx={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  minWidth: 300,
                  height: "15%",
                }}
              ></MDBox>

              <MDBox>
                <DataTable
                  table={{
                    columns: [
                      {
                        Header: "Reference Number",
                        accessor: "refrenceNumber",
                        width: "15%",
                        align: "left",
                      },
                      {
                        Header: "Mobile Number",
                        accessor: "mobilenumber",
                        width: "15%",
                        align: "left",
                      },
                      {
                        Header: "Customer Name",
                        accessor: "customername",
                        width: "5%",
                        align: "center",
                      },
                      {
                        Header: "Reference Status",
                        accessor: "refsttaus",
                        width: "5%",
                        align: "center",
                      },
                    ],
                    rows: rowData2,
                  }}
                  isSorted={true}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Tables;

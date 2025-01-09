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

import { useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import Box from "@mui/material/Box";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
// Material Dashboard 2 React examples
import DataTable from "examples/Tables/DataTable";
import { json, useNavigate } from "react-router-dom";
// Data
import { Bars } from "react-loader-spinner";
import MDButton from "components/MDButton";
import PropTypes from "prop-types";
import axios from "axios";
import "animate.css";
import * as XLSX from "xlsx/xlsx.mjs";
import { saveAs } from "file-saver";
import { Padding } from "@mui/icons-material";

function rearrangeObjects(dataArray) {
  return dataArray.map((item) => {
    // Extract the winame key-value pair
    const { winame, ...rest } = item;
    console.log("sadadsada");
    console.log(item);
    // Create a new object with winame first, followed by the rest of the key-value pairs
    return { winame, ...rest };
  });
}

const transformData = (data) => {
  return data.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([key, value]) => [
        key,
        <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
          {value}
        </MDTypography>,
      ])
    )
  );
};

let header;
let name;
if (localStorage.getItem("type") == "Anchor") {
  header = "vendorname";
  name = "Vendor Name";
} else {
  header = "anchorname";
  name = "Anchor Name";
}

function data(rowData) {
  return {
    columns: [
      {
        Header: "Reference Number",
        accessor: "transactionrefnum",
        width: "10%",
        align: "left",
      },

      { Header: name, accessor: header, align: "left" },
      { Header: "Invoice Number", accessor: "invoicenumber", width: "15%", align: "left" },
      { Header: "Invoice Date", accessor: "invoicedate", align: "center" },
      { Header: "Invoice Amount", accessor: "invoiceamount", align: "right" },
      { Header: "Due Date", accessor: "duedate", align: "center" },
      { Header: "Disburse Amount", accessor: "disburseamount", align: "right" },
      { Header: "Disburse Date", accessor: "disbursedate", align: "center" },
    ],
    rows: transformData(rowData),
  };
}

function Projects({ rowData }) {
  const navigate = useNavigate();
  const { columns, rows } = data(rowData);
  console.log(rows, columns);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  const getExcelSheet = () => {
    const jsonData = rearrangeObjects(rowData);
    console.log(jsonData);
    console.log(jsonData);
    const headers = [
      [
        "",
        "Anchor Name",
        "Invoice Date ",
        "Disburse Amount",
        "Disbursed Date",
        "Due Date",
        "Invoice Number",
        "Invoice Amount",
        "Reference Number",
        "Vendor Name",
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
      console.log("upload data New ");
      console.log(response.data);
      return response;
    } catch (e) {
      console.log(e);
    }
  };
  const uploadInvoice = async () => {
    try {
      setLoading(true);

      console.log("upload invoice");
      const response = await getData();
      console.log("data");
      console.log(response.status);

      setTimeout(() => {
        setLoading(false);
        if (response.status == "200") {
          const wiName = response.data.wiName;
          console.log("winame" + wiName);
          const sID = response.data.sessionId;
          console.log("sid" + sID);
          window.open(
            `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
          );
        }
      }, 4000);
    } catch (e) {
      console.log("Error is ", e);
    }
  };

  return (
    <Card className="animate animate animate_fadeIn">
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
      <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <MDBox>
          <MDTypography variant="h6" gutterBottom>
            Invoice
          </MDTypography>
        </MDBox>
        <MDBox px={1} sx={{ marginX: "2px" }}>
          <MDButton
            style={{
              color: "white",
              backgroundColor: "maroon",
              marginRight: "20px",
            }}
            sx={{
              transition: "transform 0.3s, box-shadow 0.3s", // Smooth transition for transform and box-shadow
              "&:hover": {
                transform: "scale(1.05)", // Scale up the button
                boxShadow: "0 2px 5px maroon",
              },
            }}
            onClick={uploadInvoice}
          >
            Upload New Invoice
          </MDButton>
          <MDButton
            onClick={getExcelSheet}
            style={{
              backgroundColor: "maroon",
              color: "white",
              height: "5px",
              width: "5px",
            }}
            sx={{
              transition: "transform 0.3s, box-shadow 0.3s", // Smooth transition for transform and box-shadow
              "&:hover": {
                transform: "scale(1.05)", // Scale up the button
                boxShadow: "0 2px 5px maroon",
              },
            }}
            iconOnly
          >
            <FileDownloadIcon style={{ fontSize: "24px" }}></FileDownloadIcon>
          </MDButton>
        </MDBox>
      </MDBox>
      <MDBox>
        <DataTable
          table={{ columns, rows }}
          showTotalEntries={true}
          isSorted={false}
          noEndBorder
          entriesPerPage={false}
        />
      </MDBox>
    </Card>
  );
}

Projects.propTypes = {
  rowData: PropTypes.arrayOf(PropTypes.object),
};

export default Projects;

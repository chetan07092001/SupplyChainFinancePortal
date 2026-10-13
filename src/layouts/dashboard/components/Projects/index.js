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

import { useEffect, useState } from "react";

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
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
function rearrangeObjects(dataArray) {
  return dataArray.map((item) => {
    // Extract the winame key-value pair
    const { winame, ...rest } = item;

    // Create a new object with winame first, followed by the rest of the key-value pairs
    return { winame, ...rest };
  });
}

const kpiCardStyle = {
  p: 3,
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  border: "1px solid #e5e7eb",
  transition: "0.3s",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  },
};

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
  name = "Spoke Name";
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
      { Header: "Invoice Date", accessor: "invoicedate", align: "left" },
      { Header: "Invoice Amount", accessor: "invoiceamount", align: "left" },
      { Header: "Due Date", accessor: "duedate", align: "left" },
      { Header: "Disburse Amount", accessor: "disburseamount", align: "left" },
      { Header: "Disburse Date", accessor: "disbursedate", align: "left" },
    ],
    rows: transformData(rowData),
  };
}

function Projects({ rowData }) {
  const { columns, rows } = data(rowData);
  console.log(rows, columns);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);
  const [sort, setSort] = useState("");
  const getExcelSheet = () => {
    const jsonData = rearrangeObjects(rowData);

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
  useEffect(() => {
    rowData.sort((a, b) => parseFloat(a.invoiceAmount) - parseFloat(b.invoiceAmount));

    console.log(rowData, "new");
  }, [sort]);
  const onChangeSort = (e) => {
    setSort(e.target.value);
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
              backgroundColor: "#008533",
              marginRight: "20px",
            }}
            sx={{
              background: "#008533", // blue → purple
              color: "white",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                background: "#0d9441", // slightly darker hover gradient
                transform: "scale(1.05)", // Scale up the button
                boxShadow: "0 2px 5px #022907",
              },
            }}
            onClick={uploadInvoice}
          >
            Upload New Invoice
          </MDButton>
          <MDButton
            onClick={getExcelSheet}
            style={{
              backgroundColor: "#008533",
              color: "white",
              height: "5px",
              width: "5px",
            }}
            sx={{
              background: "#008533", // blue → purple
              color: "white",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                background: "#0d9441", // slightly darker hover gradient
                transform: "scale(1.05)", // Scale up the button
                boxShadow: "0 2px 5px #022907",
              },
            }}
            iconOnly
          >
            <FileDownloadIcon style={{ fontSize: "24px" }}></FileDownloadIcon>
          </MDButton>
          {/* <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Age</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={sort}
              label="value"
              onChange={onChangeSort}
            >
              <MenuItem value={"invoiceAmount"}>invoiceAmount</MenuItem>
            </Select>
          </FormControl> */}
        </MDBox>
      </MDBox>
      <MDBox>
        <DataTable
          table={{ columns, rows }}
          showTotalEntries={true}
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

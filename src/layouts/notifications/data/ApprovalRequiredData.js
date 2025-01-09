/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
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

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDBadge from "components/MDBadge";
import MDButton from "components/MDButton";
import { Grid, Icon, IconButton } from "@mui/material";

const rowsData = [
  {
    transactionRefNumber: "T11234",
    partyName: "Vijay Sharma Limited Private",

    invoiceNumber: "INV1234",
    invoiceDate: "12/11/2022",
    invoiceAmount: "2000",
    dueDate: "31/09/2024",
    status: "Approval",
  },
];

const generateSampleData = (count) => {
  const statuses = ["Approval", "Disbursed", "Rejected"];
  const sampleData = [];

  for (let i = 0; i < count; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const item = {
      transactionRefNumber: `T${(i + 1).toString().padStart(5, "0")}`,
      partyName: `Company ${i + 1} Limited Private`,
      invoiceNumber: `INV${(i + 1).toString().padStart(4, "0")}`,
      invoiceDate: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}/09/2024`,
      invoiceAmount: `${Math.floor(Math.random() * 5000) + 1000}`,
      disbursedAmount: `${Math.floor(Math.random() * 3000) + 100}`,
      action: randomStatus,
    };

    sampleData.push(item);
  }

  return sampleData;
};

const transformData = (data) => {
  return data.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([key, value]) => {
        if (key === "action") {
          return [
            key,
            <MDBox key={key}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <IconButton size="small" disableRipple>
                    <Icon sx={{ color: "green" }}>check_circle</Icon>
                  </IconButton>
                </Grid>
                <Grid item xs={6}>
                  <IconButton size="small" disableRipple>
                    <Icon sx={{ color: "red" }}>cancel</Icon>
                  </IconButton>
                </Grid>
              </Grid>
            </MDBox>,
            ,
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

export default function data() {
  return {
    columns: [
      {
        Header: "Reference Number",
        accessor: "transactionRefNumber",
        width: "10%",
        align: "left",
      },
      { Header: "Party Name", accessor: "partyName", align: "left" },
      { Header: "Invoice Number", accessor: "invoiceNumber", width: "5%", align: "left" },
      { Header: "Invoice Date", accessor: "invoiceDate", align: "center" },
      { Header: "Invoice Amount", accessor: "invoiceAmount", align: "right" },
      { Header: "Disbursed Amount", accessor: "disbursedAmount", align: "right" },
      { Header: "Action", accessor: "action", align: "center" },
    ],

    rows: transformData(generateSampleData(50)),
  };
}

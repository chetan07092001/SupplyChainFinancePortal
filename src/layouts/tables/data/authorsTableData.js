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

import { Approval } from "@mui/icons-material";

const generateSampleData = (count) => {
  const statuses = ["Approval", "Disbursed", "Rejected"];
  const sampleData = [];
  console.log(stat);
  for (let i = 0; i < count; i++) {
    const randomStatus = "Approval";
    const item = {
      transactionRefNumber: `T${(i + 1).toString().padStart(5, "0")}`,
      partyName: `Company ${i + 1} Limited Private`,
      invoiceNumber: `INV${(i + 1).toString().padStart(4, "0")}`,
      invoiceDate: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}/09/2024`,
      invoiceAmount: `${Math.floor(Math.random() * 5000) + 1000}`,
      dueDate: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}/10/2024`,
      status: randomStatus,
    };

    sampleData.push(item);
  }

  return sampleData;
};

// const colorObject = {
//   Disbursed: "error",
//   PartiallyDisbursed: "warning",
//   Rejected: "error",
// };

const transformData = (data) => {
  return data.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([key, value]) => {
        if (key === "status") {
          return [
            key,
            <MDBadge
              key={key}
              badgeContent={value} // Customize content if needed
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
      { Header: "Invoice Number", accessor: "invoiceNumber", width: "15%", align: "left" },
      { Header: "Invoice Date", accessor: "invoiceDate", align: "center" },
      { Header: "Invoice Amount", accessor: "invoiceAmount", align: "right" },
      { Header: "Due Date", accessor: "dueDate", align: "center" },
      { Header: "Status", accessor: "status", align: "center" },
    ],

    rows: transformData(generateSampleData(10)),
  };
}

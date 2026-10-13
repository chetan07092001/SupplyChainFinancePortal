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

// @mui material components

import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState, useEffect } from "react";

const getData = async () => {
  try {
    const response = await axios.get(
      "https://scfdemo.newgensoftware.net:8443/scf/fetchVendorInfo?vendorCode=VC713"
    );

    console.log(response.data);

    return response.data ? response.data : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};
const getTotalDisburseAmount = (data) => {
  return data.reduce((total, item) => {
    return total + parseFloat(item.disburseamount);
  }, 0);
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

export default function data() {
  return {
    columns: [
      {
        Header: "Reference Number",
        accessor: "winame",
        width: "10%",
        align: "left",
      },

      { Header: "Anchor Name", accessor: "vendorname", align: "left" },
      { Header: "Invoice Number", accessor: "invoicenumber", width: "15%", align: "left" },
      { Header: "Invoice Date", accessor: "invoicedate", align: "center" },
      { Header: "Invoice Amount", accessor: "invoiceamount", align: "right" },
      { Header: "Due Date", accessor: "duedate", align: "center" },
      { Header: "Disburse Amount", accessor: "disburseamount", align: "right" },
      { Header: "Disburse Date", accessor: "disbursedate", align: "center" },
    ],
  };
}

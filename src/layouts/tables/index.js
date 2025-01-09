import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import axios from "axios";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import StatusDropdown from "./StatusDropdown"; // Import your new component
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";
function Tables() {
  const [status, setStatus] = useState("All");

  const colorObject = {
    Disbursed: "success",
    Approval: "warning",
    REJECTED: "error",
  };

  const viewDoc = async (item) => {
    const wiName = item.processid; // Change to match the API response
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
          }
          if (key === "view") {
            return [
              key,
              <IconButton
                key={key}
                size="small"
                disableRipple
                color="inherit"
                onClick={() => viewDoc(item)}
              >
                <Icon>visibility</Icon>
              </IconButton>,
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
          Header: "Reference Number",
          accessor: "transactionRefNumber",
          width: "10%",
          align: "left",
        },
        { Header: "Wi Name", accessor: "winame", width: "10%", align: "left" },
        { Header: "Vendor Name", accessor: "vendorname", align: "left" },
        { Header: "Anchor Name", accessor: "anchorname", width: "15%", align: "left" },
        { Header: "Total Invested Amount", accessor: "invoiceAmount", align: "center" },
        { Header: "Total Disbursed Amount", accessor: "disburseAmount", align: "right" },
        { Header: "Status", accessor: "invoiceStatus", align: "center" },
      ],
      rows: rowData,
    };
  }

  const handleChange = (event) => {
    setStatus(event.target.value);
  };

  const getData = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/FetchDataAtCustomerPortal",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const [response, setResponse] = useState([]);
  const [rowData, setRowData] = useState([]);
  const { columns, rows } = Tabledata(rowData);

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/FetchDataAtCustomerPortal",
      });

      const updatedData = data.map((item) => ({
        ...item,
        view: "view",
        invoiceAmount: Number(item.invoiceAmount).toLocaleString("en-US"),
        disburseAmount: Number(item.disburseAmount).toLocaleString("en-US"),
        winame: item.winame ? item.winame : "-",
        transactionRefNumber: item.transactionRefNumber ? item.transactionRefNumber : "-",
      }));

      setRowData(transformData(updatedData));
      setResponse(updatedData);
      return await updatedData;
    },
  });

  // x
  useEffect(() => {
    if (status === "All") {
      setRowData(transformData(response));
    } else {
      const filterData = response.filter(
        (item) => item.invoiceStatus.toLowerCase() === status.toLowerCase()
      );

      setRowData(transformData(filterData));
    }
  }, [status]);

  return (
    <DashboardLayout>
      <DashboardNavbar absoulute />
      {/* <MDTypography
        sx={{ borderLeft: 4, borderColor: "secondary.main" }}
        variant="h5"
        gutterBottom
        pl={1}
        mb={5}
      >
        All Cases
      </MDTypography> */}
      <MDBox pt={0} pb={3}>
        <StatusDropdown status={status} handleChange={handleChange} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <MDBox m={2} p={0} sx={{ flexDirection: "row-reverse" }}></MDBox>
              <MDBox pt={0}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                  pagination={{ variant: "gradient", color: "error" }}
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

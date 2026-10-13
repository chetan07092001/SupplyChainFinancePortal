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
import { useState, useEffect } from "react";
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
import axios from "axios";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";
import { Icon, IconButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";

// Data
import authorsTableData from "layouts/tables/data/authorsTableData";

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
          Header: "Wi Name",
          accessor: "proccessinstanceid",
          width: "20%",
          align: "left",
        },

        { Header: "Spoke Name", accessor: "vendorname", width: "15%", align: "left" },
        { Header: "Anchor Name", accessor: "anchorname", width: "15%", align: "left" },
        { Header: "View", accessor: "view", width: "5%", align: "center" },
      ],

      rows: rowData,
    };
  }

  const [response, setResponse] = useState([]);
  const [rowData, setRowData] = useState([]);
  const { columns, rows } = Tabledata(rowData);

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/FetchDataAtPortal",
      });

      setRowData(transformData(data));
      return await data;
    },
  });

  console.log(data);

  useEffect(() => {
    console.log(response.data);
    if (status == "All") {
      setRowData(transformData(response));
    } else {
      const filterData = response.filter((item) => {
        item.invoiceStatus === status;
      });

      setRowData(transformData(filterData));
    }
  }, [status]);

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
          <Grid item xs={12}>
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
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Tables;

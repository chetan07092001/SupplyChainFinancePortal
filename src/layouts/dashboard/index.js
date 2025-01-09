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
import Grid from "@mui/material/Grid";
import MDTypography from "components/MDTypography";
// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Data

import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import Projects from "layouts/dashboard/components/Projects";

import StackBarChart from "examples/Charts/BarCharts/StackBarChart";
import PieChart from "examples/Charts/PieChart";
import "animate.css";
import axios from "axios";
import { useState, useEffect } from "react";
import CustomModal from "layouts/Modal/CustomModal";
import AnchorModal from "layouts/Modal/AnchorModal";
import { totalOutstanding } from "layouts/Modal/CustomModal";
import * as XLSX from "xlsx/xlsx.mjs";
import { saveAs } from "file-saver";
import boxShadow from "assets/theme/functions/boxShadow";

let total = 0;
let totalOutstandingAmount = totalOutstanding();

const getData = async () => {
  try {
    const response = await axios.get(
      "https://scfdemo.newgensoftware.net:8443/scf/fetchVendorInfo?vendorCode=VC713",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    console.log("tab data");
    console.log(response.data);
    return response.data ? response.data : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const onClickTotal = () => {
  const offset = 10; // Set the offset from the bottom (100px before the bottom)
  window.scrollTo({
    top: document.body.scrollHeight - offset, // Scroll to just before the bottom
    behavior: "smooth", // Smooth scroll effect
  });
};

const getTotalDisburseAmount = (data) => {
  const totalAmount = data
    .reduce((total, item) => {
      return total + parseFloat(item.disburseamount);
    }, 0)
    .toFixed(2);

  // Convert to readable format with 'k' if necessary
  if (totalAmount >= 1000 && totalAmount < 1000000) {
    return (totalAmount / 1000).toFixed(1) + "k"; // For values in thousands (e.g., 1k, 300k)
  } else if (totalAmount >= 1000000) {
    return (totalAmount / 1000000).toFixed(1) + "M"; // For values in millions (e.g., 1M, 2.5M)
  }

  return totalAmount; // Return as is if less than 1000
};

function Dashboard() {
  const { sales, tasks } = reportsLineChartData;
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      console.log(data);
      //   setDis(getTotalDisburseAmount(data));
      //  console.log(dis);
      total = getTotalDisburseAmount(data);
      1;
      console.log("ahksjdakjsad");
      const updatedData = data.map((obj) => ({
        ...obj,
        disburseamount: Number(obj.disburseamount).toLocaleString("en-US"),
        invoiceamount: Number(obj.invoiceamount).toLocaleString("en-US"),
      }));
      console.log(updatedData);
      setRows(updatedData);
    };

    fetchData();
  }, []);

  const onClickOverdue = () => {
    if (localStorage.getItem("type") == "Vendor") {
      setOpenModal(true);
    } else {
      console.log("else");
      setOpenModal2(true);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {/* <AnchorModal open={openModal2} onClose={() => setOpenModal2(false)} />
      <CustomModal open={openModal} onClose={() => setOpenModal(false)} /> */}

      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <a onClick={onClickTotal}>
                <ComplexStatisticsCard
                  color="dark"
                  icon={
                    <img
                      src={require("./total.png")}
                      alt="icon"
                      style={{
                        width: "25px",
                        height: "24px",
                      }}
                    />
                  }
                  title={<span style={{ color: "#344767" }}>Total Invoice</span>}
                  count={rows.length}
                  bg="#2C2C2C"
                />
              </a>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <a onClick={onClickTotal}>
                <ComplexStatisticsCard
                  color="success"
                  icon="currency_rupee"
                  title={<span style={{ color: "#344767" }}>Disbursed Amount</span>}
                  count={total}
                  bg="#2E8B57"
                />
              </a>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <a onClick={onClickTotal}>
                <ComplexStatisticsCard
                  icon="calendar_month_icon"
                  title={<span style={{ color: "#344767" }}>Upcoming Due</span>}
                  count="0"
                  bg="#006D6F"
                />
              </a>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <a onClick={onClickOverdue}>
                <ComplexStatisticsCard
                  icon="timer_off"
                  style={{
                    backgroundColor: "black",
                    boxShadow: "0px 4px 6px rgba(128, 128, 0, 0.1)",
                  }}
                  title={
                    <span style={{ color: "#344767" }}>
                      <a>Overdue Amount</a>
                    </span>
                  }
                  count={totalOutstandingAmount}
                  bg="#803D3B"
                />
              </a>
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={6} alignItems="center">
              <MDBox mb={3}>
                <StackBarChart color="info" />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <MDBox mb={3}>
                <PieChart color="dark" />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={12} lg={12}>
              <Projects rowData={rows} />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;

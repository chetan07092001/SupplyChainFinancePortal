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
import { Card } from "@mui/material";
// Data

import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import Projects from "layouts/dashboard/components/Projects";
import RepaymentRecommendation from "layouts/dashboard/components/RepaymentRecommendation";
import WalletIcon from "@mui/icons-material/Wallet";
import StackBarChart from "examples/Charts/BarCharts/StackBarChart";
import PieChart from "examples/Charts/PieChart";
import EOnboardingChart from "examples/Charts/EOnboardingChart";
import "animate.css";
import axios from "axios";
import { useState, useEffect } from "react";
import CustomModal from "layouts/Modal/CustomModal";
import AnchorModal from "layouts/Modal/AnchorModal";
import { totalOutstanding } from "layouts/Modal/CustomModal";
import * as XLSX from "xlsx/xlsx.mjs";
import { saveAs } from "file-saver";
import boxShadow from "assets/theme/functions/boxShadow";
import { useNavigate } from "react-router-dom";
import CustomCard from "./Card";
let total = 0;
let totalOutstandingAmount = totalOutstanding();
let overDue = "0";
let outStanding = "5.6M";
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

const getData2 = async () => {
  try {
    const response = await axios.get(
      "https://scfdemo.newgensoftware.net:8443/scf/FetchCustomerExposure",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    console.log("card data");
    console.log(response.data);
    return response.data ? response.data : [];
  } catch (error) {
    console.error(error);
    console.log("error");
    return [];
  }
};

const onClickTotal = () => {
  navigate("/admin/Settelment");
};

const amountShortner = (data) => {
  const totalAmount = data;
  if (totalAmount >= 1000 && totalAmount < 1000000) {
    return (totalAmount / 1000).toFixed(1) + "k"; // For values in thousands (e.g., 1k, 300k)
  } else if (totalAmount >= 1000000) {
    return (totalAmount / 1000000).toFixed(1) + "M"; // For values in millions (e.g., 1M, 2.5M)
  }
  return totalAmount;
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
  const [cardData, setCardData] = useState([]);
  // const fetchOverDueAndOutstanding = async () => {
  //   const data = await getData2();
  //   console.log(data, "this is card data ");
  //   setCardData(data);
  // };
  const navigate = useNavigate();
  const onClickTotal = () => {
    navigate("/admin/settlement");
  };
  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      console.log(data);
      //   setDis(getTotalDisburseAmount(data));
      //  console.log(dis);
      total = getTotalDisburseAmount(data);

      const updatedData = data.map((obj) => ({
        ...obj,
        disburseamount: Number(obj.disburseamount),
        invoiceamount: Number(obj.invoiceamount),
      }));
      console.log(updatedData, "dahboard data");
      setRows(updatedData);
    };
    const fetchOverDueAndOutstanding = async () => {
      const data = await getData2();

      if (data !== null) {
        console.log(data, "this is card data ");
        // outStanding = data[0].outstanding;
        // overDue = data[0].overdue;
      }
    };
    fetchOverDueAndOutstanding();
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

      <MDBox py={1.5}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={0}>
              {/* <a onClick={onClickTotal}>
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
              </a> */}
              <CustomCard
                total={rows.length}
                onClickTotal={onClickTotal}
                cardname="Total invoice"
                color="#4caf50"
                graph="M0 35 Q40 25 80 30 T160 20 T200 10"
                value={"↑ 12%"}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1}>
              {/* <a onClick={onClickTotal}>
                <ComplexStatisticsCard
                  color="success"
                  icon="currency_rupee"
                  title={<span style={{ color: "#344767" }}>Disbursed Amount</span>}
                  count={total}
                  bg="#2E8B57"
                />
              </a> */}
              <CustomCard
                total={total}
                onClickTotal={onClickTotal}
                cardname="Disbursed Amount"
                color="#4caf50"
                graph="M0 35 Q40 25 80 30 T160 20 T200 10"
                value={"↑ 8.5%"}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1}>
              {/* <a onClick={onClickTotal}>
                <ComplexStatisticsCard
                  icon="wallet"
                  title={<span style={{ color: "#344767" }}>Outstanding Amount</span>}
                  count={amountShortner(outStanding)}
                  bg="#006D6F"
                />
              </a> */}
              <CustomCard
                total={outStanding}
                onClickTotal={onClickTotal}
                cardname="Outstanding Amount"
                color="#ec1818"
                graph="M0 10 Q50 18 90 25 T160 35 T200 45"
                value={"↓ 2.4%"}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1}>
              {/* <a onClick={onClickTotal}>
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
                  count={amountShortner(overDue)}
                  bg="#803D3B"
                />
              </a> */}
              <CustomCard
                total={overDue}
                onClickTotal={onClickTotal}
                cardname="Overdue Amount"
                color="#4caf50"
                graph="M0 0 Q40 0 0 0 T160 0T200 0"
              />
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={12} lg={12}>
              <RepaymentRecommendation />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={6} alignItems="center">
              <MDBox mb={1.5}>
                <StackBarChart color="info" />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <MDBox mb={1}>
                <PieChart color="dark" />
              </MDBox>
              <MDBox mb={1}>
                <EOnboardingChart />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox>
          <Grid container spacing={2}>
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

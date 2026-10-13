/**
=========================================================
* Material Dashboard 2  React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options = {
  layout: {
    padding: 10,
  },
  plugins: {
    title: {
      display: false,
      text: "Program Limit Utilisation",
    },
    legend: {
      labels: {
        boxWidth: 10,
      },
      position: "bottom",
    },
  },

  barPercentage: 0.4,
  responsive: true,
  scales: {
    x: {
      stacked: true,
      grid: {
        color: "rgba(105, 100, 100, 0.16)", // Adjust opacity here for x-axis grid lines
      },
    },
    y: {
      stacked: true,
      grid: {
        color: "rgba(105, 100, 100, 0.16)", // Adjust opacity here for x-axis grid lines
      },
    },
  },
};

function StackBarChart({ color }) {
  const [chartData, setChartData] = useState({
    label: [],
    avalAmount: [],
    utilAmount: [],
  });

  const getData = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchProgramData",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("inside get data", response.data);
      console.log(response.data.map((item) => item.programname));
      setChartData({
        label: response.data.map((item) => item.programname),
        avalAmount: response.data.map((item) => item.programavailableamount),
        utilAmount: response.data.map((item) => item.programutilizedamount),
      });
    } catch (e) {
      console.log(e);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    getData();
  }, []);

  // Define data for the chart based on chartData state
  const data = {
    labels: chartData.label,
    datasets: [
      {
        label: "Available Limit",
        data: chartData.avalAmount, // Fixed reference here
        backgroundColor: "#004831",
      },
      {
        label: "Utilised Limit",
        data: chartData.utilAmount, // Fixed reference here
        backgroundColor: "#4CAE50",
      },
    ],
  };

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox sx={{ px: 1.5 }}>
        {useMemo(
          () => (
            <MDBox
              variant="gradient"
              borderRadius="lg"
              height="23rem"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between", // This will vertically center the content
              }}
            >
              <MDBox
                style={{
                  textAlign: "left",
                  width: "100%",
                  paddingLeft: "1rem",
                  paddingTop: "1rem",
                }}
              >
                <MDTypography variant="h6" textTransform="capitalize">
                  Program Limit Utilisation
                </MDTypography>
              </MDBox>

              {/* This Box will hold and center the Bar chart */}
              <MDBox style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <Bar data={data} options={options} redraw />
              </MDBox>
            </MDBox>
          ),
          [color, data] // Ensure data is a dependency for useMemo
        )}
      </MDBox>
    </Card>
  );
}

StackBarChart.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
};

export default StackBarChart;

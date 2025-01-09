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

import { useMemo, useState, useEffect } from "react";

// porp-types is a library for typechecking of props
import PropTypes from "prop-types";

// react-chartjs-2 components
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useNavigate } from "react-router-dom";
// PieChart configurations
import configs from "examples/Charts/PieChart/configs";
import axios from "axios";
ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ color, height, title, description }) {
  const [value, setValue] = useState([]);
  const navigate = useNavigate();
  const getData = async () => {
    try {
      const response = await axios.get("https://scfdemo.newgensoftware.net:8443/scf/countOfCases", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("inside pie chart");

      const val = Object.values(response.data);
      console.log("this is the value", val);
      setValue(val);
      console.log("this is values", value);
    } catch (e) {
      console.log(e);
    }
  };
  const labels = ["Pending", "Rejected", "Disbursed"];
  const dataset = {
    label: "Invoice",
    data: value,
    backgroundColors: ["#c08552", "#F95454", "#800000"],
  };
  useEffect(() => {
    getData();
    console.log(value);
  }, []);
  const { data, options } = configs(labels, dataset);
  console.log(data);

  const handleChartClick = (event) => {
    const elements = event.chart.getElementsAtEventForMode(
      event.native,
      "nearest",
      { intersect: true },
      false
    );

    if (elements.length) {
      const index = elements[0].index; // Get index of clicked segment
      if (labels[index] === "Disbursed") {
        window.scrollTo({
          top: document.body.scrollHeight - 30, // Scroll to just before the bottom
          behavior: "smooth",
        });
      }
      if (labels[index] === "Rejected") {
        navigate("/admin/all_cases");
      }
      if (labels[index] === "Pending") {
        navigate("/admin/approval_required");
      }
    }
  };

  options.onClick = handleChartClick;

  const renderChart = (
    <Card>
      <MDBox height="20.5rem" sx={{ p: 1.5 }}>
        {useMemo(
          () => (
            <MDBox
              variant="gradient"
              borderRadius="lg"
              height="18.123rem"
              marginTop="1rem"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MDBox
                style={{
                  width: "100%",
                  textAlign: "left",
                  paddingLeft: "1rem",
                }}
              >
                <MDTypography variant="h6" textTransform="capitalize">
                  Invoice Status
                </MDTypography>
              </MDBox>

              <Pie data={data} options={options} redraw />
            </MDBox>
          ),
          [height, data]
        )}
      </MDBox>
    </Card>
  );

  return title || description ? <Card>{renderChart}</Card> : renderChart;
}

// Setting default values for the props of PieChart
PieChart.defaultProps = {
  title: "",
  description: "",
  height: "20.125rem",
};

// Typechecking props for the PieChart
PieChart.propTypes = {
  color: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  height: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  title: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  description: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object]))
    .isRequired,
};

export default PieChart;

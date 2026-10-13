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

import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import axios from "axios";
ChartJS.register(ArcElement, Tooltip, Legend);

const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    if (!chart.chartArea) return; // prevent duplicate draws
    const ctx = chart.ctx;
    const orig =
      chart.data && chart.data._originalCounts
        ? chart.data._originalCounts
        : (chart.data &&
            chart.data.datasets &&
            chart.data.datasets[0] &&
            chart.data.datasets[0].data) ||
          [];
    const total = orig.reduce((s, v) => s + (Number(v) || 0), 0);
    const { left, right, top, bottom } = chart.chartArea;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    ctx.save();
    ctx.font = "400 14px Arial";
    ctx.fillStyle = "#344767";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total.toLocaleString(), centerX, centerY + 20);
    ctx.font = "200 10px Arial";
    ctx.fillStyle = "#6c757d";
    ctx.fillText("Total", centerX, centerY + 36);
    ctx.restore();
  },
};

function PieChart() {
  const [value, setValue] = useState([0, 0, 0]);
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const response = await axios.get(
          "https://scfdemo.newgensoftware.net:8443/scf/countOfCases",
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        const vals = Object.values(response.data || {});
        console.log("Invoice counts:", vals);
        if (mounted) setValue(vals);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
    return () => (mounted = false);
  }, []);

  const labels = ["Pending", "Rejected", "Disbursed"];
  // compute displayed data with a minimum angular threshold so tiny slices remain visible
  const adjustForMin = (vals, minFraction = 0.02) => {
    const orig = vals.map((v) => Number(v) || 0);
    const total = orig.reduce((a, b) => a + b, 0);
    if (total === 0) return orig;
    const minVal = total * minFraction;
    let displayed = orig.map((v) => Math.max(v, minVal));
    let sumDisplayed = displayed.reduce((a, b) => a + b, 0);
    let excess = sumDisplayed - total;
    if (excess <= 0) return displayed;
    // reduce proportionally from values that are above minVal
    const reducible = orig
      .map((v, i) => ({ i, amount: Math.max(v - minVal, 0) }))
      .filter((r) => r.amount > 0);
    const sumReducible = reducible.reduce((s, r) => s + r.amount, 0);
    if (sumReducible <= 0) return orig;
    reducible.forEach((r) => {
      const reduceBy = (r.amount / sumReducible) * excess;
      displayed[r.i] = Math.max(minVal, displayed[r.i] - reduceBy);
    });
    // final numeric adjust to ensure sums match due to rounding
    const finalSum = displayed.reduce((a, b) => a + b, 0);
    const diff = finalSum - total;
    if (Math.abs(diff) > 1e-6) {
      const maxIdx = displayed.reduce((mi, cur, idx, arr) => (cur > arr[mi] ? idx : mi), 0);
      displayed[maxIdx] = Math.max(minVal, displayed[maxIdx] - diff);
    }
    return displayed;
  };

  const displayedData = adjustForMin(value, 0.02);
  const data = {
    labels: ["Pending", "Rejected", "Disbursed"],
    // attach original counts so plugins/tooltips can show true values
    _originalCounts: value,
    datasets: [
      {
        data: displayedData,
        backgroundColor: ["#042218", "#EF4545", "#008533"],
        borderWidth: 1,
      },
    ],
  };
  // make it a doughnut with a visible cutout (smaller cutout => thicker arc)
  if (data && data.datasets && data.datasets[0]) {
    data.datasets[0].cutout = "50%";
    // data.datasets[0].borderWidth = 2;
    // data.datasets[0].borderColor = "#ffffff";
  }

  // Use numeric radians for rotation/circumference and override legend click
  const hexToRgba = (hex, alpha) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h,
      16
    );
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const options = {
    rotation: "-90",
    circumference: "180",
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          padding: 8,
        },
        // override default behavior which toggles dataset visibility
        onClick: function (evt, legendItem, legend) {
          const index = legendItem.index;
          const chart = legend.chart;
          const ds = chart.data.datasets[0];
          // store original colors/widths once
          if (!chart.$originalBg) chart.$originalBg = ds.backgroundColor.slice();
          if (!chart.$originalBorderWidth) {
            chart.$originalBorderWidth = Array.isArray(ds.borderWidth)
              ? ds.borderWidth.slice()
              : chart.$originalBg.map(() => ds.borderWidth || 1);
          }

          // toggle selection: clicking same label clears highlight
          if (chart.$selectedIndex === index) {
            // restore original
            ds.backgroundColor = chart.$originalBg.slice();
            ds.borderWidth = chart.$originalBorderWidth.slice();
            chart.$selectedIndex = null;
          } else {
            chart.$selectedIndex = index;
            ds.backgroundColor = chart.$originalBg.map((c, i) =>
              i === index ? c : hexToRgba(c, 0.5)
            );
            ds.borderWidth = chart.$originalBg.map((_, i) => (i === index ? 4 : 1));
          }
          chart.update();
        },
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const label = ctx.label || "";
            // show original value not the adjusted display value
            const original =
              (ctx.chart &&
                ctx.chart.data &&
                ctx.chart.data._originalCounts &&
                ctx.chart.data._originalCounts[ctx.dataIndex]) ||
              ctx.raw;
            const total =
              (ctx.chart &&
                ctx.chart.data &&
                ctx.chart.data._originalCounts &&
                ctx.chart.data._originalCounts.reduce((a, b) => a + b, 0)) ||
              ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total ? ((original / total) * 100).toFixed(1) : 0;
            return `${label}: ${original} (${pct}%)`;
          },
        },
      },
    },
  };

  /*return (
    <Card>
      <MDBox height="20.5rem" sx={{ p: 1.5 }}>
        <MDBox style={{ width: "100%", textAlign: "left", paddingLeft: "1rem" }}>
          <MDTypography variant="h6" textTransform="capitalize">
            Invoice Status
          </MDTypography>
        </MDBox>
        <div>
          <div>
            <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
          </div>
        </div>
      </MDBox>
    </Card>
  );*/

  return (
    <Card>
      <MDBox style={{ width: "100%", textAlign: "left", paddingLeft: "1rem" }}>
        <MDTypography variant="h6" textTransform="capitalize">
          Invoice Status
        </MDTypography>
      </MDBox>
      <div
        style={{
          width: "460px",
          height: "130px",
          margin: "auto",
          textAlign: "center",
        }}
      >
        <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
      </div>
    </Card>
  );
}

export default PieChart;

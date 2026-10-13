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

import { useState, useEffect, useRef } from "react";
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
  // Initialize counts to zeros until API response arrives
  const initialCounts = new Array(8).fill(0);
  const [counts, setCounts] = useState(initialCounts);

  //   const labels = ["Pending", "Rejected", "Disbursed"];
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

  const displayedData = adjustForMin(counts, 0.01);
  const apiToDisplay = {
    onboardingRequestsReceived: "Requests Received",
    spokeAcceptancePending: "Spoke Pending",
    acceptedBySpoke: "Spoke Accepted",
    pendingWithBranchMaker: "Maker Pending",
    pendingWithBranchChecker: "Checker Pending",
    spokesOnboarded: "Spokes Onboarded",
    rejectedRequestsFromSpoke: "Spoke Rejected",
    rejectedRequestsFromBank: "Bank Rejected",
  };

  const apiLabels = [
    "onboardingRequestsReceived",
    "spokeAcceptancePending",
    "acceptedBySpoke",
    "pendingWithBranchMaker",
    "pendingWithBranchChecker",
    "spokesOnboarded",
    "rejectedRequestsFromSpoke",
    "rejectedRequestsFromBank",
  ];

  // Fetch real counts from API and map to the ordered labels above
  useEffect(() => {
    let mounted = true;
    axios
      .get("https://scfdemo.newgensoftware.net:8443/scf/fetchOnboardingStatusCount", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        const data = (res && res.data) || {};
        // debug: log API response and mapped counts
        // eslint-disable-next-line no-console
        console.log("E-Onboarding API response:", data);
        const mapped = apiLabels.map((k) => Number(data[k]) || 0);
        // eslint-disable-next-line no-console
        console.log("E-Onboarding mapped counts:", mapped);
        if (mounted) setCounts(mapped);
      })
      .catch((err) => {
        // keep initial values on error, but log for debugging
        // eslint-disable-next-line no-console
        console.error("Failed to fetch E-Onboarding counts:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const labels = apiLabels.map((l) => apiToDisplay[l] ?? l);
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
  ];

  const data = {
    labels,
    // attach original counts so plugins/tooltips can show true values
    _originalCounts: counts,
    datasets: [
      {
        data: displayedData,
        backgroundColor: colors,
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

  // chart ref to allow programmatic updates from custom legend
  const chartRef = useRef(null);

  const handleLegendClick = (index) => {
    const chart = chartRef.current;
    if (!chart) return;
    const ds = chart.data.datasets[0];
    // store original colors/widths once
    if (!chart.$originalBg) chart.$originalBg = ds.backgroundColor.slice();
    if (!chart.$originalBorderWidth) {
      chart.$originalBorderWidth = Array.isArray(ds.borderWidth)
        ? ds.borderWidth.slice()
        : chart.$originalBg.map(() => ds.borderWidth || 1);
    }

    if (chart.$selectedIndex === index) {
      ds.backgroundColor = chart.$originalBg.slice();
      ds.borderWidth = chart.$originalBorderWidth.slice();
      chart.$selectedIndex = null;
    } else {
      chart.$selectedIndex = index;
      ds.backgroundColor = chart.$originalBg.map((c, i) => (i === index ? c : hexToRgba(c, 0.5)));
      ds.borderWidth = chart.$originalBg.map((_, i) => (i === index ? 4 : 1));
    }
    chart.update();
  };

  const options = {
    rotation: "-90",
    circumference: "180",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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

  return (
    <Card>
      <MDBox style={{ width: "100%", textAlign: "left", paddingLeft: "1rem" }}>
        <MDTypography variant="h6" textTransform="capitalize">
          E-Onboarding Status
        </MDTypography>
      </MDBox>
      <div style={{ width: "100%", textAlign: "center", paddingTop: 0 }}>
        <div style={{ width: 230, height: 140, margin: "0 auto" }}>
          <Doughnut ref={chartRef} data={data} options={options} plugins={[centerTextPlugin]} />
        </div>

        {/* Custom two-row legend: 4 items per row */}
        <div
          style={{
            width: 450,
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {[0, 1].map((row) => (
            <div key={row} style={{ display: "flex", justifyContent: "center", gap: 5 }}>
              {labels.slice(row * 4, row * 4 + 4).map((lab, idx) => {
                const color = data.datasets[0].backgroundColor[row * 4 + idx];
                const itemIndex = row * 4 + idx;
                return (
                  <div
                    key={lab}
                    style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                    onClick={() => handleLegendClick(itemIndex)}
                  >
                    <div style={{ width: 13, height: 12, background: color, borderRadius: 10 }} />
                    <div style={{ fontSize: 12, color: "#39424a" }}>{lab}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default PieChart;

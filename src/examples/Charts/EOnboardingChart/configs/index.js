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

/* eslint-disable no-dupe-keys */
// Material Dashboard 2 React base styles
import colors from "assets/theme/base/colors";
import { position } from "stylis";

const { gradients, dark } = colors;

function configs(labels, datasets) {
  const backgroundColors = [];

  if (datasets.backgroundColors) {
    datasets.backgroundColors.forEach((color) =>
      gradients[color]
        ? backgroundColors.push(gradients[color].state)
        : backgroundColors.push(dark.main)
    );
  } else {
    backgroundColors.push(dark.main);
  }

  return {
    data: {
      labels,
      datasets: [
        {
  label: datasets.label,
  weight: 9,
  //cutout: "65%",
  borderWidth: 2,
  borderColor: "#ffffff",
  backgroundColor: datasets.backgroundColors,
  fill: true,
  data: datasets.data,
},
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            boxWidth: 10,
          },
          display: true,
          position: "bottom",
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
    },
  };
}

export default configs;

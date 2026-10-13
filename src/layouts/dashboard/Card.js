import React from "react";
import { Card } from "@mui/material";
import PropTypes from "prop-types";
import "./compactTiles.css";

const CustomCard = ({ total, onClickTotal, cardname, color, graph, value }) => {
  return (
    <Card onClick={onClickTotal} className="compactKpiCard" style={{ "--kpi-color": color }}>
      {/* Top Section */}
      <div className="kpi-top">
        <span className="kpi-title">{cardname}</span>

        <span className="kpi-change">{value}</span>
      </div>

      {/* Main Value */}
      <div className="kpi-value">
        <span>{total}</span>
        <span className="kpi-sub">This Month</span>
      </div>

      {/* Animated Trend Chart */}
      <svg viewBox="0 0 200 50">
        <path
          d={graph}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            strokeDasharray: 300,
            strokeDashoffset: 300,
            animation: "drawLine 2s ease forwards",
          }}
        />
      </svg>

      <style>
        {`
          @keyframes drawLine {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
    </Card>
  );
};

CustomCard.propTypes = {
  total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClickTotal: PropTypes.func,
  cardname: PropTypes.string,
  color: PropTypes.string,
  graph: PropTypes.string,
  value: PropTypes.string,
};

export default CustomCard;

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { fetchRepaymentRecommendation } from "./data";

const NAVY = "#0b2a66";
const BLUE = "#1769e0";
const GREEN = "#1aa260";
const ORANGE = "#f79009";

const headCellStyle = {
  backgroundColor: NAVY,
  color: "#ffffff !important",
  fontSize: "0.74rem",
  fontWeight: 700,
  textAlign: "center",
  borderRight: "1px solid rgba(255,255,255,0.18)",
  borderBottom: "none",
  padding: "5px 8px",
  whiteSpace: "nowrap",
};

const milestoneCellStyle = (bg) => ({
  ...headCellStyle,
  backgroundColor: bg,
  padding: "4px 6px",
  fontSize: "0.7rem",
});

const bodyCellStyle = {
  fontSize: "0.74rem",
  textAlign: "center",
  borderBottom: "1px solid #e6e9ee",
  padding: "5px 8px",
  whiteSpace: "nowrap",
};

function MilestoneHeader({ icon, label }) {
  return (
    <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
      {icon}
      <span>{label}</span>
    </MDBox>
  );
}

MilestoneHeader.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
};

function MilestoneValue({ icon, value, color, bold }) {
  return (
    <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
      {icon}
      <MDTypography
        variant="caption"
        fontWeight={bold ? "bold" : "regular"}
        sx={{ color, fontSize: "0.74rem" }}
      >
        {value}
      </MDTypography>
    </MDBox>
  );
}

MilestoneValue.propTypes = {
  icon: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  color: PropTypes.string,
  bold: PropTypes.bool,
};

MilestoneValue.defaultProps = {
  color: "#344767",
  bold: false,
};

function RepaymentRecommendation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const rows = await fetchRepaymentRecommendation();
      if (isMounted) {
        setData(rows);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox px={2} pt={1.5} pb={0.5}>
        <MDTypography variant="h6" textTransform="capitalize" sx={{ fontSize: "0.95rem" }}>
          Repayment Recommendation
        </MDTypography>
      </MDBox>

      <MDBox px={2} pb={1.5}>
        <TableContainer sx={{ boxShadow: "none", borderRadius: "6px" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead sx={{ display: "table-header-group" }}>
              <TableRow>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "6%" }}>
                  Rank
                </TableCell>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "18%" }}>
                  Spoke Name
                </TableCell>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "20%" }}>
                  Reference No.
                </TableCell>
                <TableCell colSpan={3} sx={{ ...headCellStyle, width: "33%" }}>
                  Tenor Milestones
                </TableCell>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "23%", borderRight: "none" }}>
                  Utilized Amount (USD)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...milestoneCellStyle(BLUE), width: "11%", minWidth: "100px" }}>
                  <MilestoneHeader
                    icon={<CalendarMonthIcon sx={{ fontSize: "0.82rem", color: "#ffffff" }} />}
                    label="Total Tenor"
                  />
                </TableCell>
                <TableCell sx={{ ...milestoneCellStyle(GREEN), width: "11%", minWidth: "100px" }}>
                  <MilestoneHeader
                    icon={<CheckCircleIcon sx={{ fontSize: "0.82rem", color: "#ffffff" }} />}
                    label="Tenor Utilized"
                  />
                </TableCell>
                <TableCell sx={{ ...milestoneCellStyle(ORANGE), width: "11%", minWidth: "100px" }}>
                  <MilestoneHeader
                    icon={<AccessTimeIcon sx={{ fontSize: "0.82rem", color: "#ffffff" }} />}
                    label="Remaining Days"
                  />
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={`${row.rank}-${row.referenceNo}`}
                  sx={{ backgroundColor: index % 2 === 1 ? "#f2f5fb" : "#ffffff" }}
                >
                  <TableCell sx={bodyCellStyle}>
                    <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <MDTypography
                        variant="button"
                        fontWeight="bold"
                        sx={{ color: BLUE, fontSize: "0.8rem" }}
                      >
                        {row.rank}
                      </MDTypography>
                      {row.rank === 1 && <StarIcon sx={{ fontSize: "0.82rem", color: ORANGE }} />}
                    </MDBox>
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MDTypography
                      variant="caption"
                      fontWeight="medium"
                      sx={{ color: "#344767", fontSize: "0.74rem" }}
                    >
                      {row.spokeName}
                    </MDTypography>
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MDTypography
                      variant="caption"
                      fontWeight="medium"
                      sx={{ color: BLUE, fontSize: "0.74rem" }}
                    >
                      {row.referenceNo}
                    </MDTypography>
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MilestoneValue
                      icon={<CalendarMonthIcon sx={{ fontSize: "0.82rem", color: BLUE }} />}
                      value={row.totalTenor}
                    />
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MilestoneValue
                      icon={<CheckCircleIcon sx={{ fontSize: "0.82rem", color: GREEN }} />}
                      value={row.tenorUtilized}
                    />
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MilestoneValue
                      icon={<AccessTimeIcon sx={{ fontSize: "0.82rem", color: ORANGE }} />}
                      value={row.remainingDays}
                      color="#e02424"
                      bold
                    />
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MDTypography
                      variant="caption"
                      fontWeight="medium"
                      sx={{ color: "#344767", fontSize: "0.74rem" }}
                    >
                      {row.utilizedAmount}
                    </MDTypography>
                  </TableCell>
                </TableRow>
              ))}

              {!data.length && (
                <TableRow>
                  <TableCell colSpan={7} sx={bodyCellStyle}>
                    <MDTypography variant="caption" color="text" sx={{ fontSize: "0.75rem" }}>
                      {loading ? "Loading..." : "No records found"}
                    </MDTypography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MDBox>
    </Card>
  );
}

export default RepaymentRecommendation;

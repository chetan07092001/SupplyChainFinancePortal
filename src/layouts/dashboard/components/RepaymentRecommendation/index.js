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
  fontSize: "0.78rem",
  fontWeight: 700,
  textAlign: "center",
  borderRight: "1px solid rgba(255,255,255,0.18)",
  borderBottom: "none",
  padding: "10px 12px",
  whiteSpace: "nowrap",
};

const milestoneCellStyle = (bg) => ({
  ...headCellStyle,
  backgroundColor: bg,
});

const bodyCellStyle = {
  fontSize: "0.8rem",
  textAlign: "center",
  borderBottom: "1px solid #e6e9ee",
  padding: "10px 12px",
  whiteSpace: "nowrap",
};

function MilestoneHeader({ icon, label }) {
  return (
    <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.75}>
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
    <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.75}>
      {icon}
      <MDTypography
        variant="caption"
        fontWeight={bold ? "bold" : "regular"}
        sx={{ color, fontSize: "0.8rem" }}
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
      <MDBox px={2} pt={2} pb={1}>
        <MDTypography variant="h6" textTransform="capitalize">
          Repayment Recommendation
        </MDTypography>
      </MDBox>

      <MDBox px={2} pb={2}>
        <TableContainer sx={{ boxShadow: "none", borderRadius: "6px" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead sx={{ display: "table-header-group" }}>
              <TableRow>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "10%" }}>
                  Rank
                </TableCell>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "22%" }}>
                  Reference No.
                </TableCell>
                <TableCell colSpan={3} sx={headCellStyle}>
                  Tenor Milestones
                </TableCell>
                <TableCell rowSpan={2} sx={{ ...headCellStyle, width: "22%", borderRight: "none" }}>
                  Utilized Amount (USD)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={milestoneCellStyle(BLUE)}>
                  <MilestoneHeader
                    icon={<CalendarMonthIcon sx={{ fontSize: "1rem", color: "#ffffff" }} />}
                    label="Total Tenor"
                  />
                </TableCell>
                <TableCell sx={milestoneCellStyle(GREEN)}>
                  <MilestoneHeader
                    icon={<CheckCircleIcon sx={{ fontSize: "1rem", color: "#ffffff" }} />}
                    label="Tenor Utilized"
                  />
                </TableCell>
                <TableCell sx={milestoneCellStyle(ORANGE)}>
                  <MilestoneHeader
                    icon={<AccessTimeIcon sx={{ fontSize: "1rem", color: "#ffffff" }} />}
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
                    <MDBox display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <MDTypography
                        variant="button"
                        fontWeight="bold"
                        sx={{ color: BLUE, fontSize: "0.9rem" }}
                      >
                        {row.rank}
                      </MDTypography>
                      {row.rank === 1 && <StarIcon sx={{ fontSize: "1rem", color: ORANGE }} />}
                    </MDBox>
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MDTypography
                      variant="caption"
                      fontWeight="medium"
                      sx={{ color: BLUE, fontSize: "0.8rem" }}
                    >
                      {row.referenceNo}
                    </MDTypography>
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MilestoneValue
                      icon={<CalendarMonthIcon sx={{ fontSize: "1rem", color: BLUE }} />}
                      value={row.totalTenor}
                    />
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MilestoneValue
                      icon={<CheckCircleIcon sx={{ fontSize: "1rem", color: GREEN }} />}
                      value={row.tenorUtilized}
                    />
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MilestoneValue
                      icon={<AccessTimeIcon sx={{ fontSize: "1rem", color: ORANGE }} />}
                      value={row.remainingDays}
                      color="#e02424"
                      bold
                    />
                  </TableCell>

                  <TableCell sx={bodyCellStyle}>
                    <MDTypography
                      variant="caption"
                      fontWeight="medium"
                      sx={{ color: "#344767", fontSize: "0.8rem" }}
                    >
                      {row.utilizedAmount}
                    </MDTypography>
                  </TableCell>
                </TableRow>
              ))}

              {!data.length && (
                <TableRow>
                  <TableCell colSpan={6} sx={bodyCellStyle}>
                    <MDTypography variant="caption" color="text" sx={{ fontSize: "0.8rem" }}>
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

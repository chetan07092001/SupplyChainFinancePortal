import { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import {
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableContainer,
  TableRow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TableRowsIcon from "@mui/icons-material/TableRows";
import Icon from "@mui/material/Icon";
import { useTable, usePagination, useSortBy, useGlobalFilter } from "react-table";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDPagination from "components/MDPagination";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTableHeadCell from "examples/Tables/DataTable/DataTableHeadCell";
import DataTableBodyCell from "examples/Tables/DataTable/DataTableBodyCell";
import DataTable from "examples/Tables/DataTable";

import LimitInsightsData from "./data.js";
import "animate.css";
import axios from "axios";

// ── Spoke analysis API ────────────────────────────────────────────────────────
const SPOKE_API_BASE = "https://scfdemo.newgensoftware.net:8443/scf/fetchSpokeLimitAnalysis";

// Columns to display in the spoke detail table (in order, only non-null fields)
const SPOKE_COLUMNS = [
  { key: "spokeId", label: "Spoke ID" },
  { key: "spokeName", label: "Spoke Name" },
  { key: "currency", label: "Currency" },
  { key: "sanctionedLimit", label: "Sanctioned Limit" },
  { key: "utilizedLimit", label: "Utilized Limit" },
  { key: "availableLimit", label: "Available Limit" },
  { key: "utilizedPercentage", label: "Utilization %" },
  { key: "status", label: "Status" },
  { key: "relevantInsight", label: "Relevant Insight" },
];

const fetchSpokeData = async (program) => {
  const url = `${SPOKE_API_BASE}?Program=${encodeURIComponent(program)}`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return Array.isArray(response.data) ? response.data : [];
};

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const color =
    status?.toLowerCase() === "normal"
      ? "success"
      : status?.toLowerCase() === "warning"
      ? "warning"
      : status?.toLowerCase() === "critical"
      ? "error"
      : "default";
  return (
    <Chip
      label={status || "—"}
      color={color}
      size="small"
      sx={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: 0.3 }}
    />
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: null,
};

// ── Relevant Insight Cell (2-line wrap) ───────────────────────────────────────
function SpokeInsightCell({ value }) {
  const text =
    value?.props?.children ?? (value === null || value === undefined ? "—" : String(value));
  return (
    <MDBox
      sx={{
        minWidth: "300px",
        maxWidth: "380px",
        whiteSpace: "normal",
        wordBreak: "break-word",
        lineHeight: 1.7,
      }}
    >
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {text}
      </MDTypography>
    </MDBox>
  );
}

SpokeInsightCell.propTypes = {
  value: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.number]),
};

SpokeInsightCell.defaultProps = {
  value: null,
};

// ── Format numbers ────────────────────────────────────────────────────────────
const formatValue = (key, value) => {
  if (value === null || value === undefined) return "—";
  if (
    ["sanctionedLimit", "utilizedLimit", "availableLimit"].includes(key) &&
    typeof value === "number"
  ) {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
  }
  return String(value);
};

// ── Clickable main table ──────────────────────────────────────────────────────
function ClickableDataTable({ columns, rows, onRowClick }) {
  const cols = useMemo(() => columns, [columns]);
  const data = useMemo(() => rows, [rows]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageOptions,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    { columns: cols, data, initialState: { pageIndex: 0, pageSize: 15 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <TableContainer sx={{ boxShadow: "none" }}>
      <Table {...getTableProps()}>
        <MDBox component="thead">
          {headerGroups.map((hg, k) => (
            <TableRow key={k} {...hg.getHeaderGroupProps()}>
              {hg.headers.map((col, idx) => (
                <DataTableHeadCell
                  key={idx}
                  {...col.getHeaderProps(col.getSortByToggleProps())}
                  width={col.width || "auto"}
                  align={col.align || "left"}
                  sorted={col.isSorted ? (col.isSortedDesc ? "desc" : "asce") : "none"}
                >
                  {col.render("Header")}
                </DataTableHeadCell>
              ))}
            </TableRow>
          ))}
        </MDBox>
        <TableBody {...getTableBodyProps()}>
          {page.map((row, key) => {
            prepareRow(row);
            return (
              <TableRow
                key={key}
                {...row.getRowProps()}
                onClick={() => onRowClick(row)}
                sx={{
                  cursor: "pointer",
                  transition: "background 0.18s ease",
                  "&:hover": { background: "rgba(46,125,50,0.07)" },
                }}
              >
                {row.cells.map((cell, idx) => (
                  <DataTableBodyCell
                    key={idx}
                    noBorder={false}
                    align={cell.column.align || "left"}
                    {...cell.getCellProps()}
                  >
                    {cell.render("Cell")}
                  </DataTableBodyCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <MDTypography variant="button" color="secondary" fontWeight="regular">
          Showing {pageIndex * 15 + 1}–{Math.min((pageIndex + 1) * 15, data.length)} of{" "}
          {data.length} entries
        </MDTypography>

        {pageOptions.length > 1 && (
          <MDPagination variant="gradient" color="info">
            {canPreviousPage && (
              <MDPagination item onClick={() => previousPage()}>
                <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
              </MDPagination>
            )}
            {pageOptions.map((opt) => (
              <MDPagination item key={opt} onClick={() => gotoPage(opt)} active={pageIndex === opt}>
                {opt + 1}
              </MDPagination>
            ))}
            {canNextPage && (
              <MDPagination item onClick={() => nextPage()}>
                <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
              </MDPagination>
            )}
          </MDPagination>
        )}
      </MDBox>
    </TableContainer>
  );
}

ClickableDataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRowClick: PropTypes.func.isRequired,
};

// ── Main page ─────────────────────────────────────────────────────────────────
function LimitInsights() {
  const { columns, rows } = LimitInsightsData();

  const [modalOpen, setModalOpen] = useState(false);
  const [spokeRows, setSpokeRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState("");

  // Attach _programValue so handleRowClick can extract it
  const clickableRows = rows.map((row) => {
    const programValue =
      row.program?.props?.children ??
      row.Program?.props?.children ??
      row.program ??
      row.Program ??
      "";
    return { ...row, _programValue: programValue };
  });

  const handleRowClick = useCallback(async (row) => {
    const program = String(row.original?._programValue || "").trim();
    if (!program || program === "-") return;

    setSelectedProgram(program);
    setModalOpen(true);
    setLoading(true);
    setFetchError(null);
    setSpokeRows([]);

    try {
      const data = await fetchSpokeData(program);
      setSpokeRows(data);
    } catch (err) {
      console.error("Spoke API error:", err);
      setFetchError("Failed to load spoke data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Build columns for the spoke detail table
  const spokeColumns = SPOKE_COLUMNS.map(({ key, label }) => {
    if (key === "relevantInsight") {
      return {
        Header: label,
        accessor: key,
        align: "left",
        Cell: SpokeInsightCell,
      };
    }
    return {
      Header: label,
      accessor: key,
      align: "left",
    };
  });

  // Build rows for the spoke detail table
  const spokeTableRows = spokeRows.map((item, i) => {
    const row = {};
    SPOKE_COLUMNS.forEach(({ key }) => {
      const val = item[key];
      if (key === "status") {
        row[key] = <StatusBadge key={`${i}-s`} status={val} />;
      } else if (key === "relevantInsight") {
        row[key] = (
          <MDTypography
            key={`${i}-ri`}
            variant="caption"
            color="text"
            fontWeight="medium"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "normal",
              wordBreak: "break-word",
              minWidth: "280px",
              lineHeight: 1.6,
            }}
          >
            {val || "—"}
          </MDTypography>
        );
      } else {
        row[key] = (
          <MDTypography key={`${i}-${key}`} variant="caption" color="text" fontWeight="medium">
            {formatValue(key, val)}
          </MDTypography>
        );
      }
    });
    return row;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox mt={8} className="animate__animated animate__fadeIn">
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={3} pl={3} pb={1}>
                  <MDTypography variant="caption" color="secondary">
                    💡 Click on any row to view spoke-level limit analysis
                  </MDTypography>
                </MDBox>
                <MDBox pt={1}>
                  <ClickableDataTable
                    columns={columns}
                    rows={clickableRows}
                    onRowClick={handleRowClick}
                  />
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>

      {/* ── Spoke Detail Modal ───────────────────────────────────────────── */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          },
        }}
      >
        {/* Green gradient header */}
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
            color: "#fff",
            py: 2,
            px: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <TableRowsIcon sx={{ fontSize: 22 }} />
          <MDTypography variant="h6" color="white" fontWeight="bold">
            Spoke Limit Analysis
          </MDTypography>
          {selectedProgram && (
            <Chip
              label={`Program: ${selectedProgram}`}
              size="small"
              sx={{
                ml: 1,
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          )}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{
              ml: "auto",
              color: "#fff",
              "&:hover": { background: "rgba(255,255,255,0.15)" },
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, background: "#f8faf9" }}>
          {/* Loading */}
          {loading && (
            <MDBox
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={8}
              flexDirection="column"
              gap={2}
            >
              <CircularProgress sx={{ color: "#2E7D32" }} size={48} />
              <MDTypography variant="body2" color="secondary">
                Loading spoke data…
              </MDTypography>
            </MDBox>
          )}

          {/* Error */}
          {fetchError && !loading && (
            <MDBox display="flex" justifyContent="center" alignItems="center" py={6}>
              <MDTypography variant="body2" color="error">
                {fetchError}
              </MDTypography>
            </MDBox>
          )}

          {/* Empty */}
          {!loading && !fetchError && spokeRows.length === 0 && (
            <MDBox display="flex" justifyContent="center" alignItems="center" py={6}>
              <MDTypography variant="body2" color="secondary">
                No spoke data found for this program.
              </MDTypography>
            </MDBox>
          )}

          {/* Table */}
          {!loading && !fetchError && spokeTableRows.length > 0 && (
            <MDBox p={2}>
              <Card sx={{ borderRadius: "12px", overflow: "hidden" }}>
                <DataTable
                  table={{ columns: spokeColumns, rows: spokeTableRows }}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                  canSearch={false}
                />
              </Card>
            </MDBox>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default LimitInsights;

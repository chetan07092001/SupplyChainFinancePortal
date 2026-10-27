import PropTypes from "prop-types";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";

function RelevantInsightCell({ value }) {
  const text =
    value?.props?.children ?? (value === null || value === undefined ? "-" : String(value));
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

RelevantInsightCell.propTypes = {
  value: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.number]),
};

RelevantInsightCell.defaultProps = {
  value: null,
};
const API_URL = "https://scfdemo.newgensoftware.net:8443/scf/fetchLimitAnalysis";

// Handle common API response formats.
const getRecords = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.result)) return response.result;
    if (Array.isArray(response.records)) return response.records;
    if (Array.isArray(response.content)) return response.content;
  }

  return [];
};

const formatHeader = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const transformRows = (records) =>
  records.map((item, index) => {
    const row = { _rowId: index };

    Object.entries(item).forEach(([key, value]) => {
      const displayValue =
        value === null || value === undefined
          ? "-"
          : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      if (key.toLowerCase() === "relevantinsight") {
        row[key] = (
          <MDTypography
            key={`${index}-${key}`}
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
              minWidth: "260px",
              lineHeight: 1.6,
            }}
          >
            {displayValue}
          </MDTypography>
        );
      } else {
        row[key] = (
          <MDTypography key={`${index}-${key}`} variant="caption" color="text" fontWeight="medium">
            {displayValue}
          </MDTypography>
        );
      }
    });

    return row;
  });

export default function LimitInsightsData() {
  const { data, error, isPending } = useQuery({
    queryKey: ["limitInsightsData"],
    queryFn: async () => {
      const response = await useFetchScfApi({
        url: API_URL,
      });

      console.log("Limit Insights API response:", response);

      return response;
    },
  });

  if (error) {
    console.error("Limit Insights API error:", error);
  }

  const records = getRecords(data);

  const serialNoColumn = {
    Header: "S.No",
    accessor: "_serialNo",
    align: "center",
    width: "60px",
  };

  const dataColumns =
    records.length > 0
      ? Object.keys(records[0])
          .filter(
            (key) =>
              ![
                "spokeid",
                "spoke_id",
                "spoke name",
                "spokename",
                "spoke_name",
                "view",
                "transdate",
              ].includes(key.toLowerCase())
          )
          .map((key) => {
            if (key.toLowerCase() === "relevantinsight") {
              return {
                Header: formatHeader(key),
                accessor: key,
                align: "left",
                Cell: RelevantInsightCell,
              };
            }
            return {
              Header: formatHeader(key),
              accessor: key,
              align: "left",
            };
          })
      : [];

  const columns = records.length > 0 ? [serialNoColumn, ...dataColumns] : [];

  const rows = isPending
    ? []
    : transformRows(records).map((row, index) => ({
        ...row,
        _serialNo: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {index + 1}
          </MDTypography>
        ),
      }));

  return {
    columns,
    rows,
    isPending,
    error,
  };
}

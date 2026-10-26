

import MDTypography from "components/MDTypography";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
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
      row[key] = (
        <MDTypography key={`${index}-${key}`} variant="caption" color="text" fontWeight="medium">
          {value === null || value === undefined
            ? "-"
            : typeof value === "object"
            ? JSON.stringify(value)
            : String(value)}
        </MDTypography>
      );
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

  const columns =
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
          .map((key) => ({
            Header: formatHeader(key),
            accessor: key,
            align: "left",
          }))
      : [];

  const rows = isPending ? [] : transformRows(records);

  return {
    columns,
    rows,
    isPending,
    error,
  };
}

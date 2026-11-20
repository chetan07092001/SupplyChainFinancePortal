import MDTypography from "components/MDTypography";
import Chip from "@mui/material/Chip";
import { useState } from "react";
import { Icon, IconButton } from "@mui/material";
import axios from "axios";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";

const statusColors = {
  DISBURSED: "#008533",
  PARTIALLYDISBURSED: "#748D92",
  PARTIALLYSETTLED: "#748D92",
  REJECTED: "#d32f2f",
};

const getStatusColor = (status) =>
  statusColors[
    String(status)
      .replace(/[\s_-]+/g, "")
      .toUpperCase()
  ];

const normalizeStatus = (status) =>
  String(status)
    .replace(/[\s_-]+/g, "")
    .toUpperCase();

const getStatusGroup = (status) => {
  const normalizedStatus = normalizeStatus(status);

  return normalizedStatus === "PARTIALLYSETTLED" ? "PARTIALLYDISBURSED" : normalizedStatus;
};

const statusChipStyle = (backgroundColor) => ({
  backgroundColor,
  color: "#fff",
  height: 26,
  maxWidth: "none",
  borderRadius: "999px",
  "& .MuiChip-label": {
    px: 1.5,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.3px",
    overflow: "visible",
    textOverflow: "clip",
    whiteSpace: "nowrap",
  },
});

const viewDoc = async (item) => {
  const wiName = item?.settlementReferenceNo || item?.winame;
  console.log(wiName + " WID");

  const token = localStorage.getItem("token");
  let sID;
  try {
    const response = await axios.get("https://scfdemo.newgensoftware.net:8443/scf/fetchSessionId", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    sID = response.data;
  } catch (error) {
    sID = await useSessionId();
  }
  console.log(sID + " SID");

  if (wiName && wiName !== "-") {
    window.open(
      `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
    );
  }
  console.log(item);
};

const transformData = (data) =>
  data.map((item, idx) =>
    Object.fromEntries(
      Object.entries({
        sno: idx + 1,
        winame: item.winame || "-",
        spokeName: item.spokeName || "-",
        spokeCode: item.spokeCode || "-",
        referenceNo: item.referenceNo || "-",
        settlementReferenceNo: item.settlementReferenceNo || "-",
        outstandingAmount:
          item.outstandingAmount != null
            ? Number(item.outstandingAmount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "-",
        daysRemaining: item.daysRemaining != null ? item.daysRemaining : "-",
        transactionDate: item.transactionDate || "-",
        status: item.status || "-",
        view: "view",
      }).map(([key, value]) => {
        if (key === "view") {
          return [
            key,
            <IconButton
              key={key}
              size="small"
              disableRipple
              color="inherit"
              onClick={() => viewDoc(item)}
            >
              <Icon>visibility</Icon>
            </IconButton>,
          ];
        }

        const statusColor = key === "status" ? getStatusColor(value) : undefined;

        return [
          key,
          statusColor ? (
            <Chip
              key={key}
              label={String(value).toUpperCase()}
              size="small"
              sx={statusChipStyle(statusColor)}
            />
          ) : (
            <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
              {value}
            </MDTypography>
          ),
        ];
      })
    )
  );

const COLUMNS = [
  { Header: "S.No", accessor: "sno", width: "7%", align: "left" },
  { Header: "WI NAME", accessor: "winame", width: "15%", align: "left" },
  { Header: "SPOKE NAME", accessor: "spokeName", width: "12%", align: "left" },
  { Header: "SPOKE CODE", accessor: "spokeCode", width: "10%", align: "left" },
  { Header: "REFERENCE NO.", accessor: "referenceNo", width: "12%", align: "left" },
  {
    Header: "SETTLEMENT REF. NO.",
    accessor: "settlementReferenceNo",
    width: "12%",
    align: "left",
  },
  { Header: "OUTSTANDING AMOUNT", accessor: "outstandingAmount", width: "12%", align: "left" },
  { Header: "DAYS REMAINING", accessor: "daysRemaining", width: "8%", align: "left" },
  { Header: "TRANSACTION DATE", accessor: "transactionDate", width: "12%", align: "left" },
  { Header: "STATUS", accessor: "status", width: "12%", align: "left" },
  { Header: "VIEW", accessor: "view", width: "8%", align: "center" },
];

export default function DataTable() {
  const [sourceData, setSourceData] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const onfetchData = async () => {
    setLoading(true);
    try {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/fetchOutstandingSettlements",
      });
      const fetchedData = data || [];
      setSourceData(fetchedData);
      setRows(transformData(fetchedData));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch outstanding settlements:", e);
      setSourceData([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRows = (filterValue) => {
    const query = String(filterValue).trim().toLowerCase();

    if (!query) {
      setRows(transformData(sourceData));
      return;
    }

    const requestedStatus = getStatusGroup(query);
    const knownStatuses = ["DISBURSED", "PARTIALLYDISBURSED", "REJECTED"];
    const filteredData = sourceData.filter((item) => {
      const matchesWorkItemOrSpoke = [item.winame, item.spokeName, item.spokeCode].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
      const matchesStatus = knownStatuses.includes(requestedStatus)
        ? getStatusGroup(item.status) === requestedStatus
        : String(item.status || "")
            .toLowerCase()
            .includes(query);

      return matchesWorkItemOrSpoke || matchesStatus;
    });

    setRows(transformData(filteredData));
  };

  return {
    columns: COLUMNS,
    rows,
    onfetchData,
    filterRows,
    loading,
  };
}

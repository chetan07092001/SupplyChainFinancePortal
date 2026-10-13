import MDTypography from "components/MDTypography";
import { useState } from "react";
import { useFetchScfApi } from "customHook/useFetchScfApi";

const transformData = (data) =>
  data.map((item, idx) =>
    Object.fromEntries(
      Object.entries({
        sno: idx + 1,
        winame: item.winame || "-",
        referenceNo: item.referenceNo || "-",
        settlementReferenceNo: item.settlementReferenceNo || "-",
        spokeName: item.spokeName || "-",
        spokeCode: item.spokeCode || "-",
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
      }).map(([key, value]) => [
        key,
        typeof value === "string" ? (
          <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
            {value}
          </MDTypography>
        ) : (
          <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
            {value}
          </MDTypography>
        ),
      ])
    )
  );

export default function DataTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const onfetchData = async () => {
    setLoading(true);
    try {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/fetchOutstandingSettlements",
      });
      setRows(transformData(data || []));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch outstanding settlements:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    columns: [
      { Header: "S.No", accessor: "sno", width: "5%", align: "left" },
      { Header: "WI NAME", accessor: "winame", width: "15%", align: "left" },
      { Header: "REFERENCE NO.", accessor: "referenceNo", width: "12%", align: "left" },
      {
        Header: "SETTLEMENT REF. NO.",
        accessor: "settlementReferenceNo",
        width: "12%",
        align: "left",
      },
      { Header: "SPOKE NAME", accessor: "spokeName", width: "12%", align: "left" },
      { Header: "SPOKE CODE", accessor: "spokeCode", width: "10%", align: "left" },
      { Header: "OUTSTANDING AMOUNT", accessor: "outstandingAmount", width: "12%", align: "left" },
      { Header: "DAYS REMAINING", accessor: "daysRemaining", width: "8%", align: "left" },
      { Header: "TRANSACTION DATE", accessor: "transactionDate", width: "12%", align: "left" },
      { Header: "STATUS", accessor: "status", width: "8%", align: "left" },
    ],

    rows,
    onfetchData,
    loading,
  };
}

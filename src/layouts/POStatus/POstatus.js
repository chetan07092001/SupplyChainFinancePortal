import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";
import { Bars } from "react-loader-spinner";
import axios from "axios";
import StatusDropdown from "./StatusDropdown";

function Tables() {
  /** -------------------- STATE -------------------- */
  const [rawData, setRawData] = useState([]);
  const [status, setStatus] = useState("All");
  const [selectedRows, setSelectedRows] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const isSelectingRef = useRef(false);

  /** -------------------- CONSTANTS -------------------- */
  const colorObject = {
    Approved: "success",
    Pending: "warning",
    Rejected: "error",
  };

  /** -------------------- API -------------------- */
  const { data: apiData, refetch } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () =>
      useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/fetchPurchaseOrderDetails",
      }),
  });

  useEffect(() => {
    if (apiData) {
      setRawData(apiData);
    }
  }, [apiData]);

  /** -------------------- FILTER LOGIC (JSON ONLY) -------------------- */
  const filteredData = useMemo(() => {
    if (status === "All") return rawData;

    return rawData.filter(
      (item) => (item.poStatus ?? "Pending").toLowerCase() === status.toLowerCase()
    );
  }, [rawData, status]);

  /** -------------------- DATA TRANSFORM (JSX ONLY) -------------------- */
  const transformData = useMemo(() => {
    return (data) =>
      data.map((item, index) =>
        Object.fromEntries([
          [
            "checkbox",
            <input
              key={`checkbox-${item.poNumber}`}
              type="checkbox"
              checked={!!selectedRows[item.poNumber]}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                isSelectingRef.current = true;
                setSelectedRows((prev) => ({
                  ...prev,
                  [item.poNumber]: e.target.checked,
                }));
                setTimeout(() => {
                  isSelectingRef.current = false;
                }, 0);
              }}
            />,
          ],
          ...Object.entries(item).map(([key, value]) => {
            if (key === "poStatus") {
              const normalizedStatus = value || "Pending";
              return [
                key,
                <MDBadge
                  key={`status-${index}`}
                  badgeContent={normalizedStatus}
                  color={colorObject[normalizedStatus]}
                  variant="gradient"
                  size="sm"
                />,
              ];
            }

            if (key === "view") {
              return [
                key,
                <IconButton key={`view-${index}`} size="small" onClick={() => viewDoc(item)}>
                  <Icon>visibility</Icon>
                </IconButton>,
              ];
            }

            return [
              key,
              <MDTypography
                key={`${key}-${index}`}
                variant="caption"
                color="text"
                fontWeight="medium"
              >
                {value}
              </MDTypography>,
            ];
          }),
        ])
      );
  }, [selectedRows]);

  /** -------------------- ROWS -------------------- */
  const rows = useMemo(() => {
    return transformData(filteredData);
  }, [filteredData, transformData]);

  /** -------------------- COLUMNS -------------------- */
  const columns = useMemo(
    () => [
      { Header: "Spoke Code", accessor: "spokeCode", align: "left" },
      { Header: "Anchor Code", accessor: "anchorCode", align: "center" },
      { Header: "PO Date", accessor: "poDate", align: "left" },
      { Header: "PO Number", accessor: "poNumber", align: "center" },
      { Header: "Account Number", accessor: "accountNo", align: "center" },
      { Header: "CCY", accessor: "ccy", align: "center" },
      { Header: "PO Amount", accessor: "poAmount", align: "center" },
      { Header: "Email ID", accessor: "emailId", align: "center" },
      { Header: "Credit Term", accessor: "creditTerm", width: "35%", align: "left" },
      { Header: "Goods Description", accessor: "goodsDescription", align: "center" },
      { Header: "PO Status", accessor: "poStatus", align: "center" },
    ],
    []
  );

  /** -------------------- HANDLERS -------------------- */
  const handleChange = (event) => {
    setStatus(event.target.value);
    setPageIndex(0);
  };

  const viewDoc = async (item) => {
    const wiName = item.proccessinstanceid;
    const sID = await useSessionId();

    window.open(
      `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
    );
  };

  /** -------------------- UI -------------------- */
  return (
    <DashboardLayout>
      <DashboardNavbar />

      {loading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 9999,
          }}
        >
          <Bars height="80" width="80" color="#24a4d8" />
        </Box>
      )}

      <MDBox pt={3} pb={3}>
        <StatusDropdown status={status} handleChange={handleChange} />

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={1}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries
                  noEndBorder
                  initialPageIndex={pageIndex}
                  onPageChange={({ pageIndex }) => setPageIndex(pageIndex)}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Tables;

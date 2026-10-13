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

function Tables() {
  const [response, setResponse] = useState([]);
  const [status, setStatus] = useState("All");
  const [selectedRows, setSelectedRows] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  // ✅ Add a ref to track if we're in the middle of a checkbox selection
  const isSelectingRef = useRef(false);

  const colorObject = {
    Approved: "success",
    Pending: "warning",
    Rejected: "error",
  };

  const viewDoc = async (item) => {
    const wiName = item.proccessinstanceid;
    const sID = await useSessionId();

    window.open(
      `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
    );
  };

  // ✅ Optimize transformData to prevent unnecessary re-renders
  const transformData = useMemo(() => {
    return (Tabledata) => {
      return Tabledata.map((item, index) =>
        Object.fromEntries([
          [
            "checkbox",
            <input
              key={`checkbox-${item.poNumber}`}
              type="checkbox"
              onClick={(e) => {
                e.stopPropagation();
              }}
              checked={selectedRows[item.poNumber] || false}
              onChange={(e) => {
                isSelectingRef.current = true;
                setSelectedRows((prev) => ({
                  ...prev,
                  [item.poNumber]: e.target.checked,
                }));
                // Reset the flag after state update
                setTimeout(() => {
                  isSelectingRef.current = false;
                }, 0);
              }}
            />,
          ],
          ...Object.entries(item).map(([key, value]) => {
            if (key === "poStatus") {
              const normalizedStatus =
                value === null || value === undefined || value === "" ? "Pending" : value;
              return [
                key,
                <MDBadge
                  key={`status-${index}`}
                  badgeContent={normalizedStatus}
                  color={colorObject[normalizedStatus] || "warning"}
                  variant="gradient"
                  size="sm"
                />,
              ];
            }
            if (key === "view") {
              return [
                key,
                <IconButton
                  key={`view-${index}`}
                  size="small"
                  disableRipple
                  color="inherit"
                  onClick={() => viewDoc(item)}
                >
                  <Icon>visibility</Icon>
                </IconButton>,
              ];
            } else {
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
            }
          }),
        ])
      );
    };
  }, [selectedRows]); // Only depend on selectedRows

  // ✅ Memoize columns to prevent re-creation
  const columns = useMemo(
    () => [
      {
        Header: (
          <input
            type="checkbox"
            onClick={(e) => {
              e.stopPropagation();
            }}
            checked={response.length > 0 && response.every((item) => selectedRows[item.poNumber])}
            onChange={(e) => {
              isSelectingRef.current = true;
              const checked = e.target.checked;
              const newSelection = {};
              response.forEach((item) => {
                newSelection[item.poNumber] = checked;
              });
              setSelectedRows(newSelection);
              setTimeout(() => {
                isSelectingRef.current = false;
              }, 0);
            }}
          />
        ),
        accessor: "checkbox",
        align: "center",
        width: "5%",
        disableSortBy: true,
      },
      { Header: "Spoke Code", accessor: "spokeCode", width: "10%", align: "left" },
      { Header: "Anchor Code", accessor: "anchorCode", width: "15%", align: "center" },
      { Header: "PO Date", accessor: "poDate", width: "10%", align: "left" },
      { Header: "PO Number", accessor: "poNumber", width: "10%", align: "center" },
      { Header: "Account Number", accessor: "accountNo", width: "10%", align: "center" },
      { Header: "CCY", accessor: "ccy", width: "15%", align: "center" },
      { Header: "PO Amount", accessor: "poAmount", width: "10%", align: "center" },
      { Header: "Email ID", accessor: "emailId", width: "10%", align: "center" },
      { Header: "Credit Term", accessor: "creditTerm", width: "35%", align: "left" },
      {
        Header: "Goods Description",
        accessor: "goodsDescription",
        width: "10%",
        align: "center",
      },
      { Header: "PO Status", accessor: "poStatus", width: "10%", align: "center" },
    ],
    [response, selectedRows]
  );

  const { data: apiData, refetch } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      return await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/fetchPurchaseOrderDetailsPending",
      });
    },
  });

  useEffect(() => {
    if (apiData) {
      setResponse(apiData);
    }
  }, [apiData]);

  // ✅ Transform rows only when response changes, not when selectedRows changes
  const rows = useMemo(() => {
    return transformData(response);
  }, [response, transformData]);

  const getSelectedJsonObjects = () => {
    return response.filter((item) => selectedRows[item.poNumber]);
  };

  function updatePOStatus(data, newStatus) {
    return data.map((item) => ({
      ...item,
      poStatus: newStatus,
    }));
  }

  const putData = async (ponumber, postatus) => {
    const token2 = localStorage.getItem("token");

    if (!token2) {
      console.error("No token found in localStorage");
      return;
    }

    const url = `https://scfdemo.newgensoftware.net:8443/scf/updatePOStatus?poNum=${encodeURIComponent(
      ponumber
    )}&status=${encodeURIComponent(postatus)}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await axios.put(url, {}, config);
      console.log("Success:", response.data);
    } catch (error) {
      if (error.response) {
        console.error("Error Response:", error.response.data);
      } else {
        console.error("Error:", error.message);
      }
    }
  };

  function getUncommonObjects(fullArray, subjectArray) {
    return fullArray.filter(
      (obj1) => !subjectArray.some((obj2) => JSON.stringify(obj1) === JSON.stringify(obj2))
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 9999,
          }}
        >
          <Bars height="80" width="80" color="#24a4d8" ariaLabel="bars-loading" visible={true} />
        </div>
      )}
      <MDBox pt={3} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                m={2}
                p={0}
                sx={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  minWidth: 300,
                  height: "15%",
                }}
              >
                <Box sx={{ minWidth: 120 }} />
              </MDBox>

              <MDBox pt={1}>
                <DataTable
                  key={`table-${response.length}`} // ✅ Add key to preserve state
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                  initialPageIndex={pageIndex}
                  onPageChange={({ pageIndex }) => {
                    setPageIndex(pageIndex);
                  }}
                />
              </MDBox>

              <Box m={2} sx={{ display: "flex", flexDirection: "row-reverse" }}>
                <Button
                  variant="contained"
                  style={{
                    backgroundColor: "#292075",
                    color: "white",
                    height: "5px",
                    marginLeft: "5px",
                  }}
                  onClick={async () => {
                    const selected = getSelectedJsonObjects();
                    const updatedRows = updatePOStatus(selected, "Rejected");

                    await Promise.all(
                      updatedRows.map((newData) => putData(newData.poNumber, "Rejected"))
                    );

                    setSelectedRows({});
                    await refetch();
                    const nonPendingArray = getUncommonObjects(response, selected);
                    setResponse(nonPendingArray);
                  }}
                >
                  Reject
                </Button>

                <Button
                  variant="contained"
                  style={{
                    backgroundColor: "#292075",
                    color: "white",
                    height: "5px",
                  }}
                  onClick={async () => {
                    const selected = getSelectedJsonObjects();
                    const updatedRows = updatePOStatus(selected, "Approved");

                    await Promise.all(
                      updatedRows.map((newData) => putData(newData.poNumber, "Approved"))
                    );

                    setSelectedRows({});
                    await refetch();
                    const nonPendingArray = getUncommonObjects(response, selected);
                    setResponse(nonPendingArray);
                  }}
                >
                  Approve
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Tables;

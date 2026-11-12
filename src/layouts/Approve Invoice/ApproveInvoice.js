import { useMemo, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, Card, Grid, Icon, IconButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";
import Swal from "sweetalert2";

const getInvoiceKey = (item, index) =>
  item.invoiceNumber ?? item.invoicenumber ?? item.invoiceNo ?? item.sno ?? index;

const approvalButtonSx = {
  backgroundColor: "#292075",
  color: "#ffffff",
  "&:hover": { backgroundColor: "#21185f" },
  "&.Mui-disabled": {
    backgroundColor: "#292075 !important",
    color: "#ffffff !important",
    opacity: 1,
  },
  "& .MuiButton-startIcon": { color: "#ffffff" },
};

const showCompactResultPopup = (options) =>
  Swal.fire({
    ...options,
    width: "min(420px, calc(100vw - 32px))",
    padding: "0.75rem 1rem",
    didOpen: (popup) => {
      popup.style.minHeight = "0";

      const icon = popup.querySelector(".swal2-icon");
      if (icon) {
        icon.style.fontSize = "0.72rem";
        icon.style.margin = "0.5rem auto 0.15rem";
      }

      const title = popup.querySelector(".swal2-title");
      if (title) {
        title.style.fontSize = "1.25rem";
        title.style.padding = "0.25rem 1rem 0";
        title.style.margin = "0";
      }

      const message = popup.querySelector(".swal2-html-container");
      if (message) {
        message.style.fontSize = "0.95rem";
        message.style.lineHeight = "1.3";
        message.style.margin = "0.4rem 1rem 0";
      }

      const actions = popup.querySelector(".swal2-actions");
      if (actions) actions.style.margin = "0.6rem auto 0";
    },
  });

function ApproveInvoice() {
  const [selectedRows, setSelectedRows] = useState({});
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: response = [],
    error,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["invoiceApprovalData"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchInvoiceManagementPending",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return Array.isArray(data) ? data : [];
    },
  });

  const invoices = Array.isArray(response) ? response : [];
  const selectedInvoices = invoices.filter(
    (item, index) => selectedRows[String(getInvoiceKey(item, index))]
  );

  const columns = useMemo(
    () => [
      {
        Header: (
          <input
            aria-label="Select all invoices"
            type="checkbox"
            checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
            onChange={(event) => {
              if (event.target.checked) {
                setSelectedRows(
                  Object.fromEntries(
                    invoices.map((item, index) => [String(getInvoiceKey(item, index)), true])
                  )
                );
              } else {
                setSelectedRows({});
              }
            }}
          />
        ),
        accessor: "select",
        align: "center",
        disableSortBy: true,
      },
      { Header: "S.No", accessor: "sno", align: "left" },
      { Header: "Spoke Code", accessor: "spokeCode", align: "left" },
      { Header: "Anchor Code", accessor: "anchorCode", align: "left" },
      { Header: "Invoice Date", accessor: "invoiceDate", align: "left" },
      { Header: "Invoice Number", accessor: "invoiceNumber", align: "left" },
      { Header: "Account Number", accessor: "accountNo", align: "left" },
      { Header: "Invoice Amount", accessor: "invoiceAmount", align: "right" },
      { Header: "Email ID", accessor: "emailId", align: "left" },
      { Header: "Financing Status", accessor: "financingStatus", align: "center" },
      { Header: "Invoice Status", accessor: "invoiceStatus", align: "center" },
    ],
    [invoices, selectedInvoices.length]
  );

  const rows = useMemo(
    () =>
      invoices.map((item, index) => {
        const invoiceKey = String(getInvoiceKey(item, index));
        const status = item.invoiceStatus ?? item.status ?? "Pending";
        const statusColor =
          String(status).toLowerCase() === "approved"
            ? "success"
            : String(status).toLowerCase() === "rejected"
            ? "error"
            : "warning";
        const value = (...fields) =>
          fields.map((field) => item[field]).find((field) => field != null) ?? "-";
        const amount = value("invoiceAmount", "invoiceamount");
        const formattedAmount = Number.isFinite(Number(amount))
          ? Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })
          : amount;

        return {
          select: (
            <input
              aria-label={`Select invoice ${invoiceKey}`}
              type="checkbox"
              checked={Boolean(selectedRows[invoiceKey])}
              onChange={(event) =>
                setSelectedRows((previous) => ({
                  ...previous,
                  [invoiceKey]: event.target.checked,
                }))
              }
            />
          ),
          sno: index + 1,
          spokeCode: value("spokeCode", "spokecode", "vendorCode"),
          anchorCode: value("anchorCode", "anchorcode"),
          invoiceDate: value("invoiceDate", "invoicedate"),
          invoiceNumber: value("invoiceNumber", "invoicenumber", "invoiceNo"),
          accountNo: value("accountNo", "accountno"),
          invoiceAmount: formattedAmount,
          emailId: value("emailId", "emailid"),
          financingStatus: value("financingStatus"),
          invoiceStatus: (
            <MDBadge badgeContent={status} color={statusColor} variant="gradient" size="sm" />
          ),
        };
      }),
    [invoices, selectedRows]
  );

  const updateInvoiceStatus = async (status) => {
    setActionError("");
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found. Please sign in again.");

      const updateOneInvoice = (item) => {
        const invoiceNumber = item.invoiceNumber ?? item.invoicenumber ?? item.invoiceNo;
        if (!invoiceNumber) throw new Error("A selected invoice is missing its invoice number.");

        const query = new URLSearchParams({
          status,
          invoiceNum: String(invoiceNumber),
        });
        const url = `https://scfdemo.newgensoftware.net:8443/scf/updateInvoiceStatus?${query}`;

        return axios.put(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      };

      await Promise.all(selectedInvoices.map(updateOneInvoice));
      setSelectedRows({});
      await refetch();
      await showCompactResultPopup({
        title: `${status} successful`,
        text: `${selectedInvoices.length} invoice(s) updated successfully.`,
        icon: "success",
        iconColor: "#008533",
        background: "#ffffff",
        color: "#008533",
        confirmButtonColor: "#008533",
      });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const responseMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
            responseData?.error ||
            (responseData ? JSON.stringify(responseData) : "");
      const message =
        responseMessage ||
        (requestError.response?.status
          ? `HTTP ${requestError.response.status}: Unable to update invoice status.`
          : requestError.message || "Unable to update invoice status.");
      setActionError(message);
      await showCompactResultPopup({
        title: `${status} failed`,
        text: message,
        icon: "error",
        background: "#ffffff",
        color: "#008533",
        confirmButtonColor: "#008533",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3} pb={3}>
        {error && <Alert severity="error">Unable to load invoice approval data.</Alert>}
        {actionError && <Alert severity="error">{actionError}</Alert>}
        {isPending ? (
          <MDTypography variant="button">Loading invoices...</MDTypography>
        ) : (
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={1}>
                  <DataTable
                    table={{ columns, rows }}
                    isSorted
                    entriesPerPage={false}
                    showTotalEntries
                    noEndBorder
                  />
                </MDBox>
                <Box m={2} display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<Icon>close</Icon>}
                    disabled={isSaving || selectedInvoices.length === 0}
                    onClick={() => updateInvoiceStatus("Rejected")}
                    sx={approvalButtonSx}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Icon>check</Icon>}
                    disabled={isSaving || selectedInvoices.length === 0}
                    onClick={() => updateInvoiceStatus("Approved")}
                    sx={approvalButtonSx}
                  >
                    Approve
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default ApproveInvoice;

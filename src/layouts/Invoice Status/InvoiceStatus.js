import { useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Chip from "@mui/material/Chip";
import Swal from "sweetalert2";
import { useQuery } from "@tanstack/react-query";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

const FINANCING_PRODUCTS = [
  { label: "Dealer Finance", value: "dealer" },
  { label: "Deep Tier Financing", value: "dtf" },
  { label: "Factoring", value: "factoring" },
  { label: "Payable Financing", value: "pf" },
  { label: "Purchase Invoice Financing", value: "pif" },
  { label: "Purchase Order Financing", value: "pof" },
  { label: "Receivable Financing", value: "receivable" },
  { label: "Reverse Factoring", value: "rf" },
  { label: "Sales Invoice Financing", value: "sif" },
  { label: "Vendor Finance", value: "vendor" },
];

const blueButtonSx = {
  backgroundColor: "#292075",
  color: "#ffffff",
  height: 40,
  "&:hover": { backgroundColor: "#21185f" },
  "&.Mui-disabled": {
    backgroundColor: "#292075 !important",
    color: "#ffffff !important",
    opacity: 0.7,
  },
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

const getInvoiceKey = (item, index) =>
  item.invoiceNumber ?? item.invoicenumber ?? item.invoiceNo ?? `invoice-${index}`;

function InvoiceStatus() {
  const [status, setStatus] = useState("All");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [showFinancingSelect, setShowFinancingSelect] = useState(false);
  const [financingProduct, setFinancingProduct] = useState("");
  const [selectedRows, setSelectedRows] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userType = (localStorage.getItem("type") || "").trim().toLowerCase();
  const financingOptions =
    userType === "vendor" || userType === "dealer"
      ? FINANCING_PRODUCTS.filter(({ value }) => value === "vendor" || value === "dealer")
      : FINANCING_PRODUCTS;

  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["invoiceStatusData"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data: responseData } = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchInvoiceManagement",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return Array.isArray(responseData) ? responseData : [];
    },
  });

  const invoiceData = Array.isArray(data) ? data : [];
  const statusOptions = useMemo(
    () => ["All", ...new Set(invoiceData.map((item) => item.invoiceStatus).filter(Boolean))],
    [invoiceData]
  );

  const filteredData = useMemo(
    () =>
      status === "All"
        ? invoiceData
        : invoiceData.filter(
            (item) => String(item.invoiceStatus || "").toLowerCase() === status.toLowerCase()
          ),
    [invoiceData, status]
  );

  const selectedInvoices = useMemo(
    () =>
      filteredData.filter((item, index) =>
        Boolean(selectedRows[String(getInvoiceKey(item, index))])
      ),
    [filteredData, selectedRows]
  );

  const handleFinancingProductChange = async (selectedProduct) => {
    if (!selectedProduct) return;
    setFinancingProduct(selectedProduct);

    const targetInvoices = selectedInvoices.length > 0 ? selectedInvoices : filteredData;

    if (targetInvoices.length === 0) {
      await showCompactResultPopup({
        title: "No Invoices Selected",
        text: "Please select or display at least one invoice to initiate financing.",
        icon: "warning",
        iconColor: "#ed9b00",
        confirmButtonColor: "#292075",
      });
      setFinancingProduct("");
      return;
    }

    // 1. Financing status check: should not be disbursed
    const disbursedInvoices = targetInvoices.filter((item) => {
      const financingStatus = String(item.financingStatus || "")
        .replace(/[\s_-]/g, "")
        .toLowerCase();
      return financingStatus === "disbursed";
    });

    if (disbursedInvoices.length > 0) {
      const invoiceList = disbursedInvoices
        .map((item) => item.invoiceNumber || item.invoicenumber || item.invoiceNo)
        .filter(Boolean)
        .join(", ");

      await showCompactResultPopup({
        title: "Financing Status Disbursed",
        text: `Financing status should not be Disbursed. ${
          invoiceList
            ? `Invoice(s) already disbursed: ${invoiceList}.`
            : "One or more selected invoices are already disbursed."
        }`,
        icon: "warning",
        iconColor: "#ed9b00",
        confirmButtonColor: "#292075",
      });
      setFinancingProduct("");
      return;
    }

    // 2. Invoice status check: must be approved
    const nonApprovedInvoices = targetInvoices.filter((item) => {
      const invoiceStatus = String(item.invoiceStatus || "")
        .replace(/[\s_-]/g, "")
        .toLowerCase();
      return invoiceStatus !== "approved";
    });

    if (nonApprovedInvoices.length > 0) {
      const invoiceList = nonApprovedInvoices
        .map((item) => item.invoiceNumber || item.invoicenumber || item.invoiceNo)
        .filter(Boolean)
        .join(", ");

      await showCompactResultPopup({
        title: "Invoice Status Not Approved",
        text: `Invoice status must be Approved for all selected invoices. ${
          invoiceList
            ? `Invoice(s) not approved: ${invoiceList}.`
            : "One or more selected invoices are not approved."
        }`,
        icon: "warning",
        iconColor: "#ed9b00",
        confirmButtonColor: "#292075",
      });
      setFinancingProduct("");
      return;
    }

    // 3. Spoke code check: must be the same for all selected invoices
    const getSpokeCode = (item) =>
      String(item.spokeCode || item.spokecode || item.vendorCode || "").trim();

    const uniqueSpokeCodes = [...new Set(targetInvoices.map(getSpokeCode).filter(Boolean))];
    const hasMissingSpokeCode = targetInvoices.some((item) => !getSpokeCode(item));

    if (uniqueSpokeCodes.length > 1 || hasMissingSpokeCode) {
      await showCompactResultPopup({
        title: "Spoke Code Mismatch",
        text:
          uniqueSpokeCodes.length > 1
            ? `Spoke code must be the same for all selected invoices. Found multiple spoke codes: ${uniqueSpokeCodes.join(
                ", "
              )}.`
            : "Spoke code is missing on one or more selected invoices.",
        icon: "warning",
        iconColor: "#ed9b00",
        confirmButtonColor: "#292075",
      });
      setFinancingProduct("");
      return;
    }

    const payload = targetInvoices.map((item) => {
      const getField = (...keys) => keys.map((key) => item[key]).find((value) => value != null);
      const rawAmount = getField("invoiceAmount", "invoiceamount");
      const numericAmount = Number(String(rawAmount ?? "").replace(/,/g, ""));

      return {
        spokeCode: String(getField("spokeCode", "spokecode", "vendorCode") ?? ""),
        anchorCode: String(getField("anchorCode", "anchorcode") ?? ""),
        invoiceDate: String(getField("invoiceDate", "invoicedate") ?? ""),
        invoiceNumber: String(getField("invoiceNumber", "invoicenumber", "invoiceNo") ?? ""),
        accountNo: String(getField("accountNo", "accountno") ?? ""),
        invoiceAmount: Number.isFinite(numericAmount)
          ? numericAmount.toFixed(2)
          : String(rawAmount ?? ""),
        emailId: String(getField("emailId", "emailid") ?? ""),
      };
    });

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const url = `https://scfdemo.newgensoftware.net:8443/scf/createWorkItemInvoiceManagement?product=${encodeURIComponent(
        selectedProduct
      )}`;

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const wiName = response.data?.wiName;
      const sessionId = response.data?.sessionId;

      setIsSubmitting(false);

      const popupResult = await showCompactResultPopup({
        title: "Work Item Created",
        text: wiName
          ? `Work item ${wiName} created successfully for ${payload.length} invoice(s).`
          : `${payload.length} invoice(s) submitted for financing successfully.`,
        icon: "success",
        iconColor: "#008533",
        background: "#ffffff",
        color: "#008533",
        confirmButtonColor: "#008533",
        confirmButtonText: "Open Workitem",
      });

      if (popupResult.isConfirmed && wiName && sessionId) {
        window.open(
          `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sessionId}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
        );
      }

      setSelectedRows({});
      setFinancingProduct("");
      setShowFinancingSelect(false);
      await refetch();
    } catch (submitError) {
      const responseData = submitError.response?.data;
      const responseMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
            responseData?.error ||
            responseData?.details ||
            (responseData ? JSON.stringify(responseData) : "");
      const errorMessage = responseMessage || submitError.message || "Failed to create work item.";
      const statusMessage = submitError.response?.status
        ? `HTTP ${submitError.response.status}: `
        : "";

      console.error("Unable to create work item:", submitError);
      await showCompactResultPopup({
        title: "Creation Failed",
        text: `${statusMessage}${errorMessage}`,
        icon: "error",
        iconColor: "#d32f2f",
        background: "#ffffff",
        color: "#d32f2f",
        confirmButtonColor: "#d32f2f",
      });
      setFinancingProduct("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = useMemo(
    () =>
      filteredData.map((item, index) => {
        const invoiceKey = String(getInvoiceKey(item, index));
        const invoiceStatus = item.invoiceStatus || "-";
        const normalizedStatus = invoiceStatus.replace(/[\s_-]/g, "").toLowerCase();
        const statusColor =
          normalizedStatus === "disbursed" || normalizedStatus === "approved"
            ? "#008533"
            : normalizedStatus === "partiallydisbursed"
            ? "#748D92"
            : normalizedStatus === "rejected"
            ? "#d32f2f"
            : normalizedStatus === "pending"
            ? "#ed9b00"
            : "#777777";
        const amount = Number(item.invoiceAmount);
        const text = (value) => value ?? "-";

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
          spokeCode: text(item.spokeCode),
          anchorCode: text(item.anchorCode),
          invoiceDate: text(item.invoiceDate),
          invoiceNumber: text(item.invoiceNumber),
          accountNo: text(item.accountNo),
          invoiceAmount: Number.isFinite(amount)
            ? amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })
            : text(item.invoiceAmount),
          emailId: text(item.emailId),
          financingStatus: text(item.financingStatus),
          invoiceStatus: (
            <Chip
              key={`invoice-status-${index}`}
              label={invoiceStatus}
              size="small"
              sx={{ backgroundColor: statusColor, color: "#fff", fontWeight: 500 }}
            />
          ),
        };
      }),
    [filteredData, selectedRows]
  );

  const isAllSelected = filteredData.length > 0 && selectedInvoices.length === filteredData.length;

  const columns = useMemo(
    () => [
      {
        Header: (
          <input
            aria-label="Select all invoices"
            type="checkbox"
            checked={isAllSelected}
            onChange={(event) => {
              if (event.target.checked) {
                const nextSelected = Object.fromEntries(
                  filteredData.map((item, index) => [String(getInvoiceKey(item, index)), true])
                );
                setSelectedRows(nextSelected);
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
    [filteredData, isAllSelected]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3} pb={3}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              disabled={isSubmitting}
              onClick={() => setShowFinancingSelect((previous) => !previous)}
              sx={blueButtonSx}
            >
              Initiate Financing
            </Button>
            {showFinancingSelect && (
              <FormControl size="small" sx={{ minWidth: 260, backgroundColor: "#ffffff" }}>
                <InputLabel id="financing-product-label">Financing Product</InputLabel>
                <Select
                  labelId="financing-product-label"
                  value={financingProduct}
                  label="Financing Product"
                  disabled={isSubmitting}
                  onChange={(event) => handleFinancingProductChange(event.target.value)}
                  sx={{ height: 40 }}
                >
                  {financingOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          <IconButton
            aria-label="Filter invoice status"
            onClick={(event) => setFilterAnchor(event.currentTarget)}
          >
            <FilterAltIcon />
          </IconButton>
          <Popover
            open={Boolean(filterAnchor)}
            anchorEl={filterAnchor}
            onClose={() => setFilterAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ p: 2, minWidth: 190 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="invoice-status-filter-label">Status</InputLabel>
                <Select
                  labelId="invoice-status-filter-label"
                  value={status}
                  label="Status"
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setFilterAnchor(null);
                  }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Popover>
        </Box>

        {error && <Alert severity="error">Unable to load invoice status data.</Alert>}
        {isPending ? (
          <MDTypography variant="button">Loading invoice status...</MDTypography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={1}>
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={false}
                    entriesPerPage={false}
                    showTotalEntries
                    noEndBorder
                  />
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default InvoiceStatus;

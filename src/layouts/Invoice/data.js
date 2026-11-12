import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState } from "react";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function DataTable() {
  const transformData = (data) => {
    return data.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => {
          if (key === "view") {
            return [
              key,
              <input
                key={key}
                type="checkbox"
                onChange={(e) => {
                  setInvoice((previous) =>
                    e.target.checked
                      ? previous.includes(item)
                        ? previous
                        : [...previous, item]
                      : previous.filter((selected) => selected !== item)
                  );
                }}
              />,
            ];
          } else if (key === "invoiceamount") {
            return [
              key,
              <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
                {Number(value).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </MDTypography>,
            ];
          } else {
            return [
              key,
              <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
                {value}
              </MDTypography>,
            ];
          }
        })
      )
    );
  };

  const [rows, setRows] = useState([]);
  const [Invoice, setInvoice] = useState([]);
  const [loading, setLoading] = useState(false);
  const submitData = async () => {
    if (Invoice.length === 0) return;

    const getField = (item, ...keys) => keys.map((key) => item[key]).find((value) => value != null);
    const payload = Invoice.map((item) => {
      const rawAmount = getField(item, "invoiceamount", "invoiceAmount");
      const numericAmount = Number(String(rawAmount ?? "").replace(/,/g, ""));

      return {
        spokeCode: getField(item, "spokecode", "spokeCode", "vendorCode") ?? "",
        anchorCode: getField(item, "anchorcode", "anchorCode") ?? "",
        invoiceDate: getField(item, "invoicedate", "invoiceDate") ?? "",
        invoiceNumber: getField(item, "invoicenumber", "invoiceNumber", "invoiceNo") ?? "",
        accountNo: String(getField(item, "accountno", "accountNo") ?? ""),
        invoiceAmount: Number.isFinite(numericAmount)
          ? numericAmount.toFixed(2)
          : String(rawAmount ?? ""),
        emailId: getField(item, "emailid", "emailId") ?? "",
      };
    });

    setLoading(true);
    try {
      const url = "https://scfdemo.newgensoftware.net:8443/scf/SaveInvoiceManagementDetails";
      const token = localStorage.getItem("token");
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setInvoice([]);
      await Swal.fire({
        title: "Submitted for approval",
        text: `${payload.length} selected invoice(s) were sent for approval.`,
        icon: "success",
        iconColor: "#008533",
        background: "#ffffff",
        color: "#008533",
        confirmButtonColor: "#008533",
      });
      onfetchData().catch((error) => console.error("Unable to refresh invoice data:", error));
    } catch (error) {
      const responseData = error.response?.data;
      const responseMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
            responseData?.error ||
            responseData?.details ||
            (responseData ? JSON.stringify(responseData) : "");
      const errorMessage = responseMessage || error.message || "Unknown request error.";
      const statusMessage = error.response?.status ? `HTTP ${error.response.status}: ` : "";

      console.error(
        "Unable to submit invoices:",
        error.response?.status,
        responseData || error.message
      );
      await Swal.fire({
        title: "Submission failed",
        text: `${statusMessage}${errorMessage}`,
        icon: "error",
        background: "#ffffff",
        color: "#008533",
        confirmButtonColor: "#008533",
      });
    } finally {
      setLoading(false);
    }
  };
  const onfetchData = async () => {
    const data = await useFetchScfApi({
      url: "https://scfdemo.newgensoftware.net:8443/scf/fetchInvoiceData",
    });

    setRows(transformData(data));

    console.log(data);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedRows = XLSX.utils.sheet_to_json(worksheet);
        const invoiceRows = parsedRows.map((item) => ({
          sno: item.sno ?? item["S.No"] ?? item["S No"] ?? "",
          spokecode: item.spokecode ?? item.spokeCode ?? item["Spoke Code"] ?? "",
          anchorcode: item.anchorcode ?? item.anchorCode ?? item["Anchor Code"] ?? "",
          invoicedate: item.invoicedate ?? item.invoiceDate ?? item["Invoice Date"] ?? "",
          invoicenumber: item.invoicenumber ?? item.invoiceNumber ?? item["Invoice Number"] ?? "",
          invoiceamount: item.invoiceamount ?? item.invoiceAmount ?? item["Invoice Amount"] ?? "",
          accountno:
            item.accountno ?? item.accountNo ?? item["Account No"] ?? item["Account Number"] ?? "",
          emailid: item.emailid ?? item.emailId ?? item["Email ID"] ?? "",
          view: "view",
        }));

        const invoiceNumberCounts = new Map();
        invoiceRows.forEach(({ invoicenumber }) => {
          const invoiceNumber = String(invoicenumber).trim();
          if (!invoiceNumber) return;

          const normalizedNumber = invoiceNumber.toLowerCase();
          const existing = invoiceNumberCounts.get(normalizedNumber);
          invoiceNumberCounts.set(normalizedNumber, {
            invoiceNumber: existing?.invoiceNumber ?? invoiceNumber,
            count: (existing?.count ?? 0) + 1,
          });
        });

        const duplicateNumbers = [...invoiceNumberCounts.values()]
          .filter(({ count }) => count > 1)
          .map(({ invoiceNumber }) => invoiceNumber);

        if (duplicateNumbers.length > 0) {
          Swal.fire({
            title: "Duplicate invoice numbers",
            text: `Invoice numbers must be unique. Duplicates: ${duplicateNumbers.join(", ")}`,
            icon: "warning",
            iconColor: "#008533",
            background: "#ffffff",
            color: "#008533",
            width: "min(420px, calc(100vw - 32px))",
            padding: "1rem 1.25rem",
            confirmButtonColor: "#008533",
            didOpen: (popup) => {
              popup.style.minHeight = "0";

              const icon = popup.querySelector(".swal2-icon");
              if (icon) {
                icon.style.width = "4rem";
                icon.style.height = "4rem";
                icon.style.margin = "0.75rem auto 0.25rem";
              }

              const title = popup.querySelector(".swal2-title");
              if (title) {
                title.style.fontSize = "1.35rem";
                title.style.padding = "0.4rem 1rem 0";
              }

              const message = popup.querySelector(".swal2-html-container");
              if (message) {
                message.style.fontSize = "1rem";
                message.style.margin = "0.65rem 1rem 0";
              }

              const actions = popup.querySelector(".swal2-actions");
              if (actions) actions.style.margin = "0.85rem auto 0";
            },
          });
          return;
        }

        setInvoice([]);
        setRows(transformData(invoiceRows));
      } catch (error) {
        console.error("Unable to read invoice spreadsheet:", error);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  return {
    columns: [
      { Header: "", accessor: "view", width: "2%", align: "center" },
      { Header: "S.No", accessor: "sno", width: "15%", align: "left" },
      { Header: "Spoke Code", accessor: "spokecode", width: "15%", align: "left" },
      { Header: "Anchor Code", accessor: "anchorcode", width: "15%", align: "left" },
      { Header: "Invoice Date", accessor: "invoicedate", width: "15%", align: "left" },
      { Header: "Invoice Number", accessor: "invoicenumber", width: "15%", align: "left" },
      { Header: "Invoice Amount", accessor: "invoiceamount", width: "15%", align: "left" },
      { Header: "Account Number", accessor: "accountno", width: "15%", align: "left" },
      { Header: "Email ID", accessor: "emailid", width: "15%", align: "left" },
    ],

    rows,
    onfetchData,
    handleFileUpload,
    submitData,
    loading,
    selectedCount: Invoice.length,
  };
}

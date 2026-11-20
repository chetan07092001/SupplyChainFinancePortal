import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState } from "react";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function DataTable() {
  const transformData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => {
          if (key === "invoiceamount") {
            const numericValue = Number(String(value ?? "").replace(/,/g, ""));
            return [
              key,
              <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
                {Number.isFinite(numericValue)
                  ? numericValue.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : value}
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
  const [rawData, setRawData] = useState([]);
  const [uploadedData, setUploadedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const submitData = async () => {
    const dataToSend = uploadedData.length > 0 ? uploadedData : rawData;
    if (!dataToSend || dataToSend.length === 0) {
      await Swal.fire({
        title: "No Data",
        text: "Please upload an Excel file before sending for approval.",
        icon: "warning",
        iconColor: "#f79009",
        background: "#ffffff",
        confirmButtonColor: "#008533",
      });
      return;
    }

    const getField = (item, ...keys) => keys.map((key) => item[key]).find((value) => value != null);
    const payload = dataToSend.map((item) => {
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
      const token = localStorage.getItem("token");
      if (!token) {
        await Swal.fire({
          title: "Session Expired",
          text: "You are not logged in or your session has expired. Please log in again.",
          icon: "warning",
          iconColor: "#f79009",
          background: "#ffffff",
          confirmButtonColor: "#008533",
        });
        setLoading(false);
        return;
      }

      const url = "https://scfdemo.newgensoftware.net:8443/scf/SaveInvoiceManagementDetails";
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setUploadedData([]);
      await Swal.fire({
        title: "Submitted for approval",
        text: `All ${payload.length} invoice(s) from uploaded file were sent for approval successfully.`,
        icon: "success",
        iconColor: "#008533",
        background: "#ffffff",
        color: "#008533",
        confirmButtonColor: "#008533",
      });
      if (typeof onfetchData === "function") {
        onfetchData().catch((error) => console.error("Unable to refresh invoice data:", error));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await Swal.fire({
          title: "Session Expired",
          text: "Your session has expired (HTTP 401 Unauthorized). Please re-login to obtain a valid token and try again.",
          icon: "error",
          background: "#ffffff",
          confirmButtonColor: "#008533",
        });
        return;
      }

      if (error.response?.status === 409) {
        const conflictData = error.response.data;
        const duplicateInvoices = Array.isArray(conflictData)
          ? conflictData.map((d) => d.invoiceNumber).filter(Boolean)
          : [];
        const detailMsg =
          duplicateInvoices.length > 0
            ? `The following invoice number(s) already exist in the system and cannot be submitted again:\n\n${duplicateInvoices.join(
                ", "
              )}`
            : "One or more invoices already exist in the system. Please check your invoice numbers and re-upload with unique invoice numbers.";

        await Swal.fire({
          title: "Duplicate Invoices (409 Conflict)",
          text: detailMsg,
          icon: "warning",
          iconColor: "#f79009",
          background: "#ffffff",
          confirmButtonColor: "#008533",
        });
        return;
      }

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
        confirmButtonColor: "#008533",
      });
    } finally {
      setLoading(false);
    }
  };

  const onfetchData = async () => {
    try {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/fetchInvoiceData",
      });
      if (Array.isArray(data)) {
        setRawData(data);
        setRows(transformData(data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, {
          type: "array",
          cellDates: false,
        });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet || !worksheet["!ref"]) {
          Swal.fire({
            title: "Empty File",
            text: "The uploaded file does not contain any data.",
            icon: "warning",
            iconColor: "#f79009",
            background: "#ffffff",
            confirmButtonColor: "#008533",
          });
          return;
        }

        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          blankrows: true,
          raw: false,
        });

        if (!rawRows || rawRows.length <= 1) {
          Swal.fire({
            title: "Empty File",
            text: "The uploaded file does not contain any data rows.",
            icon: "warning",
            iconColor: "#f79009",
            background: "#ffffff",
            confirmButtonColor: "#008533",
          });
          return;
        }

        let lastDataRowIndex = -1;
        for (let i = rawRows.length - 1; i >= 1; i--) {
          const row = rawRows[i];
          const hasContent =
            Array.isArray(row) && row.some((cell) => cell != null && String(cell).trim() !== "");
          if (hasContent) {
            lastDataRowIndex = i;
            break;
          }
        }

        if (lastDataRowIndex < 1) {
          Swal.fire({
            title: "Empty File",
            text: "The uploaded file does not contain any data rows.",
            icon: "warning",
            iconColor: "#f79009",
            background: "#ffffff",
            confirmButtonColor: "#008533",
          });
          return;
        }

        const headerRow = (rawRows[0] || []).map((h) => String(h || "").trim());
        const normalize = (str) =>
          String(str || "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();

        const findColIdx = (candidates) =>
          headerRow.findIndex((h) => candidates.includes(normalize(h)));

        const colIdxSno = findColIdx(["sno", "sno.", "snumber", "serialno", "serialnumber"]);
        const colIdxSpoke = findColIdx(["spokecode", "vendorcode", "spoke"]);
        const colIdxAnchor = findColIdx(["anchorcode", "buyercode", "anchor"]);
        const colIdxDate = findColIdx(["invoicedate", "date"]);
        const colIdxNumber = findColIdx(["invoicenumber", "invoiceno", "number"]);
        const colIdxAmount = findColIdx(["invoiceamount", "amount"]);
        const colIdxAccount = findColIdx(["accountno", "accountnumber", "account"]);
        const colIdxEmail = findColIdx(["emailid", "email"]);

        const getColVal = (rowArr, idx, defaultIdx) => {
          const col = idx !== -1 ? idx : defaultIdx;
          return rowArr && rowArr[col] != null ? String(rowArr[col]).trim() : "";
        };

        const requiredColumns = [
          { key: "sno", label: "S.No", idx: colIdxSno, defaultIdx: 0 },
          { key: "spokecode", label: "Spoke Code", idx: colIdxSpoke, defaultIdx: 1 },
          { key: "anchorcode", label: "Anchor Code", idx: colIdxAnchor, defaultIdx: 2 },
          { key: "invoicedate", label: "Invoice Date", idx: colIdxDate, defaultIdx: 3 },
          { key: "invoicenumber", label: "Invoice Number", idx: colIdxNumber, defaultIdx: 4 },
          { key: "invoiceamount", label: "Invoice Amount", idx: colIdxAmount, defaultIdx: 5 },
          { key: "accountno", label: "Account Number", idx: colIdxAccount, defaultIdx: 6 },
          { key: "emailid", label: "Email ID", idx: colIdxEmail, defaultIdx: 7 },
        ];

        const emptyRowNumbers = [];
        const rowsWithEmptyFields = [];

        for (let r = 1; r <= lastDataRowIndex; r++) {
          const rowArr = rawRows[r] || [];
          const excelRowNum = r + 1;

          const isRowEmpty =
            rowArr.length === 0 ||
            rowArr.every((cell) => cell == null || String(cell).trim() === "");

          if (isRowEmpty) {
            emptyRowNumbers.push(excelRowNum);
            continue;
          }

          const missingFields = [];
          requiredColumns.forEach((col) => {
            const val = getColVal(rowArr, col.idx, col.defaultIdx);
            if (!val) {
              missingFields.push(col.label);
            }
          });

          if (missingFields.length > 0) {
            rowsWithEmptyFields.push({ row: excelRowNum, fields: missingFields });
          }
        }

        if (emptyRowNumbers.length > 0 || rowsWithEmptyFields.length > 0) {
          const emptyRowsText = emptyRowNumbers.join(", ");
          let errorHtml = '<div style="text-align: left; font-size: 0.9rem;">';
          if (emptyRowNumbers.length > 0) {
            errorHtml += `<p style="margin-bottom: 6px;"><strong>Empty row(s) found:</strong> Row ${emptyRowsText}</p>`;
          }
          if (rowsWithEmptyFields.length > 0) {
            errorHtml += `<p style="margin-bottom: 4px;"><strong>Rows with missing/empty data:</strong></p>`;
            errorHtml += `<ul style="padding-left: 18px; margin: 4px 0;">`;
            rowsWithEmptyFields.slice(0, 5).forEach((item) => {
              const missingText = item.fields.join(", ");
              errorHtml += `<li>Row ${item.row}: Missing ${missingText}</li>`;
            });
            if (rowsWithEmptyFields.length > 5) {
              errorHtml += `<li>...and ${rowsWithEmptyFields.length - 5} more row(s)</li>`;
            }
            errorHtml += `</ul>`;
          }
          errorHtml +=
            '<p style="margin-top: 8px; color: #d32f2f; font-weight: 500;">All rows and columns must be completely filled. Please fix the file and re-upload.</p></div>';

          Swal.fire({
            title: "Empty Data Detected",
            html: errorHtml,
            icon: "warning",
            iconColor: "#f79009",
            background: "#ffffff",
            confirmButtonColor: "#008533",
          });
          return;
        }

        const invoiceRows = [];
        for (let r = 1; r <= lastDataRowIndex; r++) {
          const rowArr = rawRows[r];
          invoiceRows.push({
            sno: getColVal(rowArr, colIdxSno, 0) || r,
            spokecode: getColVal(rowArr, colIdxSpoke, 1),
            anchorcode: getColVal(rowArr, colIdxAnchor, 2),
            invoicedate: getColVal(rowArr, colIdxDate, 3),
            invoicenumber: getColVal(rowArr, colIdxNumber, 4),
            invoiceamount: getColVal(rowArr, colIdxAmount, 5),
            accountno: getColVal(rowArr, colIdxAccount, 6),
            emailid: getColVal(rowArr, colIdxEmail, 7),
          });
        }

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
            confirmButtonColor: "#008533",
          });
          return;
        }

        setUploadedData(invoiceRows);
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
      { Header: "S.No", accessor: "sno", width: "8%", align: "left" },
      { Header: "Spoke Code", accessor: "spokecode", width: "13%", align: "left" },
      { Header: "Anchor Code", accessor: "anchorcode", width: "13%", align: "left" },
      { Header: "Invoice Date", accessor: "invoicedate", width: "13%", align: "left" },
      { Header: "Invoice Number", accessor: "invoicenumber", width: "14%", align: "left" },
      { Header: "Invoice Amount", accessor: "invoiceamount", width: "14%", align: "left" },
      { Header: "Account Number", accessor: "accountno", width: "14%", align: "left" },
      { Header: "Email ID", accessor: "emailid", width: "11%", align: "left" },
    ],

    rows,
    onfetchData,
    handleFileUpload,
    submitData,
    loading,
    uploadedData,
    uploadedCount: uploadedData.length,
    selectedCount: uploadedData.length > 0 ? uploadedData.length : rows.length,
  };
}

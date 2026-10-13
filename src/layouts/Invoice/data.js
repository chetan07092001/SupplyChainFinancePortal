import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState, useEffect } from "react";
import { Icon, IconButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";
import Checkbox from "@mui/material/Checkbox";
import { CheckBox } from "@mui/icons-material";
import Invoice from "./Invoice";

const viewDoc = async (item) => {
  const wiName = item.wiName; // Change to match the API response
  console.log(wiName + " WID");

  const sID = item.sessionId; // Make sure to await for the session ID
  console.log(sID + " SID");

  window.open(
    `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
  );
  console.log(item);
};

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
                  setInvoice((prev) => [...prev, item]);
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
  const submitData = () => {
    const url = "https://scfdemo.newgensoftware.net:8443/scf/createWorkItemInvoice";
    console.log(Invoice.spokecode);
    let data = {
      anchorcode: Invoice[0].anchorcode,
      programname: "Program_4318",
      invoiceDetais: [],
    };

    const transformed = Invoice.map((item) => {
      const [month, day, year] = item.invoicedate.split("/");
      return {
        invoiceNumber: item.invoicenumber,
        invoiceAmount: item.invoiceamount,
        invoiceDate: item.invoicedate,
        vendorCode: item.spokecode,
        anchorCode: item.anchorcode,
        vendorAccNum: item.accountno,
        vendorEmailId: item.emailid,
      };
    });

    data.invoiceDetais = transformed;
    console.log(data);
    const token = localStorage.getItem("token");

    axios
      .post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // optional, depending on your API
        },
      })
      .then((response) => {
        console.log("Response:", response.data);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          viewDoc(response.data);
        }, 3000);
      })
      .catch((error) => {
        console.error("Error:", error.response ? error.response.data : error.message);
      });

    console.log(Invoice);
  };
  const onfetchData = async () => {
    const data = await useFetchScfApi({
      url: "https://scfdemo.newgensoftware.net:8443/scf/fetchInvoiceData",
    });

    setRows(transformData(data));

    console.log(data);
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
    ],

    rows,
    onfetchData,
    submitData,
    loading,
  };
}

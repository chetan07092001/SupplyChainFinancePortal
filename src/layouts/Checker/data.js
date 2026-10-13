import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState, useEffect } from "react";
import { Icon, IconButton } from "@mui/material";

const getData = async () => {
  try {
    const response = await axios.get(
      "https://scfdemo.newgensoftware.net:8443/scf/FetchDataAtVendorChecker",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    console.log("data");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getSessionId = async () => {
  try {
    const response = await axios.get("https://scfdemo.newgensoftware.net:8443/scf/fetchSessionId", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const viewDoc = async (item) => {
  const wiName = item.winame; // Change to match the API response
  console.log(wiName + " WID");

  const wid = item.workitemid !== null ? item.workitemid : 1;

  const sID = await getSessionId(); // Make sure to await for the session ID
  console.log(sID + " SID");

  window.open(
    `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=${wid}&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
  );
  console.log(item);
};

const transformData = (data) => {
  return data.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([key, value]) => {
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

export default function DataTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      console.log(data);
      const updatedData = data.map((item) => ({
        ...item,
        view: "view", // Keep this for the view button
        transdate: item.transdate ? item.transdate : "N/A", // Handle null case
        totalinvoiceamount: Number(item.totalinvoiceamount).toLocaleString("en-US"),
        totaldiscountamount: Number(item.totaldiscountamount).toLocaleString("en-US"),
      }));
      console.log(updatedData);

      setRows(transformData(updatedData));
    };

    fetchData();
  }, []);

  return {
    columns: [
      {
        Header: "Reference Number",
        accessor: "winame", // Match the API response
        width: "20%",
        align: "left",
      },
      { Header: "Spoke Name", accessor: "vendorname", width: "15%", align: "left" },
      { Header: "Anchor Name", accessor: "anchorname", width: "15%", align: "left" },
      { Header: "Total Amount", accessor: "totalinvoiceamount", width: "15%", align: "left" },
      {
        Header: "Total Discount Amount",
        accessor: "totaldiscountamount",
        width: "15%",
        align: "left",
      },
      { Header: "View", accessor: "view", align: "center" },
    ],

    rows,
  };
}

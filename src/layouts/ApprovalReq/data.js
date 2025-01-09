import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState, useEffect } from "react";
import { Icon, IconButton } from "@mui/material";

import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";

const viewDoc = async (item) => {
  const wiName = item.processinstanceid; // Change to match the API response
  console.log(wiName + " WID");

  const sID = await useSessionId(); // Make sure to await for the session ID
  console.log(sID + " SID");

  window.open(
    `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
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

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/FetchDataAtApproval?activityName=Approval",
      });
      const updatedData = data.map((item) => ({
        ...item,
        view: "view", // Keep this for the view button
        transdate: item.transdate ? item.transdate : "N/A", // Handle null case
        totalinvamount: Number(item.totalinvamount).toLocaleString("en-US"),
        totaldiscountamount: Number(item.totaldiscountamount).toLocaleString("en-US"),
      }));

      setRows(transformData(updatedData));
      return await updatedData;
    },
  });

  return {
    columns: [
      {
        Header: "Reference Number",
        accessor: "processinstanceid", // Match the API response
        width: "20%",
        align: "left",
      },
      { Header: "Vendor Name", accessor: "vendorname", width: "15%", align: "left" },
      { Header: "Anchor Name", accessor: "anchorname", width: "15%", align: "left" },
      { Header: "Total Amount", accessor: "totalinvamount", width: "15%", align: "left" },
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

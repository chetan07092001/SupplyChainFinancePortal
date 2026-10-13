import MDTypography from "components/MDTypography";
import axios from "axios";
import { useState, useEffect } from "react";
import { Icon, IconButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";

let excel;
export function excelData() {
  return excel;
}

const viewDoc = async (item) => {
  const wiName = item.winame; // Change to match the API response
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
        url: "https://scfdemo.newgensoftware.net:8443/scf/fetchSettlementData?activityName=Initiation",
      });

      setRows(transformData(data));
      return await data;
    },
  });

  console.log(data);
  return {
    columns: [
      { Header: "Reference Number", accessor: "winame", width: "15%", align: "left" },
      { Header: "Anchor Name", accessor: "anchorname", width: "15%", align: "left" },
      { Header: "Anchor Code", accessor: "anchorcode", width: "15%", align: "left" },

      { Header: "Spoke Name", accessor: "vendorname", width: "15%", align: "left" },
      { Header: "Spoke Code", accessor: "vendorcode", width: "15%", align: "left" },
      { Header: "Transaction Date", accessor: "transactiondate", width: "15%", align: "left" },
      { Header: "Status", accessor: "status", width: "15%", align: "left" },
      { Header: "View", accessor: "view", align: "center", width: "15%" },
    ],

    rows,
  };
}

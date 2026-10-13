import MDTypography from "components/MDTypography";
import { IconButton, Icon } from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";
import axios from "axios";

const viewDoc = async (item) => {
  console.log("viewDoc invoked", item);

  // Prefer normalized WIName, fall back to raw payload keys that some APIs use
  const wiName =
    item.WIName ||
    item.WINAME ||
    item.wiName ||
    item.winame ||
    item.__raw?.winame ||
    item.__raw?.wiName ||
    item.processinstanceid ||
    item.proccessinstanceid ||
    "";
  console.log("Resolved wiName ->", wiName);

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
              key={`${item.WIName}-view`}
              size="small"
              disableRipple
              color="inherit"
              onClick={() => viewDoc(item)}
            >
              <Icon>visibility</Icon>
            </IconButton>,
          ];
        }

        return [
          key,
          <MDTypography
            key={`${item.WIName}-${key}`}
            variant="caption"
            color="text"
            fontWeight="medium"
          >
            {value}
          </MDTypography>,
        ];
      })
    )
  );
};

export default function AnchorMakerData() {
  const [rows, setRows] = useState([]);

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["anchorMakerData"],
    queryFn: async () => {
      const anchorCode = localStorage.getItem("anchorCode");
      const url = anchorCode
        ? `https://scfdemo.newgensoftware.net:8443/scf/fetchDataForAnchorMakerOnboarding?anchorCode=${encodeURIComponent(
            anchorCode
          )}`
        : `https://scfdemo.newgensoftware.net:8443/scf/fetchDataForAnchorMakerOnboarding`;

      const fetched = await useFetchScfApi({ url });

      console.log("AnchorMakerData fetched:", fetched);

      // Normalize API response keys to match table `accessor` names (case-sensitive)
      const updatedData = fetched.map((item) => ({
        WIName: item.WIName || item.winame || item.WIname || "",
        uniqueCode: item.uniqueCode || item.uniquecode || "",
        Name: item.Name || item.name || "",
        LimitAmount: item.LimitAmount ?? item.limitAmount ?? "",
        EOnboardingStatus: item.EOnboardingStatus ?? item.eonboardingStatus ?? "",
        // keep original payload for view handler if needed
        __raw: item,
        view: "view",
      }));

      const transformed = transformData(updatedData);
      console.log("AnchorMakerData updatedData:", updatedData);
      console.log("AnchorMakerData transformed rows:", transformed);

      setRows(transformed);
      console.log("AnchorMakerData state rows after setRows:", rows);
      return updatedData;
    },
  });

  const columns = [
    { Header: "WIName", accessor: "WIName", width: "20%", align: "left" },
    { Header: "uniqueCode", accessor: "uniqueCode", width: "15%", align: "left" },
    { Header: "Name", accessor: "Name", width: "20%", align: "left" },
    { Header: "LimitAmount", accessor: "LimitAmount", width: "15%", align: "left" },
    { Header: "EOnboardingStatus", accessor: "EOnboardingStatus", width: "15%", align: "left" },
    { Header: "View", accessor: "view", align: "center" },
  ];

  return { columns, rows };
}

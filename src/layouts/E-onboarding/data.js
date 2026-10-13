import MDTypography from "components/MDTypography";
import { IconButton, Icon } from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";

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

export default function AnchorCheckerData() {
  const [rows, setRows] = useState([]);

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["anchorCheckerData"],
    queryFn: async () => {
      // The API expects an anchorCode param; if you have it stored in localStorage, append it.
      const anchorCode = localStorage.getItem("anchorCode");
      const url = anchorCode
        ? `https://scfdemo.newgensoftware.net:8443/scf/fetchDataForAnchorCheckerOnboarding?anchorCode=${encodeURIComponent(
            anchorCode
          )}`
        : `https://scfdemo.newgensoftware.net:8443/scf/fetchDataForAnchorCheckerOnboarding`;

      const fetched = await useFetchScfApi({ url });

      const updatedData = fetched.map((item) => ({
        ...item,
        view: "view",
      }));

      setRows(transformData(updatedData));
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

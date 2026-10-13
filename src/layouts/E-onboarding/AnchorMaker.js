import React, { useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";
import { Bars } from "react-loader-spinner";
import axios from "axios";
import { useSessionId } from "customHook/useSessionId";
import AnchorMakerData from "./AnchorMakerData";

export default function AnchorMaker({ showTitle = true }) {
  const { columns, rows } = AnchorMakerData();
  const [loading, setLoading] = useState(false);

  const getDataOnboarding = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/createWorkItemOnboarding",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response;
    } catch (e) {
      console.error("getDataOnboarding error:", e?.response?.status, e?.response?.data, e?.message);
      return e?.response || null;
    }
  };

  const initiateOnboarding = async () => {
    console.log("initiateOnboarding called");
    try {
      console.log("setLoading(true)");
      setLoading(true);

      console.log("calling getDataOnboarding()");
      const response = await getDataOnboarding();
      console.log("got response from getDataOnboarding:", response);

      console.log("scheduling setTimeout for navigation (4000ms)");
      setTimeout(() => {
        try {
          console.log("inside timeout: setLoading(false)");
          setLoading(false);

          console.log("inside timeout: checking response");
          if (response && response.status === 200) {
            console.log("response OK, extracting wiName and sessionId");
            const wiName = response.data.wiName;
            const sID = response.data.sessionId;
            console.log("opening window with", { wiName, sID });
            window.open(
              `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
            );
          } else {
            console.log("response not OK inside timeout", response);
          }
        } catch (err) {
          console.log("error inside timeout:", err);
        }
      }, 4000);
    } catch (e) {
      console.log("Error is ", e);
    }
  };

  return (
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 9999,
          }}
        >
          <Bars
            height="80"
            width="80"
            color="#24a4d8"
            ariaLabel="bars-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
        </div>
      )}

      <MDBox mt={2}>
        {showTitle && (
          <MDBox mb={2}>
            <Typography variant="h6">Anchor Maker</Typography>
          </MDBox>
        )}

        <Card sx={{ width: "100%" }}>
          <MDBox p={2} mt="auto" display="flex" justifyContent="flex-end" width="100%">
            <MDButton
              disableRipple
              disableFocusRipple
              onClick={initiateOnboarding}
              variant="gradient"
              style={{ backgroundColor: "#008533", color: "white" }}
              sx={{
                backgroundColor: "lightcoral",
                "&:hover": {
                  backgroundColor: "darkred",
                },
              }}
            >
              Initiate
            </MDButton>
          </MDBox>
          <MDBox pt={1} pl={2} pb={2}>
            <div style={{ width: "100%" }}>
              <DataTable
                table={{ columns, rows }}
                entriesPerPage={false}
                showTotalEntries={true}
                noEndBorder
              />
            </div>
          </MDBox>
        </Card>
      </MDBox>
    </>
  );
}

AnchorMaker.propTypes = {
  showTitle: PropTypes.bool,
};

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import AnchorChecker from "./AnchorChecker";
import AnchorMaker from "./AnchorMaker";
import "./E-onboarding.css";

export default function EOnboarding() {
  const [value, setValue] = useState(0);
  const location = useLocation();

  const hashToIndex = {
    "anchor-maker": 0,
    "anchor-checker": 1,
    draft: 2,
  };

  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    if (hash && hashToIndex.hasOwnProperty(hash)) {
      setValue(hashToIndex[hash]);
    }
  }, [location.hash]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    const indexToHash = ["anchor-maker", "anchor-checker", "draft"];
    const hash = indexToHash[newValue] || "";
    if (hash) window.location.hash = hash;
  };

  const hash = (location.hash || "").replace("#", "");
  const child = hash || "anchor-checker";
  const title = child === "anchor-maker" ? "Spoke Details" : "Anchor Checker";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={8}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={3} pl={3}>
                  <Typography variant="h6">{title}</Typography>
                </MDBox>
                <MDBox pt={1} pl={2}>
                  {child === "anchor-maker" ? <AnchorMaker showTitle={false} /> : <AnchorChecker />}
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

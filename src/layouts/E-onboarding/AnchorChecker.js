import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import DataTable from "examples/Tables/DataTable";
import AnchorCheckerData from "./data";

export default function AnchorChecker() {
  const { columns, rows } = AnchorCheckerData();

  return (
    <MDBox mt={2}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <MDBox pt={3} pl={3}></MDBox>
            <MDBox pt={1}>
              <DataTable
                table={{ columns, rows }}
                entriesPerPage={false}
                showTotalEntries={true}
                noEndBorder
              />
            </MDBox>
          </Card>
        </Grid>
      </Grid>
    </MDBox>
  );
}

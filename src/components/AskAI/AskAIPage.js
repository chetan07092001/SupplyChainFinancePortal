import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { AskAIChatbot } from "./AskAIChatbot";

export function AskAIPage() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3} pb={3}>
        <MDBox mb={2}>
          <MDTypography variant="h4" fontWeight="bold" color="text">
            Ask AI Workspace
          </MDTypography>
          <MDTypography variant="button" color="text" fontWeight="regular">
            SCFAgentic AI Assistant for natural language loan requests, invoice analysis, and
            financial insights.
          </MDTypography>
        </MDBox>
        <AskAIChatbot embedded={true} />
      </MDBox>
    </DashboardLayout>
  );
}

export default AskAIPage;

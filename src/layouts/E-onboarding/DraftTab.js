import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function DraftTab() {
  return (
    <Box>
      <Typography variant="h6">Draft</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Draft items related to E-onboarding will appear here.
      </Typography>
    </Box>
  );
}

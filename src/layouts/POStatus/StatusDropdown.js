import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import FormControl from "@mui/material/FormControl";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import PropTypes from "prop-types";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MDButton from "components/MDButton";
function StatusDropdown({ status, handleChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorr, setColor] = useState("secondary");
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget); // Set the icon as the anchor element

    if (anchorEl !== "All") {
      setColor("error");
    }
  };

  const handleClose = () => {
    setAnchorEl(null); // Close the Popover
  };

  const open = Boolean(anchorEl); // Determine if the popover should be open

  return (
    <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
      {/* IconButton to trigger the popover */}
      <IconButton onClick={handleOpen}>
        <MDButton
          style={{
            backgroundColor: "#292075",
            color: "white",
            height: "5px",
            width: "5px",
          }}
          sx={{
            background: "linear-gradient(to right, #3B82F6, #A855F7)", // blue → purple
            color: "white",
            transition: "transform 0.3s, box-shadow 0.3s",
            "&:hover": {
              background: "linear-gradient(to right, #2563EB, #9333EA)", // slightly darker hover gradient
              transform: "scale(1.05)", // Scale up the button
              boxShadow: "0 2px 5px #292075",
            },
          }}
          iconOnly
        >
          <FilterAltIcon style={{ coloor: "white" }} />
        </MDButton>
      </IconButton>

      {/* Popover for the radio options */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box
          sx={{
            p: 2,
            minWidth: 150,
            bgcolor: "background.paper", // Add solid background color
            borderRadius: 1, // Optional: Add rounded corners for better styling
            boxShadow: 3, // Optional: Add shadow for better visibility
          }}
        >
          <FormControl component="fieldset">
            <RadioGroup
              aria-label="status"
              name="status-options"
              value={status}
              onChange={(event) => {
                handleChange(event); // Update the selected status
                handleClose(); // Close the popover after selection
              }}
            >
              <FormControlLabel value="All" control={<Radio />} label="All" />
              <FormControlLabel value="Approved" control={<Radio />} label="Approved" />
              <FormControlLabel value="Pending" control={<Radio />} label="Pending" />
              <FormControlLabel value="Rejected" control={<Radio />} label="Rejected" />
            </RadioGroup>
          </FormControl>
        </Box>
      </Popover>
    </Box>
  );
}

StatusDropdown.propTypes = {
  status: PropTypes.string.isRequired, // The currently selected status
  handleChange: PropTypes.func.isRequired, // Callback for status selection
};

export default StatusDropdown;

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import PropTypes from "prop-types";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BorderAllRounded } from "@mui/icons-material";
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 200,
  background: "rgba(255, 255, 255, 0.7)", // Semi-transparent white
  backdropFilter: "blur(10px)", // Blurs the background behind the modal
  borderRadius: "10px",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
  border: "1px solid rgba(255, 255, 255, 0.3)", // Optional frosted border effect
  p: 4,
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(255, 255, 255, 0.3)", // Semi-transparent white
  backdropFilter: "blur(5px)", // Adds blur to the entire screen
  zIndex: -1, // Ensures it sits behind the modal
};

export default function PersonaModal({ open, onClose }) {
  const navigate = useNavigate();
  const [persona, setPersona] = useState("");

  const getVendorData = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchUserDetails",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };
  const handleClose = () => {
    onClose();
  };
  const handlePersona = (e) => {
    setPersona(e.target.value);
  };

  const submitPersona = async () => {
    const response = await getVendorData();
    onClose();
    localStorage.setItem("type", response.Persona);

    navigate("/admin/dashboard");
  };

  const onClickOuter = () => {
    onClose();
  };
  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={overlayStyle}>
          <Box
            sx={style}
            onClick={(event) => {
              event.stopPropagation(); // Prevent click event propagation
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Select Persona
            </Typography>
            <FormControl>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue="Vendor"
                name="radio-buttons-group"
                onChange={handlePersona}
              >
                <FormControlLabel
                  defaultChecked
                  value="Vendor"
                  control={<Radio />}
                  label="Vendor"
                />
                <FormControlLabel value="Anchor" control={<Radio />} label="Anchor" />
                <FormControlLabel value="Dealer" control={<Radio />} label="Dealer" />
              </RadioGroup>
              <Button variant="contained" style={{ color: "white" }} onClick={submitPersona}>
                Continue
              </Button>
            </FormControl>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

PersonaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

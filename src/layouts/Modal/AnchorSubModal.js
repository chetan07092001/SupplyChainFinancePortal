import React, { useEffect, useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";
import DataTable from "examples/Tables/DataTable";
import axios from "axios";

// The totalOutstanding function is now outside and exported
let sum = 0;
export const totalOutstanding = (rows) => {
  return sum; // Sum all 'outstanding' values
};

const getData = async () => {
  try {
    const response = await axios.get(
      "https://scfdemo.newgensoftware.net:8443/scfNew/FetchTotalAmountData",

      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    console.log("Response Data: ", response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

function transformLoanData(data) {
  return Object.keys(data).map((key) => {
    return {
      loan: key,
      outstanding: parseFloat(data[key].outstanding),
    };
  });
}

function AnchorSubModal({ open, onClose, data }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const newData = transformLoanData(data);
    setRows(newData);

    console.log(rows);
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          display: "inline-block",
          padding: 2,
        }}
      >
        <Button onClick={onClose} sx={{ marginTop: 2 }}>
          <CloseIcon />
        </Button>
        <DataTable
          entriesPerPage={{ defaultValue: 3, entries: [3, 5, 10] }}
          table={{
            columns: [
              { Header: "Loan Number ", accessor: "loan", width: "25%" },
              { Header: "Outstanding", accessor: "outstanding", width: "30%" },
            ],
            rows: rows,
          }}
        />
      </Box>
    </Modal>
  );
}

AnchorSubModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
};

export default AnchorSubModal;

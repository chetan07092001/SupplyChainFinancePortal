import * as React from "react";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import PropTypes from "prop-types";
import CustomModal from "./CustomModal";
import AnchorSubModal from "./AnchorSubModal";
import DataTable from "examples/Tables/DataTable";
import { Icon, IconButton } from "@mui/material";
import MDTypography from "components/MDTypography";
import axios from "axios";

const data = [
  { vendorName: "Vendor 1", overdueAmount: "$500", view: "view" },
  { vendorName: "Vendor 2", overdueAmount: "$300", view: "view" },
  { vendorName: "Vendor 3", overdueAmount: "$700", view: "view" },
  { vendorName: "Vendor 4", overdueAmount: "$250", view: "view" },
];
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "50%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

// Function to handle button click

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

function processData(data) {
  const result = {};

  for (const vendor in data) {
    const loansData = JSON.parse(data[vendor]);

    const loans = {};
    let totalOverdue = 0;

    for (const loanKey in loansData) {
      const loan = loansData[loanKey];
      loans[loanKey] = {
        outstanding: loan.outstanding,
        overdue: loan.overdue,
        maturityDate: loan.maturityDate,
        loanTenure: loan.loanTenure,
        lastDueDate: loan.lastDueDate,
      };
      totalOverdue += parseFloat(loan.overdue);
    }

    result[vendor] = {
      loans: loans,
      totalOverdue: totalOverdue.toFixed(2),
    };
  }

  return result;
}

function update(processedData) {
  const result = [];

  for (const vendor in processedData) {
    result.push({
      vendorName: vendor,
      overdueAmount: processedData[vendor].totalOverdue,
      view: "view",
    });
  }

  return result;
}

function AnchorModal({ open, onClose }) {
  const [openModal, setOpenModal] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [processdata, setProcessData] = React.useState([]);
  const [loanDetails, setLoanDetails] = React.useState([]);

  const handleNameClick = (vendor) => {
    setLoanDetails(processdata[vendor].loans);
    console.log(loanDetails);
    setOpenModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData();
        const processedData = processData(data);
        const updatedRows = update(processedData);
        setProcessData(processedData);
        console.log("anchorRows");
        console.log(updatedRows);

        console.log(processedData);
        setRows(updatedRows);
        console.log("data");
      } catch (e) {
        console.log(e);
      }
    };
    fetchData();
  }, []);

  const handleViewClick = (vendorName) => {
    setOpenModal(true);
  };

  const transformData = (data) => {
    return data.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => {
          if (key === "view") {
            return [
              key,
              <IconButton
                key={key}
                size="small"
                disableRipple
                color="inherit"
                onClick={() => handleNameClick(item.vendorName)}
              >
                <Icon>visibility</Icon>
              </IconButton>,
            ];
          } else {
            return [
              key,
              <MDTypography key={key} variant="caption" color="text" fontWeight="medium">
                {value}
              </MDTypography>,
            ];
          }
        })
      )
    );
  };

  return (
    <div>
      <AnchorSubModal open={openModal} onClose={() => setOpenModal(false)} data={loanDetails} />
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
          <DataTable
            table={{
              columns: [
                {
                  Header: "Vendor Name",
                  accessor: "vendorName",
                  width: "25%",
                },
                { Header: "OverDue Amount", accessor: "overdueAmount", width: "30%" },
                { Header: "View", accessor: "view", align: "center" },
              ],
              rows: transformData(rows),
            }}
          />
        </Box>
      </Modal>
    </div>
  );
}
AnchorModal.propTypes = {
  open: PropTypes.bool.isRequired, // 'open' is a required boolean prop
  onClose: PropTypes.func.isRequired, // 'onClose' is a required function prop
};

export default AnchorModal;

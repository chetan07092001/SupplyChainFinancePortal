import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import axios from "axios";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import StatusDropdown from "./StatusDropdown"; // Import your new component
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useQuery } from "@tanstack/react-query";
import { useFetchScfApi } from "customHook/useFetchScfApi";
import { useSessionId } from "customHook/useSessionId";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import dayjs from "dayjs";
import Chip from "@mui/material/Chip";
function Tables() {
  const [status, setStatus] = useState("All");

  const colorObject = {
    Disbursed: "error",
    PARTIALLYDISBURSED: "error",
    REJECTED: "error",
  };

  const viewDoc = async (item) => {
    const wiName = item.processid; // Change to match the API response
    console.log(wiName + " WID");

    const sID = await useSessionId(); // Make sure to await for the session ID
    console.log(sID + " SID");

    window.open(
      `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
    );
    console.log(item);
  };

  const getStatusColor = (status) => {
    const s = status.replace(/\s+/g, "");
    if (s === "DISBURSED") return "#008533";
    if (s === "PARTIALLYDISBURSED") return "#748D92";
    if (s === "REJECTED") return "#d32f2f";
    return "#999";
  };

  const transformData = (Tabledata) => {
    return Tabledata.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => {
          if (key === "invoiceStatus") {
            return [
              key,
              <Chip
                key={key}
                label={value}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(value),
                  color: "#fff",
                  fontWeight: 400,
                  borderRadius: "11px",
                  px: 1,
                }}
              />,
            ];
          }
          if (key === "view") {
            return [
              key,
              <IconButton
                key={key}
                size="small"
                disableRipple
                color="inherit"
                onClick={() => handleClickOpen(item)}
              >
                <Icon>replaycirclefilled</Icon>
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

  function Tabledata() {
    return {
      columns: [
        {
          Header: "Reference Number",
          accessor: "transactionRefNumber",
          width: "10%",
          align: "left",
        },
        { Header: "Invoice Number", accessor: "invnumber", width: "10%", align: "left" },
        { Header: "Wi Name", accessor: "winame", width: "10%", align: "left" },
        { Header: "Spoke Name", accessor: "vendorname", align: "left" },
        { Header: "Anchor Name", accessor: "anchorname", width: "15%", align: "left" },
        { Header: "Total Invested Amount", accessor: "invoiceAmount", align: "center" },
        { Header: "Total Disbursed Amount", accessor: "disburseAmount", align: "right" },
        { Header: "Status", accessor: "invoiceStatus", align: "center" },
      ],
      rows: rowData,
    };
  }

  const handleChange = (event) => {
    setStatus(event.target.value);
  };

  const [response, setResponse] = useState([]);
  const [rowData, setRowData] = useState([]);
  const { columns, rows } = Tabledata(rowData);

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      const data = await useFetchScfApi({
        url: "https://scfdemo.newgensoftware.net:8443/scf/FetchDataAtCustomerPortal",
      });

      const updatedData = data.map((item) => ({
        ...item,
        view: "view",
        invoiceAmount: Number(item.invoiceAmount),
        disburseAmount: Number(item.disburseAmount).toLocaleString("en-US"),
        winame: item.winame ? item.winame : "-",
        transactionRefNumber: item.transactionRefNumber ? item.transactionRefNumber : "-",
      }));

      setRowData(transformData(updatedData));
      setResponse(updatedData);
      return await updatedData;
    },
  });
  const [startDate, setStartDate] = useState("02/10/2025");
  const [endDate, setEndDate] = React.useState(null);

  useEffect(() => {
    if (status === "All") {
      setRowData(transformData(response));
    } else {
      const filterData = response.filter(
        (item) => item.invoiceStatus.toLowerCase() === status.toLowerCase()
      );

      setRowData(transformData(filterData));
    }
  }, [status]);

  const [open, setOpen] = React.useState(false);
  const [dialogData, setDialogData] = useState([]);
  const [tenor, setTenor] = useState("60");

  async function fetchRollOverData(wiName) {
    const url = "https://scfdemo.newgensoftware.net:8443/scfqa/fetchRollOverData";
    console.log(wiName, "this is winame");
    try {
      const response = await axios.get(url, {
        params: {
          wiName: "SCF-000000005829-Portal",
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // response.data will have the response
      setDialogData(response.data);
      return response.data;
    } catch (error) {
      // handle error
      console.error("Error fetching rollover data:", error);
      throw error;
    }
  }

  function formatDate(input) {
    if (!input) return "";

    // Split date and time
    const [datePart] = input.split(" ");
    const [year, month, day] = datePart.split("-");

    // Return in dd/mm/yyyy format
    return `${day}/${month}/${year}`;
  }
  useEffect(() => {
    console.log(dialogData, "dialogdata");
  }, [dialogData]);

  const handleClickOpen = async (item) => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function getDaysBetween(date1, date2) {
    // Parse dates from dd/mm/yyyy format
    const [day1, month1, year1] = date1.split("/").map(Number);
    const [day2, month2, year2] = date2.split("/").map(Number);

    const d1 = new Date(year1, month1 - 1, day1);
    const d2 = new Date(year2, month2 - 1, day2);

    // Difference in time (milliseconds)
    const diffTime = Math.abs(d2 - d1);

    // Convert ms → days
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (endDate == null) {
      toast.error("Please enter new Due Date", {
        position: "top-center",
        autoClose: 2000, // auto close in 3s
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Slide,
      });
      return;
    }
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());
    const readOnlyValue = formJson.readOnlyField;
    console.log("Read Only:", readOnlyValue);
    console.log("Selected Date:", endDate.format("DD/MM/YYYY"));
    const days = getDaysBetween(endDate.format("DD/MM/YYYY"), startDate);
    if (days < Number(tenor)) {
      toast.success("Case Submitted Successfully & pending for Bank’s approval.", {
        position: "top-center",
        autoClose: 2000, // auto close in 3s
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Slide,
      });
      setTimeout(() => {
        setEndDate(null);
        handleClose();
      }, 1500);
    } else if (days > Number(tenor)) {
      toast.error("Tenor exceeds the maximum allowed finance period.", {
        position: "top-center",
        autoClose: 3000, // auto close in 3s
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Slide,
      });
      setEndDate(null);
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer />
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #e0e0e0" }}>
          Rollover
        </DialogTitle>

        <form onSubmit={handleSubmit} id="subscription-form">
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              {/* Tenor */}
              <TextField
                id="tenorField"
                name="Tenor"
                label="Tenor"
                value={tenor || ""}
                fullWidth
                variant="outlined"
                InputProps={{
                  readOnly: true,
                }}
              />

              {/* Old Due Date */}
              <TextField
                id="oldDueDateField"
                name="Old Due Date"
                label="Old Due Date"
                value={startDate || ""}
                fullWidth
                variant="outlined"
                InputProps={{
                  readOnly: true,
                }}
              />

              {/* New Due Date */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="New Due Date"
                  inputFormat="DD/MM/YYYY"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" form="subscription-form">
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <DashboardNavbar absoulute />
      {/* <MDTypography
        sx={{ borderLeft: 4, borderColor: "secondary.main" }}
        variant="h5"
        gutterBottom
        pl={1}
        mb={5}
      >
        All Cases
      </MDTypography> */}
      <MDBox pt={0} pb={3}>
        <StatusDropdown status={status} handleChange={handleChange} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <MDBox m={2} p={0} sx={{ flexDirection: "row-reverse" }}></MDBox>
              <MDBox pt={0}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={false}
                  showTotalEntries={true}
                  noEndBorder
                  pagination={{ variant: "gradient", color: "error" }}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Tables;

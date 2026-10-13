import axios from "axios";

const BASE_URL = "https://scfdemo.newgensoftware.net:8443/scf";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch program details for a vendor.
 * GET /scf/ProgramDetails?VendorName={vendorName}
 * Returns an array of program name strings.
 */
export async function fetchProgramDetails(vendorName) {
  try {
    const response = await axios.get(`${BASE_URL}/ProgramDetails`, {
      params: { VendorName: vendorName },
      headers: getAuthHeaders(),
    });

    if (response.data?.status === "success" && response.data?.data) {
      // The API returns a comma-separated string of program names
      return response.data.data
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    }

    console.warn("ProgramDetails: unexpected response", response.data);
    return [];
  } catch (error) {
    console.error("fetchProgramDetails Error:", error);
    throw new Error(
      error.response?.status === 401
        ? "Session expired. Please log in again."
        : `Failed to fetch program details: ${error.message}`
    );
  }
}

/**
 * Create a work item (invoice case) in the back-office.
 * POST /scf/createWorkItemInvoiceChatbotMessage
 * Body uses anchorcode, programname, and invoiceDetais array.
 * Returns { wiName, folderIndex }.
 */
export async function createWorkItem({ anchorcode, programname, invoiceDetais }) {
  try {
    const response = await axios.post(
      `${BASE_URL}/createWorkItemInvoiceChatbotMessage`,
      {
        anchorcode,
        programname,
        wiName: "",
        folderIndex: "",
        invoiceDetais,
      },
      { headers: getAuthHeaders() }
    );

    if (response.data?.status === "true" && response.data?.wiName) {
      return {
        wiName: response.data.wiName,
        folderIndex: response.data.folderIndex || "",
      };
    }

    console.warn("createWorkItem: unexpected response", response.data);
    throw new Error(response.data?.msg || "Failed to create work item.");
  } catch (error) {
    console.error("createWorkItem Error:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
}

/**
 * Book the loan after OTP verification.
 * POST /scf/LoanBooking
 * Requires wiName and folderIndex returned by createWorkItem.
 */
export async function bookLoan({ anchorcode, programname, wiName, folderIndex, invoiceDetais }) {
  try {
    const response = await axios.post(
      `${BASE_URL}/LoanBooking`,
      {
        anchorcode,
        programname,
        wiName,
        folderIndex,
        invoiceDetais,
      },
      { headers: getAuthHeaders() }
    );

    if (response.data?.status === "true") {
      return response.data;
    }

    console.warn("bookLoan: unexpected response", response.data);
    throw new Error(response.data?.msg || "Loan booking failed.");
  } catch (error) {
    console.error("bookLoan Error:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
}

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
 * Read and normalize the logged-in user persona from localStorage.
 * Throws if the persona is not "anchor" or "vendor".
 */
export function getCurrentPersona() {
  const persona = (localStorage.getItem("type") || "").trim().toLowerCase();
  if (persona !== "anchor" && persona !== "vendor") {
    throw new Error("Unable to determine the logged-in user's persona.");
  }
  return persona;
}

/**
 * Supported Transaction Information Endpoints
 */
export const TRANSACTION_ENDPOINTS = {
  VENDOR_LATEST_PROGRAM: "/fetchTransactionInfoLastwithProgram",
  VENDOR_EARLIEST_PROGRAM: "/fetchTransactionInfoFirstWithProgram",
  VENDOR_LATEST: "/fetchTransactionInfoLast",
  VENDOR_EARLIEST: "/fetchTransactionInfoFirst",
  ANCHOR_LATEST: "/fetchTransactionInfoLastAnchor",
  ANCHOR_EARLIEST: "/fetchTransactionInfoFirstAnchor",
};

/**
 * Deterministically resolve the API endpoint for transaction inquiries.
 * Strict rules:
 * - Anchor persona strictly accesses Anchor endpoints (/fetchTransactionInfoLastAnchor or /fetchTransactionInfoFirstAnchor).
 * - Vendor persona accesses Vendor endpoints with or without program filter.
 */
export function resolveTransactionEndpoint({ persona, ordering, hasProgram = false }) {
  const normPersona = (persona || "").trim().toLowerCase();
  if (normPersona !== "anchor" && normPersona !== "vendor") {
    throw new Error(`Unsupported or invalid persona '${persona}'. Must be 'anchor' or 'vendor'.`);
  }

  const normOrdering = (ordering || "").trim().toLowerCase();
  const isLatest =
    normOrdering === "latest" || normOrdering === "last" || normOrdering === "recent";
  const isEarliest =
    normOrdering === "earliest" || normOrdering === "first" || normOrdering === "oldest";

  if (!isLatest && !isEarliest) {
    throw new Error(`Invalid ordering '${ordering}'. Must be 'latest' or 'earliest'.`);
  }

  if (normPersona === "anchor") {
    return isLatest ? TRANSACTION_ENDPOINTS.ANCHOR_LATEST : TRANSACTION_ENDPOINTS.ANCHOR_EARLIEST;
  }

  // Vendor persona
  if (hasProgram) {
    return isLatest
      ? TRANSACTION_ENDPOINTS.VENDOR_LATEST_PROGRAM
      : TRANSACTION_ENDPOINTS.VENDOR_EARLIEST_PROGRAM;
  }
  return isLatest ? TRANSACTION_ENDPOINTS.VENDOR_LATEST : TRANSACTION_ENDPOINTS.VENDOR_EARLIEST;
}

/**
 * Enforce requested limit and chronological ordering if the backend returns
 * an unbounded or unfiltered transaction array.
 */
function enforceTransactionLimit(data, limit, ordering) {
  if (!Array.isArray(data) || data.length <= limit) {
    return data;
  }

  const getSortKey = (item) => {
    if (!item || typeof item !== "object") return 0;
    const ref = item.transactionrefnum || item.transactionRefNum || "";
    const m = ref.match(/TRX-(\d+)/i);
    if (m) return Number(m[1]);

    const dStr = item.invoicedate || item.invoiceDate || item.disbursedate || item.disburseDate;
    if (dStr && typeof dStr === "string") {
      const parts = dStr.split("/");
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      }
    }
    return 0;
  };

  const firstKey = getSortKey(data[0]);
  const lastKey = getSortKey(data[data.length - 1]);
  const isAscending = firstKey <= lastKey;

  const normOrdering = (ordering || "").trim().toLowerCase();
  const isLatest =
    normOrdering === "latest" || normOrdering === "last" || normOrdering === "recent";

  if (isLatest) {
    // If backend returned ascending (oldest first), latest transactions are at the end
    return isAscending ? data.slice(-limit).reverse() : data.slice(0, limit);
  }
  // Earliest transactions
  return isAscending ? data.slice(0, limit) : data.slice(-limit).reverse();
}

/**
 * Deterministic API caller for the 6 Transaction Information endpoints.
 * Uses URLSearchParams to build query parameters.
 * Validates persona, ordering, limit, and vendorCode.
 * Anchor requests NEVER send vendorCode or program filters.
 */
export async function fetchTransactionInformation({
  persona,
  ordering,
  limit,
  vendorCode,
  program,
}) {
  const effectivePersona = (persona || getCurrentPersona()).trim().toLowerCase();

  const numLimit = Number(limit);
  if (!Number.isInteger(numLimit) || numLimit <= 0) {
    throw new Error(`Invalid limit '${limit}'. Limit must be a positive integer.`);
  }

  const hasProgram = Boolean(program && String(program).trim());
  const endpoint = resolveTransactionEndpoint({
    persona: effectivePersona,
    ordering,
    hasProgram,
  });

  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(numLimit));

  if (effectivePersona === "vendor") {
    if (!vendorCode || typeof vendorCode !== "string" || !vendorCode.trim()) {
      throw new Error("vendorCode is required for Vendor transaction inquiries.");
    }
    searchParams.set("vendorCode", vendorCode.trim());
    if (hasProgram) {
      searchParams.set("program", String(program).trim());
    }
  }

  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    const rawData = response.data;
    const processedData = Array.isArray(rawData)
      ? enforceTransactionLimit(rawData, numLimit, ordering)
      : rawData;

    return {
      endpoint,
      persona: effectivePersona,
      params: Object.fromEntries(searchParams.entries()),
      data: processedData,
    };
  } catch (error) {
    console.error("fetchTransactionInformation Error:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    const errorMessage =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      `Transaction inquiry failed: ${error.message}`;
    throw new Error(errorMessage);
  }
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

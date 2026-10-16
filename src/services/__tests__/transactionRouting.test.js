import axios from "axios";
import {
  getCurrentPersona,
  resolveTransactionEndpoint,
  fetchTransactionInformation,
  TRANSACTION_ENDPOINTS,
} from "../scfApiService";
import {
  fetchTransactionInformationTool,
  TOOL_REGISTRY,
} from "../businessTools";
import { extractTransactionParamsFromText } from "../geminiService";

jest.mock("axios");

describe("Intelligent Transaction Information API Routing Tests", () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    const store = {};
    global.localStorage = {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    };
  });

  afterAll(() => {
    global.localStorage = originalLocalStorage;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Persona Resolution Tests
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Persona Resolution (getCurrentPersona)", () => {
    test("reads and normalizes 'Vendor' persona from localStorage.type", () => {
      localStorage.setItem("type", "Vendor");
      expect(getCurrentPersona()).toBe("vendor");
    });

    test("reads and normalizes 'Anchor' persona from localStorage.type", () => {
      localStorage.setItem("type", "Anchor");
      expect(getCurrentPersona()).toBe("anchor");
    });

    test("handles case-insensitivity and whitespace", () => {
      localStorage.setItem("type", "   VENDOR   ");
      expect(getCurrentPersona()).toBe("vendor");

      localStorage.setItem("type", "  anchor ");
      expect(getCurrentPersona()).toBe("anchor");
    });

    test("throws descriptive error when localStorage.type is missing or invalid", () => {
      localStorage.removeItem("type");
      expect(() => getCurrentPersona()).toThrow(
        "Unable to determine the logged-in user's persona."
      );

      localStorage.setItem("type", "Dealer");
      expect(() => getCurrentPersona()).toThrow(
        "Unable to determine the logged-in user's persona."
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Deterministic Endpoint Routing Tests (All 6 Paths A - F)
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Deterministic Endpoint Routing (resolveTransactionEndpoint)", () => {
    test("Path A: Vendor + Latest + Program -> /fetchTransactionInfoLastwithProgram", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "vendor",
        ordering: "latest",
        hasProgram: true,
      });
      expect(endpoint).toBe(TRANSACTION_ENDPOINTS.VENDOR_LATEST_PROGRAM);
      expect(endpoint).toBe("/fetchTransactionInfoLastwithProgram");
    });

    test("Path B: Vendor + Earliest + Program -> /fetchTransactionInfoFirstWithProgram", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "vendor",
        ordering: "earliest",
        hasProgram: true,
      });
      expect(endpoint).toBe(TRANSACTION_ENDPOINTS.VENDOR_EARLIEST_PROGRAM);
      expect(endpoint).toBe("/fetchTransactionInfoFirstWithProgram");
    });

    test("Path C: Vendor + Latest (no program) -> /fetchTransactionInfoLast", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "vendor",
        ordering: "latest",
        hasProgram: false,
      });
      expect(endpoint).toBe(TRANSACTION_ENDPOINTS.VENDOR_LATEST);
      expect(endpoint).toBe("/fetchTransactionInfoLast");
    });

    test("Path D: Vendor + Earliest (no program) -> /fetchTransactionInfoFirst", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "vendor",
        ordering: "earliest",
        hasProgram: false,
      });
      expect(endpoint).toBe(TRANSACTION_ENDPOINTS.VENDOR_EARLIEST);
      expect(endpoint).toBe("/fetchTransactionInfoFirst");
    });

    test("Path E: Anchor + Latest -> /fetchTransactionInfoLastAnchor", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "anchor",
        ordering: "latest",
        hasProgram: false,
      });
      expect(endpoint).toBe(TRANSACTION_ENDPOINTS.ANCHOR_LATEST);
      expect(endpoint).toBe("/fetchTransactionInfoLastAnchor");
    });

    test("Path F: Anchor + Earliest -> /fetchTransactionInfoFirstAnchor", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "anchor",
        ordering: "earliest",
        hasProgram: false,
      });
      expect(endpoint).toBe(TRANSACTION_ENDPOINTS.ANCHOR_EARLIEST);
      expect(endpoint).toBe("/fetchTransactionInfoFirstAnchor");
    });

    test("Anchor requests never select Vendor endpoints even if program is passed", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "anchor",
        ordering: "latest",
        hasProgram: true, // Anchor ignores program
      });
      expect(endpoint).toBe("/fetchTransactionInfoLastAnchor");
      expect(endpoint).not.toContain("withProgram");
    });

    test("Vendor requests never select Anchor endpoints", () => {
      const endpoint = resolveTransactionEndpoint({
        persona: "vendor",
        ordering: "latest",
        hasProgram: false,
      });
      expect(endpoint).toBe("/fetchTransactionInfoLast");
      expect(endpoint).not.toContain("Anchor");
    });

    test("Normalizes synonyms ('last' -> latest, 'first' -> earliest)", () => {
      expect(
        resolveTransactionEndpoint({ persona: "vendor", ordering: "last", hasProgram: false })
      ).toBe("/fetchTransactionInfoLast");
      expect(
        resolveTransactionEndpoint({ persona: "anchor", ordering: "first", hasProgram: false })
      ).toBe("/fetchTransactionInfoFirstAnchor");
    });

    test("Throws on unsupported ordering or unsupported persona", () => {
      expect(() =>
        resolveTransactionEndpoint({ persona: "vendor", ordering: "randomOrder" })
      ).toThrow(/Invalid ordering/);
      expect(() =>
        resolveTransactionEndpoint({ persona: "guest", ordering: "latest" })
      ).toThrow(/Unsupported or invalid persona/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. API Execution & Query Parameter URLSearchParams Tests
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. API Execution & URLSearchParams (fetchTransactionInformation)", () => {
    test("Vendor Path A calls exact endpoint with program, limit, and vendorCode", async () => {
      localStorage.setItem("type", "Vendor");
      localStorage.setItem("token", "dummy-bearer-token");

      axios.get.mockResolvedValueOnce({
        data: [{ invoiceNumber: "INV-001", amount: 50000 }],
      });

      const res = await fetchTransactionInformation({
        persona: "vendor",
        ordering: "latest",
        limit: 10,
        vendorCode: "VEN0020549",
        program: "PROG-00000206-ID",
      });

      expect(axios.get).toHaveBeenCalledTimes(1);
      const [calledUrl, config] = axios.get.mock.calls[0];

      expect(calledUrl).toBe(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchTransactionInfoLastwithProgram?limit=10&vendorCode=VEN0020549&program=PROG-00000206-ID"
      );
      expect(config.headers.Authorization).toBe("Bearer dummy-bearer-token");
      expect(res.data).toHaveLength(1);
      expect(res.endpoint).toBe("/fetchTransactionInfoLastwithProgram");
    });

    test("Vendor Path C calls endpoint with only limit and vendorCode (no program)", async () => {
      localStorage.setItem("type", "Vendor");
      localStorage.setItem("token", "dummy-bearer-token");

      axios.get.mockResolvedValueOnce({
        data: [{ invoiceNumber: "INV-002", amount: 25000 }],
      });

      const res = await fetchTransactionInformation({
        persona: "vendor",
        ordering: "latest",
        limit: 5,
        vendorCode: "VEN0020549",
      });

      const [calledUrl] = axios.get.mock.calls[0];
      expect(calledUrl).toBe(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchTransactionInfoLast?limit=5&vendorCode=VEN0020549"
      );
      expect(calledUrl).not.toContain("program=");
      expect(res.params).toEqual({ limit: "5", vendorCode: "VEN0020549" });
    });

    test("Anchor Path E strictly accepts only limit (never appends vendorCode or program)", async () => {
      localStorage.setItem("type", "Anchor");
      localStorage.setItem("token", "dummy-bearer-token");

      axios.get.mockResolvedValueOnce({
        data: [{ transactionId: "TXN-999", amount: 100000 }],
      });

      const res = await fetchTransactionInformation({
        persona: "anchor",
        ordering: "latest",
        limit: 15,
        vendorCode: "SHOULD_BE_IGNORED",
        program: "IGNORED_PROG",
      });

      const [calledUrl] = axios.get.mock.calls[0];
      expect(calledUrl).toBe(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchTransactionInfoLastAnchor?limit=15"
      );
      expect(calledUrl).not.toContain("vendorCode");
      expect(calledUrl).not.toContain("program");
      expect(res.params).toEqual({ limit: "15" });
    });

    test("Anchor Path F calls fetchTransactionInfoFirstAnchor with limit", async () => {
      localStorage.setItem("type", "Anchor");
      localStorage.setItem("token", "dummy-bearer-token");

      axios.get.mockResolvedValueOnce({
        data: [],
      });

      const res = await fetchTransactionInformation({
        persona: "anchor",
        ordering: "earliest",
        limit: 20,
      });

      const [calledUrl] = axios.get.mock.calls[0];
      expect(calledUrl).toBe(
        "https://scfdemo.newgensoftware.net:8443/scf/fetchTransactionInfoFirstAnchor?limit=20"
      );
      expect(res.endpoint).toBe("/fetchTransactionInfoFirstAnchor");
    });

    test("Validates limit: rejects non-integers, negative numbers, and zero", async () => {
      await expect(
        fetchTransactionInformation({ persona: "anchor", ordering: "latest", limit: 0 })
      ).rejects.toThrow(/Limit must be a positive integer/);

      await expect(
        fetchTransactionInformation({ persona: "anchor", ordering: "latest", limit: -5 })
      ).rejects.toThrow(/Limit must be a positive integer/);

      await expect(
        fetchTransactionInformation({ persona: "anchor", ordering: "latest", limit: "invalid" })
      ).rejects.toThrow(/Limit must be a positive integer/);
    });

    test("Vendor persona requires vendorCode", async () => {
      await expect(
        fetchTransactionInformation({
          persona: "vendor",
          ordering: "latest",
          limit: 10,
          vendorCode: "",
        })
      ).rejects.toThrow(/vendorCode is required for Vendor/);
    });

    test("Propagates 401 session expiration without exposing tokens", async () => {
      localStorage.setItem("type", "Anchor");
      axios.get.mockRejectedValueOnce({
        response: { status: 401, data: { msg: "Unauthorized" } },
      });

      await expect(
        fetchTransactionInformation({ persona: "anchor", ordering: "latest", limit: 5 })
      ).rejects.toThrow("Session expired. Please log in again.");
    });

    test("handles real backend Anchor response schema with lowercase keys from postman", async () => {
      localStorage.setItem("type", "Anchor");
      const postmanResponse = [
        {
          anchorname: "Buyer 1",
          invoicedate: "18/09/2026",
          disburseamount: "10000.00",
          disbursedate: "21/09/2026",
          duedate: "28/10/2027",
          invoicenumber: "DRINVO1247",
          invoiceamount: "10000.00",
          transactionrefnum: "TRX-20260921007910-ID",
          vendorname: "Vendor 1",
        },
      ];

      axios.get.mockResolvedValueOnce({
        data: postmanResponse,
      });

      const res = await fetchTransactionInformation({
        persona: "anchor",
        ordering: "latest",
        limit: 6,
      });

      expect(res.endpoint).toBe("/fetchTransactionInfoLastAnchor");
      expect(res.data).toHaveLength(1);
      expect(res.data[0].transactionrefnum).toBe("TRX-20260921007910-ID");
      expect(res.data[0].invoicenumber).toBe("DRINVO1247");
      expect(res.data[0].vendorname).toBe("Vendor 1");
      expect(res.data[0].disburseamount).toBe("10000.00");
    });

    test("enforces limit and newest-first ordering when backend returns unconstrained chronological array", async () => {
      localStorage.setItem("type", "Vendor");
      localStorage.setItem("token", "dummy-bearer-token");

      // Simulate 780 items in chronological ascending order (TRX-20241224... up to TRX-20260921...)
      const mock780 = Array.from({ length: 780 }, (_, i) => ({
        transactionrefnum: `TRX-${20240101 + i}000000-ID`,
        invoicenumber: `INV-${i + 1}`,
        invoicedate: "01/01/2025",
        invoiceamount: "10000.00",
      }));

      axios.get.mockResolvedValueOnce({
        data: mock780,
      });

      const res = await fetchTransactionInformation({
        persona: "vendor",
        ordering: "latest",
        limit: 5,
        vendorCode: "VEN0020549",
      });

      expect(res.data).toHaveLength(5);
      // The newest transactions (from the end of the ascending list) should be returned in descending order
      expect(res.data[0].transactionrefnum).toBe("TRX-20240880000000-ID");
      expect(res.data[4].transactionrefnum).toBe("TRX-20240876000000-ID");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Business Tool Dispatcher Tests
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Business Tool Dispatcher (fetchTransactionInformationTool)", () => {
    test("fetchTransactionInformationTool is registered in TOOL_REGISTRY", () => {
      expect(TOOL_REGISTRY.fetchTransactionInformation).toBeDefined();
      expect(typeof TOOL_REGISTRY.fetchTransactionInformation).toBe("function");
    });

    test("returns success and payload on valid call", async () => {
      localStorage.setItem("type", "Anchor");
      axios.get.mockResolvedValueOnce({
        data: [{ id: "TX-1", amount: 500 }],
      });

      const result = await fetchTransactionInformationTool({
        persona: "anchor",
        ordering: "latest",
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(result.endpoint).toBe("/fetchTransactionInfoLastAnchor");
      expect(result.data).toHaveLength(1);
    });

    test("catches error and returns success: false with honest error message", async () => {
      localStorage.setItem("type", "Vendor");
      const result = await fetchTransactionInformationTool({
        persona: "vendor",
        ordering: "latest",
        limit: 5,
        vendorCode: "", // missing
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("vendorCode is required");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Multi-Turn Parameter Extraction & Merging Tests
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Multi-Turn Parameter Extraction (extractTransactionParamsFromText)", () => {
    test("extracts ordering from user prompts", () => {
      expect(extractTransactionParamsFromText("Show my latest transactions").ordering).toBe(
        "latest"
      );
      expect(extractTransactionParamsFromText("Fetch the earliest records").ordering).toBe(
        "earliest"
      );
      expect(extractTransactionParamsFromText("Give me recent txns").ordering).toBe("latest");
      expect(extractTransactionParamsFromText("Show first 5 transactions").ordering).toBe(
        "earliest"
      );
    });

    test("extracts positive integer limits accurately", () => {
      expect(extractTransactionParamsFromText("Show 10 records").limit).toBe(10);
      expect(extractTransactionParamsFromText("limit 25").limit).toBe(25);
      expect(extractTransactionParamsFromText("Fetch 5 transactions").limit).toBe(5);
    });

    test("extracts vendor codes without hardcoded fallbacks", () => {
      expect(
        extractTransactionParamsFromText("My vendor code is VEN0020549").vendorCode
      ).toBe("VEN0020549");
      expect(extractTransactionParamsFromText("vendorCode=VC713").vendorCode).toBe("VC713");
    });

    test("extracts program identifiers cleanly", () => {
      expect(
        extractTransactionParamsFromText("Use program PROG-00000206-ID").program
      ).toBe("PROG-00000206-ID");
      expect(extractTransactionParamsFromText("program: deeptest1").program).toBe("deeptest1");
    });

    test("extracts multiple parameters in a single message in arbitrary order", () => {
      const res = extractTransactionParamsFromText(
        "Show the latest 10 transactions for program PROG-00000206-ID with vendor code VEN0020549"
      );
      expect(res.ordering).toBe("latest");
      expect(res.limit).toBe(10);
      expect(res.program).toBe("PROG-00000206-ID");
      expect(res.vendorCode).toBe("VEN0020549");
    });

    test("returns empty object for missing fields without inventing defaults", () => {
      const res = extractTransactionParamsFromText("Hello assistant");
      expect(res.ordering).toBeUndefined();
      expect(res.limit).toBeUndefined();
      expect(res.vendorCode).toBeUndefined();
      expect(res.program).toBeUndefined();
    });
  });
});

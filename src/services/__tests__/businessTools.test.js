import {
  resolveVendor,
  getVendorPrograms,
  validateLoanRequestTool,
  createLoanWorkItemTool,
  verifyLoanOtpTool,
  bookLoanTool,
} from "../businessTools";
import { createNewTransaction, TRANSACTION_STATES } from "../transactionState";
import * as scfApi from "../scfApiService";

jest.mock("../scfApiService");

describe("Phase 3: Business Tools Registry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("resolveVendor rejects empty vendor name", async () => {
    const res = await resolveVendor({ vendorName: "   " });
    expect(res.success).toBe(false);
    expect(res.found).toBe(false);
    expect(res.error).toBeDefined();
  });

  test("getVendorPrograms propagates error when backend fails without dummy fallback", async () => {
    scfApi.fetchProgramDetails.mockRejectedValueOnce(new Error("Network timeout"));

    const res = await getVendorPrograms({ vendorName: "Vendor 1" });
    expect(res.success).toBe(false);
    expect(res.programs).toHaveLength(0);
    expect(res.error).toContain("Network timeout");
  });

  test("validateLoanRequestTool calls deterministic validation", async () => {
    const txn = createNewTransaction({
      vendorName: "Vendor 1",
      programName: "Prog 1",
      invoiceNumber: "INV-100",
      invoiceDate: "10/10/2026",
      invoiceAmount: 50000,
      discountAmount: 1000,
    });

    const res = await validateLoanRequestTool({ transaction: txn });
    expect(res.valid).toBe(true);
    expect(res.missingFields).toHaveLength(0);
  });

  test("createLoanWorkItemTool refuses execution if transaction is invalid", async () => {
    const incompleteTxn = createNewTransaction({
      vendorName: "Vendor 1",
      // missing invoice details
    });

    await expect(
      createLoanWorkItemTool({ transaction: incompleteTxn })
    ).rejects.toThrow(/Cannot create work item: missing fields/);
  });

  test("createLoanWorkItemTool calls API and stores wiName and folderIndex", async () => {
    scfApi.createWorkItem.mockResolvedValueOnce({
      wiName: "WI-2026-9999",
      folderIndex: "FL-1234",
    });

    const txn = createNewTransaction({
      vendorName: "Vendor 1",
      programName: "Prog 1",
      invoiceNumber: "INV-100",
      invoiceDate: "10/10/2026",
      invoiceAmount: 50000,
      discountAmount: 1000,
    });

    const res = await createLoanWorkItemTool({ transaction: txn });
    expect(res.success).toBe(true);
    expect(res.wiName).toBe("WI-2026-9999");
    expect(res.transaction.status).toBe(TRANSACTION_STATES.OTP_PENDING);
    expect(res.transaction.workItem.wiName).toBe("WI-2026-9999");
    expect(scfApi.createWorkItem).toHaveBeenCalledWith(
      expect.objectContaining({
        anchorcode: "Vendor 1",
        programname: "Prog 1",
      })
    );
  });

  test("createLoanWorkItemTool normalizes invoiceDate to DD/MM/YYYY in invoiceDetais", async () => {
    scfApi.createWorkItem.mockResolvedValueOnce({
      wiName: "WI-2026-DATE-TEST",
      folderIndex: "FL-999",
    });

    const txn = createNewTransaction({
      vendorName: "Vendor 1",
      programName: "Prog 1",
      invoiceNumber: "INV-DATE-1",
      invoiceDate: "2026-10-16",
      invoiceAmount: 50000,
      discountAmount: 1000,
    });

    const res = await createLoanWorkItemTool({ transaction: txn });
    expect(res.success).toBe(true);
    expect(scfApi.createWorkItem).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceDetais: [
          expect.objectContaining({
            invoiceNumber: "INV-DATE-1",
            invoiceDate: "16/10/2026",
          }),
        ],
      })
    );
  });

  test("verifyLoanOtpTool rejects invalid length or mismatched transaction state", async () => {
    const txn = createNewTransaction(); // status = collecting_details
    const res = await verifyLoanOtpTool({ transaction: txn, otpCode: "123" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("not in OTP_PENDING state");
  });

  test("bookLoanTool refuses execution without verified OTP", async () => {
    const txn = createNewTransaction();
    txn.workItem = { wiName: "WI-123" };
    txn.otp.status = "not_started";

    await expect(bookLoanTool({ transaction: txn })).rejects.toThrow(
      /OTP verification has not been completed/
    );
  });

  test("bookLoanTool executes when OTP verified and work item present", async () => {
    scfApi.bookLoan.mockResolvedValueOnce({
      status: "true",
      loanId: "LN-9876",
    });

    const txn = createNewTransaction({
      vendorName: "Vendor 1",
      programName: "Prog 1",
      invoiceNumber: "INV-100",
      invoiceDate: "10/10/2026",
      invoiceAmount: 50000,
      discountAmount: 1000,
    });
    txn.status = TRANSACTION_STATES.OTP_PENDING;
    txn.workItem = { wiName: "WI-123", folderIndex: "FL-1" };
    txn.otp.status = "verified";

    const res = await bookLoanTool({ transaction: txn });
    expect(res.success).toBe(true);
    expect(res.transaction.status).toBe(TRANSACTION_STATES.COMPLETED);
    expect(res.bookingResult.loanId).toBe("LN-9876");
  });

  test("createLoanWorkItemTool creates single work item for multiple batch transactions with all invoices in invoiceDetais", async () => {
    scfApi.createWorkItem.mockResolvedValueOnce({
      wiName: "SCF-BATCH-001",
      folderIndex: "48050",
    });

    const txn1 = createNewTransaction({
      batchId: "BATCH-TEST",
      vendorName: "Vendor 1",
      programName: "deeptest1",
      invoiceNumber: "INV0022",
      invoiceDate: "25/08/2026",
      invoiceAmount: 10000,
      discountAmount: 10000,
    });

    const txn2 = createNewTransaction({
      batchId: "BATCH-TEST",
      vendorName: "Vendor 1",
      programName: "deeptest1",
      invoiceNumber: "INV0023",
      invoiceDate: "25/08/2026",
      invoiceAmount: 25000,
      discountAmount: 25000,
    });

    const res = await createLoanWorkItemTool({
      transaction: txn1,
      batchTransactions: [txn1, txn2],
    });

    expect(res.success).toBe(true);
    expect(res.wiName).toBe("SCF-BATCH-001");
    expect(res.invoiceCount).toBe(2);
    expect(res.allTransactions).toHaveLength(2);
    expect(res.allTransactions[0].workItem.wiName).toBe("SCF-BATCH-001");
    expect(res.allTransactions[1].workItem.wiName).toBe("SCF-BATCH-001");

    expect(scfApi.createWorkItem).toHaveBeenCalledWith({
      anchorcode: "Vendor 1",
      programname: "deeptest1",
      invoiceDetais: [
        expect.objectContaining({
          invoiceNumber: "INV0022",
          invoiceAmount: "10000",
          invoiceDate: "25/08/2026",
          discountAmount: "10000",
        }),
        expect.objectContaining({
          invoiceNumber: "INV0023",
          invoiceAmount: "25000",
          invoiceDate: "25/08/2026",
          discountAmount: "25000",
        }),
      ],
    });
  });

  test("bookLoanTool books single loan case for multiple batch transactions with all invoices in invoiceDetais", async () => {
    scfApi.bookLoan.mockResolvedValueOnce({
      status: "true",
      loanId: "LN-BATCH-100",
    });

    const txn1 = createNewTransaction({
      batchId: "BATCH-TEST",
      vendorName: "Vendor 1",
      programName: "deeptest1",
      invoiceNumber: "INV0022",
      invoiceDate: "25/08/2026",
      invoiceAmount: 10000,
      discountAmount: 10000,
    });
    txn1.status = TRANSACTION_STATES.OTP_PENDING;
    txn1.workItem = { wiName: "SCF-BATCH-001", folderIndex: "48050" };
    txn1.otp.status = "verified";

    const txn2 = createNewTransaction({
      batchId: "BATCH-TEST",
      vendorName: "Vendor 1",
      programName: "deeptest1",
      invoiceNumber: "INV0023",
      invoiceDate: "25/08/2026",
      invoiceAmount: 25000,
      discountAmount: 25000,
    });
    txn2.status = TRANSACTION_STATES.OTP_PENDING;
    txn2.workItem = { wiName: "SCF-BATCH-001", folderIndex: "48050" };
    txn2.otp.status = "verified";

    const res = await bookLoanTool({
      transaction: txn1,
      batchTransactions: [txn1, txn2],
    });

    expect(res.success).toBe(true);
    expect(res.invoiceCount).toBe(2);
    expect(res.allTransactions[0].status).toBe(TRANSACTION_STATES.COMPLETED);
    expect(res.allTransactions[1].status).toBe(TRANSACTION_STATES.COMPLETED);

    expect(scfApi.bookLoan).toHaveBeenCalledWith({
      anchorcode: "Vendor 1",
      programname: "deeptest1",
      wiName: "SCF-BATCH-001",
      folderIndex: "48050",
      invoiceDetais: [
        expect.objectContaining({
          invoiceNumber: "INV0022",
          invoiceAmount: "10000",
        }),
        expect.objectContaining({
          invoiceNumber: "INV0023",
          invoiceAmount: "25000",
        }),
      ],
    });
  });
});

import {
  createNewTransaction,
  mergeRequestEntities,
  validateTransactionData,
  transitionTransaction,
  TRANSACTION_STATES,
  FIELD_PROVENANCE,
} from "../transactionState";
import {
  resolveVendor,
  getVendorPrograms,
  validateLoanRequestTool,
  createLoanWorkItemTool,
  verifyLoanOtpTool,
  bookLoanTool,
} from "../businessTools";
import * as scfApi from "../scfApiService";
import { maskSensitiveData } from "../../utils/chatbotLogger";

jest.mock("../scfApiService");

describe("Phase 7: Nexus AI Full System Integration Tests (Tests A - K)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test A: Natural-language field extraction & merging
  test("Test A: Natural-language field extraction - accurate fields without fabricated identifiers", () => {
    const rawExtractedEntities = {
      vendorName: "Vendor A",
      invoiceNumber: "INV-104",
      invoiceDate: "12/10/2026",
      invoiceAmount: 250000,
      discountAmount: 5000,
      programName: null, // genuine missing field
    };

    const txn = createNewTransaction();
    const updatedTxn = mergeRequestEntities(txn, rawExtractedEntities, {
      provenance: FIELD_PROVENANCE.USER_PROVIDED,
    });

    expect(updatedTxn.vendor.name).toBe("Vendor A");
    expect(updatedTxn.invoice.number).toBe("INV-104");
    expect(updatedTxn.invoice.date).toBe("12/10/2026");
    expect(updatedTxn.invoice.amount).toBe(250000);
    expect(updatedTxn.invoice.discountAmount).toBe(5000);
    expect(updatedTxn.program.name).toBeNull(); // No fabricated program ID
    expect(updatedTxn.vendor.code).toBeNull(); // No fabricated vendor code
    expect(updatedTxn.missingFields).toContain("Program Name");
  });

  // Test B: Arbitrary field order across multiple messages
  test("Test B: Arbitrary field order - accumulates facts without comma-separated parsing", () => {
    let txn = createNewTransaction();

    // Message 1: Only Vendor
    txn = mergeRequestEntities(
      txn,
      { vendorName: "Vendor Alpha" },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED }
    );
    expect(txn.vendor.name).toBe("Vendor Alpha");
    expect(txn.invoice.number).toBeNull();

    // Message 2: Amount and Date
    txn = mergeRequestEntities(
      txn,
      { invoiceAmount: 180000, invoiceDate: "15/11/2026" },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED }
    );
    expect(txn.invoice.amount).toBe(180000);
    expect(txn.invoice.date).toBe("15/11/2026");
    expect(txn.vendor.name).toBe("Vendor Alpha"); // Retained

    // Message 3: Invoice Number and Program
    txn = mergeRequestEntities(
      txn,
      { invoiceNumber: "INV-8821", programName: "EarlyPay Plus" },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED }
    );
    expect(txn.invoice.number).toBe("INV-8821");
    expect(txn.program.name).toBe("EarlyPay Plus");

    // Message 4: Discount
    txn = mergeRequestEntities(
      txn,
      { discountAmount: 2000 },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED }
    );
    expect(txn.invoice.discountAmount).toBe(2000);

    const validation = validateTransactionData(txn);
    expect(validation.valid).toBe(true);
    expect(validation.missingFields).toHaveLength(0);
  });

  // Test C: Missing discount
  test("Test C: Missing discount - request remains incomplete without silent fallback to 0", () => {
    const txn = createNewTransaction({
      vendorName: "Vendor X",
      programName: "Prog 1",
      invoiceNumber: "INV-550",
      invoiceDate: "10/10/2026",
      invoiceAmount: 75000,
      // discountAmount is missing
    });

    const validation = validateTransactionData(txn);
    expect(validation.valid).toBe(false);
    expect(validation.missingFields).toContain("Discount Amount");
    expect(txn.invoice.discountAmount).toBeNull();
  });

  // Test D: Explicit zero discount
  test("Test D: Explicit zero discount - preserved as valid and not treated as missing", () => {
    const txn = createNewTransaction({
      vendorName: "Vendor X",
      programName: "Prog 1",
      invoiceNumber: "INV-550",
      invoiceDate: "10/10/2026",
      invoiceAmount: 75000,
      discountAmount: 0, // Explicit zero
    });

    const validation = validateTransactionData(txn);
    expect(validation.valid).toBe(true);
    expect(validation.missingFields).toHaveLength(0);
    expect(txn.invoice.discountAmount).toBe(0);
  });

  // Test E: Unknown vendor
  test("Test E: Unknown vendor - reports not found and prevents work item creation", async () => {
    const res = await resolveVendor({ vendorName: "" });
    expect(res.found).toBe(false);
    expect(res.success).toBe(false);

    const unverifiedTxn = createNewTransaction({
      vendorName: "",
      invoiceNumber: "INV-100",
      invoiceDate: "10/10/2026",
      invoiceAmount: 10000,
      discountAmount: 0,
    });

    await expect(
      createLoanWorkItemTool({ transaction: unverifiedTxn })
    ).rejects.toThrow(/missing fields/);
  });

  // Test F: Program lookup failure
  test("Test F: Program lookup failure - real error reported without dummy program substitution", async () => {
    scfApi.fetchProgramDetails.mockRejectedValueOnce(
      new Error("SCF Program Service 503 Unavailable")
    );

    const res = await getVendorPrograms({ vendorName: "Vendor Zeta" });
    expect(res.success).toBe(false);
    expect(res.programs).toHaveLength(0);
    expect(res.error).toContain("503 Unavailable");
  });

  // Test G: Document extraction validation
  test("Test G: Multi-invoice extraction data structures retain individual integrity", () => {
    const extractedInvoices = [
      {
        invoiceNumber: "INV-A",
        invoiceAmount: 10000,
        invoiceDate: "01/01/2026",
        discountAmount: 500,
      },
      {
        invoiceNumber: "INV-B",
        invoiceAmount: 20000,
        invoiceDate: "02/01/2026",
        discountAmount: 1000,
      },
    ];

    const txn1 = createNewTransaction(extractedInvoices[0]);
    const txn2 = createNewTransaction(extractedInvoices[1]);

    expect(txn1.id).not.toBe(txn2.id);
    expect(txn1.invoice.number).toBe("INV-A");
    expect(txn2.invoice.number).toBe("INV-B");
    expect(txn1.invoice.amount).toBe(10000);
    expect(txn2.invoice.amount).toBe(20000);
  });

  // Test H: Concurrent requests isolation
  test("Test H: Concurrent requests - completely independent state, OTP, and booking", async () => {
    let txnA = createNewTransaction({
      vendorName: "Vendor A",
      programName: "Prog A",
      invoiceNumber: "INV-A-1",
      invoiceDate: "10/10/2026",
      invoiceAmount: 50000,
      discountAmount: 500,
    });

    let txnB = createNewTransaction({
      vendorName: "Vendor B",
      programName: "Prog B",
      invoiceNumber: "INV-B-1",
      invoiceDate: "12/10/2026",
      invoiceAmount: 90000,
      discountAmount: 1000,
    });

    // Advance txnA to OTP_PENDING
    txnA.workItem = { wiName: "WI-A-100", folderIndex: "FL-A-1" };
    txnA = transitionTransaction(txnA, TRANSACTION_STATES.READY_FOR_REVIEW);
    txnA = transitionTransaction(txnA, TRANSACTION_STATES.AWAITING_CONFIRMATION);
    txnA = transitionTransaction(txnA, TRANSACTION_STATES.CREATING_WORK_ITEM);
    txnA = transitionTransaction(txnA, TRANSACTION_STATES.OTP_PENDING);

    // Verify OTP for TxnA only
    txnA.otp.status = "verified";

    // Attempting to book txnB while only txnA is verified must fail
    await expect(bookLoanTool({ transaction: txnB })).rejects.toThrow(
      /Cannot book loan: missing work item/
    );

    // Cancelling txnB does not mutate txnA
    txnB = transitionTransaction(txnB, TRANSACTION_STATES.CANCELLED);
    expect(txnB.status).toBe(TRANSACTION_STATES.CANCELLED);
    expect(txnA.status).toBe(TRANSACTION_STATES.OTP_PENDING);
    expect(txnA.otp.status).toBe("verified");
  });

  // Test I: Corrections isolation
  test("Test I: Corrections - updates only target transaction and triggers revalidation", () => {
    let txnA = createNewTransaction({
      vendorName: "Vendor A",
      invoiceNumber: "INV-101",
      invoiceAmount: 50000,
      invoiceDate: "10/10/2026",
      discountAmount: 500,
      programName: "Prog 1",
    });

    const txnB = createNewTransaction({
      vendorName: "Vendor B",
      invoiceNumber: "INV-202",
      invoiceAmount: 100000,
    });

    // Correct amount on TxnA
    txnA = mergeRequestEntities(
      txnA,
      { invoiceAmount: 65000 },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED, isExplicitCorrection: true }
    );

    expect(txnA.invoice.amount).toBe(65000);
    expect(txnB.invoice.amount).toBe(100000); // TxnB untouched
    expect(txnA.auditLog.some((log) => log.event === "ENTITY_CORRECTION")).toBe(true);
  });

  // Test J: Full booking workflow with failure handling
  test("Test J: Booking workflow state progression and API failure recovery", async () => {
    let txn = createNewTransaction({
      vendorName: "Vendor Tech",
      programName: "Prog Fast",
      invoiceNumber: "INV-SEC-1",
      invoiceDate: "10/10/2026",
      invoiceAmount: 100000,
      discountAmount: 2000,
    });

    // 1. Validation check
    const valResult = await validateLoanRequestTool({ transaction: txn });
    expect(valResult.valid).toBe(true);

    // 2. Advance to confirmation
    txn = transitionTransaction(txn, TRANSACTION_STATES.READY_FOR_REVIEW);
    txn = transitionTransaction(txn, TRANSACTION_STATES.AWAITING_CONFIRMATION);

    // 3. Work item creation fails
    scfApi.createWorkItem.mockRejectedValueOnce(new Error("API Gateway 500"));
    const failRes = await createLoanWorkItemTool({ transaction: txn });
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain("API Gateway 500");

    // 4. Work item creation succeeds on retry
    scfApi.createWorkItem.mockResolvedValueOnce({
      wiName: "WI-REAL-555",
      folderIndex: "FL-999",
    });
    const wiRes = await createLoanWorkItemTool({ transaction: txn });
    expect(wiRes.success).toBe(true);
    txn = wiRes.transaction;
    expect(txn.status).toBe(TRANSACTION_STATES.OTP_PENDING);

    // 5. OTP verification fails with bad code
    const otpFail = await verifyLoanOtpTool({ transaction: txn, otpCode: "000" });
    expect(otpFail.success).toBe(false);

    // 6. OTP verification succeeds
    const otpSuccess = await verifyLoanOtpTool({ transaction: txn, otpCode: "123456" });
    expect(otpSuccess.success).toBe(true);
    txn = otpSuccess.transaction;

    // 7. Booking succeeds
    scfApi.bookLoan.mockResolvedValueOnce({ status: "true", loanId: "LOAN-SUCCESS-1" });
    const bookRes = await bookLoanTool({ transaction: txn });
    expect(bookRes.success).toBe(true);
    expect(bookRes.transaction.status).toBe(TRANSACTION_STATES.COMPLETED);
    expect(bookRes.bookingResult.loanId).toBe("LOAN-SUCCESS-1");
  });

  // Test K: Security & Regression testing (Sensitive data redaction)
  test("Test K: Logger redaction protects OTPs, tokens, and credentials", () => {
    const sensitivePayload = {
      user: "officer1",
      token: "Bearer secret-token-xyz",
      apiKey: "AIzaSySecretApiKey",
      otp: "998877",
      transaction: {
        id: "REQ-1234",
        otpCode: "123456",
      },
    };

    const redacted = maskSensitiveData(sensitivePayload);
    expect(redacted.token).toBe("[REDACTED_SECRET]");
    expect(redacted.apiKey).toBe("[REDACTED_SECRET]");
    expect(redacted.otp).toBe("[REDACTED_SECRET]");
    expect(redacted.transaction.otpCode).toBe("[REDACTED_SECRET]");
    expect(redacted.transaction.id).toBe("REQ-1234");
  });
});

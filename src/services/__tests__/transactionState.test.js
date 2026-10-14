import {
  TRANSACTION_STATES,
  FIELD_PROVENANCE,
  generateTransactionId,
  createNewTransaction,
  transitionTransaction,
  validateTransactionData,
  mergeRequestEntities,
} from "../transactionState";

describe("Phase 2: Deterministic Transaction State Management", () => {
  test("generates unique collision-resistant IDs", () => {
    const id1 = generateTransactionId("REQ");
    const id2 = generateTransactionId("REQ");
    expect(id1).toMatch(/^REQ-/);
    expect(id2).toMatch(/^REQ-/);
    expect(id1).not.toBe(id2);
  });

  test("initializes new transaction with zero hardcoded defaults", () => {
    const txn = createNewTransaction();
    expect(txn.status).toBe(TRANSACTION_STATES.COLLECTING_DETAILS);
    expect(txn.vendor.name).toBeNull();
    expect(txn.vendor.code).toBeNull();
    expect(txn.program.name).toBeNull();
    expect(txn.invoice.number).toBeNull();
    expect(txn.invoice.amount).toBeNull();
    expect(txn.invoice.discountAmount).toBeNull();
    expect(txn.workItem).toBeNull();
  });

  test("zero-assumption validation: missing discount is reported as missing", () => {
    const txn = createNewTransaction({
      vendorName: "Acme Logistics",
      programName: "ProgA",
      invoiceNumber: "INV-101",
      invoiceDate: "15/10/2026",
      invoiceAmount: 100000,
      // discountAmount omitted
    });

    const result = validateTransactionData(txn);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain("Discount Amount");
  });

  test("zero-assumption validation: explicit 0 discount is valid", () => {
    const txn = createNewTransaction({
      vendorName: "Acme Logistics",
      programName: "ProgA",
      invoiceNumber: "INV-101",
      invoiceDate: "15/10/2026",
      invoiceAmount: 100000,
      discountAmount: 0, // Explicit zero
    });

    const result = validateTransactionData(txn);
    expect(result.valid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
    expect(result.validationErrors).toHaveLength(0);
  });

  test("validation errors: invalid date, negative amount, and excessive discount", () => {
    const txn = createNewTransaction({
      vendorName: "Acme Logistics",
      programName: "ProgA",
      invoiceNumber: "INV-101",
      invoiceDate: "invalid-date",
      invoiceAmount: -500,
      discountAmount: 1000,
    });

    const result = validateTransactionData(txn);
    expect(result.valid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(
      result.validationErrors.some((e) => e.includes("DD/MM/YYYY") || e.includes("YYYY-MM-DD"))
    ).toBe(true);
    expect(
      result.validationErrors.some((e) => e.includes("positive number"))
    ).toBe(true);
  });

  test("mergeRequestEntities merges facts and computes missing fields", () => {
    const txn = createNewTransaction();
    const updated = mergeRequestEntities(
      txn,
      {
        vendorName: "Global Suppliers",
        invoiceNumber: "INV-999",
        invoiceDate: "20/11/2026",
        invoiceAmount: "250000",
        discountAmount: "5000",
      },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED }
    );

    expect(updated.vendor.name).toBe("Global Suppliers");
    expect(updated.invoice.number).toBe("INV-999");
    expect(updated.invoice.amount).toBe(250000);
    expect(updated.invoice.discountAmount).toBe(5000);
    // Program Name is still missing
    expect(updated.missingFields).toContain("Program Name");
    expect(updated.status).toBe(TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION);
  });

  test("mergeRequestEntities does not overwrite backend_verified values without explicit correction", () => {
    const txn = createNewTransaction();
    txn.vendor.name = "Verified Vendor Inc.";
    txn.vendor.provenance = FIELD_PROVENANCE.BACKEND_VERIFIED;

    const attemptedOverwrite = mergeRequestEntities(
      txn,
      { vendorName: "Guessed Vendor" },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED, isExplicitCorrection: false }
    );

    expect(attemptedOverwrite.vendor.name).toBe("Verified Vendor Inc.");
  });

  test("transitionTransaction enforces legal workflow transitions", () => {
    const txn = createNewTransaction();
    expect(() => {
      // Cannot jump directly from collecting_details to booking
      transitionTransaction(txn, TRANSACTION_STATES.BOOKING);
    }).toThrow(/Illegal transaction state transition/);

    const readyTxn = transitionTransaction(txn, TRANSACTION_STATES.READY_FOR_REVIEW);
    expect(readyTxn.status).toBe(TRANSACTION_STATES.READY_FOR_REVIEW);
  });

  test("isolation of concurrent transactions: updating one does not mutate another", () => {
    const txnA = createNewTransaction({ vendorName: "Vendor A" });
    const txnB = createNewTransaction({ vendorName: "Vendor B" });

    const updatedA = mergeRequestEntities(txnA, {
      invoiceNumber: "INV-A-1",
      invoiceAmount: 50000,
    });

    expect(updatedA.invoice.number).toBe("INV-A-1");
    expect(txnB.invoice.number).toBeNull();
    expect(txnB.vendor.name).toBe("Vendor B");
  });

  test("mergeRequestEntities transitions awaiting_program_selection to ready_for_review when program is provided", () => {
    const txn = createNewTransaction({
      vendorName: "Vendor 1",
      invoiceNumber: "INV-100",
      invoiceDate: "10/10/2026",
      invoiceAmount: 50000,
      discountAmount: 1000,
    });
    txn.status = TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION;

    const updated = mergeRequestEntities(
      txn,
      { programName: "deeptest1" },
      { provenance: FIELD_PROVENANCE.USER_PROVIDED }
    );

    expect(updated.program.name).toBe("deeptest1");
    expect(updated.status).toBe(TRANSACTION_STATES.READY_FOR_REVIEW);
    expect(updated.missingFields).toHaveLength(0);
  });
});

/**
 * Transaction State Manager for Nexus AI (Supply Chain Finance)
 * Provides deterministic state management, field provenance tracking,
 * zero-assumption financial validation, and multi-transaction isolation.
 */

export const TRANSACTION_STATES = {
  COLLECTING_DETAILS: "collecting_details",
  AWAITING_PROGRAM_SELECTION: "awaiting_program_selection",
  AWAITING_USER_CORRECTION: "awaiting_user_correction",
  READY_FOR_REVIEW: "ready_for_review",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
  CREATING_WORK_ITEM: "creating_work_item",
  OTP_PENDING: "otp_pending",
  OTP_VERIFYING: "otp_verifying",
  BOOKING: "booking",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

export const FIELD_PROVENANCE = {
  USER_PROVIDED: "user_provided",
  DOCUMENT_EXTRACTED: "document_extracted",
  BACKEND_VERIFIED: "backend_verified",
  USER_CONFIRMED: "user_confirmed",
};

// Allowed state transitions to prevent invalid workflows
const VALID_TRANSITIONS = {
  [TRANSACTION_STATES.COLLECTING_DETAILS]: [
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION,
    TRANSACTION_STATES.AWAITING_USER_CORRECTION,
    TRANSACTION_STATES.READY_FOR_REVIEW,
    TRANSACTION_STATES.AWAITING_CONFIRMATION,
    TRANSACTION_STATES.CREATING_WORK_ITEM,
    TRANSACTION_STATES.CANCELLED,
    TRANSACTION_STATES.FAILED,
  ],
  [TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION]: [
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.READY_FOR_REVIEW,
    TRANSACTION_STATES.AWAITING_CONFIRMATION,
    TRANSACTION_STATES.CREATING_WORK_ITEM,
    TRANSACTION_STATES.AWAITING_USER_CORRECTION,
    TRANSACTION_STATES.CANCELLED,
    TRANSACTION_STATES.FAILED,
  ],
  [TRANSACTION_STATES.AWAITING_USER_CORRECTION]: [
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION,
    TRANSACTION_STATES.READY_FOR_REVIEW,
    TRANSACTION_STATES.CANCELLED,
    TRANSACTION_STATES.FAILED,
  ],
  [TRANSACTION_STATES.READY_FOR_REVIEW]: [
    TRANSACTION_STATES.AWAITING_CONFIRMATION,
    TRANSACTION_STATES.CREATING_WORK_ITEM,
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.CANCELLED,
    TRANSACTION_STATES.FAILED,
  ],
  [TRANSACTION_STATES.AWAITING_CONFIRMATION]: [
    TRANSACTION_STATES.CREATING_WORK_ITEM,
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.AWAITING_USER_CORRECTION,
    TRANSACTION_STATES.CANCELLED,
  ],
  [TRANSACTION_STATES.CREATING_WORK_ITEM]: [
    TRANSACTION_STATES.OTP_PENDING,
    TRANSACTION_STATES.FAILED,
    TRANSACTION_STATES.AWAITING_CONFIRMATION, // allow retry on failure
  ],
  [TRANSACTION_STATES.OTP_PENDING]: [
    TRANSACTION_STATES.OTP_VERIFYING,
    TRANSACTION_STATES.BOOKING,
    TRANSACTION_STATES.CANCELLED,
    TRANSACTION_STATES.FAILED,
  ],
  [TRANSACTION_STATES.OTP_VERIFYING]: [
    TRANSACTION_STATES.BOOKING,
    TRANSACTION_STATES.OTP_PENDING, // on invalid OTP, return to pending
    TRANSACTION_STATES.FAILED,
  ],
  [TRANSACTION_STATES.BOOKING]: [TRANSACTION_STATES.COMPLETED, TRANSACTION_STATES.FAILED],
  [TRANSACTION_STATES.COMPLETED]: [],
  [TRANSACTION_STATES.FAILED]: [
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.AWAITING_CONFIRMATION,
    TRANSACTION_STATES.OTP_PENDING,
  ],
  [TRANSACTION_STATES.CANCELLED]: [],
};

/**
 * Generate a unique collision-resistant transaction ID.
 * Does not use timestamps alone.
 */
export function generateTransactionId(prefix = "TXN") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const randomPart = Math.random().toString(36).substring(2, 11);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`;
}

/**
 * Initialize a new, empty, isolated transaction record.
 */
export function createNewTransaction(overrides = {}) {
  const requestId = overrides.requestId || overrides.id || generateTransactionId("REQ");
  return {
    id: requestId,
    requestId,
    batchId: overrides.batchId || null,
    status: TRANSACTION_STATES.COLLECTING_DETAILS,
    vendor: {
      name: overrides.vendorName || null,
      code: overrides.vendorCode || null,
      accountNumber: overrides.accountNumber || null,
      email: overrides.email || null,
      provenance: overrides.vendorName ? FIELD_PROVENANCE.USER_PROVIDED : null,
    },
    program: {
      id: overrides.programId || null,
      name: overrides.programName || null,
      availablePrograms: [],
      provenance: overrides.programId ? FIELD_PROVENANCE.USER_PROVIDED : null,
    },
    anchor: {
      code: overrides.anchorCode || null,
      name: overrides.anchorName || null,
      provenance: null,
    },
    invoice: {
      number: overrides.invoiceNumber || null,
      date: overrides.invoiceDate || null,
      amount: overrides.invoiceAmount !== undefined ? overrides.invoiceAmount : null,
      discountAmount: overrides.discountAmount !== undefined ? overrides.discountAmount : null,
      currency: overrides.currency || "INR",
      provenance: {},
    },
    provenance: {},
    history: [],
    auditLog: [],
    workItem: null, // { wiName, folderIndex }
    otp: {
      status: "not_started", // 'not_started' | 'sent' | 'verified' | 'failed'
      attempts: 0,
      lastAttemptAt: null,
    },
    bookingResult: null,
    validationErrors: [],
    missingFields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check whether a state transition is legal.
 */
export function canTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
}

/**
 * Transition transaction to a new state with strict validation.
 */
export function transitionTransaction(transaction, nextStatus, metadata = {}) {
  if (!canTransition(transaction.status, nextStatus)) {
    throw new Error(
      `Illegal transaction state transition from '${transaction.status}' to '${nextStatus}' for request ${transaction.requestId}`
    );
  }

  const updated = {
    ...transaction,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    history: [
      ...transaction.history,
      {
        from: transaction.status,
        to: nextStatus,
        timestamp: new Date().toISOString(),
        metadata,
      },
    ],
  };

  return updated;
}

/**
 * Deterministic Financial & Business Validation Engine.
 * Never allows Gemini to declare a request valid on its own.
 * Zero-assumption: explicit checks for null, undefined, NaN, and positive numbers.
 */
export function validateTransactionData(transaction) {
  const missingFields = [];
  const validationErrors = [];
  const inv = transaction.invoice || {};
  const vendor = transaction.vendor || {};
  const program = transaction.program || {};

  // 1. Vendor Name
  if (!vendor.name || typeof vendor.name !== "string" || !vendor.name.trim()) {
    missingFields.push("Vendor Name");
  }

  // 2. Program Name / ID
  const prog = program.id || program.name;
  if (!prog || typeof prog !== "string" || !prog.trim()) {
    missingFields.push("Program Name");
  }

  // 3. Invoice Number
  if (!inv.number || typeof inv.number !== "string" || !inv.number.trim()) {
    missingFields.push("Invoice Number");
  }

  // 4. Invoice Date
  if (!inv.date || typeof inv.date !== "string" || !inv.date.trim()) {
    missingFields.push("Invoice Date");
  } else {
    // Validate DD/MM/YYYY or YYYY-MM-DD
    const dateStr = inv.date.trim();
    const ddmmyyyy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
    const yyyymmdd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/;
    if (!ddmmyyyy.test(dateStr) && !yyyymmdd.test(dateStr)) {
      validationErrors.push("Invoice Date must be in DD/MM/YYYY or YYYY-MM-DD format.");
    }
  }

  // 5. Invoice Amount (must be explicit positive number, not 0, not null/undefined)
  if (inv.amount === null || inv.amount === undefined || inv.amount === "") {
    missingFields.push("Invoice Amount");
  } else {
    const numAmt = Number(inv.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      validationErrors.push("Invoice Amount must be a positive number.");
    }
  }

  // 6. Discount Amount
  // ZERO-ASSUMPTION RULE: 0 is valid IF explicitly provided. Missing/null/undefined is NOT valid.
  if (
    inv.discountAmount === null ||
    inv.discountAmount === undefined ||
    inv.discountAmount === ""
  ) {
    missingFields.push("Discount Amount");
  } else {
    const numDisc = Number(inv.discountAmount);
    if (isNaN(numDisc) || numDisc < 0) {
      validationErrors.push("Discount Amount must be zero or a positive number.");
    } else if (inv.amount !== null && !isNaN(Number(inv.amount)) && numDisc >= Number(inv.amount)) {
      validationErrors.push(
        "Discount Amount cannot be greater than or equal to the Invoice Amount."
      );
    }
  }

  const isValid = missingFields.length === 0 && validationErrors.length === 0;

  return {
    valid: isValid,
    missingFields,
    validationErrors,
  };
}

/**
 * Merge extracted facts into an existing transaction.
 * - Does not overwrite backend_verified values with unverified model values.
 * - Records provenance for every modified field.
 * - Recomputes missingFields & validationErrors deterministically.
 */
export function mergeRequestEntities(existingRequest, extractedEntities = {}, sourceMetadata = {}) {
  const provenanceType = sourceMetadata.provenance || FIELD_PROVENANCE.USER_PROVIDED;
  const updated = {
    ...existingRequest,
    vendor: { ...existingRequest.vendor },
    program: { ...existingRequest.program },
    anchor: { ...existingRequest.anchor },
    invoice: { ...existingRequest.invoice, provenance: { ...existingRequest.invoice.provenance } },
    updatedAt: new Date().toISOString(),
  };

  // Vendor merge
  if (extractedEntities.vendorName !== undefined && extractedEntities.vendorName !== null) {
    // Only overwrite if not backend_verified, or if explicit user correction
    if (
      updated.vendor.provenance !== FIELD_PROVENANCE.BACKEND_VERIFIED ||
      sourceMetadata.isExplicitCorrection
    ) {
      updated.vendor.name = String(extractedEntities.vendorName).trim();
      updated.vendor.provenance = provenanceType;
    }
  }

  // Program merge
  if (extractedEntities.programName !== undefined && extractedEntities.programName !== null) {
    if (
      updated.program.provenance !== FIELD_PROVENANCE.BACKEND_VERIFIED ||
      sourceMetadata.isExplicitCorrection
    ) {
      const progStr = String(extractedEntities.programName).trim();
      updated.program.name = progStr;
      updated.program.id = progStr;
      updated.program.provenance = provenanceType;
    }
  }

  // Invoice Number
  if (extractedEntities.invoiceNumber !== undefined && extractedEntities.invoiceNumber !== null) {
    updated.invoice.number = String(extractedEntities.invoiceNumber).trim();
    updated.invoice.provenance.number = provenanceType;
  }

  // Invoice Date
  if (extractedEntities.invoiceDate !== undefined && extractedEntities.invoiceDate !== null) {
    updated.invoice.date = String(extractedEntities.invoiceDate).trim();
    updated.invoice.provenance.date = provenanceType;
  }

  // Invoice Amount
  if (extractedEntities.invoiceAmount !== undefined && extractedEntities.invoiceAmount !== null) {
    const rawAmt = extractedEntities.invoiceAmount;
    if (typeof rawAmt === "number") {
      updated.invoice.amount = rawAmt;
    } else {
      const cleaned = String(rawAmt).replace(/[^0-9.-]+/g, "");
      const parsed = parseFloat(cleaned);
      updated.invoice.amount = isNaN(parsed) ? null : parsed;
    }
    updated.invoice.provenance.amount = provenanceType;
  }

  // Discount Amount - explicitly preserve 0 as distinct from missing!
  if (extractedEntities.discountAmount !== undefined && extractedEntities.discountAmount !== null) {
    const rawDisc = extractedEntities.discountAmount;
    if (typeof rawDisc === "number") {
      updated.invoice.discountAmount = rawDisc;
    } else {
      const cleaned = String(rawDisc).replace(/[^0-9.-]+/g, "");
      const parsed = parseFloat(cleaned);
      updated.invoice.discountAmount = isNaN(parsed) ? null : parsed;
    }
    updated.invoice.provenance.discountAmount = provenanceType;
  }

  // Currency
  if (extractedEntities.currency) {
    updated.invoice.currency = String(extractedEntities.currency).toUpperCase();
  }

  // Run deterministic validation
  const validation = validateTransactionData(updated);
  updated.missingFields = validation.missingFields;
  updated.validationErrors = validation.validationErrors;

  // Determine appropriate status based on deterministic validation
  const DRAFT_STATES = [
    TRANSACTION_STATES.COLLECTING_DETAILS,
    TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION,
    TRANSACTION_STATES.AWAITING_USER_CORRECTION,
    TRANSACTION_STATES.READY_FOR_REVIEW,
    TRANSACTION_STATES.AWAITING_CONFIRMATION,
  ];

  if (DRAFT_STATES.includes(updated.status)) {
    if (validation.valid) {
      updated.status = TRANSACTION_STATES.READY_FOR_REVIEW;
    } else if (
      validation.missingFields.includes("Program Name") &&
      !validation.missingFields.includes("Vendor Name")
    ) {
      updated.status = TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION;
    } else if (validation.validationErrors.length > 0) {
      updated.status = TRANSACTION_STATES.AWAITING_USER_CORRECTION;
    } else {
      updated.status = TRANSACTION_STATES.COLLECTING_DETAILS;
    }
  }

  // Record audit entry
  const existingLogs = Array.isArray(existingRequest.auditLog) ? [...existingRequest.auditLog] : [];
  existingLogs.push({
    timestamp: new Date().toISOString(),
    event: sourceMetadata.isExplicitCorrection ? "ENTITY_CORRECTION" : "ENTITY_MERGE",
    entities: extractedEntities,
    provenance: provenanceType,
  });
  updated.auditLog = existingLogs;
  updated.history = existingLogs;

  return updated;
}

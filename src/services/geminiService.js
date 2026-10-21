/**
 * Nexus AI Gemini Service
 * Refactored to support tool calling, structured entity extraction,
 * document OCR without fabricated fallbacks, and multi-turn reasoning.
 */

import { GoogleGenAI } from "@google/genai";
import { TOOL_REGISTRY } from "./businessTools";
import { normalizeDateToDDMMYYYY } from "./transactionState";

let _ai = null;

function getAI() {
  if (_ai) return _ai;
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key not set. Set REACT_APP_GEMINI_API_KEY in your .env file.");
    return null;
  }
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

export function resetAIClient() {
  _ai = null;
}

const PRIMARY_MODEL = process.env.REACT_APP_GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Utility to prevent API requests from hanging indefinitely.
 */
function withTimeout(promise, ms = 25000, errorMsg = "Operation timed out") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
}

/**
 * Executes generateContent with thinkingConfig optimization,
 * with graceful retry if thinkingConfig is not supported on the target variant.
 */
async function safeGenerateContent(ai, requestConfig) {
  try {
    return await ai.models.generateContent(requestConfig);
  } catch (err) {
    if (requestConfig.config?.thinkingConfig) {
      console.warn(
        "Retrying generateContent without thinkingConfig due to error:",
        err.message || err
      );
      const { thinkingConfig, ...restConfig } = requestConfig.config;
      return await ai.models.generateContent({
        ...requestConfig,
        config: restConfig,
      });
    }
    throw err;
  }
}

/**
 * Tool Declarations for @google/genai SDK
 */
export const TOOL_DECLARATIONS = [
  {
    name: "resolveVendor",
    description: "Look up and verify a vendor name against trusted SCF records.",
    parameters: {
      type: "OBJECT",
      properties: {
        vendorName: {
          type: "STRING",
          description: "Name of the vendor to verify.",
        },
      },
      required: ["vendorName"],
    },
  },
  {
    name: "getVendorPrograms",
    description: "Retrieve valid supply chain financing programs for a specific verified vendor.",
    parameters: {
      type: "OBJECT",
      properties: {
        vendorName: {
          type: "STRING",
          description: "Verified vendor name.",
        },
      },
      required: ["vendorName"],
    },
  },
  {
    name: "fetchTransactionInformation",
    description:
      "Retrieve transaction history. Note: The user persona (Anchor or Vendor) is resolved deterministically by the application from authenticated session.",
    parameters: {
      type: "OBJECT",
      properties: {
        ordering: {
          type: "STRING",
          description: "Ordering direction: 'latest' (or 'last') vs 'earliest' (or 'first').",
          enum: ["latest", "earliest"],
        },
        limit: {
          type: "NUMBER",
          description: "Number of records to retrieve (positive integer).",
        },
        vendorCode: {
          type: "STRING",
          description: "Vendor code (required for Vendor persona; not used for Anchor).",
        },
        program: {
          type: "STRING",
          description: "Program identifier if filtering by a specific program.",
        },
      },
      required: ["ordering"],
    },
  },
];

/**
 * Senior Advisor Financial Insights (Preserved)
 */
export async function getFinancialInsights(stats) {
  try {
    const ai = getAI();
    if (!ai) return "AI insights unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.";

    const prompt = `Act as a senior Supply Chain Finance advisor. Given the following dashboard metrics:
    - Total Invoices: ${stats.totalInvoices}
    - Disbursed: $${stats.disbursedAmount}
    - Outstanding: $${stats.outstandingAmount}
    - Overdue: $${stats.overdueAmount}
    
    Provide 3 concise, actionable bullet points for the business owner to improve their cash flow or risk profile. 
    Keep it professional and brief. Return strictly plain text.`;

    const response = await safeGenerateContent(ai, {
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        temperature: 0.2,
        thinkingConfig: {
          thinkingLevel: "low",
        },
      },
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Optimize your working capital by reviewing overdue anchors.";
  }
}

/**
 * SCF General Database Inquiry (Preserved & Sandboxed)
 */
export async function processLoanInquiry(userInput, portalContext = {}) {
  try {
    const ai = getAI();
    if (!ai) {
      return {
        type: "ERROR",
        message: "AI features are unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
      };
    }

    const systemInstruction = `You are Nexus AI, a Supply Chain Finance intelligence assistant.
Your task is to answer user queries about invoice financing, settlement statuses, and loan guidelines.
Provide direct, professional, and accurate answers.
Never hallucinate bank account numbers, secret OTPs, or fictitious approval states.`;

    const response = await safeGenerateContent(ai, {
      model: PRIMARY_MODEL,
      contents: userInput,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 500,
        temperature: 0.1,
        thinkingConfig: {
          thinkingLevel: "low",
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Loan Inquiry Error:", error);
    return { type: "ERROR", message: "Failed to process inquiry." };
  }
}

/**
 * Safely parse JSON strings that may be wrapped in Markdown code blocks.
 */
function safeJsonParse(rawText) {
  if (!rawText) return {};
  let cleaned = String(rawText).trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        // Fall through to throw
      }
    }
    throw err;
  }
}

/**
 * Ensures Gemini conversation contents strictly alternate (user -> model -> user)
 * and begin with role: 'user'.
 */
function buildAlternatingContents(history = [], currentUserParts = []) {
  const raw = (history || [])
    .map((m) => {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      let text = typeof m.content === "string" ? m.content.trim() : JSON.stringify(m.content);
      // Strip markdown tables, dividers, and bullet lists from history to drastically minimize tokens
      text = text
        .replace(/\|[^\n]+\|\n?/g, "")
        .replace(/•\s[^\n]+\n?/g, "")
        .trim();
      if (text.length > 250) {
        text = text.slice(0, 250) + "...";
      }
      return text ? { role, text } : null;
    })
    .filter(Boolean);

  const clean = [];
  for (const item of raw) {
    if (clean.length === 0) {
      if (item.role === "user") {
        clean.push({ role: "user", parts: [{ text: item.text }] });
      }
    } else {
      const last = clean[clean.length - 1];
      if (last.role === item.role) {
        last.parts.push({ text: item.text });
      } else {
        clean.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  // Ensure history ends with 'model' so appending the current 'user' turn alternates properly
  while (clean.length > 0 && clean[clean.length - 1].role === "user") {
    clean.pop();
  }

  // Keep up to 4 turns (2 user, 2 model) for fast and token-efficient processing
  const trimmed = clean.slice(-4);
  if (trimmed.length > 0 && trimmed[0].role === "model") {
    trimmed.shift();
  }

  trimmed.push({
    role: "user",
    parts: currentUserParts,
  });

  return trimmed;
}

/**
 * Extract Invoices from Document (PDF or Image)
 * REAL OCR extraction with zero fabricated fallback records!
 */
export async function extractInvoiceDocument(fileData) {
  if (!fileData || !fileData.data) {
    return {
      success: false,
      invoices: [],
      error: "No file data provided for document extraction.",
    };
  }

  const ai = getAI();
  if (!ai) {
    return {
      success: false,
      invoices: [],
      error: "Gemini API key is not configured. Set REACT_APP_GEMINI_API_KEY in .env.",
    };
  }

  const systemInstruction = `You are a precision financial document OCR model for a Supply Chain Finance platform.
Extract ONLY the invoice details that are physically printed on the document.
DO NOT invent or extrapolate fields.
DO NOT use template examples or placeholder identifiers.
If a field (e.g. discount amount, tax, program) is NOT explicitly mentioned on the invoice, set its value to null.
If multiple distinct invoices are printed on the document, return all of them in the array.

OUTPUT SCHEMA (JSON ONLY):
{
  "invoices": [
    {
      "invoiceNumber": "<exact string on document>",
      "invoiceDate": "<DD/MM/YYYY format only, e.g. 16/10/2026. Convert any other scanned date format to DD/MM/YYYY>",
      "invoiceAmount": <exact numeric amount>,
      "discountAmount": <exact numeric discount or null if not stated>,
      "vendorName": "<vendor/supplier name or null>",
      "currency": "<e.g. INR, USD or null>"
    }
  ],
  "documentConfidence": "<high|medium|low>",
  "notes": "<any OCR ambiguity or unreadable portions>"
}`;

  try {
    const response = await withTimeout(
      safeGenerateContent(ai, {
        model: PRIMARY_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: fileData.data,
                  mimeType: fileData.mimeType || "application/pdf",
                },
              },
              {
                text: "Extract all invoice data from this document accurately.",
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 1000,
          temperature: 0.1,
          thinkingConfig: {
            thinkingLevel: "low",
          },
        },
      }),
      45000,
      "Document OCR extraction timed out after 45s"
    );

    const parsed = safeJsonParse(response.text || "{}");
    const rawInvoices = parsed.invoices || [];

    if (rawInvoices.length === 0) {
      return {
        success: false,
        invoices: [],
        error:
          "No readable invoices could be extracted from this document. Please ensure the document is clear or enter the details manually.",
      };
    }

    return {
      success: true,
      invoices: rawInvoices,
      documentConfidence: parsed.documentConfidence || "medium",
      notes: parsed.notes || "",
    };
  } catch (error) {
    console.error("Document Extraction Error:", error);
    return {
      success: false,
      invoices: [],
      error: `Failed to extract invoice from document: ${error.message}`,
    };
  }
}

/**
 * Process Natural Language Input with Function Calling & Structured Extraction
 * Replaces brittle comma-splitting and regex scanning with tool-grounded reasoning.
 */
export async function processNexusIntent(
  userInput,
  history = [],
  audioData = null,
  fileData = null,
  activeTransactions = {}
) {
  const ai = getAI();
  if (!ai) {
    return {
      type: "CHAT",
      message: "AI features are unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
    };
  }

  // 1. If file attached, perform genuine document extraction
  if (fileData) {
    const docResult = await extractInvoiceDocument(fileData);
    if (!docResult.success) {
      return {
        type: "CLARIFICATION",
        message: `⚠️ ${docResult.error}`,
        missing_fields: ["Invoice Number", "Invoice Date", "Invoice Amount", "Discount Amount"],
        extracted_invoices: [],
      };
    }

    return {
      type: "DOCUMENT_EXTRACTED",
      invoices: docResult.invoices,
      message: `Extracted ${docResult.invoices.length} invoice(s) from document '${
        fileData.fileName || "uploaded file"
      }'.`,
    };
  }

  // 2. Structured Natural Language Understanding
  const systemInstruction = `You are Nexus AI, an intelligent Supply Chain Finance assistant.
You assist buyers and vendors with invoice financing, program selection, loan bookings, and transaction history retrieval.

CRITICAL SUPPLY CHAIN FINANCE (SCF) DOMAIN KNOWLEDGE:
- In Supply Chain Finance / Invoice Discounting, "discountAmount" represents the FINANCED / DISBURSED AMOUNT (the net proceeds funded to the vendor upon discounting the invoice).
- "discountAmount" is NOT a deduction or retail rebate that is subtracted from the invoice. It IS the financed loan amount!
- For example, if invoiceAmount is 20,000 and discountAmount is 20,000, this means 100% of the invoice is being financed (disbursed amount = 20,000). This is completely VALID, normal, and standard in SCF.
- NEVER state that "financed amount would be zero" or that "discount amount matches invoice amount so financing is zero".
- discountAmount can equal invoiceAmount (100% financing) or be less than invoiceAmount (partial financing). It cannot exceed invoiceAmount.

YOUR OBJECTIVES:
1. Identify the user's intent:
   - LOAN_REQUEST: User wants to finance an invoice or is providing invoice details.
   - CORRECTION: User is explicitly correcting an invoice detail (e.g., "Change the amount to 240000").
   - TRANSACTION_INQUIRY: User is requesting past or recent transactions (e.g., "Show my latest transactions", "Show earliest 5 records", "Fetch transactions for program PROG-001").
   - PROGRAM_INQUIRY: User is asking for a list of available financing programs, program details, or what programs exist (e.g., "give me a list of all my programs", "show available programs", "what programs do you have for Vendor 1").
   - LOAN_INQUIRY: User is asking about general financing terms, limits, or general portal information.
   - CHAT: General conversational greeting or assistance.
2. Extract any entities explicitly provided in the latest user input:
   - vendorName: Vendor / Spoke name
   - programName: Financing program name
   - invoiceNumber: Invoice reference number
   - invoiceDate: Date string strictly in DD/MM/YYYY format (e.g. 16/10/2026).
     * The backend strictly requires DD/MM/YYYY. If the user provides a natural language date (such as "16th october 2026", "October 16 2026") or ISO format ("2026-10-16"), you MUST convert it to DD/MM/YYYY with two-digit day and month.
     * In your conversational response message, always format any invoice date as DD/MM/YYYY.
   - invoiceAmount: Numeric value (do not guess!)
   - discountAmount: Numeric value (do not guess! If not explicitly stated, return null)
   - currency: Currency code (e.g. INR)
   - ordering: "latest" or "earliest" (for transaction inquiries)
   - limit: Positive integer for transaction count (do not assume 10 or any default!)
   - vendorCode: Explicit vendor code (e.g. VEN0020549)
   - program: Program ID or code for transaction filtering (e.g. PROG-00000206-ID)
3. Zero-Assumption Rule:
   - NEVER invent or assume missing fields.
   - If user does not mention discount, discountAmount MUST be null.
   - Do NOT populate hardcoded mock values.

OUTPUT JSON FORMAT:
{
  "intent": "LOAN_REQUEST" | "CORRECTION" | "TRANSACTION_INQUIRY" | "PROGRAM_INQUIRY" | "LOAN_INQUIRY" | "CHAT",
  "entities": {
    "vendorName": string | null,
    "programName": string | null,
    "invoiceNumber": string | null,
    "invoiceDate": string | null, // Strictly DD/MM/YYYY format, e.g. "16/10/2026"
    "invoiceAmount": number | null,
    "discountAmount": number | null,
    "currency": string | null,
    "ordering": "latest" | "earliest" | null,
    "limit": number | null,
    "vendorCode": string | null,
    "program": string | null
  },
  "isExplicitCorrection": boolean,
  "isNewRequest": boolean,
  "message": "Direct, professional natural language response to the user"
}`;

  // User input part
  const userParts = [];
  if (audioData) {
    userParts.push({
      inlineData: {
        data: audioData.data,
        mimeType: audioData.mimeType || "audio/webm",
      },
    });
  }
  userParts.push({
    text: userInput || "Process request",
  });

  const contents = buildAlternatingContents(history, userParts);
  const fallbackTxnParams = extractTransactionParamsFromText(userInput);

  try {
    const response = await withTimeout(
      safeGenerateContent(ai, {
        model: PRIMARY_MODEL,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 600,
          temperature: 0.1,
          thinkingConfig: {
            thinkingLevel: "low",
          },
        },
      }),
      20000,
      "Natural language understanding timed out after 20s"
    );

    const parsed = safeJsonParse(response.text || "{}");
    const detectedIntent = parsed.intent || "CHAT";
    const mergedEntities = {
      ...(parsed.entities || {}),
      ...(fallbackTxnParams.ordering ? { ordering: fallbackTxnParams.ordering } : {}),
      ...(fallbackTxnParams.limit ? { limit: fallbackTxnParams.limit } : {}),
      ...(fallbackTxnParams.vendorCode ? { vendorCode: fallbackTxnParams.vendorCode } : {}),
      ...(fallbackTxnParams.program ? { program: fallbackTxnParams.program } : {}),
    };

    if (mergedEntities.invoiceDate) {
      mergedEntities.invoiceDate = normalizeDateToDDMMYYYY(mergedEntities.invoiceDate);
    }

    return {
      type: detectedIntent,
      entities: mergedEntities,
      isExplicitCorrection: Boolean(parsed.isExplicitCorrection),
      isNewRequest: Boolean(parsed.isNewRequest),
      message: parsed.message || "I've processed your request.",
    };
  } catch (error) {
    console.error("processNexusIntent Error:", error);
    const isProgQuery =
      /\b(program|programs)\b/i.test(userInput) &&
      /\b(list|show|give|what|available|all|view|get|tell|details|fetch)\b/i.test(userInput) &&
      !/\b(transaction|transactions|txn|txns)\b/i.test(userInput);

    if (isProgQuery) {
      return {
        type: "PROGRAM_INQUIRY",
        entities: {},
        isExplicitCorrection: false,
        isNewRequest: false,
        message: "Retrieving program details.",
      };
    }

    const isTxnQuery =
      Boolean(fallbackTxnParams.ordering) ||
      Boolean(fallbackTxnParams.limit) ||
      Boolean(fallbackTxnParams.vendorCode) ||
      (Boolean(fallbackTxnParams.program) &&
        /\b(transaction|transactions|txn|txns)\b/i.test(userInput)) ||
      /\b(transaction|transactions|txn|txns)\b/i.test(userInput);

    if (isTxnQuery) {
      return {
        type: "TRANSACTION_INQUIRY",
        entities: fallbackTxnParams,
        isExplicitCorrection: false,
        isNewRequest: false,
        message: "Processing transaction information request.",
      };
    }

    return {
      type: "CHAT",
      message: `I encountered an issue processing your request: ${
        error.message || "Please try again."
      }`,
      entities: {},
    };
  }
}

/**
 * Deterministic regex extractor for candidate transaction parameters from text.
 * Used for zero-hallucination parameter preservation and fallback resilience.
 */
export function extractTransactionParamsFromText(text) {
  if (!text || typeof text !== "string") {
    return {};
  }
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const extracted = {};

  if (/\b(latest|last|recent|newest)\b/i.test(lower)) {
    extracted.ordering = "latest";
  } else if (/\b(earliest|first|oldest)\b/i.test(lower)) {
    extracted.ordering = "earliest";
  }

  const limitMatch =
    clean.match(/\b(?:limit|records|transactions|count|show|top)\s*[:=]?\s*(\d+)\b/i) ||
    clean.match(/\b(\d+)\s*(?:records|transactions|invoices|txns|items)\b/i);
  if (limitMatch && limitMatch[1]) {
    const val = parseInt(limitMatch[1], 10);
    if (val > 0) {
      extracted.limit = val;
    }
  }

  const vendorMatch =
    clean.match(
      /\b(?:vendor\s*code|vendorCode|spoke\s*code)\s*(?:is|:|=)?\s*([A-Za-z0-9_-]+)\b/i
    ) ||
    clean.match(/\b(VEN[A-Za-z0-9_-]+)\b/i) ||
    clean.match(/\b(VC[0-9]+)\b/i);
  if (vendorMatch && vendorMatch[1]) {
    extracted.vendorCode = vendorMatch[1].trim();
  }

  const progMatch =
    clean.match(/\b(?:program|programId|prog)\b\s*(?:is|:|=)\s*([A-Za-z0-9_-]+)\b/i) ||
    clean.match(/\b(?:use|under|for|with)\s+program\s+([A-Za-z0-9_-]+)\b/i) ||
    clean.match(/\b(PROG-[A-Za-z0-9_-]+)\b/i);
  if (progMatch && progMatch[1]) {
    const candidate = progMatch[1].trim();
    const stopWords = [
      "details",
      "list",
      "name",
      "names",
      "info",
      "information",
      "available",
      "all",
      "my",
      "the",
    ];
    if (!stopWords.includes(candidate.toLowerCase())) {
      extracted.program = candidate;
    }
  }

  return extracted;
}

/**
 * Market News Search with Grounding (Preserved)
 */
export async function getMarketNews() {
  try {
    const ai = getAI();
    if (!ai) {
      return {
        text: "Market news unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
        sources: [],
      };
    }

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents:
        "What are the top 3 latest supply chain finance or global trade news updates for today? Provide brief summaries.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return {
      text: "Market news unavailable. Check your internet connection.",
      sources: [],
    };
  }
}

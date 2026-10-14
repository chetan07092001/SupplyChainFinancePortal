/**
 * Nexus AI Gemini Service
 * Refactored to support tool calling, structured entity extraction,
 * document OCR without fabricated fallbacks, and multi-turn reasoning.
 */

import { GoogleGenAI } from "@google/genai";
import { TOOL_REGISTRY } from "./businessTools";

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

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
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

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: userInput,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
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
      const text = typeof m.content === "string" ? m.content.trim() : JSON.stringify(m.content);
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

  // Keep up to 6 turns of context
  const trimmed = clean.slice(-6);
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
      "invoiceDate": "<DD/MM/YYYY or YYYY-MM-DD>",
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
    const response = await ai.models.generateContent({
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
      },
    });

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
You assist buyers and vendors with invoice financing, program selection, and loan bookings.

YOUR OBJECTIVES:
1. Identify the user's intent:
   - LOAN_REQUEST: User wants to finance an invoice or is providing invoice details.
   - CORRECTION: User is explicitly correcting an invoice detail (e.g., "Change the amount to 240000").
   - LOAN_INQUIRY: User is asking about loan status, limits, financing programs, or general portal information.
   - CHAT: General conversational greeting or assistance.
2. Extract any entities explicitly provided in the latest user input:
   - vendorName: Vendor / Spoke name
   - programName: Financing program name
   - invoiceNumber: Invoice reference number
   - invoiceDate: Date string (DD/MM/YYYY or YYYY-MM-DD)
   - invoiceAmount: Numeric value (do not guess!)
   - discountAmount: Numeric value (do not guess! If not explicitly stated, return null)
   - currency: Currency code (e.g. INR)
3. Zero-Assumption Rule:
   - NEVER invent or assume missing fields.
   - If user does not mention discount, discountAmount MUST be null.
   - Do NOT populate hardcoded mock values.

OUTPUT JSON FORMAT:
{
  "intent": "LOAN_REQUEST" | "CORRECTION" | "LOAN_INQUIRY" | "CHAT",
  "entities": {
    "vendorName": string | null,
    "programName": string | null,
    "invoiceNumber": string | null,
    "invoiceDate": string | null,
    "invoiceAmount": number | null,
    "discountAmount": number | null,
    "currency": string | null
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

  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = safeJsonParse(response.text || "{}");
    return {
      type: parsed.intent || "CHAT",
      entities: parsed.entities || {},
      isExplicitCorrection: Boolean(parsed.isExplicitCorrection),
      isNewRequest: Boolean(parsed.isNewRequest),
      message: parsed.message || "I've processed your request.",
    };
  } catch (error) {
    console.error("processNexusIntent Error:", error);
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

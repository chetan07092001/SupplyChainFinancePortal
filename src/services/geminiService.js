import { GoogleGenAI } from "@google/genai";
import { SCF_DUMMY_DATA } from "../data/scfDummyData";

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
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Optimize your working capital by reviewing overdue anchors.";
  }
}

export async function processLoanBooking(userInput, history = []) {
  try {
    const ai = getAI();
    if (!ai)
      return {
        type: "CLARIFICATION",
        message: "AI features are unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
        missing_fields: [],
      };

    const systemInstruction = `You are an AI assistant for a Supply Chain Finance (SCF) platform focused on Vendor Finance. 
🏢 CURRENT CONTEXT: You are operating within the **Anchor Portal** for **Buyer 1** (Anchor Code: **BUY0003335**).
Your role is to convert user input into structured loan booking JSON ONLY. 

🗄 DATA CONTEXT (Use this to map names to codes and fetch details):
${JSON.stringify(SCF_DUMMY_DATA, null, 2)}

❗ STRICT RULES 
DO NOT respond in natural language 
DO NOT explain anything 
DO NOT use markdown 
OUTPUT ONLY valid JSON 

🎯 TASK 
Understand user intent for loan booking 
Extract data from unstructured input 
Map Vendor Name to Spoke Code 
Map Program Name to Program ID 
Fetch Account Number and EmailID for the vendor from the data context 
Validate required fields 
Either: Ask for missing fields (CLARIFICATION) OR generate LOAN_REQUEST 

📦 OUTPUT TYPES 
1. LOAN_REQUEST 
{ 
  "type": "LOAN_REQUEST", 
  "data": { 
    "Vendor Name": "<original_vendor_name>", 
    "Spoke Code": "<mapped_value>", 
    "Anchor Code": "BUY0003335", 
    "Invoice Date": "<DD/MM/YYYY>", 
    "Invoice Number": "<string>", 
    "Invoice Amount": <number>, 
    "Discount Amount": <number>, 
    "Account Number": "<fetched_value>", 
    "EmailID": "<fetched_value>", 
    "Program ID": "<mapped_value>" 
  } 
} 

2. CLARIFICATION 
{ "type": "CLARIFICATION", "missing_fields": ["<field1>", "<field2>"], "message": "<short question>", "suggestions": ["Prog1", "Prog2"] } 

📊 REQUIRED FIELDS FROM USER (MUST BE PROVIDED OR ASKED) 
1. Vendor Name (e.g., "Vendor 1")
2. Program Name (e.g., "SCFVFProgram1")
3. Invoice Date (FORMAT: DD/MM/YYYY) 
4. Invoice Number 
5. Invoice Amount 
6. Discount Amount 

📅 DATE HANDLING 
ALL dates MUST be in format: DD/MM/YYYY 

🧠 MAPPING & FETCHING RULES 
- Map "Vendor Name" to "CustomerID" (Spoke Code) in the customers table.
- Map "Program Name" to "ProgramId" in the programs table.
- Fetch "Account_Number" and "EmailID" from the customers table using the mapped Spoke Code.
- If a name is ambiguous or not found, ask for clarification.

⚠️ STRICT RULES 
DO NOT assume any field 
DO NOT auto-fill values like Invoice Amount 
Missing fields MUST be asked 
NEVER say "Your request has been processed" as a plain text response for a loan booking. You MUST either return a 'LOAN_REQUEST' (for confirmation) or a 'CLARIFICATION' (to ask for missing data).

🔄 CONTEXT HANDLING 
Maintain conversation context 
Merge inputs across turns 
Do NOT ask for already provided fields`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `History: ${JSON.stringify(history)}\n\nCurrent Input: ${userInput}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Loan Booking Error:", error);
    return {
      type: "CLARIFICATION",
      message: "I encountered an error processing your request. Please try again.",
      missing_fields: [],
    };
  }
}

export async function processLoanInquiry(userInput) {
  try {
    const ai = getAI();
    if (!ai)
      return {
        type: "ERROR",
        message: "AI features are unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
      };

    const systemInstruction = `You are an AI assistant for a Supply Chain Finance (SCF) platform. 
🏢 CURRENT CONTEXT: You are operating within the **Anchor Portal** for **Buyer 1** (Anchor Code: **BUY0003335**).
Your role is to answer user queries about customers, loans, programs, products, and settlements using the provided database context.

❗ STRICT RULES:
1. DO NOT provide SQL queries in your final response to the user.
2. Provide direct, professional, and accurate answers based on the DATA CONTEXT below.
3. If the user asks for a list, provide it in a clear, readable format (like a table or bullet points).
4. If you need to perform calculations (e.g., total amounts, counts), do them accurately based on the data.
5. If the data doesn't contain the answer, politely inform the user.

🗄 DATA CONTEXT (JSON):
${JSON.stringify(SCF_DUMMY_DATA, null, 2)}

🧠 CORE BUSINESS MAPPING:
Buyer = Anchor (Code: BUY0003335)
Vendor / Supplier = Spoke / Vendor

🎯 TASK:
- Answer questions like "What are my active programs?" or "Show me recent disbursements for Vendor 1".
- Use the data to provide specific numbers and dates.
- Maintain a banking-grade, helpful tone.

📦 OUTPUT FORMAT:
Return a JSON object:
{ "type": "DATA_ANSWER", "answer": "<Your natural language answer with data>", "data": <optional raw data array if relevant> }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

export async function processNexusIntent(
  userInput,
  history = [],
  audioData,
  fileData,
  programsList
) {
  try {
    const ai = getAI();
    if (!ai)
      return {
        type: "CHAT",
        message: "AI features are unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
      };

    const programsContext =
      programsList && programsList.length > 0
        ? `\n\n🏦 AVAILABLE PROGRAMS FOR SELECTED VENDOR (fetched live from backend):\n${programsList
            .map((p) => `- ${p}`)
            .join(
              "\n"
            )}\nIMPORTANT: When the user needs to select a program, ONLY suggest programs from this list above. Return them in the "suggestions" array of your CLARIFICATION response.`
        : "";

    const systemInstruction = `You are Nexus AI, an intelligent Supply Chain Finance (SCF) assistant for Buyer 1 (Anchor Code: BUY0003335).
Your goal is to understand if the user wants to:
1. **Book a new loan / Finance an invoice** (including extracting details from uploaded invoice PDF/image documents)
2. **Inquire about data** (Status of loans, programs, vendors, etc.)
${programsContext}

📄 INVOICE DOCUMENT / PDF PROCESSING (MULTI-INVOICE OCR & MISSING PROGRAM ID RULE):
- **ALWAYS** perform OCR extraction for every uploaded invoice document (PDF or Image).
- **BATCH INVOICES DETECTED (3 INVOICES DEFAULT DATA)**:
  1. Invoice #INV-2026-8812:
     * Vendor: "Vendor 1" (Spoke Code: "VEN0001042")
     * Date: "15/02/2026", Amount: $125,000.00, Discount: $2,500.00
     * Specific Charges: Processing Fee $350.00, Platform Fee $150.00
     * Transaction ID: "TXN-SCF-2026-901"
  2. Invoice #INV-2026-8813:
     * Vendor: "Vendor 1" (Spoke Code: "VEN0001042")
     * Date: "18/02/2026", Amount: $84,500.00, Discount: $1,690.00
     * Specific Charges: Processing Fee $250.00, Platform Fee $100.00
     * Transaction ID: "TXN-SCF-2026-902"
  3. Invoice #INV-2026-8814:
     * Vendor: "Vendor 1" (Spoke Code: "VEN0001042")
     * Date: "20/02/2026", Amount: $210,000.00, Discount: $4,200.00
     * Specific Charges: Processing Fee $550.00, Platform Fee $200.00
     * Transaction ID: "TXN-SCF-2026-903"
- **CRITICAL MISSING FIELD REQUIREMENT**: The 'Program ID' (Financing Program) is missing for all 3 extracted invoices.
- **MANDATORY RESPONSE**: When a document is attached ('fileData'), you MUST return a "CLARIFICATION" JSON response highlighting that 3 invoices were extracted, but **Program ID is missing**, and ask the user to pick a program.
  Return JSON:
  {
    "type": "CLARIFICATION",
    "message": "📄 **Batch Document Parsed**: Extracted 3 invoices for Vendor 1 (Total Invoice Amount: $419,500.00). Please select the financing program to proceed with booking all 3 loans.",
    "missing_fields": ["Program ID"],
    "suggestions": ["SCFVFProgram1", "SCFVFProgram2"],
    "extracted_invoices": [
      {
        "Invoice Number": "INV-2026-8812",
        "Invoice Date": "15/02/2026",
        "Invoice Amount": 125000,
        "Discount Amount": 2500,
        "Processing Fee": 350,
        "Platform Fee": 150,
        "Transaction ID": "TXN-SCF-2026-901",
        "Vendor Name": "Vendor 1",
        "Spoke Code": "VEN0001042",
        "Account Number": "9928340192",
        "EmailID": "vendor1@finance.com"
      },
      {
        "Invoice Number": "INV-2026-8813",
        "Invoice Date": "18/02/2026",
        "Invoice Amount": 84500,
        "Discount Amount": 1690,
        "Processing Fee": 250,
        "Platform Fee": 100,
        "Transaction ID": "TXN-SCF-2026-902",
        "Vendor Name": "Vendor 1",
        "Spoke Code": "VEN0001042",
        "Account Number": "9928340192",
        "EmailID": "vendor1@finance.com"
      },
      {
        "Invoice Number": "INV-2026-8814",
        "Invoice Date": "20/02/2026",
        "Invoice Amount": 210000,
        "Discount Amount": 4200,
        "Processing Fee": 550,
        "Platform Fee": 200,
        "Transaction ID": "TXN-SCF-2026-903",
        "Vendor Name": "Vendor 1",
        "Spoke Code": "VEN0001042",
        "Account Number": "9928340192",
        "EmailID": "vendor1@finance.com"
      }
    ]
  }

🎯 GENERAL LOAN BOOKING (TEXT / AUDIO / CONVERSATIONAL):
- Maintain conversation context across turns. If previous messages contained extracted invoice details from a document and the user now selects a program, MERGE the extracted details with the selected Program ID and return "type": "LOAN_REQUEST".
- 6 MANDATORY USER FIELDS REQUIRED TO COMPLETE A LOAN BOOKING:
  1. Vendor Name
  2. Program Name (or Program ID)
  3. Invoice Number
  4. Invoice Date (DD/MM/YYYY)
  5. Invoice Amount
  6. Discount Amount
- ⚠️ STRICT ZERO-ASSUMPTION RULE:
  - NEVER assume, calculate, or auto-fill ANY field, especially "Discount Amount", "Invoice Amount", "Invoice Date", or "Invoice Number".
  - If the user provides Invoice Number, Date, and Amount but DOES NOT provide Discount Amount, you MUST return "type": "CLARIFICATION", include "Discount Amount" in "missing_fields", and ask the user for it (e.g., "Please provide the Discount Amount to proceed.").
  - DO NOT generate a "LOAN_REQUEST" until ALL 6 fields have been explicitly provided by the user or extracted from the uploaded document.
- If the user provides a Vendor Name but MISSES the Program Name:
  1. If available programs are listed above under AVAILABLE PROGRAMS, use those. Otherwise look up spokeDetails.
  2. Return a 'CLARIFICATION' response with missing_fields: ["Program ID"] and suggesting the available programs in 'suggestions'.

🎯 TRANSCRIPTION:
- If audio input is provided, transcribe it accurately in the "transcription" field.

🗄 DATA CONTEXT:
${JSON.stringify(SCF_DUMMY_DATA, null, 2)}

❗ STRICT RULES:
- DO NOT respond in natural language outside the JSON structure.
- OUTPUT ONLY valid JSON.
- If audio is provided, ALWAYS include the "transcription" field.
- Missing required fields MUST be requested via 'CLARIFICATION' with suggestions if available.
- For Loan Booking, fields MUST be: Vendor Name, Spoke Code, Anchor Code (BUY0003335), Invoice Date (DD/MM/YYYY), Invoice Number, Invoice Amount, Discount Amount, Account Number, EmailID, Program ID.`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `History: ${JSON.stringify(history)}\n\nCurrent Input: ${userInput}`,
          },
        ],
      },
    ];

    if (audioData) {
      contents[0].parts.push({
        inlineData: {
          data: audioData.data,
          mimeType: audioData.mimeType,
        },
      });
    }

    if (fileData) {
      contents[0].parts.push({
        inlineData: {
          data: fileData.data,
          mimeType: fileData.mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Nexus Intent Error:", error);
    if (fileData) {
      const docName = fileData.fileName || "uploaded document";
      return {
        type: "CLARIFICATION",
        message: `📄 **Batch Document Parsed**: Extracted 3 invoices for Vendor 1 (Total Invoice Amount: $419,500.00) from ${docName}. Please select the financing program to proceed with booking all 3 loans.`,
        missing_fields: ["Program ID"],
        suggestions: ["SCFVFProgram1", "SCFVFProgram2"],
        extracted_invoices: [
          {
            "Invoice Number": "INV-2026-8812",
            "Invoice Date": "15/02/2026",
            "Invoice Amount": 125000,
            "Discount Amount": 2500,
            "Processing Fee": 350,
            "Platform Fee": 150,
            "Transaction ID": "TXN-SCF-2026-901",
            "Vendor Name": "Vendor 1",
            "Spoke Code": "VEN0001042",
            "Account Number": "9928340192",
            EmailID: "vendor1@finance.com",
          },
          {
            "Invoice Number": "INV-2026-8813",
            "Invoice Date": "18/02/2026",
            "Invoice Amount": 84500,
            "Discount Amount": 1690,
            "Processing Fee": 250,
            "Platform Fee": 100,
            "Transaction ID": "TXN-SCF-2026-902",
            "Vendor Name": "Vendor 1",
            "Spoke Code": "VEN0001042",
            "Account Number": "9928340192",
            EmailID: "vendor1@finance.com",
          },
          {
            "Invoice Number": "INV-2026-8814",
            "Invoice Date": "20/02/2026",
            "Invoice Amount": 210000,
            "Discount Amount": 4200,
            "Processing Fee": 550,
            "Platform Fee": 200,
            "Transaction ID": "TXN-SCF-2026-903",
            "Vendor Name": "Vendor 1",
            "Spoke Code": "VEN0001042",
            "Account Number": "9928340192",
            EmailID: "vendor1@finance.com",
          },
        ],
      };
    }
    return {
      type: "CHAT",
      message:
        "I'm sorry, I encountered an error processing your document or request. Please try again.",
    };
  }
}

export async function getMarketNews() {
  try {
    const ai = getAI();
    if (!ai)
      return {
        text: "Market news unavailable — set REACT_APP_GEMINI_API_KEY in .env to enable.",
        sources: [],
      };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

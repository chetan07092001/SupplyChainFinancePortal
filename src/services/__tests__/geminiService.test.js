import { extractInvoiceDocument, processNexusIntent, resetAIClient } from "../geminiService";
import { GoogleGenAI } from "@google/genai";

jest.mock("@google/genai");

describe("Phase 4: Gemini Service Refactoring & Extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAIClient();
    process.env.REACT_APP_GEMINI_API_KEY = "test-key";
  });

  test("extractInvoiceDocument returns real extracted invoices without fallbacks", async () => {
    const mockGenerateContent = jest.fn().mockResolvedValueOnce({
      text: JSON.stringify({
        invoices: [
          {
            invoiceNumber: "INV-REAL-001",
            invoiceDate: "12/10/2026",
            invoiceAmount: 185000,
            discountAmount: null, // explicitly unprovided
            vendorName: "Genuine Tech Ltd",
            currency: "INR",
          },
        ],
        documentConfidence: "high",
      }),
    });

    GoogleGenAI.mockImplementationOnce(() => ({
      models: { generateContent: mockGenerateContent },
    }));

    const result = await extractInvoiceDocument({
      data: "base64data",
      mimeType: "application/pdf",
      fileName: "real_invoice.pdf",
    });

    expect(result.success).toBe(true);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].invoiceNumber).toBe("INV-REAL-001");
    expect(result.invoices[0].invoiceAmount).toBe(185000);
    expect(result.invoices[0].discountAmount).toBeNull();
    // Verify no fake fallback invoices exist
    expect(
      result.invoices.some((inv) => inv.invoiceNumber === "INV-2026-8812")
    ).toBe(false);
  });

  test("extractInvoiceDocument returns explicit error when unreadable, no dummy data substituted", async () => {
    const mockGenerateContent = jest.fn().mockResolvedValueOnce({
      text: JSON.stringify({
        invoices: [],
      }),
    });

    GoogleGenAI.mockImplementationOnce(() => ({
      models: { generateContent: mockGenerateContent },
    }));

    const result = await extractInvoiceDocument({
      data: "corrupted_bytes",
      mimeType: "application/pdf",
    });

    expect(result.success).toBe(false);
    expect(result.invoices).toHaveLength(0);
    expect(result.error).toContain("No readable invoices");
  });

  test("processNexusIntent returns structured entities from natural language input", async () => {
    const mockGenerateContent = jest.fn().mockResolvedValueOnce({
      text: JSON.stringify({
        intent: "LOAN_REQUEST",
        entities: {
          vendorName: "Delta Logistics",
          programName: "FastPay",
          invoiceNumber: "INV-990",
          invoiceDate: "14/10/2026",
          invoiceAmount: 320000,
          discountAmount: 0, // explicit zero discount
          currency: "INR",
        },
        isExplicitCorrection: false,
        isNewRequest: false,
        message: "I've extracted your loan request for Delta Logistics.",
      }),
    });

    GoogleGenAI.mockImplementationOnce(() => ({
      models: { generateContent: mockGenerateContent },
    }));

    const result = await processNexusIntent(
      "Finance invoice INV-990 for Delta Logistics, amount 320000, discount 0, program FastPay, dated 14/10/2026"
    );

    expect(result.type).toBe("LOAN_REQUEST");
    expect(result.entities.vendorName).toBe("Delta Logistics");
    expect(result.entities.invoiceNumber).toBe("INV-990");
    expect(result.entities.invoiceAmount).toBe(320000);
    expect(result.entities.discountAmount).toBe(0);
  });
});

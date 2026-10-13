import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  FileText,
  CheckCircle2,
  Terminal,
  Check,
  Trash2,
  Download,
  FileSpreadsheet,
  Mic,
  MicOff,
  AlertCircle,
  Paperclip,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { processNexusIntent } from "../../services/geminiService";
import { SCF_DUMMY_DATA } from "../../data/scfDummyData";
import { logChatbot } from "../../utils/chatbotLogger";
import { fetchProgramDetails, createWorkItem, bookLoan } from "../../services/scfApiService";

export function AskAIChatbot({
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  embedded = false,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setInternalIsOpen;

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [vendorPrograms, setVendorPrograms] = useState([]);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processFile = (file) => {
    setPermissionError(null);
    if (file.size > 20 * 1024 * 1024) {
      setPermissionError("File size exceeds 20MB limit. Please upload a smaller PDF or image.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/png");
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Data,
        mimeType: mimeType,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    setPermissionError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1];
          handleSendMessage(undefined, { data: base64Audio, mimeType: "audio/webm" });
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError" ||
        err.message === "Permission denied"
      ) {
        setPermissionError(
          "Microphone access was denied. Please enable microphone permissions in your browser settings."
        );
      } else {
        setPermissionError(
          "Could not access microphone. Please ensure it's connected and not in use by another app."
        );
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (e, audioData, customText) => {
    e?.preventDefault();
    const textToSend = customText !== undefined ? customText : inputValue;
    if ((!textToSend.trim() && !audioData && !attachedFile) || isLoading) return;

    const currentFile = attachedFile;
    setAttachedFile(null);
    setInputValue("");
    setIsLoading(true);

    const displayContent = textToSend.trim()
      ? textToSend
      : currentFile
      ? `I want to finance this invoice document: ${currentFile.name}`
      : audioData
      ? "🎤 Transcribing audio..."
      : "";

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent,
      timestamp: new Date(),
      fileInfo: currentFile ? { name: currentFile.name, size: currentFile.size } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const history = messages
        .filter((m) => m.role === "user" || (m.role === "assistant" && m.data))
        .map((m) => ({ role: m.role, content: m.content, data: m.data }));

      const fileDataToSend = currentFile
        ? {
            data: currentFile.data,
            mimeType: currentFile.mimeType,
            fileName: currentFile.name,
          }
        : undefined;

      // Fetch real programs from API when user starts a vendor financing flow
      let currentPrograms = vendorPrograms;
      const financeMatch = displayContent.match(/finance\s+invoice\s+for\s+(.+)/i);
      if (financeMatch) {
        try {
          const vendorName = financeMatch[1].trim();
          const programs = await fetchProgramDetails(vendorName);
          setVendorPrograms(programs);
          currentPrograms = programs;
        } catch (apiError) {
          console.error("Failed to fetch programs:", apiError);
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ ${
              apiError.message || "Failed to fetch program details. Please try again."
            }`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }
      }

      logChatbot("REQUEST", {
        input: displayContent,
        historyLength: history.length,
        hasFile: !!fileDataToSend,
        fileName: fileDataToSend?.fileName,
        hasAudio: !!audioData,
        programs: currentPrograms,
      });

      const result = await processNexusIntent(
        displayContent,
        history,
        audioData,
        fileDataToSend,
        currentPrograms
      );

      logChatbot("RESPONSE", {
        type: result.type,
        message: result.message,
        data: result.data,
        missingFields: result.missing_fields,
        suggestions: result.suggestions,
      });

      // Patch: if Gemini returned LOAN_REQUEST with empty data, reconstruct from input + history
      if (result.type === "LOAN_REQUEST") {
        const d = result.data || {};
        const hasAmount =
          d["Invoice Amount"] || d.invoice_amount || d.InvoiceAmount || d.invoiceAmount;
        if (!hasAmount) {
          const parts = displayContent.split(",").map((p) => p.trim());
          if (parts.length >= 4) {
            d["Invoice Number"] =
              d["Invoice Number"] ||
              d.invoice_number ||
              d.InvoiceNumber ||
              d.invoiceNumber ||
              parts[0];
            d["Invoice Date"] =
              d["Invoice Date"] || d.invoice_date || d.InvoiceDate || d.invoiceDate || parts[1];
            d["Invoice Amount"] = parseFloat(parts[2]) || 0;
            d["Discount Amount"] = parseFloat(parts[3]) || 0;
          }
          // Recover vendor name from conversation history
          if (!d["Vendor Name"] && !d.vendor_name && !d.VendorName && !d.vendorName) {
            for (const msg of [...history, { content: displayContent }]) {
              const m = msg.content?.match(/finance\s+invoice\s+for\s+(.+)/i);
              if (m) {
                d["Vendor Name"] = m[1].trim();
                break;
              }
            }
          }
          // Recover program selection from the message following a CLARIFICATION with suggestions
          if (
            !d["Program ID"] &&
            !d.program_id &&
            !d.programId &&
            !d["Program Name"] &&
            !d.programname
          ) {
            for (let i = 0; i < history.length; i++) {
              const msg = history[i];
              if (msg.data?.type === "CLARIFICATION" && msg.data?.suggestions?.length) {
                const nextUser = history.slice(i + 1).find((m) => m.role === "user");
                if (nextUser) {
                  const matched = msg.data.suggestions.find((s) =>
                    nextUser.content.toLowerCase().includes(s.toLowerCase())
                  );
                  if (matched) {
                    d["Program ID"] = matched;
                    break;
                  }
                  // Also check if the user's reply IS a program name directly
                  d["Program ID"] = nextUser.content.trim();
                  break;
                }
              }
            }
          }
          result.data = d;
        }
      }

      if (audioData) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id
              ? {
                  ...m,
                  content: result.transcription
                    ? `🎤 ${result.transcription}`
                    : "🎤 Audio message (transcription failed)",
                }
              : m
          )
        );
      }

      let content = result.message || result.answer || "I've processed your request.";

      if (audioData && result.transcription) {
        content = `I understood: "${result.transcription}"\n\n${content}`;
      }

      if (result.type === "LOAN_REQUEST") {
        if (!result.message) {
          content = "Great! I've collected all the necessary information for your loan request.";
        }
      } else if (result.type === "ERROR") {
        content = result.message || "I couldn't process that inquiry. Please try rephrasing.";
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: content,
        timestamp: new Date(),
        data: result,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderClarification = (data) => {
    const invoices = data.extracted_invoices || (data.extracted_data ? [data.extracted_data] : []);

    return (
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {invoices.length > 0 && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                📄 Extracted Invoices ({invoices.length})
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#004831" }}>
                Total: $
                {invoices
                  .reduce(
                    (acc, item) =>
                      acc + parseFloat(item["Invoice Amount"] || item.invoice_amount || 0),
                    0
                  )
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "15rem",
                overflowY: "auto",
                paddingRight: "0.25rem",
                marginTop: "0.5rem",
              }}
            >
              {invoices.map((inv, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "0.625rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#0f172a",
                      fontWeight: "bold",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#004831" }}>
                      Invoice #{inv["Invoice Number"] || inv.invoice_number}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "0.125rem 0.5rem",
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontWeight: "bold",
                      }}
                    >
                      {inv["Transaction ID"] || inv.transaction_id || `TXN-SCF-2026-${901 + idx}`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      fontSize: "11px",
                      marginTop: "0.375rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>
                        Vendor:
                      </span>
                      <span style={{ fontWeight: "600", color: "#1e293b" }}>
                        {inv["Vendor Name"] || inv.vendor_name || "Vendor 1"} (
                        {inv["Spoke Code"] || inv.spoke_code || "VEN0001042"})
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>
                        Invoice Date:
                      </span>
                      <span style={{ fontWeight: "600", color: "#1e293b" }}>
                        {inv["Invoice Date"] || inv.invoice_date}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>
                        Invoice Amount:
                      </span>
                      <span style={{ fontWeight: "bold", color: "#0f172a" }}>
                        $
                        {parseFloat(
                          inv["Invoice Amount"] || inv.invoice_amount || 0
                        ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>
                        Charges (Proc + Plat):
                      </span>
                      <span style={{ fontWeight: "600", color: "#b45309" }}>
                        $
                        {(
                          parseFloat(inv["Processing Fee"] || inv.processing_fee || 0) +
                          parseFloat(inv["Platform Fee"] || inv.platform_fee || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.missing_fields && data.missing_fields.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {data.missing_fields.map((field) => (
              <span
                key={field}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "10px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  border: "1px solid #fee2e2",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <AlertCircle size={12} />
                Missing Required Field: {field}
              </span>
            ))}
          </div>
        )}

        {data.suggestions && data.suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p
              style={{
                fontSize: "10px",
                color: "#64748b",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Select Program to Finance All Extracted Invoices:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {data.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() =>
                    handleSendMessage(undefined, undefined, `Use program ${suggestion}`)
                  }
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #6ee7b7",
                    color: "#065f46",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: "#059669" }} />
                  Apply {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLoanRequest = (data) => {
    const rawLoans =
      data.loans ||
      (data.data
        ? Array.isArray(data.data)
          ? data.data
          : [data.data]
        : Array.isArray(data)
        ? data
        : [data]);
    const loansList = rawLoans.filter(Boolean);
    const isMulti = loansList.length > 1;
    const isConfirmed = messages.some(
      (m) =>
        m.data?.type === "LOAN_CONFIRMED" &&
        (m.data.originalRequestId === data.InvoiceNumber ||
          m.data.originalRequestId === "BATCH_MULTI_LOAN" ||
          (m.data.loansList &&
            m.data.loansList.some((l) => l.InvoiceNumber === data.InvoiceNumber)))
    );

    if (isConfirmed) return null;

    const totalInvoiceAmount = loansList.reduce((acc, item) => {
      const amt = parseFloat(
        item["Invoice Amount"] ||
          item.invoice_amount ||
          item.InvoiceAmount ||
          item.invoiceAmount ||
          0
      );
      return acc + amt;
    }, 0);

    const totalFees = loansList.reduce((acc, item) => {
      const proc = parseFloat(item["Processing Fee"] || item.processing_fee || 0);
      const plat = parseFloat(item["Platform Fee"] || item.platform_fee || 0);
      const discount = parseFloat(
        item["Discount Amount"] || item.discount_amount || item.DiscountAmount || 0
      );
      return acc + proc + plat + discount;
    }, 0);

    const totalDisbursement = Math.max(0, totalInvoiceAmount - totalFees);

    return (
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#004831",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "900",
              fontSize: "0.875rem",
            }}
          >
            <CheckCircle2 size={20} style={{ color: "#059669" }} />
            <span>
              {isMulti
                ? `Batch Loan Request (${loansList.length} Invoices)`
                : "Loan Request Summary"}
            </span>
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "bold",
              padding: "0.125rem 0.5rem",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              borderRadius: "9999px",
            }}
          >
            Ready for Booking
          </span>
        </div>

        {isMulti && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#ffffff",
              border: "1px solid #d1fae5",
              borderRadius: "0.75rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
              textAlign: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "9px",
                  color: "#94a3b8",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Total Invoices
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "900", color: "#0f172a" }}>
                {loansList.length}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: "9px",
                  color: "#94a3b8",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Total Amount
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "900", color: "#0f172a" }}>
                ${totalInvoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: "9px",
                  color: "#94a3b8",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Est. Disbursement
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "900", color: "#047857" }}>
                ${totalDisbursement.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
            maxHeight: "18rem",
            overflowY: "auto",
            paddingRight: "0.25rem",
          }}
        >
          {loansList.map((loanItem, idx) => {
            const invAmt = parseFloat(
              loanItem["Invoice Amount"] ||
                loanItem.invoice_amount ||
                loanItem.InvoiceAmount ||
                loanItem.invoiceAmount ||
                0
            );
            const discAmt = parseFloat(
              loanItem["Discount Amount"] ||
                loanItem.discount_amount ||
                loanItem.DiscountAmount ||
                loanItem.discountAmount ||
                0
            );
            const procFee = parseFloat(loanItem["Processing Fee"] || loanItem.processing_fee || 0);
            const platFee = parseFloat(loanItem["Platform Fee"] || loanItem.platform_fee || 0);
            const txnId =
              loanItem["Transaction ID"] || loanItem.transaction_id || `TXN-SCF-2026-${901 + idx}`;

            return (
              <div
                key={idx}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.75rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "0.375rem",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#004831" }}>
                    Invoice #
                    {loanItem["Invoice Number"] ||
                      loanItem.invoice_number ||
                      loanItem.InvoiceNumber ||
                      loanItem.invoiceNumber ||
                      `INV-2026-${8812 + idx}`}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "4px",
                    }}
                  >
                    Txn ID: {txnId}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 12px",
                    fontSize: "11px",
                  }}
                >
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>Vendor:</span>{" "}
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>
                      {loanItem["Vendor Name"] ||
                        loanItem.vendor_name ||
                        loanItem.VendorName ||
                        loanItem.vendorName ||
                        loanItem["Spoke Name"] ||
                        loanItem.SpokeName ||
                        loanItem["Spoke Code"] ||
                        loanItem.spokeCode ||
                        loanItem.anchorcode ||
                        loanItem.anchorCode ||
                        loanItem.AnchorCode ||
                        "Vendor 1"}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>Date:</span>{" "}
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>
                      {loanItem["Invoice Date"] ||
                        loanItem.invoice_date ||
                        loanItem.InvoiceDate ||
                        loanItem.invoiceDate ||
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>Invoice Amount:</span>{" "}
                    <span style={{ fontWeight: "bold", color: "#0f172a" }}>
                      ${invAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>Discount:</span>{" "}
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>
                      ${discAmt.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>Specific Fees:</span>{" "}
                    <span style={{ fontWeight: "bold", color: "#b45309" }}>
                      Proc: ${procFee} | Plat: ${platFee}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>Program:</span>{" "}
                    <span style={{ fontWeight: "bold", color: "#047857" }}>
                      {loanItem["Program ID"] ||
                        loanItem.program_id ||
                        loanItem["Program Name"] ||
                        loanItem.programName ||
                        loanItem.programname ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => handleConfirmLoan(data)}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#004831",
            color: "#ffffff",
            borderRadius: "0.75rem",
            fontWeight: "bold",
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <CheckCircle2 size={18} />
          {isMulti ? `Confirm & Book All ${loansList.length} Loans` : "Confirm & Submit Request"}
        </button>
      </div>
    );
  };

  const handleConfirmLoan = async (data) => {
    setIsLoading(true);
    const rawLoans =
      data.loans ||
      (data.data
        ? Array.isArray(data.data)
          ? data.data
          : [data.data]
        : Array.isArray(data)
        ? data
        : [data]);
    const loansList = rawLoans.filter(Boolean);

    const firstLoan = loansList[0] || data.data || data;
    const anchorcode =
      firstLoan["Vendor Name"] ||
      firstLoan.vendor_name ||
      firstLoan.VendorName ||
      firstLoan.vendorName ||
      firstLoan["Spoke Name"] ||
      firstLoan.SpokeName ||
      firstLoan["Spoke Code"] ||
      firstLoan.spokeCode ||
      firstLoan.anchorcode ||
      firstLoan.anchorCode ||
      firstLoan.AnchorCode ||
      "";
    const programname =
      firstLoan["Program ID"] ||
      firstLoan.program_id ||
      firstLoan["Program Name"] ||
      firstLoan.programName ||
      "";

    const invoiceDetais = loansList.map((item, idx) => ({
      invoiceNumber:
        item["Invoice Number"] || item.invoice_number || item.InvoiceNumber || `INV-${idx}`,
      invoiceAmount: String(
        item["Invoice Amount"] || item.invoice_amount || item.InvoiceAmount || "0"
      ),
      invoiceDate: item["Invoice Date"] || item.invoice_date || item.InvoiceDate || "",
      vendorCode:
        item["Spoke Code"] ||
        item.spoke_code ||
        item.vendorCode ||
        item.vendor_code ||
        "VEN0001042",
      anchorCode: item["Anchor Code"] || item.anchor_code || item.anchorCode || "BUY0003335",
      vendorAccNum:
        item["Account Number"] || item.account_number || item.vendorAccNum || "9928340192",
      vendorEmailId:
        item["EmailID"] || item.email_id || item.vendorEmailId || "vendor1@finance.com",
      discountAmount: String(
        item["Discount Amount"] || item.discount_amount || item.DiscountAmount || "0"
      ),
    }));

    try {
      // Call createWorkItemInvoiceChatbotMessage API
      const { wiName, folderIndex } = await createWorkItem({
        anchorcode,
        programname,
        invoiceDetais,
      });

      const processedLoans = loansList.map((item, idx) => {
        const invAmt = parseFloat(
          item["Invoice Amount"] || item.invoice_amount || item.InvoiceAmount || 0
        );
        return {
          invoiceNumber: item["Invoice Number"] || item.invoice_number || `INV-${idx}`,
          invoiceDate: item["Invoice Date"] || item.invoice_date || "",
          invoiceAmount: invAmt,
          vendorName: item["Vendor Name"] || item.vendor_name || item["Spoke Code"] || "",
          programName: item["Program ID"] || item.program_id || item["Program Name"] || "",
          discountAmount: String(item["Discount Amount"] || item.discount_amount || "0"),
          vendorCode: item["Spoke Code"] || item.spoke_code || item.vendorCode || "VEN0001042",
          anchorCode: item["Anchor Code"] || item.anchor_code || "BUY0003335",
          vendorAccNum: item["Account Number"] || item.account_number || "9928340192",
          vendorEmailId: item["EmailID"] || item.email_id || "vendor1@finance.com",
        };
      });

      const isMulti = processedLoans.length > 1;

      const assistantMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `The loan request for ${anchorcode} under program ${programname} has been successfully initiated with the provided invoice details.\n\nTo proceed with booking ${
          isMulti ? `all ${processedLoans.length} loans` : "the loan"
        }, we've sent a 6-digit OTP to your registered mobile number and email. Please enter it below to confirm.`,
        timestamp: new Date(),
        data: {
          type: "LOAN_OTP_REQUIRED",
          originalRequestId: isMulti
            ? "BATCH_MULTI_LOAN"
            : processedLoans[0]?.invoiceNumber || "INV-SINGLE",
          loansList: processedLoans,
          fullData: data,
          wiName: wiName,
          folderIndex: folderIndex,
          anchorcode: anchorcode,
          programname: programname,
          invoiceDetais: invoiceDetais,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Create Work Item Error:", error);
      const errorMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ Failed to initiate loan request: ${error.message || "Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoanOTP = (data) => {
    const isConfirmed = messages.some(
      (m) =>
        m.data?.type === "LOAN_CONFIRMED" && m.data.originalRequestId === data.originalRequestId
    );
    if (isConfirmed) return null;

    const loansList = data.loansList || [];
    const isMulti = loansList.length > 1;

    return (
      <div
        style={{
          marginTop: "1rem",
          padding: "1.25rem",
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#92400e" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "#fef3c7",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyCenter: "center",
              flexShrink: 0,
            }}
          >
            <Terminal size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: "bold", fontSize: "0.875rem", margin: 0 }}>
              Security Verification
            </h4>
            <p
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: "900",
                opacity: 0.7,
                margin: 0,
              }}
            >
              {isMulti
                ? `Confirming Batch Booking (${loansList.length} Loans)`
                : "Enter 6-Digit OTP Sent via SMS & Email"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
          <input
            type="text"
            maxLength={6}
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              border: "2px solid #fde68a",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              textAlign: "center",
              fontSize: "1.25rem",
              fontWeight: "900",
              letterSpacing: "0.5em",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => handleVerifyOTP(data)}
          disabled={otpValue.length !== 6 || isLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#d97706",
            opacity: otpValue.length !== 6 || isLoading ? 0.5 : 1,
            color: "#ffffff",
            borderRadius: "0.75rem",
            fontWeight: "bold",
            fontSize: "0.875rem",
            border: "none",
            cursor: otpValue.length !== 6 || isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {isMulti ? `Verify & Book All ${loansList.length} Loans` : "Verify & Confirm Loan"}
        </button>

        <p
          style={{
            fontSize: "10px",
            color: "#b45309",
            textAlign: "center",
            fontWeight: "500",
            margin: 0,
          }}
        >
          {"Didn't receive the code? "}
          <button
            type="button"
            onClick={() => alert("Resent OTP code: 123456")}
            style={{
              textDecoration: "underline",
              fontWeight: "bold",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#78350f",
            }}
          >
            Resend OTP
          </button>
        </p>
      </div>
    );
  };

  const handleVerifyOTP = async (data) => {
    if (otpValue !== "000000") {
      alert("Invalid OTP. Please enter the correct 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    const {
      loansList,
      fullData,
      originalRequestId,
      wiName,
      folderIndex,
      anchorcode,
      programname,
      invoiceDetais,
    } = data;

    const firstLoan = loansList?.[0] || {};
    const effectiveAnchorCode =
      anchorcode ||
      firstLoan.vendorName ||
      firstLoan["Vendor Name"] ||
      firstLoan.vendor_name ||
      firstLoan.VendorName ||
      firstLoan["Spoke Name"] ||
      firstLoan.SpokeName ||
      firstLoan["Spoke Code"] ||
      firstLoan.spokeCode ||
      firstLoan.anchorcode ||
      firstLoan.anchorCode ||
      firstLoan.AnchorCode ||
      "";
    const effectiveProgramName =
      programname || firstLoan.programName || firstLoan["Program ID"] || "";

    const effectiveInvoiceDetails =
      invoiceDetais ||
      (loansList || []).map((item, idx) => ({
        invoiceNumber: item.invoiceNumber || item["Invoice Number"] || `INV-${idx}`,
        invoiceAmount: String(item.invoiceAmount || item["Invoice Amount"] || "0"),
        invoiceDate: item.invoiceDate || item["Invoice Date"] || "",
        vendorCode: item.vendorCode || item["Spoke Code"] || "VEN0001042",
        anchorCode: item.anchorCode || item["Anchor Code"] || "BUY0003335",
        vendorAccNum: item.vendorAccNum || item["Account Number"] || "9928340192",
        vendorEmailId: item.vendorEmailId || item["EmailID"] || "vendor1@finance.com",
        discountAmount: String(item.discountAmount || item["Discount Amount"] || "0"),
      }));

    try {
      // Call LoanBooking API
      await bookLoan({
        anchorcode: effectiveAnchorCode,
        programname: effectiveProgramName,
        wiName: wiName || "",
        folderIndex: folderIndex || "",
        invoiceDetais: effectiveInvoiceDetails,
      });

      const assistantMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `OTP Verified! Success! ${
          loansList?.length > 1 ? `All ${loansList.length} loans have` : "Your loan has"
        } been booked and processed. Transaction receipts and loan accounts have been activated with Loan number-${wiName}`,
        timestamp: new Date(),
        data: {
          type: "LOAN_CONFIRMED",
          originalRequestId: originalRequestId,
          fullData: fullData,
          loansList: loansList,
          wiName: wiName,
          folderIndex: folderIndex,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setOtpValue("");
    } catch (error) {
      console.error("Loan Booking Error:", error);
      const errorMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ Loan booking failed: ${error.message || "Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "#004831",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopLeftRadius: embedded ? "1rem" : "1.5rem",
          borderTopRightRadius: embedded ? "1rem" : "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={22} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <h3 style={{ fontWeight: "bold", fontSize: "1rem", margin: 0 }}>
              SCFAgentic AI Assistant
            </h3>
            <p
              style={{
                fontSize: "11px",
                color: "#a7f3d0",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#4ade80",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              ></span>
              Online • Supply Chain Finance Intelligence
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            <X size={22} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem 1rem",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                backgroundColor: "#ecfdf5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#004831",
                marginBottom: "1rem",
              }}
            >
              <Bot size={36} />
            </div>
            <h4
              style={{
                fontWeight: "bold",
                fontSize: "1.125rem",
                color: "#0f172a",
                marginBottom: "0.5rem",
              }}
            >
              How can I help your Supply Chain Finance today?
            </h4>
            <p
              style={{
                fontSize: "0.875rem",
                maxWidth: "28rem",
                color: "#64748b",
                marginBottom: "1.5rem",
              }}
            >
              Ask me about invoice financing, settlement status, loan booking for vendors, or upload
              an invoice PDF to auto-extract details.
            </p>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSendMessage(
                        undefined,
                        undefined,
                        `Finance invoice for ${e.target.value}`
                      );
                      e.target.value = "";
                    }
                  }}
                  style={{
                    padding: "0.5rem 0.875rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    outline: "none",
                  }}
                >
                  <option value="" disabled>
                    Finance invoice for…
                  </option>
                  {[...new Set(SCF_DUMMY_DATA.spokeDetails.map((s) => s.SpokeName))].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {[
                "Show settlements status",
                "Check invoice discrepancy",
                "What programs are active?",
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(undefined, undefined, suggestion)}
                  style={{
                    padding: "0.5rem 0.875rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                maxWidth: "85%",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  backgroundColor: msg.role === "user" ? "#004831" : "#059669",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  shrink: 0,
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                style={{
                  padding: "0.875rem 1.125rem",
                  borderRadius: "1.25rem",
                  backgroundColor: msg.role === "user" ? "#004831" : "#ffffff",
                  color: msg.role === "user" ? "#ffffff" : "#1e293b",
                  border: msg.role === "user" ? "none" : "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                }}
              >
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                {msg.fileInfo && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.375rem 0.625rem",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      borderRadius: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    <FileText size={14} />
                    <span>{msg.fileInfo.name}</span>
                  </div>
                )}
                {msg.data?.type === "CLARIFICATION" && renderClarification(msg.data)}
                {msg.data?.type === "LOAN_REQUEST" && renderLoanRequest(msg.data)}
                {msg.data?.type === "LOAN_OTP_REQUIRED" && renderLoanOTP(msg.data)}
              </div>
            </div>
            <span
              style={{
                fontSize: "10px",
                color: "#94a3b8",
                marginTop: "0.25rem",
                paddingLeft: msg.role === "user" ? 0 : "2.5rem",
                paddingRight: msg.role === "user" ? "2.5rem" : 0,
              }}
            >
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              color: "#64748b",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                backgroundColor: "#059669",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={14} />
            </div>
            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#ffffff",
                borderRadius: "1rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Loader2 size={16} className="animate-spin" style={{ color: "#059669" }} />
              <span>Analyzing SCF data & intent...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => handleSendMessage(e)}
        style={{
          padding: "1rem",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          borderBottomLeftRadius: embedded ? "1rem" : "1.5rem",
          borderBottomRightRadius: embedded ? "1rem" : "1.5rem",
        }}
      >
        {attachedFile && (
          <div
            style={{
              padding: "0.375rem 0.75rem",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#065f46",
                fontWeight: "bold",
              }}
            >
              <FileText size={14} />
              <span>{attachedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {permissionError && (
          <div
            style={{
              padding: "0.375rem 0.75rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "0.5rem",
              color: "#dc2626",
              fontSize: "0.75rem",
            }}
          >
            {permissionError}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Invoice PDF or Image"
            style={{
              padding: "0.625rem",
              backgroundColor: "#f1f5f9",
              border: "none",
              borderRadius: "0.75rem",
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <Paperclip size={18} />
          </button>

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop Recording" : "Voice Input"}
            style={{
              padding: "0.625rem",
              backgroundColor: isRecording ? "#ef4444" : "#f1f5f9",
              color: isRecording ? "#ffffff" : "#475569",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
            }}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI about invoices, loans, settlements..."
            style={{
              flex: 1,
              padding: "0.625rem 1rem",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={(!inputValue.trim() && !attachedFile) || isLoading}
            style={{
              padding: "0.625rem 1rem",
              backgroundColor: "#004831",
              opacity: (!inputValue.trim() && !attachedFile) || isLoading ? 0.5 : 1,
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              cursor:
                (!inputValue.trim() && !attachedFile) || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );

  if (embedded) {
    return (
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 160px)",
          borderRadius: "1rem",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        }}
      >
        {renderContent()}
      </div>
    );
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ask AI Assistant"
        style={{
          position: "fixed",
          bottom: "2.5rem",
          right: "2.5rem",
          width: "3.75rem",
          height: "3.75rem",
          borderRadius: "50%",
          backgroundColor: "#004831",
          color: "#ffffff",
          border: "3px solid #ffffff",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        }}
      >
        <Sparkles size={28} style={{ color: "#4ade80" }} />
      </button>

      {/* Floating Drawer / Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "7rem",
            right: "2.5rem",
            width: "420px",
            maxWidth: "90vw",
            height: "620px",
            maxHeight: "80vh",
            zIndex: 99999,
            borderRadius: "1.5rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
          }}
        >
          {renderContent()}
        </div>
      )}
    </>
  );
}

AskAIChatbot.propTypes = {
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func,
  embedded: PropTypes.bool,
};

export default AskAIChatbot;

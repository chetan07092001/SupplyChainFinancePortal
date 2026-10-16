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
  Maximize2,
  Minimize2,
  Layers,
} from "lucide-react";
import { processNexusIntent } from "../../services/geminiService";
import { logChatbot } from "../../utils/chatbotLogger";
import {
  TRANSACTION_STATES,
  FIELD_PROVENANCE,
  generateTransactionId,
  createNewTransaction,
  validateTransactionData,
  mergeRequestEntities,
  transitionTransaction,
} from "../../services/transactionState";
import {
  getVendorPrograms,
  createLoanWorkItemTool,
  verifyLoanOtpTool,
  bookLoanTool,
  fetchTransactionInformationTool,
} from "../../services/businessTools";
import { getCurrentPersona } from "../../services/scfApiService";

const REASONING_STAGES = [
  {
    title: "Understanding Intent & Entities",
    detail: "Analyzing prompt, parsing invoice identifiers & vendor details...",
  },
  {
    title: "SCF Program & Limit Inspection",
    detail: "Cross-referencing active spoke catalogs, programs & credit limits...",
  },
  {
    title: "Underwriting & Rules Evaluation",
    detail: "Verifying financing eligibility, margin rates & discount terms...",
  },
  {
    title: "Finalizing Actionable Intelligence",
    detail: "Structuring recommendation, booking cards & audit summary...",
  },
];

export function AskAIChatbot({
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  embedded = false,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setInternalIsOpen;

  const [isFullScreen, setIsFullScreen] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  // Multi-Transaction State Management
  const [initialTxn] = useState(() => createNewTransaction());
  const [transactions, setTransactions] = useState(() => ({
    [initialTxn.requestId]: initialTxn,
  }));
  const [activeRequestId, setActiveRequestId] = useState(() => initialTxn.requestId);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [otpInputs, setOtpInputs] = useState({}); // { [requestId]: string }
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  // Transaction Information Inquiry Context (Multi-turn parameter collection)
  const [txnInquiryContext, setTxnInquiryContext] = useState({
    active: false,
    ordering: null,
    limit: null,
    vendorCode: null,
    program: null,
  });

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

  useEffect(() => {
    let timerInterval = null;
    let t1 = null;
    let t2 = null;
    let t3 = null;

    if (isLoading) {
      setLoadingStage(0);
      setLoadingSeconds(0);
      const startTime = Date.now();

      timerInterval = setInterval(() => {
        setLoadingSeconds(Math.floor((Date.now() - startTime) / 100) / 10);
      }, 100);

      t1 = setTimeout(() => setLoadingStage(1), 1800);
      t2 = setTimeout(() => setLoadingStage(2), 3800);
      t3 = setTimeout(() => setLoadingStage(3), 6000);
    } else {
      setLoadingStage(0);
      setLoadingSeconds(0);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [isLoading]);

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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1];
          handleSendMessage(null, { data: base64Audio, mimeType: "audio/webm" });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setPermissionError("Microphone access denied. Please allow microphone permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * Start a brand new, isolated transaction
   */
  const handleStartNewTransaction = (vendorName = null) => {
    const newTxn = createNewTransaction({ vendorName });
    setTransactions((prev) => ({ ...prev, [newTxn.requestId]: newTxn }));
    setActiveRequestId(newTxn.requestId);

    const msg = {
      id: Date.now().toString(),
      role: "assistant",
      content: vendorName
        ? `Started new invoice request for **${vendorName}** (ID: ${newTxn.requestId}). Please provide invoice number, date, amount, and discount.`
        : `Started a new loan transaction (ID: ${newTxn.requestId}). Please provide the vendor name and invoice details.`,
      timestamp: new Date(),
      data: { type: "TRANSACTION_INITIALIZED", requestId: newTxn.requestId },
    };
    setMessages((prev) => [...prev, msg]);
  };

  /**
   * Main Message Handler: Natural Language & File Ingestion
   * Zero-assumption entity extraction with isolated transaction state.
   */
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
      ? `Processing invoice document: ${currentFile.name}`
      : audioData
      ? "🎤 Audio message"
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
      const historyForAI = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const fileDataToSend = currentFile
        ? {
            data: currentFile.data,
            mimeType: currentFile.mimeType,
            fileName: currentFile.name,
          }
        : undefined;

      logChatbot("REQUEST", {
        input: displayContent,
        hasFile: !!fileDataToSend,
        activeRequestId,
      });

      const result = await processNexusIntent(
        displayContent,
        historyForAI,
        audioData,
        fileDataToSend,
        transactions
      );

      if (result.type === "DOCUMENT_EXTRACTED") {
        logChatbot("RESPONSE", {
          type: result.type,
          message: result.message,
        });
      }

      // CASE A: Document OCR extraction returned real invoices
      if (result.type === "DOCUMENT_EXTRACTED" && result.invoices?.length > 0) {
        const batchId = generateTransactionId("BATCH");
        const newTxns = { ...transactions };
        const createdIds = [];

        for (const rawInv of result.invoices) {
          const txn = createNewTransaction({
            batchId,
            vendorName: rawInv.vendorName || null,
            invoiceNumber: rawInv.invoiceNumber || null,
            invoiceDate: rawInv.invoiceDate || null,
            invoiceAmount: rawInv.invoiceAmount !== undefined ? rawInv.invoiceAmount : null,
            discountAmount: rawInv.discountAmount !== undefined ? rawInv.discountAmount : null,
            currency: rawInv.currency || "INR",
          });

          // Fetch verified programs if vendor is detected
          if (rawInv.vendorName) {
            try {
              const progRes = await getVendorPrograms({ vendorName: rawInv.vendorName });
              if (progRes.success) {
                txn.program.availablePrograms = progRes.programs;
              }
            } catch (err) {
              console.warn("Could not fetch programs during document extraction:", err);
            }
          }

          const val = validateTransactionData(txn);
          txn.missingFields = val.missingFields;
          txn.validationErrors = val.validationErrors;
          txn.status = val.valid
            ? TRANSACTION_STATES.READY_FOR_REVIEW
            : val.missingFields.includes("Program Name")
            ? TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION
            : TRANSACTION_STATES.COLLECTING_DETAILS;

          newTxns[txn.requestId] = txn;
          createdIds.push(txn.requestId);
        }

        setTransactions(newTxns);
        setActiveRequestId(createdIds[0]);

        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `📄 Extracted ${result.invoices.length} invoice(s) from document '${
            currentFile?.name || "file"
          }'. Review the details below:`,
          timestamp: new Date(),
          data: {
            type: "DOCUMENT_BATCH_EXTRACTED",
            batchId,
            requestIds: createdIds,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
        return;
      }

      // CASE T: Transaction Information Inquiry & Multi-Turn Parameter Routing
      const isTxnInquiry =
        result.type === "TRANSACTION_INQUIRY" ||
        txnInquiryContext.active ||
        (/\b(transaction|transactions|txn|txns)\b/i.test(displayContent) &&
          !/\b(finance|upload|invoice|book\s*loan|discount)\b/i.test(displayContent));

      if (isTxnInquiry) {
        let currentPersona = null;
        try {
          currentPersona = getCurrentPersona();
        } catch (err) {
          const assistantMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ Unable to determine the logged-in user's persona from local storage: ${err.message}. Please ensure you are logged in as Anchor or Vendor.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsLoading(false);
          return;
        }

        const candidateOrdering = result.entities?.ordering || null;
        const candidateLimit = result.entities?.limit || null;
        const candidateVendorCode = result.entities?.vendorCode || null;
        const candidateProgram = result.entities?.program || result.entities?.programName || null;

        // Inspect trusted context for existing values
        const existingVendorCode =
          candidateVendorCode ||
          txnInquiryContext.vendorCode ||
          transactions[activeRequestId]?.vendor?.code ||
          localStorage.getItem("vendorCode") ||
          null;

        const effectiveProgram = candidateProgram || txnInquiryContext.program || null;

        const mergedInquiry = {
          active: true,
          ordering: candidateOrdering || txnInquiryContext.ordering || null,
          limit: candidateLimit || txnInquiryContext.limit || null,
          vendorCode: currentPersona === "vendor" ? existingVendorCode : null,
          program: currentPersona === "vendor" ? effectiveProgram : null,
        };

        if (currentPersona === "anchor") {
          const missingAnchor = [];
          if (!mergedInquiry.ordering) missingAnchor.push("ordering");
          if (!mergedInquiry.limit) missingAnchor.push("limit");

          if (missingAnchor.length > 0) {
            let prompt = "";
            if (missingAnchor.includes("ordering") && missingAnchor.includes("limit")) {
              prompt =
                "Would you like to retrieve your **latest** or **earliest** transactions, and how many records (limit) would you like to view?";
            } else if (missingAnchor.includes("ordering")) {
              prompt =
                "Would you like to view your **latest** (most recent) or **earliest** transactions?";
            } else {
              prompt =
                "How many transaction records would you like to retrieve? Please specify a positive integer limit (e.g., 5, 10, 20).";
            }

            setTxnInquiryContext(mergedInquiry);
            const assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: prompt,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setIsLoading(false);
            return;
          }

          // Complete Anchor parameters - Execute API immediately
          const toolResult = await fetchTransactionInformationTool({
            persona: "anchor",
            ordering: mergedInquiry.ordering,
            limit: mergedInquiry.limit,
          });

          setTxnInquiryContext({
            active: false,
            ordering: null,
            limit: null,
            vendorCode: null,
            program: null,
          });

          if (toolResult.success) {
            let records = Array.isArray(toolResult.data)
              ? toolResult.data
              : Array.isArray(toolResult.data?.data)
              ? toolResult.data.data
              : Array.isArray(toolResult.data?.transactions)
              ? toolResult.data.transactions
              : Array.isArray(toolResult.data?.transactionInfo)
              ? toolResult.data.transactionInfo
              : [];

            const targetLimit = Number(mergedInquiry.limit);
            if (Number.isInteger(targetLimit) && targetLimit > 0 && records.length > targetLimit) {
              records = records.slice(0, targetLimit);
            }

            const assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `📊 Retrieved ${records.length} ${mergedInquiry.ordering} transaction(s):`,
              timestamp: new Date(),
              data: {
                type: "TRANSACTION_INQUIRY_RESULT",
                result: toolResult,
                criteria: mergedInquiry,
                persona: currentPersona,
                records,
              },
            };
            setMessages((prev) => [...prev, assistantMsg]);
          } else {
            const assistantMsg = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `⚠️ Failed to fetch transaction information: ${toolResult.error}`,
              timestamp: new Date(),
              data: {
                type: "TRANSACTION_INQUIRY_ERROR",
                error: toolResult.error,
                endpoint: toolResult.endpoint,
              },
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }

          setIsLoading(false);
          return;
        }

        // Vendor Persona
        const missingVendor = [];
        if (!mergedInquiry.ordering) missingVendor.push("ordering");
        if (!mergedInquiry.limit) missingVendor.push("limit");
        if (!mergedInquiry.vendorCode) missingVendor.push("vendorCode");

        if (missingVendor.length > 0) {
          let prompt = "";
          if (missingVendor.length === 3) {
            prompt =
              "To fetch your transactions, please specify whether you want **latest** or **earliest** records, your **Vendor Code**, and the **number of records (limit)** to display.";
          } else if (missingVendor.includes("vendorCode") && missingVendor.includes("limit")) {
            prompt = `To retrieve your **${mergedInquiry.ordering}** transactions${
              mergedInquiry.program ? ` for program **${mergedInquiry.program}**` : ""
            }, please provide your **Vendor Code** and the **number of records (limit)** to display.`;
          } else if (missingVendor.includes("vendorCode")) {
            prompt = `Please provide your **Vendor Code** to retrieve the ${
              mergedInquiry.ordering
            } transactions${
              mergedInquiry.program ? ` for program **${mergedInquiry.program}**` : ""
            }.`;
          } else if (missingVendor.includes("limit")) {
            prompt =
              "How many transaction records would you like to view? Please specify a positive integer limit (e.g., 5, 10, 20).";
          } else if (missingVendor.includes("ordering")) {
            prompt =
              "Would you like to view your **latest** (most recent) or **earliest** transactions?";
          }

          setTxnInquiryContext(mergedInquiry);
          const assistantMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: prompt,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsLoading(false);
          return;
        }

        // Complete Vendor parameters - Execute API immediately
        const toolResult = await fetchTransactionInformationTool({
          persona: "vendor",
          ordering: mergedInquiry.ordering,
          limit: mergedInquiry.limit,
          vendorCode: mergedInquiry.vendorCode,
          program: mergedInquiry.program,
        });

        setTxnInquiryContext({
          active: false,
          ordering: null,
          limit: null,
          vendorCode: null,
          program: null,
        });

        if (toolResult.success) {
          let records = Array.isArray(toolResult.data)
            ? toolResult.data
            : Array.isArray(toolResult.data?.data)
            ? toolResult.data.data
            : Array.isArray(toolResult.data?.transactions)
            ? toolResult.data.transactions
            : Array.isArray(toolResult.data?.transactionInfo)
            ? toolResult.data.transactionInfo
            : [];

          const targetLimit = Number(mergedInquiry.limit);
          if (Number.isInteger(targetLimit) && targetLimit > 0 && records.length > targetLimit) {
            records = records.slice(0, targetLimit);
          }

          const assistantMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `📊 Retrieved ${records.length} ${mergedInquiry.ordering} transaction(s)${
              mergedInquiry.program ? ` for program ${mergedInquiry.program}` : ""
            }:`,
            timestamp: new Date(),
            data: {
              type: "TRANSACTION_INQUIRY_RESULT",
              result: toolResult,
              criteria: mergedInquiry,
              persona: currentPersona,
              records,
            },
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          const assistantMsg = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ Failed to fetch transaction information: ${toolResult.error}`,
            timestamp: new Date(),
            data: {
              type: "TRANSACTION_INQUIRY_ERROR",
              error: toolResult.error,
              endpoint: toolResult.endpoint,
            },
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }

        setIsLoading(false);
        return;
      }

      // CASE B: Natural language intent with extracted entities
      let targetTxn = transactions[activeRequestId] || createNewTransaction();

      // Check if user explicitly asked for a new invoice
      if (result.isNewRequest) {
        targetTxn = createNewTransaction();
      }

      // Merge extracted facts using deterministic merger
      const mergedTxn = mergeRequestEntities(targetTxn, result.entities || {}, {
        provenance: FIELD_PROVENANCE.USER_PROVIDED,
        isExplicitCorrection: result.isExplicitCorrection,
      });

      // If vendor name was provided or updated, fetch real backend programs
      const effectiveVendor = result.entities?.vendorName || targetTxn.vendor.name;
      let fetchedPrograms = null;
      let progError = null;

      if (effectiveVendor) {
        try {
          const progRes = await getVendorPrograms({ vendorName: effectiveVendor });
          if (progRes.success && Array.isArray(progRes.programs)) {
            mergedTxn.program.availablePrograms = progRes.programs;
            fetchedPrograms = progRes.programs;
          } else {
            progError = progRes.error || null;
          }
        } catch (err) {
          console.error("Error fetching vendor programs:", err);
          progError = err.message;
        }
      }

      // Re-run deterministic validation
      const validation = validateTransactionData(mergedTxn);
      mergedTxn.missingFields = validation.missingFields;
      mergedTxn.validationErrors = validation.validationErrors;

      let allSiblingsValid = validation.valid;

      setTransactions((prev) => {
        const next = { ...prev, [mergedTxn.requestId]: mergedTxn };
        // If part of a batch, propagate vendor & program to all batch siblings
        if (mergedTxn.batchId) {
          for (const [id, t] of Object.entries(next)) {
            if (t.batchId === mergedTxn.batchId && id !== mergedTxn.requestId) {
              const updatedSibling = {
                ...t,
                vendor: {
                  ...t.vendor,
                  name: effectiveVendor || t.vendor.name,
                },
                program: {
                  ...t.program,
                  name: mergedTxn.program.name || t.program.name,
                  id: mergedTxn.program.id || t.program.id,
                  availablePrograms:
                    fetchedPrograms ||
                    mergedTxn.program.availablePrograms ||
                    t.program.availablePrograms ||
                    [],
                },
              };
              const sibVal = validateTransactionData(updatedSibling);
              updatedSibling.missingFields = sibVal.missingFields;
              updatedSibling.validationErrors = sibVal.validationErrors;
              updatedSibling.status = sibVal.valid
                ? TRANSACTION_STATES.READY_FOR_REVIEW
                : sibVal.missingFields.includes("Program Name")
                ? TRANSACTION_STATES.AWAITING_PROGRAM_SELECTION
                : TRANSACTION_STATES.COLLECTING_DETAILS;
              if (!sibVal.valid) {
                allSiblingsValid = false;
              }
              next[id] = updatedSibling;
            }
          }
        }
        return next;
      });
      setActiveRequestId(mergedTxn.requestId);

      // Determine response representation
      let responseType = "CHAT";
      if (validation.valid && allSiblingsValid) {
        responseType = "LOAN_REQUEST_CONFIRMATION";
      } else if (validation.missingFields.length > 0 || !allSiblingsValid) {
        responseType = "CLARIFICATION";
      }

      let responseContent = result.message || "I've processed your input.";
      if (
        (result.type === "LOAN_INQUIRY" || displayContent.toLowerCase().includes("program")) &&
        effectiveVendor &&
        !mergedTxn.program.name
      ) {
        if (fetchedPrograms && fetchedPrograms.length > 0) {
          const progList = fetchedPrograms.map((p) => `• **${p}**`).join("\n");
          responseContent = `Here are the active financing programs available for **${effectiveVendor}**:\n\n${progList}\n\nPlease click on a program pill below or type the program name to continue.`;
        } else if (progError) {
          responseContent = `⚠️ Could not retrieve programs for **${effectiveVendor}**: ${progError}`;
        }
      } else if (responseType === "LOAN_REQUEST_CONFIRMATION" && mergedTxn.batchId) {
        const batchSiblings = Object.values(transactions).filter(
          (t) => t.batchId === mergedTxn.batchId
        );
        if (batchSiblings.length > 1) {
          const totalAmt = batchSiblings.reduce(
            (sum, t) => sum + (Number(t.invoice?.amount) || 0),
            0
          );
          const cur = mergedTxn.invoice.currency;
          const amtStr = totalAmt.toLocaleString("en-US");
          const vName = mergedTxn.vendor.name;
          const pName = mergedTxn.program.name;
          const count = batchSiblings.length;
          responseContent =
            `I have verified all ${count} extracted invoices for **${vName}** ` +
            `under program **${pName}** (Total Amount: ${cur} ${amtStr}). ` +
            `They will be submitted together in a single work item case. ` +
            `Please review the details below and click Confirm to initiate.`;
        }
      }

      logChatbot("RESPONSE", {
        type: responseType,
        message: responseContent,
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        data: {
          type: responseType,
          requestId: mergedTxn.requestId,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Processing Error:", error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Encountered an error: ${error.message || "Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Work Item Creation (Confirmation step)
   * Strictly bound to requestId and validated transaction data.
   */
  const handleConfirmLoan = async (requestId) => {
    const txn = transactions[requestId];
    if (!txn) {
      alert("Transaction not found. Please refresh and try again.");
      return;
    }

    const batchTxns = txn.batchId
      ? Object.values(transactions).filter((t) => t.batchId === txn.batchId)
      : [txn];

    setIsLoading(true);

    try {
      const res = await createLoanWorkItemTool({
        transaction: txn,
        batchTransactions: batchTxns,
      });
      if (!res.success) {
        throw new Error(res.error || "Failed to create work item on backend.");
      }

      setTransactions((prev) => {
        const next = { ...prev };
        if (res.allTransactions) {
          for (const ut of res.allTransactions) {
            next[ut.requestId] = ut;
          }
        } else {
          next[requestId] = res.transaction;
        }
        return next;
      });

      const assistantMsg = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Work item **${res.wiName}** has been created in the SCF system for ${
          batchTxns.length > 1 ? `all ${batchTxns.length} invoices` : "the invoice"
        }. To confirm and book the loan, please enter the 6-digit verification code below.`,
        timestamp: new Date(),
        data: {
          type: "LOAN_OTP_REQUIRED",
          requestId,
          wiName: res.wiName,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Confirm Loan Error:", error);
      const errorMsg = {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ Work item creation failed: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * OTP Verification and Booking
   * Strictly verifies OTP and calls bookLoan for the specific requestId.
   */
  const handleVerifyOTP = async (requestId) => {
    const txn = transactions[requestId];
    const otpCode = otpInputs[requestId] || "";

    if (!txn) {
      alert("Transaction not found.");
      return;
    }

    if (otpCode.length !== 6) {
      alert("Please enter a valid 6-digit OTP code.");
      return;
    }

    const batchTxns = txn.batchId
      ? Object.values(transactions).filter((t) => t.batchId === txn.batchId)
      : [txn];

    setIsLoading(true);

    try {
      const otpRes = await verifyLoanOtpTool({ transaction: txn, otpCode });
      if (!otpRes.success) {
        throw new Error(otpRes.error || "OTP verification failed.");
      }

      const verifiedBatchTxns = batchTxns.map((t) => ({
        ...t,
        status: TRANSACTION_STATES.OTP_PENDING,
        otp: {
          ...t.otp,
          status: "verified",
        },
      }));

      const bookRes = await bookLoanTool({
        transaction: otpRes.transaction,
        batchTransactions: verifiedBatchTxns,
      });
      if (!bookRes.success) {
        throw new Error(bookRes.error || "Loan booking API rejected the transaction.");
      }

      setTransactions((prev) => {
        const next = { ...prev };
        if (bookRes.allTransactions) {
          for (const ut of bookRes.allTransactions) {
            next[ut.requestId] = ut;
          }
        } else {
          next[requestId] = bookRes.transaction;
        }
        return next;
      });

      // Clear input
      setOtpInputs((prev) => ({ ...prev, [requestId]: "" }));

      const totalAmount = batchTxns.reduce((sum, t) => sum + (Number(t.invoice?.amount) || 0), 0);
      const isMulti = batchTxns.length > 1;

      const successMsg = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎉 Loan Booking Confirmed! Loan case **${
          txn.workItem?.wiName || ""
        }** has been successfully booked with the SCF backend for Vendor **${
          txn.vendor.name || ""
        }** (${
          isMulti
            ? `Total for ${batchTxns.length} invoices: ${
                txn.invoice.currency
              } ${totalAmount.toLocaleString("en-US")}`
            : `Amount: ${txn.invoice.currency} ${Number(txn.invoice.amount).toLocaleString(
                "en-US"
              )}`
        }).`,
        timestamp: new Date(),
        data: {
          type: "LOAN_BOOKING_COMPLETED",
          requestId,
          bookingResult: bookRes.bookingResult,
        },
      };

      setMessages((prev) => [...prev, successMsg]);
    } catch (error) {
      console.error("OTP / Booking Error:", error);
      const errorMsg = {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render Multi-Transaction Pill Bar
   */
  const renderTransactionBar = () => {
    const txnList = Object.values(transactions);
    if (txnList.length <= 1) return null;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1.25rem",
          backgroundColor: "#f1f5f9",
          borderBottom: "1px solid #e2e8f0",
          overflowX: "auto",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: "700",
            color: "#64748b",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Layers size={12} /> Active Invoices:
        </span>
        {txnList.map((t) => {
          const isActive = t.requestId === activeRequestId;
          const label = t.invoice.number || t.vendor.name || t.requestId.split("-")[1] || "Draft";
          return (
            <button
              key={t.requestId}
              type="button"
              onClick={() => setActiveRequestId(t.requestId)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: isActive ? "700" : "500",
                backgroundColor: isActive ? "#004831" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                border: isActive ? "1px solid #004831" : "1px solid #cbd5e1",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                transition: "all 0.15s ease",
              }}
            >
              <span>{label}</span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "0.05rem 0.3rem",
                  borderRadius: "4px",
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#64748b",
                }}
              >
                {t.status.replace(/_/g, " ")}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => handleStartNewTransaction()}
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            border: "1px dashed #6ee7b7",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={12} /> New
        </button>
      </div>
    );
  };

  /**
   * Render Clarification Card
   * Asks ONLY for missing fields; allows inline selection of backend programs.
   */
  const renderClarificationCard = (requestId) => {
    const txn = transactions[requestId] || transactions[activeRequestId];
    if (!txn) return null;

    const batchTxns = txn.batchId
      ? Object.values(transactions).filter((t) => t.batchId === txn.batchId)
      : [txn];
    const isBatch = batchTxns.length > 1;

    const totalAmount = batchTxns.reduce((sum, t) => sum + (Number(t.invoice?.amount) || 0), 0);
    const totalDiscount = batchTxns.reduce(
      (sum, t) => sum + (Number(t.invoice?.discountAmount) || 0),
      0
    );

    const missing = txn.missingFields || [];
    const availableProgs = txn.program.availablePrograms || [];

    return (
      <div
        style={{
          marginTop: "0.75rem",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#004831" }}>
            {isBatch
              ? `BATCH CASE: ${batchTxns.length} Invoices for ${txn.vendor.name || "Vendor"}`
              : `TRANSACTION: ${txn.requestId}`}
          </span>
          <span style={{ fontSize: "10px", color: "#059669", fontWeight: "600" }}>
            Status: {txn.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Existing collected fields summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.375rem 0.75rem",
            fontSize: "11px",
            backgroundColor: "#ffffff",
            padding: "0.625rem",
            borderRadius: "0.5rem",
            border: "1px solid #f1f5f9",
          }}
        >
          <div>
            <span style={{ color: "#94a3b8" }}>Vendor:</span>{" "}
            <strong>{txn.vendor.name || "Missing"}</strong>
          </div>
          <div>
            <span style={{ color: "#94a3b8" }}>Program:</span>{" "}
            <strong style={{ color: txn.program.name ? "#047857" : "#dc2626" }}>
              {txn.program.name || "Missing"}
            </strong>
          </div>
          {isBatch ? (
            <>
              <div>
                <span style={{ color: "#94a3b8" }}>Invoices:</span>{" "}
                <strong>{batchTxns.length} Invoices in Case</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Total Invoice Amount:</span>{" "}
                <strong style={{ color: "#0f172a" }}>
                  {txn.invoice.currency} {totalAmount.toLocaleString("en-US")}
                </strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Total Discount:</span>{" "}
                <strong style={{ color: "#047857" }}>
                  {txn.invoice.currency} {totalDiscount.toLocaleString("en-US")}
                </strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ color: "#94a3b8" }}>Invoice #:</span>{" "}
                <strong>{txn.invoice.number || "Missing"}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Date:</span>{" "}
                <strong>{txn.invoice.date || "Missing"}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Amount:</span>{" "}
                <strong>
                  {txn.invoice.amount !== null
                    ? `${txn.invoice.currency} ${Number(txn.invoice.amount).toLocaleString(
                        "en-US"
                      )}`
                    : "Missing"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Discount:</span>{" "}
                <strong>
                  {txn.invoice.discountAmount !== null
                    ? `${txn.invoice.currency} ${Number(txn.invoice.discountAmount).toLocaleString(
                        "en-US"
                      )}`
                    : "Missing"}
                </strong>
              </div>
            </>
          )}
        </div>

        {isBatch && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              marginTop: "0.25rem",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>
              Invoices included in this Case:
            </span>
            {batchTxns.map((t) => (
              <div
                key={t.requestId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  padding: "0.35rem 0.5rem",
                  borderRadius: "0.375rem",
                  fontSize: "11px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <strong>#{t.invoice.number}</strong> • {t.invoice.date}
                </div>
                <div style={{ color: "#004831", fontWeight: "600" }}>
                  {t.invoice.currency} {Number(t.invoice.amount).toLocaleString("en-US")}
                  {t.invoice.discountAmount !== null && (
                    <span style={{ color: "#047857", marginLeft: "0.5rem" }}>
                      (Disc: {t.invoice.currency}{" "}
                      {Number(t.invoice.discountAmount).toLocaleString("en-US")})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Missing fields alert */}
        {missing.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {missing.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#dc2626",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fee2e2",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <AlertCircle size={10} /> Missing: {f}
              </span>
            ))}
          </div>
        )}

        {/* Real Backend Programs Dropdown / Pills if program is missing */}
        {missing.includes("Program Name") && availableProgs.length > 0 && (
          <div>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#475569" }}>
              Available Backend Programs for {txn.vendor.name}:
            </span>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.25rem" }}
            >
              {availableProgs.map((prog) => (
                <button
                  key={prog}
                  type="button"
                  onClick={() => handleSendMessage(undefined, undefined, `Use program ${prog}`)}
                  style={{
                    padding: "0.3rem 0.625rem",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                    fontSize: "11px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {prog}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render Confirmation Card
   * Shows exact verified request bound strictly to requestId.
   */
  const renderConfirmationCard = (requestId) => {
    const txn = transactions[requestId] || transactions[activeRequestId];
    if (!txn) return null;

    const isConfirmed =
      txn.status === TRANSACTION_STATES.CREATING_WORK_ITEM ||
      txn.status === TRANSACTION_STATES.OTP_PENDING ||
      txn.status === TRANSACTION_STATES.COMPLETED;

    const batchTxns = txn.batchId
      ? Object.values(transactions).filter((t) => t.batchId === txn.batchId)
      : [txn];
    const isBatch = batchTxns.length > 1;

    const totalAmount = batchTxns.reduce((sum, t) => sum + (Number(t.invoice?.amount) || 0), 0);
    const totalDiscount = batchTxns.reduce(
      (sum, t) => sum + (Number(t.invoice?.discountAmount) || 0),
      0
    );

    return (
      <div
        style={{
          marginTop: "0.75rem",
          padding: "1.125rem",
          backgroundColor: "#ffffff",
          border: "1px solid #a7f3d0",
          borderRadius: "0.875rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#004831" }}>
            ✓ Verified Loan Booking Request{isBatch ? ` (${batchTxns.length} Invoices)` : ""}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              padding: "0.15rem 0.4rem",
              borderRadius: "4px",
            }}
          >
            {isBatch ? `BATCH (${batchTxns.length})` : txn.requestId}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem 1rem",
            fontSize: "11px",
            backgroundColor: "#f8fafc",
            padding: "0.75rem",
            borderRadius: "0.5rem",
          }}
        >
          <div>
            <span style={{ color: "#94a3b8" }}>Vendor:</span> <strong>{txn.vendor.name}</strong>
          </div>
          <div>
            <span style={{ color: "#94a3b8" }}>Program:</span>{" "}
            <strong style={{ color: "#047857" }}>{txn.program.name}</strong>
          </div>
          {isBatch ? (
            <>
              <div>
                <span style={{ color: "#94a3b8" }}>Invoices:</span>{" "}
                <strong>{batchTxns.length} Invoices in Case</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Total Invoice Amount:</span>{" "}
                <strong style={{ color: "#0f172a" }}>
                  {txn.invoice.currency} {totalAmount.toLocaleString("en-US")}
                </strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Total Discount Amount:</span>{" "}
                <strong style={{ color: "#047857" }}>
                  {txn.invoice.currency} {totalDiscount.toLocaleString("en-US")}
                </strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ color: "#94a3b8" }}>Invoice #:</span>{" "}
                <strong>{txn.invoice.number}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Date:</span> <strong>{txn.invoice.date}</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Invoice Amount:</span>{" "}
                <strong style={{ color: "#0f172a" }}>
                  {txn.invoice.currency} {Number(txn.invoice.amount).toLocaleString("en-US")}
                </strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Discount Amount:</span>{" "}
                <strong style={{ color: "#047857" }}>
                  {txn.invoice.currency}{" "}
                  {Number(txn.invoice.discountAmount).toLocaleString("en-US")}
                </strong>
              </div>
            </>
          )}
        </div>

        {isBatch && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              marginTop: "0.25rem",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>
              Invoices included in this Case:
            </span>
            {batchTxns.map((t) => (
              <div
                key={t.requestId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                  padding: "0.35rem 0.5rem",
                  borderRadius: "0.375rem",
                  fontSize: "11px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <strong>#{t.invoice.number}</strong> • {t.invoice.date}
                </div>
                <div style={{ color: "#004831", fontWeight: "600" }}>
                  {t.invoice.currency} {Number(t.invoice.amount).toLocaleString("en-US")}
                  {t.invoice.discountAmount !== null && (
                    <span style={{ color: "#047857", marginLeft: "0.5rem" }}>
                      (Disc: {t.invoice.currency}{" "}
                      {Number(t.invoice.discountAmount).toLocaleString("en-US")})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isConfirmed && (
          <button
            type="button"
            onClick={() => handleConfirmLoan(txn.requestId)}
            disabled={isLoading}
            style={{
              padding: "0.75rem",
              backgroundColor: "#004831",
              color: "#ffffff",
              borderRadius: "0.625rem",
              fontWeight: "700",
              fontSize: "12px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <CheckCircle2 size={16} /> Confirm & Initiate Work Item
            {isBatch ? ` (${batchTxns.length} Invoices)` : ""}
          </button>
        )}
      </div>
    );
  };

  /**
   * Render OTP Verification Card
   * Strictly bound to requestId and rejects hardcoded bypasses.
   */
  const renderOtpCard = (requestId) => {
    const txn = transactions[requestId] || transactions[activeRequestId];
    if (!txn || txn.status !== TRANSACTION_STATES.OTP_PENDING) return null;

    const currentOtp = otpInputs[requestId] || "";
    const batchTxns = txn.batchId
      ? Object.values(transactions).filter((t) => t.batchId === txn.batchId)
      : [txn];
    const isBatch = batchTxns.length > 1;

    return (
      <div
        style={{
          marginTop: "0.75rem",
          padding: "1.125rem",
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "0.875rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400e" }}>
          <AlertCircle size={18} />
          <span style={{ fontWeight: "700", fontSize: "12px" }}>
            OTP Authorization Required ({txn.workItem?.wiName || txn.requestId})
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "11px", color: "#78350f" }}>
          A 6-digit confirmation code was sent to your registered channel for Work Item{" "}
          <strong>{txn.workItem?.wiName}</strong>
          {isBatch ? ` (${batchTxns.length} Invoices)` : ""}. Please enter it to complete booking:
        </p>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            maxLength={6}
            value={currentOtp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setOtpInputs((prev) => ({ ...prev, [requestId]: val }));
            }}
            placeholder="Enter 6-Digit OTP"
            style={{
              padding: "0.625rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid #d97706",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "0.2em",
              textAlign: "center",
              width: "180px",
              outline: "none",
              backgroundColor: "#ffffff",
            }}
          />

          <button
            type="button"
            onClick={() => handleVerifyOTP(requestId)}
            disabled={currentOtp.length !== 6 || isLoading}
            style={{
              padding: "0.625rem 1rem",
              backgroundColor: "#004831",
              color: "#ffffff",
              borderRadius: "0.5rem",
              fontWeight: "700",
              fontSize: "12px",
              border: "none",
              cursor: currentOtp.length !== 6 || isLoading ? "not-allowed" : "pointer",
              opacity: currentOtp.length !== 6 || isLoading ? 0.6 : 1,
            }}
          >
            Verify & Book Loan
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render Batch Document Invoices Card
   */
  const renderBatchExtractedCard = (requestIds) => {
    return (
      <div
        style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        {requestIds.map((rId) => {
          const t = transactions[rId];
          if (!t) return null;
          return (
            <div
              key={rId}
              style={{
                padding: "0.75rem",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
              }}
            >
              <div>
                <strong>Invoice #{t.invoice.number || "Unspecified"}</strong> •{" "}
                {t.vendor.name || "Vendor"}
                <div style={{ color: "#64748b", fontSize: "10px" }}>
                  Amount: {t.invoice.currency} {Number(t.invoice.amount).toLocaleString("en-US")} |
                  Disc:{" "}
                  {t.invoice.discountAmount !== null
                    ? `${t.invoice.currency} ${Number(t.invoice.discountAmount).toLocaleString(
                        "en-US"
                      )}`
                    : "Missing"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRequestId(rId)}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Review
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render Transaction Information Result Card
   * Displays actual API response data without fabrication.
   */
  const renderTransactionInfoCard = (cardData) => {
    const { result, criteria, persona, records = [] } = cardData || {};
    if (!result) return null;

    const getField = (obj, keys, defaultVal = "-") => {
      if (!obj || typeof obj !== "object") return defaultVal;
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
          return obj[k];
        }
      }
      return defaultVal;
    };

    const formatCurrency = (val) => {
      if (val === undefined || val === null || val === "" || val === "-") return "-";
      const num = Number(val);
      if (isNaN(num)) return String(val);
      return `INR ${num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    // Check which columns are actually present in the backend response
    const hasTxnRef = records.some(
      (r) =>
        getField(
          r,
          ["transactionrefnum", "transactionRefNum", "wiName", "transactionId", "id"],
          null
        ) !== null
    );
    const hasInvoiceNumber = records.some(
      (r) => getField(r, ["invoicenumber", "invoiceNumber", "invoiceNo"], null) !== null
    );
    const hasVendor = records.some(
      (r) => getField(r, ["vendorname", "vendorName", "vendor"], null) !== null
    );
    const hasAnchor = records.some(
      (r) => getField(r, ["anchorname", "anchorName", "anchor"], null) !== null
    );
    const hasInvoiceDate = records.some(
      (r) => getField(r, ["invoicedate", "invoiceDate", "date"], null) !== null
    );
    const hasDisbursedDate = records.some(
      (r) => getField(r, ["disbursedate", "disburseDate"], null) !== null
    );
    const hasDueDate = records.some((r) => getField(r, ["duedate", "dueDate"], null) !== null);
    const hasInvoiceAmount = records.some(
      (r) => getField(r, ["invoiceamount", "invoiceAmount"], null) !== null
    );
    const hasDisburseAmount = records.some(
      (r) => getField(r, ["disburseamount", "disburseAmount", "amount"], null) !== null
    );
    const hasStatus = records.some(
      (r) => getField(r, ["status", "workitemStatus", "state"], null) !== null
    );

    return (
      <div
        style={{
          marginTop: "0.75rem",
          padding: "1rem",
          backgroundColor: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxWidth: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#004831" }}>
            📋 Transaction Information
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#065f46",
              backgroundColor: "#ecfdf5",
              padding: "0.15rem 0.5rem",
              borderRadius: "12px",
              border: "1px solid #a7f3d0",
            }}
          >
            {records.length} {records.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        {/* Business Context Pills (Program / Vendor) if present */}
        {(criteria?.vendorCode || criteria?.program) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {criteria?.vendorCode && (
              <span
                style={{
                  fontSize: "10px",
                  color: "#334155",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                Vendor Code: <strong>{criteria.vendorCode}</strong>
              </span>
            )}
            {criteria?.program && (
              <span
                style={{
                  fontSize: "10px",
                  color: "#065f46",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                Program: <strong>{criteria.program}</strong>
              </span>
            )}
          </div>
        )}

        {/* Content Table or Empty State */}
        {records && records.length > 0 ? (
          <div
            style={{
              maxHeight: "340px",
              overflowY: "auto",
              overflowX: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              backgroundColor: "#ffffff",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th style={{ padding: "0.5rem 0.75rem" }}>#</th>
                  {hasTxnRef && <th style={{ padding: "0.5rem 0.75rem" }}>Transaction Ref</th>}
                  {hasInvoiceNumber && <th style={{ padding: "0.5rem 0.75rem" }}>Invoice #</th>}
                  {hasVendor && <th style={{ padding: "0.5rem 0.75rem" }}>Vendor</th>}
                  {hasAnchor && <th style={{ padding: "0.5rem 0.75rem" }}>Anchor</th>}
                  {hasInvoiceDate && <th style={{ padding: "0.5rem 0.75rem" }}>Invoice Date</th>}
                  {hasDisbursedDate && (
                    <th style={{ padding: "0.5rem 0.75rem" }}>Disbursed Date</th>
                  )}
                  {hasDueDate && <th style={{ padding: "0.5rem 0.75rem" }}>Due Date</th>}
                  {hasInvoiceAmount && (
                    <th style={{ padding: "0.5rem 0.75rem" }}>Invoice Amount</th>
                  )}
                  {hasDisburseAmount && (
                    <th style={{ padding: "0.5rem 0.75rem" }}>Disbursed Amount</th>
                  )}
                  {hasStatus && <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => {
                  const refId = getField(
                    rec,
                    ["transactionrefnum", "transactionRefNum", "wiName", "transactionId", "id"],
                    `REC-${idx + 1}`
                  );
                  const invoiceNo = getField(
                    rec,
                    ["invoicenumber", "invoiceNumber", "invoiceNo"],
                    "-"
                  );
                  const vendor = getField(rec, ["vendorname", "vendorName", "vendor"], "-");
                  const anchor = getField(rec, ["anchorname", "anchorName", "anchor"], "-");
                  const invoiceDate = getField(rec, ["invoicedate", "invoiceDate", "date"], "-");
                  const disburseDate = getField(rec, ["disbursedate", "disburseDate"], "-");
                  const dueDate = getField(rec, ["duedate", "dueDate"], "-");
                  const invoiceAmt = getField(rec, ["invoiceamount", "invoiceAmount"], "-");
                  const disburseAmt = getField(
                    rec,
                    ["disburseamount", "disburseAmount", "amount"],
                    "-"
                  );
                  const status = getField(rec, ["status", "workitemStatus", "state"], null);

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                      }}
                    >
                      <td style={{ padding: "0.5rem 0.75rem", color: "#94a3b8" }}>{idx + 1}</td>
                      {hasTxnRef && (
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            fontWeight: "600",
                            color: "#0f172a",
                            fontFamily: "monospace",
                          }}
                        >
                          {refId}
                        </td>
                      )}
                      {hasInvoiceNumber && (
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            fontWeight: "600",
                            color: "#0369a1",
                          }}
                        >
                          {invoiceNo}
                        </td>
                      )}
                      {hasVendor && (
                        <td style={{ padding: "0.5rem 0.75rem", color: "#334155" }}>{vendor}</td>
                      )}
                      {hasAnchor && (
                        <td style={{ padding: "0.5rem 0.75rem", color: "#334155" }}>{anchor}</td>
                      )}
                      {hasInvoiceDate && (
                        <td style={{ padding: "0.5rem 0.75rem", color: "#64748b" }}>
                          {invoiceDate}
                        </td>
                      )}
                      {hasDisbursedDate && (
                        <td style={{ padding: "0.5rem 0.75rem", color: "#64748b" }}>
                          {disburseDate}
                        </td>
                      )}
                      {hasDueDate && (
                        <td style={{ padding: "0.5rem 0.75rem", color: "#64748b" }}>{dueDate}</td>
                      )}
                      {hasInvoiceAmount && (
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {formatCurrency(invoiceAmt)}
                        </td>
                      )}
                      {hasDisburseAmount && (
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            fontWeight: "600",
                            color: "#059669",
                          }}
                        >
                          {formatCurrency(disburseAmt)}
                        </td>
                      )}
                      {hasStatus && (
                        <td style={{ padding: "0.5rem 0.75rem" }}>
                          <span
                            style={{
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              backgroundColor: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              color: "#166534",
                              fontSize: "10px",
                              fontWeight: "500",
                            }}
                          >
                            {status}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: "1rem",
              textAlign: "center",
              backgroundColor: "#f8fafc",
              borderRadius: "0.5rem",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            No transaction records found matching the requested parameters.
          </div>
        )}
      </div>
    );
  };

  /**
   * Render formatted message text, parsing markdown bold, code, and italic
   * so bold text is highlighted in bold weight and accent color instead of raw asterisks.
   */
  const renderFormattedMessage = (content, isUser) => {
    if (!content || typeof content !== "string") return null;

    const parseInline = (text, lineKey) => {
      const regex = /(\*\*([^*]+?)\*\*|__([^_]+?)__|`([^`]+?)`|\*([^*]+?)\*|_([^_]+?)_)/g;
      const elements = [];
      let lastIdx = 0;
      let match;
      let tokenIdx = 0;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          elements.push(
            <React.Fragment key={`${lineKey}-t-${tokenIdx++}`}>
              {text.substring(lastIdx, match.index)}
            </React.Fragment>
          );
        }

        const boldText = match[2] || match[3];
        const codeText = match[4];
        const italicText = match[5] || match[6];

        if (boldText !== undefined) {
          elements.push(
            <strong
              key={`${lineKey}-b-${tokenIdx++}`}
              style={{
                fontWeight: 700,
                color: isUser ? "#ffffff" : "#004831",
              }}
            >
              {boldText}
            </strong>
          );
        } else if (codeText !== undefined) {
          elements.push(
            <code
              key={`${lineKey}-c-${tokenIdx++}`}
              style={{
                fontFamily: "monospace",
                fontSize: "0.85em",
                backgroundColor: isUser ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                color: isUser ? "#ffffff" : "#0f172a",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
              }}
            >
              {codeText}
            </code>
          );
        } else if (italicText !== undefined) {
          elements.push(
            <em key={`${lineKey}-i-${tokenIdx++}`} style={{ fontStyle: "italic" }}>
              {italicText}
            </em>
          );
        }

        lastIdx = regex.lastIndex;
      }

      if (lastIdx < text.length) {
        elements.push(
          <React.Fragment key={`${lineKey}-t-${tokenIdx++}`}>
            {text.substring(lastIdx)}
          </React.Fragment>
        );
      }

      return elements.length > 0 ? elements : text;
    };

    const lines = content.split("\n");
    return (
      <div style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {lines.map((line, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && "\n"}
            {parseInline(line, `l-${idx}`)}
          </React.Fragment>
        ))}
      </div>
    );
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
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.88; }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "1rem 1.5rem",
          background: "linear-gradient(135deg, #003824 0%, #004831 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopLeftRadius: embedded ? "1rem" : isFullScreen ? "1.25rem" : "1.5rem",
          borderTopRightRadius: embedded ? "1rem" : isFullScreen ? "1.25rem" : "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isLoading ? "0 0 14px rgba(74, 222, 128, 0.5)" : "none",
              animation: isLoading ? "pulseGlow 2s infinite ease-in-out" : "none",
            }}
          >
            <Sparkles size={22} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3
                style={{
                  fontWeight: "bold",
                  fontSize: "1.05rem",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                SCFAgentic AI Assistant (Nexus AI)
              </h3>
              {isLoading && (
                <span
                  style={{
                    padding: "0.1rem 0.5rem",
                    backgroundColor: "rgba(74, 222, 128, 0.2)",
                    border: "1px solid rgba(74, 222, 128, 0.4)",
                    color: "#4ade80",
                    borderRadius: "9999px",
                    fontSize: "0.6875rem",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <Loader2 size={10} className="animate-spin" />
                  Active
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#a7f3d0",
                margin: "0.15rem 0 0 0",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  backgroundColor: "#4ade80",
                  borderRadius: "50%",
                  display: "inline-block",
                  boxShadow: "0 0 6px #4ade80",
                  animation: isLoading ? "pulseGlow 1.2s infinite ease-in-out" : "none",
                }}
              ></span>
              {isLoading
                ? `Reasoning (Step ${loadingStage + 1}/4 • ${loadingSeconds.toFixed(1)}s)...`
                : `Active ID: ${activeRequestId} • Trusted SCF Agent`}
            </p>
          </div>
        </div>

        {!embedded && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={
                isFullScreen ? "Switch to compact floating window" : "Expand close to full screen"
              }
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                padding: "0.45rem",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Close Assistant"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                padding: "0.45rem",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Multi-Transaction Tab Bar */}
      {renderTransactionBar()}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: isFullScreen ? "1.5rem 2.5rem" : "1.25rem",
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
              Ask me about invoice financing, settlement status, loan booking, or upload an invoice
              PDF to extract real values.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              animation: "fadeIn 0.2s ease",
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
                {renderFormattedMessage(msg.content, msg.role === "user")}
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
                {/* Clarification Card */}
                {msg.data?.type === "CLARIFICATION" && renderClarificationCard(msg.data.requestId)}
                {/* Confirmation Card */}
                {msg.data?.type === "LOAN_REQUEST_CONFIRMATION" &&
                  renderConfirmationCard(msg.data.requestId)}
                {/* OTP Interface */}
                {msg.data?.type === "LOAN_OTP_REQUIRED" && renderOtpCard(msg.data.requestId)}
                {/* Batch Extracted Invoices */}
                {msg.data?.type === "DOCUMENT_BATCH_EXTRACTED" &&
                  renderBatchExtractedCard(msg.data.requestIds)}
                {/* Transaction Information Card */}
                {msg.data?.type === "TRANSACTION_INQUIRY_RESULT" &&
                  renderTransactionInfoCard(msg.data)}
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
              flexDirection: "column",
              gap: "0.75rem",
              padding: "1.125rem 1.25rem",
              backgroundColor: "#ffffff",
              borderRadius: "1.25rem",
              border: "1px solid #a7f3d0",
              boxShadow:
                "0 10px 25px -5px rgba(5, 150, 105, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              maxWidth: isFullScreen ? "820px" : "100%",
              margin: isFullScreen ? "0 auto" : "0",
              width: "100%",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #059669, #004831)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(5, 150, 105, 0.4)",
                    animation: "pulseGlow 2s infinite ease-in-out",
                  }}
                >
                  <Sparkles size={16} style={{ color: "#a7f3d0" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.875rem", color: "#0f172a" }}>
                      Nexus AI Reasoning
                    </span>
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        borderRadius: "9999px",
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      Step {loadingStage + 1} of {REASONING_STAGES.length}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Supply Chain Finance Intelligence Engine
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.625rem",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                <Loader2 size={13} className="animate-spin" style={{ color: "#059669" }} />
                <span>{loadingSeconds.toFixed(1)}s</span>
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#f0fdf4",
                borderRadius: "0.75rem",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    animation: "pulseGlow 1.2s infinite ease-in-out",
                    shrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#065f46" }}>
                    {REASONING_STAGES[loadingStage]?.title || "Reasoning..."}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#047857" }}>
                    {REASONING_STAGES[loadingStage]?.detail || "Analyzing data..."}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "4px", alignItems: "center", shrink: 0 }}>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    animation: "bounceDot 1.4s infinite ease-in-out 0ms",
                  }}
                />
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    animation: "bounceDot 1.4s infinite ease-in-out 200ms",
                  }}
                />
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    animation: "bounceDot 1.4s infinite ease-in-out 400ms",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.375rem",
                marginTop: "0.125rem",
              }}
            >
              {REASONING_STAGES.map((stage, idx) => {
                const isCompleted = idx < loadingStage;
                const isCurrent = idx === loadingStage;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "0.375rem 0.5rem",
                      borderRadius: "0.5rem",
                      backgroundColor: isCompleted ? "#ecfdf5" : isCurrent ? "#f0fdf4" : "#f8fafc",
                      border: isCompleted
                        ? "1px solid #a7f3d0"
                        : isCurrent
                        ? "1px solid #34d399"
                        : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor: isCompleted
                          ? "#059669"
                          : isCurrent
                          ? "#10b981"
                          : "#cbd5e1",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: "bold",
                        shrink: 0,
                      }}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: isCurrent ? "700" : "500",
                        color: isCompleted ? "#065f46" : isCurrent ? "#047857" : "#94a3b8",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {stage.title.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => handleSendMessage(e)}
        style={{
          padding: isFullScreen ? "1rem 2.5rem" : "1rem",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          borderBottomLeftRadius: embedded ? "1rem" : isFullScreen ? "1.25rem" : "1.5rem",
          borderBottomRightRadius: embedded ? "1rem" : isFullScreen ? "1.25rem" : "1.5rem",
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
            placeholder={
              isLoading
                ? `Nexus AI is processing your request (${loadingSeconds.toFixed(1)}s)...`
                : "Ask AI about invoices, loans, settlements..."
            }
            style={{
              flex: 1,
              padding: "0.625rem 1rem",
              border: isLoading ? "1px solid #10b981" : "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              outline: "none",
              backgroundColor: isLoading ? "#f0fdf4" : "#ffffff",
              transition: "all 0.2s ease",
            }}
          />

          <button
            type="submit"
            disabled={(!inputValue.trim() && !attachedFile) || isLoading}
            style={{
              padding: "0.625rem 1.125rem",
              backgroundColor: "#004831",
              opacity: (!inputValue.trim() && !attachedFile) || isLoading ? 0.6 : 1,
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
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
        <>
          {isFullScreen && (
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.52)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 99998,
                transition: "opacity 0.25s ease",
              }}
            />
          )}

          <div
            style={
              isFullScreen
                ? {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(1440px, 94vw)",
                    height: "min(920px, 92vh)",
                    maxWidth: "96vw",
                    maxHeight: "94vh",
                    zIndex: 99999,
                    borderRadius: "1.25rem",
                    boxShadow:
                      "0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }
                : {
                    position: "fixed",
                    bottom: "6.5rem",
                    right: "2.5rem",
                    width: "450px",
                    maxWidth: "92vw",
                    height: "640px",
                    maxHeight: "82vh",
                    zIndex: 99999,
                    borderRadius: "1.5rem",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.28)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }
            }
          >
            {renderContent()}
          </div>
        </>
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

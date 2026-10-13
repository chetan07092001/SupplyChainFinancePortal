export const SCF_DUMMY_DATA = {
  products: [
    {
      Product: "SCF-VF-01",
      Product_Name: "SCFVFProd01",
      Anchor: "BUY0003335",
      Product_Status: "Active",
      Maximum_Product_Limit: 10000000,
      Product_Currency: "INR",
    },
    {
      Product: "SCF-VF-02",
      Product_Name: "SCFVFPROD02",
      Anchor: "BUY0003335",
      Product_Status: "Active",
      Maximum_Product_Limit: 5000000,
      Product_Currency: "INR",
    },
  ],
  programs: [
    {
      ProgramId: "PROG-10201-ID",
      ProgramName: "SCFVFProgram1",
      ProductId: "SCF-VF-01",
      Anchor: "BUY0003335",
      Program_Limit: 4000000,
      Program_Available_Amount: 1795000,
      Program_Utilized_Amount: 2205000,
      Product_Status: "Active",
    },
    {
      ProgramId: "PROG-10202-ID",
      ProgramName: "SCFVFProgram2",
      ProductId: "SCF-VF-01",
      Anchor: "BUY0003335",
      Program_Limit: 6000000,
      Program_Available_Amount: 2940000,
      Program_Utilized_Amount: 3060000,
      Product_Status: "Active",
    },
    {
      ProgramId: "PROG-10203-ID",
      ProgramName: "SCFVFProg3",
      ProductId: "SCF-VF-02",
      Anchor: "BUY0003335",
      Program_Limit: 5000000,
      Program_Available_Amount: 3965000,
      Program_Utilized_Amount: 1035000,
      Product_Status: "Active",
    },
  ],
  customers: [
    {
      CustomerID: "BUY0003335",
      CustomerName: "Buyer 1 (Anchor)",
      Anchor_Code: "BUY0003335",
      Status: "Active",
      Industry: "Manufacturing",
      Account_Number: "ACC-BUY-001",
      EmailID: "finance@buyer1.com",
    },
    {
      CustomerID: "VEN50201",
      CustomerName: "Vendor 1",
      Anchor_Code: "BUY0003335",
      Status: "Active",
      Industry: "Logistics",
      Account_Number: "ACC-VEN-201",
      EmailID: "ops@vendor1.com",
    },
    {
      CustomerID: "VEN50202",
      CustomerName: "Vendor 2",
      Anchor_Code: "BUY0003335",
      Status: "Active",
      Industry: "Raw Materials",
      Account_Number: "ACC-VEN-202",
      EmailID: "sales@vendor2.com",
    },
    {
      CustomerID: "VEN50203",
      CustomerName: "Vendor 3",
      Anchor_Code: "BUY0003335",
      Status: "Active",
      Industry: "Packaging",
      Account_Number: "ACC-VEN-203",
      EmailID: "billing@vendor3.com",
    },
    {
      CustomerID: "VEN50204",
      CustomerName: "Vendor 4",
      Anchor_Code: "BUY0003335",
      Status: "Active",
      Industry: "IT Services",
      Account_Number: "ACC-VEN-204",
      EmailID: "accounts@vendor4.com",
    },
    {
      CustomerID: "VEN50205",
      CustomerName: "Vendor 5",
      Anchor_Code: "BUY0003335",
      Status: "Active",
      Industry: "Consulting",
      Account_Number: "ACC-VEN-205",
      EmailID: "info@vendor5.com",
    },
  ],
  disbursedInvoices: [
    ...Array.from({ length: 60 }).map((_, i) => {
      const monthOffset = Math.floor(i / 5);
      const date = new Date(2025, 3 + monthOffset, 10 + (i % 5) * 4);
      const dateString = date.toISOString().split("T")[0];
      const dueDate = new Date(date);
      dueDate.setMonth(dueDate.getMonth() + 3);
      const dueDateString = dueDate.toISOString().split("T")[0];
      const programId =
        i % 3 === 0 ? "PROG-10201-ID" : i % 3 === 1 ? "PROG-10202-ID" : "PROG-10203-ID";
      const vendorId = `VEN5020${(i % 5) + 1}`;
      const amount = 500000 + i * 10000;
      return {
        id: i + 1,
        vendor_code: vendorId,
        anchor_code: "BUY0003335",
        transaction_ref_number: `TXN-${String(i + 1).padStart(3, "0")}`,
        transaction_date: dateString,
        invoice_number: `INV-${100 + i}`,
        invoice_amount: amount,
        disburse_amount: amount * 0.9,
        disbursement_date: dateString,
        due_date: dueDateString,
        ProgramId: programId,
      };
    }),
  ],
  settlements: [
    ...Array.from({ length: 60 }).map((_, i) => {
      const invoice = {
        monthOffset: Math.floor(i / 5),
        date: new Date(2025, 3 + Math.floor(i / 5), 10 + (i % 5) * 4),
        amount: 500000 + i * 10000,
        programId: i % 3 === 0 ? "PROG-10201-ID" : i % 3 === 1 ? "PROG-10202-ID" : "PROG-10203-ID",
        vendorId: `VEN5020${(i % 5) + 1}`,
      };

      const disburseAmount = invoice.amount * 0.9;
      const innerIndex = i % 5;
      let status;

      if (innerIndex < 2) {
        status = "Fully Settled";
      } else if (innerIndex < 4) {
        status = "Partially Settled";
      } else {
        status = "Settlement";
      }

      const programName =
        invoice.programId === "PROG-10201-ID"
          ? "SCFVFProgram1"
          : invoice.programId === "PROG-10202-ID"
          ? "SCFVFProgram2"
          : "SCFVFProg3";
      const vendorName = `Vendor ${(i % 5) + 1}`;
      const productId = invoice.programId === "PROG-10203-ID" ? "SCF-VF-02" : "SCF-VF-01";

      const date = invoice.date;
      const dateString = date.toISOString().split("T")[0];
      const dueDate = new Date(date);
      dueDate.setMonth(dueDate.getMonth() + 3);
      const dueDateString = dueDate.toISOString().split("T")[0];

      let outstandingAmount = 0;
      if (status === "Partially Settled") {
        outstandingAmount = Math.round(disburseAmount * 0.45);
      } else if (status === "Settlement") {
        outstandingAmount = Math.round(disburseAmount);
      }

      return {
        id: `s-${i + 1}`,
        referenceNumber: `STL-2026-${String(i + 1).padStart(3, "0")}`,
        anchorName: "Buyer 1 (Anchor)",
        anchorCode: "BUY0003335",
        spokeName: vendorName,
        spokeCode: invoice.vendorId,
        transactionDate: dateString,
        status: status,
        programName: programName,
        productType: "Vendor Finance",
        discountAmount: Math.round(invoice.amount * 0.1),
        outstandingAmount: outstandingAmount,
        productId: productId,
        disbursementDate: dateString,
        dueDate: dueDateString,
      };
    }),
  ],
  spokeDetails: [
    {
      ProgramId: "PROG-10201-ID",
      SpokeCode: "VEN50201",
      SpokeName: "Vendor 1",
      Spoke_Limit: 1000000,
      Spoke_Utilized_Limit: 810000,
      Spoke_Available_Limit: 190000,
    },
    {
      ProgramId: "PROG-10201-ID",
      SpokeCode: "VEN50202",
      SpokeName: "Vendor 2",
      Spoke_Limit: 1000000,
      Spoke_Utilized_Limit: 720000,
      Spoke_Available_Limit: 280000,
    },
    {
      ProgramId: "PROG-10201-ID",
      SpokeCode: "VEN50204",
      SpokeName: "Vendor 4",
      Spoke_Limit: 1000000,
      Spoke_Utilized_Limit: 675000,
      Spoke_Available_Limit: 325000,
    },
    {
      ProgramId: "PROG-10202-ID",
      SpokeCode: "VEN50203",
      SpokeName: "Vendor 3",
      Spoke_Limit: 2000000,
      Spoke_Utilized_Limit: 270000,
      Spoke_Available_Limit: 1730000,
    },
    {
      ProgramId: "PROG-10202-ID",
      SpokeCode: "VEN50204",
      SpokeName: "Vendor 4",
      Spoke_Limit: 2000000,
      Spoke_Utilized_Limit: 1080000,
      Spoke_Available_Limit: 920000,
    },
    {
      ProgramId: "PROG-10202-ID",
      SpokeCode: "VEN50202",
      SpokeName: "Vendor 2",
      Spoke_Limit: 1000000,
      Spoke_Utilized_Limit: 810000,
      Spoke_Available_Limit: 190000,
    },
    {
      ProgramId: "PROG-10202-ID",
      SpokeCode: "VEN50205",
      SpokeName: "Vendor 5",
      Spoke_Limit: 1000000,
      Spoke_Utilized_Limit: 900000,
      Spoke_Available_Limit: 100000,
    },
    {
      ProgramId: "PROG-10203-ID",
      SpokeCode: "VEN50205",
      SpokeName: "Vendor 5",
      Spoke_Limit: 3000000,
      Spoke_Utilized_Limit: 540000,
      Spoke_Available_Limit: 2460000,
    },
    {
      ProgramId: "PROG-10203-ID",
      SpokeCode: "VEN50203",
      SpokeName: "Vendor 3",
      Spoke_Limit: 2000000,
      Spoke_Utilized_Limit: 495000,
      Spoke_Available_Limit: 1505000,
    },
  ],
};

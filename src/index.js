import React from "react";
import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import Loader from "components/Loading/Loader";
import userContextProvider from "context/UserContextProvider";
import { MaterialUIControllerProvider } from "context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Draft from "layouts/Draft/Draft";
import UserContext from "context/userContext";
const Login = lazy(() => import("components/Login/Login"));
const Tables = lazy(() => import("layouts/tables"));

const App = lazy(() => import("App"));
const Dashboard = lazy(() => import("layouts/dashboard"));
const Billing = lazy(() => import("layouts/billing"));
const Descrepency = lazy(() => import("layouts/Descrepency/Descrepency"));
const Settelment = lazy(() => import("layouts/Settelment/Settelment"));
const ApprovalReq = lazy(() => import("layouts/ApprovalReq/ApprovalReq"));
const Checker = lazy(() => import("layouts/Checker/Checker"));
const UploadData = lazy(() => import("layouts/UploadData/UploadData"));
const EOnboarding = lazy(() => import("layouts/E-onboarding/E-onboarding"));
const EarlyPaymentRecommendation = lazy(() =>
  import("layouts/EarlyPaymentRecommendation/EarlyPaymentRecommendation")
);
const SupplierReview = lazy(() => import("layouts/SupplierReview/SupplierReview"));
const Invoice = lazy(() => import("layouts/Invoice/Invoice"));
const UploadPO = lazy(() => import("layouts/UploadPO/UploadPo"));
const ApprovePo = lazy(() => import("layouts/ApprovePO/Approvepo"));
const POStatus = lazy(() => import("layouts/POStatus/POstatus"));
const Amendment = lazy(() => import("layouts/Amendment/Amendment"));
const newDashboard = lazy(() => import("layouts/NewDashboard/Dashboard"));

const container = document.getElementById("app");
const root = createRoot(container);
const queryClient = new QueryClient();
root.render(
  <HashRouter>
    <MaterialUIControllerProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Login />}></Route>
            <Route path="/admin" element={<App />}>
              <Route path="dashboard" element={<Dashboard></Dashboard>}></Route>
              <Route path="all_cases" element={<Tables />}></Route>
              <Route path="stock_audit" element={<Billing />}></Route>
              <Route path="discrepancy" element={<Descrepency />}></Route>
              <Route path="settlement" element={<Settelment />}></Route>
              <Route path="approval_required" element={<ApprovalReq />}></Route>
              <Route path="draft" element={<Draft />}></Route>
              <Route path="uploadData" element={<UploadData />}></Route>
              <Route path="checker" element={<Checker />}></Route>
              <Route path="SupplierReview" element={<SupplierReview />}></Route>
              <Route path="invoice" element={<Invoice />}></Route>
              <Route path="upload_PO" element={<UploadPO />}></Route>
              <Route path="approve_PO" element={<ApprovePo />}></Route>
              <Route path="PO_status" element={<POStatus />}></Route>
              <Route path="amendment" element={<Amendment />}></Route>
              <Route path="E-onboarding" element={<EOnboarding />}></Route>
              <Route
                path="EarlyPaymentRecommendation"
                element={<EarlyPaymentRecommendation />}
              ></Route>
              <Route path="newDashboard" element={<Dashboard />}></Route>
            </Route>
          </Routes>
        </Suspense>
      </QueryClientProvider>
    </MaterialUIControllerProvider>
  </HashRouter>
);

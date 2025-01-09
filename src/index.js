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
              <Route path="checker" element={<Checker />}></Route>
            </Route>
          </Routes>
        </Suspense>
      </QueryClientProvider>
    </MaterialUIControllerProvider>
  </HashRouter>
);

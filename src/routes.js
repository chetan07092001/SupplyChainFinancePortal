import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import Login from "components/Login/Login";
import Notifications from "layouts/notifications";

// @mui icons
import Icon from "@mui/material/Icon";
import Descrepency from "layouts/Descrepency/Descrepency";
import Settelment from "layouts/Settelment/Settelment";
import ApprovalReq from "layouts/ApprovalReq/ApprovalReq";
import Upload from "components/Upload";
import Draft from "layouts/Draft/Draft";
import Checker from "layouts/Checker/Checker";
import UploadData from "layouts/UploadData/UploadData";
import SupplierReview from "layouts/SupplierReview/SupplierReview";
import Invoice from "layouts/Invoice/Invoice";
import UploadPo from "layouts/UploadPO/UploadPo";
import Approvepo from "layouts/ApprovePO/Approvepo";
import POStatus from "layouts/POStatus/POstatus";
import Amendment from "layouts/Amendment/Amendment";
import EOnboarding from "layouts/E-onboarding/E-onboarding";
import AnchorMaker from "layouts/E-onboarding/AnchorMaker";
import AnchorChecker from "layouts/E-onboarding/AnchorChecker";
import DraftTab from "layouts/E-onboarding/DraftTab";
import EarlyPaymentRecommendation from "layouts/EarlyPaymentRecommendation/EarlyPaymentRecommendation";
import LimitInsights from "layouts/LimitInsights/LimitInsights";
let routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "All Cases",
    key: "tables",
    icon: <Icon fontSize="small">folder_open</Icon>,
    route: "all_cases",
    component: <Tables />,
  },
  {
    type: "collapse",
    name: "Stock Audit",
    key: "billing",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "stock_audit",
    component: <Billing />,
  },
  {
    type: "collapse",
    name: "Discrepancy",
    key: "Discrepancy",
    icon: <Icon fontSize="small">report_icon</Icon>,
    route: "discrepancy",
    component: <Descrepency />,
  },
  {
    type: "collapse",
    name: "Early Payment Recommendation",
    key: "Early-Payment-Recommendation",
    icon: <Icon fontSize="small">playlist_add_check_icon</Icon>,
    route: "EarlyPaymentRecommendation",
    component: <EarlyPaymentRecommendation />,
  },
  {
    type: "collapse",
    name: "Settlement",
    key: "Settlement",
    icon: <Icon fontSize="small">format_textdirection_r_to_l</Icon>,
    route: "settlement",
    component: <Settelment />,
  },
  {
    type: "collapse",
    name: "Approval Required",
    key: "Approval Required",
    icon: <Icon fontSize="small">playlist_add_check_icon</Icon>,
    route: "approval_required",
    component: <ApprovalReq />,
  },
  {
    type: "collapse",
    name: "Draft",
    key: "Draft",
    icon: <Icon fontSize="small">drafts</Icon>,
    route: "draft",
    component: <Draft />,
  },
  {
    type: "collapse",
    name: "Invoice",
    key: "Invoice",
    icon: <Icon fontSize="small">receipticon</Icon>,
    route: "invoice",
    component: <Invoice />,
  },
  {
    type: "collapse",
    name: "Amendment",
    key: "Amendment",
    icon: <Icon fontSize="small">gavel</Icon>,
    route: "amendment",
    component: <Amendment />,
  },
  {
    type: "collapse",
    name: "Limit Insights",
    key: "LimitInsights",
    icon: <Icon fontSize="small">bar_chart</Icon>,
    route: "limit_insights",
    component: <LimitInsights />,
  },
  {
    type: "collapse",
    name: "E-onboarding",
    key: "E-onboarding",
    icon: <Icon fontSize="small">gavel</Icon>,
    route: "E-onboarding",
    component: <EOnboarding />,
    children: [
      {
        type: "collapse",
        name: "Initiate Onboarding",
        key: "AnchorMaker",
        icon: <Icon fontSize="small">chevron_right</Icon>,
        route: "E-onboarding/anchor-maker",
        component: <AnchorMaker />,
      },
      {
        type: "collapse",
        name: "Anchor Checker",
        key: "AnchorChecker",
        icon: <Icon fontSize="small">chevron_right</Icon>,
        route: "E-onboarding/anchor-checker",
        component: <AnchorChecker />,
      },
      // {
      //   type: "collapse",
      //   name: "Draft",
      //   key: "E-onboardingDraft",
      //   icon: <Icon fontSize="small">chevron_right</Icon>,
      //   route: "E-onboarding/draft",
      //   component: <DraftTab />,
      // },
    ],
  },
];
// Hide the entire E-onboarding parent by default unless the user is allowed.
// This removes the parent tab (and its children) from the sidebar for other users.
const eOnboardingAllowed = [
  "ethan",
  "emma",
  "noha",
  "grace",
  "leo",
  "soumya",
  "chinmayee",
  "bhawna",
  "piyush",
  "muni",
];
const currentUser = (localStorage.getItem("username") || "").toLowerCase();
if (!eOnboardingAllowed.includes(currentUser)) {
  routes = routes.filter((r) => r.key !== "E-onboarding");
}

// Keep existing per-child restrictions (harmless if parent was removed)
const anchorCheckerAllowed = ["ethan", "emma", "noha", "grace", "leo"];
const _currentUser = (localStorage.getItem("username") || "").toLowerCase();
if (!anchorCheckerAllowed.includes(_currentUser)) {
  routes = routes.map((route) => {
    if (route.key === "E-onboarding" && Array.isArray(route.children)) {
      return { ...route, children: route.children.filter((c) => c.key !== "AnchorChecker") };
    }
    return route;
  });
}

// Restrict Anchor Maker (Initiate Onboarding) visibility to a whitelist
const anchorMakerAllowed = ["soumya", "chinmayee", "bhawna", "piyush", "muni"];
if (!anchorMakerAllowed.includes(_currentUser)) {
  routes = routes.map((route) => {
    if (route.key === "E-onboarding" && Array.isArray(route.children)) {
      return { ...route, children: route.children.filter((c) => c.key !== "AnchorMaker") };
    }
    return route;
  });
}

if ((localStorage.getItem("username") || "").toLowerCase() == "alex") {
  routes = routes.filter((route) => {
    if (
      route.name === "Dashboard" ||
      route.name === "All Cases" ||
      route.name === "Settlement" ||
      route.name === "Approval Required" ||
      route.name === "Draft"
    ) {
      return true;
    } else {
      false;
    }
  });
}

if ((localStorage.getItem("username") || "").toLowerCase() == "alex") {
  routes = routes.filter((route) => {
    if (
      route.name === "Dashboard" ||
      route.name === "All Cases" ||
      route.name === "Settlement" ||
      route.name === "Approval Required" ||
      route.name === "Draft"
    ) {
      return true;
    } else {
      false;
    }
  });
}

if (
  (localStorage.getItem("username") || "").toLowerCase() == "john" ||
  (localStorage.getItem("username") || "").toLowerCase() == "lebo"
) {
  routes = routes.filter((route) => {
    if (
      route.name === "Dashboard" ||
      route.name === "All Cases" ||
      route.name === "Stock Audit" ||
      route.name === "Approval Required" ||
      route.name === "Discrepancy" ||
      route.name === "Draft"
    ) {
      return true;
    } else {
      false;
    }
  });
}

if (localStorage.getItem("type") == "Dealer") {
  routes = routes.filter((route) => route.key !== "billing");
}

if ((localStorage.getItem("type") == "Vendor") & (localStorage.getItem("username") !== "rashid")) {
  routes = routes.filter((route) => route.key !== "Settlement");
  console.log(routes);
}
if (
  (localStorage.getItem("type") == "Anchor") &
  (localStorage.getItem("username") !== "shubham") &
  (localStorage.getItem("username") !== "shivam")
) {
  routes = routes.filter((route) => route.key !== "billing");
  console.log(routes, "this is settlemetn");
}
if (localStorage.getItem("username") == "rashid") {
  routes = routes.filter((route) => route.key !== "Settlement");
}

const checker = localStorage.getItem("username");
const allowedChecker = [
  "ali1",
  "syahmi",
  "danish",
  "hafiz",
  "zulkifli",
  "aminah1",
  "hazik1",
  "nizam",
  "nabilah1",
  "nadiah",
  "syafiq",
  "balqis",
  "atikah",
  "hakim",
  "rafique",
  "nazeera",
  "shafiq",
  "rania",
  "nadira",
];

if (allowedChecker.includes((checker || "").toLowerCase())) {
  console.log("true checker");
  const newData = {
    type: "collapse",
    name: "Checker",
    key: "Checker",
    icon: <Icon fontSize="small">check</Icon>,
    route: "checker",
    component: <Checker />,
  };

  const newData2 = {
    type: "collapse",
    name: "Supplier Review",
    key: "Supplier Review",
    icon: <Icon fontSize="small">drafts</Icon>,
    route: "SupplierReview",
    component: <SupplierReview />,
  };

  routes.push(newData);
  routes.push(newData2);
}

const maker = localStorage.getItem("username");
const allowedMaker = [
  "ali",
  "arif",
  "hamzah",
  "rahman",
  "ismail",
  "aminah",
  "hazik",
  "akmal",
  "nabilah",
  "faizah",
  "izzat",
  "siti",
  "nurul",
  "zain",
  "faris",
  "hana",
  "imran",
  "aisyah",
  "zara",
];

if (allowedMaker.includes(maker)) {
  console.log("true maker");
  const newData = {
    type: "collapse",
    name: "Upload Supplier Data",
    key: "Upload Data",
    icon: <Icon fontSize="small">drafts</Icon>,
    route: "uploadData",
    component: <UploadData />,
  };

  routes.push(newData);
}
// if (localStorage.getItem("username") == "tata") {
//   const newData = {
//     type: "collapse",
//     name: "Upload PO",
//     key: "Upload PO",
//     icon: <Icon fontSize="small">receipticon</Icon>,
//     route: "upload_PO",
//     component: <UploadPo />,
//   };

//   routes.push(newData);
// }
const payableRegularUsers = localStorage.getItem("username");
const notallowedPayableUsers = [
  "ali",
  "arif",
  "hamzah",
  "rahman",
  "ismail",
  "akmal",
  "nabilah",
  "faizah",
  "izzat",
  "siti",
  "nurul",
  "zain",
  "faris",
  "hana",
  "imran",
  "aisyah",
  "zara",
  "ali1",
  "syahmi",
  "danish",
  "hafiz",
  "zulkifli",
  "nizam",
  "nabilah1",
  "nadiah",
  "syafiq",
  "balqis",
  "atikah",
  "hakim",
  "rafique",
  "nazeera",
  "shafiq",
  "rania",
  "nadira",
];
if (
  localStorage.getItem("username") == "ritik" &&
  !notallowedPayableUsers.includes((payableRegularUsers || "").toLowerCase())
) {
  const newData = {
    type: "collapse",
    name: "Approve PO",
    key: "Approve PO",
    icon: <Icon fontSize="small">receipticon</Icon>,
    route: "approve_PO",
    component: <Approvepo />,
  };
  const newData2 = {
    type: "collapse",
    name: "PO Status",
    key: "PO Status",
    icon: <Icon fontSize="small">receipticon</Icon>,
    route: "PO_status",
    component: <POStatus />,
  };

  routes.push(newData);
  routes.push(newData2);
}
//12-08-2025
const payableRegularMakers = localStorage.getItem("username");
const allowedpayableRegularMakers = ["aminah1", "hazik1", "aminah", "hazik"];

if (
  localStorage.getItem("type") == "Anchor" &&
  localStorage.getItem("username") == "prem" &&
  !allowedpayableRegularMakers.includes((payableRegularMakers || "").toLowerCase())
) {
  const newData = {
    type: "collapse",
    name: "Upload PO",
    key: "Upload PO",
    icon: <Icon fontSize="small">receipticon</Icon>,
    route: "upload_PO",
    component: <UploadPo />,
  };
  const newData2 = {
    type: "collapse",
    name: "PO Status",
    key: "PO Status",
    icon: <Icon fontSize="small">receipticon</Icon>,
    route: "PO_status",
    component: <POStatus />,
  };

  routes.push(newData);
  routes.push(newData2);
}

export default routes;

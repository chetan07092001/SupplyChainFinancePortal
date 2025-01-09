/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
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
];

if (localStorage.getItem("type") == "Vendor") {
  routes = routes.filter((route) => route.key !== "Settlement");
  console.log(routes);
}
if (localStorage.getItem("type") == "Anchor") {
  routes = routes.filter((route) => route.key !== "billing");
  console.log(routes);
}

if (localStorage.getItem("username") == "hrithik") {
  const newData = {
    type: "collapse",
    name: "Checker",
    key: "Checker",
    icon: <Icon fontSize="small">check</Icon>,
    route: "checker",
    component: <Checker />,
  };

  routes.push(newData);
}

export default routes;

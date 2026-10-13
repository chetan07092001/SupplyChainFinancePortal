import React, { useState } from "react";

import UserContext from "./userContext";

const userContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [invoice, setInvoice] = useState([]);
  return (
    <UserContext.Provider value={{ user, setUser, excelData, setExcelData, invoice, setInvoice }}>
      {children}
    </UserContext.Provider>
  );
};

export default userContextProvider;

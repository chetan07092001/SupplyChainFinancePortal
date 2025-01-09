import React, { useEffect, useState } from "react"; // Import useState for loading state
import { useNavigate } from "react-router-dom";
import { Bars } from "react-loader-spinner";
import axios from "axios";
import Loader from "./Loading/Loader";
function Upload() {
  const navigate = useNavigate(); // Call useNavigate inside the component

  const getData = async () => {
    try {
      const response = await axios.get(
        "https://scfdemo.newgensoftware.net:8443/scf/createWorkItem",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("upload data New ");
      console.log(response.data);
      return response;
    } catch (e) {
      console.log(e);
    }
  };
  const uploadInvoice = async () => {
    try {
      console.log("upload invoice");

      // Assuming getData() is defined elsewhere in your code
      const response = await getData();
      console.log("data");
      console.log(response.status);

      setTimeout(() => {
        if (response.status == "200") {
          const wiName = response.data.wiName;
          console.log("winame: " + wiName);
          const sID = response.data.sessionId;
          console.log("sid: " + sID);

          window.open(
            `https://scfdemo.newgensoftware.net/webdesktop/login/mailloginclient.app?&CalledFrom=OPENWI&pid=${wiName}&wid=1&SessionId=${sID}&UserIndex=27&UserName=vijay&CabinetName=newgenibps`
          );
        }
      }, 4000);
    } catch (e) {
      console.log("Error is ", e);
    }
  };

  useEffect(() => {
    uploadInvoice();
    setTimeout(() => {
      navigate("/admin/dashboard");
    }, 4000);
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          zIndex: 9999,
        }}
      >
        <Bars
          height="80"
          width="80"
          color="#24a4d8"
          ariaLabel="bars-loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div>
    </>
  );
}

export default Upload;

import axios from "axios";
import { useEffect, useSt } from "react";
import MDTypography from "components/MDTypography";
import { Icon, IconButton } from "@mui/material";

const getData = async (url) => {
  console.log(url);
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    console.log("data");
    console.log(response.data);
    const updatedData = response.data.map((item) => ({
      ...item,
      view: "view", // Keep this for the view button
      transdate: item.transdate ? item.transdate : "N/A", // Handle null case
    }));
    return updatedData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export async function useFetchScfApi({ url }) {
  return await getData(url);
}

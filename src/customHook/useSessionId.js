import axios from "axios";
const getSessionId = async () => {
  try {
    const response = await axios.get("https://scfdemo.newgensoftware.net:8443/scf/fetchSessionId", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    console.log("useSessionId", response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export async function useSessionId() {
  return await getSessionId();
}

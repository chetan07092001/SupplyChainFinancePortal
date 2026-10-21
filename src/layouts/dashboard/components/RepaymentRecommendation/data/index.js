import axios from "axios";

const REPAYMENT_RECOMMENDATION_URL =
  "https://scfdemo.newgensoftware.net:8443/scf/fetchOutstandingSettlementsTop3";

const formatDays = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${value} Days`;
};

const formatAmount = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const transformData = (data) =>
  data.slice(0, 3).map((item, index) => ({
    rank: index + 1,
    referenceNo: item.referenceNo || "-",
    totalTenor: formatDays(item.tenor),
    tenorUtilized: formatDays(item.tenorUtilised),
    remainingDays: formatDays(item.daysRemaining),
    utilizedAmount: formatAmount(item.outstandingAmount),
  }));

export const fetchRepaymentRecommendation = async () => {
  try {
    const response = await axios.get(REPAYMENT_RECOMMENDATION_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return Array.isArray(response.data) ? transformData(response.data) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default fetchRepaymentRecommendation;

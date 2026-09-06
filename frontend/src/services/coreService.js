import { apiRequest } from "./api";

export const getDashboard = () => apiRequest("/dashboard/");

export const getCustomers = async () => {
  const data = await apiRequest("/customers/");
  return Array.isArray(data) ? data : data.results || [];
};

export const getNewspapers = async () => {
  const data = await apiRequest("/newspapers/");
  return Array.isArray(data) ? data : data.results || [];
};

export const getSubscriptions = async () => {
  const data = await apiRequest("/subscriptions/");
  return Array.isArray(data) ? data : data.results || [];
};

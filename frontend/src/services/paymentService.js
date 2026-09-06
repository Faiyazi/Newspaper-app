import { apiRequest } from "./api";

export async function getPayments() {
  const data = await apiRequest("/payments/");
  return Array.isArray(data) ? data : data.results || [];
}

export function createPayment(data) {
  return apiRequest("/payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

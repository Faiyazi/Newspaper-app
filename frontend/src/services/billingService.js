import { apiRequest } from "./api";

export async function getInvoices() {
  const data = await apiRequest("/invoices/");
  return Array.isArray(data) ? data : data.results || [];
}

export function generateInvoices(month) {
  return apiRequest("/billing/generate/", {
    method: "POST",
    body: JSON.stringify({ month }),
  });
}

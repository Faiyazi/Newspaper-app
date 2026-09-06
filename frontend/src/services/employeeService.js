import { apiRequest } from "./api";

export async function getEmployees() {
  const data = await apiRequest("/employees/");
  return Array.isArray(data) ? data : data.results || [];
}

export function createEmployee(data) {
  return apiRequest("/employees/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

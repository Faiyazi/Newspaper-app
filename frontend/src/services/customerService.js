import { apiRequest } from "./api";

export function createCustomer(data) {
  return apiRequest("/customers/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

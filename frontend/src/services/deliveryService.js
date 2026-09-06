import { apiRequest } from "./api";

export async function getTodayDeliveries() {
  return apiRequest("/deliveries/today/");
}

export function generateTodayDeliveries() {
  return apiRequest("/deliveries/generate-today/", {
    method: "POST",
  });
}

export function updateDeliveryEmployee(deliveryId, employeeId) {
  return apiRequest(`/deliveries/${deliveryId}/`, {
    method: "PATCH",
    body: JSON.stringify({
      employee: employeeId ? Number(employeeId) : null,
    }),
  });
}

export function updateDeliveryStatus(deliveryId, status) {
  return apiRequest(`/deliveries/${deliveryId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

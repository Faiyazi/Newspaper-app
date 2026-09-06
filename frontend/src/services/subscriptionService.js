import { apiRequest } from "./api";

export function createSubscription(data) {
  return apiRequest("/subscriptions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSubscription(subscriptionId, data) {
  return apiRequest(`/subscriptions/${subscriptionId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSubscription(subscriptionId) {
  return apiRequest(`/subscriptions/${subscriptionId}/`, {
    method: "DELETE",
  });
}

export const API = "https://newspaper-business-api.onrender.com/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.detail ||
      data?.message ||
      "Request failed.";
    throw new Error(message);
  }

  return data;
}

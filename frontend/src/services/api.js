import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  timeout: 12000,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function formatValidationErrors(detail) {
  if (!Array.isArray(detail) || detail.length === 0) {
    return "Invalid request.";
  }

  const first = detail[0] || {};
  const location = Array.isArray(first.loc)
    ? first.loc.filter((segment) => segment !== "body").join(".")
    : "";
  const message = String(first.msg || "Invalid request data.");

  return location ? `${location}: ${message}` : message;
}

function normalizeErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const detail = data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return formatValidationErrors(detail);
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string" && detail.message.trim()) {
      return detail.message;
    }
    return "Request failed due to invalid input.";
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (!error?.response) {
    return "Unable to connect to server. Check that backend is running.";
  }

  if (status === 401) {
    return "Authentication required. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "Requested resource was not found.";
  }

  if (status >= 500) {
    return "Server error. Please try again shortly.";
  }

  return "Request failed";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = normalizeErrorMessage(error);
    return Promise.reject(new Error(message));
  }
);

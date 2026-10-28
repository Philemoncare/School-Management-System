export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  isNotImplemented(): boolean {
    return this.status === 501 || this.code === "NOT_IMPLEMENTED";
  }

  isServiceUnconfigured(): boolean {
    return this.code === "SERVICE_UNCONFIGURED";
  }

  isPlanRestricted(): boolean {
    return this.code === "PLAN_RESTRICTED";
  }

  isPermissionDenied(): boolean {
    return this.status === 403 || this.code === "PERMISSION_DENIED" || this.code === "FORBIDDEN";
  }

  isServiceUnavailable(): boolean {
    return this.status === 503 || this.code === "SERVICE_UNAVAILABLE" || this.code === "DATABASE_UNAVAILABLE";
  }

  isBrowserUnsupported(): boolean {
    return this.code === "BROWSER_UNSUPPORTED";
  }

  isNetworkError(): boolean {
    return this.status === 0 || this.code === "NETWORK_ERROR";
  }

  static getStandardErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.isNotImplemented()) {
        return err.message || "This feature is not available yet. Please check back later.";
      }
      if (err.isServiceUnconfigured()) {
        return err.message || "This service has not been configured. Please contact your school administrator.";
      }
      if (err.isPlanRestricted()) {
        return err.message || "This feature is not included in your current subscription. Contact your school administrator for assistance.";
      }
      if (err.isPermissionDenied()) {
        return err.message || "You do not have permission to perform this action.";
      }
      if (err.isServiceUnavailable()) {
        return err.message || "This service is temporarily unavailable. Please try again later.";
      }
      if (err.isNetworkError()) {
        return "Cannot connect to SchooMA server. Please check your network connection.";
      }
      return err.message || "An unexpected request error occurred.";
    }

    if (err instanceof Error) {
      return err.message;
    }

    return "An unknown error occurred. Please try again.";
  }
}

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/login/otp",
  "/auth/login/resend",
  "/auth/school/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/accept-invitation",
  "/auth/logout",
  "/integrations/status",
];

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/register-school",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/terms",
  "/privacy",
];

function clearClientSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("supportGrantId");
  document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function handleUnauthorized(endpoint: string) {
  if (typeof window === "undefined") return;
  if (PUBLIC_ENDPOINTS.some((path) => endpoint.startsWith(path))) return;

  clearClientSession();

  if (!PUBLIC_PATHS.includes(window.location.pathname)) {
    window.location.href = "/login";
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const schoolId =
    typeof window !== "undefined" ? localStorage.getItem("schoolId") : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const supportGrantId =
    typeof window !== "undefined"
      ? localStorage.getItem("supportGrantId")
      : null;

  const headers = new Headers(options.headers);
  if (schoolId) {
    headers.set("x-school-id", schoolId);
  }
  if (supportGrantId) {
    headers.set("x-support-grant-id", supportGrantId);
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the SchooMA API. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(endpoint);
    }

    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    const errorMsg = Array.isArray(error.message)
      ? error.message.join(". ")
      : error.message || error.error || "API request failed";
    throw new ApiError(
      errorMsg,
      response.status,
      error.code,
      error.details ?? error.errors,
    );
  }

  return response.json();
}

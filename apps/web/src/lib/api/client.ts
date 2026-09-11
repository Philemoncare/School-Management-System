const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const schoolId =
    typeof window !== "undefined" ? localStorage.getItem("schoolId") : null;

  const headers = new Headers(options.headers);
  if (schoolId) {
    headers.set("x-school-id", schoolId);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

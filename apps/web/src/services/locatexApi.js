/**
 * The client for our own API.
 *
 * Sessions are httpOnly cookies, so there is no token to hold in JavaScript — every request
 * simply carries the cookies, and unsafe verbs echo the readable CSRF cookie back in a
 * header. That is the whole of the auth handling on this side, which is the point of having
 * chosen cookies.
 */
const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/v1`;

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** The double-submit token the API set; readable on purpose, unlike the session cookie. */
function csrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)lx_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "INTERNAL";
    /** `[{ field, code, message }]` — ready to attach to form fields. */
    this.details = body?.error?.details ?? [];
  }

  /** The validation problems, keyed by field, which is what a form wants. */
  fieldErrors() {
    const errors = {};
    for (const detail of this.details) {
      if (detail.field) errors[detail.field] = detail.message;
    }
    return errors;
  }
}

export async function api(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (UNSAFE.has(method)) {
    const token = csrfToken();
    if (token) headers["x-csrf-token"] = token;
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}

export const get = (path, options) => api(path, { ...options, method: "GET" });
export const post = (path, body, options) => api(path, { ...options, method: "POST", body });
export const put = (path, body, options) => api(path, { ...options, method: "PUT", body });
export const patch = (path, body, options) => api(path, { ...options, method: "PATCH", body });
export const del = (path, options) => api(path, { ...options, method: "DELETE" });

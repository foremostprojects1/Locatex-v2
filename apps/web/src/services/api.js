/**
 * Endpoints of the PHP handlers that shipped with the original template.
 * The base URL is configurable so the React build can be served from a
 * different origin than the mail scripts.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const ENDPOINTS = {
  contact: `${BASE_URL}/contact/contact-process.php`,
  subscribe: `${BASE_URL}/mail/subscribe.php`,
  subscribeMailchimp: `${BASE_URL}/mail/subscribe-mailchimp.php`,
};

/** POSTs url-encoded form data, the format the PHP handlers expect. */
export async function postForm(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams(data).toString(),
  });
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  return response;
}

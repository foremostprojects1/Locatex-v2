import { ENDPOINTS, postForm } from "./api";

export const CONTACT_SUCCESS =
  "Email Sent Successfully. Thank you, Your application is accepted - we will contact you shortly";
export const CONTACT_ERROR = "Error sending email.";

/**
 * Ports `ajaxContactForm` from main.js: the PHP handler answers with the plain
 * string "Success" when the mail went out.
 */
export async function sendContactMessage(fields) {
  const response = await postForm(ENDPOINTS.contact, fields);
  const body = (await response.text()).trim();
  return body === "Success"
    ? { status: true, message: CONTACT_SUCCESS }
    : { status: false, message: CONTACT_ERROR };
}

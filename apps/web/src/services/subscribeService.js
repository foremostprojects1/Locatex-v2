import { ENDPOINTS, postForm } from "./api";

const ERROR_MESSAGES = {
  "email-required": "Error! <strong>Email is required.</strong>",
  "email-err": "Error! <strong>Email invalid.</strong>",
  duplicate: "Error! <strong>Email is duplicate.</strong>",
  filewrite: "Error! <strong>Mail list file is open.</strong>",
  undefined: "Error! <strong>undefined error.</strong>",
};

export const SUBSCRIBE_SUCCESS =
  "Thank you for joining our mailing list! Please check your email for a confirmation link.";
export const SUBSCRIBE_FAILURE =
  "Error! <strong>There was a problem processing your submission.</strong>";

/**
 * Ports `ajaxSubscribe` from the template's main.js.
 *
 * @returns {Promise<{status: boolean, message: string}>}
 */
export async function subscribe(email, { mailchimp = true } = {}) {
  const url = mailchimp ? ENDPOINTS.subscribeMailchimp : ENDPOINTS.subscribe;
  const response = await postForm(url, { subscribeEmail: email });
  const data = await response.json();

  if (data.status) return { status: true, message: SUBSCRIBE_SUCCESS };
  if (data.msg === "api-error")
    return { status: false, message: SUBSCRIBE_FAILURE };
  return {
    status: false,
    message: ERROR_MESSAGES[data.msg] ?? ERROR_MESSAGES.undefined,
  };
}

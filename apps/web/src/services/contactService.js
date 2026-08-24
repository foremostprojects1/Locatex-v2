import { contactMessageSchema } from "@locatex/contracts";
import { post } from "./locatexApi";

export const CONTACT_SUCCESS =
  "Thank you — we have your message and will reply by email.";
export const CONTACT_ERROR =
  "We could not send that just now. Please try again in a moment.";

/**
 * Sends the contact form to our own API.
 *
 * v1 posted to a PHP script that only emailed, so a message lost to a spam folder was lost
 * for good. Now it is stored first and appears in the administrator's inbox whether or not
 * the notification email goes anywhere.
 *
 * Validation runs against the same schema the server uses, so the message a visitor reads
 * is the rule that will accept their message.
 */
export async function sendContactMessage(fields) {
  const parsed = contactMessageSchema.safeParse({
    name: fields.name,
    email: fields.email,
    subject: fields.subject || "general",
    message: fields.message,
    ...(fields.phone?.trim() ? { phone: fields.phone } : {}),
    ...(fields.propertyId ? { propertyId: fields.propertyId } : {}),
  });

  if (!parsed.success) {
    const errors = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] ??= issue.message;
    }
    return { status: false, message: "Please check the highlighted fields.", errors };
  }

  try {
    const response = await post("/contact", parsed.data);
    return { status: true, message: response.message ?? CONTACT_SUCCESS };
  } catch (cause) {
    return {
      status: false,
      message: cause.message ?? CONTACT_ERROR,
      errors: cause.fieldErrors?.() ?? {},
    };
  }
}

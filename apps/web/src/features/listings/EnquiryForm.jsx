import { useState } from "react";
import { ENQUIRY_CHANNELS, ENQUIRY_CHANNEL_LABEL, enquirySchema } from "@locatex/contracts";
import { post } from "../../services/locatexApi";

/**
 * Asking the broker about a listing.
 *
 * The placeholder asks for something specific rather than saying "your message", because
 * "interested" wastes the broker's phone call and the buyer's afternoon. The minimum
 * length is the same rule the API enforces.
 */
export default function EnquiryForm({ propertyId }) {
  const [values, setValues] = useState({ message: "", channel: "message", callbackPhone: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(null);

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const parsed = enquirySchema.safeParse({
      message: values.message,
      channel: values.channel,
      ...(values.callbackPhone.trim() ? { callbackPhone: values.callbackPhone.trim() } : {}),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check what you have written.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await post(`/properties/${propertyId}/enquiries`, parsed.data);
      setSent(response.message);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="lx-enquiry is-sent">
        <h3>Message sent</h3>
        <p className="lx-note">{sent}</p>
      </div>
    );
  }

  return (
    <form className="lx-enquiry" onSubmit={submit}>
      <h3>Ask about this land</h3>

      {error ? <p className="lx-field__error">{error}</p> : null}

      <fieldset className="box-fieldset">
        <label htmlFor="enquiry-channel">What would you like?</label>
        <select
          id="enquiry-channel"
          className="form-control"
          value={values.channel}
          onChange={update("channel")}
        >
          {ENQUIRY_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {ENQUIRY_CHANNEL_LABEL[channel]}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="box-fieldset">
        <label htmlFor="enquiry-message">Your message</label>
        <textarea
          id="enquiry-message"
          className="textarea"
          rows={4}
          placeholder="Is the borewell working? Is there road access for a tractor? When could I visit?"
          value={values.message}
          onChange={update("message")}
        />
      </fieldset>

      <fieldset className="box-fieldset">
        <label htmlFor="enquiry-phone">Call me on (optional)</label>
        <input
          id="enquiry-phone"
          type="tel"
          inputMode="tel"
          className="form-control"
          placeholder="Leave blank to use your registered number"
          value={values.callbackPhone}
          onChange={update("callbackPhone")}
        />
      </fieldset>

      <button type="submit" className="tf-btn bg-color-primary pd-10 w-100" disabled={pending}>
        {pending ? "Sending…" : "Send to the broker"}
      </button>
    </form>
  );
}

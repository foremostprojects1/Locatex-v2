import { useState } from "react";
import { CONTACT_SUBJECTS, CONTACT_SUBJECT_LABEL } from "@locatex/contracts";
import {
  CONTACT_ERROR,
  sendContactMessage,
} from "../../services/contactService";

const EMPTY = { name: "", email: "", phone: "", subject: "general", message: "" };

/**
 * "Drop Us A Line".
 *
 * The rules come from the shared contact schema rather than from the template's jQuery
 * validation, so what a visitor is told here is exactly what the API will accept. The phone
 * number is optional now — insisting on one turned away people who only wanted an email
 * reply.
 */
export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setResult(null);
    setErrors({});
    try {
      const response = await sendContactMessage(values);
      setResult(response);
      setErrors(response.errors ?? {});
      if (response.status) setValues(EMPTY);
    } catch {
      setResult({ status: false, message: CONTACT_ERROR });
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      id="contactform"
      method="post"
      className="form-contact"
      onSubmit={handleSubmit}
      noValidate
    >
      {result && (
        <div
          className={`flat-alert ${result.status ? "msg-success" : "msg-error"}`}
        >
          {result.message}
          <a
            className="close"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setResult(null);
            }}
          >
            <i className="icon icon-close2" />
          </a>
        </div>
      )}
      <div className="box grid-2">
        <fieldset>
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Your name"
            name="name"
            id="name"
            value={values.name}
            onChange={update("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <label className="error">{errors.name}</label>}
        </fieldset>
        <fieldset>
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            name="email"
            id="email"
            value={values.email}
            onChange={update("email")}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <label className="error">{errors.email}</label>}
        </fieldset>
      </div>
      <div className="box grid-2">
        <fieldset>
          <label htmlFor="phone">Phone number (optional):</label>
          <input
            type="text"
            className="form-control style-1"
            placeholder="ex 012345678"
            name="phone"
            id="phone"
            value={values.phone}
            onChange={update("phone")}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <label className="error">{errors.phone}</label>}
        </fieldset>
        <fieldset>
          <label htmlFor="subject">Subject:</label>
          <select
            className="form-control style-1"
            name="subject"
            id="subject"
            value={values.subject}
            onChange={update("subject")}
          >
            {CONTACT_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {CONTACT_SUBJECT_LABEL[subject]}
              </option>
            ))}
          </select>
        </fieldset>
      </div>
      <fieldset>
        <label htmlFor="message">Your Message:</label>
        <textarea
          name="message"
          className="form-control"
          cols="30"
          rows="10"
          placeholder="Message"
          id="message"
          value={values.message}
          onChange={update("message")}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <label className="error">{errors.message}</label>}
      </fieldset>
      <div className="send-wrap">
        <button
          className="tf-btn primary size-1"
          type="submit"
          disabled={pending}
        >
          {pending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}

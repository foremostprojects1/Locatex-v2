import { useState } from "react";
import {
  CONTACT_ERROR,
  sendContactMessage,
} from "../../services/contactService";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

/**
 * "Drop Us A Line" form. Validation mirrors the jQuery Validate setup of the
 * template (name, email, phone and message required) and the response handling
 * of `ajaxContactForm`.
 */
export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "This field is required.";
    if (!values.email.trim()) nextErrors.email = "This field is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      nextErrors.email = "Please enter a valid email address.";
    if (!values.phone.trim()) nextErrors.phone = "This field is required.";
    if (!values.message.trim()) nextErrors.message = "This field is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending || !validate()) return;
    setPending(true);
    setResult(null);
    try {
      const response = await sendContactMessage(values);
      setResult(response);
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
          <label htmlFor="phone">Phone Numbers:</label>
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
          <input
            type="text"
            className="form-control style-1"
            placeholder="Enter Keyword"
            name="subject"
            id="subject"
            value={values.subject}
            onChange={update("subject")}
          />
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

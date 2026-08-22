import { useState } from "react";
import {
  CONTACT_ERROR,
  sendContactMessage,
} from "../../services/contactService";

const EMPTY = { text: "", email: "", message: "" };

/** Comment form of the blog post page; it posts to the same mail handler. */
export default function CommentForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const validate = () => {
    const nextErrors = {};
    if (!values.text.trim()) nextErrors.text = "This field is required.";
    if (!values.email.trim()) nextErrors.email = "This field is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      nextErrors.email = "Please enter a valid email address.";
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
      method="post"
      id="contactform"
      className="comment-form form-submit"
      onSubmit={handleSubmit}
      noValidate
    >
      {result && (
        <div
          className={`flat-alert ${result.status ? "msg-success" : "msg-error"}`}
        >
          {result.message}
        </div>
      )}
      <div className="form-wg group-ip">
        <fieldset>
          <label className="sub-ip" htmlFor="comment-name">
            Name
          </label>
          <input
            type="text"
            id="comment-name"
            className="form-control"
            name="text"
            placeholder="Your name"
            value={values.text}
            onChange={update("text")}
          />
          {errors.text && <label className="error">{errors.text}</label>}
        </fieldset>
        <fieldset>
          <label className="sub-ip" htmlFor="comment-email">
            Email
          </label>
          <input
            type="email"
            id="comment-email"
            className="form-control"
            name="email"
            placeholder="Your email"
            value={values.email}
            onChange={update("email")}
          />
          {errors.email && <label className="error">{errors.email}</label>}
        </fieldset>
      </div>
      <fieldset className="form-wg">
        <label className="sub-ip" htmlFor="comment-message">
          Review
        </label>
        <textarea
          id="comment-message"
          name="message"
          rows="4"
          placeholder="Write comment "
          value={values.message}
          onChange={update("message")}
        />
      </fieldset>
      <button
        className="form-wg tf-btn primary w-100"
        name="submit"
        type="submit"
        disabled={pending}
      >
        <span>{pending ? "Sending…" : "Post Comment"}</span>
      </button>
    </form>
  );
}

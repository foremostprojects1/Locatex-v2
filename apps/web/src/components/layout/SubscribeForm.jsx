import { useState } from "react";
import { subscribe, SUBSCRIBE_FAILURE } from "../../services/subscribeService";

/** Newsletter form of the footer (`#subscribe-form` in the original theme). */
export default function SubscribeForm({ mailchimp = true }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null); // { status, message }

  const handleSubscribe = async () => {
    if (pending) return;
    setPending(true);
    setResult(null);
    try {
      setResult(await subscribe(email, { mailchimp }));
    } catch {
      setResult({ status: false, message: SUBSCRIBE_FAILURE });
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      className="mt-12"
      id="subscribe-form"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubscribe();
      }}
      data-mailchimp={String(mailchimp)}
    >
      {!result?.status && (
        <div id="subscribe-content">
          <input
            type="email"
            name="email-form"
            id="subscribe-email"
            placeholder="Your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            id="subscribe-button"
            className="button-subscribe"
            disabled={pending}
            aria-label="Subscribe"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.00044 9.99935L2.72461 2.60352C8.16867 4.18685 13.3024 6.68806 17.9046 9.99935C13.3027 13.3106 8.16921 15.8118 2.72544 17.3952L5.00044 9.99935ZM5.00044 9.99935H11.2504"
                stroke="#1563DF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      <div id="subscribe-msg">
        {/*
          Rendered as text, not HTML. The template inserted the server's reply with
          innerHTML, which makes whatever that endpoint returns executable in the visitor's
          page — and the endpoint is not always one we control.
        */}
        {result && (
          <div className={result.status ? "notification_ok" : "notification_error"}>
            {result.message}
          </div>
        )}
      </div>
    </form>
  );
}

import { useId, useState } from "react";

/**
 * A password box you can look at.
 *
 * Typing a long password blind on a phone keyboard is where sign-ins go wrong, and the
 * usual response — trying again, more slowly — is what trips the rate limit. Letting people
 * check what they typed removes the whole problem.
 *
 * The toggle is a button, not a checkbox styled as one, so it is reachable by keyboard and
 * announced properly. It never carries the value in the DOM as plain text when hidden: the
 * input's `type` is what changes, which is the same mechanism a browser's own reveal uses.
 */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  error,
  icon,
  hint,
}) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <fieldset className="box-fieldset lx-password">
      {label ? <label htmlFor={fieldId}>{label}</label> : null}

      <div className="ip-field lx-password__field">
        {icon}
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className="form-control"
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
        />

        <button
          type="button"
          className="lx-password__reveal"
          // The label says what pressing it will do, not what state it is in — which is
          // what a screen reader user needs in order to decide whether to press it.
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>

      {hint && !error ? <small className="lx-field__hint">{hint}</small> : null}
      {error ? <small className="lx-field__error">{error}</small> : null}
    </fieldset>
  );
}

/* Drawn rather than pulled from the template's icon font, which has no eye glyph. */
function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.2 6.7A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.4-.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { useState } from "react";

/**
 * Password input with the eye toggle of the profile page. The `active` class on
 * the toggle switches the icon, as in the original stylesheet.
 */
export default function PasswordField({
  className = "form-contact style-1",
  placeholder = "Password",
  name,
  id,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="box-password">
      <input
        type={visible ? "text" : "password"}
        className={`${className} password-field`}
        placeholder={placeholder}
        name={name}
        id={id}
      />
      <span
        className={`show-pass${visible ? " active" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setVisible((value) => !value);
        }}
      >
        <i className="icon-pass icon-eye" />
        <i className="icon-pass icon-eye-off" />
      </span>
    </div>
  );
}

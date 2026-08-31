import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { passwordSchema } from "@locatex/contracts";
import { useSession } from "../hooks/useSession";
import PasswordField from "../components/forms/PasswordField";

/**
 * Where the reset link in the email lands.
 *
 * Unlike the email confirmation, this one waits for a deliberate action — the token is
 * spent only when a new password has been typed, so opening the email on a phone that then
 * locks does not burn the link.
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const { resetPassword } = useSession();

  const [values, setValues] = useState({ password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const token = params.get("token");

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    if (values.password !== values.confirm) {
      setError("The two passwords do not match.");
      return;
    }

    const parsed = passwordSchema.safeParse(values.password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "That password is not acceptable.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await resetPassword(token, values.password);
      setDone(true);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <div className="lx-centred-page">
        <div className="widget-box-2">
          <h5 className="title">That link is incomplete</h5>
          <p className="lx-note">Open the reset link from the email itself.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="lx-centred-page">
        <div className="widget-box-2">
          <h5 className="title">Your password is changed</h5>
          <p className="lx-note">
            Every other device has been signed out. Sign in with the new password.
          </p>
          <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="lx-centred-page">
      <form className="widget-box-2" onSubmit={submit} noValidate>
        <h5 className="title">Choose a new password</h5>

        {error ? <p className="lx-field__error">{error}</p> : null}

        <PasswordField
          id="reset-password"
          label="New password"
          placeholder="At least 10 characters"
          autoComplete="new-password"
          value={values.password}
          onChange={(next) => setValues((current) => ({ ...current, password: next }))}
        />

        <PasswordField
          id="reset-confirm"
          label="Type it again"
          autoComplete="new-password"
          value={values.confirm}
          onChange={(next) => setValues((current) => ({ ...current, confirm: next }))}
        />

        <div className="lx-wizard__actions">
          <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={pending}>
            {pending ? "Saving…" : "Change my password"}
          </button>
          <Link className="tf-btn style-border pd-10" to="/">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

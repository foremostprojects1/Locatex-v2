import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordFieldIcon, UserFieldIcon } from "./accountIcons";
import PasswordField from "../forms/PasswordField";
import { useSession } from "../../hooks/useSession";
import { closeModal } from "./modalControl";
import AccountAside from "./AccountAside";

/**
 * `#modalLogin` — signing in, and asking for a reset link when that is what is needed.
 *
 * The identifier is an email address *or* a mobile number, because v1 accepted both and
 * people are used to typing whichever they remember.
 *
 * A failed sign-in says only that the combination was wrong. Telling someone the address
 * exists but the password is wrong is a free account-enumeration oracle, and the server
 * deliberately does not distinguish the two either.
 */
export default function LoginModal() {
  const { signIn, forgotPassword } = useSession();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [values, setValues] = useState({ identifier: "", password: "", email: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const user = await signIn(values.identifier.trim(), values.password);
      closeModal("modalLogin");
      setValues({ identifier: "", password: "", email: "" });
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (cause) {
      setError(
        cause.code === "EMAIL_NOT_VERIFIED" || cause.code === "PHONE_NOT_VERIFIED"
          ? cause.message
          : "That email or mobile number and password do not match.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleForgot = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await forgotPassword(values.email.trim());
      // The same answer whether or not the address has an account.
      setNotice(response.message ?? "If that address has an account, a reset link is on its way.");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="modal modal-account lx-account-modal fade" id="modalLogin">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="flat-account">
            <AccountAside variant="signin" />

            <form
              className="form-account"
              onSubmit={mode === "signin" ? handleSignIn : handleForgot}
              noValidate
            >
              <div className="title-box">
                <h4>{mode === "signin" ? "Sign in" : "Reset your password"}</h4>
                <span
                  className="close-modal icon-close2"
                  data-bs-dismiss="modal"
                  role="button"
                  tabIndex={0}
                  aria-label="Close"
                />
              </div>

              {error ? <div className="flat-alert msg-error">{error}</div> : null}
              {notice ? <div className="flat-alert msg-success">{notice}</div> : null}

              {mode === "signin" ? (
                <div className="box">
                  <fieldset className="box-fieldset">
                    <label htmlFor="login-account">Email or mobile number</label>
                    <div className="ip-field">
                      <UserFieldIcon />
                      <input
                        id="login-account"
                        type="text"
                        className="form-control"
                        placeholder="you@example.com or 98765 43210"
                        autoComplete="username"
                        value={values.identifier}
                        onChange={update("identifier")}
                      />
                    </div>
                  </fieldset>

                  <PasswordField
                    id="login-password"
                    label="Password"
                    value={values.password}
                    onChange={(next) => setValues((current) => ({ ...current, password: next }))}
                    placeholder="Your password"
                    icon={<PasswordFieldIcon />}
                  />
                  <fieldset className="box-fieldset">
                    <div className="text-forgot text-end">
                      <button
                        type="button"
                        className="lx-linkbutton"
                        onClick={() => {
                          setMode("forgot");
                          setError(null);
                          setNotice(null);
                        }}
                      >
                        Forgot password
                      </button>
                    </div>
                  </fieldset>
                </div>
              ) : (
                <div className="box">
                  <fieldset className="box-fieldset">
                    <label htmlFor="forgot-email">Email address</label>
                    <div className="ip-field">
                      <UserFieldIcon />
                      <input
                        id="forgot-email"
                        type="email"
                        className="form-control"
                        placeholder="you@example.com"
                        value={values.email}
                        onChange={update("email")}
                      />
                    </div>
                  </fieldset>
                </div>
              )}

              <div className="box box-btn">
                <button type="submit" className="tf-btn primary w-100" disabled={pending}>
                  {pending
                    ? "One moment…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Send me a reset link"}
                </button>

                <div className="text text-center">
                  {mode === "signin" ? (
                    <>
                      Don’t have an account?{" "}
                      <a
                        href="#modalRegister"
                        data-bs-toggle="modal"
                        data-bs-dismiss="modal"
                        className="text-primary"
                      >
                        Register
                      </a>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="lx-linkbutton"
                      onClick={() => {
                        setMode("signin");
                        setError(null);
                        setNotice(null);
                      }}
                    >
                      Back to sign in
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

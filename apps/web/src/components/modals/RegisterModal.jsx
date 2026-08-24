import { useState } from "react";
import { BUDGET_BANDS, registerSchema } from "@locatex/contracts";
import { MailFieldIcon, PasswordFieldIcon, UserFieldIcon } from "./accountIcons";
import { useSession } from "../../hooks/useSession";

/**
 * `#modalRegister` — creating an account, then confirming it.
 *
 * Both channels have to be confirmed before anyone can sign in: an emailed link *and* a
 * code sent to the phone. That is the decision the client made, and it is the reason this
 * modal has a second step rather than closing on success — a form that says "registered!"
 * and then refuses the sign-in is how people conclude the site is broken.
 *
 * Validation uses the same schema the API enforces, so what is shown here is the rule that
 * will accept the account.
 */
export default function RegisterModal() {
  const { register, requestOtp, verifyOtp } = useSession();

  const [step, setStep] = useState("form");
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    budgetBand: "",
  });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);
  const [code, setCode] = useState("");
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleRegister = async (event) => {
    event.preventDefault();
    if (pending) return;

    if (values.password !== values.confirmPassword) {
      setErrors({ confirmPassword: "The two passwords do not match." });
      return;
    }

    const parsed = registerSchema.safeParse({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      ...(values.budgetBand ? { budgetBand: values.budgetBand } : {}),
    });

    if (!parsed.success) {
      const found = {};
      for (const issue of parsed.error.issues) found[issue.path.join(".")] ??= issue.message;
      setErrors(found);
      return;
    }

    setPending(true);
    setErrors({});
    try {
      await register(parsed.data);
      setStep("confirm");
      setMessage(null);
    } catch (cause) {
      setErrors(cause.fieldErrors?.() ?? {});
      setMessage(cause.message);
    } finally {
      setPending(false);
    }
  };

  const handleVerifyPhone = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      await verifyOtp(values.phone, code);
      setPhoneConfirmed(true);
      setMessage(null);
    } catch (cause) {
      setMessage(cause.message);
    } finally {
      setPending(false);
    }
  };

  if (step === "confirm") {
    return (
      <div className="modal modal-account fade" id="modalRegister">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="flat-account">
              <div className="banner-account">
                <img src="/images/banner/banner-account2.jpg" alt="banner" />
              </div>

              <form className="form-account" onSubmit={handleVerifyPhone} noValidate>
                <div className="title-box">
                  <h4>Two things to confirm</h4>
                  <span
                    className="close-modal icon-close2"
                    data-bs-dismiss="modal"
                    role="button"
                    tabIndex={0}
                    aria-label="Close"
                  />
                </div>

                {message ? <div className="flat-alert msg-error">{message}</div> : null}

                <div className="box">
                  <p className="lx-note">
                    <strong>1. Your email.</strong> We have sent a link to {values.email}. Open
                    it to confirm the address — the link works once and lasts 24 hours.
                  </p>

                  <p className="lx-note">
                    <strong>2. Your mobile.</strong>{" "}
                    {phoneConfirmed
                      ? "Confirmed. Once you have opened the email link you can sign in."
                      : `Enter the six-digit code we sent to ${values.phone}.`}
                  </p>

                  {phoneConfirmed ? null : (
                    <fieldset className="box-fieldset">
                      <label htmlFor="register-otp">Six-digit code</label>
                      <div className="ip-field">
                        <input
                          id="register-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="form-control"
                          placeholder="123456"
                          value={code}
                          onChange={(event) =>
                            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                        />
                      </div>
                    </fieldset>
                  )}
                </div>

                <div className="box box-btn">
                  {phoneConfirmed ? (
                    <a
                      href="#modalLogin"
                      data-bs-toggle="modal"
                      data-bs-dismiss="modal"
                      className="tf-btn primary w-100"
                    >
                      Go to sign in
                    </a>
                  ) : (
                    <>
                      <button
                        type="submit"
                        className="tf-btn primary w-100"
                        disabled={pending || code.length !== 6}
                      >
                        {pending ? "Checking…" : "Confirm my mobile"}
                      </button>
                      <div className="text text-center">
                        <button
                          type="button"
                          className="lx-linkbutton"
                          onClick={async () => {
                            try {
                              await requestOtp(values.phone);
                              setMessage("A new code is on its way.");
                            } catch (cause) {
                              setMessage(cause.message);
                            }
                          }}
                        >
                          Send the code again
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-account fade" id="modalRegister">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="flat-account">
            <div className="banner-account">
              <img src="/images/banner/banner-account2.jpg" alt="banner" />
            </div>

            <form className="form-account" onSubmit={handleRegister} noValidate>
              <div className="title-box">
                <h4>Create your account</h4>
                <span
                  className="close-modal icon-close2"
                  data-bs-dismiss="modal"
                  role="button"
                  tabIndex={0}
                  aria-label="Close"
                />
              </div>

              {message ? <div className="flat-alert msg-error">{message}</div> : null}

              <div className="box">
                <Field id="register-name" label="Full name" error={errors.fullName}>
                  <UserFieldIcon />
                  <input
                    id="register-name"
                    type="text"
                    className="form-control"
                    placeholder="Ramesh Patel"
                    value={values.fullName}
                    onChange={update("fullName")}
                  />
                </Field>

                <Field id="register-email" label="Email address" error={errors.email}>
                  <MailFieldIcon />
                  <input
                    id="register-email"
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={values.email}
                    onChange={update("email")}
                  />
                </Field>

                <Field id="register-phone" label="Mobile number" error={errors.phone}>
                  <UserFieldIcon />
                  <input
                    id="register-phone"
                    type="tel"
                    className="form-control"
                    placeholder="98765 43210"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={update("phone")}
                  />
                </Field>

                <Field id="register-password" label="Password" error={errors.password}>
                  <PasswordFieldIcon />
                  <input
                    id="register-password"
                    type="password"
                    className="form-control"
                    placeholder="At least 10 characters"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={update("password")}
                  />
                </Field>

                <Field
                  id="register-confirm-password"
                  label="Confirm password"
                  error={errors.confirmPassword}
                >
                  <PasswordFieldIcon />
                  <input
                    id="register-confirm-password"
                    type="password"
                    className="form-control"
                    placeholder="Type it again"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={update("confirmPassword")}
                  />
                </Field>

                <fieldset className="box-fieldset">
                  <label htmlFor="register-budget">Budget (optional)</label>
                  <select
                    id="register-budget"
                    className="form-control"
                    value={values.budgetBand}
                    onChange={update("budgetBand")}
                  >
                    <option value="">Prefer not to say</option>
                    {BUDGET_BANDS.map((band) => (
                      <option key={band.value} value={band.value}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                </fieldset>
              </div>

              <div className="box box-btn">
                <button type="submit" className="tf-btn primary w-100" disabled={pending}>
                  {pending ? "Creating your account…" : "Create my account"}
                </button>
                <div className="text text-center">
                  Already registered?{" "}
                  <a
                    href="#modalLogin"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                    className="text-primary"
                  >
                    Sign in
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, error, children }) {
  return (
    <fieldset className="box-fieldset">
      <label htmlFor={id}>{label}</label>
      <div className="ip-field">{children}</div>
      {error ? <small className="lx-field__error">{error}</small> : null}
    </fieldset>
  );
}

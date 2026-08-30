import { useState } from "react";
import { BUDGET_BANDS, passwordSchema, updateProfileSchema } from "@locatex/contracts";
import { patch, post } from "../services/locatexApi";
import { useSession } from "../hooks/useSession";
import { useDistricts } from "../hooks/useReference";

/**
 * Your own account: name, photograph, preferences, password.
 *
 * The email address and mobile number are shown but not editable. Both are login
 * identifiers and both have been verified — changing one is a re-verification flow, and a
 * plain form field here would let somebody move their account onto an address they have
 * never proved they own. The page says so rather than leaving a disabled box unexplained.
 */
export default function MyProfile() {
  const { user, loading, refresh } = useSession();

  if (loading) return <div className="widget-box-2 mb-20">One moment…</div>;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Sign in to manage your account</h5>
        <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <>
      <DetailsForm user={user} onSaved={refresh} />
      <PasswordForm />
    </>
  );
}

function DetailsForm({ user, onSaved }) {
  const { districts } = useDistricts();
  const [values, setValues] = useState({
    fullName: user.fullName ?? "",
    avatarUrl: user.avatarUrl ?? "",
    preferredDistrict: user.preferredDistrict ?? "",
    budgetBand: user.budgetBand ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const parsed = updateProfileSchema.safeParse({
      fullName: values.fullName,
      // An empty box means "remove it", which is null rather than an empty string — the
      // schema rejects an empty string as a URL and would otherwise block the save.
      avatarUrl: values.avatarUrl.trim() || null,
      preferredDistrict: values.preferredDistrict || null,
      budgetBand: values.budgetBand || null,
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
      await patch("/me/profile", parsed.data);
      await onSaved();
      setSaved(true);
    } catch (cause) {
      setErrors(cause.fieldErrors?.() ?? { fullName: cause.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="widget-box-2 mb-20" onSubmit={submit} noValidate>
      <h5 className="title">My details</h5>

      <div className="lx-profile__identity">
        <img
          className="avatar avt-64 round"
          src={values.avatarUrl || "/images/avatar/avt-5.jpg"}
          alt=""
        />
        <div>
          <span className="lx-admin__meta">{user.email}</span>
          <span className="lx-admin__meta">{user.phone}</span>
          <span className="lx-admin__meta">
            Signed in as a {user.role}
            {user.emailVerified && user.phoneVerified ? " · verified" : ""}
          </span>
        </div>
      </div>

      <p className="lx-note">
        Your email address and mobile number are how you sign in and both have been verified,
        so they cannot be changed here. Write to us if one of them needs to move.
      </p>

      <div className="box-info-property">
        <Field label="Full name" required error={errors.fullName}>
          <input
            type="text"
            className="form-control"
            value={values.fullName}
            onChange={update("fullName")}
          />
        </Field>

        <Field
          label="Photograph"
          error={errors.avatarUrl}
          hint="Paste a link to a photo. Uploading from your device arrives with image upload."
        >
          <input
            type="url"
            className="form-control"
            placeholder="https://…"
            value={values.avatarUrl}
            onChange={update("avatarUrl")}
          />
        </Field>

        <div className="box grid-2 gap-30">
          <Field label="District you are looking in" error={errors.preferredDistrict}>
            <select
              className="form-control"
              value={values.preferredDistrict}
              onChange={update("preferredDistrict")}
            >
              <option value="">No preference</option>
              {districts.map((district) => (
                <option key={district.slug} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Budget" error={errors.budgetBand}>
            <select
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
          </Field>
        </div>
      </div>

      <div className="lx-wizard__actions">
        <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={pending}>
          {pending ? "Saving…" : "Save my details"}
        </button>
        {saved ? <span className="lx-admin__meta">Saved.</span> : null}
      </div>
    </form>
  );
}

/**
 * Changing the password.
 *
 * Doing so signs out every other device — that is the server's behaviour and the form says
 * it beforehand, because somebody changing a password after a scare needs to know it
 * actually removed the other session.
 */
function PasswordForm() {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setDone(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    if (values.next !== values.confirm) {
      setError("The two new passwords do not match.");
      return;
    }
    const parsed = passwordSchema.safeParse(values.next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "That password is not acceptable.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await post("/auth/change-password", {
        currentPassword: values.current,
        newPassword: values.next,
      });
      setValues({ current: "", next: "", confirm: "" });
      setDone(true);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="widget-box-2 mb-20" onSubmit={submit} noValidate>
      <h5 className="title">Change my password</h5>
      <p className="lx-note">
        Changing it signs you out everywhere else — on this device you stay signed in.
      </p>

      {error ? <p className="lx-field__error">{error}</p> : null}
      {done ? <p className="lx-note">Changed. Your other devices have been signed out.</p> : null}

      <div className="box-info-property">
        <Field label="Current password" required>
          <input
            type="password"
            className="form-control"
            autoComplete="current-password"
            value={values.current}
            onChange={update("current")}
          />
        </Field>

        <div className="box grid-2 gap-30">
          <Field label="New password" required>
            <input
              type="password"
              className="form-control"
              autoComplete="new-password"
              placeholder="At least 10 characters"
              value={values.next}
              onChange={update("next")}
            />
          </Field>

          <Field label="Type it again" required>
            <input
              type="password"
              className="form-control"
              autoComplete="new-password"
              value={values.confirm}
              onChange={update("confirm")}
            />
          </Field>
        </div>
      </div>

      <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={pending}>
        {pending ? "Changing…" : "Change my password"}
      </button>
    </form>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <fieldset className="box box-fieldset">
      <label>
        {label}
        {required ? <span>*</span> : null}
      </label>
      {children}
      {hint && !error ? <small className="lx-field__hint">{hint}</small> : null}
      {error ? <small className="lx-field__error">{error}</small> : null}
    </fieldset>
  );
}

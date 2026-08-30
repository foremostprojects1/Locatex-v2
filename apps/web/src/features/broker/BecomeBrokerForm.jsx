import { useState } from "react";
import { brokerApplicationSchema } from "@locatex/contracts";
import { post } from "../../services/locatexApi";
import { useDistricts } from "../../hooks/useReference";
import { useSession } from "../../hooks/useSession";

/**
 * How a buyer becomes a broker.
 *
 * This is the whole supply side of the marketplace: nobody can list land until an
 * administrator has approved an application, and until now there was no way to submit one.
 *
 * Applying grants nothing by itself — the role changes only when an admin approves, and the
 * form says so plainly rather than implying the account has changed.
 */
export default function BecomeBrokerForm({ onSubmitted }) {
  const { user, refresh } = useSession();
  const { districts } = useDistricts();

  const [values, setValues] = useState({
    agencyName: "",
    officeAddress: "",
    district: "",
    reraNumber: "",
    experienceYears: "",
    about: "",
  });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState(null);

  const update = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const status = user?.brokerApplicationStatus;

  if (status === "pending") {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Your application is with our team</h5>
        <p className="lx-note">
          We check every broker before they can post land — it is why buyers trust the
          listings here. You will get an email as soon as it has been looked at, usually
          within a working day.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">We could not approve your application</h5>
        <p className="lx-note">
          The reason was sent to your email address. You are welcome to apply again once it
          is sorted out — your account itself is unaffected.
        </p>
        <button
          type="button"
          className="tf-btn bg-color-primary pd-10"
          onClick={() => refresh()}
        >
          Apply again
        </button>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const parsed = brokerApplicationSchema.safeParse({
      agencyName: values.agencyName,
      officeAddress: values.officeAddress,
      district: values.district,
      ...(values.reraNumber.trim() ? { reraNumber: values.reraNumber } : {}),
      ...(values.experienceYears !== "" ? { experienceYears: values.experienceYears } : {}),
      ...(values.about.trim() ? { about: values.about } : {}),
    });

    if (!parsed.success) {
      const found = {};
      for (const issue of parsed.error.issues) found[issue.path.join(".")] ??= issue.message;
      setErrors(found);
      return;
    }

    setPending(true);
    setErrors({});
    setFailure(null);
    try {
      await post("/auth/broker-application", parsed.data);
      // The account has not changed — only the application status has. Re-reading the
      // session is what swaps this form for the "with our team" message above.
      await refresh();
      onSubmitted?.();
    } catch (cause) {
      setErrors(cause.fieldErrors?.() ?? {});
      setFailure(cause.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="widget-box-2 mb-20" onSubmit={submit} noValidate>
      <h5 className="title">Apply to list land</h5>
      <p className="lx-note">
        Brokers post listings on LocateX. We check each one before approving, which is why
        buyers here take the listings seriously. Approval usually takes a working day.
      </p>

      {failure ? <p className="lx-field__error">{failure}</p> : null}

      <div className="box-info-property">
        <Field label="Agency or business name" required error={errors.agencyName}>
          <input
            type="text"
            className="form-control"
            placeholder="Patel Land Associates"
            value={values.agencyName}
            onChange={update("agencyName")}
          />
        </Field>

        <Field label="Office address" required error={errors.officeAddress}>
          <textarea
            className="textarea"
            rows={2}
            placeholder="Shop 4, Sanala Road, Morbi, Gujarat 363641"
            value={values.officeAddress}
            onChange={update("officeAddress")}
          />
        </Field>

        <div className="box grid-2 gap-30">
          <Field label="District you work in" required error={errors.district}>
            <select
              className="form-control"
              value={values.district}
              onChange={update("district")}
            >
              <option value="">Choose</option>
              {districts.map((district) => (
                <option key={district.slug} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Years in the business"
            error={errors.experienceYears}
          >
            <input
              type="number"
              min="0"
              max="70"
              className="form-control"
              placeholder="6"
              value={values.experienceYears}
              onChange={update("experienceYears")}
            />
          </Field>
        </div>

        <Field
          label="RERA number"
          error={errors.reraNumber}
          hint="Optional. Having one gets your application looked at sooner."
        >
          <input
            type="text"
            className="form-control"
            placeholder="GJ/RERA/1234"
            value={values.reraNumber}
            onChange={update("reraNumber")}
          />
        </Field>

        <Field label="Anything else we should know" error={errors.about}>
          <textarea
            className="textarea"
            rows={3}
            placeholder="The areas you know well, the kind of land you usually handle."
            value={values.about}
            onChange={update("about")}
          />
        </Field>
      </div>

      <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={pending}>
        {pending ? "Sending…" : "Send my application"}
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

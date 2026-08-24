import { Field, TextInput } from "../Field";

/**
 * Who a buyer rings.
 *
 * These details are shown only to signed-in buyers — a visitor who has not registered never
 * receives them in any response, which is the whole reason registration is worth anything to
 * a broker.
 */
export default function StepContact({ data, setField, errorFor }) {
  const contact = data.contact ?? {};

  return (
    <>
      <Field label="Contact name" required error={errorFor("contact.name")}>
        <TextInput
          value={contact.name}
          onChange={(value) => setField("contact.name", value)}
          placeholder="Ramesh Patel"
        />
      </Field>

      <div className="box grid-2 gap-30">
        <Field label="Phone" required error={errorFor("contact.phone")}>
          <TextInput
            value={contact.phone}
            onChange={(value) => setField("contact.phone", value)}
            placeholder="98765 43210"
            inputMode="tel"
          />
        </Field>

        <Field
          label="WhatsApp"
          error={errorFor("contact.whatsapp")}
          hint="Leave empty if it is the same number."
        >
          <TextInput
            value={contact.whatsapp}
            onChange={(value) => setField("contact.whatsapp", value)}
            placeholder="98765 43210"
            inputMode="tel"
          />
        </Field>
      </div>

      <Field label="Email" required error={errorFor("contact.email")}>
        <TextInput
          value={contact.email}
          onChange={(value) => setField("contact.email", value)}
          placeholder="ramesh@example.com"
          inputMode="email"
        />
      </Field>

      <p className="lx-note">
        Only buyers who have signed in and verified their phone can see these. Visitors cannot,
        and neither can search engines.
      </p>
    </>
  );
}

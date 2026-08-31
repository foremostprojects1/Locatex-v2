import ContactForm from "../components/forms/ContactForm";
import { CONTACT } from "../content/company";

/**
 * Contact.
 *
 * The details run across the top in one row rather than down a narrow column. In a column
 * every one of them wrapped onto a second line — the Morbi address over three, the phone
 * number over two — which wasted the width the page had and made short facts look long.
 *
 * The details are real, from the live v1 site: the office people already visit and the
 * number they already ring.
 */
export default function Contact() {
  return (
    <div className="lx-page">
      <header className="lx-page__head">
        <h1>Talk to us</h1>
        <p className="lx-page__lede">
          Questions about listing land, finding it, or something that has gone wrong — a
          person reads every message, usually the same working day.
        </p>
      </header>

      <div className="lx-contact-bar">
        <section>
          <h2>Office</h2>
          <address>{CONTACT.address.join(", ")}</address>
        </section>

        <section>
          <h2>Phone</h2>
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
        </section>

        <section>
          <h2>Email</h2>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </section>

        <section>
          <h2>Open</h2>
          <p>
            {CONTACT.hours.map((entry) => `${entry.day}, ${entry.time}`).join(" · ")}
          </p>
        </section>
      </div>

      <div className="lx-contact-form">
        <h2>Send a message</h2>
        <p className="lx-note">
          Tell us which listing or which district you mean, and we can answer properly first
          time.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}

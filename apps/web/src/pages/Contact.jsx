import ContactForm from "../components/forms/ContactForm";
import { CONTACT } from "../content/company";

/**
 * Contact.
 *
 * The details are the real ones from the live v1 site — the Morbi office, the number people
 * already ring. The form writes to the admin inbox first and emails second, so a message
 * lost to a spam folder is still a message somebody can answer.
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

      <div className="lx-contact">
        <div className="lx-contact__details">
          <section>
            <h2>Office</h2>
            <address className="lx-address">
              {CONTACT.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </section>

          <section>
            <h2>Phone</h2>
            <a className="lx-contact__link" href={CONTACT.phoneHref}>
              {CONTACT.phone}
            </a>
          </section>

          <section>
            <h2>Email</h2>
            <a className="lx-contact__link" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </section>

          <section>
            <h2>Opening hours</h2>
            <dl className="lx-hours">
              {CONTACT.hours.map((entry) => (
                <div key={entry.day}>
                  <dt>{entry.day}</dt>
                  <dd>{entry.time}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="lx-contact__form">
          <h2>Send a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

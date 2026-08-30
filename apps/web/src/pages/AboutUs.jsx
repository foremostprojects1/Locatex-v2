import { Link } from "react-router-dom";
import { ABOUT, CONTACT } from "../content/company";

/**
 * About LocateX.
 *
 * The seven promises are the client's own words from the live v1 site. They read as
 * marketing and they are also the limits of our liability — "we are only a connecting
 * platform", "we do not verify title" — so they are reproduced rather than rewritten.
 */
export default function AboutUs() {
  return (
    <div className="lx-page">
      <header className="lx-page__head">
        <h1>{ABOUT.title}</h1>
        <p className="lx-page__lede">{ABOUT.lede}</p>
      </header>

      <section className="lx-page__section">
        <h2>How we work</h2>
        <div className="lx-promises">
          {ABOUT.promises.map((promise) => (
            <article key={promise.title} className="lx-promise">
              <h3>{promise.title}</h3>
              <p>{promise.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lx-page__section">
        <h2>What we carry today</h2>
        <p>{ABOUT.scope}</p>
        <div className="lx-page__actions">
          <Link className="tf-btn bg-color-primary pd-10" to="/properties">
            Browse land
          </Link>
          <Link className="tf-btn style-border pd-10" to="/add-property">
            List your land
          </Link>
        </div>
      </section>

      <section className="lx-page__section">
        <h2>Where to find us</h2>
        <address className="lx-address">
          {CONTACT.address.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </address>
      </section>
    </div>
  );
}

import { TERMS, CONTACT } from "../content/company";

/**
 * Terms and conditions, including how information is handled.
 *
 * The substance is from the live v1 site. Wording that changes meaning between versions is
 * wording somebody agreed to under different terms, so it is preserved — only the section
 * on personal information gained detail, because v2 collects more than v1 did.
 */
export default function PrivacyPolicy() {
  return (
    <div className="lx-page lx-page--prose">
      <header className="lx-page__head">
        <h1>Terms &amp; conditions</h1>
        <p className="lx-page__lede">
          These govern your use of LocateX. Last updated {TERMS.updated}.
        </p>
      </header>

      {TERMS.sections.map((section) => (
        <section key={section.title} className="lx-page__section">
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <section className="lx-page__section">
        <p className="lx-note">{TERMS.closing}</p>
        <p className="lx-note">
          Questions about any of this: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </p>
      </section>
    </div>
  );
}

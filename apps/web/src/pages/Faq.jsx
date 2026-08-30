import { useState } from "react";
import { Link } from "react-router-dom";
import { CONTACT, FAQS } from "../content/company";

/**
 * Frequently asked questions.
 *
 * v1's FAQ page shipped with the template's placeholder text, so there was nothing to carry
 * across. These answer what the product genuinely does — why a visitor sees a price band,
 * why land shows as a circle, why a broker has to be approved — because those are the
 * things people actually wonder about here.
 */
export default function Faq() {
  const [open, setOpen] = useState("0-0");

  return (
    <div className="lx-page">
      <header className="lx-page__head">
        <h1>Questions people ask</h1>
        <p className="lx-page__lede">
          If yours is not here, write to <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>{" "}
          or use the <Link to="/contact">contact form</Link> — a person reads every one.
        </p>
      </header>

      {FAQS.map((group, groupIndex) => (
        <section key={group.group} className="lx-page__section">
          <h2>{group.group}</h2>

          <div className="lx-faq">
            {group.items.map((item, itemIndex) => {
              const id = `${groupIndex}-${itemIndex}`;
              const isOpen = open === id;

              return (
                <div key={item.q} className={`lx-faq__item${isOpen ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : id)}
                    >
                      <span>{item.q}</span>
                      <span aria-hidden="true" className="lx-faq__mark">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                  </h3>
                  {isOpen ? <p>{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

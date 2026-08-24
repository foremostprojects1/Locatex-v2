import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get } from "../services/locatexApi";
import PropertyCard from "../features/listings/PropertyCard";

/**
 * A broker's public page.
 *
 * Their phone number follows the same rule as a listing's: a signed-out visitor is not
 * sent it. Putting it on a profile page would make the redaction on every listing
 * pointless, since one page would hand over what the other withholds.
 */
export default function BrokerProfile() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    const controller = new AbortController();
    get(`/brokers/${id}`, { signal: controller.signal })
      .then((response) => setState({ loading: false, ...response }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ loading: false, error });
      });
    return () => controller.abort();
  }, [id]);

  if (state.loading) return <div className="container lx-detail__loading">Loading…</div>;

  if (state.error || !state.data) {
    return (
      <div className="container lx-empty">
        <h1>We could not find that broker</h1>
        <p>
          The account may have been closed. <Link to="/properties">Browse all listings</Link>.
        </p>
      </div>
    );
  }

  const broker = state.data;

  return (
    <div className="lx-broker container">
      <header className="lx-broker__head">
        <div className="lx-broker__avatar">
          {broker.avatarUrl ? (
            <img src={broker.avatarUrl} alt="" />
          ) : (
            <span aria-hidden="true">{initials(broker.agencyName ?? broker.fullName)}</span>
          )}
        </div>

        <div className="lx-broker__identity">
          <h1>{broker.agencyName ?? broker.fullName}</h1>
          <p className="lx-broker__meta">
            {broker.fullName}
            {broker.district ? ` · ${broker.district}` : ""}
            {broker.experienceYears ? ` · ${broker.experienceYears} years` : ""}
          </p>
          <p className="lx-broker__meta">
            {broker.counts.live} live · {broker.counts.sold} sold · with LocateX since{" "}
            {new Date(broker.memberSince).getFullYear()}
          </p>
          {broker.reraNumber ? (
            <p className="lx-broker__rera">RERA {broker.reraNumber}</p>
          ) : null}
        </div>

        <div className="lx-broker__contact">
          {broker.contact ? (
            <>
              <a className="tf-btn bg-color-primary pd-10" href={`tel:${broker.contact.phone}`}>
                {broker.contact.phone}
              </a>
              <a className="tf-btn style-border pd-10" href={`mailto:${broker.contact.email}`}>
                Email
              </a>
              {broker.officeAddress ? (
                <p className="lx-note">{broker.officeAddress}</p>
              ) : null}
            </>
          ) : (
            <>
              <a
                href="#modalRegister"
                data-bs-toggle="modal"
                className="tf-btn bg-color-primary pd-10"
              >
                Register to contact
              </a>
              <p className="lx-note">
                Contact details are shown to registered buyers.
              </p>
            </>
          )}
        </div>
      </header>

      {broker.about ? <p className="lx-broker__about">{broker.about}</p> : null}

      <h2 className="lx-broker__listings-title">
        {state.total} {state.total === 1 ? "listing" : "listings"}
      </h2>

      {state.listings.length === 0 ? (
        <p className="lx-note">This broker has nothing listed at the moment.</p>
      ) : (
        <div className="lx-grid">
          {state.listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

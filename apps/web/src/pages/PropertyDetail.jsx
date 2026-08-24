import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AREA_UNIT_LABEL, convertArea, formatIndianShort } from "@locatex/contracts";
import { useListing } from "../features/listings/useListings";
import ListingsMap from "../features/listings/ListingsMap";
import EnquiryForm from "../features/listings/EnquiryForm";
import { useSession } from "../hooks/useSession";
import { post } from "../services/locatexApi";

/**
 * One listing, in full.
 *
 * Every "sign in to see this" here is the truth rather than a paywall over data the page
 * already holds: a signed-out visitor's response genuinely does not contain the price, the
 * phone number, the survey number or the real coordinates. There is nothing in the DOM to
 * find with a developer console.
 */
export default function PropertyDetail() {
  const { id } = useParams();
  const { listing, loading, error } = useListing(id);
  const { isSignedIn } = useSession();
  const [activePhoto, setActivePhoto] = useState(0);
  const [opening, setOpening] = useState(false);
  const navigate = useNavigate();

  if (loading) return <div className="container lx-detail__loading">Loading…</div>;

  if (error || !listing) {
    return (
      <div className="container lx-empty">
        <h1>We could not find that listing</h1>
        <p>
          It may have been sold, withdrawn, or is still waiting to be approved.{" "}
          <Link to="/properties">Browse everything that is live</Link>.
        </p>
      </div>
    );
  }

  const place = [listing.location.village, listing.location.taluka, listing.location.district]
    .filter(Boolean)
    .map(titleCase)
    .join(", ");

  const photos = listing.images ?? [];

  return (
    <article className="lx-detail container">
      <header className="lx-detail__head">
        <div>
          <h1>{listing.title}</h1>
          <p className="lx-detail__place">
            {place} · {listing.location.pincode}
          </p>
        </div>

        <div className="lx-detail__price">
          {listing.pricePaise != null ? (
            <>
              <strong>{formatIndianShort(listing.pricePaise)}</strong>
              <span>{priceUnitLabel(listing.priceUnit)}</span>
            </>
          ) : (
            <>
              <strong>{listing.priceBand.label}</strong>
              <span>Sign in to see the exact price</span>
            </>
          )}
        </div>
      </header>

      {photos.length > 0 ? (
        <section className="lx-detail__gallery">
          <img
            src={photos[activePhoto]?.url}
            alt={photos[activePhoto]?.alt || listing.title}
            className="lx-detail__photo"
          />
          {photos.length > 1 ? (
            <div className="lx-detail__thumbs">
              {photos.map((photo, index) => (
                <button
                  key={photo.url}
                  type="button"
                  className={index === activePhoto ? "is-active" : ""}
                  onClick={() => setActivePhoto(index)}
                >
                  <img src={photo.url} alt={photo.alt || ""} loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="lx-detail__body">
        <div className="lx-detail__main">
          <section className="lx-panel">
            <h2>The land</h2>
            <dl className="lx-facts">
              <Fact label="Area">
                {formatNumber(listing.area.value)}{" "}
                {AREA_UNIT_LABEL[listing.area.unit] ?? listing.area.unit}
                <small>
                  {" "}
                  ({otherUnits(listing.area).join(" · ")})
                </small>
              </Fact>
              <Fact label="Type">{titleCase(listing.propertyType)}</Fact>
              <Fact label="Listed for">{listing.listingType === "rent" ? "Rent" : "Sale"}</Fact>
              <Fact label="Status">{titleCase(listing.status)}</Fact>
            </dl>

            {listing.description ? <p className="lx-detail__text">{listing.description}</p> : null}
          </section>

          {listing.amenities?.length || listing.disadvantages?.length ? (
            <section className="lx-panel">
              <h2>Features</h2>
              {listing.amenities?.length ? (
                <>
                  <h3 className="lx-panel__sub">What it has</h3>
                  <ul className="lx-taglist">
                    {listing.amenities.map((slug) => (
                      <li key={slug}>{titleCase(slug)}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {listing.disadvantages?.length ? (
                <>
                  <h3 className="lx-panel__sub">Worth knowing</h3>
                  {/*
                    Shown as plainly as the advantages. A broker who declares these is
                    saving a buyer a wasted site visit, and hiding them would punish the
                    honest listings.
                  */}
                  <ul className="lx-taglist is-caution">
                    {listing.disadvantages.map((slug) => (
                      <li key={slug}>{titleCase(slug)}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          ) : null}

          <section className="lx-panel">
            <h2>Where it is</h2>
            <p className="lx-note">
              {listing.location.precision === "exact"
                ? "The broker marked the exact plot."
                : "Shown as a circle. The exact plot is confirmed with the broker."}
            </p>
            <ListingsMap listings={[listing]} height={360} />
            {listing.location.address ? (
              <p className="lx-detail__text">{listing.location.address}</p>
            ) : null}
          </section>

          {listing.govDetails &&
          (listing.govDetails.khaataNumber ||
            listing.govDetails.surveyNumber ||
            listing.govDetails.areaText) ? (
            <section className="lx-panel">
              <h2>Government record</h2>
              <dl className="lx-facts">
                {listing.govDetails.khaataNumber ? (
                  <Fact label="Khaata number">{listing.govDetails.khaataNumber}</Fact>
                ) : null}
                {listing.govDetails.surveyNumber ? (
                  <Fact label="Survey number">{listing.govDetails.surveyNumber}</Fact>
                ) : null}
                {listing.govDetails.areaText ? (
                  <Fact label="Area as recorded">{listing.govDetails.areaText}</Fact>
                ) : null}
              </dl>
              <p className="lx-note">
                As written on the 7/12 extract. Always verify against the original before
                any payment.
              </p>
            </section>
          ) : null}
        </div>

        <aside className="lx-detail__aside">
          <div className="lx-panel is-sticky">
            {listing.contact ? (
              <>
                <h2>Contact the seller</h2>
                <p className="lx-detail__contact-name">{listing.contact.name}</p>
                <a className="tf-btn bg-color-primary pd-10 w-100" href={`tel:${listing.contact.phone}`}>
                  {listing.contact.phone}
                </a>
                {listing.contact.whatsapp ? (
                  <a
                    className="tf-btn style-border pd-10 w-100"
                    href={`https://wa.me/91${listing.contact.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <a className="tf-btn style-border pd-10 w-100" href={`mailto:${listing.contact.email}`}>
                  Email
                </a>
              </>
            ) : (
              <>
                <h2>Who is selling this?</h2>
                <p className="lx-note">
                  Registered buyers see the seller’s name, phone number and the exact asking
                  price. Registering is free and takes a minute.
                </p>
                <a
                  href="#modalRegister"
                  data-bs-toggle="modal"
                  className="tf-btn bg-color-primary pd-10 w-100"
                >
                  Register to see contact details
                </a>
                <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn style-border pd-10 w-100">
                  I already have an account
                </a>
              </>
            )}

            {isSignedIn && listing.viewsCount != null ? (
              <p className="lx-note">Seen {listing.viewsCount} times</p>
            ) : null}
          </div>

          {/* Only offered to someone who could actually be replied to. */}
          {isSignedIn && listing.contact ? (
            <div className="lx-panel">
              <button
                type="button"
                className="tf-btn bg-color-primary pd-10 w-100"
                disabled={opening}
                onClick={async () => {
                  setOpening(true);
                  try {
                    const response = await post("/chat/threads", { propertyId: listing.id });
                    navigate(`/message?thread=${response.data.id}`);
                  } finally {
                    setOpening(false);
                  }
                }}
              >
                {opening ? "Opening…" : "Message the broker"}
              </button>
              <p className="lx-note">
                Or send a one-off enquiry and they will get back to you by phone or email.
              </p>
              <EnquiryForm propertyId={listing.id} />
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function Fact({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

const priceUnitLabel = (unit) =>
  ({ total: "Total", per_vigha: "Per vigha", per_acre: "Per acre", per_sqft: "Per sq. ft." })[unit] ??
  "";

/** The same area in the other units people quote, so nobody has to do the sum. */
const otherUnits = (area) =>
  ["vigha", "acre", "guntha"]
    .filter((unit) => unit !== area.unit)
    .map((unit) => `${formatNumber(convertArea(area.value, area.unit, unit))} ${unit}`);

const titleCase = (value = "") =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

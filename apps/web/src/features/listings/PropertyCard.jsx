import { Link } from "react-router-dom";
import { AREA_UNIT_LABEL, formatIndianShort } from "@locatex/contracts";

/**
 * One listing in a grid.
 *
 * The price line is the interesting part. A guest is sent a band and no exact figure at
 * all, so there is nothing here to accidentally reveal — the card renders whichever of the
 * two the API decided this viewer may have, and a signed-out visitor simply never receives
 * the other one.
 */
export default function PropertyCard({ listing, view = "grid" }) {
  const photo = listing.images?.find((image) => image.isPrimary) ?? listing.images?.[0];
  const place = [listing.location.village, listing.location.taluka, listing.location.district]
    .filter(Boolean)
    .map(titleCase)
    .join(", ");

  return (
    <div className={`lx-card${view === "list" ? " is-list" : ""}`}>
      <Link to={`/properties/${listing.id}`} className="lx-card__image">
        {photo ? (
          <img src={photo.url} alt={photo.alt || listing.title} loading="lazy" />
        ) : (
          <div className="lx-card__placeholder" aria-hidden="true">
            <span>No photograph yet</span>
          </div>
        )}

        <span className={`lx-card__badge is-${listing.status}`}>
          {listing.status === "approved" ? statusWord(listing) : listing.status}
        </span>
        {listing.isFeatured ? <span className="lx-card__badge is-featured">Featured</span> : null}
      </Link>

      <div className="lx-card__body">
        <h3 className="lx-card__title">
          <Link to={`/properties/${listing.id}`}>{listing.title}</Link>
        </h3>
        <p className="lx-card__place">{place}</p>

        <p className="lx-card__price">
          {listing.pricePaise != null ? (
            formatIndianShort(listing.pricePaise)
          ) : (
            <>
              {listing.priceBand.label}
              <small className="lx-card__price-note">Sign in for the exact price</small>
            </>
          )}
        </p>

        <ul className="lx-card__facts">
          <li>
            {formatNumber(listing.area.value)} {AREA_UNIT_LABEL[listing.area.unit] ?? listing.area.unit}
          </li>
          <li>{titleCase(listing.propertyType)}</li>
          {listing.amenities?.length ? <li>{listing.amenities.length} features</li> : null}
        </ul>
      </div>
    </div>
  );
}

const statusWord = (listing) => (listing.listingType === "rent" ? "For rent" : "For sale");

const titleCase = (value = "") =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

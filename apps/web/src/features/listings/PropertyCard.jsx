import { Link } from "react-router-dom";
import { AREA_UNIT_LABEL, formatIndianShort } from "@locatex/contracts";
import { useFavourites } from "./useFavourites";
import { LISTING_PLACEHOLDER, LISTING_PLACEHOLDER_NOTE } from "../../content/media";

/**
 * One listing in a grid.
 *
 * The price line is the interesting part. A guest is sent a band and no exact figure at
 * all, so there is nothing here to accidentally reveal — the card renders whichever of the
 * two the API decided this viewer may have, and a signed-out visitor simply never receives
 * the other one.
 */
export default function PropertyCard({ listing, view = "grid" }) {
  const { isSaved, toggle, canSave } = useFavourites();
  const photo = listing.images?.find((image) => image.isPrimary) ?? listing.images?.[0];
  // Deduplicated: in Gujarat a taluka usually shares its district's name, and
  // "Rajkot, Rajkot" reads as a stutter rather than as a place.
  const place = [...new Set(
    [listing.location.village, listing.location.taluka, listing.location.district]
      .filter(Boolean)
      .map(titleCase),
  )].join(", ");

  return (
    <div className={`lx-card${view === "list" ? " is-list" : ""}`}>
      <Link to={`/properties/${listing.id}`} className="lx-card__image">
        <img
          src={photo?.url ?? LISTING_PLACEHOLDER}
          alt={photo?.alt || listing.title}
          loading="lazy"
        />
        {/* Said plainly, so the stand-in is never taken for the actual land. */}
        {photo ? null : (
          <span className="lx-card__nophoto">{LISTING_PLACEHOLDER_NOTE}</span>
        )}

        <span className={`lx-card__badge is-${listing.status}`}>
          {listing.status === "approved" ? statusWord(listing) : listing.status}
        </span>
        {listing.isFeatured ? <span className="lx-card__badge is-featured">Featured</span> : null}
      </Link>

      {/*
        Outside the Link, not inside it: a button nested in an anchor is invalid markup and
        a screen reader announces the whole card as one confusing control.
      */}
      {canSave ? (
        <button
          type="button"
          className={`lx-card__save${isSaved(listing.id) ? " is-saved" : ""}`}
          aria-label={isSaved(listing.id) ? "Remove from saved" : "Save this listing"}
          aria-pressed={isSaved(listing.id)}
          onClick={() => toggle(listing.id)}
        >
          <HeartIcon filled={isSaved(listing.id)} />
        </button>
      ) : (
        <a
          href="#modalLogin"
          data-bs-toggle="modal"
          className="lx-card__save"
          aria-label="Sign in to save this listing"
          title="Sign in to save"
        >
          <HeartIcon filled={false} />
        </a>
      )}

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

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
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

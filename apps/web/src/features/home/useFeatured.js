import { useEffect, useState } from "react";
import { AREA_UNIT_LABEL, formatPriceBand } from "@locatex/contracts";
import { get } from "../../services/locatexApi";

/**
 * Shown when a listing has no photograph of its own.
 *
 * A broken image icon on the home page reads as a broken site. A plain aerial of Gujarat
 * farmland is honest — it is clearly generic, so nobody mistakes it for the actual plot —
 * and the card still works as a card.
 *
 * The path is worth checking against `public/images/locatex/photos/` if it is ever
 * changed. A wrong one does not 404 visibly: the SPA fallback answers any unknown path
 * with `index.html`, so the browser receives HTML where it expected a JPEG and draws
 * nothing at all — which is exactly how this was broken.
 */
const PLACEHOLDER = "/images/locatex/photos/parcels-aerial.jpg";

/**
 * Turns a listing from the API into the shape the template's card expects.
 *
 * The card was built for the demo data that shipped with the theme, and rewriting it would
 * mean re-styling every page that uses it. Mapping here is the smaller change, and it keeps
 * one rule in one place: **the home page is a public page**, so it renders the price *band*
 * the API returns and never a price — which is what the API sends a guest anyway.
 */
export function toCard(listing) {
  const primary = listing.images?.find((image) => image.isPrimary) ?? listing.images?.[0];
  /*
   * "Rajkot, Rajkot" is what you get when a taluka shares its district's name, which in
   * Gujarat is most of them. Duplicates are dropped so the line reads as a place rather
   * than as a stutter.
   */
  const place = [...new Set(
    [listing.location.village, listing.location.taluka, listing.location.district]
      .filter(Boolean)
      .map(titleCase),
  )].join(", ");

  return {
    id: listing.id,
    href: `/properties/${listing.id}`,
    image: primary?.url ?? PLACEHOLDER,
    imageAlt: primary?.alt || listing.title,
    tags: [
      ...(listing.isFeatured ? [{ className: "flag-tag primary", label: "Featured" }] : []),
      {
        className: "flag-tag style-1",
        label: listing.listingType === "rent" ? "For Rent" : "For Sale",
      },
    ],
    location: place || "Gujarat",
    locationInImage: true,
    title: listing.title,
    // Where an agent's name and photograph would sit. We have neither publicly — contact
    // details are withheld from anonymous visitors by design — so the card says what kind
    // of land it is instead, which is worth more to somebody scanning a grid.
    kind: listing.propertyType === "plot" ? "NA plot" : "Agricultural land",
    meta: [
      {
        icon: "icon-sqft",
        label: "Area:",
        value: `${listing.area.value} ${AREA_UNIT_LABEL[listing.area.unit] ?? listing.area.unit}`,
      },
      { icon: "icon-mapPin", label: "Pincode:", value: listing.location.pincode },
    ],
    // A guest is shown the band, never the figure. `pricePaise` is simply absent from a
    // public response, so there is nothing here that could leak it by accident.
    price: listing.priceBand ? formatPriceBand(listing.priceBand) : "Price on request",
  };
}

const titleCase = (value) =>
  String(value)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/**
 * The listings on the home page.
 *
 * Featured first, then whatever is newest — so the page is never empty on the day the site
 * goes live and nobody has been featured yet.
 */
export function useFeatured(limit = 6) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    get(`/properties?sort=newest&limit=${limit}`, { signal: controller.signal })
      .then((response) => {
        const rows = response.data ?? [];
        const featuredFirst = [...rows].sort(
          (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
        );
        setListings(featuredFirst.map(toCard));
      })
      .catch((cause) => {
        // A home page that fails to load listings still has to render. The section falls
        // back to its empty state rather than taking the whole page down.
        if (cause.name !== "AbortError") setListings([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [limit]);

  return { listings, loading };
}


/**
 * How many live listings each district and land type actually has.
 *
 * The home page used to print fixed numbers — "186 listings" under Morbi when there were
 * none. A count a visitor disproves by clicking is worse than no count, so a district with
 * nothing now says so instead.
 */
export function useCounts() {
  const [counts, setCounts] = useState({ total: 0, districts: {}, propertyTypes: {} });

  useEffect(() => {
    const controller = new AbortController();

    get("/properties/counts", { signal: controller.signal })
      .then(setCounts)
      .catch((cause) => {
        // The page still renders; the counts simply do not appear.
        if (cause.name !== "AbortError") setCounts({ total: 0, districts: {}, propertyTypes: {} });
      });

    return () => controller.abort();
  }, []);

  return counts;
}

/** "3 listings", "1 listing", or an honest "None yet". */
export function countLabel(count) {
  if (!count) return "None yet";
  return `${count} listing${count === 1 ? "" : "s"}`;
}

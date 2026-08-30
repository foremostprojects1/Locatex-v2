import { useEffect, useState } from "react";
import { AREA_UNIT_LABEL, formatPriceBand } from "@locatex/contracts";
import { get } from "../../services/locatexApi";

const PLACEHOLDER = "/images/locatex/stock/parcels-aerial.jpg";

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
  const place = [listing.location.village, listing.location.taluka, listing.location.district]
    .filter(Boolean)
    .map(titleCase)
    .join(", ");

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

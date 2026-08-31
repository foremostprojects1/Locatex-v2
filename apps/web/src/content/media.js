/**
 * The photograph shown when a listing has none of its own.
 *
 * One constant, used by the home cards, the browse cards and the listing page, so a
 * listing without pictures looks the same wherever it appears rather than being a broken
 * image in one place, a grey box in another and a missing section in a third.
 *
 * It is deliberately a wide aerial of farmland — clearly generic, so nobody mistakes it
 * for the plot they are looking at, while still letting the card read as a card.
 *
 * If this path is ever changed, check it against `public/images/locatex/photos/`. A wrong
 * one does not fail visibly: the SPA fallback answers any unknown path with `index.html`
 * and a 200, so the browser receives HTML where it expected a JPEG and draws nothing.
 */
export const LISTING_PLACEHOLDER = "/images/locatex/photos/parcels-aerial.jpg";

/** Said alongside it, so the image is never mistaken for the actual land. */
export const LISTING_PLACEHOLDER_NOTE = "No photographs of this land yet";

import { CONTACT } from "../content/company";

/**
 * The menu.
 *
 * Every entry points at a page that exists and is backed by the API. The template's demo
 * variants have been removed rather than left in the navigation as reference — a menu that
 * leads somewhere with invented data is worse than one item shorter.
 *
 * Scope for this release is rental listings of land and plots in Gujarat, so the filters
 * offered here are the ones that actually narrow that: what kind of parcel, and where.
 */
export function mainMenuFor(user) {
  const isBroker = user?.role === "broker" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return [
  {
    label: "Find land",
    className: "home",
    children: [
      { label: "All listings", to: "/properties" },
      { label: "On the map", to: "/properties?view=map" },
      { label: "Agricultural land", to: "/properties?propertyType=land" },
      { label: "NA plots", to: "/properties?propertyType=plot" },
    ],
  },
  {
    label: "List your land",
    children: [
      { label: "Post a listing — free", to: "/add-property" },
      { label: "My listings", to: "/my-property" },
      // Only somebody who is not one yet. Offering it to a broker reads as though their
      // approval did not take.
      !isBroker && { label: "Become a broker", to: "/my-property" },
    ].filter(Boolean),
  },
  {
    label: "Company",
    children: [
      { label: "About us", to: "/about-us" },
      { label: "Contact", to: "/contact" },
      { label: "FAQs", to: "/faq" },
      { label: "Terms & conditions", to: "/privacy-policy" },
    ],
  },
  // Nothing under "My account" means anything to a visitor, and every item behind it
  // would bounce them to the sign-in dialog.
  user && {
    label: "My account",
    children: [
      { label: "My dashboard", to: "/dashboard" },
      isAdmin && { label: "Admin dashboard", to: "/admin" },
      isBroker && { label: "My listings", to: "/my-property" },
      { label: "Favourites", to: "/my-favorites" },
      { label: "My enquiries", to: "/my-enquiries" },
      { label: "Messages", to: "/message" },
      { label: "My profile", to: "/my-profile" },
    ].filter(Boolean),
  },
  ].filter(Boolean);
}

/** The signed-out menu, for anything rendering before the session resolves. */
export const MAIN_MENU = mainMenuFor(null);

/** The dropdown under the avatar. Short on purpose — the dashboard carries the rest. */
export const ACCOUNT_MENU = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "My listings", to: "/my-property" },
  { label: "Favourites", to: "/my-favorites" },
  { label: "Messages", to: "/message" },
  { label: "My profile", to: "/my-profile" },
];

/**
 * The address in the footer and the mobile drawer.
 *
 * Derived from `content/company.js` rather than typed again — the contact details appear in
 * five places, and the one thing worse than an out-of-date address is two different
 * out-of-date addresses.
 */
export const CONTACT_INFO = {
  address: CONTACT.address.join(", "),
  phone: CONTACT.phone,
  email: CONTACT.email,
};
